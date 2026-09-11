import { LEAGUES } from "./data";
import type { PlayerState, Role, StatLine } from "./types";

// 문구 선택이 경기·성장 시뮬레이션의 난수 순서를 바꾸지 않도록 합니다.
function variant(s: PlayerState, lines: readonly string[], salt = 0) {
  const seed = Array.from(s.name).reduce((n, c) => n + c.charCodeAt(0), salt);
  return lines[((seed + s.year) % lines.length + lines.length) % lines.length];
}

const GRADES = [
  [8, ["리그의 기준을 바꾼 압도적인 시즌입니다.", "한 선수의 활약이 어디까지 갈 수 있는지 보여줬습니다.", "커리어를 돌아볼 때 가장 먼저 떠올릴 만한 한 해입니다."]],
  [6, ["리그 정상급 활약으로 시즌을 이끌었습니다.", "상대가 가장 경계하는 선수 중 하나로 한 해를 마쳤습니다.", "스타라는 평가를 기록으로 증명한 시즌입니다."]],
  [4, ["팀의 핵심으로 제 몫 이상을 해낸 시즌입니다.", "승리에 꾸준히 힘을 보탠 훌륭한 한 해입니다.", "주어진 기회를 높은 기여도로 돌려줬습니다."]],
  [2.5, ["꾸준한 기여로 좋은 시즌을 완성했습니다.", "한 시즌을 맡길 만한 실력을 기록에 남겼습니다.", "팀에 분명한 보탬이 된 알찬 한 해입니다."]],
  [1.5, ["자신의 몫을 해낸 준수한 시즌입니다.", "눈부신 한 해는 아니어도 팀에 꾸준히 기여했습니다.", "성실하게 쌓은 활약이 시즌 기록에 남았습니다."]],
  [0.5, ["크지는 않아도 팀에 플러스가 되는 기여를 남겼습니다.", "보탬이 된 부분과 보완할 과제가 함께 남은 시즌입니다.", "작은 기여를 쌓았습니다. 다음 목표는 그 폭을 넓히는 일입니다."]],
  [0, ["종합 기여도는 아직 크지 않습니다. 기록 속 장단점을 돌아볼 때입니다.", "큰 도약으로 이어지지는 않았지만 다음 시즌의 과제를 확인했습니다.", "시즌 전체를 바꿀 활약까지는 닿지 못했습니다. 한 단계 더 나아갈 준비가 필요합니다."]],
  [-Infinity, ["종합 성적에는 아쉬움이 남았습니다. 흔들린 부분을 다시 다듬어야 합니다.", "뜻대로 풀리지 않은 시즌입니다. 다음 준비는 부진의 원인을 찾는 데서 시작됩니다.", "팀에 보탬이 되려던 목표에는 미치지 못했습니다. 반등을 위한 정비가 필요합니다."]],
] as const;

