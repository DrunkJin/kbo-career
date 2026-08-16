import { useMemo, useState } from "react";
import "./retire.css";

type Position = "투수" | "포수" | "내야수" | "외야수";
type League = "KBO 퓨처스" | "KBO" | "NPB 2군" | "NPB" | "Double-A" | "Triple-A" | "MLB";
type Club = { name: string; league: League; overall: number; image?: string; contract: string };

const kbo = [
  ["LG 트윈스", "lg"], ["한화 이글스", "hanhwa"], ["삼성 라이온즈", "samsung"], ["두산 베어스", "doosan"], ["SSG 랜더스", "ssg"],
  ["롯데 자이언츠", "lotte"], ["KT 위즈", "kt"], ["KIA 타이거즈", "kia"], ["NC 다이노스", "nc"], ["키움 히어로즈", "kiwoom"],
];
const names = ["김도윤", "이현우", "박준서", "최민재", "정시우", "강우진"];
const positions: Position[] = ["투수", "포수", "내야수", "외야수"];
const japanese = ["요미우리 자이언츠", "한신 타이거스", "후쿠오카 소프트뱅크 호크스", "오릭스 버팔로스"];
const american = ["Los Angeles Dodgers", "Seattle Mariners", "San Diego Padres", "New York Yankees"];

const teamImage = (name: string) => {
  const found = kbo.find(([club]) => club === name);
  return found ? `${import.meta.env.BASE_URL}${found[1]}.jpg` : undefined;
};
const random = <T,>(values: T[]) => values[Math.floor(Math.random() * values.length)];

function TeamMuse({ club, small = false }: { club: Club; small?: boolean }) {
  if (!club.image) return <div className={`team-fallback ${small ? "small" : ""}`}>{club.name.slice(0, 2).toUpperCase()}</div>;
  return <img className={`team-muse ${small ? "small" : ""}`} src={club.image} alt={`${club.name} 구단 모에화`} />;
}

function getStart(): Club {
  const roll = Math.random();
  if (roll < .60) { const [name] = random(kbo); return { name, league: "KBO 퓨처스", overall: 54 + Math.floor(Math.random() * 9), image: teamImage(name), contract: "신인 계약 · ₩ 30M" }; }
  if (roll < .82) return { name: random(japanese), league: "NPB 2군", overall: 60 + Math.floor(Math.random() * 8), contract: "육성선수 계약 · ¥ 4.4M" };
  if (roll < .98) return { name: random(american), league: "Double-A", overall: 63 + Math.floor(Math.random() * 9), contract: "International Signing · $180K" };
  return { name: random(american), league: "MLB", overall: 76 + Math.floor(Math.random() * 6), contract: "MLB 데뷔 계약 · $740K" };
}

function ratingFor(overall: number) { return { contact: Math.min(99, overall + 5), power: Math.max(35, overall - 3), defense: Math.min(99, overall + 2), speed: Math.min(99, overall + 7) }; }

