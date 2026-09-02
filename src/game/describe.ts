import { ATTR_LABEL, visibleKeys } from "./engine";
import type { AttrKey, Choice, Effect, Position } from "./types";

export type EffectChip = { text: string; tone: "up" | "down" | "flat" };

const sign = (v: number) => (v > 0 ? `+${v}` : `${v}`);

/**
 * 선택지 효과를 사람이 읽을 수 있는 칩 목록으로 바꿉니다.
 * 포지션에 없는 능력치(투수의 파워 등)는 실제로 적용되지 않으므로 표시에서도 뺍니다.
 */
export function describeEffect(e: Effect, position: Position): EffectChip[] {
  const chips: EffectChip[] = [];
  const allowed = visibleKeys(position);

  if (e.focus === "strength") chips.push({ text: "주 능력치 집중 상승", tone: "up" });
  if (e.focus === "weakness") chips.push({ text: "약한 능력치 상승", tone: "up" });

  if (e.attrs) {
    for (const [k, v] of Object.entries(e.attrs) as [AttrKey, number][]) {
      if (!v || !allowed.includes(k)) continue;
      chips.push({ text: `${ATTR_LABEL[k]} ${sign(v)}`, tone: v > 0 ? "up" : "down" });
    }
  }
  const num = (label: string, v?: number) => {
    if (!v) return;
    chips.push({ text: `${label} ${sign(v)}`, tone: v > 0 ? "up" : "down" });
  };
  num("체력", e.health);
  num("멘탈(사기)", e.morale);
  num("명성", e.fame);
  num("구단 신뢰", e.teamTrust);
  if (e.money) chips.push({ text: `수입 ${sign(e.money)}억`, tone: e.money > 0 ? "up" : "down" });
  if (e.injury) chips.push({ text: `부상 · ${e.injury.name}`, tone: "down" });
  if (e.trait) chips.push({ text: `특성 ‘${e.trait}’ 획득`, tone: "up" });
  if (e.intl) chips.push({ text: "국제대회 출전 기록", tone: "flat" });
  if (!chips.length) chips.push({ text: "변화 없음", tone: "flat" });
  return chips;
}

export type OutcomeView = { pct: number; chips: EffectChip[]; tone: Effect["tone"] };

/** 선택지의 결과들을 확률(%)과 함께 정리합니다. 결과가 하나면 확정입니다. */
export function describeChoice(c: Choice, position: Position): OutcomeView[] {
  const total = c.outcomes.reduce((a, o) => a + o.weight, 0);
  return c.outcomes.map((o) => ({
    pct: Math.round((o.weight / total) * 100),
    chips: describeEffect(o.effect, position),
    tone: o.effect.tone ?? "neutral",
  }));
}

export const RISK_DESC: Record<Choice["risk"], string> = {
  안정: "결과가 정해져 있습니다",
  도전: "성공 확률이 있고, 실패해도 손해가 크지 않습니다",
  무모: "크게 얻거나 크게 잃습니다",
};

/** 시즌 WAR 기준 등급. 심사가 아니라 감을 잡기 위한 표시입니다. */
export function seasonGrade(war: number, games: number) {
  if (games < 10) return { grade: "—", label: "출전이 거의 없었습니다" };
  if (war >= 5) return { grade: "S", label: "리그 최상위 시즌" };
  if (war >= 3.5) return { grade: "A", label: "올스타급 시즌" };
  if (war >= 2) return { grade: "B", label: "확실한 주전급" };
  if (war >= 0.8) return { grade: "C", label: "평균 수준 · 자리는 지킴" };
  if (war >= 0) return { grade: "D", label: "백업 수준 · 입지 불안" };
  return { grade: "F", label: "팀에 손해를 끼친 시즌" };
}

/** 화면에 나오는 용어 설명 */
export const TERMS: Record<string, string> = {
  OVR: "종합 능력치. 포지션별 가중 평균이며, 리그 평균보다 높을수록 주전·상위 리그 진출에 유리합니다.",
  "리그 대비": "내 OVR에서 현재 리그 평균 OVR을 뺀 값. +면 리그에서 통하는 선수, -면 로스터 경쟁 중입니다.",
  잠재력: "능력치가 올라갈 수 있는 상한. 등급(S~D)만 공개되며 훈련으로도 이 위로는 거의 못 올라갑니다.",
  WAR: "대체 선수 대비 승리 기여. 2 이상이면 주전급, 4 이상이면 올스타급, 0 이하면 백업보다 못한 시즌입니다.",
  ERA: "9이닝당 평균 자책점. 낮을수록 좋습니다. 3.00 이하면 에이스급입니다.",
  WHIP: "이닝당 허용한 안타+볼넷. 1.20 이하면 매우 좋습니다.",
  타율: "안타 ÷ 타수. .300 이상이면 정상급입니다.",
  출루율: "타석당 출루 비율. 볼넷도 포함됩니다.",
  장타율: "타수당 누타수. 장타력을 나타냅니다.",
  체력: "낮으면 부상 확률이 오르고 시즌 성적이 떨어집니다. 오프시즌 휴식으로 회복됩니다.",
  멘탈: "사기. 낮으면 성적이 흔들리고 스캔들 이벤트가 열립니다. (능력치 ‘멘탈’과는 다릅니다)",
  명성: "인지도. 높으면 대표팀·광고·인터뷰 이벤트가 열리고 계약 규모에 반영됩니다.",
  "구단 신뢰": "구단이 당신을 믿는 정도. 30 아래로 떨어지면 방출·트레이드 대상이 됩니다.",
  연봉: "이번 계약의 연봉. 시즌이 끝날 때마다 누적 수입에 더해집니다.",
  "잔여 계약": "계약이 끝나면 오퍼가 도착합니다. 성적이 좋으면 상위 리그 오퍼도 옵니다.",
};
