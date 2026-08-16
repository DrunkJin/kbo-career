import { useMemo, useState } from "react";
import { LEAGUES } from "../game/data";
import {
  bestSeason,
  careerTotals,
  fmtAvg,
  hofScore,
  statSummary,
} from "../game/engine";
import type { PlayerState } from "../game/types";
import { AwardsPanel, CareerTotalsRow, IntlPanel, LeaguePanel, SeasonTable } from "./Records";
import { LeagueBadge, TeamLogo } from "./bits";

export function Retire({
  p,
  reason,
  onRestart,
}: {
  p: PlayerState;
  reason: string;
  onRestart: () => void;
}) {
  const hof = useMemo(() => hofScore(p), [p]);
  const best = useMemo(() => bestSeason(p.seasons), [p]);
  const totals = hof.totals;
  const debut = p.seasons[0];
  const finalTeam = p.seasons.length ? p.seasons[p.seasons.length - 1].team : p.contract.team;
  const [copied, setCopied] = useState(false);

  const summaryText = useMemo(() => {
    const lines = [
      `⚾ ${p.name} (${p.position}) · ${debut?.year ?? p.year}–${p.seasons.length ? p.seasons[p.seasons.length - 1].year : p.year}`,
      `등급: ${hof.grade} (HOF ${hof.score}점)`,
      `${p.seasons.length}시즌 · 최고 OVR ${p.peakOvr} · 통산 ${totals.war} WAR`,
      totals.kind === "batter"
        ? `${totals.g}경기 ${fmtAvg(totals.avg)} ${totals.h}안타 ${totals.hr}홈런 ${totals.rbi}타점`
        : `${totals.g}경기 ${totals.w}승 ${totals.l}패 ERA ${totals.era.toFixed(2)} ${totals.so}탈삼진`,
      `MVP ${hof.tally.mvp}회 · 골든글러브 ${hof.tally.goldenGlove}회 · 우승 ${p.rings}회`,
      p.intl.length
        ? `국가대표 ${p.intl.length}회 (금 ${p.intl.filter((x) => x.medal === "금").length})`
        : "국가대표 경력 없음",
      `통산 수입 ${p.earnings.toFixed(1)}억원`,
    ];
    return lines.join("\n");
  }, [p, hof, totals, debut]);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "BASELINE CAREER", text: summaryText });
        return;
      }
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* 사용자가 공유를 취소한 경우 */
    }
  };

  return (
    <main className="retire">
      <div className="retire-inner">
        <section className="retire-hero">
          <TeamLogo team={finalTeam} size={92} ring />
          <span className="eyebrow">
            Career Complete · {debut?.year ?? p.year} — {p.seasons.length ? p.seasons[p.seasons.length - 1].year : p.year}
          </span>
          <h1>
            {p.name}의 야구는
            <br />
            <em>기록으로 남았습니다.</em>
          </h1>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.8, maxWidth: "48ch", margin: "0 auto" }}>
            {reason}
          </p>
          <div className="grade-badge">★ {hof.grade}</div>
          <div className="hof-meter">
            <div className="bar tone-good">
              <div className="bar-head">
                <span>명예의전당 점수</span>
                <b>{hof.score} / 100</b>
              </div>
              <i>
                <span style={{ width: `${hof.score}%` }} />
              </i>
            </div>
          </div>
        </section>

        <div className="legacy">
          <div><b>{p.seasons.length}</b><small>SEASONS</small></div>
          <div><b>{p.peakOvr}</b><small>PEAK OVR</small></div>
          <div><b>{totals.war}</b><small>CAREER WAR</small></div>
          <div><b>{p.awards.length}</b><small>AWARDS</small></div>
          <div><b>{p.rings}</b><small>RINGS</small></div>
          <div><b>{p.earnings.toFixed(1)}억</b><small>EARNINGS</small></div>
        </div>

        <section className="card">
          <header>
            <h3>통산 성적</h3>
            <span className="eyebrow">Career Totals</span>
          </header>
          <CareerTotalsRow p={p} />
          {best && (
            <p className="muted" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.7 }}>
              <b style={{ color: "var(--gold)" }}>커리어 하이</b> · {best.year} {best.team} —{" "}
              {statSummary(best.stat)}
            </p>
          )}
        </section>

        <div className="grid-2">
          <section className="card">
            <header><h3>수상 · 우승</h3></header>
            <AwardsPanel p={p} />
          </section>
          <section className="card">
            <header><h3>국제대회 성적</h3></header>
            <IntlPanel p={p} />
          </section>
        </div>

        <section className="card">
          <header><h3>리그별 발자취</h3></header>
          <LeaguePanel p={p} />
          <p className="muted" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.7 }}>
            데뷔 {debut ? `${debut.year} ${debut.team} (${LEAGUES[debut.league].label})` : "기록 없음"} ·
            마지막 소속 {finalTeam} · 최종 OVR {p.ovr} (잠재력 {p.potential})
            {p.traits.length ? ` · 특성 ${p.traits.join(", ")}` : ""}
          </p>
        </section>

        <section className="card">
          <header>
            <h3>시즌별 전 기록</h3>
            <span className="muted mono" style={{ fontSize: 11 }}>{p.seasons.length}시즌</span>
          </header>
          <SeasonTable p={p} />
        </section>

        <section className="card">
          <header><h3>커리어 연대기</h3></header>
          <div className="medal-row">
            {p.seasons
              .filter((s) => s.awards.length || s.teamResult.includes("우승") || s.year === best?.year)
              .slice(-8)
              .map((s) => (
                <article key={`hl-${s.year}`}>
                  <span className={`medal ${s.teamResult.includes("우승") ? "금" : "none"}`}>
                    {s.teamResult.includes("우승") ? "V" : s.year.toString().slice(2)}
                  </span>
                  <div>
                    <b style={{ fontSize: 13 }}>
                      {s.year} {s.team} <LeagueBadge league={s.league} />
                    </b>
                    <p className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>
                      {statSummary(s.stat)}
                      {s.awards.length ? ` · ${s.awards.join(", ")}` : ""}
                    </p>
                  </div>
                  <span />
                </article>
              ))}
            {!p.seasons.some((s) => s.awards.length) && (
              <p className="muted" style={{ fontSize: 13 }}>
                화려한 순간은 없었지만, 끝까지 그라운드를 지켰습니다.
              </p>
            )}
          </div>
        </section>

        <div className="share-row">
          <button className="btn primary" onClick={share}>
            {copied ? "클립보드에 복사됨 ✓" : "커리어 요약 공유하기 ↗"}
          </button>
          <button className="btn ghost" onClick={onRestart}>
            새로운 선수로 다시 시작
          </button>
        </div>
      </div>
    </main>
  );
}
