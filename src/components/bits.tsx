import React, { useEffect, useId, useRef, useState } from "react";
import { LEAGUES, teamColor, teamLogo } from "../game/data";
import { TERMS } from "../game/describe";
import { fmtAvg, type Impact } from "../game/engine";
import type { LeagueId, StatLine } from "../game/types";

export function TeamLogo({
  team,
  size = 48,
  ring = false,
}: {
  team: string;
  size?: number;
  ring?: boolean;
}) {
  const src = teamLogo(team);
  const [failed, setFailed] = useState(false);
  const color = teamColor(team);
  const initials = team.replace(/\s*\(.+\)$/, "").slice(0, 2);

  if (!src || failed)
    return (
      <span
        className={`logo fallback${ring ? " ring" : ""}`}
        style={{ width: size, height: size, background: color, fontSize: size * 0.34 }}
        aria-hidden
      >
        {initials}
      </span>
    );
  return (
    <span
      className={`logo${ring ? " ring" : ""}`}
      style={{ width: size, height: size, ["--team" as string]: color }}
    >
      <img src={src} alt={`${team} 엠블럼`} onError={() => setFailed(true)} />
    </span>
  );
}

/** 용어에 설명 툴팁을 붙입니다. TERMS 에 없는 단어는 그냥 출력합니다. */
export function Term({ k, children }: { k: string; children?: React.ReactNode }) {
  const d = TERMS[k];
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  if (!d) return <>{children ?? k}</>;
  return (
    <span className="term-wrap" ref={wrap}>
      <button type="button" className="term" title={d} aria-expanded={open} aria-describedby={open ? id : undefined}
        onClick={() => setOpen(!open)} onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } }}
        onBlur={e => { if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false); }}>
        {children ?? k}
      </button>
      {open && <span className="term-help" id={id} role="tooltip">{d}</span>}
    </span>
  );
}

export function LeagueBadge({ league }: { league: LeagueId }) {
  const lg = LEAGUES[league];
  return (
    <span className={`league-badge tier-${lg.tier}`} title={lg.label}>
      {lg.short}
    </span>
  );
}

export function Bar({
  label,
  value,
  max = 100,
  tone = "default",
  delta,
}: {
  label: React.ReactNode;
  value: number;
  max?: number;
  tone?: "default" | "warn" | "good";
  delta?: number;
}) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100));
  return (
    <div className={`bar tone-${tone}`}>
      <div className="bar-head">
        <span>{label}</span>
        <b>
          {Math.round(value)}
          {delta ? <em className={delta > 0 ? "up" : "down"}>{delta > 0 ? `+${delta}` : delta}</em> : null}
        </b>
      </div>
      <i>
        <span style={{ width: `${pct}%` }} />
      </i>
    </div>
  );
}

/** 값이 바뀌면 숫자가 굴러가는 카운터 */
export function Rolling({ value, duration = 550 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const b = value;
    if (a === b) return;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(a + (b - a) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = b;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{shown}</>;
}

export function Toasts({ items }: { items: { id: number; label: string; value: number }[] }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.value > 0 ? "up" : "down"}`}>
          <span>{t.label}</span>
          <b>
            {t.value > 0 ? "+" : ""}
            {Math.round(t.value * 10) / 10}
          </b>
        </div>
      ))}
    </div>
  );
}

/**
 * 능력치 변화를 "성적이 이렇게 달라진다"로 보여주는 목록.
 * 숫자 하나(컨택 +2)보다 타율 .285 → .291 이 훨씬 체감됩니다.
 */
export function ImpactList({
  impacts,
  roleShift,
  compact = false,
}: {
  impacts: Impact[];
  roleShift?: { from: string; to: string } | null;
  compact?: boolean;
}) {
  if (!impacts.length && !roleShift) return null;
  return (
    <div className={`impacts${compact ? " compact" : ""}`}>
      {roleShift && (
        <div className="impact role">
          <span className="impact-label">역할</span>
          <span className="impact-move">
            <b>{roleShift.from}</b>
            <i>→</i>
            <b className="to">{roleShift.to}</b>
          </span>
          <span className="impact-delta good">변경</span>
        </div>
      )}
      {impacts.map((x) => (
        <div className={`impact ${x.tone}`} key={x.key}>
          <span className="impact-label">{x.label}</span>
          <span className="impact-move">
            <b>{x.before}</b>
            <i>→</i>
            <b className="to">{x.after}</b>
          </span>
          <span className={`impact-delta ${x.tone}`}>{x.delta}</span>
        </div>
      ))}
    </div>
  );
}

/** 지금 능력치로 한 시즌을 치르면 나올 예상 성적 */
export function ProjectionLine({ stat }: { stat: StatLine }) {
  const cells =
    stat.kind === "batter"
      ? [
          { v: `${stat.g}`, l: "경기" },
          { v: fmtAvg(stat.avg), l: "타율" },
          { v: `${stat.hr}`, l: "홈런" },
          { v: `${stat.rbi}`, l: "타점" },
          { v: `${stat.sb}`, l: "도루" },
          { v: `${stat.war}`, l: "WAR", hi: true },
        ]
      : [
          { v: `${stat.g}`, l: "등판" },
          { v: `${stat.w}-${stat.l}`, l: "승-패" },
          { v: stat.era.toFixed(2), l: "ERA" },
          { v: `${stat.so}`, l: "탈삼진" },
          { v: `${Math.round(stat.ip)}`, l: "이닝" },
          { v: `${stat.war}`, l: "WAR", hi: true },
        ];
  return (
    <div className="statline">
      {cells.map((c) => (
        <div key={c.l} className={c.hi ? "hi" : ""}>
          <b>{c.v}</b>
          <small>
            <Term k={c.l} />
          </small>
        </div>
      ))}
    </div>
  );
}
