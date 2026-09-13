import { useState } from "react";
import { Modal } from "./Modal";

const STEPS = [
  {
    eyebrow: "1 / 4 · 한 시즌의 흐름",
    title: "시즌은 다섯 칸으로 흘러갑니다",
    body: "스프링캠프 → 전반기 → 후반기 → 시즌 결산 → 오프시즌. ‘진행하기’를 누르면 다음 칸으로 넘어가고, 칸마다 사건이 하나씩 터집니다. 사건이 뜨면 선택지를 고를 때까지 진행되지 않습니다.",
    visual: ["스프링캠프", "전반기", "후반기", "결산", "오프시즌"],
  },
  {
    eyebrow: "2 / 4 · 선택지 읽는 법",
    title: "선택지마다 얻는 것과 잃는 것이 적혀 있습니다",
    body: "초록 칩은 오르는 것, 빨간 칩은 내려가는 것입니다. 결과가 여러 개면 확률(%)이 함께 표시됩니다. 안정·도전·무모는 선택의 성향입니다. 실제 성공 확률과 손실은 각 선택지의 칩을 확인하세요.",
    chips: [
      { t: "구위 +2", tone: "up" },
      { t: "구단 신뢰 +14", tone: "up" },
      { t: "체력 -12", tone: "down" },
      { t: "67% 성공 · 33% 실패", tone: "flat" },
    ],
  },
  {
    eyebrow: "3 / 4 · 숫자 보는 법",
    title: "OVR과 ‘리그 대비’ 두 개만 보면 됩니다",
    body: "OVR은 종합 능력치, 리그 대비는 내 OVR에서 리그 평균을 뺀 값입니다. 높을수록 유리하지만 투수의 체력 등도 보직에 영향을 줍니다. 현재 보직은 시즌 헤더에서 확인하세요. 점선 밑줄 용어를 누르거나 마우스를 올리면 설명이 나옵니다.",
    stat: [
      { b: "56", s: "OVR" },
      { b: "+4", s: "리그 대비" },
      { b: "2.1", s: "WAR" },
    ],
  },
  {
    eyebrow: "4 / 4 · 목표",
    title: "‘다음 목표’를 따라가면 됩니다",
    body: "커리어 화면에서 다음 목표를 확인하세요. 이벤트 선택 중에는 이야기가 먼저 나오고, 시즌 전망과 계약은 펼쳐 볼 수 있습니다. 계약이 끝나면 오퍼를 비교하고, 은퇴하면 커리어 리포트를 받습니다. 모바일 하단 메뉴에서 선수·기록실·이적 시장으로 이동할 수 있습니다.",
    goal: "퓨처스에서 성장 → OVR 64부터 계약 협상 시 1군 콜업 대상",
  },
];

export function Guide({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <Modal label="게임 안내" onClose={onClose}>
      <div className="sheet guide">
        <span className="eyebrow">{s.eyebrow}</span>
        <h2>{s.title}</h2>
        <p>{s.body}</p>

        {s.visual && (
          <div className="guide-steps">
            {s.visual.map((v, k) => (
              <div key={v} className={k === 1 ? "now" : k < 1 ? "done" : ""}>{v}</div>
            ))}
          </div>
        )}
        {s.chips && (
          <div className="fx">
            {s.chips.map((c) => (
              <span key={c.t} className={c.tone}>{c.t}</span>
            ))}
          </div>
        )}
        {s.stat && (
          <div className="statline">
            {s.stat.map((x) => (
              <div key={x.s}><b>{x.b}</b><small>{x.s}</small></div>
            ))}
          </div>
        )}
        {s.goal && (
          <div className="goal-chip" style={{ marginTop: 4 }}>
            <b>다음 목표</b> {s.goal}
          </div>
        )}

        <div className="guide-nav">
          <div className="dots" aria-hidden>
            {STEPS.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {i > 0 && <button className="btn ghost" onClick={() => setI(i - 1)}>이전</button>}
            {!last && <button className="btn ghost" onClick={onClose}>건너뛰기</button>}
            <button className="btn primary" onClick={() => (last ? onClose() : setI(i + 1))}>
              {last ? "시작하기 →" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
