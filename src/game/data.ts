import type { LeagueId, Position } from "./types";

export type TeamInfo = {
  name: string;
  slug: string;
  league: LeagueId;
  /** 구단 전력 1(약체) ~ 10(우승후보) */
  power: number;
  /** 자금력 — 계약 규모 배수 */
  rich: number;
  color: string;
};

const t = (
  name: string,
  slug: string,
  league: LeagueId,
  power: number,
  rich: number,
  color: string,
): TeamInfo => ({ name, slug, league, power, rich, color });

export const KBO_TEAMS: TeamInfo[] = [
  t("LG 트윈스", "lg", "KBO", 8, 9, "#c30452"),
  t("한화 이글스", "hanwha", "KBO", 7, 8, "#fc4e00"),
  t("삼성 라이온즈", "samsung", "KBO", 7, 9, "#074ca1"),
  t("두산 베어스", "doosan", "KBO", 6, 8, "#131230"),
  t("SSG 랜더스", "ssg", "KBO", 6, 9, "#ce0e2d"),
  t("롯데 자이언츠", "lotte", "KBO", 5, 7, "#041e42"),
  t("KT 위즈", "kt", "KBO", 6, 7, "#000000"),
  t("KIA 타이거즈", "kia", "KBO", 8, 8, "#ea0029"),
  t("NC 다이노스", "nc", "KBO", 5, 6, "#315288"),
  t("키움 히어로즈", "kiwoom", "KBO", 4, 4, "#570514"),
];

export const NPB_TEAMS: TeamInfo[] = [
  t("요미우리 자이언츠", "yomiuri", "NPB", 9, 10, "#f97709"),
  t("한신 타이거스", "hanshin", "NPB", 8, 9, "#ffe100"),
  t("주니치 드래곤즈", "chunichi", "NPB", 5, 7, "#003595"),
  t("요코하마 DeNA 베이스타즈", "denabay", "NPB", 6, 7, "#0092e5"),
  t("도쿄 야쿠르트 스왈로즈", "yakult", "NPB", 6, 6, "#98c145"),
  t("히로시마 도요 카프", "hiroshima", "NPB", 6, 6, "#ff0000"),
  t("후쿠오카 소프트뱅크 호크스", "softbank", "NPB", 9, 10, "#fcc800"),
  t("오릭스 버팔로스", "orix", "NPB", 7, 8, "#000019"),
  t("지바 롯데 마린스", "chibalotte", "NPB", 6, 7, "#000000"),
  t("사이타마 세이부 라이온즈", "seibu", "NPB", 5, 7, "#102b6a"),
  t("도호쿠 라쿠텐 골든이글스", "rakuten", "NPB", 5, 7, "#870010"),
  t("홋카이도 닛폰햄 파이터즈", "nipponham", "NPB", 7, 7, "#02518e"),
];

export const MLB_TEAMS: TeamInfo[] = [
  t("Los Angeles Dodgers", "dodgers", "MLB", 10, 10, "#005a9c"),
  t("New York Yankees", "yankees", "MLB", 9, 10, "#132448"),
  t("Atlanta Braves", "braves", "MLB", 8, 8, "#ce1141"),
  t("Houston Astros", "astros", "MLB", 8, 8, "#eb6e1f"),
  t("Philadelphia Phillies", "phillies", "MLB", 8, 9, "#e81828"),
  t("San Diego Padres", "padres", "MLB", 7, 8, "#2f241d"),
  t("Seattle Mariners", "mariners", "MLB", 7, 7, "#0c2c56"),
  t("Texas Rangers", "rangers", "MLB", 7, 8, "#003278"),
  t("New York Mets", "mets", "MLB", 7, 10, "#ff5910"),
  t("Baltimore Orioles", "orioles", "MLB", 7, 6, "#df4601"),
  t("Chicago Cubs", "cubs", "MLB", 6, 8, "#0e3386"),
  t("Boston Red Sox", "redsox", "MLB", 6, 9, "#bd3039"),
  t("Toronto Blue Jays", "bluejays", "MLB", 6, 8, "#134a8e"),
  t("Minnesota Twins", "twins", "MLB", 6, 6, "#002b5c"),
  t("Milwaukee Brewers", "brewers", "MLB", 6, 5, "#12284b"),
  t("Arizona Diamondbacks", "dbacks", "MLB", 6, 6, "#a71930"),
  t("San Francisco Giants", "giants", "MLB", 6, 8, "#fd5a1e"),
  t("St. Louis Cardinals", "cardinals", "MLB", 6, 7, "#c41e3a"),
  t("Tampa Bay Rays", "rays", "MLB", 5, 3, "#092c5c"),
  t("Cleveland Guardians", "guardians", "MLB", 6, 5, "#00385d"),
  t("Detroit Tigers", "tigers", "MLB", 5, 6, "#0c2340"),
  t("Cincinnati Reds", "reds", "MLB", 5, 5, "#c6011f"),
  t("Kansas City Royals", "royals", "MLB", 5, 4, "#004687"),
  t("Los Angeles Angels", "angels", "MLB", 4, 8, "#ba0021"),
  t("Pittsburgh Pirates", "pirates", "MLB", 4, 4, "#fdb827"),
  t("Washington Nationals", "nationals", "MLB", 4, 6, "#ab0003"),
  t("Miami Marlins", "marlins", "MLB", 3, 3, "#00a3e0"),
  t("Colorado Rockies", "rockies", "MLB", 3, 5, "#33006f"),
  t("Chicago White Sox", "whitesox", "MLB", 3, 6, "#27251f"),
  t("Athletics", "athletics", "MLB", 3, 3, "#003831"),
];

