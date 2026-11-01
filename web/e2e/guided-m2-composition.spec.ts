import {test,expect} from '@playwright/test';

test('M2 — the 25 real UCI cells occupy the vertical credit plot at desktop widths',async({page})=>{
 for(const [width,height] of [[1648,928],[1440,810],[1280,720]] as const){
  await page.setViewportSize({width,height});
  await page.goto('/?view=credit');
  const heat=page.locator('.grl-heat');
  await expect(heat.locator('button')).toHaveCount(25);
  const measures=await page.evaluate(()=>{
   const outer=document.querySelector('.grl-heat-scroll')!.getBoundingClientRect();
   const heat=document.querySelector('.grl-heat')!.getBoundingClientRect();
   const first=document.querySelector('.grl-heat-row button')!.getBoundingClientRect();
   const last=[...document.querySelectorAll('.grl-heat-row button')].at(-1)!.getBoundingClientRect();
   return {ratio:heat.height/outer.height,
    firstCell:first.height,lastCell:last.height,
    bottomGap:outer.bottom-last.bottom,
    overflowX:document.documentElement.scrollWidth-innerWidth,
    overflowY:document.documentElement.scrollHeight-innerHeight};
  });
  expect(measures.ratio,'matrix occupies plot '+width).toBeGreaterThan(.85);
  expect(measures.firstCell,'first segment remains readable '+width).toBeGreaterThan(22);
  expect(measures.lastCell,'last segment remains readable '+width).toBeGreaterThan(22);
  expect(measures.bottomGap,'no huge unused gap under last cell '+width).toBeLessThan(32);
  expect(measures.overflowX).toBeLessThanOrEqual(3);
  expect(measures.overflowY).toBeLessThanOrEqual(3);
  if(width!==1440)await page.screenshot({path:'test-results/m2-credit-'+width+'x'+height+'.png',fullPage:true});
 }
});

test('M2 — alert composition uses actual PaySim true and false positives for current selection',async({page})=>{
 await page.setViewportSize({width:1440,height:810});
 await page.goto('/?view=fraud');
 const composition=page.locator('.grl-fraud-composition');
 await expect(composition).toBeVisible();
 await expect(composition).toHaveAttribute('aria-label',/790 alertes sélectionnées.*413 vraies alertes.*377 fausses alertes/);
 await expect(composition).toContainText('52,3 %');
 await expect(composition).toContainText('47,7 %');
 await page.getByRole('button',{name:/J28 : 299 alertes/}).click();
 await expect(composition).toHaveAttribute('aria-label',/299 alertes sélectionnées.*85 vraies alertes.*214 fausses alertes/);
 await expect(composition).toContainText('28,4 %');
 const ratio=await composition.evaluate(el=>{
  const base=el.querySelector('.grl-fraud-stack')!.getBoundingClientRect().width;
  const trueSlice=el.querySelector('.grl-fraud-stack i')!.getBoundingClientRect().width;
  const falseSlice=el.querySelector('.grl-fraud-stack em')!.getBoundingClientRect().width;
  return {trueRatio:trueSlice/base,total:(trueSlice+falseSlice)/base};
 });
 expect(ratio.trueRatio).toBeGreaterThan(.27);
 expect(ratio.trueRatio).toBeLessThan(.30);
 expect(ratio.total).toBeGreaterThan(.98);
 expect(ratio.total).toBeLessThan(1.02);
 await page.getByRole('button',{name:'Par type'}).click();
 await expect(composition).toHaveAttribute('aria-label',/790 alertes sélectionnées.*413 vraies alertes.*377 fausses alertes/);
});

test('M2 — evidence forms one audit canvas with ruled sections while exports remain available',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/?view=evidence');
 const rules=await page.evaluate(()=>{
  const work=document.querySelector('.grl-evidence-workspace')!;
  const controls=work.querySelector('.grl-stage')!;
  return {bg:getComputedStyle(controls).backgroundColor,
   top:getComputedStyle(controls).borderTopWidth,
   right:getComputedStyle(controls).borderRightWidth,
   overflow:document.documentElement.scrollHeight-innerHeight};
 });
 expect(rules.top).toBe('0px');
 expect(rules.right).toBe('1px');
 expect(rules.overflow).toBeLessThanOrEqual(3);
 const details=page.locator('.grl-evidence-export-details');
 await details.locator('summary').click();
 await expect(details.getByRole('button',{name:/Exporter/})).toHaveCount(3);
 await details.locator('summary').click();
 await expect(details).not.toHaveAttribute('open',/.+/);
 await page.screenshot({path:'test-results/m2-evidence-1280x720.png',fullPage:true});
});

test('M2 — mobile preserves normal reading and accessible alert proportion',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/?view=fraud');
 await expect(page.locator('.grl-fraud-composition')).toBeVisible();
 await expect(page.locator('.grl-fraud-composition')).toContainText('52,3 %');
 const sizes=await page.evaluate(()=>({overflowX:document.documentElement.scrollWidth-innerWidth,
   scrollHeight:document.documentElement.scrollHeight}));
 expect(sizes.overflowX).toBeLessThanOrEqual(3);
 expect(sizes.scrollHeight).toBeGreaterThan(844);
});
