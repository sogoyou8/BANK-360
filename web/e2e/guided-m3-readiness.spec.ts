import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const routes=['overview','credit','fraud','models','evidence'] as const;

test('M3 — all five routes are discoverable without sideways scrolling on narrow phones',async({page})=>{
 for(const width of [320,390,600]){
  await page.setViewportSize({width,height:844});
  await page.goto('/?view=credit');
  const nav=page.getByRole('navigation',{name:'Navigation Risk Analytics Lab'});
  const buttons=nav.locator('button');
  await expect(buttons).toHaveCount(5);
  const bounds=await buttons.evaluateAll(els=>els.map(el=>{
   const r=el.getBoundingClientRect();return {left:r.left,right:r.right,visible:r.width>0&&r.height>=44};
  }));
  for(const [index,r] of bounds.entries()){
   expect(r.left,'left edge of route '+index+' at '+width).toBeGreaterThanOrEqual(-1);
   expect(r.right,'right edge of route '+index+' at '+width).toBeLessThanOrEqual(width+1);
   expect(r.visible,'usable route '+index+' at '+width).toBe(true);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(3);
  await nav.getByRole('button',{name:/Preuves/}).click();
  await expect(page.getByTestId('guided-evidence')).toBeVisible();
 }
});

test('M3 — every real UCI cohort cell is visible and selectable on narrow phones',async({page})=>{
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});
  await page.goto('/?view=credit');
  const cells=page.locator('.grl-heat-row button');
  await expect(cells).toHaveCount(25);
  const geometry=await page.evaluate(()=>{
   const frame=document.querySelector('.grl-heat-scroll')!.getBoundingClientRect();
   const buttons=[...document.querySelectorAll('.grl-heat-row button')].map(el=>el.getBoundingClientRect());
   return {left:Math.min(...buttons.map(r=>r.left)),right:Math.max(...buttons.map(r=>r.right)),frameLeft:frame.left,frameRight:frame.right,width:Math.min(...buttons.map(r=>r.width)),overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(geometry.left).toBeGreaterThanOrEqual(geometry.frameLeft-1);
  expect(geometry.right).toBeLessThanOrEqual(geometry.frameRight+1);
  expect(geometry.width).toBeGreaterThan(25);
  expect(geometry.overflow).toBeLessThanOrEqual(3);
  await cells.last().click();
  await expect(cells.last()).toHaveAttribute('aria-pressed','true');
 }
});

test('M3 — six simulated days fit one row, and all five type categories remain inspectable',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/?view=fraud');
 const bars=page.locator('.grl-fraud-grid .grl-bar');
 await expect(bars).toHaveCount(6);
 const tops=await bars.evaluateAll(els=>els.map(el=>Math.round(el.getBoundingClientRect().top)));
 expect(Math.max(...tops)-Math.min(...tops)).toBeLessThanOrEqual(3);
 await page.getByRole('button',{name:'Par type'}).click();
 await expect(bars).toHaveCount(5);
 await expect(page.getByRole('button',{name:/CASH_IN : 0 alertes/})).toBeVisible();
 await expect(page.getByRole('button',{name:/PAYMENT : 0 alertes/})).toBeVisible();
 await page.getByRole('button',{name:/CASH_IN : 0 alertes/}).click();
 const metrics=page.locator('.grl-fraud-metrics');
 await expect(metrics.locator('.grl-figure').nth(2).locator('strong')).toHaveText('—');
 await expect(metrics.locator('.grl-figure').nth(3).locator('strong')).toHaveText('—');
 await expect(page.locator('.grl-fraud-composition')).toContainText('Aucune alerte');
});

test('M3 — CSV does not turn undefined PaySim group precision or recall into a false zero',async({page})=>{
 await page.setViewportSize({width:1440,height:810});
 await page.goto('/?view=fraud');
 await page.getByRole('button',{name:'Par type'}).click();
 const downloadPromise=page.waitForEvent('download');
 await page.getByTestId('guided-fraud').getByRole('button',{name:/Exporter.*lignes/}).click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('bank360-paysim-type-test.csv');
 const content=await readFile(await download.path()!,'utf-8');
 const rows=content.replace(/^\uFEFF/,'').split(/\r?\n/);
 expect(rows[0]).toContain('"precision","recall"');
 const empty=rows.find(line=>line.startsWith('"CASH_IN"'));
 expect(empty).toBeDefined();
 expect(empty!.trim()).toMatch(/,"",""$/);
 const positive=rows.find(line=>line.startsWith('"TRANSFER"'));
 expect(positive).toBeDefined();
 expect(positive!.trim()).not.toMatch(/,"",""$/);
});

test('M3 — existing mono-screen desktop pages remain visible after mobile adjustments',async({page})=>{
 for(const [width,height] of [[1280,720],[1440,810]]){
  await page.setViewportSize({width,height});
  for(const view of routes){
   await page.goto(view==='overview'?'/':'/?view='+view);
   const surface=page.getByTestId('guided-'+view);
   await expect(surface).toBeVisible();
   const state=await surface.evaluate(el=>({
    documentOverflow:document.documentElement.scrollHeight-innerHeight,
    contentOverflow:el.scrollHeight-el.clientHeight,
    bottom:el.getBoundingClientRect().bottom
   }));
   expect(state.documentOverflow).toBeLessThanOrEqual(3);
   expect(state.contentOverflow).toBeLessThanOrEqual(3);
   expect(state.bottom).toBeLessThanOrEqual(height+1);
  }
 }
});
