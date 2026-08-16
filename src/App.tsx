import { useMemo, useState } from "react";

type League = "KBO 퓨처스" | "KBO" | "NPB 2군" | "NPB" | "AAA" | "MLB";
type Position = "투수" | "포수" | "내야수" | "외야수";
type Origin = "KBO 드래프트" | "NPB 드래프트" | "MLB 국제계약" | "특급 유망주";

const teams = ["LG 트윈스", "한화 이글스", "삼성 라이온즈", "두산 베어스", "SSG 랜더스", "롯데 자이언츠", "KT 위즈", "KIA 타이거즈", "NC 다이노스", "키움 히어로즈"];
const journey: { league: League; level: number; title: string; note: string }[] = [
  { league: "KBO 퓨처스", level: 1, title: "퓨처스리그", note: "프로의 첫 관문" },
  { league: "KBO", level: 2, title: "KBO 1군", note: "10개 구단 최정상 무대" },
  { league: "NPB 2군", level: 3, title: "일본 팜", note: "이스트·웨스턴 리그" },
  { league: "NPB", level: 4, title: "NPB 1군", note: "센트럴·퍼시픽 리그" },
  { league: "AAA", level: 5, title: "Triple-A", note: "메이저리그 직전" },
  { league: "MLB", level: 6, title: "Major League", note: "세계 최고 무대" },
];

function Rating({ label, value }: { label: string; value: number }) {
  return <div className="rating"><div><span>{label}</span><b>{value}</b></div><i><em style={{ width: `${value}%` }} /></i></div>;
}

