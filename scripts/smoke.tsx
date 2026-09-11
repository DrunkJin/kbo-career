/**
 * 렌더 스모크 테스트 — 주요 화면이 예외 없이 그려지는지 확인합니다.
 * 브라우저 없이 돌기 때문에 배포 전 크래시를 빠르게 잡아냅니다.
 */
import { renderToString } from "react-dom/server";
import { App } from "../src/App";
import { Career } from "../src/components/Career";
import { OfferModal } from "../src/components/Market";
import { RecordsTab } from "../src/components/Records";
import { Retire } from "../src/components/Retire";
import { SeasonResultModal } from "../src/components/SeasonResult";
import { buildOffers, projectImpact, roleChange, simulateSeason } from "../src/game/engine";
import { initialState, reducer, type GameState } from "../src/game/store";
import type { Position } from "../src/game/types";

let fails = 0;
const check = (name: string, fn: () => string) => {
  try {
    const html = fn();
    if (!html || html.length < 20) throw new Error("출력이 비어 있음");
    console.log(`  ok   ${name} (${html.length}자)`);
  } catch (e) {
    fails++;
    console.log(`  FAIL ${name}: ${(e as Error).message}`);
  }
};

for (const pos of ["내야수", "투수", "포수", "외야수"] as Position[]) {
  console.log(`\n■ ${pos}`);
  check("셋업 화면", () => renderToString(<App />));

  let s: GameState = reducer(initialState(), { type: "START", name: "테스트", position: pos });

  // 이벤트가 뜰 때까지 진행
  for (let i = 0; i < 10 && !s.event; i++) s = reducer(s, { type: "ADVANCE" });
  check("커리어 탭 (이벤트)", () =>
    renderToString(
      <Career
        p={s.player} event={s.event} headline={s.headline} feed={s.feed}
        impacts={s.impacts} roleShift={s.roleShift} blocked={false}
        onAdvance={() => {}} onFastForward={() => {}} onChoose={() => {}}
      />,
    ),
  );

  // 선택 → 임팩트 표시
  if (s.event) s = reducer(s, { type: "CHOOSE", choice: s.event.choices[0] });
  check("커리어 탭 (임팩트)", () =>
    renderToString(
      <Career
        p={s.player} event={null} headline={s.headline} feed={s.feed}
        impacts={s.impacts} roleShift={s.roleShift} blocked={false}
        onAdvance={() => {}} onFastForward={() => {}} onChoose={() => {}}
      />,
    ),
  );

  // 시즌 결산
  const result = simulateSeason(s.player);
  const after = { ...s.player, seasons: [...s.player.seasons, {
    year: s.player.year, age: s.player.age, team: s.player.contract.team,
    league: s.player.contract.league, ovr: s.player.ovr, role: result.role,
    stat: result.stat, awards: result.awards, teamResult: result.teamResult,
  }] };
  check("시즌 결산 모달", () =>
    renderToString(
      <SeasonResultModal
        result={result} player={after}
        impacts={projectImpact(s.player, after)}
        roleShift={roleChange(s.player, after)}
        onClose={() => {}}
      />,
    ),
  );

  check("오퍼 모달", () =>
    renderToString(<OfferModal offers={buildOffers(after)} player={after} onAccept={() => {}} />),
  );
  check("기록실", () => renderToString(<RecordsTab p={after} />));
  check("은퇴 리포트", () =>
    renderToString(<Retire p={after} reason="테스트 은퇴" onRestart={() => {}} />),
  );
}

console.log(fails ? `\n실패 ${fails}건` : "\n전부 통과");
process.exit(fails ? 1 : 0);
