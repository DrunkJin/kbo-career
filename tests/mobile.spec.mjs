import { test, expect } from '@playwright/test';
import { game, seeded } from '../scripts/game-test-kit.mjs';

function career() {
  const previous = Math.random; Math.random = seeded(817);
  let s = game.reducer(game.initialState(), { type: 'START', name: '모바일테스트선수', position: '외야수' });
  while (s.player.seasons.length < 12) {
    if (s.result) s = game.reducer(s, { type: 'CLOSE_RESULT' });
    else if (s.offers) s = game.reducer(s, { type: 'ACCEPT', offer: s.offers[0] });
    else if (s.event) s = game.reducer(s, { type: 'CHOOSE', choice: s.event.choices[0] });
    else s = game.reducer(s, { type: 'ADVANCE' });
  }
  Math.random = previous;
  return s;
}
async function load(page, state) {
  await page.addInitScript(state => {
    localStorage.setItem('kbo-career-guide-seen', '1');
    localStorage.setItem('kbo-career-save-v2', JSON.stringify(state));
  }, state);
  await page.goto('./');
  await page.getByRole('button', { name: '저장된 커리어 이어하기' }).click();
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
for (const width of [320, 390, 768, 1440]) {
  test(`${width}px: 선택, 저장 복구, 결산, 기록, 계약, 은퇴`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width <= 390 ? 740 : 960 });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const s = career();
    s.result = null; s.player.phase = 0; s.offers = null;
    s.player.year += 1; s.player.age += 1; s.player.injury = null;
    s.event = game.EVENTS.find(e => e.id === 'story-o-veteran');
    await load(page, s);
    await expect(page.locator('#event-title')).toHaveText('펜스와의 거리를 바꾼다');
    await expect.poll(() => page.evaluate(() => document.querySelector('#event-title').getBoundingClientRect().top >= document.querySelector('.topbar').getBoundingClientRect().bottom + 8)).toBe(true);
    await noOverflow(page);
    await page.screenshot({ path: info.outputPath('event.png'), fullPage: true });
    await page.screenshot({ path: info.outputPath('event-viewport.png') });
    await expect(page.locator('.career-details')).not.toHaveAttribute('open');
    await page.locator('.career-details > summary').click();
    await expect(page.locator('.projection')).toBeVisible();
    await page.locator('.career-details > summary').click();
    if (width <= 390) {
      const nav = await page.getByRole('navigation', { name: '게임 메뉴' }).boundingBox();
      expect(nav.y + nav.height).toBeLessThanOrEqual(741);
      expect(nav.y).toBeGreaterThan(600);
    }
    const choice = page.locator('.choices button').first();
    await choice.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('.event')).toHaveCount(0);
    await expect(page.locator('.impact-wrap')).not.toHaveCount(0);
    await page.getByRole('button', { name: '시즌 자동 진행' }).click();
    await expect(page.getByRole('dialog', { name: '시즌 결산' })).toBeVisible();
    await noOverflow(page);
    await page.screenshot({ path: info.outputPath('result.png'), fullPage: true });
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]'))).toBe(true);
    await page.getByRole('button', { name: '오프시즌으로' }).click();
    await page.getByRole('button', { name: '기록실', exact: true }).click();
    const beforeKeyboard = await page.evaluate(() => localStorage.getItem('kbo-career-save-v2'));
    await page.evaluate(() => document.activeElement.blur());
    await page.keyboard.press('Space');
    expect(await page.evaluate(() => localStorage.getItem('kbo-career-save-v2'))).toBe(beforeKeyboard);
    await noOverflow(page);
    const table = page.getByRole('region', { name: /시즌 기록표/ });
    await expect(table).toBeVisible();
    await page.getByRole('combobox', { name: '리그별 보기' }).selectOption(s.player.seasons.at(-1).league);
    await expect(table.locator('tbody tr')).toHaveCount(s.player.seasons.filter(r => r.league === s.player.seasons.at(-1).league).length + 1);
    await page.getByRole('combobox', { name: '리그별 보기' }).selectOption('all');
    if (width <= 390) {
      expect(await table.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
      await table.evaluate(el => { el.scrollLeft = el.scrollWidth; });
      expect(await table.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    }
    await page.screenshot({ path: info.outputPath('records.png'), fullPage: true });
    expect(errors).toEqual([]);
  });
  test(`${width}px: 긴 구단명 계약과 은퇴 리포트`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 740 });
    const s = career(); s.result = null; s.event = null;
    s.offers = game.buildOffers(s.player);
    s.offers[0].team = '요코하마 DeNA 베이스타즈'; s.offers[0].league = 'NPB';
    await load(page, s);
    await expect(page.getByRole('dialog', { name: '다음 시즌 계약 선택' })).toBeVisible();
    await noOverflow(page);
    await page.screenshot({ path: info.outputPath('offers.png'), fullPage: true });
    await page.locator('.offer button').first().click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await noOverflow(page);
    s.screen = 'retired'; s.offers = null; s.retireReason = '끝까지 그라운드를 지켰습니다.';
    await page.evaluate(s => localStorage.setItem('kbo-career-save-v2', JSON.stringify(s)), s);
    // init script는 최초 fixture를 다시 넣으므로 새 페이지에서 은퇴 fixture로 검증합니다.
    const retiredPage = await page.context().newPage();
    await retiredPage.setViewportSize({ width, height: 740 });
    await load(retiredPage, s);
    await expect(retiredPage.locator('.grade-badge')).toBeVisible();
    await noOverflow(retiredPage);
    await retiredPage.screenshot({ path: info.outputPath('retired.png'), fullPage: true });
    await retiredPage.close();
  });
}

