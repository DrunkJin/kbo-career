import { LEAGUES, stripFarm } from "./data";
import { isPitcher, rand, roleFor, tournamentFor } from "./engine";
import { CAREER_EVENTS } from "./events-career";
import { POSITION_EVENTS } from "./events-position";
import { LIFE_EVENTS } from "./events-life";
import { TEAM_EVENTS } from "./events-team";
import type { Choice, GameEvent, PlayerState } from "./types";

const edge = (s: PlayerState) => s.ovr - LEAGUES[s.contract.league].level;
const lastWar = (s: PlayerState) =>
  s.seasons.length ? s.seasons[s.seasons.length - 1].stat.war : 0;
const inKorea = (s: PlayerState) => s.contract.league === "KBO" || s.contract.league === "KBO_F";

/** 단일 결과 선택지 */
const sure = (
  label: string,
  hint: string,
  risk: Choice["risk"],
  effect: Choice["outcomes"][number]["effect"],
): Choice => ({ label, hint, risk, outcomes: [{ weight: 1, effect }] });

/**
 * 공통 이벤트 풀.
 * - `for` 가 없으면 모든 포지션 공통, "batter" / "pitcher" 면 해당 포지션에게만 나옵니다.
 * - 공통 이벤트의 본문·선택지는 타석/마운드 어느 쪽에서 읽어도 어색하지 않게 씁니다.
 * - 능력치 효과는 포지션에 없는 키를 조용히 버리므로, 공통 이벤트는 양쪽 키를 함께 넣습니다.
 * (연차별 · 포지션별 · 구단별 이벤트는 events-career / -position / -team 에 있습니다)
 */
