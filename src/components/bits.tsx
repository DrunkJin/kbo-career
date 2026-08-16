import { useEffect, useRef, useState } from "react";
import { LEAGUES, teamColor, teamLogo } from "../game/data";
import type { LeagueId } from "../game/types";

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
  label: string;
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
