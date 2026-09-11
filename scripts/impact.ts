import { computeOvr, createPlayer, projectSeason, projectImpact, roleChange, roleFor, statSummary } from "../src/game/engine";
import type { PlayerState } from "../src/game/types";

const mk = (pos: any, ovrBoost = 0): PlayerState => {
  const p = createPlayer("테스트", pos);
  p.contract = { team: "LG 트윈스", league: "KBO", salary: 3, years: 3, left: 2, label: "t" };
  for (const k of Object.keys(p.attrs) as any[]) p.attrs[k] = 66 + ovrBoost;
  p.health = 90; p.morale = 70;
  p.ovr = computeOvr(p.attrs, p.position);   // 능력치를 바꿨으면 OVR 도 다시 계산해야 합니다
  p.potential = 99;
  return p;
};

for (const pos of ["내야수", "투수", "포수"] as const) {
  const base = mk(pos);
  console.log(`\n=== ${pos} (모든 능력치 66, KBO 평균 66) ===`);
  console.log(`OVR ${base.ovr} · 역할 ${roleFor(base)} · 예상: ${statSummary(projectSeason(base))}`);

  // 능력치 +2 했을 때 성적이 얼마나 움직이는가
  const keys = pos === "투수" ? ["velocity","control","movement","stamina","durability"] : ["contact","power","eye","speed","defense","durability"];
  for (const k of keys) {
    const after = structuredClone(base);
    (after.attrs as any)[k] += 3;
    after.ovr = computeOvr(after.attrs, after.position);
    const im = projectImpact(base, after);
    const rc = roleChange(base, after);
    console.log(`  ${k} +3 → ${im.map(x=>`${x.label} ${x.before}→${x.after} (${x.delta})`).join(", ") || "변화 없음"}${rc?` [역할 ${rc.from}→${rc.to}]`:""}`);
  }
}
