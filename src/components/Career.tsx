import { useMemo } from "react";
import { LEAGUES } from "../game/data";
import { fmtAvg, fmtSalary, projectSeason, roleFor, type Impact } from "../game/engine";
import { PHASE_NAMES, nextGoal, type FeedItem } from "../game/store";
import type { Choice, GameEvent, PlayerState } from "../game/types";
import { ImpactList, LeagueBadge, ProjectionLine, TeamLogo } from "./bits";

const PHASE_SUB = ["훈련 방침", "슬럼프 · 사건", "데드라인", "성적 집계", "계약 · 휴식"];

export function Career({
  p,
  event,
  headline,
  feed,
  impacts,
  roleShift,
  onAdvance,
  onFastForward,
  onChoose,
  blocked,
}: {
  p: PlayerState;
  event: GameEvent | null;
  headline: string;
  feed: FeedItem[];
  impacts: Impact[];
  roleShift: { from: string; to: string } | null;
  onAdvance: () => void;
  onFastForward: () => void;
  onChoose: (c: Choice) => void;
  blocked: boolean;
}) {
  const lg = LEAGUES[p.contract.league];
  const last = p.seasons[p.seasons.length - 1];
  const role = roleFor(p);
  const projection = useMemo(() => projectSeason(p), [p]);
  const showImpacts = !event && (impacts.length > 0 || !!roleShift);

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
          {showImpacts && (
            <div className="impact-wrap">
              <span className="impact-title">이 선택으로 달라진 것</span>
              <ImpactList impacts={impacts} roleShift={roleShift} />
            </div>
          )}
        </div>
        <div className="headline-actions">
          <button className="btn primary" onClick={onAdvance} disabled={!!event || blocked}>
            {p.phase === 3 ? "시즌 결산 보기" : p.phase === 4 ? "다음 시즌으로" : "진행하기"}
            <kbd>Space</kbd>
          </button>
          {p.phase < 3 && (
            <button
              className="btn ghost"
              onClick={onFastForward}
              disabled={!!event || blocked}
              title="남은 이벤트를 자동으로 처리하고 시즌 결산까지 진행합니다"
            >
              ⏩ 시즌 자동 진행
            </button>
          )}
        </div>
      </div>

      {event && <EventCard event={event} onChoose={onChoose} />}

      <section className="card projection">
        <header>
          <h3>지금 이대로 풀시즌을 치르면</h3>
          <span className="muted mono" style={{ fontSize: 11 }}>
            {role} · 운 중립 기준
          </span>
        </header>
        <ProjectionLine stat={projection} />
        <p className="muted projection-note">
          능력치가 바뀌면 이 숫자가 곧바로 움직입니다. 실제 성적은 운과 부상에 따라 위아래로
          흔들립니다.
        </p>
      </section>

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
                    <div><b>{fmtAvg(last.stat.avg)}</b><small>타율</small></div>
                    <div className={last.stat.hr >= 25 ? "hi" : ""}><b>{last.stat.hr}</b><small>홈런</small></div>
                    <div><b>{last.stat.rbi}</b><small>타점</small></div>
                    <div><b>{last.stat.sb}</b><small>도루</small></div>
                    <div className={last.stat.war >= 4 ? "hi" : ""}><b>{last.stat.war}</b><small>WAR</small></div>
                  </>
                ) : (
                  <>
                    <div><b>{last.stat.g}</b><small>경기</small></div>
                    <div><b>{last.stat.w}-{last.stat.l}</b><small>승-패</small></div>
                    <div className={last.stat.era <= 3 ? "hi" : ""}><b>{last.stat.era.toFixed(2)}</b><small>ERA</small></div>
                    <div><b>{last.stat.so}</b><small>탈삼진</small></div>
                    <div><b>{last.stat.ip}</b><small>이닝</small></div>
                    <div className={last.stat.war >= 4 ? "hi" : ""}><b>{last.stat.war}</b><small>WAR</small></div>
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
          <div className="team-line">
            <TeamLogo team={p.contract.team} size={52} ring />
            <div>
              <b>{p.contract.team}</b>
              <p className="muted">{lg.label} · {role}</p>
            </div>
          </div>
          <div className="statline">
            <div><b>{fmtSalary(p.contract.salary, p.contract.league)}</b><small>연봉</small></div>
            <div><b>{p.contract.left}년</b><small>잔여 계약</small></div>
            <div><b>{p.ovr - lg.level >= 0 ? "+" : ""}{p.ovr - lg.level}</b><small>리그 대비</small></div>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12, lineHeight: 1.6 }}>
            <b style={{ color: "var(--gold)" }}>다음 목표</b> · {nextGoal(p)}
          </p>
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

function EventCard({ event, onChoose }: { event: GameEvent; onChoose: (c: Choice) => void }) {
  return (
    <section className="event">
      <span className="tag">{event.tag}</span>
      <h3>{event.title}</h3>
      <p>{event.body}</p>
      <div className="choices">
        {event.choices.map((c) => (
          <button key={c.label} onClick={() => onChoose(c)}>
            <span>
              <b>{c.label}</b>
              <small>{c.hint}</small>
            </span>
            <span className={`risk ${c.risk}`}>{c.risk}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
