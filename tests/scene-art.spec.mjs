import {test,expect} from '@playwright/test';
import {game} from '../scripts/game-test-kit.mjs';

const cases=[['camp-focus','투수','pitching',0],['camp-focus','외야수','batting',0],['camp-veteran','투수','clubhouse',0],['life-rehab','투수','rehab',0],['life-fanletter','투수','fans',1],['life-contract-year','투수','contract',0]];
async function enter(page,id,position,phase){
 const s=game.reducer(game.initialState(),{type:'START',name:'그림검증',position});
 s.player.contract.league='KBO';s.player.contract.team='LG 트윈스';s.player.contract.left=1;s.player.phase=phase;
 if(id==='life-rehab') s.player.injury={name:'무릎 재활',severity:.6};
 s.event=game.EVENTS.find(e=>e.id===id);
 await page.addInitScript(s=>{localStorage.setItem('kbo-career-guide-seen','1');localStorage.setItem('kbo-career-save-v2',JSON.stringify(s));},s);
 await page.goto('http://127.0.0.1:4175/kbo-career/');
 await page.getByRole('button',{name:'저장된 커리어 이어하기'}).click();
}
for(const width of [320,1440]) test(`${width}px 사건별 스케치 이미지와 선택`,async({browser},info)=>{
 for(const [id,position,scene,phase] of cases){
  const page=await browser.newPage({viewport:{width,height:800}});
  await enter(page,id,position,phase);
  const art=page.locator(`#event-card [data-scene="${scene}"] img`);
  await expect(art).toBeVisible();
  await expect.poll(()=>art.evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
  if(width===320) expect(await art.evaluate(img=>img.currentSrc)).toContain('-small.webp');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:info.outputPath(`${scene}.png`)});
  await page.locator('.choices button').first().click();
  await expect(page.locator('#event-card')).toHaveCount(0);
  await page.close();
 }
});
test('이미지 로딩 실패 시에도 사건 선택 가능',async({page})=>{
 await page.route('**/scenes/*.webp',route=>route.abort());
 await enter(page,'camp-focus','투수',0);
 await expect(page.locator('#event-card .scene-art')).toHaveCount(0);
 await page.locator('.choices button').first().click();
 await expect(page.locator('#event-card')).toHaveCount(0);
});
