import { LEAGUES } from "./data";
import { rand, tournamentFor } from "./engine";
import type { Choice, GameEvent, PlayerState } from "./types";

const edge = (s: PlayerState) => s.ovr - LEAGUES[s.contract.league].level;
const lastWar = (s: PlayerState) =>
  s.seasons.length ? s.seasons[s.seasons.length - 1].stat.war : 0;

/** 단일 결과 선택지 */
const sure = (
  label: string,
  hint: string,
  risk: Choice["risk"],
  effect: Choice["outcomes"][number]["effect"],
): Choice => ({ label, hint, risk, outcomes: [{ weight: 1, effect }] });

export const EVENTS: GameEvent[] = [
  /* ──────────────── 스프링캠프 (phase 0) ──────────────── */
  {
    id: "camp-focus",
    phases: [0],
    tag: "SPRING CAMP",
    title: "스프링캠프 훈련 방침",
    body: "코칭스태프가 올해 당신의 훈련 주제를 묻습니다. 무엇에 시간을 쏟겠습니까?",
    choices: [
      {
        label: "주무기를 극한까지 다듬는다",
        hint: "주 능력치 집중 강화 · 성공률 높음",
        risk: "안정",
        outcomes: [
          { weight: 3, effect: { focus: "strength", text: "주무기가 한 단계 더 날카로워졌습니다.", tone: "good" } },
        ],
      },
      {
        label: "약점을 정면으로 뜯어고친다",
        hint: "약한 능력치 대폭 개선 · 실패 시 시즌 초반 부진",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { focus: "weakness", morale: 5, text: "폼 교정이 완벽하게 자리 잡았습니다.", tone: "good" } },
          { weight: 1, effect: { morale: -12, health: -6, text: "새 폼이 몸에 붙지 않았습니다. 감각이 흔들립니다.", tone: "bad" } },
        ],
      },
      sure("몸을 만드는 데만 집중한다", "체력·내구 회복", "안정", {
        attrs: { durability: 2, stamina: 1 },
        health: 12,
        text: "시즌을 버틸 몸을 만들었습니다.",
        tone: "good",
      }),
    ],
  },
  {
    id: "camp-veteran",
    phases: [0],
    tag: "라커룸",
    title: "베테랑의 호출",
    body: "팀의 최고참이 당신을 따로 부릅니다. \"요즘 애들은 야구를 쉽게 하더라.\"",
    when: (s) => s.age <= 26,
    choices: [
      sure("고개 숙이고 배운다", "멘탈 · 팀 신뢰 상승", "안정", {
        attrs: { mental: 2 },
        teamTrust: 10,
        text: "베테랑이 당신을 챙기기 시작했습니다. 라커룸에 자리가 생겼습니다.",
        tone: "good",
      }),
      {
        label: "내 방식대로 하겠다고 말한다",
        hint: "성장 폭 크지만 팀 내 고립 위험",
        risk: "도전",
        outcomes: [
          { weight: 1, effect: { attrs: { mental: 4 }, morale: 8, teamTrust: -8, text: "당돌함이 오히려 신뢰를 얻었습니다. 당신은 당신입니다.", tone: "good" } },
          { weight: 1, effect: { teamTrust: -18, morale: -6, text: "라커룸의 공기가 차가워졌습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "camp-position-change",
    phases: [0],
    tag: "구단 요청",
    title: "포지션 변경 제안",
    body: "구단이 자리 하나를 비워두고 당신을 바라봅니다. 익숙한 자리를 떠나면 출전 기회가 늘어납니다.",
    when: (s) => edge(s) < 1 && s.seasons.length >= 1,
    choices: [
      sure("팀이 필요한 자리로 간다", "수비 + 팀 신뢰 · 주 능력치 소폭 정체", "안정", {
        attrs: { defense: 4, mental: 1 },
        teamTrust: 14,
        text: "새 포지션에서 출전 시간을 확보했습니다.",
        tone: "good",
      }),
      sure("내 자리를 지키고 경쟁한다", "주전 경쟁 · 신뢰 하락", "도전", {
        attrs: { mental: 2 },
        teamTrust: -8,
        morale: 6,
        text: "경쟁을 선택했습니다. 결과로 증명해야 합니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "camp-wbc",
    phases: [0],
    tag: "국가대표",
    title: "대표팀 승선 요청",
    body: "국제대회 예비 엔트리에 이름이 올랐습니다. 영광이지만 시즌 준비 기간을 통째로 씁니다.",
    when: (s) => s.ovr >= 70 && s.fame >= 35 && !!tournamentFor(s.year),
    choices: [
      {
        label: "태극마크를 단다",
        hint: "명성 대폭 상승 · 체력 소모 · 메달 가능",
        risk: "도전",
        outcomes: [
          {
            weight: 3,
            effect: {
              fame: 26, morale: 14, health: -14, attrs: { mental: 3 },
              intl: { result: "우승", medal: "금", note: "대회 베스트 나인 선정" },
              text: "금메달. 시상대 맨 위에서 애국가를 들었습니다.",
              tone: "good",
            },
          },
          {
            weight: 3,
            effect: {
              fame: 14, morale: 8, health: -14, attrs: { mental: 2 },
              intl: { result: "준우승", medal: "은", note: "결승 진출" },
              text: "결승에서 아쉽게 졌습니다. 그래도 전국이 당신의 이름을 외웠습니다.",
              tone: "good",
            },
          },
          {
            weight: 2,
            effect: {
              fame: 6, health: -16,
              intl: { result: "4강 탈락", medal: "동", note: "주전 출전" },
              text: "동메달. 아쉬움이 남는 대회였습니다.",
              tone: "neutral",
            },
          },
          {
            weight: 2,
            effect: {
              fame: -10, health: -18, morale: -12,
              intl: { result: "조별리그 탈락", medal: "", note: "부진" },
              text: "조별리그 탈락. 여론의 화살이 대표팀을 향했습니다.",
              tone: "bad",
            },
          },
        ],
      },
      sure("소속팀 시즌에 집중한다", "체력 보존 · 명성 소폭 하락", "안정", {
        health: 8,
        fame: -4,
        teamTrust: 6,
        text: "구단은 당신의 판단을 반겼습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "camp-wbc-final",
    phases: [2],
    tag: "국가대표",
    title: "국제대회 대표팀 추가 발탁",
    body: "부상 선수 대체 자원으로 급하게 호출이 왔습니다. 지금 몸 상태로 갈 수 있겠습니까?",
    when: (s) => s.ovr >= 66 && !!tournamentFor(s.year) && s.health >= 70 && !s.intl.some((x) => x.year === s.year),
    choices: [
      {
        label: "짐을 싼다",
        hint: "국제대회 기록 · 체력 소모",
        risk: "도전",
        outcomes: [
          {
            weight: 2,
            effect: {
              fame: 18, morale: 10, health: -12,
              intl: { result: "우승", medal: "금", note: "대체 발탁 후 활약" },
              text: "대체 선수로 들어가 우승의 주역이 됐습니다. 인생은 알 수 없습니다.",
              tone: "good",
            },
          },
          {
            weight: 3,
            effect: {
              fame: 6, health: -12,
              intl: { result: "8강 탈락", medal: "", note: "백업 출전" },
              text: "짧은 출전 기회. 경험만 얻고 돌아왔습니다.",
              tone: "neutral",
            },
          },
        ],
      },
      sure("정중히 고사한다", "체력 유지", "안정", {
        health: 6,
        fame: -3,
        text: "몸을 지키기로 했습니다.",
        tone: "neutral",
      }),
    ],
  },

  /* ──────────────── 전반기 (phase 1) ──────────────── */
  {
    id: "half-slump",
    phases: [1],
    tag: "부진",
    title: "길어지는 슬럼프",
    body: "타석이, 마운드가 낯설게 느껴집니다. 데이터는 이미 상대에게 넘어갔습니다.",
    when: (s) => s.seasons.length >= 1 && lastWar(s) < 2.2,
    choices: [
      sure("야간 특타 · 불펜 피칭", "능력치 상승 · 체력 감소", "안정", {
        attrs: { contact: 2, control: 2 },
        health: -12,
        text: "밤마다 남아 훈련했습니다. 감각이 조금씩 돌아옵니다.",
        tone: "good",
      }),
      {
        label: "영상 분석가에게 전부 맡긴다",
        hint: "크게 반등하거나, 더 헤맬 수 있음",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { mental: 3, eye: 3, movement: 3 }, morale: 10, text: "원인을 찾았습니다. 해답은 데이터 안에 있었습니다.", tone: "good" } },
          { weight: 2, effect: { morale: -14, text: "생각이 많아졌습니다. 몸이 더 굳습니다.", tone: "bad" } },
        ],
      },
      sure("완전히 쉬어간다", "멘탈·체력 회복", "안정", {
        health: 14,
        morale: 12,
        teamTrust: -6,
        text: "며칠 비웠습니다. 머리가 맑아졌습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "half-beanball",
    phases: [1],
    tag: "벤치클리어링",
    title: "빈볼 시비",
    body: "상대 투수의 공이 등 뒤로 지나갔습니다. 양 팀 더그아웃이 술렁입니다.",
    choices: [
      {
        label: "마운드로 걸어나간다",
        hint: "팀 신뢰·명성 상승 · 징계 위험",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { teamTrust: 16, fame: 12, morale: 8, text: "동료들이 전부 뛰쳐나왔습니다. 팀이 하나가 됐습니다.", tone: "good" } },
          { weight: 1, effect: { fame: -10, teamTrust: -4, health: -8, text: "출장 정지 징계. 구단이 벌금을 물었습니다.", tone: "bad" } },
        ],
      },
      sure("배트로 갚아준다", "집중력 상승", "도전", {
        attrs: { mental: 3, power: 2, velocity: 1 },
        morale: 8,
        text: "다음 타석에서 담장을 넘겼습니다. 가장 완벽한 복수였습니다.",
        tone: "good",
      }),
      sure("웃으며 1루로 걸어간다", "무난", "안정", {
        attrs: { mental: 1 },
        text: "감정을 삼켰습니다. 프로다운 대처였습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "half-media",
    phases: [1],
    tag: "미디어",
    title: "인터뷰 요청 쇄도",
    body: "예능 프로그램과 유튜브 채널에서 섭외가 들어왔습니다. 노출은 곧 몸값입니다.",
    when: (s) => s.fame >= 30,
    choices: [
      {
        label: "카메라 앞에 선다",
        hint: "명성 급상승 · 훈련 시간 손실",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { fame: 20, money: 1.5, health: -6, text: "화제의 인물이 됐습니다. 광고 문의가 붙습니다.", tone: "good" } },
          { weight: 1, effect: { fame: 8, teamTrust: -14, morale: -6, text: "말실수가 헤드라인이 됐습니다. 구단이 불편해합니다.", tone: "bad" } },
        ],
      },
      sure("전부 거절하고 야구만 한다", "능력치 집중", "안정", {
        attrs: { contact: 1, power: 1, control: 1, movement: 1 },
        teamTrust: 8,
        text: "\"성적으로 말하겠습니다.\" 짧은 한 마디만 남겼습니다.",
        tone: "good",
      }),
    ],
  },
  {
    id: "half-injury-risk",
    phases: [1],
    tag: "통증",
    title: "숨기고 있는 통증",
    body: "며칠째 같은 곳이 아픕니다. 경기는 계속되고, 자리는 하나뿐입니다.",
    when: (s) => s.health < 82,
    choices: [
      {
        label: "진통제를 맞고 계속 뛴다",
        hint: "출전 유지 · 큰 부상 위험",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { teamTrust: 14, fame: 8, health: -10, text: "이를 악물고 라인업을 지켰습니다. 더그아웃이 당신을 다시 봅니다.", tone: "neutral" } },
          { weight: 2, effect: { injury: { name: "악화된 근육 파열", severity: 0.6 }, health: -22, text: "결국 그라운드에서 주저앉았습니다. 무리한 대가입니다.", tone: "bad" } },
        ],
      },
      sure("즉시 검진받고 이탈한다", "체력 회복 · 출전 손실", "안정", {
        health: 20,
        teamTrust: -8,
        injury: { name: "예방적 이탈", severity: 0.2 },
        text: "조기에 잡았습니다. 시즌 후반을 위해 남겨둔 선택입니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "half-callup",
    phases: [1],
    tag: "콜업",
    title: "1군 콜업 통보",
    body: "감독이 직접 전화했습니다. \"내일 1군 합류해라. 딱 2주 준다.\"",
    when: (s) => LEAGUES[s.contract.league].tier <= 2 && s.ovr >= LEAGUES[s.contract.league].level + 5,
    choices: [
      {
        label: "가진 걸 전부 쏟아붓는다",
        hint: "명성·신뢰 큰 폭 변동",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { fame: 18, teamTrust: 16, morale: 14, attrs: { mental: 3 }, text: "2주 동안 확실히 각인시켰습니다. 다음 콜업은 편도 티켓일 겁니다.", tone: "good" } },
          { weight: 1, effect: { fame: -5, morale: -12, text: "수준 차이를 느꼈습니다. 다시 2군행 버스에 올랐습니다.", tone: "bad" } },
        ],
      },
      sure("몸 상태를 지키며 조심스럽게", "안정적인 인상", "안정", {
        teamTrust: 6,
        attrs: { mental: 1 },
        text: "무난하게 마쳤습니다. 최소한 눈도장은 찍었습니다.",
        tone: "neutral",
      }),
    ],
  },

  /* ──────────────── 후반기 / 데드라인 (phase 2) ──────────────── */
  {
    id: "dead-trade",
    phases: [2],
    tag: "트레이드 데드라인",
    title: "당신의 이름이 트레이드 명단에",
    body: "기자의 전화가 먼저 왔습니다. 구단은 아직 아무 말이 없습니다.",
    when: (s) => s.seasons.length >= 1,
    choices: [
      sure("구단에 직접 찾아가 담판을 짓는다", "신뢰 또는 결별", "도전", {
        teamTrust: 12,
        morale: -4,
        attrs: { mental: 2 },
        text: "단장이 확답을 줬습니다. \"너는 우리 계획에 있다.\"",
        tone: "good",
      }),
      sure("경기에만 집중한다", "무념무상", "안정", {
        attrs: { mental: 3 },
        morale: -6,
        text: "소문은 소문일 뿐입니다. 당신은 오늘 경기에 나갔습니다.",
        tone: "neutral",
      }),
      {
        label: "이적을 먼저 요청한다",
        hint: "새 팀에서 기회 · 이미지 손상",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { teamTrust: -25, fame: 6, morale: 10, text: "요청이 받아들여졌습니다. 오프시즌 이적 시장이 뜨거워집니다.", tone: "neutral" } },
          { weight: 1, effect: { teamTrust: -30, fame: -12, morale: -10, text: "요청은 거절됐고, 이야기는 새어나갔습니다. 팬들이 등을 돌렸습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "dead-race",
    phases: [2],
    tag: "순위 싸움",
    title: "가을야구 경쟁",
    body: "팀은 반 경기 차 승부에 놓였습니다. 감독은 당신을 매 경기 내보낼 생각입니다.",
    choices: [
      {
        label: "전 경기 출전을 자청한다",
        hint: "신뢰·명성 상승 · 체력 소모 큼",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { teamTrust: 20, fame: 14, health: -18, morale: 8, text: "9월 내내 당신이 팀을 끌었습니다.", tone: "good" } },
          { weight: 1, effect: { injury: { name: "과부하 피로 골절", severity: 0.5 }, health: -25, text: "마지막 2주를 남기고 몸이 무너졌습니다.", tone: "bad" } },
        ],
      },
      sure("로테이션을 지키며 관리받는다", "체력 유지", "안정", {
        health: 6,
        teamTrust: -5,
        text: "감독은 아쉬워했지만 몸은 멀쩡합니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "dead-mentor",
    phases: [2],
    tag: "라커룸",
    title: "신인의 질문",
    body: "갓 올라온 신인이 당신의 루틴을 따라 하고 있습니다. 조언을 구합니다.",
    when: (s) => s.age >= 27,
    choices: [
      sure("전부 알려준다", "멘탈 · 신뢰 상승", "안정", {
        attrs: { mental: 3 },
        teamTrust: 14,
        morale: 6,
        text: "가르치면서 당신도 배웠습니다. 팀 내 위상이 달라집니다.",
        tone: "good",
      }),
      sure("경쟁자다. 선을 긋는다", "개인 훈련 시간 확보", "도전", {
        attrs: { power: 2, contact: 1, movement: 2, velocity: 1 },
        teamTrust: -10,
        text: "냉정하지만 프로의 세계입니다. 당신의 훈련량이 늘었습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "dead-gambling",
    phases: [2],
    tag: "스캔들",
    title: "위험한 제안",
    body: "낯선 번호로 연락이 왔습니다. \"딱 한 경기만 도와주시면 됩니다.\"",
    when: (s) => s.morale < 55 || s.contract.salary < 1,
    choices: [
      sure("즉시 구단과 협회에 신고한다", "명성 상승", "안정", {
        fame: 12,
        teamTrust: 12,
        attrs: { mental: 3 },
        text: "당신은 옳은 일을 했습니다. 리그가 당신을 모범 사례로 언급했습니다.",
        tone: "good",
      }),
      sure("읽고 무시한다", "변화 없음", "안정", {
        attrs: { mental: 1 },
        text: "번호를 차단했습니다. 아무 일도 없었습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "dead-clutch",
    phases: [2],
    tag: "결정적 순간",
    title: "9회말, 만원 관중",
    body: "한 점 차. 당신이 그 자리에 서 있습니다. 모두가 당신을 보고 있습니다.",
    when: (s) => edge(s) >= -2,
    choices: [
      {
        label: "정면승부",
        hint: "영웅이 되거나 역적이 되거나",
        risk: "무모",
        outcomes: [
          { weight: 5, effect: { fame: 26, morale: 16, teamTrust: 14, attrs: { mental: 4 }, trait: "클러치", text: "해냈습니다. 구장이 무너질 듯 울렸습니다. 당신의 이름이 하이라이트를 채웁니다.", tone: "good" } },
          { weight: 4, effect: { fame: -14, morale: -18, text: "실패했습니다. 정적 속에서 걸어 나왔습니다. 이 장면은 오래 회자될 겁니다.", tone: "bad" } },
        ],
      },
      sure("안전한 선택을 한다", "무난한 결과", "안정", {
        attrs: { mental: 1 },
        morale: -2,
        text: "무리하지 않았습니다. 경기는 다음 타자에게 넘어갔습니다.",
        tone: "neutral",
      }),
    ],
  },

  /* ──────────────── 오프시즌 (phase 4) ──────────────── */
  {
    id: "off-training",
    phases: [4],
    tag: "오프시즌",
    title: "겨울을 어떻게 보낼 것인가",
    body: "시즌이 끝났습니다. 이 몇 달이 다음 시즌의 당신을 만듭니다.",
    choices: [
      {
        label: "해외 개인 트레이닝 캠프",
        hint: "성장 폭 최대 · 비용 지출",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { attrs: { power: 3, contact: 2, velocity: 3, movement: 2 }, money: -1.5, health: -6, text: "최신 트레이닝 이론이 몸에 새겨졌습니다.", tone: "good" } },
          { weight: 1, effect: { money: -1.5, health: -12, text: "시차와 부하를 견디지 못했습니다. 돈만 썼습니다.", tone: "bad" } },
        ],
      },
      sure("재활과 회복에 전념", "체력 대폭 회복", "안정", {
        health: 26,
        attrs: { durability: 2 },
        text: "몸이 개운합니다. 다음 시즌을 온전히 치를 수 있습니다.",
        tone: "good",
      }),
      sure("가족과 시간을 보낸다", "멘탈 회복 · 성장 없음", "안정", {
        morale: 24,
        health: 10,
        attrs: { mental: 2 },
        text: "야구를 잠시 잊었습니다. 마음이 단단해졌습니다.",
        tone: "good",
      }),
      sure("CF · 행사로 몸값을 챙긴다", "수입 · 명성 상승", "도전", {
        money: 3,
        fame: 12,
        health: -8,
        text: "광고 계약을 체결했습니다. 통장이 두꺼워졌습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "off-surgery",
    phases: [4],
    tag: "의료진 소견",
    title: "수술 권유",
    body: "정밀 검진 결과, 지금 손대면 확실히 낫지만 다음 시즌 상당 기간을 잃습니다.",
    when: (s) => !!s.injury || s.health < 65,
    choices: [
      sure("수술대에 오른다", "장기 회복 · 시즌 손실", "안정", {
        health: 34,
        attrs: { durability: 4 },
        injury: { name: "수술 후 재활", severity: 0.5 },
        text: "칼을 댔습니다. 길게 보기로 했습니다.",
        tone: "neutral",
      }),
      {
        label: "재활로 버틴다",
        hint: "출전은 가능하지만 재발 위험",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { health: 12, text: "보존 치료로 통증이 가라앉았습니다. 일단은 버틸 만합니다.", tone: "neutral" } },
          { weight: 2, effect: { health: -12, attrs: { durability: -4 }, injury: { name: "만성 통증", severity: 0.4 }, text: "통증이 만성이 됐습니다. 몸이 예전 같지 않습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "off-agent",
    phases: [4],
    tag: "에이전트",
    title: "에이전트 교체 제안",
    body: "대형 에이전시가 당신을 원합니다. 협상력은 곧 계약 규모입니다.",
    when: (s) => s.ovr >= 68,
    choices: [
      sure("대형 에이전시와 계약", "다음 계약 규모 상승", "도전", {
        fame: 10,
        money: -1,
        trait: "협상가",
        text: "이제 협상 테이블에 프로가 앉습니다.",
        tone: "good",
      }),
      sure("함께 커온 에이전트를 지킨다", "멘탈 · 신뢰", "안정", {
        morale: 12,
        attrs: { mental: 2 },
        text: "의리를 택했습니다. 마음이 편합니다.",
        tone: "good",
      }),
    ],
  },
  {
    id: "off-military",
    phases: [4],
    tag: "병역",
    title: "병역 문제",
    body: "더 이상 미룰 수 없습니다. 커리어의 한가운데에 2년의 공백이 놓입니다.",
    when: (s) => s.age >= 26 && s.age <= 29 && !s.traits.includes("병역해결") && (s.contract.league === "KBO" || s.contract.league === "KBO_F"),
    choices: [
      sure("상무(국군체육부대)에 지원한다", "야구는 계속 · 연봉 없음", "안정", {
        trait: "병역해결",
        money: -0.5,
        attrs: { mental: 3, durability: 2 },
        fame: -6,
        text: "유니폼만 바뀌었습니다. 실전 감각은 유지됩니다.",
        tone: "neutral",
      }),
      sure("현역으로 다녀온다", "능력치 하락 · 확실한 해결", "도전", {
        trait: "병역해결",
        attrs: { contact: -3, power: -2, velocity: -3, control: -2 },
        health: 14,
        fame: -12,
        text: "2년을 비웠습니다. 감각은 잃었지만 마음의 짐은 내려놨습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "off-retire-thought",
    phases: [4],
    tag: "갈림길",
    title: "은퇴를 생각하다",
    body: "몸이 예전 같지 않습니다. 후배들의 공은 더 빨라졌습니다.",
    when: (s) => s.age >= 34 && s.ovr < 66,
    choices: [
      sure("한 시즌만 더 해본다", "멘탈 상승 · 노쇠 계속", "도전", {
        morale: 16,
        attrs: { mental: 3 },
        text: "아직 끝이 아니라고 믿기로 했습니다.",
        tone: "good",
      }),
      sure("코치 연수를 병행한다", "제2의 커리어 준비", "안정", {
        morale: 8,
        money: 0.5,
        trait: "지도자 수업",
        text: "글러브를 벗은 뒤를 준비하기 시작했습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "off-charity",
    phases: [4],
    tag: "사회공헌",
    title: "기부 제안",
    body: "유소년 야구단이 도움을 요청했습니다. 당신도 저기서 시작했습니다.",
    when: (s) => s.contract.salary >= 3,
    choices: [
      sure("연봉의 일부를 기부한다", "명성 상승 · 수입 감소", "안정", {
        money: -2,
        fame: 16,
        morale: 10,
        text: "기사보다 아이들의 편지가 더 오래 남았습니다.",
        tone: "good",
      }),
      sure("이름만 빌려준다", "소폭 명성", "안정", {
        fame: 4,
        text: "홍보대사 위촉식에 참석했습니다.",
        tone: "neutral",
      }),
    ],
  },
];

/** 현재 상태에서 발생 가능한 이벤트 중 하나를 뽑습니다. */
export function drawEvent(s: PlayerState, phase: number, usedIds: string[]): GameEvent | null {
  const pool = EVENTS.filter(
    (e) => e.phases.includes(phase as never) && (!e.when || e.when(s)) && !usedIds.includes(e.id),
  );
  if (!pool.length) return null;
  const total = pool.reduce((a, e) => a + (e.weight ?? 1), 0);
  let r = rand(total);
  for (const e of pool) {
    r -= e.weight ?? 1;
    if (r <= 0) return e;
  }
  return pool[0];
}

/** 가중치에 따라 결과 하나를 고릅니다. */
export function rollOutcome(choice: Choice) {
  const total = choice.outcomes.reduce((a, o) => a + o.weight, 0);
  let r = rand(total);
  for (const o of choice.outcomes) {
    r -= o.weight;
    if (r <= 0) return o.effect;
  }
  return choice.outcomes[0].effect;
}
