import { LEAGUES, teamInfo } from "./data";
import {
  buildOffers,
  clamp,
  computeOvr,
  createPlayer,
  isPitcher,
  r1,
  roleFor,
  shouldRetire,
  simulateSeason,
  statSummary,
  tournamentFor,
  visibleKeys,
  type SeasonResult,
} from "./engine";
import { drawEvent, rollOutcome } from "./events";
import type {
  AttrKey,
  Attrs,
  Choice,
  Effect,
  GameEvent,
  Offer,
  PlayerState,
  Position,
  SeasonRecord,
} from "./types";

export type FeedItem = {
  id: number;
  year: number;
  text: string;
  tone: "good" | "bad" | "neutral";
  tag: string;
};

export type Delta = { key: string; label: string; value: number };

export type GameState = {
  screen: "setup" | "play" | "retired";
  player: PlayerState;
  event: GameEvent | null;
  usedEvents: string[];
  offers: Offer[] | null;
  result: SeasonResult | null;
  headline: string;
  feed: FeedItem[];
  deltas: Delta[];
  retireReason: string;
  feedSeq: number;
};

export type Action =
  | { type: "START"; name: string; position: Position }
  | { type: "ADVANCE" }
  | { type: "CHOOSE"; choice: Choice }
  | { type: "CLOSE_RESULT" }
  | { type: "ACCEPT"; offer: Offer }
  | { type: "RESET" }
  | { type: "LOAD"; state: GameState };

export const PHASE_NAMES = ["스프링캠프", "전반기", "후반기", "시즌 결산", "오프시즌"];

const emptyPlayer = () => createPlayer("김 커리어", "내야수");

export const initialState = (): GameState => ({
  screen: "setup",
  player: emptyPlayer(),
  event: null,
  usedEvents: [],
  offers: null,
  result: null,
  headline: "",
  feed: [],
  deltas: [],
  retireReason: "",
  feedSeq: 0,
});

/* ─────────────────── 효과 적용 ─────────────────── */

function applyEffect(p: PlayerState, e: Effect): { player: PlayerState; deltas: Delta[] } {
  const attrs: Attrs = { ...p.attrs };
  const deltas: Delta[] = [];
  const allowed = visibleKeys(p.position);

  // 잠재력 위로는 훈련으로도 조금(+3)밖에 못 올라갑니다
  const cap = clamp(p.potential + 3, 45, 99);
  const bump = (k: AttrKey, v: number) => {
    if (!v) return;
    const before = attrs[k];
    attrs[k] = v > 0 ? clamp(before + v, 25, Math.max(before, cap)) : clamp(before + v, 25, 99);
    const diff = attrs[k] - before;
    if (diff) deltas.push({ key: k, label: k, value: diff });
  };

  if (e.attrs) {
    for (const [k, v] of Object.entries(e.attrs) as [AttrKey, number][]) {
      if (allowed.includes(k)) bump(k, v);
    }
  }
  if (e.focus) {
    const core = allowed.filter((k) => k !== "mental" && k !== "durability");
    const sorted = [...core].sort((a, b) => attrs[b] - attrs[a]);
    const targets = e.focus === "strength" ? sorted.slice(0, 2) : sorted.slice(-2);
    targets.forEach((k) => bump(k, e.focus === "strength" ? 3 : 4));
  }

  const player: PlayerState = {
    ...p,
    attrs,
    health: clamp(p.health + (e.health ?? 0), 15, 100),
    fame: clamp(p.fame + (e.fame ?? 0), 0, 100),
    morale: clamp(p.morale + (e.morale ?? 0), 5, 100),
    teamTrust: clamp(p.teamTrust + (e.teamTrust ?? 0), 0, 100),
    earnings: Math.max(0, r1(p.earnings + (e.money ?? 0))),
    injury: e.injury ? { ...e.injury } : p.injury,
    traits: e.trait && !p.traits.includes(e.trait) ? [...p.traits, e.trait] : p.traits,
    intl: e.intl
      ? [
          ...p.intl,
          {
            year: p.year,
            tournament: tournamentFor(p.year) ?? `${p.year} 국제대회`,
            result: e.intl.result,
            medal: e.intl.medal,
            note: e.intl.note,
          },
        ]
      : p.intl,
  };
  player.ovr = computeOvr(player.attrs, player.position);
  player.peakOvr = Math.max(player.peakOvr, player.ovr);

  if (e.health) deltas.push({ key: "health", label: "체력", value: e.health });
  if (e.fame) deltas.push({ key: "fame", label: "명성", value: e.fame });
  if (e.morale) deltas.push({ key: "morale", label: "멘탈", value: e.morale });
  if (e.teamTrust) deltas.push({ key: "trust", label: "구단 신뢰", value: e.teamTrust });
  if (e.money) deltas.push({ key: "money", label: "수입(억)", value: e.money });
  return { player, deltas };
}

