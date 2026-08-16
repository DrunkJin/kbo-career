/**
 * 밸런스 검증용 헤드리스 시뮬레이션.
 *   npx esbuild scripts/sim.ts --bundle --platform=node --format=cjs \
 *     --define:import.meta.env.BASE_URL='"/"' --outfile=.sim.cjs && node .sim.cjs
 */
import { LEAGUES } from "../src/game/data";
import { buildOffers, careerTotals, createPlayer, hofScore } from "../src/game/engine";
import { reducer, type GameState, initialState } from "../src/game/store";
import type { LeagueId, Position } from "../src/game/types";

const RUNS = Number(process.argv[2] ?? 300);
const POS = (process.argv[3] as Position) ?? "내야수";

/**
 * `node .sim.cjs routes` — 각 리그·나이·기량 조합에서 어떤 오퍼가 생성되는지 확인합니다.
 * 시즌 시뮬레이션과 달리 AI 선택이 개입하지 않으므로, 경로가 실제로 열려 있는지 바로 보입니다.
 */
if (process.argv[2] === "routes") {
  const cases: { league: LeagueId; ovr: number; age: number; war: number; desc: string }[] = [
    { league: "KBO", ovr: 80, age: 27, war: 5, desc: "KBO 최정상" },
    { league: "KBO", ovr: 75, age: 26, war: 4, desc: "KBO 준정상" },
    { league: "KBO", ovr: 68, age: 30, war: 2, desc: "KBO 주전" },
    { league: "MLB", ovr: 84, age: 26, war: 5, desc: "MLB 주전 (전성기)" },
    { league: "MLB", ovr: 79, age: 31, war: 1.5, desc: "MLB 하락세 베테랑" },
    { league: "MLB", ovr: 74, age: 33, war: 0.5, desc: "MLB 방출 위기" },
    { league: "NPB", ovr: 82, age: 27, war: 5, desc: "NPB 에이스" },
    { league: "NPB", ovr: 72, age: 31, war: 2, desc: "NPB 베테랑" },
    { league: "AAA", ovr: 70, age: 27, war: 3, desc: "AAA 유망주" },
    { league: "AA", ovr: 64, age: 27, war: 2, desc: "AA 정체" },
    { league: "NPB_F", ovr: 62, age: 27, war: 2, desc: "NPB 2군" },
    { league: "KBO_F", ovr: 60, age: 23, war: 2, desc: "퓨처스 유망주" },
  ];

  for (const c of cases) {
    // 같은 조건을 여러 번 굴려 확률형 오퍼까지 모두 드러냅니다
    const seen = new Map<string, number>();
    const TRIES = 400;
    for (let i = 0; i < TRIES; i++) {
      const p = createPlayer("테스트", POS);
      p.age = c.age;
      p.ovr = c.ovr;
      p.peakOvr = c.ovr;
      p.fame = 60;
      p.teamTrust = 50;
      p.serviceKBO = c.league === "KBO" ? 7 : 0;
      p.contract = {
        team: LEAGUES[c.league].label,
        league: c.league,
        salary: 5,
        years: 3,
        left: 0,
        label: "테스트",
      };
      // 직전 시즌 성적만 참조되므로 최소한의 기록을 넣습니다
      p.seasons = [
        {
          year: 2030, age: c.age - 1, team: "테스트", league: c.league, ovr: c.ovr, role: "주전",
          stat: { kind: "batter", g: 140, pa: 600, h: 160, hr: 20, rbi: 80, sb: 10, avg: 0.29, obp: 0.36, slg: 0.48, war: c.war },
          awards: [], teamResult: "3위",
        },
      ];
      for (const o of buildOffers(p)) {
        if (o.league === c.league) continue;
        const key = `${LEAGUES[c.league].short}→${LEAGUES[o.league].short} (${o.kind})`;
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
    }
    const list = [...seen.entries()].sort((a, b) => b[1] - a[1]);
    console.log(`\n■ ${c.desc} — OVR ${c.ovr} / ${c.age}세 / 직전 ${c.war} WAR`);
    if (!list.length) console.log("   (리그를 옮기는 오퍼 없음)");
    for (const [k, v] of list) {
      console.log(`   ${k.padEnd(28)} ${((v / TRIES) * 100).toFixed(0)}%`);
    }
  }
  process.exit(0);
}

type Row = {
  seasons: number;
  peak: number;
  war: number;
  top: string;
  awards: number;
  rings: number;
  intl: number;
  earnings: number;
  hof: number;
  retireAge: number;
  reachedMLB: boolean;
  reachedTop: boolean;
};

const rows: Row[] = [];
let stuck = 0;
/** "KBO→MLB" 형태의 리그 전환 횟수 */
const transitions = new Map<string, number>();

for (let i = 0; i < RUNS; i++) {
  let s: GameState = reducer(initialState(), {
    type: "START",
    name: "테스트",
    position: POS,
  });
  let guard = 0;
  while (s.screen === "play" && guard++ < 4000) {
    if (s.result) {
      s = reducer(s, { type: "CLOSE_RESULT" });
      continue;
    }
    if (s.offers?.length) {
      // 가장 상위 리그 + 연봉 높은 오퍼 선택 (공격적 플레이어)
      const best = [...s.offers].sort(
        (a, b) => LEAGUES[b.league].tier - LEAGUES[a.league].tier || b.salary - a.salary,
      )[0];
      s = reducer(s, { type: "ACCEPT", offer: best });
      continue;
    }
    if (s.event) {
      s = reducer(s, { type: "CHOOSE", choice: s.event.choices[0] });
      continue;
    }
    s = reducer(s, { type: "ADVANCE" });
  }
  if (s.screen !== "retired") stuck++;

  const p = s.player;
  const totals = careerTotals(p.seasons);
  const leagues = new Set(p.seasons.map((x) => x.league));
  for (let k = 1; k < p.seasons.length; k++) {
    const a = p.seasons[k - 1].league;
    const b = p.seasons[k].league;
    if (a === b) continue;
    const key = `${LEAGUES[a].short}→${LEAGUES[b].short}`;
    transitions.set(key, (transitions.get(key) ?? 0) + 1);
  }
  rows.push({
    seasons: p.seasons.length,
    peak: p.peakOvr,
    war: totals.war,
    top: [...leagues].sort((a, b) => LEAGUES[b].tier - LEAGUES[a].tier)[0] ?? "-",
    awards: p.awards.length,
    rings: p.rings,
    intl: p.intl.length,
    earnings: p.earnings,
    hof: hofScore(p).score,
    retireAge: p.age,
    reachedMLB: leagues.has("MLB"),
    reachedTop: [...leagues].some((l) => LEAGUES[l].tier >= 3),
  });
}

const num = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const pct = (n: number) => `${((n / RUNS) * 100).toFixed(1)}%`;
const q = (xs: number[], p: number) => {
  const v = [...xs].sort((a, b) => a - b);
  return v[Math.floor(v.length * p)] ?? 0;
};

const wars = rows.map((r) => r.war);
const seasons = rows.map((r) => r.seasons);

console.log(`\n=== ${RUNS}회 · ${POS} ===`);
console.log(`무한루프 의심: ${stuck}`);
console.log(`평균 시즌 수 ${num(seasons).toFixed(1)} (중앙 ${q(seasons, 0.5)}, 최대 ${Math.max(...seasons)})`);
console.log(`은퇴 나이 평균 ${num(rows.map((r) => r.retireAge)).toFixed(1)}`);
console.log(`통산 WAR 평균 ${num(wars).toFixed(1)} · 중앙 ${q(wars, 0.5)} · 상위10% ${q(wars, 0.9)} · 최대 ${Math.max(...wars).toFixed(1)}`);
console.log(`최고 OVR 평균 ${num(rows.map((r) => r.peak)).toFixed(1)} · 중앙 ${q(rows.map((r) => r.peak), 0.5)}`);
console.log(`수상 평균 ${num(rows.map((r) => r.awards)).toFixed(1)} · 우승 평균 ${num(rows.map((r) => r.rings)).toFixed(2)}`);
console.log(`국제대회 출전 평균 ${num(rows.map((r) => r.intl)).toFixed(2)}`);
console.log(`통산 수입 중앙 ${q(rows.map((r) => r.earnings), 0.5).toFixed(1)}억 · 상위10% ${q(rows.map((r) => r.earnings), 0.9).toFixed(1)}억`);
console.log(`HOF 점수 중앙 ${q(rows.map((r) => r.hof), 0.5)} · 상위10% ${q(rows.map((r) => r.hof), 0.9)}`);
console.log(`1군(티어3+) 도달 ${pct(rows.filter((r) => r.reachedTop).length)} · MLB 도달 ${pct(rows.filter((r) => r.reachedMLB).length)}`);

console.log("\n리그 전환 (전체 커리어 합산):");
console.log(
  [...transitions.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  ${k.padEnd(18)} ${v}`)
    .join("\n"),
);

const byTop = new Map<string, number>();
rows.forEach((r) => byTop.set(r.top, (byTop.get(r.top) ?? 0) + 1));
console.log(
  "최고 도달 리그:",
  [...byTop.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v)}`).join(" · "),
);
