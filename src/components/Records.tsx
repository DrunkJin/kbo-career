import { LEAGUES } from "../game/data";
import { bestSeason, careerTotals, fmtAvg, leagueBreakdown, tallyAwards } from "../game/engine";
import type { PlayerState } from "../game/types";
import { LeagueBadge, TeamLogo } from "./bits";

export function SeasonTable({ p, compact = false }: { p: PlayerState; compact?: boolean }) {
  const best = bestSeason(p.seasons);
  const pitcher = p.position === "투수";
  if (!p.seasons.length)
    return <p className="muted" style={{ fontSize: 13 }}>아직 시즌 기록이 없습니다.</p>;

  return (
    <div className="table-wrap">
      <table className="rec">
        <thead>
          <tr>
            <th className="l">시즌</th>
            <th className="l">소속</th>
            <th>OVR</th>
            <th>역할</th>
            {pitcher ? (
              <>
                <th>G</th><th>IP</th><th>W-L</th><th>SV</th><th>ERA</th><th>K</th>
              </>
            ) : (
              <>
                <th>G</th><th>AVG</th><th>HR</th><th>RBI</th><th>SB</th><th>OPS</th>
              </>
            )}
            <th>WAR</th>
            {!compact && <th className="l">팀 성적</th>}
          </tr>
        </thead>
        <tbody>
          {p.seasons.map((s) => (
            <tr key={`${s.year}-${s.team}`} className={best && s.year === best.year ? "best" : ""}>
              <td className="l">
                {s.year} <span className="muted">({s.age})</span>
              </td>
              <td className="l">
                <span className="team-cell">
                  <TeamLogo team={s.team} size={20} />
                  {s.team}
                  <LeagueBadge league={s.league} />
                </span>
              </td>
              <td>{s.ovr}</td>
              <td>{s.role}</td>
              {s.stat.kind === "pitcher" ? (
                <>
                  <td>{s.stat.g}</td>
                  <td>{s.stat.ip}</td>
                  <td>{s.stat.w}-{s.stat.l}</td>
                  <td>{s.stat.sv}</td>
                  <td>{s.stat.era.toFixed(2)}</td>
                  <td>{s.stat.so}</td>
                </>
              ) : (
                <>
                  <td>{s.stat.g}</td>
                  <td>{fmtAvg(s.stat.avg)}</td>
                  <td>{s.stat.hr}</td>
                  <td>{s.stat.rbi}</td>
                  <td>{s.stat.sb}</td>
                  <td>{(s.stat.obp + s.stat.slg).toFixed(3)}</td>
                </>
              )}
              <td style={{ color: s.stat.war >= 4 ? "var(--gold)" : undefined }}>{s.stat.war}</td>
              {!compact && <td className="l">{s.teamResult}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CareerTotalsRow({ p }: { p: PlayerState }) {
  const t = careerTotals(p.seasons);
  return (
    <div className="statline">
      <div><b>{p.seasons.length}</b><small>시즌</small></div>
      <div><b>{t.g}</b><small>경기</small></div>
      {t.kind === "batter" ? (
        <>
          <div><b>{fmtAvg(t.avg)}</b><small>통산 타율</small></div>
          <div className="hi"><b>{t.hr}</b><small>홈런</small></div>
          <div><b>{t.rbi}</b><small>타점</small></div>
          <div><b>{t.h}</b><small>안타</small></div>
          <div><b>{t.sb}</b><small>도루</small></div>
        </>
      ) : (
        <>
          <div><b>{t.w}-{t.l}</b><small>승-패</small></div>
          <div className="hi"><b>{t.era.toFixed(2)}</b><small>통산 ERA</small></div>
          <div><b>{t.so}</b><small>탈삼진</small></div>
          <div><b>{t.ip}</b><small>이닝</small></div>
          <div><b>{t.sv}</b><small>세이브</small></div>
        </>
      )}
      <div className="hi"><b>{t.war}</b><small>통산 WAR</small></div>
    </div>
  );
}

export function AwardsPanel({ p }: { p: PlayerState }) {
  const t = tallyAwards(p.awards, p.rings);
  return (
    <>
      <div className="statline">
        <div className={t.mvp ? "hi" : ""}><b>{t.mvp}</b><small>MVP</small></div>
        <div className={t.goldenGlove ? "hi" : ""}><b>{t.goldenGlove}</b><small>골든글러브</small></div>
        <div className={t.titles ? "hi" : ""}><b>{t.titles}</b><small>타이틀</small></div>
        <div><b>{t.allStar}</b><small>올스타</small></div>
        <div><b>{t.rookie}</b><small>신인왕</small></div>
        <div className={t.rings ? "hi" : ""}><b>{t.rings}</b><small>우승 반지</small></div>
      </div>
      <div className="awards-strip">
        {p.awards.length ? (
          p.awards.map((a, i) => <span key={`${a}-${i}`}>✦ {a}</span>)
        ) : (
          <span style={{ opacity: 0.6 }}>아직 수상 경력이 없습니다</span>
        )}
      </div>
    </>
  );
}

export function IntlPanel({ p }: { p: PlayerState }) {
  const gold = p.intl.filter((x) => x.medal === "금").length;
  const silver = p.intl.filter((x) => x.medal === "은").length;
  const bronze = p.intl.filter((x) => x.medal === "동").length;
  return (
    <>
      <div className="statline" style={{ marginBottom: 14 }}>
        <div><b>{p.intl.length}</b><small>대회 출전</small></div>
        <div className={gold ? "hi" : ""}><b>{gold}</b><small>금메달</small></div>
        <div><b>{silver}</b><small>은메달</small></div>
        <div><b>{bronze}</b><small>동메달</small></div>
      </div>
      <div className="medal-row">
        {p.intl.length ? (
          p.intl.map((x) => (
            <article key={`${x.year}-${x.tournament}`}>
              <span className={`medal ${x.medal || "none"}`}>{x.medal || "—"}</span>
              <div>
                <b style={{ fontSize: 13 }}>{x.tournament}</b>
                <p className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{x.note}</p>
              </div>
              <span className="mono" style={{ fontSize: 12 }}>{x.result}</span>
            </article>
          ))
        ) : (
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
            국가대표 경력이 없습니다. OVR 70 이상 · 명성 35 이상이면 대회가 열리는 해에
            대표팀 승선 제안을 받습니다.
          </p>
        )}
      </div>
    </>
  );
}

export function LeaguePanel({ p }: { p: PlayerState }) {
  const rows = leagueBreakdown(p.seasons);
  if (!rows.length) return <p className="muted" style={{ fontSize: 13 }}>기록 없음</p>;
  return (
    <div className="medal-row">
      {rows.map((r) => (
        <article key={r.league}>
          <LeagueBadge league={r.league} />
          <div>
            <b style={{ fontSize: 13 }}>{LEAGUES[r.league].label}</b>
            <p className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{r.teams.join(" · ")}</p>
          </div>
          <span className="mono" style={{ fontSize: 12 }}>
            {r.seasons}시즌 · {r.war} WAR
          </span>
        </article>
      ))}
    </div>
  );
}

export function RecordsTab({ p }: { p: PlayerState }) {
  return (
    <>
      <section className="card">
        <header>
          <h3>통산 성적</h3>
          <span className="eyebrow">Career Totals</span>
        </header>
        <CareerTotalsRow p={p} />
      </section>
      <section className="card">
        <header>
          <h3>시즌별 기록</h3>
          <span className="muted mono" style={{ fontSize: 11 }}>노란 줄 = 커리어 하이</span>
        </header>
        <SeasonTable p={p} />
      </section>
      <div className="grid-2">
        <section className="card">
          <header><h3>수상 내역</h3></header>
          <AwardsPanel p={p} />
        </section>
        <section className="card">
          <header><h3>국제대회</h3></header>
          <IntlPanel p={p} />
        </section>
      </div>
      <section className="card">
        <header><h3>리그별 발자취</h3></header>
        <LeaguePanel p={p} />
      </section>
    </>
  );
}