const feed = (s: GameState, tag: string, text: string, tone: FeedItem["tone"] = "neutral"): GameState => ({
  ...s,
  feedSeq: s.feedSeq + 1,
  feed: [{ id: s.feedSeq + 1, year: s.player.year, text, tone, tag }, ...s.feed].slice(0, 60),
});

/* ─────────────────── 시즌 마감 ─────────────────── */

function finishSeason(s: GameState): GameState {
  const p = s.player;
  const result = simulateSeason(p);
  const lg = LEAGUES[p.contract.league];

  const attrs = { ...p.attrs };
  for (const [k, v] of Object.entries(result.grew) as [AttrKey, number][]) {
    attrs[k] = clamp(attrs[k] + v, 25, 99);
  }

  const record: SeasonRecord = {
    year: p.year,
    age: p.age,
    team: p.contract.team,
    league: p.contract.league,
    ovr: p.ovr,
    role: result.role,
    stat: result.stat,
    awards: result.awards,
    teamResult: result.teamResult,
  };

  const player: PlayerState = {
    ...p,
    attrs,
    ovr: computeOvr(attrs, p.position),
    seasons: [...p.seasons, record],
    awards: [...p.awards, ...result.awards],
    rings: p.rings + (result.champion ? 1 : 0),
    earnings: r1(p.earnings + p.contract.salary),
    health: clamp(p.health + (result.injury ? -18 : 6) - Math.max(0, p.age - 30), 15, 100),
    fame: clamp(
      p.fame + Math.round(result.stat.war * 3 + result.awards.length * 6 + (lg.tier - 3) * 2),
      0,
      100,
    ),
    morale: clamp(p.morale + Math.round(result.stat.war * 2 - (result.injury ? 12 : 0) + (result.champion ? 18 : 0)), 5, 100),
    teamTrust: clamp(p.teamTrust + Math.round(result.stat.war * 2.5 - 2), 0, 100),
    injury: result.injury ?? (p.injury && p.injury.severity > 0.4 ? { ...p.injury, severity: p.injury.severity - 0.4 } : null),
    serviceKBO: p.serviceKBO + (p.contract.league === "KBO" ? 1 : 0),
    serviceMLB: p.serviceMLB + (p.contract.league === "MLB" ? 1 : 0),
    phase: 4,
  };
  player.peakOvr = Math.max(player.peakOvr, player.ovr);
  if (player.injury && player.injury.severity <= 0) player.injury = null;

  let next: GameState = { ...s, player, result, event: null, headline: result.narrative };
  next = feed(next, `${p.year} 시즌`, `${p.contract.team} · ${statSummary(result.stat)}`,
    result.stat.war >= 3 ? "good" : result.stat.war < 0.5 ? "bad" : "neutral");
  result.awards.forEach((a) => { next = feed(next, "수상", a, "good"); });
  if (result.injury) next = feed(next, "부상", `${result.injury.name} (${result.injury.severity >= 1 ? "장기 이탈" : "단기 이탈"})`, "bad");
  return next;
}

/* ─────────────────── 오프시즌 마감 ─────────────────── */

function endOffseason(s: GameState): GameState {
  const p = s.player;
  const reason = shouldRetire(p, p.seasons.length ? p.seasons[p.seasons.length - 1].stat.war : 0);
  if (reason) {
    return { ...s, screen: "retired", retireReason: reason, event: null, offers: null };
  }

  const left = p.contract.left - 1;
  const player: PlayerState = {
    ...p,
    year: p.year + 1,
    age: p.age + 1,
    contract: { ...p.contract, left },
    phase: 0,
    fatigueUsed: 0,
  };

  const forcedMove =
    left <= 0 ||
    p.ovr < LEAGUES[p.contract.league].level - 8 ||
    p.teamTrust < 18;

  if (forcedMove) {
    const offers = buildOffers(player);
    return {
      ...s,
      player,
      offers,
      event: null,
      usedEvents: [],
      result: null,
      headline: left <= 0 ? "계약이 만료됐습니다. 다음 유니폼을 결정하세요." : "구단이 당신의 거취를 재검토하고 있습니다.",
    };
  }
  return {
    ...s,
    player,
    offers: null,
    event: null,
    usedEvents: [],
    result: null,
    headline: `${player.year} 시즌이 시작됩니다. 계약 ${left}년 남았습니다.`,
  };
}

/* ─────────────────── 리듀서 ─────────────────── */

