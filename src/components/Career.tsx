import { LEAGUES } from "../game/data";
import { fmtAvg, fmtSalary, roleFor } from "../game/engine";
import { PHASE_NAMES, nextGoal, type FeedItem } from "../game/store";
import type { Choice, GameEvent, PlayerState } from "../game/types";
import { LeagueBadge, TeamLogo, Term } from "./bits";
import { RISK_DESC, describeChoice } from "../game/describe";

const PHASE_SUB = ["훈련 방침", "슬럼프 · 사건", "데드라인", "성적 집계", "계약 · 휴식"];

export function Career({
  p,
  event,
  headline,
  feed,
  onAdvance,
  onChoose,
  blocked,
}: {
  p: PlayerState;
  event: GameEvent | null;
  headline: string;
  feed: FeedItem[];
  onAdvance: () => void;
  onChoose: (c: Choice) => void;
  blocked: boolean;
}) {
  const lg = LEAGUES[p.contract.league];
  const last = p.seasons[p.seasons.length - 1];
  const role = roleFor(p);

  return (
    <>
      <div className="stepper">
        {PHASE_NAMES.map((label, i) => (
          <div key={label} className={i === p.phase ? "now" : i < p.phase ? "done" : ""}>
            {label}
            <small>{PHASE_SUB[i]}</small>
          </div>
        ))}
      </div>

      <div className="headline">
        <div>
          <span className="status">
            {event ? "선택 대기 중" : blocked ? "결정 필요" : `${p.year} · ${PHASE_NAMES[p.phase]}`}
          </span>
          <h2>
            {event
              ? "선택의 순간입니다"
              : p.phase === 3
                ? "시즌 성적을 집계합니다"
                : p.phase === 4
                  ? "오프시즌 — 다음 시즌을 준비하세요"
                  : `${role}으로 시즌을 치르는 중입니다`}
          </h2>
          <p>
            {event
              ? "아래 선택지 중 하나를 고르세요. 되돌릴 수 없습니다."
              : headline || `${p.contract.team}에서의 여정이 계속됩니다.`}
          </p>
        </div>
        {event ? (
          <div className="pick-hint" aria-live="polite">
            <b>↓ 아래 선택지 중 하나를 고르세요</b>
            <small>고르기 전에는 시즌이 진행되지 않습니다</small>
          </div>
        ) : (
          <button className="btn primary" onClick={onAdvance} disabled={blocked}>
            {p.phase === 3 ? "시즌 결산 보기" : p.phase === 4 ? "다음 시즌으로" : "진행하기"}
            <kbd>Space</kbd>
          </button>
        )}
      </div>

      {!event && (
        <div className="goal-chip">
          <b>다음 목표</b> {nextGoal(p)}
          <span className="muted">· 리그 대비 {p.ovr - lg.level >= 0 ? "+" : ""}{p.ovr - lg.level}</span>
        </div>
      )}

      {event && <EventCard event={event} position={p.position} onChoose={onChoose} />}

      <div className="grid-2">
        <section className="card">
          <header>
            <h3>지난 시즌</h3>
            {last && <LeagueBadge league={last.league} />}
          </header>
          {last ? (
            <>
              <div className="statline">
                {last.stat.kind === "batter" ? (
                  <>
                    <div><b>{last.stat.g}</b><small>경기</small></div>
                    <div><b>{fmtAvg(last.stat.avg)}</b><small><Term k="타율" /></small></div>
                    <div className={last.stat.hr >= 25 ? "hi" : ""}><b>{last.stat.hr}</b><small>홈런</small></div>
                    <div><b>{last.stat.rbi}</b><small>타점</small></div>
                    <div><b>{last.stat.sb}</b><small>도루</small></div>
                    <div className={last.stat.war >= 4 ? "hi" : ""}><b>{last.stat.war}</b><small><Term k="WAR" /></small></div>
                  </>
                ) : (
                  <>
                    <div><b>{last.stat.g}</b><small>경기</small></div>
                    <div><b>{last.stat.w}-{last.stat.l}</b><small>승-패</small></div>
                    <div className={last.stat.era <= 3 ? "hi" : ""}><b>{last.stat.era.toFixed(2)}</b><small><Term k="ERA" /></small></div>
                    <div><b>{last.stat.so}</b><small>탈삼진</small></div>
                    <div><b>{last.stat.ip}</b><small>이닝</small></div>
                    <div className={last.stat.war >= 4 ? "hi" : ""}><b>{last.stat.war}</b><small><Term k="WAR" /></small></div>
                  </>
                )}
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
                {last.team} · {last.role} · {last.teamResult}
              </p>
            </>
          ) : (
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
              아직 프로 무대에서의 기록이 없습니다. 첫 시즌을 끝까지 진행해 보세요.
            </p>
          )}
        </section>

        <section className="card">
          <header>
            <h3>현재 상황</h3>
            <LeagueBadge league={p.contract.league} />
          </header>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <TeamLogo team={p.contract.team} size={52} ring />
            <div>
              <b style={{ fontSize: 15 }}>{p.contract.team}</b>
              <p className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                {lg.label} · {role}
              </p>
            </div>
          </div>
          <div className="statline">
            <div><b>{fmtSalary(p.contract.salary, p.contract.league)}</b><small><Term k="연봉" /></small></div>
            <div><b>{p.contract.left}년</b><small><Term k="잔여 계약" /></small></div>
            <div><b>{p.ovr - lg.level >= 0 ? "+" : ""}{p.ovr - lg.level}</b><small><Term k="리그 대비" /></small></div>
          </div>
        </section>
      </div>

      <section className="card">
        <header>
          <h3>커리어 뉴스</h3>
          <span className="muted mono" style={{ fontSize: 11 }}>{feed.length}건</span>
        </header>
        <div className="feed">
          {feed.length ? (
            feed.slice(0, 18).map((f) => (
              <article key={f.id} className={f.tone}>
                <span className="when">{f.year}</span>
                <div>
                  <span className="tag">{f.tag}</span>
                  {f.text}
                </div>
              </article>
            ))
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>아직 소식이 없습니다.</p>
          )}
        </div>
      </section>
    </>
  );
}

function EventCard({
  event,
  position,
  onChoose,
}: {
  event: GameEvent;
  position: PlayerState["position"];
  onChoose: (c: Choice) => void;
}) {
  return (
    <section className="event" id="event-card">
      <span className="tag">{event.tag}</span>
      <h3>{event.title}</h3>
      <p>{event.body}</p>
      <div className="choices">
        {event.choices.map((c) => {
          const views = describeChoice(c, position);
          const sure = views.length === 1;
          return (
            <button key={c.label} onClick={() => onChoose(c)}>
              <span>
                <b>{c.label}</b>
                <small>{c.hint}</small>
                <span className="outcomes">
                  {views.map((v, i) => (
                    <span key={i} className={`outcome ${v.tone}`}>
                      {!sure && <em>{v.pct}%</em>}
                      {v.chips.map((ch) => (
                        <i key={ch.text} className={ch.tone}>{ch.text}</i>
                      ))}
                    </span>
                  ))}
                </span>
              </span>
              <span className={`risk ${c.risk}`} title={RISK_DESC[c.risk]}>{c.risk}</span>
            </button>
          );
        })}
      </div>
      <p className="risk-legend">
        <span className="risk 안정">안정</span> {RISK_DESC.안정} ·{" "}
        <span className="risk 도전">도전</span> {RISK_DESC.도전} ·{" "}
        <span className="risk 무모">무모</span> {RISK_DESC.무모}
      </p>
    </section>
  );
}