test('새 선수 시작과 이벤트 새로고침 복구', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('./');
  await page.locator('input').fill('새선수');
  await page.getByRole('button', { name: /운명적인 첫 오퍼/ }).click();
  await page.getByRole('button', { name: '건너뛰기' }).click();
  await page.getByRole('button', { name: /진행하기/ }).click();
  const title = await page.locator('#event-title').textContent();
  await page.reload();
  await page.getByRole('button', { name: '저장된 커리어 이어하기' }).click();
  await expect(page.locator('#event-title')).toHaveText(title);
  await page.locator('.choices button').first().click();
  await expect(page.locator('.event')).toHaveCount(0);
  await noOverflow(page);
});

test('기존 저장의 투수 타격 이벤트를 교체하고 커리어는 보존', async ({page}) => {
  const s = game.reducer(game.initialState(), {type:'START', name:'투수복구', position:'투수'});
  s.player.contract.league='KBO'; s.player.contract.team='SSG 랜더스'; s.player.phase=1;
  s.event={...game.EVENTS.find(e=>e.id==='t-ssg'),body:'투수가 타석에 서는 이전 버전 본문'};
  await load(page,s);
  await expect(page.locator('.pb-id h1')).toContainText('투수복구');
  await expect(page.locator('#event-title')).not.toHaveText('홈런 공장');
  await expect(page.locator('#event-card')).not.toContainText('이전 버전 본문');
  const title=await page.locator('#event-title').textContent();
  const reopened = await page.context().newPage();
  await reopened.goto('./');
  await reopened.getByRole('button',{name:'저장된 커리어 이어하기'}).click();
  await expect(reopened.locator('#event-title')).toHaveText(title);
  await reopened.close();
});

test('터치 브라우저에서 하단 메뉴, 선택, 가로 화면', async ({browser}, info) => {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:4175/kbo-career/');
  await page.screenshot({path:info.outputPath('mobile-start.png')});
  await page.getByRole('button',{name:/운명적인 첫 오퍼/}).tap();
  await page.getByRole('button',{name:'건너뛰기'}).tap();
  await page.getByRole('button',{name:'선수',exact:true}).tap();
  await expect(page.locator('.attrs')).toBeVisible();
  await page.getByRole('button',{name:'커리어',exact:true}).tap();
  await page.getByRole('button',{name:/진행하기/}).tap();
  await page.locator('.choices button').first().tap();
  // Random story choices can change relationships without a numeric impact panel.
  await expect(page.locator('#event-card')).toHaveCount(0);
  await expect(page.locator('.headline:not(.awaiting-choice) p')).toBeVisible();
  await noOverflow(page);
  await page.setViewportSize({width:844,height:390});
  await noOverflow(page);
  await page.screenshot({path:info.outputPath('landscape.png')});
  await context.close();
});

test('우승 연출과 모바일 용어 설명', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const s = career(); s.player.rings = 1; s.result.champion = true;
  s.player.contract.league = 'KBO'; s.player.contract.team = '두산 베어스';
  Object.assign(s.player.seasons.at(-1), { league: 'KBO', team: '두산 베어스' });
  s.result.awards = ['2037 KBO 우승 반지 💍'];
  await load(page, s);
  await expect(page.getByRole('region', { name: '처음으로, 정상에 서다' })).toBeVisible();
  await expect.poll(() => page.locator('.championship .moment-art').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('championship-card.png') });
  await page.getByRole('button', { name: 'WAR', exact: true }).last().click();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath('championship-tooltip.png') });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});

for (const width of [320, 390, 768, 1440]) {
  test(`${width}px: 해외 진출 이미지와 계약 체결 연출`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 800 });
    const s = career(); s.result = null; s.event = null;
    s.offers = [{ team: 'Los Angeles Dodgers', league: 'MLB', salary: 28, years: 4, label: '포스팅 · MLB 진출', role: '주전', note: '메이저리그 구단의 정식 오퍼입니다.', kind: '해외진출' }];
    await load(page, s);
    await expect(page.getByRole('region', { name: '해외 진출 제안', exact: true })).toBeVisible();
    await expect.poll(() => page.locator('.overseas .moment-art').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    await noOverflow(page);
    await page.screenshot({ path: info.outputPath('overseas-offer.png') });
    await page.locator('.offer button').click();
    await expect(page.getByRole('region', { name: '해외 진출 계약 체결' })).toBeVisible();
    await expect.poll(() => page.locator('.overseas .moment-art').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    await noOverflow(page);
  });
}
