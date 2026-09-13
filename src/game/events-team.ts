/**
 * 구단별 이벤트 — 각 구단의 홈구장과 팬 문화를 소재로 한 상황.
 * (구단명은 data.ts 의 모구단 이름과 일치해야 합니다)
 */
import type { GameEvent } from "./types";

export const TEAM_EVENTS: GameEvent[] = [
  /* ══════════════════ KBO ══════════════════ */
  {
    id: "t-lg",
    leagues: ["KBO"],
    phases: [1],
    tag: "잠실",
    title: "잠실의 함성",
    body: "3루 관중석이 통째로 일어나 응원가를 부릅니다. 이 구장에서 뛴다는 건 매일 밤 이 소리를 듣는다는 뜻입니다.",
    teams: ["LG 트윈스"],
    choices: [
      {
        label: "관중석을 향해 손을 들어 보인다",
        hint: "명성 · 팬심",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { fame: 16, morale: 14, attrs: { mental: 2 }, text: "구장이 폭발했습니다. 당신의 응원가가 9회까지 끊이지 않았습니다.", tone: "good" } },
          { weight: 1, effect: { fame: -6, teamTrust: -6, text: "그날 경기는 졌습니다. 세리머니만 남아 회자됐습니다.", tone: "bad" } },
        ],
      },
      {
        label: "조용히 다음 플레이를 준비한다",
        hint: "집중력",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { mental: 3, contact: 1, control: 1 }, text: "환호를 뒤로하고 준비 운동을 이어갔습니다. 프로답습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "t-hanwha",
    leagues: ["KBO"],
    phases: [2],
    tag: "대전",
    title: "그래도 남아 있는 사람들",
    body: "점수 차가 크게 벌어진 8회. 그런데 관중석이 비지 않습니다. 이 팀의 팬들은 원래 그렇습니다.",
    teams: ["한화 이글스"],
    choices: [
      {
        label: "마지막 아웃까지 전력으로 뛴다",
        hint: "팬심·팀 신뢰 · 체력",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { fame: 14, teamTrust: 18, morale: 16, health: -6, attrs: { mental: 3 }, text: "졌지만 기립박수를 받았습니다. 이 도시는 최선을 다한 사람을 기억합니다.", tone: "good" } },
        ],
      },
      {
        label: "다음 경기를 위해 체력을 아낀다",
        hint: "체력 보존 · 팬심 하락",
        risk: "도전",
        outcomes: [
          { weight: 1, effect: { health: 10, fame: -8, teamTrust: -8, text: "합리적인 판단이었지만, 관중석의 시선이 오래 남았습니다.", tone: "neutral" } },
        ],
      },
    ],
  },
  {
    id: "t-samsung",
    leagues: ["KBO"],
    phases: [0],
    tag: "대구",
    title: "왕조의 기억",
    body: "라커룸 복도에 걸린 우승 사진들. 선배들은 그 시절 이야기를 자주 합니다.",
    teams: ["삼성 라이온즈"],
    choices: [
      {
        label: "그 시절을 다시 만들겠다고 말한다",
        hint: "팀 신뢰 · 부담",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { teamTrust: 18, morale: 12, attrs: { mental: 3 }, text: "라커룸의 눈빛이 달라졌습니다. 누군가는 말을 꺼내야 했습니다.", tone: "good" } },
          { weight: 2, effect: { morale: -12, fame: -4, text: "말이 앞섰습니다. 성적이 따라주지 않자 부담만 남았습니다.", tone: "bad" } },
        ],
      },
      {
        label: "과거는 과거라며 내 야구를 한다",
        hint: "개인 집중",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { focus: "strength", morale: 6, text: "사진은 사진일 뿐입니다. 당신은 오늘 경기를 준비했습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "t-doosan",
    leagues: ["KBO"],
    minSeason: 3,
    phases: [0],
    tag: "화수분",
    title: "끝없이 올라오는 후배들",
    body: "이 구단의 2군은 유명합니다. 올해도 준수한 신인이 셋이나 1군 캠프에 올라왔습니다.",
    teams: ["두산 베어스"],
    choices: [
      {
        label: "후배들을 직접 가르친다",
        hint: "멘탈·신뢰 · 경쟁자 육성",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { mental: 4 }, teamTrust: 18, morale: 8, text: "가르치며 스스로도 정리됐습니다. 구단이 당신을 다르게 봅니다.", tone: "good" } },
        ],
      },
      {
        label: "밀리지 않으려 훈련량을 늘린다",
        hint: "성장 · 체력 소모",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { focus: "strength", health: -12, morale: 6, text: "후배들을 따돌렸습니다. 위기감은 좋은 연료였습니다.", tone: "good" } },
          { weight: 2, effect: { health: -18, morale: -10, teamTrust: -6, text: "조급함이 몸을 상하게 했습니다. 신인은 이미 1군에 있습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "t-ssg",
    leagues: ["KBO"],
    for: "batter",
    phases: [1],
    tag: "문학",
    title: "홈런 공장",
    body: "이 구장의 담장은 가깝습니다. 타자에게는 유혹이고, 투수에게는 공포입니다.",
    teams: ["SSG 랜더스"],
    choices: [
      {
        label: "담장을 노리고 스윙을 키운다",
        hint: "파워 상승 · 정확도 손해",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { attrs: { power: 5, contact: -1 }, fame: 10, text: "홈런이 쏟아졌습니다. 구장이 당신을 도왔습니다.", tone: "good" } },
          { weight: 2, effect: { attrs: { power: 1, contact: -3 }, morale: -8, text: "큰 스윙에 중심이 무너졌습니다. 뜬공만 늘었습니다.", tone: "bad" } },
        ],
      },
      {
        label: "내 스윙을 유지한다",
        hint: "안정적인 타격",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { contact: 3, eye: 2, control: 2 }, text: "구장에 흔들리지 않았습니다. 기본기가 답이었습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "t-lotte",
    leagues: ["KBO"],
    phases: [2],
    tag: "사직",
    title: "부산 갈매기",
    body: "사직의 밤. 주황색 봉투를 머리에 쓴 관중 2만 명이 한목소리로 노래합니다. 소름이 돋습니다.",
    teams: ["롯데 자이언츠"],
    choices: [
      {
        label: "이 함성에 보답하겠다고 다짐한다",
        hint: "멘탈·명성 대폭",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { fame: 18, morale: 22, attrs: { mental: 4 }, text: "부산은 야구를 이렇게 합니다. 몸이 저절로 움직였습니다.", tone: "good" } },
        ],
      },
      {
        label: "부담을 느낀다",
        hint: "압박 · 성장 가능",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { mental: 5 }, morale: -6, text: "기대가 무거웠지만, 그 무게를 견디며 단단해졌습니다.", tone: "good" } },
          { weight: 2, effect: { morale: -16, text: "함성이 부담으로 바뀌는 순간이 있습니다. 오늘이 그랬습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "t-kt",
    leagues: ["KBO"],
    phases: [0],
    tag: "수원",
    title: "젊은 구단의 기틀",
    body: "기존의 성과 위에 새롭게 만들어갈 것이 많습니다. 구단이 당신에게 팀 컬러를 묻습니다.",
    teams: ["KT 위즈"],
    choices: [
      {
        label: "데이터 기반 야구를 제안한다",
        hint: "선구안·제구 향상",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { eye: 4, control: 4, mental: 2 }, teamTrust: 12, text: "숫자를 파고들었습니다. 전력분석팀과 가장 친한 선수가 됐습니다.", tone: "good" } },
        ],
      },
      {
        label: "근성과 훈련량으로 간다",
        hint: "전방위 성장 · 체력 소모",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { focus: "strength", teamTrust: 14, health: -10, text: "동료와 훈련을 이어가며 서로 자극을 받았습니다.", tone: "good" } },
          { weight: 2, effect: { health: -16, morale: -8, text: "방향 없는 훈련량은 몸만 상하게 했습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "t-kia",
    leagues: ["KBO"],
    phases: [1],
    tag: "광주",
    title: "타이거즈의 이름",
    body: "이 유니폼에는 우승 횟수가 따라붙습니다. 팬들은 당연하다는 듯 우승을 말합니다.",
    teams: ["KIA 타이거즈"],
    choices: [
      {
        label: "전통의 무게를 받아들인다",
        hint: "멘탈·신뢰",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { mental: 4 }, teamTrust: 14, fame: 8, text: "이 유니폼이 무엇을 뜻하는지 알게 됐습니다. 어깨가 펴집니다.", tone: "good" } },
        ],
      },
      {
        label: "우승만이 답이라며 몰아붙인다",
        hint: "팀 각성 또는 과부하",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { teamTrust: 20, morale: 14, fame: 12, health: -10, text: "팀이 하나로 달렸습니다. 9월의 순위표가 달라졌습니다.", tone: "good" } },
          { weight: 2, effect: { teamTrust: -14, morale: -12, health: -12, text: "과열됐습니다. 지친 팀에 당신의 말은 잔소리가 됐습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "t-nc",
    leagues: ["KBO"],
    phases: [0],
    tag: "창원",
    title: "데이터 리포트",
    body: "구단이 당신의 동작과 경기 데이터를 정리한 20쪽짜리 자료를 건넵니다.",
    teams: ["NC 다이노스"],
    choices: [
      {
        label: "숫자대로 폼을 바꾼다",
        hint: "약점 개선 · 적응 리스크",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { focus: "weakness", attrs: { mental: 1 }, text: "데이터가 맞았습니다. 약점이 눈에 띄게 메워졌습니다.", tone: "good" } },
          { weight: 2, effect: { morale: -12, health: -6, text: "숫자와 몸이 따로 놀았습니다. 감각만 흐트러졌습니다.", tone: "bad" } },
        ],
      },
      {
        label: "참고만 하고 감각을 믿는다",
        hint: "강점 유지",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { focus: "strength", morale: 6, text: "자료는 읽되 몸에 익은 동작을 다듬었습니다. 잘하던 것이 더 좋아졌습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "t-kiwoom",
    leagues: ["KBO"],
    phases: [2],
    tag: "고척",
    title: "트레이드 시장의 큰손",
    body: "이 구단은 좋은 선수를 오래 붙잡지 않는다는 말이 돕니다. 당신의 이름도 오르내립니다.",
    teams: ["키움 히어로즈"],
    choices: [
      {
        label: "가치를 더 높여 큰 무대로 간다",
        hint: "성장 집중 · 팀 신뢰 하락",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { focus: "strength", fame: 12, teamTrust: -10, morale: 8, text: "몸값을 올리는 데 집중했습니다. 스카우트들이 고척을 찾습니다.", tone: "good" } },
          { weight: 2, effect: { teamTrust: -18, morale: -10, text: "속내가 드러났습니다. 팀 안에서 겉돌기 시작했습니다.", tone: "bad" } },
        ],
      },
      {
        label: "남아서 팀을 끌겠다고 한다",
        hint: "팀 신뢰 대폭",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { teamTrust: 22, morale: 12, attrs: { mental: 3 }, text: "남겠다고 했습니다. 이 구단에 흔치 않은 일이라 더 크게 남았습니다.", tone: "good" } },
        ],
      },
    ],
  },

  /* ══════════════════ NPB ══════════════════ */
  {
    id: "t-yomiuri",
    leagues: ["NPB"],
    phases: [0],
    tag: "도쿄돔",
    title: "거인군의 무게",
    body: "일본 야구의 상징과도 같은 구단입니다. 성적이 곧 뉴스이고, 부진은 곧 기사입니다.",
    teams: ["요미우리 자이언츠"],
    choices: [
      {
        label: "팀의 핵심 역할에 도전한다",
        hint: "명성 대폭 · 압박",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { fame: 22, teamTrust: 14, attrs: { mental: 3 }, morale: -4, text: "큰 관심 속에서도 준비한 기량을 보여줬습니다.", tone: "good" } },
          { weight: 2, effect: { fame: -10, morale: -16, text: "스포츠지 1면이 매일 당신을 다뤘습니다. 좋은 쪽이 아니었습니다.", tone: "bad" } },
        ],
      },
      {
        label: "조용히 내 몫만 한다",
        hint: "안정적 적응",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { mental: 3, contact: 1, control: 1 }, teamTrust: 10, text: "소란 없이 스며들었습니다. 코칭스태프가 편하게 씁니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "t-hanshin",
    leagues: ["NPB"],
    phases: [1],
    tag: "고시엔",
    title: "한신 팬의 열기",
    body: "응원의 밀도가 다릅니다. 잘하면 신이 되고 못하면 온 도시가 한숨을 쉽니다.",
    teams: ["한신 타이거스"],
    choices: [
      {
        label: "열기를 즐긴다",
        hint: "멘탈·명성",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { fame: 16, morale: 18, attrs: { mental: 3 }, text: "좋은 플레이가 나올 때마다 구장이 흔들렸습니다. 이런 야구도 있습니다.", tone: "good" } },
        ],
      },
      {
        label: "외부 소음을 차단한다",
        hint: "집중 · 팬심 하락",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { focus: "strength", fame: -5, text: "귀를 닫고 공만 봤습니다. 성적은 성적대로 나왔습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "t-softbank",
    leagues: ["NPB"],
    phases: [0],
    tag: "후쿠오카",
    title: "두꺼운 선수층",
    body: "1군 엔트리에 들어가는 것부터가 경쟁입니다. 2군에도 다른 팀 주전급이 즐비합니다.",
    teams: ["후쿠오카 소프트뱅크 호크스"],
    choices: [
      {
        label: "경쟁을 뚫고 주전을 노린다",
        hint: "성장 · 탈락 위험",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { focus: "strength", teamTrust: 14, morale: 10, text: "두꺼운 벽을 넘었습니다. 이 팀의 주전은 리그 최고를 뜻합니다.", tone: "good" } },
          { weight: 3, effect: { morale: -14, teamTrust: -8, text: "밀렸습니다. 여기서는 잘하는 것만으로 부족합니다.", tone: "bad" } },
        ],
      },
      {
        label: "전문 역할을 파고든다",
        hint: "틈새 공략 · 안정",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { defense: 3, mental: 3, control: 2 }, teamTrust: 12, text: "필요한 상황에 집중하며 코치에게 활용 가능성을 보여줬습니다.", tone: "good" } },
        ],
      },
    ],
  },

  /* ══════════════════ MLB ══════════════════ */
  {
    id: "t-yankees",
    leagues: ["MLB"],
    phases: [0],
    tag: "New York",
    title: "핀스트라이프의 규율",
    body: "이 구단에는 오래된 전통과 규칙이 있습니다. 뉴욕 언론은 그 모든 것을 지켜봅니다.",
    teams: ["New York Yankees"],
    choices: [
      {
        label: "전통에 맞춰 처신한다",
        hint: "신뢰 · 멘탈",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { teamTrust: 16, attrs: { mental: 4 }, fame: 8, text: "군말 없이 녹아들었습니다. 뉴욕에서 이건 큰 미덕입니다.", tone: "good" } },
        ],
      },
      {
        label: "내 스타일을 지킨다",
        hint: "개성 · 언론의 표적",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { fame: 18, morale: 12, teamTrust: -8, text: "화제의 중심이 됐습니다. 성적이 받쳐주니 아무도 뭐라 못 합니다.", tone: "good" } },
          { weight: 2, effect: { fame: -12, teamTrust: -16, morale: -10, text: "타블로이드가 당신을 물고 늘어졌습니다. 뉴욕은 만만치 않습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "t-dodgers",
    leagues: ["MLB"],
    phases: [1],
    tag: "Los Angeles",
    title: "할리우드의 밤",
    body: "경기가 끝나면 초대장이 쌓입니다. 이 도시는 야구 밖에도 유혹이 많습니다.",
    teams: ["Los Angeles Dodgers"],
    choices: [
      {
        label: "적당히 즐기며 인맥을 쌓는다",
        hint: "명성·수입 · 체력",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { fame: 20, money: 2, health: -10, text: "광고 계약이 붙었습니다. LA는 이런 곳입니다.", tone: "good" } },
          { weight: 2, effect: { health: -18, teamTrust: -12, morale: -6, text: "밤이 길어졌습니다. 훈련장에서의 몸이 무거워졌습니다.", tone: "bad" } },
        ],
      },
      {
        label: "전부 사양하고 야구만 한다",
        hint: "성장 · 체력 유지",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { focus: "strength", health: 8, teamTrust: 10, text: "초대장을 전부 접었습니다. 대신 훈련장에서 시간을 보냈습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "t-redsox",
    leagues: ["MLB"],
    for: "batter",
    phases: [1],
    tag: "Boston",
    title: "그린 몬스터",
    body: "왼쪽 담장이 눈앞에 있습니다. 높고 가까운 이 벽은 타구를 전혀 다르게 만듭니다.",
    teams: ["Boston Red Sox"],
    choices: [
      {
        label: "벽을 이용하는 법을 익힌다",
        hint: "타격·수비 적응",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { contact: 3, defense: 3, movement: 2 }, text: "벽을 맞히는 타구가 2루타가 됐습니다. 수비 위치도 달라졌습니다.", tone: "good" } },
        ],
      },
      {
        label: "벽을 넘기려 힘을 싣는다",
        hint: "파워 · 정확도 위험",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { power: 5 }, fame: 10, text: "괴물 같은 벽을 넘겼습니다. 펜웨이가 들썩였습니다.", tone: "good" } },
          { weight: 2, effect: { attrs: { power: 1, contact: -3 }, morale: -8, text: "벽만 보다 스윙이 커졌습니다. 뜬공이 늘었습니다.", tone: "bad" } },
        ],
      },
    ],
  },
];
