/**
 * 생활 · 리그 · 팬 · 동료 이벤트.
 * 상당수가 repeatable 이고 variants(본문 변형)를 갖고 있어, 커리어가 길어져도
 * 같은 이벤트가 같은 문장으로 다시 나오는 일이 드뭅니다.
 */
import { LEAGUES } from "./data";
import type { Choice, GameEvent, PlayerState } from "./types";

const edge = (s: PlayerState) => s.ovr - LEAGUES[s.contract.league].level;
const tier = (s: PlayerState) => LEAGUES[s.contract.league].tier;
const lastWar = (s: PlayerState) =>
  s.seasons.length ? s.seasons[s.seasons.length - 1].stat.war : 0;
const sure = (
  label: string,
  hint: string,
  risk: Choice["risk"],
  effect: Choice["outcomes"][number]["effect"],
): Choice => ({ label, hint, risk, outcomes: [{ weight: 1, effect }] });

export const LIFE_EVENTS: GameEvent[] = [
  /* ══════════════ 원정 · 날씨 · 구장 ══════════════ */
  {
    id: "life-rainout",
    phases: [1, 2],
    tag: "우천",
    title: "비로 비어버린 하루",
    body: "경기가 취소됐습니다. 원정 호텔 창밖으로 비가 쏟아지고, 저녁까지 통째로 비었습니다.",
    repeatable: true,
    variants: [
      { body: "더블헤더 앞두고 첫 경기가 비로 날아갔습니다. 대기실에서 세 시간을 보냈습니다." },
      { title: "우천 취소", body: "원정 야외 구장의 경기가 비로 취소됐습니다. 오늘은 숙소와 실내 훈련장을 이용해야 합니다." },
    ],
    choices: [
      sure("실내 훈련장에 간다", "능력치 소폭 · 체력 소모", "안정", {
        focus: "weakness", health: -4, text: "비 오는 날 실내 훈련장의 공 소리는 유난히 크게 울립니다.", tone: "good",
      }),
      sure("푹 쉰다", "체력·멘탈 회복", "안정", {
        health: 10, morale: 8, text: "오랜만에 낮잠을 잤습니다. 몸이 가벼워졌습니다.", tone: "good",
      }),
      {
        label: "동료들과 나간다",
        hint: "팀 신뢰 · 컨디션 위험",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { teamTrust: 10, morale: 12, health: -6, text: "오래 웃었습니다. 다음 날 더그아웃이 유난히 가까웠습니다.", tone: "good" } },
          { weight: 1, effect: { health: -14, teamTrust: -4, text: "다음 날 경기에서 몸이 무거웠습니다. 코치가 눈치챘습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "life-heat",
    phases: [2],
    tag: "폭염",
    title: "한여름 낮경기",
    body: "그라운드 온도 40도. 더그아웃 얼음이 이닝마다 녹아내립니다.",
    repeatable: true,
    variants: [
      { body: "8월 연전 마지막 날. 유니폼이 소금기로 하얗게 굳었습니다." },
    ],
    choices: [
      sure("평소대로 전력으로 뛴다", "신뢰 · 체력 큰 소모", "도전", {
        teamTrust: 8, health: -12, attrs: { durability: 1 }, text: "끝까지 뛰었습니다. 몸은 축났지만 벤치가 고개를 끄덕였습니다.", tone: "neutral",
      }),
      sure("트레이너와 회복 루틴을 짠다", "체력 관리", "안정", {
        health: 4, attrs: { durability: 2 }, text: "얼음조끼와 수분 루틴. 여름을 버티는 법을 배웠습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-roadtrip",
    phases: [1],
    tag: "원정",
    title: "긴 원정길",
    body: "9일 동안 집에 못 갑니다. 버스와 호텔, 다시 버스. 몸보다 마음이 먼저 지칩니다.",
    repeatable: true,
    variants: [
      { body: "원정 6연전. 세탁물이 밀리고 밥은 늘 같은 도시락입니다." },
      { title: "새벽 이동", body: "야간 경기 끝나고 새벽 2시 출발. 다음 경기는 오후 2시입니다." },
    ],
    choices: [
      sure("호텔에서 루틴을 지킨다", "멘탈 유지", "안정", {
        attrs: { mental: 2 }, health: 2, text: "어디서든 같은 시간에 같은 것을 했습니다. 프로의 방식입니다.", tone: "good",
      }),
      sure("영상 분석으로 밤을 채운다", "약점 보완 · 수면 부족", "도전", {
        focus: "weakness", health: -8, text: "상대 선수의 경기 영상을 새벽까지 돌려봤습니다. 다음 승부의 준비가 조금 더 됐습니다.", tone: "good",
      }),
    ],
  },

  /* ══════════════ 팬 ══════════════ */
  {
    id: "life-fanletter",
    duringRehab: true,
    phases: [1, 2],
    tag: "팬",
    title: "편지 한 통",
    body: "라커에 손편지가 놓여 있습니다. 병원에서 당신 경기를 보며 버틴다는 아이의 글씨입니다.",
    repeatable: true,
    variants: [
      { body: "오랫동안 구단을 응원한 팬이 편지를 보냈습니다. 최근 당신의 플레이를 보고 응원할 선수가 한 명 더 생겼다고 합니다." },
      { title: "응원가", body: "팬이 직접 만든 응원 문구를 편지에 적어 보냈습니다. 서툰 글씨에 정성이 가득합니다." },
    ],
    choices: [
      sure("직접 답장을 쓴다", "멘탈 · 명성", "안정", {
        morale: 14, fame: 6, attrs: { mental: 2 }, text: "왜 야구를 하는지 잠깐 잊고 있었습니다.", tone: "good",
      }),
      sure("조용히 마음에 담아둔다", "멘탈", "안정", {
        morale: 8, text: "편지를 글러브 안쪽에 넣었습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-hate",
    duringRehab: true,
    phases: [1, 2],
    tag: "팬",
    title: "쏟아지는 악플",
    body: "부진 사흘째. SNS 알림을 열자마자 후회했습니다.",
    repeatable: true,
    when: (s) => s.fame >= 25 && (s.morale < 65 || lastWar(s) < 1.5),
    variants: [
      { body: "커뮤니티에 당신 이름이 걸린 글이 순위에 올랐습니다. 제목만 보고 닫았습니다." },
    ],
    choices: [
      sure("앱을 지운다", "멘탈 회복", "안정", {
        morale: 12, attrs: { mental: 3 }, text: "안 보면 없는 일입니다. 정말로 그렇게 됐습니다.", tone: "good",
      }),
      {
        label: "성적으로 답하겠다고 공개적으로 말한다",
        hint: "명성 상승 또는 역풍",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { fame: 14, morale: 10, focus: "strength", text: "좋은 플레이로 응답했습니다. 비판 일색이던 반응이 조금 달라졌습니다.", tone: "good" } },
          { weight: 2, effect: { fame: -10, morale: -14, text: "말한 다음 경기에서도 부진했습니다. 인터뷰 캡처가 돌았습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "life-kidfan",
    duringRehab: true,
    phases: [2],
    tag: "팬",
    title: "담장 너머의 아이",
    body: "경기 전 훈련 중, 담장 너머에서 아이가 공을 달라고 소리칩니다. 곧 라인업 발표입니다.",
    repeatable: true,
    variants: [
      { body: "사인을 받으려 두 시간을 기다린 아이가 있습니다. 버스는 출발 직전입니다." },
    ],
    choices: [
      sure("공을 던져주고 사진을 찍는다", "명성 · 멘탈", "안정", {
        fame: 8, morale: 10, text: "그 사진이 커뮤니티에 올라왔습니다. 오랜만에 좋은 쪽으로.", tone: "good",
      }),
      sure("경기에 집중한다", "집중력", "안정", {
        attrs: { mental: 1 }, fame: -2, text: "오늘은 그라운드가 먼저였습니다.", tone: "neutral",
      }),
    ],
  },
  {
    id: "life-allstar-vote",
    leagues: ["KBO", "NPB", "MLB"],
    phases: [1],
    tag: "올스타",
    title: "올스타를 향한 응원",
    body: "올스타 선발을 앞두고 당신의 이름이 후보로 거론됩니다. 팬들의 응원도 늘고 있습니다.",
    when: (s) => tier(s) >= 3 && s.fame >= 40,
    variants: [
      { body: "감독 추천 올스타 명단에 당신 이름이 거론됩니다. 마지막 자리 하나를 두고 경합 중입니다." },
    ],
    choices: [
      {
        label: "팬들에게 직접 호소한다",
        hint: "명성 크게 · 부담",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { fame: 18, morale: 12, text: "팬들의 응원이 힘이 됐습니다. 올스타 후보를 향한 관심이 높아졌습니다.", tone: "good" } },
          { weight: 2, effect: { fame: 4, morale: -8, text: "호소만으로 분위기를 바꾸기는 어려웠습니다. 남은 경기에서 보여줘야 합니다.", tone: "neutral" } },
        ],
      },
      sure("성적으로만 말한다", "집중", "안정", {
        focus: "strength", fame: 4, text: "선발 이야기에 휘둘리지 않고 훈련에 집중했습니다.", tone: "good",
      }),
    ],
  },

  /* ══════════════ 동료 · 라커룸 ══════════════ */
  {
    id: "life-foreigner",
    phases: [0, 1],
    tag: "라커룸",
    title: "새로 온 외국인 선수",
    body: "말이 통하지 않는 새 동료가 옆 라커를 씁니다. 첫 주 내내 혼자 밥을 먹습니다.",
    repeatable: true,
    variants: [
      { body: "새 동료가 통역 없이 훈련장에 서 있습니다. 훈련 순서를 몰라 헤매고 있습니다." },
      { body: "새 동료가 낯선 식당 메뉴 앞에서 굳어 있습니다. 누군가는 손을 내밀어야 합니다." },
    ],
    choices: [
      sure("먼저 다가간다", "팀 신뢰 · 멘탈", "안정", {
        teamTrust: 12, morale: 8, attrs: { mental: 2 }, text: "번역기로 나눈 첫 대화. 그 선수가 시즌 내내 당신 편이 됐습니다.", tone: "good",
      }),
      sure("각자 알아서 한다", "변화 없음", "안정", {
        text: "프로는 원래 그런 것이라고 생각했습니다.", tone: "neutral",
      }),
    ],
  },
  {
    id: "life-released",
    duringRehab: true,
    phases: [0, 4],
    tag: "라커룸",
    title: "방출된 동기",
    body: "함께 입단한 동기가 방출 통보를 받았습니다. 짐을 싸는 그의 등을 보고 있습니다.",
    minSeason: 2,
    variants: [
      { body: "한 방을 썼던 선배가 은퇴를 발표했습니다. 라커 명패가 떼어지는 걸 봤습니다." },
      { body: "친한 동료가 다른 팀으로 떠나게 됐습니다. 짐을 싸며 눈물을 참고 있습니다." },
    ],
    choices: [
      sure("끝까지 배웅한다", "멘탈 · 신뢰", "안정", {
        morale: -6, attrs: { mental: 4 }, teamTrust: 6, text: "내일이 내 차례일 수 있다는 걸 배웠습니다.", tone: "neutral",
      }),
      sure("훈련장으로 향한다", "위기감 → 성장", "도전", {
        focus: "strength", morale: -10, text: "두려움이 연료가 됐습니다. 그날 훈련은 유난히 길었습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-rival",
    phases: [1, 2],
    tag: "라이벌",
    title: "같은 나이, 다른 팀",
    body: "드래프트 동기가 상대팀 주전이 됐습니다. 기사는 매번 둘을 나란히 비교합니다.",
    minSeason: 2,
    when: (s) => tier(s) >= 3,
    variants: [
      { body: "고교 시절 라이벌과 처음으로 1군에서 맞붙습니다. 중계진이 그 얘기부터 꺼냅니다." },
    ],
    choices: [
      {
        label: "그 경기에 모든 걸 건다",
        hint: "명성·멘탈 크게 · 실패 시 타격",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { fame: 14, morale: 16, attrs: { mental: 3 }, text: "이겼습니다. 경기 후 악수하는 사진이 1면에 실렸습니다.", tone: "good" } },
          { weight: 2, effect: { morale: -14, fame: -4, text: "완패. 비교 기사가 한 주 내내 이어졌습니다.", tone: "bad" } },
        ],
      },
      sure("남과 비교하지 않는다", "멘탈", "안정", {
        attrs: { mental: 3 }, morale: 4, text: "내 커리어는 내 것이라고 정했습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-veteran-tip",
    duringRehab: true,
    phases: [0],
    tag: "라커룸",
    title: "베테랑의 노하우",
    body: "은퇴를 앞둔 선배가 자기 루틴 노트를 건넵니다. 20년 치 기록입니다.",
    maxSeason: 6,
    variants: [
      { body: "코치가 아닌 선배 선수가 조용히 폼을 봐주겠다고 합니다." },
      { body: "팀 최고참이 전훈 마지막 날 술 대신 이야기를 사줬습니다." },
    ],
    choices: [
      sure("전부 받아 적는다", "멘탈 · 약점 보완", "안정", {
        focus: "weakness", attrs: { mental: 2 }, teamTrust: 6, text: "노트의 반은 야구, 반은 사는 법이었습니다.", tone: "good",
      }),
      sure("내 방식이 있다", "강점 집중", "도전", {
        focus: "strength", teamTrust: -4, text: "정중히 사양했습니다. 대신 내 것을 더 깊게 팠습니다.", tone: "neutral",
      }),
    ],
  },

  /* ══════════════ 심판 · 경기 중 사건 ══════════════ */
  {
    id: "life-umpire",
    phases: [1, 2],
    tag: "판정",
    title: "억울한 판정",
    body: "결정적인 순간 오심. 리플레이는 명백한데 판정은 바뀌지 않았습니다.",
    repeatable: true,
    variants: [
      { body: "베이스에서의 접전 끝에 불리한 판정이 나왔습니다. 벤치에서 본 장면과 달라 답답합니다." },
      { body: "비디오 판독 결과가 뒤집혔습니다. 벤치가 들끓습니다." },
    ],
    choices: [
      {
        label: "격하게 항의한다",
        hint: "팬심 · 퇴장 위험",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { fame: 8, teamTrust: 8, morale: 6, text: "팬들이 환호했습니다. 경고로 끝났습니다.", tone: "good" } },
          { weight: 2, effect: { fame: -6, teamTrust: -8, health: -4, text: "퇴장 명령을 받았습니다. 더는 그 경기에서 뛸 수 없습니다.", tone: "bad" } },
        ],
      },
      sure("삼킨다", "멘탈", "안정", {
        attrs: { mental: 3 }, morale: -4, text: "다음 플레이에 집중하기로 했습니다.", tone: "neutral",
      }),
    ],
  },
  {
    id: "life-walkoff",
    phases: [1, 2],
    tag: "끝내기",
    title: "9회말 마지막 타석",
    body: "동점, 2사 만루. 상대 마무리가 마운드에 오릅니다. 구장이 조용합니다.",
    repeatable: true,
    for: "batter",
    when: (s) => edge(s) >= -3,
    variants: [
      { body: "연장전 동점, 2사 만루. 당신의 타석에 더그아웃 모두가 집중합니다." },
      { body: "동점인 9회말 2사 만루. 감독이 대타를 쓰지 않았습니다. 당신을 믿는다는 뜻입니다." },
    ],
    choices: [
      {
        label: "초구부터 노린다",
        hint: "영웅 또는 역적",
        risk: "무모",
        outcomes: [
          { weight: 4, effect: { fame: 20, morale: 18, teamTrust: 12, attrs: { mental: 3 }, text: "끝내기. 헬멧이 벗겨지고 물벼락을 맞았습니다.", tone: "good" } },
          { weight: 3, effect: { morale: -12, fame: -4, text: "초구 파울, 이후 삼진. 홈 팬 앞에서 고개를 숙였습니다.", tone: "bad" } },
        ],
      },
      sure("볼넷이라도 얻는다", "출루 집중", "안정", {
        attrs: { eye: 2, mental: 2 }, teamTrust: 6, text: "풀카운트 볼넷 밀어내기. 화려하진 않아도 이긴 건 이긴 겁니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-save-situation",
    roles: ["불펜", "마무리"],
    phases: [1, 2],
    tag: "세이브",
    title: "1점 차 9회",
    body: "한 점 앞선 9회, 무사 주자 없음. 감독이 당신에게 마지막 이닝을 맡깁니다.",
    repeatable: true,
    for: "pitcher",
    variants: [
      { body: "한 점 차 리드, 9회 시작입니다. 불펜 문이 열리고 당신 이름이 불렸습니다." },
    ],
    choices: [
      {
        label: "정면승부",
        hint: "성공 시 큰 신뢰 · 블론 위험",
        risk: "무모",
        outcomes: [
          { weight: 4, effect: { fame: 14, teamTrust: 16, morale: 14, attrs: { mental: 3 }, text: "세이브. 포수와 하이파이브하며 접전을 마무리했습니다.", tone: "good" } },
          { weight: 3, effect: { morale: -14, teamTrust: -6, text: "블론세이브. 마운드에서 내려오는 길이 길었습니다.", tone: "bad" } },
        ],
      },
      sure("유인구 위주로 간다", "안정적인 투구", "안정", {
        attrs: { control: 2, movement: 1 }, teamTrust: 6, text: "볼넷 하나 뒤 병살, 마지막 타자는 땅볼. 깔끔하진 않아도 리드는 지켰습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-hbp",
    phases: [1, 2],
    tag: "사구",
    title: "몸에 맞는 공",
    body: "시속 150km 공이 팔꿈치를 때렸습니다. 뼈는 괜찮다는데 붓기가 심합니다.",
    repeatable: true,
    for: "batter",
    variants: [
      { body: "팔꿈치에 맞은 공 때문에 붓기가 남았습니다. 검진에서는 골절이 없다고 합니다." },
    ],
    choices: [
      {
        label: "다음 경기도 나간다",
        hint: "신뢰 · 악화 위험",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { teamTrust: 10, health: -8, text: "테이핑하고 뛰었습니다. 팀이 당신을 다시 봤습니다.", tone: "neutral" } },
          { weight: 2, effect: { injury: { name: "팔꿈치 타박 악화", severity: 0.3 }, health: -16, text: "붓기가 안 빠졌습니다. 결국 열흘을 쉬었습니다.", tone: "bad" } },
        ],
      },
      sure("이틀 쉰다", "체력 회복", "안정", {
        health: 6, teamTrust: -3, text: "트레이너 말을 들었습니다. 사흘째엔 멀쩡했습니다.", tone: "good",
      }),
    ],
  },

  /* ══════════════ 미디어 ══════════════ */
  {
    id: "life-interview-slip",
    duringRehab: true,
    phases: [1, 2],
    tag: "미디어",
    title: "인터뷰 실언",
    body: "경기 후 인터뷰에서 상대팀 얘기를 하다 말이 헛나왔습니다. 이미 기사가 떴습니다.",
    repeatable: true,
    when: (s) => s.fame >= 30,
    variants: [
      { body: "라디오에서 감독 전술을 두고 농담한 게 헤드라인이 됐습니다." },
    ],
    choices: [
      sure("바로 사과한다", "명성 소폭 하락 · 신뢰 유지", "안정", {
        fame: -4, teamTrust: 4, attrs: { mental: 2 }, text: "다음 날 직접 사과했습니다. 사흘 뒤엔 잊혔습니다.", tone: "neutral",
      }),
      {
        label: "내 말이 틀리지 않았다고 버틴다",
        hint: "명성 크게 오르거나 크게 떨어짐",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { fame: 12, morale: 8, teamTrust: -6, text: "화제가 됐고 성적이 받쳐줬습니다. 캐릭터가 생겼습니다.", tone: "good" } },
          { weight: 3, effect: { fame: -14, teamTrust: -14, morale: -8, text: "논란이 커졌습니다. 구단이 대신 사과문을 냈습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "life-documentary",
    phases: [4],
    tag: "미디어",
    title: "다큐멘터리 제작 제안",
    body: "방송사가 당신의 한 시즌을 따라다니고 싶어 합니다. 카메라가 라커룸까지 들어옵니다.",
    when: (s) => s.fame >= 55,
    choices: [
      {
        label: "수락한다",
        hint: "명성 대폭 · 집중력",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { fame: 22, money: 2, morale: 6, health: -6, text: "방영 후 당신을 모르는 사람이 줄었습니다.", tone: "good" } },
          { weight: 2, effect: { fame: 8, teamTrust: -10, morale: -8, text: "카메라 앞에서 동료들이 불편해했습니다. 편집도 당신 편이 아니었습니다.", tone: "bad" } },
        ],
      },
      sure("거절한다", "집중 유지", "안정", {
        teamTrust: 6, focus: "strength", text: "라커룸은 라커룸으로 남겨두기로 했습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-variety",
    phases: [4],
    tag: "미디어",
    title: "예능 출연",
    body: "인기 예능에서 게스트 제안이 왔습니다. 하루 촬영에 광고 세 편 몫이라고 합니다.",
    repeatable: true,
    when: (s) => s.fame >= 45,
    variants: [
      { body: "유튜브 채널 합동 콘텐츠 제안. 조회수는 보장된다고 합니다." },
    ],
    choices: [
      sure("출연한다", "명성·수입", "안정", {
        fame: 12, money: 1.5, health: -4, text: "다음 날 검색어에 올랐습니다. 야구가 아니라 웃긴 장면으로.", tone: "good",
      }),
      sure("사양한다", "집중", "안정", {
        attrs: { mental: 1 }, text: "겨울엔 몸만 만들기로 했습니다.", tone: "neutral",
      }),
    ],
  },

  /* ══════════════ 건강 · 컨디션 ══════════════ */
  {
    id: "life-flu",
    phases: [1, 2],
    tag: "컨디션",
    title: "독감",
    body: "열이 38도를 넘었습니다. 라인업 발표까지 두 시간 남았습니다.",
    repeatable: true,
    variants: [
      { body: "원정 숙소 식사가 잘못됐는지 밤새 화장실을 오갔습니다." },
      { body: "이틀 연속 잠을 설쳤습니다. 눈 밑이 검게 내려앉았습니다." },
    ],
    choices: [
      {
        label: "숨기고 나간다",
        hint: "신뢰 · 성적 위험",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { teamTrust: 8, health: -10, attrs: { mental: 2 }, text: "어떻게든 맡은 역할을 해냈습니다. 경기 뒤에는 피로가 몰려왔습니다.", tone: "neutral" } },
          { weight: 2, effect: { health: -16, teamTrust: -6, morale: -6, text: "몸이 따라주지 않아 플레이가 흔들렸습니다. 코치가 뒤늦게 알고 화를 냈습니다.", tone: "bad" } },
        ],
      },
      sure("솔직히 말하고 쉰다", "체력 회복", "안정", {
        health: 10, teamTrust: 2, text: "이틀 뒤 복귀했습니다. 아무 일도 없었습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-nutrition",
    duringRehab: true,
    phases: [0],
    tag: "컨디션",
    title: "영양사의 제안",
    body: "구단 영양사가 식단을 통째로 바꾸자고 합니다. 좋아하는 음식은 대부분 빠집니다.",
    variants: [
      { body: "수면 코치가 취침 시간을 두 시간 앞당기라고 합니다. 게임과 영상은 금지입니다." },
    ],
    choices: [
      sure("따른다", "내구성·체력", "안정", {
        attrs: { durability: 3, stamina: 2 }, health: 8, morale: -4, text: "석 달 뒤 몸이 달라졌다는 걸 스스로 느꼈습니다.", tone: "good",
      }),
      sure("내 방식대로 한다", "멘탈 유지", "안정", {
        morale: 6, text: "익숙한 생활 리듬을 유지하기로 했습니다.", tone: "neutral",
      }),
    ],
  },
  {
    id: "life-rehab",
    duringRehab: true,
    phases: [0, 1],
    tag: "재활",
    title: "재활의 나날",
    body: "재활군 아침은 조용합니다. 같은 동작을 백 번 반복하고, 경기는 TV로 봅니다.",
    repeatable: true,
    when: (s) => !!s.injury,
    variants: [
      { body: "복귀 예정일이 또 밀렸습니다. 트레이너가 미안한 얼굴을 합니다." },
    ],
    choices: [
      sure("정해진 프로그램을 성실히", "내구성 · 확실한 회복", "안정", {
        attrs: { durability: 3, mental: 2 }, health: 10, text: "지루함을 견디는 것도 재활입니다.", tone: "good",
      }),
      {
        label: "복귀를 앞당긴다",
        hint: "빠른 복귀 · 재발 위험",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { health: 4, teamTrust: 10, morale: 10, text: "복귀 테스트를 향해 훈련 단계를 높였습니다. 아직 의료진의 확인이 남았습니다.", tone: "good" } },
          { weight: 3, effect: { injury: { name: "재발", severity: 0.5 }, health: -14, morale: -12, text: "같은 부위가 다시 아팠습니다. 처음부터 다시입니다.", tone: "bad" } },
        ],
      },
    ],
  },

  /* ══════════════ 가족 · 개인 ══════════════ */
  {
    id: "life-parents",
    once: true,
    phases: [1, 2],
    tag: "가족",
    title: "부모님이 오신 날",
    body: "부모님이 경기를 보러 오셨습니다. 3루 쪽 관중석에서 손을 흔드십니다.",
    when: (s) => tier(s) >= 3,
    variants: [
      { body: "고향 친구들이 단체로 원정 응원을 왔습니다. 현수막까지 만들어 왔습니다." },
    ],
    choices: [
      {
        label: "오늘은 꼭 보여드린다",
        hint: "멘탈 크게 · 힘 들어갈 위험",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { morale: 18, fame: 6, attrs: { mental: 2 }, text: "준비한 플레이가 통했습니다. 경기 후 관중석을 향해 모자를 벗었습니다.", tone: "good" } },
          { weight: 2, effect: { morale: -8, text: "힘이 들어가 평소 실력을 내지 못했습니다. 그래도 저녁은 따뜻했습니다.", tone: "neutral" } },
        ],
      },
      sure("평소처럼 한다", "안정", "안정", {
        attrs: { mental: 2 }, morale: 8, text: "특별한 날도 루틴은 같았습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-baby",
    phases: [1, 2],
    tag: "가족",
    title: "아이가 태어났습니다",
    body: "원정 중 전화가 왔습니다. 예정일보다 빠릅니다. 비행기는 두 시간 뒤에 있습니다.",
    when: (s) => s.traits.includes("가장") && !s.traits.includes("아빠"),
    choices: [
      sure("바로 간다", "가족 · 멘탈", "안정", {
        trait: "아빠", morale: 24, attrs: { mental: 4 }, teamTrust: -4, text: "첫 얼굴을 봤습니다. 야구가 전부가 아니라는 걸 처음 알았습니다.", tone: "good",
      }),
      sure("경기를 마치고 간다", "신뢰 · 후회", "도전", {
        trait: "아빠", teamTrust: 10, morale: 6, text: "경기를 마치자마자 가족에게 향했습니다. 아이 이름을 글러브 안쪽에 적었습니다.", tone: "neutral",
      }),
    ],
  },
  {
    id: "life-hometown",
    duringRehab: true,
    phases: [4],
    tag: "오프시즌",
    title: "고향 방문",
    body: "모교 야구부에서 초청이 왔습니다. 당신이 쓰던 라커가 아직 남아 있다고 합니다.",
    repeatable: true,
    variants: [
      { body: "고향 리틀야구단 창단식에 명예 감독으로 초대받았습니다." },
    ],
    choices: [
      sure("후배들과 하루를 보낸다", "명성 · 멘탈", "안정", {
        fame: 6, morale: 14, attrs: { mental: 2 }, text: "당신이 왜 이 일을 시작했는지 아이들의 눈에서 봤습니다.", tone: "good",
      }),
      sure("훈련 일정을 지킨다", "성장", "안정", {
        focus: "strength", text: "다음에 꼭 가겠다고 답했습니다. 겨울은 짧습니다.", tone: "neutral",
      }),
    ],
  },

  /* ══════════════ 오프시즌 ══════════════ */
  {
    id: "life-golf",
    phases: [4],
    tag: "오프시즌",
    title: "선배들의 골프 모임",
    body: "구단 베테랑들이 겨울 골프 모임에 부릅니다. 인맥이지만 훈련 시간과 겹칩니다.",
    repeatable: true,
    when: (s) => s.contract.salary >= 1.5,
    variants: [
      { body: "구단 프런트와의 송년 골프. 빠지면 눈에 띕니다." },
    ],
    choices: [
      sure("참석한다", "신뢰 · 훈련 손실", "안정", {
        teamTrust: 10, morale: 6, focus: "weakness", health: -2, text: "골프는 못 쳤지만 이야기는 잘 들었습니다.", tone: "neutral",
      }),
      sure("훈련을 택한다", "성장 · 관계 소홀", "도전", {
        focus: "strength", teamTrust: -6, text: "겨울에는 골프장보다 훈련장이었습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-trip",
    duringRehab: true,
    phases: [4],
    tag: "오프시즌",
    title: "긴 휴가",
    body: "시즌이 끝나고 처음으로 2주를 비웠습니다. 휴대폰을 끄고 어디론가 갑니다.",
    repeatable: true,
    variants: [
      { body: "가족과 해외여행. 야구공을 한 번도 안 만진 열흘입니다." },
      { body: "산에 들어갔습니다. 아침마다 안개 속을 걷습니다." },
    ],
    choices: [
      sure("완전히 쉰다", "멘탈·체력 대폭 회복", "안정", {
        morale: 20, health: 14, focus: "weakness", text: "돌아왔을 때 몸과 마음이 가벼웠습니다.", tone: "good",
      }),
      sure("가서도 몸은 만든다", "체력 · 성장 균형", "안정", {
        health: 8, morale: 8, attrs: { durability: 2 }, text: "휴양지 새벽 달리기. 그것도 나쁘지 않았습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-fanmeeting",
    duringRehab: true,
    phases: [4],
    tag: "오프시즌",
    title: "팬 페스티벌",
    body: "구단 팬 페스티벌. 사인 줄이 구장 밖까지 이어졌습니다.",
    repeatable: true,
    when: (s) => s.fame >= 30,
    variants: [
      { body: "자선 행사와 함께 열린 팬 사인회입니다. 당신의 유니폼을 입은 팬들이 줄을 섰습니다." },
    ],
    choices: [
      sure("마지막 한 명까지 사인한다", "명성 · 팬심", "안정", {
        fame: 12, morale: 10, health: -4, text: "손이 아팠지만 웃으며 끝냈습니다. 그 사진이 오래 돌았습니다.", tone: "good",
      }),
      sure("정해진 시간만 한다", "체력 보존", "안정", {
        fame: 3, health: 2, text: "규정대로 마쳤습니다.", tone: "neutral",
      }),
    ],
  },
  {
    id: "life-winter-camp",
    phases: [4],
    tag: "오프시즌",
    title: "해외 마무리캠프",
    body: "구단이 따뜻한 나라로 마무리캠프를 갑니다. 젊은 선수 위주 명단에 당신도 있습니다.",
    maxSeason: 6,
    variants: [
      { body: "구단 지정 겨울 훈련지. 한 달간 합숙입니다." },
    ],
    choices: [
      sure("참가한다", "성장 · 체력 소모", "안정", {
        focus: "weakness", attrs: { durability: 1 }, health: -6, text: "한 달을 훈련만 했습니다. 약점이 조금 메워졌습니다.", tone: "good",
      }),
      sure("개인 훈련을 택한다", "강점 집중", "도전", {
        focus: "strength", teamTrust: -5, text: "따로 트레이너를 붙였습니다. 잘하는 걸 더 갈았습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-jersey",
    phases: [4],
    tag: "오프시즌",
    title: "등번호 제안",
    body: "구단 레전드가 달던 번호가 비었습니다. 구단이 당신에게 그 번호를 권합니다.",
    minSeason: 4,
    when: (s) => s.fame >= 45 && s.teamTrust >= 55 && !s.traits.includes("상징 번호"),
    choices: [
      {
        label: "받는다",
        hint: "명성 · 부담",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { trait: "상징 번호", fame: 14, teamTrust: 12, attrs: { mental: 3 }, text: "무게를 받았습니다. 유니폼을 입을 때마다 등이 곧아집니다.", tone: "good" } },
          { weight: 1, effect: { trait: "상징 번호", fame: 6, morale: -12, text: "비교가 따라붙었습니다. 그 번호의 기록이 매번 옆에 놓입니다.", tone: "bad" } },
        ],
      },
      sure("내 번호를 지킨다", "멘탈", "안정", {
        attrs: { mental: 2 }, morale: 6, text: "이 번호로 여기까지 왔습니다.", tone: "good",
      }),
    ],
  },

  /* ══════════════ 리그별 생활 ══════════════ */
  {
    id: "life-npb-language",
    duringRehab: true,
    once: true,
    phases: [0, 1],
    tag: "일본 생활",
    title: "말이 안 통하는 더그아웃",
    body: "코치의 지시를 통역이 한 박자 늦게 전합니다. 그 한 박자가 경기에서는 깁니다.",
    leagues: ["NPB", "NPB_F"],
    variants: [
      { body: "일본 기자들의 질문이 낯섭니다. 통역이 없는 자리에서 말문이 막혔습니다." },
    ],
    choices: [
      sure("일본어를 붙잡는다", "멘탈 · 신뢰", "안정", {
        attrs: { mental: 3 }, teamTrust: 12, fame: 4, text: "석 달 뒤 통역 없이 인터뷰했습니다. 팬들이 좋아했습니다.", tone: "good",
      }),
      sure("야구로만 말한다", "강점 집중", "도전", {
        focus: "strength", teamTrust: -4, text: "말 대신 성적을 냈습니다. 그것도 언어입니다.", tone: "neutral",
      }),
    ],
  },
  {
    id: "life-npb-food",
    duringRehab: true,
    once: true,
    phases: [1],
    tag: "일본 생활",
    title: "구단 식당",
    body: "매 끼니가 낯섭니다. 몸무게가 3kg 빠졌습니다.",
    leagues: ["NPB", "NPB_F"],
    choices: [
      sure("한국 식재료를 구해 직접 만든다", "체력 회복", "안정", {
        health: 10, morale: 8, text: "김치찌개 한 그릇에 컨디션이 돌아왔습니다.", tone: "good",
      }),
      sure("현지식에 적응한다", "내구성", "안정", {
        attrs: { durability: 2 }, morale: -2, text: "두 달 걸렸지만 결국 익숙해졌습니다.", tone: "neutral",
      }),
    ],
  },
  {
    id: "life-mlb-travel",
    phases: [1, 2],
    tag: "미국 생활",
    title: "대륙 횡단 원정",
    body: "서부에서 동부로. 시차 3시간, 비행 5시간, 다음 날 낮경기입니다.",
    leagues: ["MLB"],
    repeatable: true,
    variants: [
      { body: "원정 비행 일정이 늦어졌습니다. 도착하자마자 다음 경기를 준비해야 합니다." },
    ],
    choices: [
      sure("수면 루틴을 철저히", "체력 관리", "안정", {
        attrs: { durability: 2 }, health: 4, text: "안대와 귀마개. 비행기에서 자는 법을 익혔습니다.", tone: "good",
      }),
      sure("그냥 버틴다", "체력 소모", "도전", {
        health: -8, attrs: { mental: 2 }, text: "몸이 무거웠지만 경기는 경기였습니다.", tone: "neutral",
      }),
    ],
  },
  {
    id: "life-mlb-clubhouse",
    once: true,
    phases: [0, 1],
    tag: "미국 생활",
    title: "클럽하우스의 규칙",
    body: "여기엔 말로 하지 않는 서열과 규칙이 있습니다. 루키가 베테랑 자리에 앉았다가 혼났습니다.",
    leagues: ["MLB"],
    when: (s) => !s.seasons.some(r => r.league === "MLB"),
    variants: [
      { body: "처음 참가하는 클럽하우스 모임입니다. 동료들이 가벼운 자기소개를 부탁합니다." },
    ],
    choices: [
      sure("웃으며 따른다", "팀 신뢰", "안정", {
        teamTrust: 14, morale: 6, text: "사진이 돌았고, 다음 날부터 진짜 팀원이 됐습니다.", tone: "good",
      }),
      sure("거리를 둔다", "개인 집중", "도전", {
        teamTrust: -10, focus: "strength", text: "혼자 훈련했습니다. 성적으로 자리를 만들었습니다.", tone: "neutral",
      }),
    ],
  },
  {
    id: "life-minor-bus",
    duringRehab: true,
    phases: [1],
    tag: "마이너",
    title: "마이너의 밤",
    body: "마이너 원정 숙소. 긴 버스 이동을 마치고 간단한 저녁 앞에 앉았습니다. 낯선 생활이 길어집니다.",
    leagues: ["AA", "AAA"],
    repeatable: true,
    variants: [
      { body: "밤늦게 원정 숙소에 도착했습니다. 내일 경기를 생각하며 동료와 간단히 식사를 합니다." },
    ],
    choices: [
      sure("버틴다", "멘탈", "안정", {
        attrs: { mental: 4 }, morale: -4, text: "이 시절을 나중에 이야기할 날이 올 거라 믿었습니다.", tone: "neutral",
      }),
      sure("한국 구단에 연락해본다", "복귀 가능성", "도전", {
        fame: 2, morale: 6, text: "국내 스카우트가 답장을 보냈습니다. 문은 열려 있었습니다.", tone: "neutral",
      }),
    ],
  },
  {
    id: "life-farm-callup-tease",
    phases: [1, 2],
    tag: "2군",
    title: "콜업 소문",
    body: "상위 팀이 당신 포지션의 선수층을 점검한다고 합니다. 코치가 최근 경기 영상을 요청했습니다.",
    leagues: ["KBO_F", "NPB_F", "AAA"],
    repeatable: true,
    variants: [
      { body: "상위 팀의 코치가 경기를 보러 왔습니다. 당신의 준비 과정을 눈여겨봅니다." },
    ],
    choices: [
      {
        label: "오늘 경기에 모든 걸 보여준다",
        hint: "콜업 어필 · 부담",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { focus: "strength", teamTrust: 10, fame: 6, morale: 10, text: "좋은 플레이가 눈에 띄었습니다. 코치가 다음 평가에도 지켜보겠다고 했습니다.", tone: "good" } },
          { weight: 2, effect: { morale: -12, text: "힘이 들어가 준비한 모습을 보여주지 못했습니다. 더 준비해야 한다는 평가를 받았습니다.", tone: "bad" } },
        ],
      },
      sure("평소대로 한다", "안정", "안정", {
        attrs: { mental: 2 }, text: "소문에 흔들리지 않았습니다. 기회는 또 옵니다.", tone: "neutral",
      }),
    ],
  },

  /* ══════════════ 기록 · 성적 관련 ══════════════ */
  {
    id: "life-hitstreak",
    phases: [1, 2],
    tag: "기록",
    title: "연속 경기 안타",
    body: "최근 경기에서 안타를 이어가고 있습니다. 기록을 의식하자 타석에서 생각이 많아집니다.",
    for: "batter",
    repeatable: true,
    when: (s) => edge(s) >= 0,
    variants: [
      { body: "연속 안타 행진이 이어집니다. 기자들이 개인 최장 기록을 찾아보기 시작했습니다." },
    ],
    choices: [
      sure("의식하지 않는다", "멘탈", "안정", {
        attrs: { mental: 3, contact: 1 }, morale: 8, text: "기록은 끊겼지만 타격감은 남았습니다.", tone: "good",
      }),
      {
        label: "기록을 노리고 초구부터 친다",
        hint: "명성 크게 · 타격 밸런스 위험",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { fame: 14, morale: 12, text: "안타 행진을 이어갔습니다. 자신감이 한층 높아졌습니다.", tone: "good" } },
          { weight: 2, effect: { attrs: { eye: -2 }, morale: -8, text: "나쁜 공에 손이 나갔습니다. 기록은 끊기고 선구가 흐트러졌습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "life-scoreless",
    phases: [1, 2],
    tag: "기록",
    title: "연속 무실점",
    body: "최근 등판에서 무실점 투구가 이어졌습니다. 그 흐름을 계속 이어가고 싶습니다.",
    for: "pitcher",
    repeatable: true,
    when: (s) => edge(s) >= 0,
    choices: [
      sure("평소 투구를 유지한다", "멘탈·제구", "안정", {
        attrs: { mental: 3, control: 1 }, morale: 8, text: "기록은 끊겼지만 리듬은 유지했습니다.", tone: "good",
      }),
      {
        label: "삼진으로 압도한다",
        hint: "명성 · 투구수 위험",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { fame: 14, morale: 12, attrs: { velocity: 1 }, text: "무실점 행진을 이어갔습니다. 마운드에서 자신감을 얻었습니다.", tone: "good" } },
          { weight: 2, effect: { health: -10, morale: -8, text: "힘으로 던지다 투구수가 늘었습니다. 실점 뒤 마운드를 내려왔습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "life-slump-deep",
    phases: [2],
    tag: "부진",
    title: "흔들리는 타격 리듬",
    body: "타격 리듬이 흔들리며 자신감이 떨어졌습니다. 코치와 재정비 방법을 의논합니다.",
    for: "batter",
    repeatable: true,
    when: (s) => s.morale < 55,
    variants: [
      { body: "최근 타석에서 정타가 줄었습니다. 타격 코치가 영상을 함께 보자고 합니다." },
    ],
    choices: [
      sure("타격폼을 완전히 바꾼다", "약점 보완 · 적응 기간", "도전", {
        focus: "weakness", morale: -4, health: -6, text: "발을 붙였습니다. 어색했지만 공이 다시 보였습니다.", tone: "good",
      }),
      sure("코치와 재정비 시간을 갖는다", "멘탈 회복 · 신뢰", "안정", {
        morale: 14, attrs: { mental: 3 }, teamTrust: 6, fame: -4, text: "코치와 훈련 강도를 조절했습니다. 머리가 맑아졌습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-era-blowup",
    roles: ["선발"],
    phases: [2],
    tag: "부진",
    title: "연속 조기 강판",
    body: "세 경기 연속 3회를 못 넘겼습니다. 로테이션 제외 이야기가 돕니다.",
    for: "pitcher",
    repeatable: true,
    when: (s) => s.morale < 55,
    choices: [
      sure("투구폼을 뜯어고친다", "약점 보완 · 적응", "도전", {
        focus: "weakness", morale: -4, health: -6, text: "팔 각도를 낮췄습니다. 공 끝이 살아났습니다.", tone: "good",
      }),
      sure("불펜에서 감을 되찾는다", "멘탈 회복", "안정", {
        morale: 12, attrs: { mental: 3, control: 1 }, teamTrust: 4, text: "짧게 던지며 자신감을 되찾았습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-hr-derby",
    leagues: ["KBO", "NPB", "MLB"],
    phases: [1],
    tag: "올스타",
    title: "홈런 더비 초청",
    body: "올스타 행사 홈런 더비에 초청받았습니다. 재미지만 스윙이 커진다는 징크스가 있습니다.",
    for: "batter",
    when: (s) => s.attrs.power >= 68 && tier(s) >= 3,
    choices: [
      {
        label: "참가한다",
        hint: "명성 · 스윙 밸런스 위험",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { fame: 16, morale: 12, attrs: { power: 2 }, text: "우승. 후반기에도 홈런이 이어졌습니다.", tone: "good" } },
          { weight: 2, effect: { fame: 8, attrs: { contact: -2 }, text: "탈락. 후반기 초반 스윙이 커져 애를 먹었습니다.", tone: "bad" } },
        ],
      },
      sure("사양한다", "밸런스 유지", "안정", {
        attrs: { contact: 1 }, text: "쇼보다 시즌이 중요했습니다.", tone: "neutral",
      }),
    ],
  },
  {
    id: "life-contract-year",
    phases: [0],
    tag: "계약",
    title: "계약 마지막 해",
    body: "올해가 현재 계약의 마지막 해입니다. 에이전트는 '커리어 하이를 만들어야 한다'고 합니다.",
    when: (s) => s.contract.left === 1 && tier(s) >= 3,
    variants: [
      { body: "재계약 협상이 시즌 전에 결렬됐습니다. 구단은 '시즌 끝나고 보자'고 합니다." },
    ],
    choices: [
      {
        label: "몸값을 위해 모든 걸 쏟는다",
        hint: "성장 · 체력 소모",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { focus: "strength", fame: 8, health: -10, text: "이를 악물었습니다. 숫자가 따라왔습니다.", tone: "good" } },
          { weight: 2, effect: { health: -18, morale: -10, text: "조급함이 몸을 상하게 했습니다. 다음 계약에 대한 걱정이 커졌습니다.", tone: "bad" } },
        ],
      },
      sure("평소처럼 한다", "멘탈", "안정", {
        attrs: { mental: 3 }, morale: 4, text: "계약은 결과일 뿐이라고 되뇌었습니다.", tone: "good",
      }),
    ],
  },
  {
    id: "life-mentor-request",
    phases: [0],
    tag: "라커룸",
    title: "룸메이트 배정",
    body: "구단이 고졸 신인과 원정 룸메이트로 붙였습니다. 열아홉 살이 밤마다 질문을 합니다.",
    minSeason: 5,
    variants: [
      { body: "2군에서 올라온 신인이 당신 라커 옆에 배정됐습니다. 눈이 반짝입니다." },
    ],
    choices: [
      sure("귀찮아도 다 답해준다", "멘탈 · 신뢰", "안정", {
        attrs: { mental: 3 }, teamTrust: 10, morale: 6, text: "말하다 보니 스스로도 정리됐습니다.", tone: "good",
      }),
      sure("선을 긋는다", "개인 집중", "도전", {
        focus: "strength", teamTrust: -6, text: "잠은 자야 했습니다.", tone: "neutral",
      }),
    ],
  },
];
