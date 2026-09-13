import assert from 'node:assert/strict';
import {game, seeded} from './game-test-kit.mjs';
const {EVENTS, createPlayer, eventFits, roleFor, visibleKeys, drawEvent} = game;
Math.random = seeded(92513);
const positions = ['투수','포수','내야수','외야수'];
const leagues = ['KBO_F','KBO','NPB_F','NPB','AA','AAA','MLB'];
const ids = new Set(EVENTS.map(e=>e.id));
assert.equal(ids.size, EVENTS.length);
let scenarios = 0;
for (const e of EVENTS) {
  let reached = false;
  for (const position of positions) for (const league of leagues) for (const years of [1,2,3,4,6,8,10,12,15,20]) for (const mode of [0,1,2,3]) {
    const p = createPlayer('전수검증',position);
    Object.assign(p,{year:2026+years-1,age:19+years-1,ovr:[55,70,82,90][mode],health:mode===0?40:90,morale:mode<=1?35:75,fame:60,teamTrust:mode===0?35:65,injury:mode===3?{name:'재활',severity:.6}:null});
    Object.assign(p.contract,{league,team:e.teams?.[0]??p.contract.team,salary:5,left:1});
    for (const k of Object.keys(p.attrs)) p.attrs[k]=mode===0?55:75;
    if(mode===2) p.attrs.stamina=55;
    p.seasons=Array.from({length:years-1},(_,i)=>({year:2026+i,league,stat:{kind:position==='투수'?'pitcher':'batter',war:mode===0?0:4}}));
    if(e.id==='life-baby') p.traits=['가장'];
    // 장기 계약 중 성과 보상은 일반 계약 만료와 별개입니다.
    if(e.id==='off-salary') p.contract.left=3;
    for (const phase of e.phases) {
      scenarios++;
      if (!eventFits(e,p,phase,[])) continue;
      reached=true;
      if(e.for) assert.equal(e.for==='pitcher',position==='투수',e.id);
      if(e.positions) assert.ok(e.positions.includes(position),e.id);
      if(e.roles) assert.ok(e.roles.includes(roleFor(p)),e.id);
      if(e.leagues) assert.ok(e.leagues.includes(league),e.id);
      if(p.injury) assert.ok(e.duringRehab,`${e.id}: unavailable during rehabilitation`);
      for (const c of e.choices) for (const o of c.outcomes) {
        assert.ok(o.weight>0,`${e.id}: invalid weight`);
        const effect=o.effect;
        // 능력치만 바꾸는 선택이 다른 포지션에 등장해 아무 효과도 없어지는 회귀를 막습니다.
        if(effect.attrs && !['focus','health','morale','fame','teamTrust','money','trait','injury','intl'].some(k=>effect[k]!==undefined))
          assert.ok(Object.keys(effect.attrs).some(k=>visibleKeys(position).includes(k)),`${e.id}: useless attributes for ${position}`);
      }
    }
  }
  assert.ok(reached,`${e.id}: no valid player can encounter this event`);
}
const p=createPlayer('투수검증','투수');
p.contract.league='KBO';p.ovr=85;p.attrs.stamina=80;p.year=2040;p.age=33;
p.seasons=Array.from({length:14},(_,i)=>({year:2026+i,league:'KBO',stat:{war:4}}));
for(const id of ['t-ssg','t-redsox','mid-starter-fight','vet-bench-role','life-walkoff','dead-clutch-bat']) {
 const e=EVENTS.find(e=>e.id===id);p.contract.team=e.teams?.[0]??p.contract.team;
 assert.ok(!eventFits(e,p,e.phases[0],[]),`${id}: pitcher must not bat`);
}
for(const id of ['p-nohit','story-p-prime','life-era-blowup']) {
 const e=EVENTS.find(e=>e.id===id);assert.deepEqual(e.roles,['선발']);
}
const fan=EVENTS.find(e=>e.id==='life-fanletter');
for(const body of [fan.body,...fan.variants.map(v=>v.body)]) {assert.match(body,/편지/);assert.doesNotMatch(body,/20년|당신 등번호/);}
for(const e of EVENTS.filter(e=>e.teams)) assert.ok(e.leagues?.every(l=>['KBO','NPB','MLB'].includes(l)),`${e.id}: home stadium must not appear in farm league`);
const first=EVENTS.find(e=>e.id==='rk-first-camp');
const rookie=createPlayer('새선수','투수');
for(let i=0;i<30;i++) assert.notEqual(drawEvent(rookie,0,[],[],[first.id])?.id,first.id);
console.log(`PASS: all ${EVENTS.length} events reachable; ${scenarios.toLocaleString()} position/league/career/condition checks; role, rehabilitation, once-only, fan variants and useful effects`);
