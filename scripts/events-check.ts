/** 이벤트 커버리지 점검: 총 개수, 중복 id, 페이즈/포지션/구단별 분포 */
import { EVENTS } from "../src/game/events";

console.log("총 이벤트:", EVENTS.length);

const ids = EVENTS.map((e) => e.id);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
console.log("중복 id:", dup.length ? dup : "없음");

const byPhase = new Map<number, number>();
for (const e of EVENTS) for (const p of e.phases) byPhase.set(p, (byPhase.get(p) ?? 0) + 1);
const names = ["스프링캠프", "전반기", "후반기", "결산", "오프시즌"];
console.log("\n페이즈별:");
[...byPhase.entries()].sort((a, b) => a[0] - b[0]).forEach(([k, v]) => console.log(`  ${names[k]} ${v}`));

console.log("\n타게팅:");
console.log("  포지션 지정:", EVENTS.filter((e) => e.positions).length);
console.log("  구단 지정  :", EVENTS.filter((e) => e.teams).length);
console.log("  연차 지정  :", EVENTS.filter((e) => e.minSeason !== undefined || e.maxSeason !== undefined).length);
console.log("  조건 없음  :", EVENTS.filter((e) => !e.positions && !e.teams && !e.when && e.minSeason === undefined && e.maxSeason === undefined).length);

/* ── 신선도: 실제 커리어에서 같은 문장이 얼마나 반복되는가 ── */
import { initialState, reducer, type GameState } from "../src/game/store";
const variantTotal = EVENTS.reduce((a, e) => a + 1 + (e.variants?.length ?? 0), 0);
console.log(`\n본문 변형 포함 서로 다른 문장: ${variantTotal}개`);

let shown = 0, exactRepeat = 0, idRepeat = 0;
const RUNS = 60;
for (let i = 0; i < RUNS; i++) {
  let s: GameState = reducer(initialState(), { type: "START", name: "t", position: (["투수","포수","내야수","외야수"] as const)[i % 4] });
  const seenBody = new Set<string>(), seenId = new Set<string>();
  for (let g = 0; g < 3000 && s.screen === "play"; g++) {
    if (s.result) { s = reducer(s, { type: "CLOSE_RESULT" }); continue; }
    if (s.offers?.length) { s = reducer(s, { type: "ACCEPT", offer: s.offers[0] }); continue; }
    if (s.event) {
      shown++;
      if (seenId.has(s.event.id)) idRepeat++;
      if (seenBody.has(s.event.body)) exactRepeat++;
      seenId.add(s.event.id); seenBody.add(s.event.body);
      s = reducer(s, { type: "CHOOSE", choice: s.event.choices[Math.floor(Math.random()*s.event.choices.length)] });
      continue;
    }
    s = reducer(s, { type: "ADVANCE" });
  }
}
console.log(`커리어 ${RUNS}개 · 직접 고른 이벤트 ${(shown/RUNS).toFixed(1)}개/커리어`);
console.log(`  같은 이벤트(id) 재등장: ${((idRepeat/shown)*100).toFixed(1)}%`);
console.log(`  같은 문장 그대로 재등장: ${((exactRepeat/shown)*100).toFixed(1)}%`);
