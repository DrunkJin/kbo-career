/**
 * 포지션별 이벤트 — 투수 / 포수 / 내야수 / 외야수 각각의 고유한 상황.
 */
import { LEAGUES } from "./data";
import type { GameEvent, PlayerState } from "./types";

const edge = (s: PlayerState) => s.ovr - LEAGUES[s.contract.league].level;

export const POSITION_EVENTS: GameEvent[] = [
  /* ══════════════════ 투수 ══════════════════ */
  {
    id: "p-new-pitch",
    phases: [0],
    tag: "투수",
    title: "새 구종 장착",
    body: "전력분석팀이 말합니다. 당신의 공은 이제 읽히고 있다고. 구종 하나를 더 만들 시간입니다.",
    positions: ["투수"],
    choices: [
      {
        label: "스플리터를 장착한다",
        hint: "구위 상승 · 팔에 부담",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { attrs: { movement: 5, velocity: 1 }, health: -8, text: "떨어지는 공이 생겼습니다. 헛스윙이 눈에 띄게 늘었습니다.", tone: "good" } },
          { weight: 2, effect: { attrs: { movement: 1 }, health: -18, injury: { name: "팔꿈치 염증", severity: 0.3 }, text: "손가락을 벌려 던지는 공은 팔꿈치를 갉아먹었습니다.", tone: "bad" } },
        ],
      },
      {
        label: "체인지업을 다듬는다",
        hint: "안정적인 제구 향상",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { control: 3, movement: 2 }, text: "완급 조절이 가능해졌습니다. 타자의 타이밍이 흔들립니다.", tone: "good" } },
        ],
      },
      {
        label: "지금 구종으로 승부한다",
        hint: "기존 강점 강화",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { focus: "strength", attrs: { mental: 2 }, text: "잘 던지던 공을 더 잘 던지기로 했습니다. 단순한 답도 답입니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "p-velocity-chase",
    phases: [0],
    tag: "투수",
    title: "구속을 올릴 것인가",
    body: "요즘 리그는 시속 150을 못 던지면 눈길도 주지 않습니다. 웨이트를 늘리면 구속은 오르지만 제구가 흔들립니다.",
    positions: ["투수"],
    when: (s) => s.attrs.velocity < 80,
    choices: [
      {
        label: "구속 훈련에 올인한다",
        hint: "구속 대폭 · 제구 손해",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { attrs: { velocity: 6, control: -2 }, health: -8, text: "전광판 숫자가 올라갔습니다. 대신 가끔 공이 빠집니다.", tone: "good" } },
          { weight: 2, effect: { attrs: { velocity: 2, control: -4 }, health: -12, text: "구속은 조금 올랐는데 스트라이크존을 잃었습니다.", tone: "bad" } },
        ],
      },
      {
        label: "제구와 완급으로 간다",
        hint: "제구 · 구위 안정 상승",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { control: 4, movement: 2, mental: 1 }, text: "빠르지 않아도 칠 수 없는 공이 있습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "p-pitch-count",
    phases: [1],
    tag: "투수",
    title: "8회, 투구수 108개",
    body: "완투가 눈앞입니다. 불펜은 이미 몸을 풀었고, 감독은 당신을 봅니다.",
    positions: ["투수"],
    when: (s) => edge(s) >= -2,
    choices: [
      {
        label: "9회까지 간다",
        hint: "명성·신뢰 · 부상 위험",
        risk: "무모",
        outcomes: [
          { weight: 3, effect: { fame: 16, teamTrust: 16, morale: 12, health: -12, attrs: { stamina: 2 }, text: "완투. 마운드에서 모자를 벗어 인사했습니다.", tone: "good" } },
          { weight: 2, effect: { health: -22, injury: { name: "어깨 피로 누적", severity: 0.4 }, morale: -8, text: "9회에 무너졌습니다. 어깨가 식은 뒤에야 통증이 왔습니다.", tone: "bad" } },
        ],
      },
      {
        label: "공을 넘기고 내려온다",
        hint: "체력 보존",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { health: 6, attrs: { mental: 2 }, text: "박수를 받으며 내려왔습니다. 시즌은 깁니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "p-bullpen-switch",
    phases: [0],
    tag: "투수",
    title: "불펜 전환 제안",
    body: "선발 자리가 모자랍니다. 구단은 짧게 강하게 던지는 쪽을 권합니다.",
    positions: ["투수"],
    when: (s) => s.attrs.stamina < 62 || edge(s) < -2,
    choices: [
      {
        label: "불펜으로 간다",
        hint: "구속 상승 · 이닝 감소",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { velocity: 4, movement: 2, stamina: -2 }, teamTrust: 12, text: "한 이닝만 전력으로. 구속이 2km 올라갔습니다.", tone: "good" } },
        ],
      },
      {
        label: "선발로 남겠다고 버틴다",
        hint: "이닝 유지 · 경쟁",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { stamina: 5, mental: 2 }, morale: 10, text: "긴 이닝을 던져내며 로테이션을 지켰습니다.", tone: "good" } },
          { weight: 2, effect: { teamTrust: -12, morale: -10, text: "고집은 통하지 않았습니다. 2군 조정 통보를 받았습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "p-nohit",
    phases: [2],
    tag: "투수",
    title: "7회까지 노히트",
    body: "더그아웃에서 아무도 당신에게 말을 걸지 않습니다. 야구의 오래된 미신입니다.",
    positions: ["투수"],
    when: (s) => edge(s) >= 3,
    choices: [
      {
        label: "끝까지 던진다",
        hint: "역사에 남거나, 무너지거나",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { fame: 34, morale: 22, teamTrust: 18, health: -14, attrs: { mental: 5 }, text: "노히트노런. 포수가 달려와 당신을 끌어안았습니다. 평생 남을 밤입니다.", tone: "good" } },
          { weight: 3, effect: { fame: 8, morale: -10, health: -12, text: "8회에 안타를 맞았습니다. 관중의 탄식이 길게 남았습니다.", tone: "neutral" } },
        ],
      },
      {
        label: "투구수 관리를 우선한다",
        hint: "체력 보존 · 기회 포기",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { health: 8, teamTrust: 6, morale: -4, text: "기록보다 시즌을 택했습니다. 아쉬움은 남습니다.", tone: "neutral" } },
        ],
      },
    ],
  },

  /* ══════════════════ 포수 ══════════════════ */
  {
    id: "c-framing",
    phases: [0],
    tag: "포수",
    title: "프레이밍 특훈",
    body: "볼을 스트라이크로 만드는 기술. 눈에 띄지 않지만 한 시즌에 수십 점을 좌우합니다.",
    positions: ["포수"],
    choices: [
      {
        label: "프레이밍에 겨울을 쓴다",
        hint: "수비 대폭 · 타격 정체",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { defense: 6, mental: 2 }, text: "심판의 손이 올라가는 횟수가 달라졌습니다. 투수들이 당신을 찾습니다.", tone: "good" } },
        ],
      },
      {
        label: "방망이를 만든다",
        hint: "타격 상승 · 수비 정체",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { attrs: { contact: 3, power: 3 }, text: "치는 포수는 귀합니다. 타순이 올라갔습니다.", tone: "good" } },
          { weight: 2, effect: { attrs: { defense: -3, contact: 1 }, teamTrust: -8, text: "방망이에 신경 쓰는 사이 블로킹이 무너졌습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "c-pitcher-clash",
    phases: [1],
    tag: "포수",
    title: "에이스와의 마찰",
    body: "팀의 에이스가 당신의 사인을 계속 흔듭니다. 마운드 위에서 둘의 신경전이 중계 화면에 잡혔습니다.",
    positions: ["포수"],
    choices: [
      {
        label: "내 리드를 밀어붙인다",
        hint: "멘탈 · 관계 위험",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { mental: 4, defense: 2 }, teamTrust: 8, text: "당신의 볼배합이 맞았습니다. 에이스가 먼저 손을 내밀었습니다.", tone: "good" } },
          { weight: 2, effect: { teamTrust: -16, morale: -10, text: "고집이 실점으로 돌아왔습니다. 라커룸 공기가 무겁습니다.", tone: "bad" } },
        ],
      },
      {
        label: "투수가 원하는 공을 받는다",
        hint: "관계 회복 · 수동적",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { teamTrust: 14, attrs: { mental: 1 }, text: "던지는 사람이 편해야 한다는 것도 포수의 일입니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "c-knee",
    phases: [2],
    tag: "포수",
    title: "무릎이 보내는 신호",
    body: "앉았다 일어서는 게 버거워졌습니다. 포수의 무릎은 소모품이라는 말이 실감납니다.",
    positions: ["포수"],
    when: (s) => s.age >= 28 || s.health < 75,
    choices: [
      {
        label: "1루수 겸업을 준비한다",
        hint: "수명 연장 · 포수 가치 하락",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { durability: 5, defense: -2 }, health: 16, text: "무릎을 아꼈습니다. 커리어가 몇 년 늘었습니다.", tone: "good" } },
        ],
      },
      {
        label: "끝까지 마스크를 쓴다",
        hint: "포수 가치 유지 · 부상 위험",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { attrs: { defense: 4, mental: 3 }, teamTrust: 16, health: -14, text: "안방을 지켰습니다. 팀은 당신 없이 굴러가지 않습니다.", tone: "good" } },
          { weight: 2, effect: { injury: { name: "무릎 연골 손상", severity: 0.6 }, health: -24, text: "결국 주저앉았습니다. 무릎은 정직했습니다.", tone: "bad" } },
        ],
      },
    ],
  },

  /* ══════════════════ 내야수 ══════════════════ */
  {
    id: "if-yips",
    phases: [1],
    tag: "내야수",
    title: "송구 입스",
    body: "1루가 갑자기 멀어 보입니다. 아무렇지 않던 송구가 손을 떠나지 않습니다.",
    positions: ["내야수"],
    when: (s) => s.morale < 60,
    choices: [
      {
        label: "심리 상담을 받는다",
        hint: "멘탈 회복 · 시간 소요",
        risk: "안정",
        outcomes: [
          { weight: 3, effect: { attrs: { mental: 6, defense: 2 }, morale: 18, text: "머릿속 문제였습니다. 공이 다시 1루로 갑니다.", tone: "good" } },
          { weight: 1, effect: { morale: 6, teamTrust: -6, text: "조금 나아졌지만 완전히 떨치지는 못했습니다.", tone: "neutral" } },
        ],
      },
      {
        label: "송구 수천 개로 이겨낸다",
        hint: "정면 돌파 · 체력 소모",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { defense: 5, mental: 3 }, health: -14, text: "몸이 기억하게 만들었습니다. 생각하기 전에 손이 나갑니다.", tone: "good" } },
          { weight: 2, effect: { attrs: { defense: -3 }, morale: -14, health: -10, text: "던질수록 더 의식하게 됐습니다. 악순환입니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "if-shortstop",
    phases: [0],
    tag: "내야수",
    title: "유격수 자리",
    body: "팀의 주전 유격수가 떠났습니다. 내야의 중심이자 가장 어려운 자리가 비었습니다.",
    positions: ["내야수"],
    when: (s) => s.attrs.defense >= 60,
    choices: [
      {
        label: "유격수에 도전한다",
        hint: "수비 가치 급상승 · 실책 위험",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { attrs: { defense: 6, speed: 2, mental: 2 }, teamTrust: 16, fame: 8, text: "중심에 섰습니다. 내야가 당신을 축으로 돕니다.", tone: "good" } },
          { weight: 2, effect: { attrs: { defense: -2 }, teamTrust: -12, morale: -12, text: "실책이 쌓였습니다. 다시 원래 자리로 돌아갔습니다.", tone: "bad" } },
        ],
      },
      {
        label: "익숙한 자리를 지킨다",
        hint: "안정적인 수비",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { defense: 3, contact: 1 }, text: "잘하는 자리에서 더 잘하기로 했습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "if-doubleplay",
    phases: [2],
    tag: "내야수",
    title: "병살 저지 슬라이딩",
    body: "주자가 2루로 거칠게 들어옵니다. 피하면 안전하지만 병살은 물 건너갑니다.",
    positions: ["내야수"],
    choices: [
      {
        label: "버티고 던진다",
        hint: "팀 신뢰 · 충돌 위험",
        risk: "무모",
        outcomes: [
          { weight: 3, effect: { teamTrust: 14, fame: 6, attrs: { mental: 2 }, health: -8, text: "병살 완성. 넘어지면서도 1루로 던졌습니다.", tone: "good" } },
          { weight: 2, effect: { injury: { name: "발목 인대 손상", severity: 0.4 }, health: -20, text: "스파이크에 발목이 걸렸습니다. 들것에 실려 나갔습니다.", tone: "bad" } },
        ],
      },
      {
        label: "안전하게 피한다",
        hint: "부상 회피",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { health: 4, teamTrust: -5, text: "몸을 지켰습니다. 감독의 표정이 잠깐 굳었습니다.", tone: "neutral" } },
        ],
      },
    ],
  },

  /* ══════════════════ 외야수 ══════════════════ */
  {
    id: "of-fence",
    phases: [1],
    tag: "외야수",
    title: "펜스 앞의 타구",
    body: "넘어갈 듯한 타구가 담장으로 향합니다. 전력으로 달리면 닿을 것도 같습니다.",
    positions: ["외야수"],
    choices: [
      {
        label: "펜스에 부딪히며 잡는다",
        hint: "명성 폭발 · 부상 위험",
        risk: "무모",
        outcomes: [
          { weight: 3, effect: { fame: 20, teamTrust: 16, morale: 14, health: -12, attrs: { defense: 3 }, text: "홈런성 타구를 걷어냈습니다. 하이라이트 1번은 당신입니다.", tone: "good" } },
          { weight: 2, effect: { injury: { name: "어깨 타박상", severity: 0.4 }, health: -22, text: "담장에 그대로 부딪혔습니다. 공은 넘어갔고 당신은 쓰러졌습니다.", tone: "bad" } },
        ],
      },
      {
        label: "타구를 눈으로 보낸다",
        hint: "안전",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { health: 4, text: "넘어갈 공이었습니다. 무리할 이유가 없었습니다.", tone: "neutral" } },
        ],
      },
    ],
  },
  {
    id: "of-centerfield",
    phases: [0],
    tag: "외야수",
    title: "중견수 전환",
    body: "외야의 사령관 자리입니다. 발과 판단력이 받쳐줘야 하지만, 가치는 확실히 올라갑니다.",
    positions: ["외야수"],
    when: (s) => s.attrs.speed >= 62,
    choices: [
      {
        label: "중견수를 맡는다",
        hint: "수비·주력 상승 · 부담",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { attrs: { defense: 5, speed: 3, mental: 2 }, teamTrust: 14, text: "넓은 수비 범위가 팀을 살렸습니다. 외야가 당신을 중심으로 섭니다.", tone: "good" } },
          { weight: 2, effect: { attrs: { defense: -2 }, health: -10, morale: -8, text: "타구 판단이 늦었습니다. 코너 외야로 돌아갔습니다.", tone: "bad" } },
        ],
      },
      {
        label: "코너에서 방망이에 집중한다",
        hint: "타격 집중",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { power: 3, contact: 2 }, text: "수비 부담을 덜고 타격에 집중했습니다. 장타가 늘었습니다.", tone: "good" } },
        ],
      },
    ],
  },
  {
    id: "of-arm",
    phases: [2],
    tag: "외야수",
    title: "홈 승부",
    body: "3루 주자가 태그업을 준비합니다. 당신의 어깨를 시험하겠다는 뜻입니다.",
    positions: ["외야수"],
    choices: [
      {
        label: "홈으로 정확히 뿌린다",
        hint: "수비 · 명성",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { attrs: { defense: 4, mental: 2 }, fame: 12, teamTrust: 12, text: "노바운드 송구로 홈에서 잡았습니다. 구장이 뒤집혔습니다.", tone: "good" } },
          { weight: 2, effect: { teamTrust: -8, morale: -8, text: "송구가 빗나갔습니다. 주자는 여유롭게 홈을 밟았습니다.", tone: "bad" } },
        ],
      },
      {
        label: "중계 플레이로 안전하게",
        hint: "실점 허용 · 추가 진루 차단",
        risk: "안정",
        outcomes: [
          { weight: 1, effect: { attrs: { mental: 2, defense: 1 }, text: "한 점은 줬지만 후속 주자를 묶었습니다. 정석입니다.", tone: "neutral" } },
        ],
      },
    ],
  },
];
