import type { Position } from "./types";

export const SCENE_ART = {
  pitching: { caption: "다음 한 공을 준비하는 시간", alt: "아침 햇빛이 드는 불펜에서 투구를 준비하는 선수" },
  batting: { caption: "반복 끝에 찾아오는 나의 스윙", alt: "타격 연습장에서 배트를 들고 공을 기다리는 선수" },
  clubhouse: { caption: "기록표 밖에서 나누는 이야기", alt: "따뜻한 조명 아래 라커룸 벤치에서 대화하는 두 선수" },
  rehab: { caption: "다시 그라운드로 가는 하루", alt: "재활실 벤치에 앉아 트레이너와 회복 계획을 이야기하는 선수" },
  fans: { caption: "나를 응원하는 마음이 도착했다", alt: "라커 안 글러브에 놓인 팬의 편지와 야구공" },
  contract: { caption: "다음 장을 쓰기 전, 한 번의 선택", alt: "계약 서류와 펜, 야구 모자와 글러브가 놓인 책상" },
  farewell: { caption: "야구는 끝나도, 나의 이야기는 남는다", alt: "해 질 무렵 빈 구장을 바라보며 모자를 손에 든 선수의 뒷모습" },
} as const;
export type SceneKind = keyof typeof SCENE_ART;

// 장면은 사건 ID로 지정합니다. 제목의 단어만 보고 다른 포지션이나 사건에 붙이지 않습니다.
const TRAINING = new Set(["camp-focus", "camp-foreign-coach", "rk-first-camp", "rk-dorm", "off-training", "life-winter-camp"]);
const SCENES: Partial<Record<SceneKind, readonly string[]>> = {
  pitching: ["camp-role-change", "camp-new-pitch", "half-slump-pit", "p-velocity-chase", "p-bullpen-switch", "story-p-rookie", "story-p-veteran", "life-era-blowup"],
  batting: ["camp-batting-order", "half-slump-bat", "off-swing-rebuild", "life-slump-deep"],
  clubhouse: ["camp-veteran", "dead-mentor", "mid-starter-fight", "vet-captain", "vet-bench-role", "vet-coach-offer", "life-foreigner", "life-released", "life-veteran-tip", "life-mentor-request", "life-mlb-clubhouse", "t-doosan", "t-samsung"],
  rehab: ["half-injury-risk", "off-surgery", "off-elbow", "life-rehab", "c-knee"],
  fans: ["life-fanletter", "dead-fan-event"],
  contract: ["rk-first-salary", "mid-arbitration", "mid-endorsement", "off-agent", "off-salary", "life-contract-year", "dead-trade"],
};
export function eventScene(id: string, position: Position): SceneKind | null {
  if (TRAINING.has(id)) return position === "투수" ? "pitching" : "batting";
  for (const [kind, ids] of Object.entries(SCENES)) {
    if (!ids.includes(id)) continue;
    if (kind === "batting" && position === "투수") return null;
    if (kind === "pitching" && position !== "투수") return null;
    return kind as SceneKind;
  }
  return null;
}
