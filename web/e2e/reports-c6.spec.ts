import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function openReports(page:Page){
 await page.goto('/');
 await page.getByRole('button',{name:'Rapports',exact:true}).click();
 await expect(page.getByTestId('reports-workspace')).toBeVisible();
}
const scope=(page:Page)=>page.getByRole('group',{name:'Sources des rapports'});
const tabs=(page:Page)=>page.getByRole('tablist',{name:'Perspectives Rapports'});
test('C6 — cockpit unique, vrais exports et méthodologies, aucun objet fictif',async({page})=>{
 await openReports(page);
 await expect(page.getByRole('heading',{name:'Rapports & préférences'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Centre de rapports disponible'})).toBeVisible();
 await expect(page.locator('.rw-export-card')).toHaveCount(3);
 await expect(page.locator('.rw-method-card')).toHaveCount(3);
 await expect(page.locator('.rw-preferences-list>div')).toHaveCount(2);
 await expect(page.locator('.rw-banner-metrics')).toContainText('3');
 await expect(page.locator('.rw-banner-metrics')).toContainText('2');
 await expect(page.locator('.rw-export-card')).not.toContainText('Mo');
 await expect(page.locator('.rw-panel')).toHaveCount(3);
 await expect(page.locator('.nav-dock nav button')).toHaveCount(6);
});
test('C6 — filtered report contexts select only their own independent sources',async({page})=>{
 await openReports(page);
 await scope(page).getByRole('button',{name:'Crédit',exact:true}).click();
 await expect(page.locator('.rw-export-card')).toHaveCount(2);
 await expect(page.locator('.rw-method-card')).toHaveCount(2);
 await expect(page.locator('.rw-export-panel')).not.toContainText('Alertes par canal');
 await expect(page.locator('.rw-banner-metrics')).toContainText('2');
 await scope(page).getByRole('button',{name:'Fraude',exact:true}).click();
 await expect(page.locator('.rw-export-card')).toHaveCount(1);
 await expect(page.locator('.rw-method-card')).toHaveCount(1);
 await expect(page.locator('.rw-export-panel')).not.toContainText('Portefeuille agrégé');
 await expect(page.locator('.rw-banner')).toContainText('PaySim');
 await scope(page).getByRole('button',{name:'Toutes sources'}).click();
 await expect(page.locator('.rw-export-card')).toHaveCount(3);
 await expect(page.locator('.rw-method-card')).toHaveCount(3);
});
test('C6 — four real perspectives remain in one reports route',async({page})=>{
 await openReports(page);
 for(const [name,klass] of [['Exports','rw-perspective-exports'],['Méthodologie','rw-perspective-methodology'],['Préférences','rw-perspective-preferences'],['Vue globale','rw-perspective-overview']] as const){
  await tabs(page).getByRole('tab',{name}).click();
  await expect(tabs(page).getByRole('tab',{name})).toHaveAttribute('aria-selected','true');
  await expect(page.locator('.rw-root')).toHaveClass(new RegExp(klass));
  await expect(page.locator('#main-content')).toHaveAttribute('data-page','reports');
 }
 await tabs(page).getByRole('tab',{name:'Méthodologie'}).click();
 await expect(page.getByTestId('reports-methodology-focus')).toContainText('sans décision bancaire opérationnelle');
 await tabs(page).getByRole('tab',{name:'Préférences'}).click();
 await expect(page.getByTestId('reports-preferences-focus')).toContainText('cette session');
});
test('C6 — genuine CSV export uses aggregated UCI rows and correct headers',async({page})=>{
 await openReports(page);
 const card=page.getByTestId('report-export-portfolio');
 const dl=page.waitForEvent('download');
 await card.getByRole('button',{name:'Télécharger Portefeuille agrégé en CSV'}).click();
 const download=await dl;
 expect(download.suggestedFilename()).toBe('bank360-portefeuille.csv');
 const bytes=await readFile(await download.path());
 const text=bytes.toString('utf8');
 expect(text.charCodeAt(0)).toBe(0xfeff);
 expect(text).toContain('age_band');
 expect(text).toContain('default_count');
 expect(text).not.toContain('client_id');
 expect(text.split('\r\n').filter(Boolean).length).toBeGreaterThan(10);
 await expect(page.locator('.rw-message')).toContainText('lignes agrégées exportées');
});
test('C6 — real XLSX is a ZIP Open XML spreadsheet, with source cell values',async({page})=>{
 await openReports(page);
 const card=page.getByTestId('report-export-alerts');
 await card.getByRole('group',{name:'Format Alertes par canal'}).getByRole('button',{name:'XLSX'}).click();
 const wait=page.waitForEvent('download');
 await card.getByRole('button',{name:'Télécharger Alertes par canal en XLSX'}).click();
 const download=await wait;
 expect(download.suggestedFilename()).toBe('bank360-alertes.xlsx');
 const bytes=await readFile(await download.path());
 expect(bytes.subarray(0,4).equals(Buffer.from([0x50,0x4b,0x03,0x04]))).toBe(true);
 const text=bytes.toString('utf8');
 expect(text).toContain('[Content_Types].xml');
 expect(text).toContain('xl/workbook.xml');
 expect(text).toContain('xl/worksheets/sheet1.xml');
 expect(text).toContain('alerts');
 expect(text).toContain('frauds');
 expect(bytes.length).toBeGreaterThan(1000);
});
test('C6 — UCI credit filter changes report rows and reset restores original selection',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Crédit',exact:true}).click();
 await page.locator('#filter-age').selectOption('18-29');
 await page.getByRole('button',{name:'Rapports',exact:true}).click();
 await expect(page.locator('.rw-preferences-list')).toContainText('18-29');
 const dl=page.waitForEvent('download');
 await page.getByTestId('report-export-portfolio').getByRole('button',{name:'Télécharger Portefeuille agrégé en CSV'}).click();
 const csv=await dl;
 const txt=(await readFile(await csv.path())).toString('utf8');
 const lines=txt.split('\r\n').filter(Boolean);
 expect(lines.length).toBeGreaterThan(1);
 expect(lines.slice(1).every(x=>x.startsWith('"18-29",'))).toBe(true);
 await page.getByRole('button',{name:'Réinitialiser les filtres de crédit'}).click();
 await expect(page.locator('.rw-preferences-list')).toContainText('tous les plafonds');
 await expect(page.locator('.rw-message')).toContainText('réinitialisés');
});
test('C6 — methodologies link to real B2/B3/B4 documents and theme operates',async({page})=>{
 await openReports(page);
 const links=page.locator('.rw-method-card');
 await expect(links).toHaveCount(3);
 for(const doc of ['B2-validation-finale.md','B3-validation-finale.md','B4-validation-finale.md']){
  await expect(page.locator('.rw-method-card[href$="'+doc+'"]')).toHaveCount(1);
 }
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.locator('.rw-preferences-panel').getByRole('button',{name:'Changer le thème'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.locator('.rw-preferences-panel').getByRole('button',{name:'Changer le thème'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
test('C6 — desktop layout is single-screen, panels have no collision or hidden actions',async({page})=>{
 for(const [width,height] of [[1920,1080],[1672,941],[1648,928],[1440,900],[1440,810],[1366,768],[1280,720]] as const){
  await page.setViewportSize({width,height});await openReports(page);
  const result=await page.evaluate(()=>{
   const box=(selector:string)=>document.querySelector(selector)!.getBoundingClientRect();
   const root=box('.rw-root'),banner=box('.rw-banner'),exp=box('.rw-export-panel'),docs=box('.rw-method-panel'),prefs=box('.rw-preferences-panel'),footer=box('.statusline');
   const rows=[...document.querySelectorAll('.rw-export-card')].map(x=>x.getBoundingClientRect());
   const links=[...document.querySelectorAll('.rw-method-card')].map(x=>x.getBoundingClientRect());
   return {rootBottom:root.bottom,footerTop:footer.top,bannerBottom:banner.bottom,expTop:exp.top,expBottom:exp.bottom,
    docsTop:docs.top,docsBottom:docs.bottom,prefTop:prefs.top,prefBottom:prefs.bottom,
    mainScroll:document.querySelector('#main-content')!.scrollHeight-document.querySelector('#main-content')!.clientHeight,
    globalScroll:document.documentElement.scrollHeight-innerHeight,overflowX:document.documentElement.scrollWidth-innerWidth,
    panelOverflows:[...document.querySelectorAll('.rw-panel')].map(x=>x.scrollHeight-x.clientHeight),
    rows:rows.map(x=>({top:x.top,bottom:x.bottom,height:x.height})),links:links.map(x=>({top:x.top,bottom:x.bottom,height:x.height}))};
  });
  const msg=width+'×'+height;
  expect(result.mainScroll,'main scroll '+msg).toBeLessThanOrEqual(3);
  expect(result.globalScroll,'global scroll '+msg).toBeLessThanOrEqual(3);
  expect(result.overflowX,'horizontal overflow '+msg).toBeLessThanOrEqual(3);
  expect(result.rootBottom,'root beyond footer '+msg).toBeLessThanOrEqual(result.footerTop+3);
  expect(result.expTop,'banner/export overlap '+msg).toBeGreaterThanOrEqual(result.bannerBottom-1);
  expect(result.docsTop).toBeGreaterThanOrEqual(result.bannerBottom-1);
  expect(result.prefTop,'method/preferences overlap '+msg).toBeGreaterThanOrEqual(result.docsBottom-1);
  expect(result.rows).toHaveLength(3);
  expect(result.links).toHaveLength(3);
  for(const row of result.rows){expect(row.height,'export card height '+msg).toBeGreaterThanOrEqual(47);expect(row.bottom,'export card clipped '+msg).toBeLessThanOrEqual(result.expBottom+1);}
  for(const link of result.links){expect(link.height,'method row height '+msg).toBeGreaterThanOrEqual(35);expect(link.bottom,'method row clipped '+msg).toBeLessThanOrEqual(result.docsBottom+1);}
  for(const overflow of result.panelOverflows)expect(overflow,'panel overflow '+msg).toBeLessThanOrEqual(3);
  await page.screenshot({path:'test-results/reports-c6-'+width+'x'+height+'.png',fullPage:true});
 }
});
test('C6 — alternate contexts and perspectives do not overflow compact desktop',async({page})=>{
 for(const [width,height] of [[1648,928],[1440,810],[1280,720]] as const){
  await page.setViewportSize({width,height});await openReports(page);
  for(const s of ['Crédit','Fraude','Toutes sources']){
   await scope(page).getByRole('button',{name:s,exact:true}).click();
   for(const t of ['Exports','Méthodologie','Préférences','Vue globale']){
    await tabs(page).getByRole('tab',{name:t,exact:true}).click();
    const g=await page.evaluate(()=>({
     main:document.querySelector('#main-content')!.scrollHeight-document.querySelector('#main-content')!.clientHeight,
     scroll:document.documentElement.scrollHeight-innerHeight,
     overflow:[...document.querySelectorAll('.rw-panel')].map(x=>x.scrollHeight-x.clientHeight)
    }));
    expect(g.main,s+' '+t+' '+width+'×'+height).toBeLessThanOrEqual(3);
    expect(g.scroll).toBeLessThanOrEqual(3);
    expect(g.overflow.every(x=>x<=3)).toBe(true);
   }
   await page.screenshot({path:'test-results/reports-c6-context-'+s.replace(' ','-')+'-'+width+'x'+height+'.png',fullPage:true});
  }
 }
});
test('C6 — mobile 390×844 is readable with a usable export selector',async({page})=>{
 await page.setViewportSize({width:390,height:844});await openReports(page);
 await expect(page.locator('.rw-export-card')).toHaveCount(3);
 const state=await page.evaluate(()=>({
   xOverflow:document.documentElement.scrollWidth-innerWidth,
   mainScroll:document.querySelector('#main-content')!.scrollHeight-document.querySelector('#main-content')!.clientHeight
 }));
 expect(state.xOverflow).toBeLessThanOrEqual(2);
 expect(state.mainScroll).toBeGreaterThan(0);
 await page.getByTestId('report-export-payments').getByRole('group',{name:'Format Historique des paiements'}).getByRole('button',{name:'XLSX'}).click();
 await expect(page.getByTestId('report-export-payments').getByRole('button',{name:'Télécharger Historique des paiements en XLSX'})).toBeVisible();
 await page.screenshot({path:'test-results/reports-c6-mobile-390x844.png',fullPage:true});
});
