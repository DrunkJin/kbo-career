import { useState } from "react";
import type { PlayerState } from "../game/types";
import { isMajorLeague, type SeasonResult } from "../game/engine";

export function careerMoment(player: PlayerState, result: SeasonResult) {
  const before = player.seasons.slice(0, -1);
  if (result.champion) return { kind: "championship", icon: "🏆", label: "CHAMPIONS", title: player.rings === 1 ? "처음으로, 정상에 서다" : `우승 반지 ${player.rings}개째`, text: "마지막 아웃, 달려오는 동료들. 이 계절은 오래 기억될 겁니다." };
  if (result.awards.some(a => a.includes("MVP"))) return { kind: "mvp", icon: "★", label: "MOST VALUABLE PLAYER", title: "리그의 주인공이 되다", text: "누군가의 유망주였던 이름이, 이제 한 시즌을 대표합니다." };
  if (isMajorLeague(player.contract.league) && !before.some(r => isMajorLeague(r.league))) return { kind: "debut", icon: "⚾", label: "THE FIRST CHAPTER", title: "첫 1군 시즌을 기록하다", text: "처음 유니폼을 입던 날의 꿈이 기록표의 한 줄이 됐습니다." };
  if (before.length >= 3 && result.stat.war >= 3 && result.stat.war > Math.max(...before.map(r => r.stat.war))) return { kind: "career-high", icon: "↗", label: "PERSONAL BEST", title: "가장 빛났던 나의 계절", text: "지난날의 자신을 넘어섰습니다. 오늘부터 이 시즌이 새로운 기준입니다." };
  if (before.at(-1)?.role === "재활" && result.role !== "재활" && result.stat.war >= 1) return { kind: "comeback", icon: "✦", label: "BACK IN THE GAME", title: "돌아왔다는 것을 증명하다", text: "재활실에서 세던 날짜가, 다시 그라운드의 기록으로 바뀌었습니다." };
  return null;
}

export function CareerMoment({ player, result }: { player: PlayerState; result: SeasonResult }) {
  const moment = careerMoment(player, result);
  if (!moment) return null;
  return <section className={`career-moment ${moment.kind}${moment.kind === "championship" ? " illustrated" : ""}`} aria-label={moment.title}>
    {moment.kind === "championship" && <MomentArt kind="championship" />}
    <span className="moment-icon" aria-hidden="true">{moment.icon}</span>
    <div><span className="eyebrow">{moment.label}</span><h3>{moment.title}</h3><p>{moment.text}</p></div>
  </section>;
}

export function MomentArt({ kind }: { kind: "championship" | "overseas" }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img className="moment-art" src={`${import.meta.env.BASE_URL}moments/${kind}.webp?v=sketch-1`}
    srcSet={`${import.meta.env.BASE_URL}moments/${kind}-small.webp?v=sketch-1 480w, ${import.meta.env.BASE_URL}moments/${kind}.webp?v=sketch-1 960w`}
    sizes="(max-width: 620px) calc(100vw - 40px), 960px"
    width={960} height={540} decoding="async" onError={() => setFailed(true)}
    alt={kind === "championship" ? "야간 구장에서 동료들과 우승 트로피를 들어 올리는 선수들" : "장비 가방을 메고 낯선 해외 구장의 터널을 나서는 선수"} />;
}

export function OverseasMoment({ signed = false }: { signed?: boolean }) {
  return <section className="career-moment illustrated overseas" aria-label={signed ? "해외 진출 계약 체결" : "해외 진출 제안"}>
    <MomentArt kind="overseas" />
    <div><span className="eyebrow">A NEW CHAPTER</span><h3>{signed ? "새로운 무대, 나의 다음 장" : "바다 건너에서 온 제안"}</h3>
      <p>{signed ? "낯선 구장에 첫발을 내딛습니다. 다음 기록은 이곳에서 시작됩니다." : "새로운 리그가 당신을 부릅니다. 연봉과 출전 기회를 살펴보고 다음 무대를 고르세요."}</p></div>
  </section>;
}
