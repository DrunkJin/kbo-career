/**
 * 밸런스 검증용 헤드리스 시뮬레이션.
 *   npx esbuild scripts/sim.ts --bundle --platform=node --format=cjs \
 *     --define:import.meta.env.BASE_URL='"/"' --outfile=.sim.cjs && node .sim.cjs
 */
import { LEAGUES } from "../src/game/data";
import { careerTotals, hofScore } from "../src/game/engine";
import { reducer, type GameState, initialState } from "../src/game/store";
import type { Position } from "../src/game/types";

const RUNS = Number(process.argv[2] ?? 300);
const POS = (process.argv[3] as Position) ?? "내야수";

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

const byTop = new Map<string, number>();
rows.forEach((r) => byTop.set(r.top, (byTop.get(r.top) ?? 0) + 1));
console.log(
  "최고 도달 리그:",
  [...byTop.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v)}`).join(" · "),
);
