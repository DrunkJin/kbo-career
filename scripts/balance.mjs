import { game, seeded } from './game-test-kit.mjs';
const { initialState, reducer, LEAGUES, hofScore } = game;
const runs = Number(process.argv[2] || 400);
const speed = process.argv[3] || 'normal';
const policy = process.argv[4] || 'random';
if (!Number.isInteger(runs) || runs < 1 || !['normal','fast','turbo'].includes(speed) || !['random','careful'].includes(policy)) throw new Error('Usage: node scripts/balance.mjs [runs] [normal|fast|turbo] [random|careful]');
const originalRandom = Math.random;
const report = [];
try {
  for (const position of ['투수', '포수', '내야수', '외야수']) {
    const rows = [];
    for (let i = 1; i <= runs; i++) {
      Math.random = seeded(i * 7919);
      let s = reducer(initialState(), { type: 'START', name: '밸런스', position, speed });
      let steps = 0;
      while (s.screen === 'play' && steps++ < 1500) {
        if (s.result) s = reducer(s, { type: 'CLOSE_RESULT' });
        else if (s.offers?.length) s = reducer(s, { type: 'ACCEPT', offer: [...s.offers].sort((a,b) => LEAGUES[b.league].tier - LEAGUES[a.league].tier || b.salary - a.salary)[0] });
        else if (s.event) {
          const score = c => c.outcomes.reduce((total, o) => {
            const e = o.effect;
            const healthValue = s.player.health < 50 ? 0.65 : 0.1;
            const gain = Object.entries(e.attrs ?? {}).reduce((n,[k,v]) => n + (game.visibleKeys(position).includes(k) ? v : 0),0);
            return total + o.weight * (gain + (e.focus ? 5 : 0) + (e.health ?? 0) * healthValue + (e.morale ?? 0)*0.06 - (e.injury ? e.injury.severity*20 : 0));
          },0)/c.outcomes.reduce((n,o)=>n+o.weight,0);
          const choice = policy === 'careful' ? [...s.event.choices].sort((a,b)=>score(b)-score(a))[0] : s.event.choices[Math.floor(Math.random() * s.event.choices.length)];
          s = reducer(s, { type: 'CHOOSE', choice });
        }
        else s = reducer(s, { type: 'ADVANCE' });
      }
      if (s.screen !== 'retired') throw new Error(`${position} seed ${i} did not retire`);
      const p = s.player;
      if (Object.values(p.attrs).some(v => !Number.isFinite(v) || v < 25 || v > 99)) throw new Error('Invalid attributes');
      rows.push({ seasons: p.seasons.length, war: p.seasons.reduce((n,r) => n+r.stat.war,0), peak: p.peakOvr, hof: hofScore(p).score, top: p.seasons.some(r => ['KBO','NPB','MLB'].includes(r.league)), mlb: p.seasons.some(r => r.league === 'MLB') });
    }
    const avg = key => +(rows.reduce((n,r) => n+Number(r[key]),0)/runs).toFixed(2);
    report.push({ position, runs, speed, policy, seasons: avg('seasons'), war: avg('war'), peak: avg('peak'), hof: avg('hof'), topPct: +(avg('top')*100).toFixed(0), mlbPct: +(avg('mlb')*100).toFixed(0) });
  }
} finally { Math.random = originalRandom; }
console.table(report);
