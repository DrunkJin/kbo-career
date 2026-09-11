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
