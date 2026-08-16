export type Position = "투수" | "포수" | "내야수" | "외야수";

export type LeagueId =
  | "KBO_F"
  | "KBO"
  | "NPB_F"
  | "NPB"
  | "AA"
  | "AAA"
  | "MLB";

export type Attrs = {
  /** 타자 */
  contact: number;
  power: number;
  eye: number;
  speed: number;
  defense: number;
  /** 투수 */
  velocity: number;
  control: number;
  movement: number;
  stamina: number;
  /** 공통 */
  mental: number;
  durability: number;
};

export type AttrKey = keyof Attrs;

export type Contract = {
  team: string;
  league: LeagueId;
  /** 연봉 (억원 환산) */
  salary: number;
  /** 총 계약 연수 */
  years: number;
  /** 남은 연수 */
  left: number;
  label: string;
};

export type BatterLine = {
  kind: "batter";
  g: number;
  pa: number;
  h: number;
  hr: number;
  rbi: number;
  sb: number;
  avg: number;
  obp: number;
  slg: number;
  war: number;
};

export type PitcherLine = {
  kind: "pitcher";
  g: number;
  ip: number;
  w: number;
  l: number;
  sv: number;
  so: number;
  era: number;
  whip: number;
  war: number;
};

export type StatLine = BatterLine | PitcherLine;

export type SeasonRecord = {
  year: number;
  age: number;
  team: string;
  league: LeagueId;
  ovr: number;
  role: Role;
  stat: StatLine;
  awards: string[];
  teamResult: string;
};

export type Role = "주전" | "준주전" | "백업" | "선발" | "불펜" | "마무리" | "재활";

export type Phase = 0 | 1 | 2 | 3 | 4;
/** 0 스프링캠프 · 1 전반기 · 2 후반기 · 3 시즌 결산 · 4 오프시즌 */

export type Injury = {
  name: string;
  /** 남은 시즌 수 (0.5 = 시즌 절반) */
  severity: number;
} | null;

export type IntlRecord = {
  year: number;
  tournament: string;
  result: string;
  medal: "금" | "은" | "동" | "";
  note: string;
};

export type Effect = {
  attrs?: Partial<Attrs>;
  health?: number;
  fame?: number;
  morale?: number;
  money?: number;
  teamTrust?: number;
  injury?: { name: string; severity: number };
  trait?: string;
  /** 포지션에 맞춰 동적으로 능력치를 올립니다 (강점 집중 / 약점 보완) */
  focus?: "strength" | "weakness";
  /** 국제대회 전적 기록 (대회명은 연도로 자동 결정) */
  intl?: { result: string; medal: "금" | "은" | "동" | ""; note: string };
  text: string;
  tone?: "good" | "bad" | "neutral";
};

export type Outcome = { weight: number; effect: Effect };

export type Choice = {
  label: string;
  hint: string;
  risk: "안정" | "도전" | "무모";
  /** 가중치 기반 랜덤 결과. 하나면 확정 결과 */
  outcomes: Outcome[];
};

export type GameEvent = {
  id: string;
  phases: Phase[];
  tag: string;
  title: string;
  body: string;
  weight?: number;
  when?: (s: PlayerState) => boolean;
  choices: Choice[];
};

export type Offer = {
  team: string;
  league: LeagueId;
  salary: number;
  years: number;
  label: string;
  role: Role;
  note: string;
  kind: "잔류" | "이적" | "콜업" | "강등" | "해외진출" | "복귀";
};

export type PlayerState = {
  name: string;
  position: Position;
  bats: string;
  year: number;
  age: number;
  attrs: Attrs;
  /** 숨은 잠재력 상한 */
  potential: number;
  ovr: number;
  peakOvr: number;
  health: number;
  fame: number;
  morale: number;
  teamTrust: number;
  /** 통산 수입 (억원) */
  earnings: number;
  contract: Contract;
  traits: string[];
  injury: Injury;
  seasons: SeasonRecord[];
  awards: string[];
  intl: IntlRecord[];
  rings: number;
  /** 현 리그 누적 시즌 (FA 산정) */
  serviceKBO: number;
  serviceMLB: number;
  phase: Phase;
  retired: boolean;
  fatigueUsed: number;
};
