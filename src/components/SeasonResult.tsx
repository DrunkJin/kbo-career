import { ATTR_LABEL, fmtAvg, type SeasonResult as SR } from "../game/engine";
import type { AttrKey, PlayerState } from "../game/types";
import { LeagueBadge, TeamLogo } from "./bits";

export function SeasonResultModal({
  result,
  player,
  onClose,
}: {
  result: SR;
  player: PlayerState;
  onClose: () => void;
}) {
  const s = result.stat;
  const grown = Object.entries(result.grew) as [AttrKey, number][];
  const season = player.seasons[player.seasons.length - 1];

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="sheet">
        <div className="sheet-head">
          <div>
            <span className="eyebrow">Season Report</span>
            <h2 style={{ marginTop: 8 }}>{season?.year ?? player.year} 시즌 결산</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LeagueBadge league={season?.league ?? player.contract.league} />
            <TeamLogo team={season?.team ?? player.contract.team} size={44} ring />
          </div>
        </div>

        <div className="statline">
          {s.kind === "batter" ? (
            <>
              <div><b>{s.g}</b><small>경기</small></div>
              <div><b>{fmtAvg(s.avg)}</b><small>타율</small></div>
              <div className={s.hr >= 25 ? "hi" : ""}><b>{s.hr}</b><small>홈런</small></div>
              <div><b>{s.rbi}</b><small>타점</small></div>
              <div><b>{s.sb}</b><small>도루</small></div>
              <div><b>{fmtAvg(s.obp)}</b><small>출루율</small></div>
              <div><b>{fmtAvg(s.slg)}</b><small>장타율</small></div>
              <div className={s.war >= 4 ? "hi" : ""}><b>{s.war}</b><small>WAR</small></div>
            </>
          ) : (
            <>
              <div><b>{s.g}</b><small>경기</small></div>
              <div><b>{s.ip}</b><small>이닝</small></div>
              <div><b>{s.w}-{s.l}</b><small>승-패</small></div>
              <div><b>{s.sv}</b><small>세이브</small></div>
              <div className={s.era <= 3 ? "hi" : ""}><b>{s.era.toFixed(2)}</b><small>ERA</small></div>
              <div><b>{s.whip.toFixed(2)}</b><small>WHIP</small></div>
              <div><b>{s.so}</b><small>탈삼진</small></div>
              <div className={s.war >= 4 ? "hi" : ""}><b>{s.war}</b><small>WAR</small></div>
            </>
          )}
        </div>

        <p style={{ marginTop: 18, fontSize: 14, lineHeight: 1.8, color: "#c3d5ea" }}>
          {result.narrative}
        </p>
        <p className="muted mono" style={{ fontSize: 12, marginTop: 8 }}>
          팀 성적 · {result.teamResult} / 역할 · {result.role}
        </p>

        {result.awards.length > 0 && (
          <>
            <p className="eyebrow" style={{ marginTop: 20 }}>Awards</p>
            <div className="awards-strip">
              {result.awards.map((a) => (
                <span key={a}>✦ {a}</span>
              ))}
            </div>
          </>
        )}

        <p className="eyebrow" style={{ marginTop: 20 }}>
          {result.declined ? "노쇠화" : "성장"}
        </p>
        <div className="growth-strip">
          {grown.length ? (
            grown.map(([k, v]) => (
              <span key={k} className={v > 0 ? "up" : "down"}>
                {ATTR_LABEL[k]} {v > 0 ? `+${v}` : v}
              </span>
            ))
          ) : (
            <span className="muted">변화 없음 — 정체된 한 해였습니다</span>
          )}
          <span className={player.ovr >= (season?.ovr ?? 0) ? "up" : "down"}>
            OVR {season?.ovr} → {player.ovr}
          </span>
        </div>

        {result.injury && (
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--red)" }}>
            ⚠ {result.injury.name} · {result.injury.severity >= 1 ? "다음 시즌 대부분 결장" : "출전 시간 감소"}
          </p>
        )}

        <button className="btn primary block" style={{ marginTop: 24 }} onClick={onClose}>
          오프시즌으로 →
        </button>
      </div>
    </div>
  );
}
