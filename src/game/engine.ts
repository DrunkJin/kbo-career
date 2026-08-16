import { ALL_TEAMS, KBO_TEAMS, LEAGUES, MLB_TEAMS, NPB_TEAMS, teamInfo, type TeamInfo } from "./data";
import type {
  AttrKey,
  Attrs,
  BatterLine,
  Contract,
  LeagueId,
  Offer,
  PitcherLine,
  PlayerState,
  Position,
  Role,
  SeasonRecord,
  StatLine,
} from "./types";

/* ─────────────────────────── 유틸 ─────────────────────────── */

export const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
export const rand = (n = 1) => Math.random() * n;
export const irand = (n: number) => Math.floor(Math.random() * n);
export const pick = <T,>(xs: readonly T[]): T => xs[irand(xs.length)];
/** 평균 0, 표준편차 1 근사 정규분포 */
export const gauss = () =>
  (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.05;
export const r1 = (v: number) => Math.round(v * 10) / 10;

/* ─────────────────────── 능력치 / OVR ─────────────────────── */

export const BATTER_KEYS: AttrKey[] = ["contact", "power", "eye", "speed", "defense"];
export const PITCHER_KEYS: AttrKey[] = ["velocity", "control", "movement", "stamina"];
export const SHARED_KEYS: AttrKey[] = ["mental", "durability"];

export const ATTR_LABEL: Record<AttrKey, string> = {
  contact: "컨택",
  power: "파워",
  eye: "선구안",
  speed: "주루",
  defense: "수비",
  velocity: "구속",
  control: "제구",
  movement: "구위",
  stamina: "체력",
  mental: "멘탈",
  durability: "내구성",
};

/** 각 능력치가 실제로 무엇을 바꾸는지 */
export const ATTR_DESC: Record<AttrKey, string> = {
  contact: "공에 배트를 맞히는 능력. 타율이 오릅니다.",
  power: "타구의 힘. 홈런과 장타율이 오릅니다.",
  eye: "볼과 스트라이크를 골라내는 눈. 볼넷이 늘어 출루율이 오릅니다.",
  speed: "발. 도루가 늘고 내야안타가 붙습니다.",
  defense: "수비력. WAR에 직접 반영되며 포수일수록 가치가 큽니다.",
  velocity: "공의 빠르기. 탈삼진이 늘어납니다.",
  control: "제구력. 볼넷을 줄여 WHIP과 평균자책점을 낮춥니다.",
  movement: "공의 움직임. 피안타를 줄이고 탈삼진을 늘립니다.",
  stamina: "한 경기에 던질 수 있는 이닝. 60 이상이어야 선발을 맡습니다.",
  mental: "위기 상황에서의 집중력. 시즌 기복을 줄여줍니다.",
  durability: "몸의 튼튼함. 높을수록 시즌 중 부상 확률이 낮아집니다.",
};

const WEIGHTS: Record<Position, Partial<Record<AttrKey, number>>> = {
  투수: { velocity: 0.22, control: 0.26, movement: 0.26, stamina: 0.14, mental: 0.07, durability: 0.05 },
  포수: { contact: 0.22, power: 0.16, defense: 0.28, eye: 0.14, mental: 0.12, durability: 0.08 },
  내야수: { contact: 0.26, power: 0.16, defense: 0.22, speed: 0.12, eye: 0.16, durability: 0.08 },
  외야수: { contact: 0.24, power: 0.24, defense: 0.14, speed: 0.16, eye: 0.14, durability: 0.08 },
};

export const isPitcher = (p: Position) => p === "투수";

/** 포지션에서 화면에 보여줄 능력치 키 */
export const visibleKeys = (p: Position): AttrKey[] =>
  isPitcher(p) ? [...PITCHER_KEYS, ...SHARED_KEYS] : [...BATTER_KEYS, ...SHARED_KEYS];

export function computeOvr(attrs: Attrs, position: Position) {
  const w = WEIGHTS[position];
  let sum = 0;
  for (const k of Object.keys(w) as AttrKey[]) sum += attrs[k] * (w[k] as number);
  return Math.round(clamp(sum, 30, 99));
}

export function potentialGrade(p: number) {
  if (p >= 92) return "S";
  if (p >= 85) return "A";
  if (p >= 78) return "B";
  if (p >= 70) return "C";
  return "D";
}

function initialAttrs(position: Position): Attrs {
  const base = () => 40 + irand(13);
  const a: Attrs = {
    contact: base(), power: base(), eye: base(), speed: base(), defense: base(),
    velocity: base(), control: base(), movement: base(), stamina: base(),
    mental: 45 + irand(15), durability: 48 + irand(20),
  };
  // 포지션 주 능력치에 보정
  const boost = (k: AttrKey, n: number) => (a[k] = clamp(a[k] + n, 30, 80));
  if (position === "투수") { boost("velocity", 9); boost("control", 6); boost("movement", 7); boost("stamina", 7); }
  if (position === "포수") { boost("defense", 14); boost("mental", 6); boost("speed", -8); }
  if (position === "내야수") { boost("contact", 10); boost("defense", 8); boost("speed", 5); }
  if (position === "외야수") { boost("power", 11); boost("speed", 10); boost("contact", 6); }
  return a;
}

/* ─────────────────────── 시작 운명 ─────────────────────── */

export type Destiny = {
  team: TeamInfo;
  league: LeagueId;
  contract: Contract;
  headline: string;
  ovrBonus: number;
};

export function rollDestiny(): Destiny {
  const roll = rand();
  const mk = (team: TeamInfo, league: LeagueId, salary: number, years: number, label: string, headline: string, ovrBonus: number): Destiny => ({
    team, league, ovrBonus, headline,
    contract: { team: teamNameFor(team, league), league, salary, years, left: years, label },
  });
  if (roll < 0.5) {
    const team = pick(KBO_TEAMS);
    return mk(team, "KBO_F", 0.3, 3, "신인 드래프트 지명", `${team.name}이 당신을 지명했습니다. 퓨처스에서 시작합니다.`, 0);
  }
  if (roll < 0.62) {
    const team = pick(KBO_TEAMS);
    return mk(team, "KBO", 0.5, 3, "1라운드 지명 · 즉시 1군", `${team.name}의 1라운드 지명! 곧바로 1군 캠프에 합류합니다.`, 6);
  }
  if (roll < 0.78) {
    const team = pick(NPB_TEAMS);
    return mk(team, "NPB_F", 0.5, 3, "육성선수 계약", `${team.name} 육성선수 계약. 바다 건너에서 시작합니다.`, 3);
  }
  if (roll < 0.96) {
    const team = pick(MLB_TEAMS);
    return mk(team, "AA", 0.4, 4, "International Signing", `${team.name} 산하 마이너 계약. 아메리칸 드림의 출발점입니다.`, 5);
  }
  const team = pick(MLB_TEAMS);
  return mk(team, "MLB", 12, 3, "MLB 즉시 데뷔 계약", `믿기 어려운 일이 벌어졌습니다. ${team.name}이 곧바로 메이저 계약을 안겼습니다.`, 22);
}

export function teamNameFor(team: TeamInfo, league: LeagueId) {
  if (league === "KBO_F") return `${team.name} (퓨처스)`;
  if (league === "NPB_F") return `${team.name} (2군)`;
  if (league === "AA") return `${team.name} AA`;
  if (league === "AAA") return `${team.name} AAA`;
  return team.name;
}

export function createPlayer(name: string, position: Position): PlayerState {
  const destiny = rollDestiny();
  const attrs = initialAttrs(position);
  if (destiny.ovrBonus) {
    for (const k of visibleKeys(position)) attrs[k] = clamp(attrs[k] + destiny.ovrBonus, 30, 88);
  }
  const ovr = computeOvr(attrs, position);
  const potential = clamp(ovr + 14 + irand(30), 62, 99);
  return {
    name,
    position,
    bats: pick(["우투우타", "좌투좌타", "우투좌타"]),
    year: 2026,
    age: 18 + irand(3),
    attrs,
    potential,
    ovr,
    peakOvr: ovr,
    health: 92,
    fame: clamp(ovr - 45, 3, 40),
    morale: 70,
    teamTrust: 50,
    earnings: 0,
    contract: destiny.contract,
    traits: [],
    injury: null,
    seasons: [],
    awards: [],
    intl: [],
    rings: 0,
    serviceKBO: 0,
    serviceMLB: 0,
    phase: 0,
    retired: false,
    fatigueUsed: 0,
  };
}

/* ─────────────────────── 역할 판정 ─────────────────────── */

export function roleFor(s: PlayerState): Role {
  if (s.injury && s.injury.severity >= 1) return "재활";
  const edge = s.ovr - LEAGUES[s.contract.league].level;
  if (isPitcher(s.position)) {
    if (edge >= -2 && s.attrs.stamina >= 62) return "선발";
    if (edge >= 4) return "마무리";
    return "불펜";
  }
  if (edge >= 2) return "주전";
  if (edge >= -4) return "준주전";
  return "백업";
}

/** 수비 능력치 1당 WAR 기여 — 포수는 수비 프리미엄이 큽니다 */
const DEF_VALUE: Record<Position, number> = { 포수: 0.055, 내야수: 0.032, 외야수: 0.02, 투수: 0 };
/** 포지션 자체의 희소성 보정 */
const POS_ADJ: Record<Position, number> = { 포수: 0.9, 내야수: 0.2, 외야수: -0.2, 투수: 0 };

const PLAY_TIME: Record<Role, number> = {
  주전: 1, 준주전: 0.72, 백업: 0.42, 선발: 1, 불펜: 0.62, 마무리: 0.55, 재활: 0.3,
};

/* ─────────────────────── 시즌 시뮬레이션 ─────────────────────── */

export type SeasonResult = {
  stat: StatLine;
  role: Role;
  awards: string[];
  teamWins: number;
  teamRank: number;
  teamResult: string;
  champion: boolean;
  grew: Partial<Attrs>;
  declined: boolean;
  injury: PlayerState["injury"];
  narrative: string;
};

export function simulateSeason(s: PlayerState): SeasonResult {
  const lg = LEAGUES[s.contract.league];
  const role = roleFor(s);
  const edge = s.ovr - lg.level;
  const form = gauss() + (s.morale - 60) / 90 + (s.traits.includes("클러치") ? 0.25 : 0);
  const healthFactor = clamp(s.health / 95, 0.55, 1.05);
  const pt = PLAY_TIME[role] * healthFactor * (s.injury ? clamp(1 - s.injury.severity, 0.25, 1) : 1);

  const stat: StatLine = isPitcher(s.position)
    ? simPitcher(s, lg.games, role, edge, form, pt)
    : simBatter(s, lg.games, edge, form, pt);

  // 팀 성적
  const info = teamInfo(s.contract.team);
  const power = info?.power ?? 5;
  const teamsInLeague = lg.id === "MLB" ? 30 : lg.id === "NPB" || lg.id === "NPB_F" ? 12 : 10;
  const winPct = clamp(0.5 + (power - 5.5) * 0.021 + stat.war * 0.0045 + gauss() * 0.035, 0.32, 0.68);
  const teamWins = Math.round(lg.games * winPct);
  const teamRank = clamp(
    Math.round(1 + (0.62 - winPct) * (teamsInLeague * 2.6) + rand() * 1.2),
    1,
    teamsInLeague,
  );
  const playoffCut = lg.id === "MLB" ? 6 : 5;
  const madePlayoff = teamRank <= playoffCut && lg.tier >= 3;
  const champion = madePlayoff && teamRank <= 3 && rand() < 0.32;
  const teamResult = lg.tier < 3
    ? `${teamRank}위 (${teamWins}승)`
    : champion
      ? `🏆 ${lg.short} 우승`
      : madePlayoff
        ? `${teamRank}위 · 포스트시즌 진출`
        : `${teamRank}위 (${teamWins}승)`;

  // 수상
  const awards = judgeAwards(s, stat, lg.id, champion);

  // 부상
  const injuryRisk =
    0.05 +
    (75 - s.attrs.durability) * 0.0022 +
    (95 - s.health) * 0.0016 +
    Math.max(0, s.age - 31) * 0.012 +
    (s.traits.includes("유리몸") ? 0.06 : 0);
  let injury: PlayerState["injury"] = null;
  if (rand() < clamp(injuryRisk, 0.03, 0.42)) {
    const severe = rand() < 0.25;
    injury = severe
      ? { name: pick(["팔꿈치 인대 손상", "십자인대 파열", "어깨 관절와순 수술"]), severity: 1 }
      : { name: pick(["햄스트링 부상", "손목 미세골절", "옆구리 근육 손상", "무릎 염좌"]), severity: 0.4 };
  }

  // 성장 / 노쇠
  const { grew, declined } = progress(s, stat);

  return {
    stat, role, awards, teamWins, teamRank, teamResult, champion,
    grew, declined, injury,
    narrative: narrate(s, stat, awards, injury, champion),
  };
}

function simBatter(s: PlayerState, games: number, edge: number, form: number, pt: number): BatterLine {
  const a = s.attrs;
  const lvl = LEAGUES[s.contract.league].level;
  const g = Math.round(games * pt * (0.9 + rand() * 0.12));
  const pa = Math.max(40, Math.round(g * 4.25 * (pt > 0.8 ? 1 : 0.92)));
  const avg = clamp(
    0.252 + (a.contact - lvl) * 0.0034 + (a.eye - lvl) * 0.0011 + (a.speed - lvl) * 0.0006 + form * 0.019,
    0.168,
    0.395,
  );
  const hrRate = Math.max(0, (a.power - lvl) * 0.0022 + 0.021 + form * 0.004);
  const hr = Math.round(pa * hrRate * (0.85 + rand() * 0.4));
  const h = Math.round(pa * 0.9 * avg);
  const obp = clamp(avg + 0.052 + (a.eye - lvl) * 0.0021, 0.2, 0.48);
  const slg = clamp(avg + 0.128 + (a.power - lvl) * 0.0045 + hr / Math.max(pa, 1) * 1.4, 0.24, 0.79);
  const sb = Math.max(0, Math.round((a.speed - 58) * 0.42 * pt + rand() * 4));
  const rbi = Math.round(hr * 2.1 + h * 0.32 + rand() * 8);
  // WAR은 "리그 평균 선수" 기준으로 계산합니다.
  // 능력치가 리그 레벨과 같으면 obp .304 / slg .380 이 나오므로 그 값이 기준선입니다.
  const off = (obp - 0.304) * 24 + (slg - 0.38) * 10;
  const def = (a.defense - lvl) * DEF_VALUE[s.position] + POS_ADJ[s.position];
  const spd = (a.speed - lvl) * 0.006;
  // +2.0 은 대체선수 대비 보정 (풀타임 평균 선수 ≈ 2 WAR)
  const war = r1(clamp((off + def + spd + 2.0) * (pa / 600), -2, 13));
  return { kind: "batter", g, pa, h, hr, rbi, sb, avg, obp, slg, war };
}

function simPitcher(s: PlayerState, games: number, role: Role, edge: number, form: number, pt: number): PitcherLine {
  const a = s.attrs;
  const starter = role === "선발";
  const g = starter ? Math.round(30 * pt * (0.85 + rand() * 0.25)) : Math.round(62 * pt * (0.8 + rand() * 0.35));
  const ipPerG = starter ? clamp(4.6 + (a.stamina - 60) * 0.035, 3.4, 7.2) : role === "마무리" ? 1.05 : 1.4;
  const ip = r1(Math.max(8, g * ipPerG * (0.92 + rand() * 0.16)));
  const era = clamp(4.35 - edge * 0.115 - form * 0.42 - (a.control - 60) * 0.012, 1.42, 8.2);
  const whip = clamp(1.36 - edge * 0.011 - form * 0.05 - (a.control - 60) * 0.0035, 0.78, 2.1);
  const k9 = clamp(6.4 + (a.velocity - 60) * 0.072 + (a.movement - 60) * 0.058, 3.5, 14);
  const so = Math.round((ip * k9) / 9);
  const info = teamInfo(s.contract.team);
  const support = ((info?.power ?? 5) - 5) * 0.02;
  const w = starter
    ? Math.max(0, Math.round(g * clamp(0.62 - (era - 3.4) * 0.09 + support, 0.08, 0.72)))
    : Math.round(g * 0.06);
  const l = starter ? Math.max(0, Math.round(g * clamp(0.2 + (era - 3.4) * 0.07, 0.05, 0.55))) : Math.round(g * 0.05);
  const sv = role === "마무리" ? Math.max(0, Math.round(g * clamp(0.62 - (era - 3) * 0.08, 0.1, 0.72))) : 0;
  // 리그 평균 ERA(4.35) 대비 방어 실점 + 대체선수 보정
  const war = r1(clamp((4.35 - era) * (ip / 9) * 0.22 + (ip / 180) * 1.8, -1.5, 11));
  return { kind: "pitcher", g, ip, w, l, sv, so, era: Math.round(era * 100) / 100, whip: Math.round(whip * 100) / 100, war };
}

/* ─────────────────────── 수상 ─────────────────────── */

function judgeAwards(s: PlayerState, stat: StatLine, league: LeagueId, champion: boolean) {
  const lg = LEAGUES[league];
  const out: string[] = [];
  const tag = `${s.year} ${lg.short}`;
  const top = lg.tier >= 3;
  if (s.seasons.length === 0 && top && stat.war >= 2.2) out.push(`${tag} 신인왕`);
  // 1군 무대(tier 3+)가 아니면 타이틀·올스타는 주어지지 않습니다
  if (stat.kind === "batter") {
    if (top && stat.war >= 6.5) out.push(`${tag} MVP`);
    else if (top && stat.war >= 4) out.push(`${tag} 골든글러브`);
    else if (top && stat.war >= 2.8) out.push(`${tag} 올스타`);
    if (top) {
      const hrCut = league === "MLB" ? 44 : 36;
      if (stat.hr >= hrCut) out.push(`${tag} 홈런왕 (${stat.hr}홈런)`);
      if (stat.avg >= 0.345 && stat.pa >= 400) out.push(`${tag} 타격왕 (${fmtAvg(stat.avg)})`);
      if (stat.sb >= 45) out.push(`${tag} 도루왕 (${stat.sb}도루)`);
    }
  } else {
    if (top && stat.war >= 6) out.push(`${tag} MVP`);
    else if (top && stat.war >= 4.2) out.push(`${tag} 사이영/투수 골든글러브`);
    else if (top && stat.war >= 2.6) out.push(`${tag} 올스타`);
    if (top) {
      if (stat.w >= 18) out.push(`${tag} 다승왕 (${stat.w}승)`);
      if (stat.era <= 2.35 && stat.ip >= 130) out.push(`${tag} 평균자책점 1위 (${stat.era.toFixed(2)})`);
      if (stat.sv >= 38) out.push(`${tag} 세이브왕 (${stat.sv}세이브)`);
    }
  }
  if (champion) out.push(`${tag} 우승 반지 💍`);
  return out;
}

/* ─────────────────────── 성장 / 노쇠 ─────────────────────── */

function ageCurve(age: number) {
  if (age <= 20) return 1.35;
  if (age <= 23) return 1.05;
  if (age <= 26) return 0.7;
  if (age <= 28) return 0.35;
  if (age <= 30) return 0.1;
  if (age <= 32) return -0.55;
  if (age <= 35) return -1.15;
  return -1.9;
}

function progress(s: PlayerState, stat: StatLine) {
  const keys = visibleKeys(s.position);
  const grew: Partial<Attrs> = {};
  const curve = ageCurve(s.age);
  const room = (s.potential - s.ovr) / 30; // 0~1
  const perf = clamp(stat.war / 4, -0.4, 1.4);
  const care = (s.health - 70) / 200 + (s.morale - 60) / 250;
  const talentBonus = s.traits.includes("천재형") ? 0.4 : s.traits.includes("대기만성") && s.age >= 27 ? 0.6 : 0;

  const raw =
    curve >= 0
      ? curve * (1 + room) + perf * 0.5 + care + talentBonus
      : curve * 1.9 - Math.max(0, -perf) * 0.6;
  let points = Math.round(raw);
  const declined = points < 0;

  const declineOrder: AttrKey[] = isPitcher(s.position)
    ? ["velocity", "stamina", "movement", "durability", "control"]
    : ["speed", "power", "defense", "contact", "durability"];

  if (points >= 0) {
    for (let i = 0; i < points; i++) {
      const cap = clamp(s.potential, 40, 99);
      const k = pick(keys.filter((x) => s.attrs[x] < cap));
      if (!k) break;
      grew[k] = (grew[k] ?? 0) + 1;
    }
  } else {
    for (let i = 0; i < -points; i++) {
      const k = declineOrder[Math.min(declineOrder.length - 1, irand(3) + (i > 3 ? 1 : 0))];
      grew[k] = (grew[k] ?? 0) - 1;
    }
  }
  return { grew, declined };
}

function narrate(
  s: PlayerState,
  stat: StatLine,
  awards: string[],
  injury: PlayerState["injury"],
  champion: boolean,
) {
  if (champion) return `${s.year}년, 당신은 우승의 순간을 그라운드 위에서 맞았습니다.`;
  if (awards.some((a) => a.includes("MVP"))) return `리그가 인정했습니다. ${s.year} 시즌의 주인공은 ${s.name}입니다.`;
  if (injury?.severity === 1) return `시즌 도중 ${injury.name}. 수술대에 오릅니다. 돌아오는 길은 길고 험합니다.`;
  if (injury) return `${injury.name}으로 이탈이 있었지만 시즌은 마쳤습니다.`;
  if (stat.war >= 4) return "스카우트들의 수첩에 당신의 이름이 적히기 시작했습니다.";
  if (stat.war >= 1.5) return "무난한 한 해. 다음 시즌이 진짜 승부처입니다.";
  if (stat.war >= 0) return "존재감을 남기지 못한 시즌. 자리를 지키는 것조차 쉽지 않습니다.";
  return "냉정한 평가가 돌아왔습니다. 다음 시즌 로스터를 장담할 수 없습니다.";
}

/* ─────────────────────── 계약 / 이적 ─────────────────────── */

export function marketValue(s: PlayerState, league: LeagueId, richness: number) {
  const lg = LEAGUES[league];
  const lastWar = s.seasons.length ? s.seasons[s.seasons.length - 1].stat.war : 0;
  const ageFactor = s.age <= 27 ? 1.15 : s.age <= 31 ? 1 : s.age <= 34 ? 0.75 : 0.45;
  const raw =
    lg.pay *
    (0.45 + Math.max(0, s.ovr - lg.level + 6) * 0.11 + Math.max(0, lastWar) * 0.24 + s.fame * 0.005) *
    ageFactor *
    (0.7 + richness / 12);
  return Math.max(lg.pay * 0.3, Math.round(raw * 10) / 10);
}

const LADDER_UP: Partial<Record<LeagueId, LeagueId>> = {
  KBO_F: "KBO", NPB_F: "NPB", AA: "AAA", AAA: "MLB",
};
const LADDER_DOWN: Partial<Record<LeagueId, LeagueId>> = {
  KBO: "KBO_F", NPB: "NPB_F", AAA: "AA", MLB: "AAA",
};

function teamsOf(league: LeagueId) {
  if (league === "KBO" || league === "KBO_F") return KBO_TEAMS;
  if (league === "NPB" || league === "NPB_F") return NPB_TEAMS;
  return MLB_TEAMS;
}

export function isFaEligible(s: PlayerState) {
  if (s.contract.league === "KBO") return s.serviceKBO >= 8;
  if (s.contract.league === "MLB") return s.serviceMLB >= 6;
  return false;
}

/** 오프시즌 오퍼 생성 */
export function buildOffers(s: PlayerState): Offer[] {
  const cur = s.contract.league;
  const lg = LEAGUES[cur];
  const edge = s.ovr - lg.level;
  const lastWar = s.seasons.length ? s.seasons[s.seasons.length - 1].stat.war : 0;
  const offers: Offer[] = [];
  const currentTeam = teamInfo(s.contract.team);

  const mk = (
    team: TeamInfo,
    league: LeagueId,
    kind: Offer["kind"],
    years: number,
    mult: number,
    label: string,
    note: string,
  ): Offer => ({
    team: teamNameFor(team, league),
    league,
    salary: Math.round(marketValue(s, league, team.rich) * mult * 10) / 10,
    years,
    label,
    role: predictRole(s, league),
    note,
    kind,
  });

  // 1) 잔류
  if (currentTeam && edge >= -9) {
    const loyal = s.teamTrust >= 60;
    offers.push(
      mk(currentTeam, cur, "잔류", loyal ? 4 : 2, loyal ? 1.08 : 0.92, "재계약",
        loyal ? "구단은 당신을 프랜차이즈 스타로 보고 있습니다." : "일단 한 번 더 지켜보겠다는 조건입니다."),
    );
  }

  // 2) 승격 / 상위 리그
  const up = LADDER_UP[cur];
  if (up && s.ovr >= LEAGUES[up].level - (LEAGUES[up].tier >= 3 ? 2 : 4)) {
    const team = cur === "AA" || cur === "AAA" ? currentTeam ?? pick(MLB_TEAMS) : currentTeam ?? pick(teamsOf(up));
    offers.push(mk(team, up, "콜업", 3, 1, `${LEAGUES[up].short} 승격`, `드디어 ${LEAGUES[up].label} 무대입니다.`));
  }

  // 3) 해외 진출 (포스팅/FA)
  if (cur === "KBO" && s.ovr >= 74 && lastWar >= 3.5) {
    if (s.serviceKBO >= 7 || rand() < 0.5) {
      offers.push(mk(pick(NPB_TEAMS), "NPB", "해외진출", 3, 1.05, "포스팅 · NPB 진출", "일본 구단이 포스팅 응찰에 나섰습니다."));
    }
    if (s.ovr >= 78 && rand() < 0.55) {
      offers.push(mk(pick(MLB_TEAMS), "MLB", "해외진출", 4, 1.1, "포스팅 · MLB 진출", "메이저리그 구단의 정식 오퍼입니다. 인생이 바뀝니다."));
    }
  }
  if (cur === "NPB" && s.ovr >= 78 && lastWar >= 4) {
    offers.push(mk(pick(MLB_TEAMS), "MLB", "해외진출", 4, 1.15, "포스팅 · MLB 진출", "일본에서의 성공이 메이저의 문을 열었습니다."));
  }

  // 4) 동급 리그 경쟁 구단
  const rivalCount = edge >= 6 ? 2 : edge >= 0 ? 1 : 0;
  const pool = teamsOf(cur).filter((x) => x.name !== currentTeam?.name);
  for (let i = 0; i < rivalCount; i++) {
    const team = pool[irand(pool.length)];
    if (!team || offers.some((o) => o.team === teamNameFor(team, cur))) continue;
    offers.push(mk(team, cur, "이적", 3 + irand(2), 1.15 + rand() * 0.2, "FA / 트레이드 영입", "돈과 출전 기회를 함께 제시했습니다."));
  }

  // 5) 강등 / 생존 계약
  const down = LADDER_DOWN[cur];
  if (edge < -6 && down) {
    const team = currentTeam ?? pick(teamsOf(down));
    offers.push(mk(team, down, "강등", 1, 0.5, `${LEAGUES[down].short} 재조정`, "지금 수준으로는 이 무대가 버겁습니다."));
  }

  // 6) 한국 복귀
  if ((cur === "AAA" || cur === "NPB_F") && s.age >= 28) {
    offers.push(mk(pick(KBO_TEAMS), "KBO", "복귀", 3, 1.05, "KBO 유턴 계약", "한국 구단이 즉시 전력으로 부릅니다."));
  }

  if (!offers.length) {
    const team = currentTeam ?? pick(teamsOf(cur));
    offers.push(mk(team, cur, "잔류", 1, 0.6, "단년 최소 계약", "마지막 기회일지도 모릅니다."));
  }
  return offers.slice(0, 4);
}

function predictRole(s: PlayerState, league: LeagueId): Role {
  const edge = s.ovr - LEAGUES[league].level;
  if (isPitcher(s.position)) return edge >= -2 && s.attrs.stamina >= 62 ? "선발" : edge >= 4 ? "마무리" : "불펜";
  return edge >= 2 ? "주전" : edge >= -4 ? "준주전" : "백업";
}

/* ─────────────────────── 은퇴 ─────────────────────── */

export function shouldRetire(s: PlayerState, lastWar: number) {
  if (s.age >= 41) return "나이가 몸을 이겼습니다.";
  if (s.age >= 30 && s.ovr < LEAGUES[s.contract.league].level - 14)
    return "어느 리그에서도 자리를 찾지 못했습니다.";
  if (s.age >= 36 && s.ovr < 58) return "더 이상 1군 수준을 유지할 수 없었습니다.";
  if (s.health <= 38 && s.age >= 33) return "몸이 더는 버티지 못했습니다.";
  if (s.age >= 38 && lastWar < 0.5 && rand() < 0.55) return "박수칠 때 떠나기로 했습니다.";
  if (s.age >= 34 && s.ovr < 50) return "방출 통보가 마지막이었습니다.";
  // 30대 중반까지 1군에 자리를 잡지 못하면 현실적으로 커리어가 끝납니다
  if (s.age >= 34 && LEAGUES[s.contract.league].tier <= 2)
    return "끝내 1군의 문턱을 넘지 못한 채 유니폼을 벗었습니다.";
  return null;
}

/* ─────────────────────── 표시 헬퍼 ─────────────────────── */

export const fmtAvg = (v: number) => v.toFixed(3).replace(/^0/, "");

/** 억원 단위 연봉을 리그 통화 표기로 변환 */
export function fmtSalary(salary: number, league: LeagueId) {
  const lg = LEAGUES[league];
  if (lg.currency === "$") {
    const m = salary / 14; // 1M USD ≈ 14억원
    return m >= 1 ? `$${m.toFixed(1)}M` : `$${Math.round(m * 1000)}K`;
  }
  if (lg.currency === "¥") {
    const oku = salary * 0.11; // 1억원 ≈ 0.11억엔
    return oku >= 1 ? `${oku.toFixed(1)}억엔` : `${Math.round(oku * 10000)}만엔`;
  }
  return salary >= 1 ? `${salary.toFixed(1)}억원` : `${Math.round(salary * 10000)}만원`;
}

export function statSummary(stat: StatLine) {
  if (stat.kind === "batter")
    return `${stat.g}G ${fmtAvg(stat.avg)} ${stat.hr}홈런 ${stat.rbi}타점 ${stat.sb}도루 · ${stat.war} WAR`;
  return `${stat.g}G ${stat.w}승 ${stat.l}패${stat.sv ? ` ${stat.sv}세이브` : ""} ERA ${stat.era.toFixed(2)} ${stat.so}K · ${stat.war} WAR`;
}

export function careerTotals(seasons: SeasonRecord[]) {
  const bat = seasons.filter((x) => x.stat.kind === "batter").map((x) => x.stat as BatterLine);
  const pit = seasons.filter((x) => x.stat.kind === "pitcher").map((x) => x.stat as PitcherLine);
  const war = r1(seasons.reduce((a, x) => a + x.stat.war, 0));
  if (pit.length > bat.length) {
    const ip = r1(pit.reduce((a, x) => a + x.ip, 0));
    const er = pit.reduce((a, x) => a + (x.era * x.ip) / 9, 0);
    return {
      kind: "pitcher" as const,
      war,
      g: pit.reduce((a, x) => a + x.g, 0),
      ip,
      w: pit.reduce((a, x) => a + x.w, 0),
      l: pit.reduce((a, x) => a + x.l, 0),
      sv: pit.reduce((a, x) => a + x.sv, 0),
      so: pit.reduce((a, x) => a + x.so, 0),
      era: ip ? Math.round(((er * 9) / ip) * 100) / 100 : 0,
    };
  }
  const pa = bat.reduce((a, x) => a + x.pa, 0);
  const h = bat.reduce((a, x) => a + x.h, 0);
  return {
    kind: "batter" as const,
    war,
    g: bat.reduce((a, x) => a + x.g, 0),
    h,
    hr: bat.reduce((a, x) => a + x.hr, 0),
    rbi: bat.reduce((a, x) => a + x.rbi, 0),
    sb: bat.reduce((a, x) => a + x.sb, 0),
    avg: pa ? h / (pa * 0.9) : 0,
  };
}

export const ALL_TEAM_NAMES = ALL_TEAMS.map((x) => x.name);

/* ─────────────────── 국제대회 ─────────────────── */

/** 연도에 해당하는 국제대회. 없으면 null */
export function tournamentFor(year: number): string | null {
  if (year % 4 === 2) return `${year} WBC`;        // 2026, 2030 …
  if (year % 4 === 0) return `${year} 올림픽`;      // 2028, 2032 …
  return null;                                     // 홀수 해는 대회 없음
}

/* ─────────────────── 커리어 총평 ─────────────────── */

export type AwardTally = {
  mvp: number;
  goldenGlove: number;
  rookie: number;
  allStar: number;
  titles: number;
  rings: number;
};

export function tallyAwards(awards: string[], rings: number): AwardTally {
  const has = (kw: string) => awards.filter((a) => a.includes(kw)).length;
  return {
    mvp: has("MVP"),
    goldenGlove: has("골든글러브") + has("사이영"),
    rookie: has("신인왕"),
    allStar: has("올스타"),
    titles:
      has("홈런왕") + has("타격왕") + has("도루왕") + has("다승왕") +
      has("평균자책점 1위") + has("세이브왕"),
    rings,
  };
}

/** 명예의전당 점수 (0~100) 와 등급 */
/** 리그 수준 보정 — 2군에서 쌓은 WAR 은 명예의전당 점수에 거의 반영되지 않습니다 */
const HOF_LEAGUE_WEIGHT: Record<LeagueId, number> = {
  KBO_F: 0.15, NPB_F: 0.25, AA: 0.25, AAA: 0.5, KBO: 0.8, NPB: 0.95, MLB: 1.2,
};

export function hofScore(s: PlayerState) {
  const totals = careerTotals(s.seasons);
  const weightedWar = s.seasons.reduce(
    (a, x) => a + x.stat.war * HOF_LEAGUE_WEIGHT[x.league],
    0,
  );
  const t = tallyAwards(s.awards, s.rings);
  const topTierSeasons = s.seasons.filter((x) => LEAGUES[x.league].tier >= 3).length;
  const mlbSeasons = s.seasons.filter((x) => x.league === "MLB").length;
  const npbSeasons = s.seasons.filter((x) => x.league === "NPB").length;
  const medals = s.intl.filter((x) => x.medal).length;

  const raw =
    weightedWar * 1.1 +
    t.mvp * 9 +
    t.goldenGlove * 4 +
    t.titles * 3 +
    t.allStar * 1.2 +
    t.rings * 6 +
    t.rookie * 3 +
    topTierSeasons * 0.7 +
    mlbSeasons * 1.4 +
    npbSeasons * 0.7 +
    medals * 2.2 +
    Math.max(0, s.peakOvr - 72) * 0.9;

  const score = Math.round(clamp(raw, 0, 100));
  const grade =
    score >= 88 ? "전설 (LEGEND)" :
    score >= 72 ? "명예의전당 (HALL OF FAME)" :
    score >= 55 ? "프랜차이즈 스타" :
    score >= 38 ? "리그 주전급" :
    score >= 20 ? "롱런한 프로" :
    s.seasons.length >= 10 ? "묵묵히 버틴 직업 야구인" :
    "짧았던 도전";
  return { score, grade, totals, tally: t, topTierSeasons, mlbSeasons, npbSeasons };
}

/** 커리어 최고의 시즌 */
export function bestSeason(seasons: SeasonRecord[]) {
  if (!seasons.length) return null;
  return seasons.reduce((a, b) => (b.stat.war > a.stat.war ? b : a));
}

/** 리그별 소화 시즌 요약 */
export function leagueBreakdown(seasons: SeasonRecord[]) {
  const map = new Map<LeagueId, { seasons: number; war: number; teams: Set<string> }>();
  for (const s of seasons) {
    const cur = map.get(s.league) ?? { seasons: 0, war: 0, teams: new Set<string>() };
    cur.seasons += 1;
    cur.war = r1(cur.war + s.stat.war);
    cur.teams.add(s.team);
    map.set(s.league, cur);
  }
  return [...map.entries()]
    .sort((a, b) => LEAGUES[b[0]].tier - LEAGUES[a[0]].tier)
    .map(([league, v]) => ({ league, ...v, teams: [...v.teams] }));
}