export function App() {
  const [started, setStarted] = useState(false);
  const [name, setName] = useState("김 커리어");
  const [position, setPosition] = useState<Position>("내야수");
  const [club, setClub] = useState<Club>(() => getStart());
  const [year, setYear] = useState(2026);
  const [age, setAge] = useState(16);
  const [money, setMoney] = useState(30);
  const [fame, setFame] = useState(18);
  const [health, setHealth] = useState(92);
  const [season, setSeason] = useState({ games: 0, avg: ".000", hr: 0, rbi: 0, war: 0 });
  const [history, setHistory] = useState<string[]>([]);
  const [awards, setAwards] = useState<string[]>([]);
  const [peakOverall, setPeakOverall] = useState(0);
  const [retired, setRetired] = useState(false);
  const [headline, setHeadline] = useState("스카우트 리포트가 도착했습니다.");
  const [offer, setOffer] = useState<Club | null>(null);
  const [tab, setTab] = useState<"career" | "market" | "records">("career");
  const ratings = useMemo(() => ratingFor(club.overall), [club.overall]);

  const begin = () => {
    const destiny = getStart();
    setClub(destiny); setStarted(true); setYear(2026); setAge(16); setMoney(destiny.league === "MLB" ? 740 : 30); setFame(destiny.overall - 38); setHealth(92); setPeakOverall(destiny.overall); setAwards([]); setRetired(false);
    setSeason({ games: 0, avg: ".000", hr: 0, rbi: 0, war: 0 });
    setHeadline(`${destiny.name}의 ${destiny.league} 오퍼를 받았습니다. 이 커리어는 오직 한 번뿐입니다.`);
    setHistory([`2026 · ${destiny.name} 입단 (${destiny.league})`]);
  };
  const advanceSeason = () => {
    const talent = club.overall + Math.floor(Math.random() * 18) - 7;
    const games = club.league === "MLB" || club.league === "KBO" || club.league === "NPB" ? 72 + Math.floor(Math.random() * 70) : 55 + Math.floor(Math.random() * 62);
    const avg = Math.max(.198, Math.min(.356, .196 + talent / 600 + (Math.random() * .05)));
    const hr = position === "투수" ? Math.floor(Math.random() * 3) : Math.max(0, Math.round((talent - 45) / 4 + Math.random() * 10));
    const rbi = Math.max(0, Math.floor(games * (.24 + talent / 500)));
    const war = Number(Math.max(-.5, (talent - 52) / 10 + Math.random() * 1.8 - .6).toFixed(1));
    const growth = age < 25 ? (talent >= 70 ? 3 : talent >= 59 ? 2 : 1) : age < 30 ? (talent >= 72 ? 1 : 0) : 0;
    const decline = age >= 35 ? 3 + Math.floor(Math.random() * 3) : age >= 32 ? 1 + Math.floor(Math.random() * 2) : 0;
    const nextOvr = Math.max(35, Math.min(99, club.overall + growth - decline));
    const injury = Math.random() < .12;
    const nextHealth = injury ? Math.max(45, health - 28) : Math.min(100, health + 4);
    const line = `${year} · ${club.league} ${games}G / ${avg.toFixed(3).replace("0.", ".")} / ${hr}HR / ${rbi}RBI / ${war} WAR`;
    setSeason({ games, avg: avg.toFixed(3).replace("0.", "."), hr, rbi, war });
    setClub(c => ({ ...c, overall: nextOvr })); setPeakOverall(p => Math.max(p, nextOvr)); setMoney(m => m + Math.round((club.league === "MLB" ? 740 : club.league.includes("NPB") ? 90 : 45) * (1 + war / 8))); setFame(f => Math.min(100, f + Math.round(war * 4 + growth - decline))); setHealth(nextHealth);
    setHistory(h => [...h, line]); setYear(y => y + 1); setAge(a => a + 1);
    const newAwards = [...awards]; if (war >= 4) newAwards.push(`${year} ${club.league} MVP`); else if (war >= 2.5) newAwards.push(`${year} ${club.league} 올스타`); if (hr >= 30) newAwards.push(`${year} 홈런왕`); setAwards(newAwards);
    const mustRetire = age >= 40 || (age >= 35 && nextOvr < 55) || (age >= 38 && Math.random() < .32);
    if (mustRetire) { setRetired(true); setHeadline(`${year} 시즌을 끝으로 현역 은퇴를 선언했습니다.`); return; }
    if (injury) setHeadline(`${year} 시즌 후반, 부상 경보가 울렸습니다. 재활과 회복 관리가 다음 시즌의 핵심입니다.`);
    else if (decline) setHeadline(`${year} 시즌 종료. 세월은 능력치를 깎아냅니다. 로스터를 지키거나 더 낮은 레벨에서 다시 증명하세요.`);
    else setHeadline(`${year} 시즌 종료. ${war >= 3 ? "리그를 놀라게 한 활약입니다. 이적 제안이 쌓이고 있습니다." : "다음 시즌의 선택이 당신의 격을 바꿉니다."}`);
    if (decline && (war < 1 || nextOvr < 60)) setOffer(createFallbackOffer(club, nextOvr)); else if (war >= 2 || nextOvr >= 68) setOffer(createOffer(club, nextOvr));
  };
  const acceptOffer = () => { if (!offer) return; setHistory(h => [...h, `${year} 오프시즌 · ${offer.name} 이적 (${offer.league})`]); setHeadline(`${offer.name} 유니폼을 입었습니다. 새로운 경쟁이 시작됩니다.`); setMoney(m => m + 80); setClub(offer); setOffer(null); };
  const train = () => { setClub(c => ({ ...c, overall: Math.min(99, c.overall + 1) })); setHealth(h => Math.max(50, h - 7)); setHeadline("오프시즌 개인 훈련을 마쳤습니다. OVR +1, 체력 -7."); };

  if (!started) return <main className="setup destiny"><section className="setup-copy"><div className="eyebrow">BASEBALL CAREER SIMULATOR · 2026</div><h1>선택하지 마세요.<br/><strong>운명이 지명합니다.</strong></h1><p>드래프트, 국제계약, 육성선수, 혹은 기적 같은 MLB 데뷔. 시작점은 랜덤이지만, 전설이 되는 길은 당신의 성적으로 결정됩니다.</p><div className="odds"><span>KBO 60%</span><span>NPB 22%</span><span>MINORS 16%</span><span>MLB 2%</span></div></section><section className="creator"><div className="card-title"><span>01</span><div><small>DESTINY DRAFT</small><h2>당신은 누구입니까?</h2></div></div><label>선수 이름<input value={name} onChange={e => setName(e.target.value)} /></label><label>주 포지션<div className="choices">{positions.map(p => <button type="button" className={position === p ? "selected" : ""} onClick={() => setPosition(p)} key={p}>{p}</button>)}</div></label><div className="random-ticket"><small>SCOUTING LOTTERY</small><b>시작 구단 · 리그 · 계약이 무작위로 결정됩니다.</b><span>희귀한 MLB 즉시 데뷔는 2% 확률입니다.</span></div><button className="start" onClick={begin}>운명적인 첫 오퍼 열기 <span>→</span></button><p className="tiny">한 번 시작한 커리어는 되돌릴 수 없습니다</p></section></main>;
  const shareCareer = async () => {
    const text = `${name}의 커리어 종료 | 최고 OVR ${peakOverall} | ${awards.length}회 수상 | ₩ ${money.toLocaleString()}M`;
    if (navigator.share) await navigator.share({ title: "Baseline Career", text, url: location.href });
    else { await navigator.clipboard.writeText(text); alert("커리어 기록을 클립보드에 복사했습니다."); }
  };
  if (retired) return <main className="retirement"><section className="retire-card"><div className="eyebrow">CAREER COMPLETE · {2026} — {year}</div><TeamMuse club={club}/><p className="retire-label">THANK YOU, {name.toUpperCase()}</p><h1>당신의 야구는<br/><em>기록으로 남았습니다.</em></h1><div className="legacy-stats"><div><b>{peakOverall}</b><span>PEAK OVR</span></div><div><b>{age - 16}</b><span>SEASONS</span></div><div><b>{awards.length}</b><span>AWARDS</span></div><div><b>₩ {money.toLocaleString()}M</b><span>CAREER EARNINGS</span></div></div><div className="award-list"><small>CAREER HONORS</small>{awards.length ? awards.map(a => <p key={a}>✦ {a}</p>) : <p>수상 경력은 없지만, 당신만의 이야기를 남겼습니다.</p>}</div><button className="start" onClick={shareCareer}>내 커리어 공유하기 ↗</button><button className="plain" onClick={() => setStarted(false)}>새로운 선수로 다시 시작</button></section></main>;

  return <main className="game"><header><a className="brand"><i>BC</i> BASELINE <small>CAREER</small></a><nav>{([['career','커리어'],['market','이적 시장'],['records','기록실']] as const).map(([id,label]) => <button onClick={() => setTab(id)} className={tab === id ? "active" : ""} key={id}>{label}</button>)}</nav><div className="season">{year} <span>OFFSEASON</span><b>AGE {age}</b></div></header><div className="hero"><div><div className="eyebrow">{club.league} · {club.name}</div><h1>{name} <span>#{position === "투수" ? "18" : "7"}</span></h1><p>{age}세 · 대한민국 · {position} · {club.contract}</p></div><div className="contract"><small>CAREER EARNINGS</small><b>₩ {money.toLocaleString()}M</b><span>명성 {fame} · 체력 {health}</span></div></div><div className="content"><aside><div className="team-card"><TeamMuse club={club}/><div className="team-overlay"><small>CURRENT CLUB</small><b>{club.name}</b></div></div><div className="badges"><span>잠재력 <b>A</b></span><span>OVR <b>{club.overall}</b></span></div><div className="ratings"><Metric label="컨택" value={ratings.contact}/><Metric label="파워" value={ratings.power}/><Metric label="수비" value={ratings.defense}/><Metric label="주력" value={ratings.speed}/></div><button className="training" onClick={train}>✦ 오프시즌 집중 훈련</button></aside><section className="mainpanel">{tab === "career" && <><div className="headline"><div><span className="status">● {offer ? "DECISION REQUIRED" : "OFFSEASON"}</span><h2>{offer ? "당신의 다음 유니폼을 결정하세요." : "한 시즌이 한 번의 이야기입니다."}</h2><p>{headline}</p></div><button className="advance" onClick={advanceSeason}> {year} 시즌 진행 <span>→</span></button></div><div className="season-recap"><div><small>LAST SEASON</small><b>{season.games ? `${year - 1} SEASON` : "ROOKIE YEAR"}</b><span>{season.games ? `${season.games}G · ${season.avg} · ${season.hr}HR · ${season.rbi}RBI · ${season.war} WAR` : "첫 시즌의 기록은 아직 비어 있습니다."}</span></div><div className="season-goal"><small>NEXT MILESTONE</small><b>{club.overall < 65 ? "로스터 생존" : club.overall < 74 ? "상위 리그 콜업" : "올스타 / 해외 진출"}</b></div></div><h3 className="section-title">CAREER LADDER <span>한 번의 성적이 다음 리그를 엽니다</span></h3><div className="ladder"><Ladder title="KBO" sub="퓨처스 → 1군" active={club.league.includes("KBO")}/><Ladder title="NPB" sub="팜 → 1군" active={club.league.includes("NPB")}/><Ladder title="MLB" sub="AA → AAA → MLB" active={club.league.includes("A") || club.league === "MLB"}/></div><div className="bottom-grid"><div className="timeline"><h3>커리어 연대기</h3>{history.slice(-4).reverse().map(x => <p key={x}><i/> {x}</p>)}</div><div className="scout"><small>FRONT OFFICE NOTE</small><h3>{fame > 60 ? "“구단의 미래를 바꿀 얼굴”" : "“아직은 증명할 시간이 필요하다”"}</h3><p>이적 시장은 시즌 종료 후 성적과 명성에 반응합니다.</p></div></div></>}{tab === "market" && <Market offer={offer} accept={acceptOffer} current={club}/>} {tab === "records" && <Records history={history} />}</section></div>{offer && <div className="modal"><div className="offer-modal"><span className="status">CONTRACT OFFER</span><TeamMuse club={offer}/><h2>{offer.name}</h2><p>{offer.league} · {offer.contract}</p><p>당신의 성적을 지켜본 구단이 정식 제안을 보냈습니다. 지금 이적하면 새로운 리그와 로스터 경쟁이 시작됩니다.</p><button className="start" onClick={acceptOffer}>계약서에 서명하기 →</button><button className="plain" onClick={() => setOffer(null)}>현재 팀에 남기</button></div></div>}</main>;
}

