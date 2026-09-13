import { LEAGUES } from "../game/data";
import { fmtSalary, isFaEligible, marketValue } from "../game/engine";
import type { Offer, PlayerState } from "../game/types";
import { LeagueBadge, TeamLogo } from "./bits";
import { Modal } from "./Modal";
import { OverseasMoment } from "./CareerMoment";

export function OfferCard({ offer, onAccept }: { offer: Offer; onAccept: (o: Offer) => void }) {
  const lg = LEAGUES[offer.league];
  return (
    <article className="offer">
      <span className={`kind ${offer.kind}`}>{offer.kind}</span>
      <div className="offer-top">
        <TeamLogo team={offer.team} size={54} ring />
        <div>
          <b>{offer.team}</b>
          <small>
            {lg.label} · {offer.label}
          </small>
        </div>
      </div>
      <div className="terms">
        <div>
          <b>{fmtSalary(offer.salary, offer.league)}</b>
          <small>연봉</small>
        </div>
        <div>
          <b>{offer.years}년</b>
          <small>계약 기간</small>
        </div>
        <div>
          <b>{offer.role}</b>
          <small>예상 역할</small>
        </div>
      </div>
      <p>{offer.note}</p>
      <button className="btn primary block" onClick={() => onAccept(offer)}>
        계약서에 서명 →
      </button>
    </article>
  );
}

export function OfferModal({
  offers,
  onAccept,
  player,
}: {
  offers: Offer[];
  onAccept: (o: Offer) => void;
  player: PlayerState;
}) {
  return (
    <Modal label="다음 시즌 계약 선택">
      <div className="sheet" style={{ width: "min(940px, 100%)" }}>
        <div className="sheet-head">
          <div>
            <span className="eyebrow">Contract Offers · {player.year} 오프시즌</span>
            <h2 style={{ marginTop: 8 }}>다음 유니폼을 결정하세요</h2>
            <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
              {player.name} · OVR {player.ovr} · 명성 {player.fame} ·{" "}
              {isFaEligible(player) ? "FA 자격 보유" : "FA 자격 미달"}
            </p>
          </div>
        </div>
        <div className="contract-baseline"><b>현재 계약</b><span>{player.contract.team}</span><span>연봉 {fmtSalary(player.contract.salary, player.contract.league)} · 잔여 {player.contract.left}년</span><small>제안의 연봉·기간·예상 역할을 비교한 뒤 선택하세요.</small></div>
        {offers.some(o => o.kind === "해외진출") && <OverseasMoment />}
        <div className="offer-grid">
          {offers.map((o) => (
            <OfferCard key={`${o.team}-${o.league}-${o.label}`} offer={o} onAccept={onAccept} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function MarketTab({ p, offers, onAccept }: { p: PlayerState; offers: Offer[] | null; onAccept: (o: Offer) => void }) {
  const lg = LEAGUES[p.contract.league];
  return (
    <>
      <section className="card">
        <header>
          <h3>내 시장 가치</h3>
          <LeagueBadge league={p.contract.league} />
        </header>
        <div className="statline">
          <div><b>{p.ovr}</b><small>OVR</small></div>
          <div><b>{lg.level}</b><small>리그 평균</small></div>
          <div><b>{p.fame}</b><small>명성</small></div>
          <div><b>{p.teamTrust}</b><small>구단 신뢰</small></div>
          <div className="hi">
            <b>{fmtSalary(marketValue(p, p.contract.league, 7), p.contract.league)}</b>
            <small>추정 몸값</small>
          </div>
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.75 }}>
          계약이 만료되거나 구단 신뢰가 바닥나면 오퍼가 도착합니다. 상위 리그 진출은
          <b style={{ color: "var(--gold)" }}> 능력치 · 직전 시즌 WAR · 명성</b>을 함께 봅니다.
          {isFaEligible(p)
            ? " 현재 FA 자격을 보유해 협상력이 높습니다."
            : p.contract.league === "KBO"
              ? ` KBO 등록 ${p.serviceKBO}시즌 — FA까지 ${Math.max(0, 8 - p.serviceKBO)}시즌 남았습니다.`
              : ""}
        </p>
      </section>

      <section className="card">
        <header>
          <h3>진행 중인 오퍼</h3>
          <span className="muted mono" style={{ fontSize: 11 }}>{offers?.length ?? 0}건</span>
        </header>
        {offers?.length ? (
          <div className="offer-grid">
            {offers.map((o) => (
              <OfferCard key={`${o.team}-${o.league}-${o.label}`} offer={o} onAccept={onAccept} />
            ))}
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.8 }}>
            지금은 협상 테이블이 비어 있습니다. 잔여 계약 {p.contract.left}년을 소화하며
            성적을 쌓으세요.
          </p>
        )}
      </section>

      <section className="card">
        <header><h3>승격 루트</h3></header>
        <div className="medal-row">
          {[
            { t: "KBO 퓨처스 → KBO 1군", d: "OVR 64 이상 · 계약 협상 시 콜업 대상" },
            { t: "KBO → NPB / MLB 포스팅", d: "OVR 74+ · 직전 WAR 3.5+ (MLB는 78+)" },
            { t: "NPB → MLB", d: "OVR 78+ · 직전 WAR 4+" },
            { t: "AA → AAA → MLB", d: "AAA는 OVR 66 이상 · MLB는 78 이상 · 계약 협상 시" },
          ].map((x) => (
            <article key={x.t}>
              <span className="medal none">↑</span>
              <div>
                <b style={{ fontSize: 13 }}>{x.t}</b>
                <p className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{x.d}</p>
              </div>
              <span />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
