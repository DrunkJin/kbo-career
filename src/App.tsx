import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Career } from "./components/Career";
import { MarketTab, OfferModal } from "./components/Market";
import { RecordsTab } from "./components/Records";
import { Setup } from "./components/Setup";
import { Retire } from "./components/Retire";
import { SeasonResultModal } from "./components/SeasonResult";
import { Bar, Rolling, TeamLogo, Toasts } from "./components/bits";
import { LEAGUES, teamColor } from "./game/data";
import { ATTR_DESC, ATTR_LABEL, potentialGrade, visibleKeys } from "./game/engine";
import {
  clearSave,
  initialState,
  loadGame,
  positionNumber,
  reducer,
  saveGame,
  type GameState,
} from "./game/store";
import type { AttrKey, Position } from "./game/types";

type Tab = "career" | "records" | "market";

const TABS: [Tab, string][] = [
  ["career", "커리어"],
  ["records", "기록실"],
  ["market", "이적 시장"],
];

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [tab, setTab] = useState<Tab>("career");
  const [savedGame] = useState(() => loadGame());
  const [toasts, setToasts] = useState<
    { id: number; label: string; value: number; until: number }[]
  >([]);
  const [showDesc, setShowDesc] = useState(false);
  const toastSeq = useRef(0);

  const { player: p, event, offers, result, screen } = state;

  /* 자동 저장 */
  useEffect(() => {
    saveGame(state);
  }, [state]);

  /* 능력치 변화 토스트 — 만료 시각을 들고 있다가 한 타이머가 일괄 정리합니다.
     (배치마다 setTimeout 을 걸면 effect cleanup 이 이전 타이머를 죽여 토스트가 쌓입니다) */
  useEffect(() => {
    if (!state.deltas.length) return;
    const now = Date.now();
    const items = state.deltas.slice(0, 5).map((d) => ({
      id: ++toastSeq.current,
      label: ATTR_LABEL[d.key as AttrKey] ?? d.label,
      value: d.value,
      until: now + 2600,
    }));
    setToasts((t) => [...t.filter((x) => x.until > now), ...items].slice(-5));
  }, [state.deltas]);

  useEffect(() => {
    if (!toasts.length) return;
    const id = setInterval(() => {
      const now = Date.now();
      setToasts((t) => {
        const alive = t.filter((x) => x.until > now);
        return alive.length === t.length ? t : alive;
      });
    }, 300);
    return () => clearInterval(id);
  }, [toasts.length]);

  /* 스페이스바 진행 */
  useEffect(() => {
    if (screen !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /INPUT|TEXTAREA/.test(el.tagName)) return;
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault(); // 이벤트 대기 중에도 스페이스로 페이지가 스크롤되지 않도록
      if (event || offers) return;
      if (result) dispatch({ type: "CLOSE_RESULT" });
      else dispatch({ type: "ADVANCE" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, event, offers, result]);

  const keys = useMemo(() => visibleKeys(p.position), [p.position]);
  const lg = LEAGUES[p.contract.league];

  if (screen === "setup")
    return (
      <SetupScreen
        hasSave={!!savedGame}
        onContinue={() => savedGame && dispatch({ type: "LOAD", state: savedGame })}
        onStart={(name, position) => dispatch({ type: "START", name, position })}
      />
    );

  if (screen === "retired")
    return (
      <Retire
        p={p}
        reason={state.retireReason}
        onRestart={() => {
          clearSave();
          dispatch({ type: "RESET" });
        }}
      />
    );

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">
          <i>BC</i> BASELINE <small>CAREER</small>
        </span>
        <nav>
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
              {label}
              {id === "market" && offers?.length ? ` (${offers.length})` : ""}
            </button>
          ))}
        </nav>
        <div className="clock">
          <b>{p.year}</b>
          <span>AGE {p.age}</span>
        </div>
      </header>

      <section className="playerbar" style={{ ["--team" as string]: teamColor(p.contract.team) }}>
        <TeamLogo team={p.contract.team} size={68} ring />
        <div className="pb-id">
          <h1>
            {p.name} <span>#{positionNumber(p.position)}</span>
          </h1>
          <div className="pb-meta">
            <span className="chip">{p.position}</span>
            <span className="chip">{p.bats}</span>
            <span>{p.age}세 · {lg.label} · {p.contract.team}</span>
            {p.injury && <span className="chip alert">부상 · {p.injury.name}</span>}
            {p.traits.map((t) => (
              <span className="chip" key={t} style={{ color: "var(--gold)" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="ovr-block">
          <small>OVERALL</small>
          <b>
            <Rolling value={p.ovr} />
          </b>
          <span>
            PEAK {p.peakOvr} · <span className="pot">잠재력 {potentialGrade(p.potential)}</span>
          </span>
        </div>
        <div className="pb-money">
          <small>CAREER EARNINGS</small>
          <b>{p.earnings.toFixed(1)}억</b>
          <span>계약 {p.contract.left}년 남음</span>
        </div>
      </section>

      <div className="body">
        <aside className="side">
          <section className="card">
            <header>
              <h3>능력치</h3>
              <button
                className="info-toggle"
                onClick={() => setShowDesc((v) => !v)}
                aria-pressed={showDesc}
              >
                {showDesc ? "설명 닫기" : "ⓘ 설명"}
              </button>
            </header>
            <div className="attrs">
              {keys.map((k) => (
                <AttrRow
                  key={k}
                  label={ATTR_LABEL[k]}
                  value={p.attrs[k]}
                  desc={showDesc ? ATTR_DESC[k] : undefined}
                />
              ))}
            </div>
          </section>

          <section className="card">
            <header><h3>컨디션</h3></header>
            <div style={{ display: "grid", gap: 13 }}>
              <Bar label="체력" value={p.health} tone={p.health < 55 ? "warn" : "good"} />
              <Bar label="멘탈" value={p.morale} tone={p.morale < 40 ? "warn" : "default"} />
              <Bar label="명성" value={p.fame} />
              <Bar label="구단 신뢰" value={p.teamTrust} tone={p.teamTrust < 30 ? "warn" : "default"} />
            </div>
          </section>

          <section className="card full">
            <header><h3>커리어 요약</h3></header>
            <div className="statline">
              <div><b>{p.seasons.length}</b><small>시즌</small></div>
              <div><b>{p.awards.length}</b><small>수상</small></div>
              <div className={p.rings ? "hi" : ""}><b>{p.rings}</b><small>우승</small></div>
              <div><b>{p.intl.length}</b><small>국대</small></div>
            </div>
            <button
              className="btn ghost block"
              style={{ marginTop: 14 }}
              onClick={() => {
                if (confirm("현재 커리어를 삭제하고 새로 시작할까요?")) {
                  clearSave();
                  dispatch({ type: "RESET" });
                }
              }}
            >
              새 커리어 시작
            </button>
          </section>
        </aside>

        <main className="main">
          {tab === "career" && (
            <Career
              p={p}
              event={event}
              headline={state.headline}
              feed={state.feed}
              blocked={!!offers || !!result}
              onAdvance={() => dispatch({ type: "ADVANCE" })}
              onChoose={(choice) => dispatch({ type: "CHOOSE", choice })}
            />
          )}
          {tab === "records" && <RecordsTab p={p} />}
          {tab === "market" && (
            <MarketTab p={p} offers={offers} onAccept={(offer) => dispatch({ type: "ACCEPT", offer })} />
          )}
        </main>
      </div>

      {result && (
        <SeasonResultModal result={result} player={p} onClose={() => dispatch({ type: "CLOSE_RESULT" })} />
      )}
      {!result && offers && offers.length > 0 && (
        <OfferModal offers={offers} player={p} onAccept={(offer) => dispatch({ type: "ACCEPT", offer })} />
      )}
      <Toasts items={toasts} />
    </div>
  );
}

function AttrRow({ label, value, desc }: { label: string; value: number; desc?: string }) {
  const prev = useRef(value);
  const [pop, setPop] = useState(false);
  useEffect(() => {
    if (prev.current !== value) {
      setPop(true);
      prev.current = value;
      const t = setTimeout(() => setPop(false), 700);
      return () => clearTimeout(t);
    }
  }, [value]);
  const grade = value >= 80 ? "g4" : value >= 68 ? "g3" : value >= 55 ? "g2" : "g1";
  return (
    <div className="attr-item">
      <div className={`attr-row${pop ? " pop" : ""}`}>
        <span>{label}</span>
        <i>
          <em className={grade} style={{ width: `${Math.min(100, value)}%` }} />
        </i>
        <b>
          <Rolling value={value} duration={400} />
        </b>
      </div>
      {desc && <p className="attr-desc">{desc}</p>}
    </div>
  );
}

function SetupScreen(props: {
  hasSave: boolean;
  onContinue: () => void;
  onStart: (name: string, position: Position) => void;
}) {
  return <Setup {...props} />;
}

export type { GameState };