export function App() {
  const [created, setCreated] = useState(false);
  const [name, setName] = useState("김 커리어");
  const [position, setPosition] = useState<Position>("내야수");
  const [team, setTeam] = useState("LG 트윈스");
  const [origin, setOrigin] = useState<Origin>("KBO 드래프트");
  const [league, setLeague] = useState<League>("KBO 퓨처스");
  const [week, setWeek] = useState(2);
  const [overall, setOverall] = useState(58);
  const [form, setForm] = useState(76);
  const [tab, setTab] = useState<"overview" | "market" | "record">("overview");
  const [notice, setNotice] = useState("스프링캠프 평가전에서 좋은 인상을 남겼습니다.");
  const [log, setLog] = useState(["2월 17일 · LG 트윈스와 육성선수 계약", "2월 24일 · 이천 챔피언스파크 스프링캠프 합류"]);
  const [offer, setOffer] = useState(false);
  const stats = useMemo(() => ({ games: Math.max(0, (week - 2) * 5), avg: week < 4 ? ".000" : `.${String(211 + week * 7)}`, hr: Math.max(0, week - 5), rbi: Math.max(0, (week - 3) * 3) }), [week]);
  const simulate = () => {
    const next = week + 1;
    const boost = Math.random() > .45 ? 1 : 0;
    setWeek(next); setOverall(v => Math.min(99, v + boost)); setForm(Math.max(48, Math.min(99, form + (Math.random() > .5 ? 7 : -5))));
    if (next === 5) { setNotice("퓨처스리그 개막! 2번 타자, 유격수로 선발 출전합니다."); setLog(l => [...l, "3월 29일 · 퓨처스리그 개막전 선발 명단 포함"]); }
    else if (next === 8) { setOffer(true); setNotice("구단이 정식선수 전환과 1군 스프링 로스터 합류를 제안했습니다."); setLog(l => [...l, "4월 19일 · 정식선수 전환 제안 도착"]); }
    else { setNotice(`시즌 ${next}주차를 마쳤습니다. 코칭스태프 평점이 ${boost ? "상승" : "유지"}했습니다.`); setLog(l => [...l, `2026 시즌 ${next}주차 · 훈련과 경기 일정 완료`]); }
  };
  const promote = () => { setOffer(false); setLeague("KBO"); setOverall(v => v + 2); setNotice("축하합니다! 1군 엔트리에 등록되었습니다. 이제 잠실에서 증명하세요."); setLog(l => [...l, "4월 20일 · KBO 1군 콜업"]); };
  const startCareer = () => {
    const routes: Record<Origin, {league: League; team: string; overall: number; message: string}> = {
      "KBO 드래프트": { league: "KBO 퓨처스", team, overall: 58, message: "신인 계약 후 퓨처스리그 캠프에 합류했습니다." },
      "NPB 드래프트": { league: "NPB 2군", team: "요미우리 자이언츠", overall: 62, message: "요미우리의 지명을 받아 일본 팜리그에서 출발합니다." },
      "MLB 국제계약": { league: "AAA", team: "Los Angeles Dodgers", overall: 65, message: "국제계약을 맺었습니다. 스프링캠프 활약에 따라 마이너리그 배정이 결정됩니다." },
      "특급 유망주": { league: "MLB", team: "Seattle Mariners", overall: 76, message: "세기의 유망주로 메이저리그 개막 로스터에 합류했습니다." },
    };
    const route = routes[origin]; setLeague(route.league); setTeam(route.team); setOverall(route.overall); setNotice(route.message); setCreated(true);
  };
  if (!created) return <main className="setup"><section className="setup-copy"><div className="eyebrow">BASEBALL CAREER SIMULATOR</div><h1>당신의 이름으로<br/><strong>야구의 시간을</strong> 만드세요.</h1><p>어디에서 커리어를 시작할지는 당신의 선택입니다. KBO, NPB, 그리고 미국의 모든 레벨에서 기회를 잡으세요.</p><div className="worlds"><span>KBO</span><i>↔</i><span>NPB</span><i>↔</i><span>MLB</span></div></section><section className="creator"><div className="card-title"><span>01</span><div><small>NEW CAREER</small><h2>선수 만들기</h2></div></div><label>선수 이름<input value={name} onChange={e => setName(e.target.value)} /></label><label>주 포지션<div className="choices">{(["투수","포수","내야수","외야수"] as Position[]).map(p => <button className={position === p ? "selected" : ""} onClick={() => setPosition(p)} key={p}>{p}</button>)}</div></label><label>커리어 시작 경로<div className="route-choices">{(["KBO 드래프트","NPB 드래프트","MLB 국제계약","특급 유망주"] as Origin[]).map(p => <button className={origin === p ? "selected" : ""} onClick={() => setOrigin(p)} key={p}><b>{p}</b><small>{p === "KBO 드래프트" ? "퓨처스리그에서 경쟁" : p === "NPB 드래프트" ? "일본 팜리그에서 시작" : p === "MLB 국제계약" ? "미국 마이너리그 진입" : "MLB 즉시 데뷔 · 최고 난이도"}</small></button>)}</div></label>{origin === "KBO 드래프트" && <label>입단 구단<select value={team} onChange={e => setTeam(e.target.value)}>{teams.map(t => <option key={t}>{t}</option>)}</select></label>}<button className="start" onClick={startCareer}>나의 커리어 시작하기 <span>→</span></button><p className="tiny">2026 시즌 · 경로별 계약과 난이도가 다릅니다</p></section></main>;
  const currentLevel = journey.find(j => j.league === league)!.level;
  return <main className="game"><header><a className="brand"><i>BC</i> BASELINE <small>CAREER</small></a><nav>{([['overview','커리어'],['market','이적 시장'],['record','기록실']] as const).map(([id,label]) => <button onClick={() => setTab(id)} className={tab === id ? "active" : ""} key={id}>{label}</button>)}</nav><div className="season">2026 <span>SEASON</span><b>WEEK {week}</b></div></header><div className="hero"><div><div className="eyebrow">{league.toUpperCase()} · {team}</div><h1>{name} <span>#{position === "투수" ? "18" : "7"}</span></h1><p>19세 · 대한민국 · {position} · 우투우타</p></div><div className="contract"><small>CURRENT CONTRACT</small><b>육성선수</b><span>₩ 30,000,000 / year</span></div></div><div className="content"><aside><div className="portrait">{name.slice(0,1)}<span>OVR <b>{overall}</b></span></div><div className="badges"><span>잠재력 <b>A</b></span><span>컨디션 <b>{form}</b></span></div><div className="ratings"><Rating label="컨택" value={overall + 8}/><Rating label="파워" value={overall - 5}/><Rating label="수비" value={overall + 3}/><Rating label="주력" value={overall + 10}/></div><button className="training" onClick={() => {setOverall(v => Math.min(99,v+1));setNotice("집중 훈련을 마쳤습니다. 전체 능력치가 1 상승했습니다.")}}>✦ 집중 훈련</button></aside><section className="mainpanel">{tab === "overview" && <><div className="headline"><div><span className="status">● ACTIVE</span><h2>다음 무대가 당신을 기다립니다.</h2><p>{notice}</p></div><button className="advance" onClick={simulate}>1주 진행 <span>→</span></button></div><div className="match"><div><small>NEXT GAME</small><h3>{week < 5 ? "스프링캠프 평가전" : "퓨처스리그 정규시즌"}</h3><p>이천 챔피언스파크 · 13:00</p></div><div className="versus"><b>LG</b><span>VS</span><b className="opponent">두산</b></div><button>라인업 보기</button></div><h3 className="section-title">ROAD TO THE SHOW <span>6개 리그 · 9개 경쟁 레벨</span></h3><div className="road">{journey.map(j => <div className={`node ${j.level < currentLevel ? "done" : j.level === currentLevel ? "now" : ""}`} key={j.league}><i>{j.level < currentLevel ? "✓" : j.level}</i><b>{j.title}</b><small>{j.note}</small></div>)}</div><div className="bottom-grid"><div className="timeline"><h3>커리어 타임라인</h3>{log.slice(-3).reverse().map(x => <p key={x}><i/> {x}</p>)}</div><div className="scout"><small>SCOUT REPORT</small><h3>“공수 밸런스가 탁월한<br/>상위 레벨 자원”</h3><p>1군 콜업 예상: 2026년 5월</p></div></div></>}{tab === "market" && <Market league={league}/>} {tab === "record" && <Records stats={stats} league={league}/>}</section></div>{offer && <div className="modal"><div><span className="status">OFFER RECEIVED</span><h2>1군 콜업 제안</h2><p>LG 트윈스가 정식선수 전환 및 1군 엔트리 등록을 제안합니다. 수락 시 KBO 1군 로스터 경쟁이 시작됩니다.</p><button className="start" onClick={promote}>제안 수락하기 →</button><button className="plain" onClick={() => setOffer(false)}>퓨처스에 남기</button></div></div>}</main>;
}