export const ALL_TEAMS = [...KBO_TEAMS, ...NPB_TEAMS, ...MLB_TEAMS];

const BY_NAME = new Map(ALL_TEAMS.map((x) => [x.name, x]));
export const teamInfo = (name: string) => BY_NAME.get(stripFarm(name));

/** "LG 트윈스 (퓨처스)", "Seattle Mariners AAA" → 모구단 이름 */
export function stripFarm(name: string) {
  return name.replace(/\s*\((퓨처스|2군|팜)\)$/, "").replace(/\s+(AAA|AA)$/, "");
}

const LOGO_EXT: Record<string, "svg" | "png"> = {};
MLB_TEAMS.forEach((x) => (LOGO_EXT[x.slug] = "svg"));

export function teamLogo(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const info = teamInfo(name);
  if (!info) return undefined;
  const ext = LOGO_EXT[info.slug] ?? "png";
  return `${import.meta.env.BASE_URL}logo/${info.slug}.${ext}`;
}

/** 구단 일러스트 파일명이 슬러그와 다른 경우 */
const ART_FILE: Record<string, string> = { hanwha: "hanhwa" };

/** KBO 구단 일러스트 (img/*.jpg 가 있는 KBO 10개 구단만) */
export function teamArt(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const info = teamInfo(name);
  if (!info || info.league !== "KBO") return undefined;
  return `${import.meta.env.BASE_URL}${ART_FILE[info.slug] ?? info.slug}.jpg`;
}

export function teamColor(name: string | undefined) {
  return (name ? teamInfo(name)?.color : undefined) ?? "#1f3a5f";
}

export type LeagueInfo = {
  id: LeagueId;
  label: string;
  short: string;
  /** 리그 평균 수준 (OVR 기준) */
  level: number;
  games: number;
  /** 1억원 기준 연봉 스케일 */
  pay: number;
  currency: string;
  /** 상위 리그 계단 */
  tier: number;
};

export const LEAGUES: Record<LeagueId, LeagueInfo> = {
  KBO_F: { id: "KBO_F", label: "KBO 퓨처스리그", short: "퓨처스", level: 52, games: 100, pay: 0.35, currency: "₩", tier: 1 },
  KBO: { id: "KBO", label: "KBO 리그", short: "KBO", level: 66, games: 144, pay: 2.2, currency: "₩", tier: 3 },
  NPB_F: { id: "NPB_F", label: "NPB 2군", short: "NPB 2군", level: 58, games: 120, pay: 0.6, currency: "¥", tier: 2 },
  NPB: { id: "NPB", label: "일본프로야구", short: "NPB", level: 72, games: 143, pay: 5, currency: "¥", tier: 4 },
  AA: { id: "AA", label: "Double-A", short: "AA", level: 60, games: 138, pay: 0.4, currency: "$", tier: 2 },
  AAA: { id: "AAA", label: "Triple-A", short: "AAA", level: 68, games: 150, pay: 1.2, currency: "$", tier: 3 },
  MLB: { id: "MLB", label: "메이저리그", short: "MLB", level: 80, games: 162, pay: 14, currency: "$", tier: 5 },
};

export const POSITIONS: { id: Position; label: string; desc: string; number: string }[] = [
  { id: "투수", label: "투수", desc: "구속·제구·구위로 상대를 압도합니다", number: "18" },
  { id: "포수", label: "포수", desc: "수비와 리드가 곧 가치, 성장은 느립니다", number: "22" },
  { id: "내야수", label: "내야수", desc: "컨택과 수비의 균형형, 안정적인 성장", number: "7" },
  { id: "외야수", label: "외야수", desc: "파워와 주력으로 존재감을 만듭니다", number: "51" },
];

export const KOREAN_NAMES = [
  "김도윤", "이현우", "박준서", "최민재", "정시우", "강우진",
  "조은결", "윤태오", "장서준", "임하람", "오지훈", "한도경",
];

export const FIRST_TRAITS = [
  "클러치", "유리몸", "연습벌레", "천재형", "대기만성", "멘탈갑",
];