const BASE_EVENTS: GameEvent[] = [
  /* ──────────────── 스프링캠프 (phase 0) ──────────────── */
  {
    id: "camp-focus",
    phases: [0],
    tag: "SPRING CAMP",
    title: "스프링캠프 훈련 방침",
    body: "코칭스태프가 올해 당신의 훈련 주제를 묻습니다. 무엇에 시간을 쏟겠습니까?",
    variants: [
      { body: "새 시즌 첫 미팅. 코치가 화이트보드에 당신 이름을 쓰고 묻습니다. 올해 무엇을 바꿀 겁니까?" },
      { body: "전지훈련 첫날 밤. 노트를 펴고 올해의 목표를 한 줄로 적어야 합니다." },
    ],
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
    for: "batter",
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
    id: "camp-role-change",
    for: "pitcher",
    phases: [0],
    tag: "구단 요청",
    title: "보직 전환 제안",
    body: "투수코치가 당신을 부릅니다. \"불펜에 네 자리가 있다. 선발 자리는 지금 꽉 찼어.\"",
    when: (s) => edge(s) < 1 && s.seasons.length >= 1,
    choices: [
      sure("불펜으로 간다", "구위·팀 신뢰 상승 · 체력 성장 정체", "안정", {
        attrs: { movement: 3, velocity: 1 },
        teamTrust: 14,
        text: "짧은 이닝에 전력을 쏟는 법을 배웠습니다. 등판 기회가 늘었습니다.",
        tone: "good",
      }),
      sure("선발 경쟁을 계속한다", "체력 상승 · 신뢰 하락", "도전", {
        attrs: { stamina: 3, mental: 1 },
        teamTrust: -8,
        morale: 6,
        text: "로테이션 한 자리를 두고 경쟁합니다. 캠프 내내 투구수를 늘렸습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "camp-new-pitch",
    for: "pitcher",
    phases: [0],
    tag: "SPRING CAMP",
    title: "새 구종 장착",
    body: "외국인 투수가 그립을 보여줬습니다. \"시즌 전에 익히면 네 것이 된다. 아니면 아무것도 아니다.\"",
    choices: [
      {
        label: "실전에서 바로 써본다",
        hint: "구위 큰 폭 상승 또는 제구 붕괴",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { movement: 5, control: -1 }, morale: 8, text: "새 구종이 결정구가 됐습니다. 타자들의 스윙이 허공을 가릅니다.", tone: "good" } },
          { weight: 1, effect: { attrs: { control: -4 }, morale: -8, text: "릴리스 포인트가 흔들리며 기존 구종까지 무너졌습니다.", tone: "bad" } },
        ],
      },
      sure("불펜에서 천천히 익힌다", "구위 소폭 상승", "안정", {
        attrs: { movement: 2 },
        text: "시즌 중반쯤 실전에 꺼낼 수 있을 것 같습니다.",
        tone: "good",
      }),
    ],
  },
  {
    id: "camp-batting-order",
    for: "batter",
    phases: [0],
    tag: "SPRING CAMP",
    title: "타순 논의",
    body: "감독이 라인업 카드를 들고 묻습니다. \"너를 어디에 넣어야 할까.\"",
    when: (s) => edge(s) >= 0,
    choices: [
      sure("리드오프. 출루로 승부한다", "선구안·주루 상승", "안정", {
        attrs: { eye: 3, speed: 2 },
        text: "1번 타자. 매 경기 첫 타석이 당신 몫입니다.",
        tone: "good",
      }),
      {
        label: "4번. 장타로 승부한다",
        hint: "파워 상승 · 압박감",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { power: 4 }, fame: 6, text: "클린업의 무게를 견뎠습니다. 담장을 겨냥한 스윙이 몸에 붙었습니다.", tone: "good" } },
          { weight: 1, effect: { attrs: { power: 2, contact: -2 }, morale: -6, text: "큰 것만 노리다 컨택이 흐트러졌습니다.", tone: "bad" } },
        ],
      },
      sure("감독 판단에 맡긴다", "팀 신뢰 상승", "안정", {
        teamTrust: 8,
        attrs: { mental: 1 },
        text: "\"어디든 치겠습니다.\" 감독이 고개를 끄덕였습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "camp-foreign-coach",
    phases: [0],
    tag: "SPRING CAMP",
    title: "외부 코치 초빙",
    body: "구단이 해외 전문 코치를 데려왔습니다. 개인 레슨은 선착순입니다.",
    when: (s) => s.seasons.length >= 1,
    choices: [
      sure("가장 먼저 줄을 선다", "능력치 상승 · 비용", "안정", {
        attrs: { contact: 2, eye: 1, control: 2, movement: 1 },
        money: -0.5,
        text: "메커니즘을 처음부터 다시 봤습니다. 작은 수정이 큰 차이를 만들었습니다.",
        tone: "good",
      }),
      sure("기존 코치와 루틴을 지킨다", "팀 신뢰 상승", "안정", {
        teamTrust: 8,
        attrs: { mental: 1 },
        text: "익숙한 방식이 편합니다. 코치진이 당신의 충성심을 기억합니다.",
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

  /* ──────────────── 전반기 (phase 1) ──────────────── */
  {
    id: "half-slump-bat",
    for: "batter",
    phases: [1],
    tag: "부진",
    title: "길어지는 슬럼프",
    body: "타석이 낯설게 느껴집니다. 상대 배터리는 이미 당신의 약점을 알고 있습니다.",
    when: (s) => s.seasons.length >= 1 && lastWar(s) < 2.2,
    choices: [
      sure("야간 특타", "컨택 상승 · 체력 감소", "안정", {
        attrs: { contact: 3 },
        health: -12,
        text: "밤마다 남아 공을 쳤습니다. 감각이 조금씩 돌아옵니다.",
        tone: "good",
      }),
      {
        label: "영상 분석가에게 전부 맡긴다",
        hint: "크게 반등하거나, 더 헤맬 수 있음",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { mental: 3, eye: 3 }, morale: 10, text: "원인을 찾았습니다. 해답은 데이터 안에 있었습니다.", tone: "good" } },
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
    id: "half-slump-pit",
    for: "pitcher",
    phases: [1],
    tag: "부진",
    title: "길어지는 슬럼프",
    body: "마운드가 낯설게 느껴집니다. 결정구가 통하지 않고, 볼넷이 늘고 있습니다.",
    when: (s) => s.seasons.length >= 1 && lastWar(s) < 2.2,
    choices: [
      sure("불펜 피칭을 두 배로", "제구 상승 · 체력 감소", "안정", {
        attrs: { control: 3 },
        health: -12,
        text: "밤마다 불펜에 남았습니다. 공이 조금씩 원하는 곳으로 갑니다.",
        tone: "good",
      }),
      {
        label: "투구 추적 데이터를 전부 뜯어본다",
        hint: "크게 반등하거나, 더 헤맬 수 있음",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { mental: 3, movement: 3 }, morale: 10, text: "회전축이 문제였습니다. 해답은 데이터 안에 있었습니다.", tone: "good" } },
          { weight: 2, effect: { morale: -14, text: "숫자를 볼수록 생각이 많아졌습니다. 팔이 더 굳습니다.", tone: "bad" } },
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
    id: "half-beanball-bat",
    for: "batter",
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
        attrs: { mental: 3, power: 2 },
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
    id: "half-beanball-pit",
    for: "pitcher",
    phases: [1],
    tag: "벤치클리어링",
    title: "보복구 사인",
    body: "지난 타석에서 우리 팀 4번 타자가 맞았습니다. 포수가 사인을 내고 더그아웃이 당신을 봅니다.",
    choices: [
      {
        label: "몸쪽 높은 공을 던진다",
        hint: "팀 신뢰 상승 · 퇴장·징계 위험",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { teamTrust: 18, fame: 10, morale: 8, text: "타자가 맞았고 벤치가 비었습니다. 라커룸에서 당신은 영웅이 됐습니다.", tone: "good" } },
          { weight: 1, effect: { fame: -10, teamTrust: 4, health: -6, text: "즉시 퇴장. 출장 정지에 벌금까지 물었습니다.", tone: "bad" } },
        ],
      },
      sure("삼진으로 갚아준다", "집중력·구위 상승", "도전", {
        attrs: { mental: 3, movement: 2 },
        morale: 8,
        text: "가장 좋은 공 세 개로 돌려세웠습니다. 가장 완벽한 복수였습니다.",
        tone: "good",
      }),
      sure("사인을 거부하고 정상 승부", "무난", "안정", {
        attrs: { mental: 1, control: 1 },
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
          { weight: 2, effect: { teamTrust: 14, fame: 8, health: -10, text: "이를 악물고 자리를 지켰습니다. 더그아웃이 당신을 다시 봅니다.", tone: "neutral" } },
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
  {
    id: "half-pitch-count",
    for: "pitcher",
    phases: [1],
    tag: "마운드",
    title: "투구수 100개, 7회 2사",
    body: "감독이 더그아웃 계단에 발을 올렸습니다. 완투까지 아웃카운트 일곱 개가 남았습니다.",
    when: (s) => roleFor(s) === "선발",
    choices: [
      {
        label: "\"제가 끝내겠습니다\"",
        hint: "명성·체력 상승 또는 부상",
        risk: "무모",
        outcomes: [
          { weight: 3, effect: { fame: 14, teamTrust: 12, attrs: { stamina: 3, mental: 2 }, health: -8, text: "완투승. 마지막 공까지 구속이 떨어지지 않았습니다.", tone: "good" } },
          { weight: 1, effect: { injury: { name: "팔꿈치 염좌", severity: 0.5 }, health: -18, text: "8회 첫 타자에게 던진 공에서 팔꿈치가 울렸습니다.", tone: "bad" } },
        ],
      },
      sure("공을 넘긴다", "체력 보존", "안정", {
        health: 4,
        teamTrust: 4,
        text: "박수를 받으며 내려왔습니다. 불펜이 승리를 지켰습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "half-steal",
    for: "batter",
    phases: [1],
    tag: "주루",
    title: "그린라이트",
    body: "1루. 상대 투수의 견제가 느립니다. 감독이 당신의 판단에 맡겼습니다.",
    when: (s) => s.attrs.speed >= 55,
    choices: [
      {
        label: "초구에 뛴다",
        hint: "주루 상승 · 실패 시 신뢰 하락",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { attrs: { speed: 3, mental: 1 }, fame: 6, text: "세이프. 상대 배터리가 흔들리기 시작했습니다.", tone: "good" } },
          { weight: 1, effect: { teamTrust: -6, morale: -6, text: "아웃. 이닝이 그렇게 끝났습니다. 감독의 표정이 굳었습니다.", tone: "bad" } },
        ],
      },
      sure("타자에게 맡긴다", "무난", "안정", {
        attrs: { eye: 1 },
        text: "리드를 길게 잡는 것으로 만족했습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "half-sns",
    phases: [1],
    tag: "SNS",
    title: "새벽의 게시물",
    body: "팬이 올린 사진 한 장이 퍼지고 있습니다. 경기 전날 밤, 당신이 술집에 있었습니다.",
    when: (s) => s.fame >= 20,
    choices: [
      sure("즉시 사과문을 올린다", "명성 소폭 하락 · 신뢰 유지", "안정", {
        fame: -6,
        teamTrust: 4,
        attrs: { mental: 2 },
        text: "빠른 사과가 불을 껐습니다. 이틀 뒤 아무도 이야기하지 않았습니다.",
        tone: "neutral",
      }),
      {
        label: "무대응으로 버틴다",
        hint: "잠잠해지거나 커지거나",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { mental: 2 }, text: "며칠 시끄럽더니 다른 이슈에 묻혔습니다.", tone: "neutral" } },
          { weight: 1, effect: { fame: -16, teamTrust: -12, morale: -8, text: "구단이 먼저 징계를 발표했습니다. 팬들이 등을 돌렸습니다.", tone: "bad" } },
        ],
      },
    ],
  },

  /* ──────────────── 후반기 / 데드라인 (phase 2) ──────────────── */
  {
    id: "dead-trade",
    phases: [2],
    tag: "트레이드 데드라인",
    title: "당신의 이름이 트레이드 명단에",
    body: "기자의 전화가 먼저 왔습니다. 구단은 아직 아무 말이 없습니다.",
    variants: [
      { body: "단장실 불이 늦게까지 켜져 있습니다. 데드라인 사흘 전, 당신 이름이 오르내린다는 기사가 났습니다." },
    ],
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
    variants: [
      { body: "잔여 경기 20. 5위와 반 경기 차. 감독은 당신을 매 경기 내보낼 생각입니다." },
      { body: "9월 첫날, 순위표가 매일 바뀝니다. 벤치 분위기가 팽팽합니다." },
    ],
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
      sure("휴식일을 지키며 관리받는다", "체력 유지", "안정", {
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
    id: "dead-clutch-bat",
    for: "batter",
    phases: [2],
    tag: "결정적 순간",
    title: "9회말 2사 만루",
    body: "한 점 차. 타석에 당신이 섰습니다. 만원 관중이 일어섰습니다.",
    when: (s) => edge(s) >= -2,
    choices: [
      {
        label: "초구부터 풀스윙",
        hint: "영웅이 되거나 역적이 되거나",
        risk: "무모",
        outcomes: [
          { weight: 5, effect: { fame: 26, morale: 16, teamTrust: 14, attrs: { mental: 4 }, trait: "클러치", text: "끝내기. 구장이 무너질 듯 울렸습니다. 당신의 이름이 하이라이트를 채웁니다.", tone: "good" } },
          { weight: 4, effect: { fame: -14, morale: -18, text: "헛스윙 삼진. 정적 속에서 걸어 나왔습니다. 이 장면은 오래 회자될 겁니다.", tone: "bad" } },
        ],
      },
      sure("볼넷이라도 골라낸다", "무난한 결과", "안정", {
        attrs: { eye: 2, mental: 1 },
        morale: -2,
        text: "풀카운트 끝에 밀어내기. 경기는 다음 타자에게 넘어갔습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "dead-clutch-pit",
    for: "pitcher",
    phases: [2],
    tag: "결정적 순간",
    title: "9회말 2사 만루, 마운드",
    body: "한 점 차. 상대 4번 타자. 감독은 교체 없이 당신에게 맡겼습니다.",
    when: (s) => edge(s) >= -2,
    choices: [
      {
        label: "가장 좋은 공으로 정면승부",
        hint: "영웅이 되거나 역적이 되거나",
        risk: "무모",
        outcomes: [
          { weight: 5, effect: { fame: 26, morale: 16, teamTrust: 14, attrs: { mental: 4 }, trait: "클러치", text: "헛스윙 삼진. 포수가 달려와 당신을 안았습니다. 이 장면이 하이라이트를 채웁니다.", tone: "good" } },
          { weight: 4, effect: { fame: -14, morale: -18, text: "끝내기 안타. 정적 속에서 마운드를 내려왔습니다. 이 장면은 오래 회자될 겁니다.", tone: "bad" } },
        ],
      },
      sure("유인구로 승부를 피한다", "무난한 결과", "안정", {
        attrs: { control: 2, mental: 1 },
        morale: -2,
        text: "볼넷 밀어내기. 다음 타자에게 공을 넘기고 내려왔습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "dead-closer",
    for: "pitcher",
    phases: [2],
    tag: "보직",
    title: "마무리 공석",
    body: "마무리 투수가 부상으로 이탈했습니다. 감독이 당신을 9회에 세우고 싶어합니다.",
    when: (s) => roleFor(s) !== "재활" && edge(s) >= 0,
    choices: [
      {
        label: "9회를 맡는다",
        hint: "명성·구위 상승 · 블론 위험",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { fame: 14, teamTrust: 12, attrs: { velocity: 2, mental: 3 }, text: "한 달 동안 세이브를 쌓았습니다. 등장곡이 울리면 관중이 일어납니다.", tone: "good" } },
          { weight: 2, effect: { fame: -8, morale: -12, teamTrust: -6, text: "연속 블론세이브. 9회의 무게는 생각보다 무거웠습니다.", tone: "bad" } },
        ],
      },
      sure("지금 보직을 지킨다", "체력·안정", "안정", {
        attrs: { stamina: 2 },
        teamTrust: -3,
        text: "감독은 다른 투수를 골랐습니다. 당신은 자기 자리를 지켰습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "dead-hr-race",
    for: "batter",
    phases: [2],
    tag: "타이틀",
    title: "홈런왕 레이스",
    body: "타이틀 경쟁자와 두 개 차. 남은 경기마다 기자들이 당신의 스윙만 봅니다.",
    when: (s) => s.attrs.power >= 68 && edge(s) >= 1,
    choices: [
      {
        label: "매 타석 담장을 노린다",
        hint: "파워·명성 상승 · 컨택 하락",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { power: 4, contact: -1 }, fame: 18, morale: 12, text: "타이틀을 가져왔습니다. 시상식에서 당신의 이름이 불렸습니다.", tone: "good" } },
          { weight: 2, effect: { attrs: { contact: -3 }, fame: 4, morale: -8, text: "큰 스윙만 하다 마지막 주에 타율이 무너졌습니다.", tone: "bad" } },
        ],
      },
      sure("팀 승리에만 맞춘다", "팀 신뢰 상승", "안정", {
        teamTrust: 12,
        attrs: { eye: 2 },
        text: "타이틀은 놓쳤지만 팀은 순위를 지켰습니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "dead-award-race",
    phases: [2],
    tag: "타이틀",
    title: "시즌 MVP 후보",
    body: "기자단 투표 이야기가 나옵니다. 남은 한 달, 어떻게 마무리하겠습니까?",
    when: (s) => s.fame >= 45 && edge(s) >= 3,
    choices: [
      sure("기록을 관리한다", "명성 상승 · 팀 신뢰 하락", "도전", {
        fame: 16,
        teamTrust: -8,
        attrs: { mental: 1 },
        text: "개인 기록은 지켰습니다. 라커룸 일부가 곱지 않은 눈으로 봅니다.",
        tone: "neutral",
      }),
      sure("팀 우선. 기록은 따라온다", "팀 신뢰·멘탈 상승", "안정", {
        teamTrust: 14,
        attrs: { mental: 3 },
        fame: 6,
        text: "표는 당신에게 갔습니다. 동료들이 가장 먼저 축하했습니다.",
        tone: "good",
      }),
    ],
  },
  {
    id: "dead-fan-event",
    phases: [2],
    tag: "팬서비스",
    title: "어린이 팬의 편지",
    body: "투병 중인 어린 팬이 편지를 보냈습니다. \"다음 경기에서 홈런(삼진) 하나만요.\"",
    choices: [
      sure("병원을 직접 찾아간다", "명성·멘탈 상승 · 체력 소모", "안정", {
        fame: 10,
        morale: 10,
        health: -4,
        attrs: { mental: 2 },
        text: "경기 다음 날 병실에서 사인볼을 건넸습니다. 사진이 조용히 퍼졌습니다.",
        tone: "good",
      }),
      sure("답장과 사인볼을 보낸다", "명성 소폭 상승", "안정", {
        fame: 4,
        morale: 4,
        text: "짧은 편지를 썼습니다. 아이가 답장을 보냈습니다.",
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
    variants: [
      { body: "첫눈이 내렸습니다. 다음 캠프까지 석 달. 이 겨울을 어디에 쓸지 정해야 합니다." },
      { body: "시즌 마지막 경기가 끝난 지 일주일. 몸은 아직 무겁고 머리는 벌써 내년입니다." },
    ],
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
    id: "off-elbow",
    for: "pitcher",
    phases: [4],
    tag: "의료진 소견",
    title: "팔꿈치 정밀 검진",
    body: "MRI에 작은 그림자가 보입니다. 지금은 던질 수 있지만, 의사는 말을 아낍니다.",
    when: (s) => !s.injury && s.health >= 65 && s.age >= 24,
    choices: [
      sure("예방 차원에서 던지는 양을 줄인다", "내구 상승 · 구속 소폭 하락", "안정", {
        attrs: { durability: 3, velocity: -1 },
        health: 10,
        text: "겨울 내내 투구 프로그램을 절반으로 줄였습니다. 팔이 가볍습니다.",
        tone: "neutral",
      }),
      {
        label: "평소대로 던진다",
        hint: "성장 유지 · 부상 위험",
        risk: "무모",
        outcomes: [
          { weight: 2, effect: { attrs: { velocity: 2 }, text: "아무 일도 없었습니다. 구속이 오히려 올랐습니다.", tone: "good" } },
          { weight: 1, effect: { injury: { name: "인대 부분 손상", severity: 0.7 }, health: -20, attrs: { durability: -3 }, text: "1월 불펜 피칭 도중 팔꿈치에서 소리가 났습니다.", tone: "bad" } },
        ],
      },
    ],
  },
  {
    id: "off-swing-rebuild",
    for: "batter",
    phases: [4],
    tag: "오프시즌",
    title: "스윙 리빌딩",
    body: "타격코치가 영상을 멈췄습니다. \"이 궤적으로는 여기까지야. 겨울에 다 뜯어고치자.\"",
    when: (s) => s.seasons.length >= 1 && s.age <= 31,
    choices: [
      {
        label: "처음부터 다시 만든다",
        hint: "파워·컨택 큰 폭 상승 또는 시즌 초 부진",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { attrs: { power: 4, contact: 3 }, morale: 6, text: "새 스윙이 자리 잡았습니다. 타구 속도가 눈에 띄게 올랐습니다.", tone: "good" } },
          { weight: 1, effect: { attrs: { contact: -3 }, morale: -10, text: "겨울 내내 헤맸습니다. 봄이 됐는데 아직 내 스윙이 아닙니다.", tone: "bad" } },
        ],
      },
      sure("지금 스윙을 다듬는다", "소폭 상승 · 안정", "안정", {
        attrs: { contact: 2, eye: 1 },
        text: "익숙한 스윙에 작은 수정만 더했습니다.",
        tone: "good",
      }),
    ],
  },
  {
    id: "off-agent",
    phases: [4],
    tag: "에이전트",
    title: "에이전트 교체 제안",
    body: "대형 에이전시가 당신을 원합니다. 협상력은 곧 계약 규모입니다.",
    when: (s) => s.ovr >= 68 && !s.traits.includes("협상가"),
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
    id: "off-salary",
    phases: [4],
    tag: "연봉 협상",
    title: "연봉 협상 테이블",
    body: "구단이 제시한 숫자는 당신의 기대보다 낮습니다. 서명하지 않으면 캠프에 늦을 수도 있습니다.",
    when: (s) => s.contract.left >= 2 && s.seasons.length >= 1 && lastWar(s) >= 1.5,
    choices: [
      {
        label: "버틴다. 내 가치는 이 숫자가 아니다",
        hint: "수입 상승 또는 신뢰 하락",
        risk: "도전",
        outcomes: [
          { weight: 2, effect: { money: 2, fame: 4, text: "구단이 결국 물러섰습니다. 인상된 계약서에 서명했습니다.", tone: "good" } },
          { weight: 1, effect: { teamTrust: -14, morale: -6, money: 0.5, text: "캠프 첫 주를 놓쳤습니다. 구단은 원래 숫자에서 거의 움직이지 않았습니다.", tone: "bad" } },
        ],
      },
      sure("제시안에 서명한다", "팀 신뢰 상승", "안정", {
        teamTrust: 10,
        money: 0.5,
        text: "\"돈보다 야구.\" 구단이 이 말을 기억할 겁니다.",
        tone: "neutral",
      }),
    ],
  },
  {
    id: "off-military",
    phases: [4],
    tag: "병역",
    title: "병역 문제",
    body: "더 이상 미룰 수 없습니다. 커리어의 한가운데에 2년의 공백이 놓입니다.",
    when: (s) => s.age >= 26 && s.age <= 29 && !s.traits.includes("병역해결") && inKorea(s),
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
  {
    id: "off-winter-league",
    phases: [4],
    tag: "오프시즌",
    title: "윈터리그 파견",
    body: "구단이 해외 윈터리그 출전을 제안했습니다. 실전 경험은 늘지만 쉬는 겨울은 없습니다.",
    when: (s) => s.age <= 27 && edge(s) < 3,
    choices: [
      {
        label: "비행기를 탄다",
        hint: "능력치·명성 상승 · 체력 소모",
        risk: "도전",
        outcomes: [
          { weight: 3, effect: { attrs: { contact: 2, eye: 2, control: 2, movement: 2 }, fame: 6, health: -14, text: "낯선 리그에서 매일 경기했습니다. 봄이 왔을 때 당신은 다른 선수였습니다.", tone: "good" } },
          { weight: 1, effect: { health: -20, morale: -6, text: "지쳐서 돌아왔습니다. 캠프 시작부터 몸이 무겁습니다.", tone: "bad" } },
        ],
      },
      sure("국내에서 몸을 만든다", "체력 회복", "안정", {
        health: 14,
        text: "쉬면서 준비했습니다. 무난한 겨울이었습니다.",
        tone: "neutral",
      }),
    ],
  },
];

/** 기본 + 연차별 + 포지션별 + 구단별 이벤트 전체 */
export const EVENTS: GameEvent[] = [
  ...BASE_EVENTS,
  ...CAREER_EVENTS,
  ...POSITION_EVENTS,
  ...TEAM_EVENTS,
  ...LIFE_EVENTS,
];

/**
 * 포지션 조건.
 * `for` 는 타자/투수 두 갈래, `positions` 는 네 포지션 중 지정한 것만.
 */
const fitsPosition = (e: GameEvent, s: PlayerState) =>
  (!e.for || (e.for === "pitcher") === isPitcher(s.position)) &&
  (!e.positions || e.positions.includes(s.position));

/** 이 이벤트가 지금 이 선수에게 등장할 수 있는가 */
export function eventFits(e: GameEvent, s: PlayerState, phase: number, usedIds: string[]) {
  if (!e.phases.includes(phase as never)) return false;
  if (!e.repeatable && usedIds.includes(e.id)) return false;
  if (!fitsPosition(e, s)) return false;
  if (e.leagues && !e.leagues.includes(s.contract.league)) return false;
  if (e.teams && !e.teams.includes(stripFarm(s.contract.team))) return false;
  const yearNo = s.seasons.length + 1; // 프로 1년차부터
  if (e.minSeason !== undefined && yearNo < e.minSeason) return false;
  if (e.maxSeason !== undefined && yearNo > e.maxSeason) return false;
  if (e.when && !e.when(s)) return false;
  return true;
}

/**
 * 현재 상태에서 발생 가능한 이벤트 중 하나를 뽑습니다.
 * - usedIds: 이번 시즌에 이미 나온 이벤트 (항상 제외)
 * - recentIds: 최근 시즌들에 나온 이벤트 (풀이 비지 않는 한 제외 → 연속 반복 방지)
 * - seenIds: 커리어 전체에서 나온 이벤트 (가중치 0.3배 → 처음 보는 이벤트 우선)
 * 조건이 구체적인 이벤트(구단·포지션·연차 지정)일수록 가중치를 올려,
 * 범용 이벤트에 묻히지 않고 제때 등장하게 합니다.
 */
export function drawEvent(
  s: PlayerState,
  phase: number,
  usedIds: string[],
  recentIds: string[] = [],
  seenIds: string[] = [],
): GameEvent | null {
  const base = EVENTS.filter((e) => eventFits(e, s, phase, usedIds));
  if (!base.length) return null;
  const fresh = base.filter((e) => !recentIds.includes(e.id));
  const pool = fresh.length ? fresh : base;
  const weightOf = (e: GameEvent) => {
    let w = e.weight ?? 1;
    if (e.teams) w *= 2.6;
    else if (e.positions) w *= 1.9;
    else if (e.minSeason !== undefined || e.maxSeason !== undefined) w *= 1.5;
    else if (e.leagues) w *= 1.4;
    // 커리어에서 이미 본 이벤트는 처음 보는 것보다 훨씬 덜 뽑힙니다
    if (seenIds.includes(e.id)) w *= 0.3;
    return w;
  };
  const total = pool.reduce((a, e) => a + weightOf(e), 0);
  let r = rand(total);
  let chosen = pool[0];
  for (const e of pool) {
    r -= weightOf(e);
    if (r <= 0) {
      chosen = e;
      break;
    }
  }
  return withVariant(chosen);
}

/** 변형 본문이 있으면 그중 하나(원본 포함)를 골라 적용한 사본을 돌려줍니다 */
function withVariant(e: GameEvent): GameEvent {
  if (!e.variants?.length) return e;
  const idx = Math.floor(rand(e.variants.length + 1));
  if (idx === e.variants.length) return e; // 원본
  const v = e.variants[idx];
  return { ...e, title: v.title ?? e.title, body: v.body };
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