export function narrateSeason(s: PlayerState, stat: StatLine, awards: string[], injury: PlayerState["injury"], champion: boolean, role: Role) {
  const choose = (lines: readonly string[], salt = 0) => variant(s, lines, salt);
  const games = LEAGUES[s.contract.league].games;
  const limited = stat.kind === "batter" ? stat.pa < games * 1.5 : stat.ip < (role === "선발" ? games * 0.4 : games * 0.12);
  const absent = stat.g === 0 || (stat.kind === "batter" ? stat.pa === 0 : stat.ip === 0);
  const strongRate = stat.kind === "batter" ? stat.obp + stat.slg >= 0.8 : stat.era <= 3.3 && stat.whip <= 1.25;
  const relief = stat.kind === "pitcher" && (role === "불펜" || role === "마무리");
  let summary: string;
  if (absent) {
    summary = choose(["평가할 출장 기록이 없는 시즌입니다. 다음 목표는 실전 복귀입니다.", "기록을 쌓을 기회가 없었습니다. 경기장으로 돌아가는 준비가 우선입니다.", "실전 성적보다 다음 출장을 준비하는 시간이 된 한 해입니다."]);
  } else if (limited && stat.war < 1.5) {
    summary = strongRate
      ? choose(["짧은 출장이었지만 내용은 좋았습니다. 더 많은 기회에서 이어갈 차례입니다.", "누적 기록은 작아도 주어진 기회에서 가능성을 보여줬습니다.", "제한된 기회 속 좋은 성적을 남겼습니다. 꾸준함은 더 지켜봐야 합니다."])
      : stat.war < 0
        ? choose(["제한된 출장 속 성적도 아쉬웠습니다. 적은 기회를 살릴 준비가 필요합니다.", "기회도 성과도 부족했던 한 해입니다. 실전 감각부터 다시 끌어올려야 합니다.", "짧은 출전에서 어려움을 겪었습니다. 이 기록만으로 한계를 단정할 수는 없습니다."])
        : choose(["출장 기회가 적어 누적 성적만으로 평가하기는 이릅니다.", "많이 뛰지는 못했습니다. 다음 시즌은 기회를 늘리는 것이 첫 과제입니다.", "짧은 출장 속에 경험을 쌓았습니다. 더 긴 호흡의 검증이 남았습니다."]);
  } else if (relief && strongRate && stat.war < 2.5 && stat.war >= 0) {
    summary = choose(["누적 WAR 이상의 의미가 있는 구원 등판이었습니다. 실점과 출루를 잘 억제했습니다.", "짧은 이닝을 맡는 역할에서도 안정적인 투구 내용을 남겼습니다.", "많은 이닝을 던지지는 않아도 마운드에서 제 몫을 해냈습니다."]);
  } else {
    summary = choose(GRADES.find(([cut]) => stat.war >= cut)![1]);
  }

  let detail = "";
  if (!absent && stat.kind === "batter") {
    const ops = (stat.obp + stat.slg).toFixed(3);
    if (stat.hr >= 30) detail = `${stat.hr}홈런을 터뜨리며 장타력으로 존재감을 드러냈습니다.`;
    else if (stat.sb >= 25 && stat.obp >= 0.33) detail = `${stat.sb}도루와 출루율 ${stat.obp.toFixed(3)}으로 공격에 활기를 더했습니다.`;
    else if (stat.obp + stat.slg >= 0.85) detail = `OPS ${ops}의 날카로운 타격이 돋보였습니다.`;
    else if (stat.avg >= 0.3) detail = `타율 ${stat.avg.toFixed(3)}으로 안타 생산 능력을 보여줬습니다.`;
    else if (stat.obp >= 0.36) detail = `출루율 ${stat.obp.toFixed(3)}으로 공격의 연결고리가 됐습니다.`;
    else if (stat.obp + stat.slg < 0.65) detail = `OPS ${ops}에 그친 타격은 보완이 필요합니다.`;
    else detail = `${stat.g}경기 ${stat.pa}타석에서 타율 ${stat.avg.toFixed(3)}, OPS ${ops}를 기록했습니다.`;
    if (stat.war >= 2.5 && stat.obp + stat.slg < 0.75) detail += ` ${s.position}로서 타격 외 기여도 종합 성적에 담겼습니다.`;
  } else if (!absent && stat.kind === "pitcher") {
    if (role === "마무리" && stat.sv > 0) detail = `${stat.sv}세이브를 올렸고, 평균자책점은 ${stat.era.toFixed(2)}였습니다.`;
    else if (role === "선발") detail = `${stat.ip}이닝을 책임지며 ${stat.w}승 ${stat.l}패, 평균자책점 ${stat.era.toFixed(2)}를 기록했습니다.`;
    else detail = `${stat.g}경기 ${stat.ip}이닝에서 평균자책점 ${stat.era.toFixed(2)}, WHIP ${stat.whip.toFixed(2)}를 남겼습니다.`;
    if (stat.era >= 5) detail += " 실점을 줄이는 것이 다음 시즌의 핵심 과제입니다.";
    else if (stat.so / stat.ip * 9 >= 9 && stat.ip >= 30) detail += ` ${stat.so}탈삼진으로 타자를 직접 잡아내는 힘도 보여줬습니다.`;
  }

  const previous = s.seasons.filter(r => r.year < s.year).at(-1);
  let context = "";
  if (!absent && previous && previous.league === s.contract.league && previous.stat.kind === stat.kind) {
    const delta = stat.war - previous.stat.war;
    if (delta >= 1.5) context = `지난 시즌보다 WAR가 ${delta.toFixed(1)} 상승했습니다. ${stat.war < 0 ? "아직 반등을 완성하지는 못했지만 개선은 분명합니다." : "한 단계 나아간 기록입니다."}`;
    else if (delta <= -1.5) context = `지난 시즌보다 WAR가 ${Math.abs(delta).toFixed(1)} 낮아졌습니다. ${stat.war >= 4 ? "그래도 이번 시즌의 기여는 여전히 높습니다." : "출장량과 경기 내용을 함께 돌아볼 때입니다."}`;
    else if (stat.war >= 2.5) context = choose(["지난해에 이어 좋은 기여도를 유지했습니다.", "한 해의 반짝 활약에 그치지 않는 꾸준함을 보였습니다.", "연속해서 알찬 시즌을 기록했습니다."], 1);
  } else if (!absent && previous && previous.league !== s.contract.league) {
    context = `새로운 ${LEAGUES[s.contract.league].short} 무대에서 남긴 성적입니다. 이전 리그 기록과는 환경을 구분해 볼 필요가 있습니다.`;
  } else if (!absent && !previous) {
    context = choose(["프로 첫 시즌의 기록이 커리어의 출발점이 됐습니다.", "첫 시즌을 마쳤습니다. 이제 이 경험 위에 다음 기록을 쌓습니다.", "프로 무대에서 첫 성적표를 받았습니다."], 2);
  }
  const honor = awards.some(a => a.includes("MVP")) ? `${s.year} 시즌 MVP. 리그 최고의 선수로 인정받았습니다.`
    : awards.some(a => a.includes("신인왕")) ? "신인왕 수상으로 첫 발걸음에 의미를 더했습니다."
    : awards.filter(a => !a.includes("우승 반지")).length ? `개인 수상 기록도 남겼습니다: ${awards.filter(a => !a.includes("우승 반지")).join(", ")}.` : "";
  const team = champion ? "팀은 우승을 차지했습니다. 개인 성적표에 우승의 기억도 함께 남습니다." : "";
  const health = injury ? `${injury.name}${injury.severity >= 1 ? "으로 긴 재활이 필요합니다." : " 회복이 다음 일정의 과제입니다."}`
    : s.injury ? "부상을 안고 시작한 시즌인 만큼 출장량도 함께 살펴야 합니다." : "";
  return [summary, detail, context, honor, team, health].filter(Boolean).join(" ");
}
