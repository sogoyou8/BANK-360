import {test,expect} from '@playwright/test';

const desktopSizes=[[1648,928],[1440,810],[1280,720]] as const;
const views=['overview','credit','fraud','models','evidence'] as const;

test('M1 — five journeys fit fully within a desktop screen, without nested page clipping',async({page})=>{
 const failures:string[]=[];
 for(const [w,h] of desktopSizes){
  await page.setViewportSize({width:w,height:h});
  for(const view of views){
   await page.goto(view==='overview'?'/':'/?view='+view);
   const sheet=page.getByTestId('guided-'+view);
   await expect(sheet).toBeVisible();
   const metrics=await sheet.evaluate(el=>{
    const doc=document.documentElement,rect=el.getBoundingClientRect();
    const children=[...el.children].map(node=>node.getBoundingClientRect());
    return {
     screenOverflowY:doc.scrollHeight-innerHeight,
     screenOverflowX:doc.scrollWidth-innerWidth,
     stageOverflow:el.scrollHeight-el.clientHeight,
     pageBottom:rect.bottom,
     childMinTop:Math.min(...children.map(r=>r.top)),
     childMaxBottom:Math.max(...children.map(r=>r.bottom)),
     pageTop:rect.top,
     viewportHeight:innerHeight,
     titleOverflow:Math.max(0,(el.querySelector('.grl-page-title') as HTMLElement)?.scrollHeight-(el.querySelector('.grl-page-title') as HTMLElement)?.clientHeight||0)
    };
   });
   if(metrics.screenOverflowY>3)failures.push(`${view} ${w}: page scroll +${metrics.screenOverflowY}`);
   if(metrics.screenOverflowX>3)failures.push(`${view} ${w}: horizontal scroll +${metrics.screenOverflowX}`);
   if(metrics.stageOverflow>3)failures.push(`${view} ${w}: clipped ${metrics.stageOverflow}px`);
   if(metrics.childMinTop<metrics.pageTop-2||metrics.childMaxBottom>metrics.pageBottom+2)
    failures.push(`${view} ${w}: child outside page [${Math.round(metrics.childMinTop-metrics.pageTop)},${Math.round(metrics.childMaxBottom-metrics.pageBottom)}]`);
   if(metrics.pageBottom>metrics.viewportHeight)failures.push(`${view} ${w}: content below viewport`);
   if(metrics.titleOverflow>3)failures.push(`${view} ${w}: clipped page title ${metrics.titleOverflow}px`);
   if(w===1280||w===1648)await page.screenshot({path:`test-results/mono-${view}-${w}x${h}.png`,fullPage:true});
  }
 }
 expect(failures,'Desktop mono-screen geometry regressions').toEqual([]);
});

test('M1 — credit matrix and monthly series remain visible at 1280×720',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/?view=credit');
 const heat=page.locator('.grl-heat');
 const last=page.locator('.grl-heat-row').last().locator('button').last();
 await expect(last).toBeVisible();
 const month=page.locator('.grl-month').last();
 await expect(month).toBeVisible();
 const values=await page.evaluate(()=>{
  const bounds=(selector:string)=>document.querySelector(selector)!.getBoundingClientRect();
  const matrix=bounds('.grl-heat-scroll'),last=bounds('.grl-heat-row:last-of-type button:last-child'),monthly=bounds('.grl-monthly'),month=bounds('.grl-month:last-child');
  return {matrixBottom:matrix.bottom,lastBottom:last.bottom,monthlyBottom:monthly.bottom,monthBottom:month.bottom};
 });
 expect(values.lastBottom).toBeLessThanOrEqual(values.matrixBottom+2);
 expect(values.monthBottom).toBeLessThanOrEqual(values.monthlyBottom+2);
 expect(await heat.locator('button').count()).toBe(25);
});

test('M1 — credit detail opens and closes without hiding analytics behind a permanent panel',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/?view=credit');
 const details=page.locator('.grl-details-overlay');
 await test.step('open aggregate detail',async()=>{
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open','');
  const popup=details.locator('.grl-table-scroll');
  await expect(popup).toBeVisible();
  const bounds=await popup.boundingBox();
  expect(bounds!.height).toBeGreaterThan(200);
 });
 await test.step('close aggregate detail',async()=>{
  await details.locator('summary').click();
  await expect(details).not.toHaveAttribute('open',/.+/);
 });
});

test('M1 — evidence exports open and close without changing source selection',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/?view=evidence');
 const exports=page.locator('.grl-evidence-export-details');
 await test.step('open exports',async()=>{
  await exports.locator('summary').click();
  await expect(exports.locator('.grl-proof-exports')).toBeVisible();
  await expect(exports.getByRole('button',{name:/Exporter/})).toHaveCount(3);
 });
 await test.step('close exports',async()=>{
  await exports.locator('summary').click();
  await expect(exports).not.toHaveAttribute('open',/.+/);
 });
});

test('M1 — mobile stays readable and scrollable instead of shrinking all analyses',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const view of views){
  await page.goto(view==='overview'?'/':'/?view='+view);
  const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollHeight,screen:innerHeight,width:document.documentElement.scrollWidth-innerWidth}));
  expect(metrics.width,`${view} mobile overflow`).toBeLessThanOrEqual(3);
  expect(metrics.scroll,`${view} mobile should allow natural content flow`).toBeGreaterThan(metrics.screen);
 }
});