function createOffer(current: Club, overall: number): Club {
  if (current.league === "KBO 퓨처스") { const [name] = random(kbo); return { name, league: "KBO", overall, image: teamImage(name), contract: "1군 전환 · ₩ 120M" }; }
  if (current.league === "KBO") return { name: random(japanese), league: "NPB", overall: overall + 1, contract: "포스팅 계약 · ¥ 110M" };
  if (current.league === "NPB 2군") return { name: random(japanese), league: "NPB", overall, contract: "지배하 선수 계약 · ¥ 16M" };
  if (current.league === "NPB") return { name: random(american), league: "Triple-A", overall: overall + 1, contract: "MLB 마이너 계약 · $1.2M" };
  if (current.league === "Double-A") return { name: current.name, league: "Triple-A", overall, contract: "40인 로스터 초청 · $650K" };
  return { name: current.name, league: "MLB", overall, contract: "MLB 정식 계약 · $760K" };
}
function createFallbackOffer(current: Club, overall: number): Club {
  if (current.league === "MLB") return { name: current.name, league: "Triple-A", overall, contract: "마이너 옵션 행사 · $190K" };
  if (current.league === "Triple-A") return { name: current.name, league: "Double-A", overall, contract: "재활 및 경쟁 계약 · $85K" };
  if (current.league === "KBO") { const [name] = random(kbo); return { name, league: "KBO 퓨처스", overall, image: teamImage(name), contract: "육성 재계약 · ₩ 40M" }; }
  if (current.league === "NPB") return { name: current.name, league: "NPB 2군", overall, contract: "팜리그 재조정 · ¥ 5M" };
  return { ...current, overall, contract: "단년 재계약" };
}
function Metric({ label, value }: { label: string; value: number }) { return <div className="rating"><div><span>{label}</span><b>{value}</b></div><i><em style={{ width: `${value}%` }} /></i></div>; }
function Ladder({ title, sub, active }: { title: string; sub: string; active: boolean }) { return <div className={`ladder-node ${active ? "now" : ""}`}><i>{active ? "●" : "○"}</i><b>{title}</b><small>{sub}</small></div>; }
function Market({ offer, accept, current }: { offer: Club | null; accept: () => void; current: Club }) { return <div className="tabpage"><div className="eyebrow">GLOBAL PLAYER MARKET</div><h2>이적 시장</h2><p>시즌 성적, 명성, 나이, 리그 레벨에 따라 구단이 다른 방식으로 접근합니다.</p>{offer ? <article className="market-offer"><TeamMuse club={offer}/><div><span>LIVE OFFER · {offer.league}</span><h3>{offer.name}</h3><p>{offer.contract} · OVR {offer.overall}</p></div><button className="advance" onClick={accept}>계약 수락 →</button></article> : <div className="market-grid"><article><span>CURRENT SITUATION</span><b>{current.name}</b><small>{current.league} · OVR {current.overall}</small><p>시즌을 완료해 성적표를 만드세요. 좋은 시즌은 콜업과 이적 제안을 불러옵니다.</p></article><article><span>POSTING / FA</span><b>해외 진출 루트</b><small>KBO ↔ NPB ↔ MLB</small><p>상위 리그의 제안은 단순 능력치가 아니라 명성과 시즌 WAR를 함께 평가합니다.</p></article></div>}</div>; }
function Records({ history }: { history: string[] }) { return <div className="tabpage"><div className="eyebrow">CAREER DATABASE</div><h2>통산 기록</h2><div className="record-list">{history.length ? history.slice().reverse().map(x => <div key={x}><i>SEASON</i><span>{x}</span></div>) : <p>아직 기록이 없습니다.</p>}</div></div>; }
