import assert from 'node:assert/strict';
import { game, seeded } from './game-test-kit.mjs';
const { EVENTS, eventFits, createPlayer, reducer, initialState, buildOffers, saveGame, loadGame, tallyAwards, simulateSeason } = game;
Math.random = seeded(4221);
assert.equal(new Set(EVENTS.map(e => e.id)).size, EVENTS.length, 'Event IDs must be unique');
for (const e of EVENTS) {
  assert.ok(e.choices.length >= 2, `${e.id}: meaningful choice required`);
  for (const c of e.choices) {
    assert.ok(c.outcomes.length > 0);
    for (const o of c.outcomes) assert.ok(Number.isFinite(o.weight) && o.weight > 0, `${e.id}: invalid weight`);
  }
}
for (const position of ['투수', '포수', '내야수', '외야수']) {
  assert.equal(EVENTS.filter(e => e.id.startsWith('story-') && e.positions?.includes(position)).length, 3);
  assert.equal(EVENTS.filter(e => e.id.startsWith('club-') && e.positions?.includes(position)).length, 16);
}
const rookie = EVENTS.find(e => e.id === 'story-p-rookie');
const pitcher = createPlayer('검증', '투수');
assert.ok(eventFits(rookie, pitcher, 0, []));
assert.ok(!eventFits(rookie, { ...pitcher, position: '포수' }, 0, []));
assert.ok(!eventFits(rookie, pitcher, 0, [rookie.id]));
const life = EVENTS.find(e => e.repeatable && e.phases.includes(1) && !e.when);
assert.ok(!eventFits(life, pitcher, 1, [life.id]), 'Repeatable events still cannot repeat within a season');
const veteran = EVENTS.find(e => e.id === 'story-p-veteran');
const records = Array.from({ length: 9 }, (_, i) => ({ year: 2026 + i }));
assert.ok(!eventFits(veteran, { ...pitcher, year: 2034, seasons: records }, 4, []), 'Ninth offseason is not year ten');
assert.ok(eventFits(veteran, { ...pitcher, year: 2035, seasons: records }, 0, []));
for (const e of EVENTS.filter(e => e.id.startsWith('club-'))) {
  const p = createPlayer('검증', e.positions[0]);
  p.contract.team = e.teams[0];
  p.year = 2026 + (e.minSeason - 1);
  p.seasons = Array.from({ length: e.minSeason - 1 }, (_, i) => ({ year: 2026 + i }));
  assert.ok(eventFits(e, p, e.phases[0], []), `${e.id}: must be reachable`);
  assert.ok(!eventFits(e, { ...p, contract: { ...p.contract, team: '다른 구단' } }, e.phases[0], []));
}
assert.equal(tallyAwards(['2026 KBO 사이영/투수 골든글러브'], 0).goldenGlove, 1);
for (const [ovr, expected] of [[57, false], [63, false], [64, true]]) {
  const p = createPlayer('검증', '내야수'); p.ovr = ovr;
  p.contract = { ...p.contract, team: 'LG 트윈스 (퓨처스)', league: 'KBO_F' };
  assert.equal(buildOffers(p).some(o => o.league === 'KBO'), expected);
}
const minor = createPlayer('검증', '투수');
minor.contract.league = 'AAA'; minor.ovr = 95;
for (const k of Object.keys(minor.attrs)) minor.attrs[k] = 95;
assert.deepEqual(simulateSeason(minor).awards, [], 'AAA cannot receive major league awards');
const values = new Map();
globalThis.localStorage = { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
let s = reducer(initialState(), { type: 'START', name: '저장', position: '투수' });
s = reducer(s, { type: 'ADVANCE' });
saveGame(s);
let loaded = loadGame();
assert.equal(loaded.event.id, s.event.id);
assert.equal(loaded.event.body, s.event.body);
loaded = reducer(loaded, { type: 'CHOOSE', choice: loaded.event.choices[0] });
assert.equal(loaded.player.phase, 1);
loaded = reducer(loaded, { type: 'FAST_FORWARD' });
saveGame(loaded);
assert.deepEqual(loadGame().result, loaded.result, 'Season report must survive refresh');
const legacy = { ...loaded }; delete legacy.seenEvents; delete legacy.eventHistory; delete legacy.speed;
values.set('kbo-career-save-v2', JSON.stringify(legacy));
assert.equal(loadGame().speed, 'normal');
assert.deepEqual(loadGame().seenEvents, []);
console.log(`PASS: ${EVENTS.length} events, 4 positions × 3 career stages, 16 clubs × 4 positions, contracts, awards, save compatibility`);

const reporter = createPlayer('시즌평가', '내야수');
reporter.contract.league = 'KBO';
const batting = { kind: 'batter', g: 140, pa: 550, h: 150, hr: 32, rbi: 95, sb: 8, avg: .3, obp: .38, slg: .52, war: 5 };
const pitching = { kind: 'pitcher', g: 55, ip: 55, w: 3, l: 2, sv: 30, so: 65, era: 2.5, whip: 1.1, war: 1 };
const report = (stat, role = '주전', p = reporter, awards = [], injury = null, champion = false) => game.narrateSeason(p, stat, awards, injury, champion, role);
assert.match(report(batting), /32홈런/);
assert.match(report(pitching, '마무리'), /30세이브/);
assert.doesNotMatch(report(pitching, '마무리'), /부진|아쉬움|장담|존재감을 남기지 못/);
assert.match(report({ ...batting, g: 15, pa: 40, hr: 2, war: .2 }, '백업'), /짧은|제한된/);
assert.match(report({ ...batting, g: 0, pa: 0, war: 0 }), /출장|실전/);
assert.doesNotMatch(report({ ...batting, g: 0, pa: 0, war: 0 }), /32홈런|OPS/);
const bad = { ...batting, war: -1, avg: .2, obp: .25, slg: .3, hr: 3 };
assert.match(report(bad), /부진|아쉬움|미치지/);
const injuredMvp = report(batting, '주전', reporter, ['2026 KBO MVP'], { name: '팔꿈치 인대 손상', severity: 1 }, true);
for (const word of ['32홈런', 'MVP', '우승', '재활']) assert.ok(injuredMvp.includes(word));
assert.match(report(bad, '주전', reporter, [], null, true), /부진|아쉬움|미치지/);
const previous = { year: reporter.year - 1, league: 'KBO', stat: { ...batting, war: 7 } };
assert.match(report(batting, '주전', { ...reporter, seasons: [previous] }), /낮아졌습니다.*여전히 높습니다/);
assert.doesNotMatch(report(batting, '주전', { ...reporter, seasons: [{ ...previous, league: 'AAA' }] }), /낮아졌습니다|상승했습니다/);
for (const war of [-1, 0, .5, 1.5, 2.5, 4, 6, 8]) {
  const variants = new Set(Array.from({ length: 3 }, (_, i) => report({ ...batting, war }, '주전', { ...reporter, year: 2026 + i })));
  assert.equal(variants.size, 3, `WAR ${war}: vary wording across seasons`);
}
const originalRandom = Math.random;
Math.random = () => { throw new Error('Narration must not change simulation RNG'); };
assert.equal(report(batting), report(batting));
Math.random = originalRandom;
console.log('PASS: season narrative tiers, roles, playing time, injury, awards, trends and deterministic variation');
