/**
 * 연차별 이벤트 — 프로 몇 년차인지에 따라 등장합니다.
 * (minSeason / maxSeason 은 "프로 n년차", 첫 시즌이 1년차)
 */
import { LEAGUES } from "./data";
import type { GameEvent, PlayerState } from "./types";

const edge = (s: PlayerState) => s.ovr - LEAGUES[s.contract.league].level;

export const CAREER_EVENTS: GameEvent[] = [
  /* ══════════ 1~2년차 · 루키 ══════════ */
  {
    id: "rk-first-camp",
    phases: [0],
    tag: "루키",
    title: "첫 스프링캠프",
    body: "프로의 공은 달랐습니다. 옆 라커의 선배는 당신이 TV로 보던 사람입니다. 무엇부터 하겠습니까?",
    maxSeason: 1,
    choices: [
      {
        label: "선배들 훈련량을 그대로 따라간다",
        hint: "빠르게 적응하지만 몸이 버텨줘야 합니다",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { focus: "strength", teamTrust: 10, text: "따라붙었습니다. 코칭스태프가 당신의 이름을 외웠습니다.", tone: "good" } },
          { weight: 2, effect: { health: -20, morale: -8, text: "몸이 먼저 무너졌습니다. 프로의 훈련량은 달랐습니다.", tone: "bad" } },
        ],
      },
      {
        label: "내 페이스대로 기초부터",
        hint: "안전하게 · 체력 유지",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { durability: 2, mental: 1 }, health: 8, text: "무리하지 않았습니다. 긴 시즌을 버틸 몸을 만들었습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "rk-rookie-race",
    phases: [2],
    tag: "신인왕 경쟁",
    title: "신인왕 레이스",
    body: "기자단 투표가 한 달 앞입니다. 경쟁자는 옆 동네 구단의 그 선수입니다.",
    maxSeason: 1,
    when: (s) => LEAGUES[s.contract.league].tier >= 3 && edge(s) >= -3,
    choices: [
      {
        label: "매 경기 전력으로 붙는다",
        hint: "명성 큰 폭 상승 · 체력 소모",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { fame: 22, morale: 12, health: -14, attrs: { mental: 2 }, text: "9월을 불태웠습니다. 표가 당신 쪽으로 기울었습니다.", tone: "good" } },
          { weight: 2, effect: { fame: 4, health: -18, morale: -10, text: "무리한 만큼 성적이 떨어졌습니다. 신인왕은 남의 것이 됐습니다.", tone: "bad" } },
        ],
      },
      {
        label: "상 욕심은 버리고 배운다",
        hint: "성장 · 체력 보존",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { focus: "weakness", health: 6, teamTrust: 8, text: "타이틀 대신 실력을 챙겼습니다. 커리어는 깁니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "rk-dorm",
    phases: [1],
    tag: "루키",
    title: "숙소의 밤",
    body: "2군 숙소의 밤은 깁니다. 같은 방 동기는 이미 잠들었고, 당신은 천장을 봅니다.",
    maxSeason: 2,
    when: (s) => LEAGUES[s.contract.league].tier <= 2,
    choices: [
      {
        label: "새벽까지 배트를 돌린다",
        hint: "성장 · 체력 소모",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { focus: "strength", health: -10, morale: -4, text: "손에 물집이 잡혔습니다. 그래도 공이 맞기 시작했습니다.", tone: "good" } },
          { weight: 1, effect: { health: -16, morale: -12, text: "몸만 축났습니다. 요령 없는 노력은 배신하기도 합니다.", tone: "bad" } },
        ],
      },
      {
        label: "동기들과 이야기하며 버틴다",
        hint: "멘탈 회복 · 팀 신뢰",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { morale: 16, teamTrust: 8, attrs: { mental: 2 }, text: "혼자가 아니라는 게 이렇게 큰 일인 줄 몰랐습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "rk-first-salary",
    phases: [4],
    tag: "연봉 협상",
    title: "첫 연봉 협상",
    body: "구단이 내민 종이에는 생각보다 작은 숫자가 적혀 있습니다. 옆에 에이전트도 없습니다.",
    minSeason: 1,
    maxSeason: 3,
    choices: [
      {
        label: "그냥 사인한다",
        hint: "구단 신뢰 · 실리 없음",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { teamTrust: 12, morale: -4, text: "군말 없이 사인했습니다. 프런트는 당신을 편하게 봅니다.", tone: "neutral" } },
        ],
      },
      {
        label: "내 기록을 들고 버틴다",
        hint: "수입 증가 가능 · 관계 악화 위험",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { money: 1.2, morale: 10, attrs: { mental: 2 }, text: "숫자를 들이밀었더니 액수가 올라갔습니다. 프로는 증명하는 사람입니다.", tone: "good" } },
          { weight: 2, effect: { teamTrust: -14, morale: -8, text: "「신인이 벌써?」 협상은 짧게 끝났습니다.", tone: "bad" } },
        ],
      },
    ],
  },

  /* ══════════ 3~8년차 · 자리 잡기 ══════════ */
  {
    id: "mid-starter-fight",
    phases: [0],
    tag: "주전 경쟁",
    title: "자리를 두고 붙는다",
    body: "구단이 같은 포지션에 외국인 선수를 데려왔습니다. 개막 엔트리는 둘 중 하나입니다.",
    minSeason: 3,
    maxSeason: 8,
    when: (s) => edge(s) < 5,
    choices: [
      {
        label: "정면으로 경쟁한다",
        hint: "이기면 주전 · 지면 벤치",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { focus: "strength", teamTrust: 14, morale: 12, text: "시범경기에서 압도했습니다. 자리는 당신 것입니다.", tone: "good" } },
          { weight: 2, effect: { morale: -16, teamTrust: -6, text: "밀렸습니다. 개막을 벤치에서 맞습니다.", tone: "bad" } },
        ],
      },
      {
        label: "수비 포지션을 하나 더 익힌다",
        hint: "유틸리티 · 출전 기회 확보",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { defense: 3, mental: 2 }, teamTrust: 12, text: "여러 자리를 소화하며 라인업에 남았습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "mid-marriage",
    phases: [4],
    tag: "개인사",
    title: "인생의 결정",
    body: "오래 만난 사람이 있습니다. 야구만 보고 살아온 시간에, 다른 이름이 하나 들어옵니다.",
    minSeason: 4,
    when: (s) => s.age >= 26 && !s.traits.includes("가장"),
    choices: [
      {
        label: "결혼한다",
        hint: "멘탈 안정 · 책임감",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { trait: "가장", morale: 22, attrs: { mental: 4 }, money: -1, text: "돌아갈 집이 생겼습니다. 부진한 날에도 밥은 따뜻합니다.", tone: "good" } },
        ],
      },
      {
        label: "지금은 야구가 먼저다",
        hint: "훈련 집중 · 관계 위험",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { focus: "strength", morale: -8, text: "야구를 택했습니다. 대신 겨울 내내 배트를 놓지 않았습니다.", tone: "neutral" } },
          { weight: 1, effect: { morale: -18, text: "그 사람은 떠났습니다. 야구는 남았지만 마음이 헛돕니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "mid-arbitration",
    phases: [4],
    tag: "연봉조정",
    title: "연봉조정 신청",
    body: "구단과 액수가 끝내 좁혀지지 않았습니다. 조정위원회로 갈 수 있지만, 이긴 선수는 손에 꼽습니다.",
    minSeason: 4,
    when: (s) => LEAGUES[s.contract.league].tier >= 3 && s.teamTrust < 70,
    choices: [
      {
        label: "조정 신청을 강행한다",
        hint: "크게 얻거나, 관계가 상하거나",
        risk: "무모",
        outcomes: [
          { weight: 1, effect: { money: 3, fame: 10, teamTrust: -18, attrs: { mental: 3 }, text: "이겼습니다. 드문 일입니다. 대신 프런트의 눈빛이 달라졌습니다.", tone: "good" } },
          { weight: 2, effect: { teamTrust: -22, morale: -12, text: "졌습니다. 구단이 제시한 액수 그대로, 관계만 나빠졌습니다.", tone: "bad" } },
        ],
      },
      {
        label: "한발 물러선다",
        hint: "관계 유지",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { teamTrust: 14, morale: -6, text: "도장을 찍었습니다. 다음 협상을 기약합니다.", tone: "neutral" } },
        ],
      },
    ],
  },
  {
    id: "mid-endorsement",
    phases: [4],
    tag: "스폰서",
    title: "용품 계약 제안",
    body: "글러브와 배트를 대는 회사가 바뀔 수 있습니다. 조건은 좋지만 손에 익은 물건을 놓아야 합니다.",
    minSeason: 3,
    when: (s) => s.fame >= 40,
    choices: [
      {
        label: "큰 계약을 잡는다",
        hint: "수입 · 적응 리스크",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { money: 2.5, fame: 8, text: "새 장비가 손에 붙었습니다. 통장도 두꺼워졌습니다.", tone: "good" } },
          { weight: 2, effect: { money: 2.5, focus: "weakness", morale: -10, text: "장비가 어색합니다. 감각이 돌아오는 데 시간이 걸립니다.", tone: "bad" } },
        ],
      },
      {
        label: "쓰던 것을 쓴다",
        hint: "감각 유지",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { mental: 2 }, morale: 6, text: "손에 익은 물건이 최고입니다. 바꿀 이유가 없었습니다.", tone: "good" } },
        ],
      },
    ],
  },

  /* ══════════ 7년차 이상 · 중심 선수 ══════════ */
  {
    id: "vet-captain",
    phases: [0],
    tag: "주장",
    title: "주장직 제안",
    body: "감독이 주장 완장을 내밉니다. 팀을 대표한다는 건 성적 외의 짐도 진다는 뜻입니다.",
    minSeason: 7,
    when: (s) => s.teamTrust >= 55 && s.age >= 28 && !s.traits.includes("주장"),
    choices: [
      {
        label: "완장을 받는다",
        hint: "팀 신뢰·멘탈 · 부담",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { trait: "주장", teamTrust: 22, attrs: { mental: 5 }, fame: 10, morale: -4, text: "라커룸의 중심이 됐습니다. 어린 선수들이 당신을 봅니다.", tone: "good" } },
          { weight: 1, effect: { trait: "주장", teamTrust: 10, morale: -16, health: -8, text: "성적과 책임을 동시에 지는 일은 생각보다 무겁습니다.", tone: "bad" } },
        ],
      },
      {
        label: "내 야구에 집중하겠다고 한다",
        hint: "개인 성적 집중",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { focus: "strength", teamTrust: -8, text: "완장 대신 배트를 들었습니다. 증명은 성적으로 합니다.", tone: "neutral" } },
        ],
      },
    ],
  },
  {
    id: "vet-milestone",
    phases: [2],
    tag: "대기록",
    title: "통산 기록이 눈앞에",
    body: "기록실 직원이 조용히 알려줍니다. 이번 시즌 안에 손에 닿는 숫자가 있다고.",
    minSeason: 9,
    when: (s) => s.fame >= 45,
    choices: [
      {
        label: "기록을 향해 매 경기 나선다",
        hint: "명성 · 체력 소모",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { fame: 24, morale: 14, health: -12, text: "해냈습니다. 전광판에 숫자가 걸리고 관중이 일어섰습니다.", tone: "good" } },
          { weight: 2, effect: { fame: 2, health: -16, morale: -12, text: "몇 개를 남기고 시즌이 끝났습니다. 내년에도 몸이 버텨줄지 모릅니다.", tone: "bad" } },
        ],
      },
      {
        label: "팀 성적이 먼저다",
        hint: "팀 신뢰 · 체력 보존",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { teamTrust: 18, morale: 8, health: 6, text: "개인 기록은 따라오는 것이라며 웃었습니다. 더그아웃이 조용히 박수쳤습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "vet-bench-role",
    phases: [0],
    tag: "역할 변화",
    title: "벤치로 밀려나다",
    body: "감독이 어렵게 말을 꺼냅니다. 올해는 대타와 백업으로 생각하고 있다고.",
    minSeason: 10,
    when: (s) => edge(s) < 0 && s.age >= 33,
    choices: [
      {
        label: "받아들이고 대타 전문가가 된다",
        hint: "멘탈·신뢰 · 출전 감소",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { mental: 5, contact: 2, control: 2 }, teamTrust: 18, morale: -6, text: "한 타석에 모든 걸 거는 법을 배웠습니다. 대타 성공률이 팀 최고입니다.", tone: "good" } },
        ],
      },
      {
        label: "마지막으로 주전 경쟁에 뛰어든다",
        hint: "되돌리거나, 완전히 밀리거나",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { focus: "strength", morale: 16, health: -14, teamTrust: 8, text: "노장의 반란. 다시 라인업에 이름이 올랐습니다.", tone: "good" } },
          { weight: 3, effect: { morale: -20, teamTrust: -10, health: -12, text: "몸이 마음을 따라가지 못했습니다. 이제 벤치가 당신의 자리입니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "vet-coach-offer",
    phases: [4],
    tag: "제2의 커리어",
    title: "코치 제안",
    body: "구단이 조심스럽게 묻습니다. 은퇴 후에 함께할 생각이 있느냐고.",
    minSeason: 12,
    when: (s) => s.age >= 34 && !s.traits.includes("지도자 내정"),
    choices: [
      {
        label: "미래를 약속받는다",
        hint: "안정 · 마음의 짐을 던다",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { trait: "지도자 내정", money: 1, morale: 10, teamTrust: 16, text: "은퇴 후가 정해졌습니다. 마음 한켠이 가벼워집니다.", tone: "good" } },
        ],
      },
      {
        label: "아직 선수다",
        hint: "현역 집중",
        risk: "도전",
        outcomes: [
          { weight: 1, effect: { morale: 18, attrs: { mental: 3 }, text: "그 얘긴 나중에 하자고 했습니다. 아직 끝낼 생각이 없습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "vet-farewell",
    phases: [2],
    tag: "마지막",
    title: "은퇴 투어",
    body: "이번이 마지막일지 모른다는 이야기가 돕니다. 원정 구장마다 상대 팬들이 기립합니다.",
    minSeason: 14,
    when: (s) => s.age >= 36 && s.fame >= 40,
    choices: [
      {
        label: "한 경기 한 경기 눈에 담는다",
        hint: "명성 · 멘탈",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { fame: 18, morale: 24, attrs: { mental: 4 }, text: "야구가 이렇게 좋았던 적이 있었나 싶습니다.", tone: "good" } },
        ],
      },
      {
        label: "아직 은퇴할 생각 없다고 못 박는다",
        hint: "현역 연장 의지",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { morale: 16, health: 8, attrs: { mental: 3 }, text: "박수는 나중에 받겠다고 했습니다. 몸을 더 혹독하게 굴렸습니다.", tone: "good" } },
          { weight: 1, effect: { fame: -8, morale: -10, text: "여론은 미련이라고 불렀습니다. 말이 길어질수록 초라해집니다.", tone: "bad" } },
        ],
      },
    ],
  },
];
