import {test,expect,type Page} from '@playwright/test';
async function openX1(page:Page){
 await page.goto('/?x1=1');
 await expect(page.getByTestId('x1-analysis')).toBeVisible();
}
test('X1 — two main destinations and frozen classic shell remain available',async({page})=>{
 await openX1(page);
 await expect(page.locator('.nav-dock .dock-link')).toHaveCount(2);
 await expect(page.getByRole('heading',{name:'Analyse 360 · vision croisée'})).toBeVisible();
 await page.getByRole('button',{name:'Gouvernance & preuves',exact:true}).click();
 await expect(page.getByTestId('x1-governance')).toBeVisible();
 await page.locator('.nav-dock').getByRole('button',{name:'Analyse 360',exact:true}).click();
 await expect(page.getByTestId('x1-analysis')).toBeVisible();
 await page.getByRole('button',{name:'Revenir aux six pages classiques'}).click();
 await expect(page.locator('.nav-dock .dock-link')).toHaveCount(6);
 await expect(page.getByRole('heading',{name:'Vue d’ensemble'})).toBeVisible();
});
test('X1 — credit age and limit filter the SAME cohort, six months, rows and weighted rate',async({page})=>{
 await openX1(page);
 const credit=page.locator('.x1-credit-panel');
 await expect(page.locator('.x1-summary>div').first()).toContainText('30 000');
 await page.getByLabel('Âge Analyse 360').selectOption('18-29');
 await expect(page.locator('.x1-summary>div').first()).toContainText('9 618');
 await expect(credit.locator('.x1-mini-kpis')).toContainText('2 197');
 await expect(credit.locator('.x1-month-bars>div')).toHaveCount(6);
 const months=await credit.locator('.x1-month-bars>div').evaluateAll(xs=>xs.map(x=>x.getAttribute('title')));
 expect(months.every(x=>Number((x?.split('/')?.[1]||'').replace('observations','').replace(/\s/g,''))===9618)).toBe(true);
 await page.getByLabel('Plafond Analyse 360').selectOption('100k-199k');
 await expect(page.locator('.x1-detail-body tbody tr').first()).toContainText('18-29');
 await expect(page.locator('.x1-detail-body tbody tr').first()).toContainText('100k-199k');
 const counts=await page.locator('.x1-detail-body tbody tr').evaluateAll(xs=>xs.filter(x=>x.querySelector('td')).map(x=>Number((x.querySelectorAll('td')[3].textContent||'').replace(/\s/g,''))));
 const kpi=Number((await page.locator('.x1-summary>div').first().locator('b').innerText()).replace(/\s/g,''));
 expect(counts.reduce((a,b)=>a+b,0)).toBe(kpi);
 const x=await credit.locator('.x1-month-bars>div').first().getAttribute('title');
 expect(Number((x?.split('/')?.[1]||'').replace('observations','').replace(/\s/g,''))).toBe(kpi);
 await page.getByRole('button',{name:'Réinitialiser Crédit'}).click();
 await expect(page.locator('.x1-summary>div').first()).toContainText('30 000');
});
test('X1 — bar-click age selection stays synchronized with filters and detail table',async({page})=>{
 await openX1(page);
 await page.getByRole('group',{name:'Taux de défaut par âge'}).getByRole('button').first().click();
 await expect(page.getByLabel('Âge Analyse 360')).toHaveValue('18-29');
 await expect(page.locator('.x1-summary>div').first()).toContainText('9 618');
 await page.getByRole('group',{name:'Taux de défaut par âge'}).getByRole('button').first().click();
 await expect(page.getByLabel('Âge Analyse 360')).toHaveValue('Tout');
});
test('X1 — PaySim channel and day are EXCLUSIVE (never fake joint dimensions)',async({page})=>{
 await openX1(page);
 await page.getByLabel('Type Analyse 360').selectOption('TRANSFER');
 await expect(page.locator('.x1-summary>div').nth(3)).toContainText('486');
 await expect(page.getByLabel('Jour Analyse 360')).toHaveValue('Tous');
 await expect(page.locator('.x1-fraud-panel')).toContainText('non filtrable par type');
 await page.getByLabel('Jour Analyse 360').selectOption('28');
 await expect(page.getByLabel('Type Analyse 360')).toHaveValue('Tous');
 await expect(page.locator('.x1-summary>div').nth(3)).toContainText('299');
 await expect(page.locator('.x1-fraud-panel')).toContainText('non filtrable par jour');
 await expect(page.locator('.x1-model-note')).toContainText('tests globaux, non filtrables');
 await expect(page.getByRole('tab',{name:'Crédit'})).toHaveAttribute('aria-selected','true');
 await page.getByRole('tab',{name:'Fraude'}).click();
 await expect(page.locator('.x1-detail-body tbody tr')).toHaveCount(1);
 await expect(page.locator('.x1-detail-body tbody tr')).toContainText('J28');
 await page.getByRole('button',{name:'Réinitialiser Fraude'}).click();
 await expect(page.getByLabel('Jour Analyse 360')).toHaveValue('Tous');
});
test('X1 — CSV export contains exactly the filtered UCI grouping, no PaySim columns',async({page})=>{
 await openX1(page);
 await page.getByLabel('Âge Analyse 360').selectOption('18-29');
 const promise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Exporter',exact:true}).click();
 const download=await promise;
 expect(download.suggestedFilename()).toBe('bank360-x1-credit-selection.csv');
});
test('X1 — governance condenses checks, methodology, genuine downloads and preferences',async({page})=>{
 await openX1(page);
 await page.getByRole('button',{name:'Ouvrir la gouvernance et les preuves'}).click();
 await expect(page.getByTestId('x1-governance')).toBeVisible();
 await expect(page.locator('.x1-proof-row')).toHaveCount(4);
 await expect(page.locator('.x1-method-link')).toHaveCount(3);
 await expect(page.locator('.x1-export-row')).toHaveCount(3);
 await expect(page.locator('.x1-gov-banner')).toContainText('30 000');
 await expect(page.locator('.x1-gov-banner')).toContainText('6 362 620');
 await page.getByRole('group',{name:'Périmètre de gouvernance'}).getByRole('button',{name:'Fraude',exact:true}).click();
 await expect(page.locator('.x1-export-row')).toHaveCount(1);
 await expect(page.locator('.x1-method-link')).toHaveCount(1);
 await page.locator('.x1-proof-row').first().click();
 await expect(page.locator('.x1-proof-row').first()).toContainText('Source :');
 const save=page.waitForEvent('download');
 await page.locator('.x1-export-row').first().getByRole('button').click();
 expect((await save).suggestedFilename()).toMatch(/bank360-x1-alertes\.csv$/);
});
test('X1 — main geometry fits, controls are visible, and mobile remains scrollable',async({page})=>{
 for(const [width,height] of [[1648,928],[1440,810],[1366,768],[1280,720]] as const){
  await page.setViewportSize({width,height});
  await openX1(page);
  const g=await page.evaluate(()=>{
   const main=document.querySelector('#main-content')!;
   const root=document.querySelector('.x1-root')!.getBoundingClientRect();
   const footer=document.querySelector('.statusline')!.getBoundingClientRect();
   const cards=[...document.querySelectorAll('.x1-analysis-grid .x1-card,.x1-detail')].map(x=>x.getBoundingClientRect());
   return {vertical:main.scrollHeight-main.clientHeight,horizontal:document.documentElement.scrollWidth-innerWidth,bottom:root.bottom,footer:footer.top,cardFits:cards.every(x=>x.left>=root.left-3&&x.right<=root.right+3)};
  });
  expect(g.horizontal).toBeLessThanOrEqual(3);
  expect(g.vertical).toBeLessThanOrEqual(3);
  expect(g.bottom).toBeLessThanOrEqual(g.footer+5);
  expect(g.cardFits).toBe(true);
  if(width===1648||width===1440)await page.screenshot({path:'test-results/x1-analysis-'+width+'x'+height+'.png',fullPage:true});
  await page.getByRole('button',{name:'Gouvernance & preuves',exact:true}).click();
  await expect(page.locator('.x1-gov-exports')).toBeVisible();
  if(width===1648)await page.screenshot({path:'test-results/x1-governance-1648x928.png',fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});
 await openX1(page);
 await expect(page.locator('.x1-filterrail')).toBeVisible();
 await expect(page.locator('.x1-detail')).toBeVisible();
 await page.screenshot({path:'test-results/x1-analysis-mobile-390x844.png',fullPage:true});
});