function Market({ league }: { league: League }) { return <div className="tabpage"><div className="eyebrow">GLOBAL PLAYER MARKET</div><h2>이적 시장</h2><p>당신의 명성과 성적에 따라 해외 구단의 관심이 달라집니다.</p><div className="market-grid"><article><span>INTEREST</span><b>후쿠오카 소프트뱅크 호크스</b><small>NPB · Pacific League</small><p>스카우팅 단계 · KBO 1군 3년 차 이후 포스팅 검토</p></article><article><span>PATHWAY</span><b>MLB 국제계약</b><small>Rookie → A → AA → AAA</small><p>해외 스카우트의 관심을 받으려면 국제대회 또는 리그 MVP가 필요합니다.</p></article><article className="locked"><span>UNLOCK AT NPB</span><b>FA 권리</b><small>서비스 타임을 쌓으세요</small><p>현재 리그: {league}</p></article></div></div> }
function Records({ stats, league }: { stats: {games:number;avg:string;hr:number;rbi:number}; league: League }) { return <div className="tabpage"><div className="eyebrow">CAREER DATABASE</div><h2>통산 기록</h2><div className="statline"><div><b>{stats.games}</b><span>경기</span></div><div><b>{stats.avg}</b><span>타율</span></div><div><b>{stats.hr}</b><span>홈런</span></div><div><b>{stats.rbi}</b><span>타점</span></div></div><div className="record-row"><span>2026</span><b>{league}</b><span>{stats.games}G · {stats.avg} · {stats.hr} HR · {stats.rbi} RBI</span></div><p className="record-note">리그별 기록과 통산 기록은 커리어 종료까지 자동 보존됩니다.</p></div> }