export function reducer(s: GameState, action: Action): GameState {
  switch (action.type) {
    case "START": {
      const player = createPlayer(action.name.trim() || "김 커리어", action.position);
      const info = teamInfo(player.contract.team);
      const base: GameState = {
        ...initialState(),
        screen: "play",
        player,
        headline: `${player.contract.team} · ${LEAGUES[player.contract.league].label}에서 커리어를 시작합니다.`,
      };
      return feed(base, "입단", `${player.contract.team} 입단 (${player.contract.label})`, "good");
    }

    case "ADVANCE": {
      if (s.event || s.offers || s.result) return s;
      const p = s.player;

      if (p.phase <= 2) {
        const ev = drawEvent(p, p.phase, s.usedEvents);
        if (ev) return { ...s, event: ev };
        return { ...s, player: { ...p, phase: (p.phase + 1) as PlayerState["phase"] } };
      }
      if (p.phase === 3) return finishSeason(s);
      // phase 4 · 오프시즌
      const ev = drawEvent(p, 4, s.usedEvents);
      if (ev) return { ...s, event: ev };
      return endOffseason(s);
    }

    case "CHOOSE": {
      if (!s.event) return s;
      const effect = rollOutcome(action.choice);
      const { player, deltas } = applyEffect(s.player, effect);
      const wasOffseason = s.player.phase === 4;
      const advanced: PlayerState = wasOffseason
        ? player
        : { ...player, phase: Math.min(3, player.phase + 1) as PlayerState["phase"] };

      let next: GameState = {
        ...s,
        player: advanced,
        event: null,
        usedEvents: [...s.usedEvents, s.event.id],
        headline: effect.text,
        deltas,
      };
      next = feed(next, s.event.tag, effect.text, effect.tone ?? "neutral");
      if (effect.trait) next = feed(next, "특성 획득", `‘${effect.trait}’ 특성을 얻었습니다.`, "good");
      if (effect.intl) {
        const name = tournamentFor(s.player.year) ?? `${s.player.year} 국제대회`;
        next = feed(
          next,
          "국가대표",
          `${name} ${effect.intl.result}${effect.intl.medal ? ` (${effect.intl.medal}메달)` : ""}`,
          effect.intl.medal ? "good" : "neutral",
        );
      }
      return wasOffseason ? { ...endOffseason(next), deltas } : next;
    }

    case "CLOSE_RESULT":
      return { ...s, result: null };

    case "ACCEPT": {
      const o = action.offer;
      const p = s.player;
      const player: PlayerState = {
        ...p,
        contract: {
          team: o.team,
          league: o.league,
          salary: o.salary,
          years: o.years,
          left: o.years,
          label: o.label,
        },
        teamTrust: o.kind === "잔류" ? Math.max(p.teamTrust, 55) : 45,
        morale: clamp(
          p.morale +
            (o.kind === "강등" ? -14 : o.kind === "해외진출" ? 14 : o.kind === "복귀" ? 8 : 4),
          5,
          100,
        ),
      };
      let next: GameState = {
        ...s,
        player,
        offers: null,
        headline: `${o.team} · ${o.label} 체결. ${o.years}년 계약이 시작됩니다.`,
      };
      next = feed(next, "계약", `${o.team} ${o.years}년 계약 (${o.label})`, o.kind === "강등" ? "bad" : "good");
      return next;
    }

    case "RESET":
      return initialState();

    case "LOAD":
      return action.state;
  }
}

/* ─────────────────── 저장 / 불러오기 ─────────────────── */

const KEY = "kbo-career-save-v2";

export function saveGame(s: GameState) {
  if (s.screen === "setup") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...s, event: null, result: null }));
  } catch {
    /* 저장 실패는 무시 */
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed?.player?.attrs) return null;
    return { ...parsed, event: null, result: null, deltas: [] };
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/* ─────────────────── 파생 값 ─────────────────── */

export function nextGoal(p: PlayerState) {
  const lg = LEAGUES[p.contract.league];
  const edge = p.ovr - lg.level;
  if (lg.tier <= 2) return `${lg.short} 지배 후 1군 콜업 (OVR ${lg.level + 5} 필요)`;
  if (edge < -4) return "로스터 생존 — 백업에서 벗어나기";
  if (edge < 3) return "주전 굳히기 · 풀타임 소화";
  if (lg.id === "KBO") return "포스팅 자격 확보 (OVR 78 · WAR 3.5+)";
  if (lg.id === "NPB") return "MLB 진출 (OVR 78 · WAR 4+)";
  return "MVP · 우승 반지";
}

export const roleOf = (p: PlayerState) => roleFor(p);

export const positionNumber = (p: Position) =>
  isPitcher(p) ? "18" : p === "포수" ? "22" : p === "내야수" ? "7" : "51";
