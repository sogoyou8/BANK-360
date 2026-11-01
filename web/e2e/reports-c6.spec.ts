import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function openReports(page:Page){
 await page.goto('/?classic=1');
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
 expect(await page.locator('.rw-export-list').textContent()).not.toMatch(/~\s*\d+(?:[,.]\d+)?\s*Mo\b/);
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
 await download.saveAs('test-results/reports-c6-alertes-real.xlsx');
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
 await page.goto('/?classic=1');
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

test('C6.1 — approved Aurora reference keeps dock rails and balanced content at 1672×941',async({page})=>{
 await page.setViewportSize({width:1672,height:941});await openReports(page);
 const g=await page.evaluate(()=>{
  const read=(selector:string)=>{const b=document.querySelector(selector)!.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,right:b.right,bottom:b.bottom};};
  return {dock:read('.nav-dock'),banner:read('.rw-banner'),exports:read('.rw-export-panel'),method:read('.rw-method-panel'),preferences:read('.rw-preferences-panel')};
 });
 expect(Math.abs(g.dock.x-17),'dock x reference').toBeLessThanOrEqual(3);
 expect(Math.abs(g.dock.w-87),'dock width').toBeLessThanOrEqual(3);
 expect(Math.abs(g.banner.x-135),'banner left rail').toBeLessThanOrEqual(4);
 expect(Math.abs(g.banner.right-1642),'banner right rail').toBeLessThanOrEqual(4);
 expect(g.banner.y,'banner below full header').toBeGreaterThanOrEqual(245);
 expect(g.exports.y,'panels below banner').toBeGreaterThanOrEqual(g.banner.bottom+8);
 expect(Math.abs(g.exports.y-g.method.y),'main panel top alignment').toBeLessThanOrEqual(2);
 expect(g.method.bottom,'method should be taller than preferences').toBeLessThan(g.preferences.bottom);
 expect(g.preferences.y,'preferences below methodology').toBeGreaterThan(g.method.bottom);
 await page.screenshot({path:'test-results/reports-c61-reference-1672x941.png',fullPage:true});
});


test('C6.2 — 1648x928 approved Aurora target keeps 54/46 panel balance and original footer',async({page})=>{
 await page.setViewportSize({width:1648,height:928});await openReports(page);
 const g=await page.evaluate(()=>{
  const bounds=(q:string)=>document.querySelector(q)!.getBoundingClientRect();
  const a=bounds('.rw-export-panel'),b=bounds('.rw-method-panel'),c=bounds('.rw-preferences-panel'),
   banner=bounds('.rw-banner'),footer=bounds('.statusline'),main=document.querySelector('#main-content')!;
  return {a:{x:a.x,width:a.width,top:a.top,bottom:a.bottom},b:{x:b.x,width:b.width,top:b.top,bottom:b.bottom},
   c:{top:c.top,bottom:c.bottom},banner:{x:banner.x,top:banner.top,bottom:banner.bottom},
   footerTop:footer.top,scroll:main.scrollHeight-main.clientHeight,overall:document.documentElement.scrollHeight-innerHeight};
 });
 expect(Math.abs(g.banner.x-133),'left rail x').toBeLessThanOrEqual(5);
 expect(Math.abs(g.banner.top-251),'banner vertical reference').toBeLessThanOrEqual(12);
 expect(Math.abs(g.a.top-357),'panels vertical reference').toBeLessThanOrEqual(12);
 expect(g.a.width/g.b.width,'left/right column ratio').toBeGreaterThan(1.15);
 expect(g.a.width/g.b.width,'left/right column ratio').toBeLessThan(1.25);
 expect(g.b.x-g.a.x-g.a.width,'card gap').toBeGreaterThanOrEqual(9);
 expect(g.a.bottom).toBeLessThanOrEqual(g.footerTop+1);
 expect(g.c.bottom).toBeLessThanOrEqual(g.footerTop+1);
 expect(g.scroll).toBeLessThanOrEqual(3);
 expect(g.overall).toBeLessThanOrEqual(3);
 await page.screenshot({path:'test-results/reports-c62-target-1648x928.png',fullPage:true});
});


test('C6.3 — no label/button collisions or clipped preferences across sources, perspectives and viewports',async({page})=>{
 for(const [width,height] of [[1648,928],[1440,810],[1366,768],[1280,720]] as const){
  await page.setViewportSize({width,height});await openReports(page);
  for(const s of ['Toutes sources','Crédit','Fraude'] as const){
   await scope(page).getByRole('button',{name:s,exact:true}).click();
   for(const tab of ['Méthodologie','Préférences','Exports','Vue globale'] as const){
    await tabs(page).getByRole('tab',{name:tab}).click();
    const g=await page.evaluate(()=>{
     const root=document.querySelector('.rw-root')!;
     const rect=(e:Element)=>e.getBoundingClientRect();
     const method=document.querySelector('.rw-method-panel')!;
     const pref=document.querySelector('.rw-preferences-panel')!;
     const prefRect=rect(pref),titleRect=rect(pref.querySelector('.rw-panel-title')!);
     const list=rect(pref.querySelector('.rw-preferences-list')!);
     const prefRows=[...pref.querySelectorAll('.rw-preferences-list>div')].map(row=>{
      const r=rect(row),text=rect(row.querySelector('span')!),button=rect(row.querySelector('button')!);
      const labels=[...row.querySelectorAll('strong,small')].map(rect);
      return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,
       textLeft:text.left,textRight:text.right,textTop:text.top,textBottom:text.bottom,
       labelSeparation:labels.length===2?labels[1].top-labels[0].bottom:0,
       buttonLeft:button.left,buttonRight:button.right,buttonTop:button.top,buttonBottom:button.bottom,
       buttonHeight:button.height};
     });
     const methodCards=[...method.querySelectorAll('.rw-method-card')].map(rect);
     const methodNote=method.querySelector('.rw-focus-note');
     const exportPanel=document.querySelector('.rw-export-panel')!;
     const summary=exportPanel.querySelector('.rw-context-summary');
     const exportCards=[...exportPanel.querySelectorAll('.rw-export-card')].map(rect);
     const foot=rect(exportPanel.querySelector('.rw-export-bottom')!);
     const end=rect(root);
     return {
      global:document.documentElement.scrollHeight-innerHeight,
      horizontal:document.documentElement.scrollWidth-innerWidth,
      page:document.querySelector('#main-content')!.scrollHeight-document.querySelector('#main-content')!.clientHeight,
      panelOverflow:[...root.querySelectorAll('.rw-panel')].map(x=>x.scrollHeight-x.clientHeight),
      titleBottom:titleRect.bottom,listTop:list.top,listBottom:list.bottom,prefBottom:prefRect.bottom,
      rows:prefRows,methodNoteBottom:methodNote?rect(methodNote).bottom:null,
      methodBottom:rect(method).bottom,methodCards:methodCards.map(x=>({top:x.top,bottom:x.bottom})),
      summary:summary?{top:rect(summary).top,bottom:rect(summary).bottom}:null,
      lastExportBottom:exportCards.at(-1)?.bottom??0,exportFootTop:foot.top,
      exportBottom:rect(exportPanel).bottom,rootBottom:end.bottom,footerTop:rect(document.querySelector('.statusline')!).top
     };
    });
    const name=width+'×'+height+' '+s+' / '+tab;
    expect(g.global,'global scroll '+name).toBeLessThanOrEqual(3);
    expect(g.page,'main scroll '+name).toBeLessThanOrEqual(3);
    expect(g.horizontal,'horizontal overflow '+name).toBeLessThanOrEqual(3);
    expect(g.panelOverflow.every(v=>v<=3),'no panel clipping '+name).toBe(true);
    expect(g.rows).toHaveLength(2);
    expect(g.listTop,'preference list below header '+name).toBeGreaterThanOrEqual(g.titleBottom-1);
    for(const row of g.rows){
     expect(row.height,'preference row has height '+name).toBeGreaterThanOrEqual(34);
     expect(row.textRight,'label vs button collision '+name).toBeLessThanOrEqual(row.buttonLeft-5);
     expect(row.buttonRight,'button inside row '+name).toBeLessThanOrEqual(row.right+1);
     expect(row.buttonTop,'button inside top '+name).toBeGreaterThanOrEqual(row.top-1);
     expect(row.buttonBottom,'button inside bottom '+name).toBeLessThanOrEqual(row.bottom+1);
     expect(row.textTop,'label inside top '+name).toBeGreaterThanOrEqual(row.top-1);
     expect(row.textBottom,'label inside bottom '+name).toBeLessThanOrEqual(row.bottom+1);
     expect(row.labelSeparation,'label lines overlap '+name).toBeGreaterThanOrEqual(-1);
    }
    expect(g.rows[0].bottom,'two rows must not overlap '+name).toBeLessThanOrEqual(g.rows[1].top+1);
    expect(g.rows[1].bottom,'last preference row remains inside panel '+name).toBeLessThanOrEqual(g.prefBottom+1);
    expect(g.listBottom,'list remains inside panel '+name).toBeLessThanOrEqual(g.prefBottom+1);
    expect(g.methodNoteBottom??0,'method focus note remains inside panel '+name).toBeLessThanOrEqual(g.methodBottom+1);
    if(g.summary){
     expect(s,'source context only when filtered '+name).not.toBe('Toutes sources');
     expect(g.summary.top,'source context after exports '+name).toBeGreaterThanOrEqual(g.lastExportBottom-1);
     expect(g.summary.bottom,'source context before explanatory footer '+name).toBeLessThanOrEqual(g.exportFootTop+1);
     expect(g.summary.bottom,'source context inside export panel '+name).toBeLessThanOrEqual(g.exportBottom+1);
    }else expect(s).toBe('Toutes sources');
    expect(g.rootBottom).toBeLessThanOrEqual(g.footerTop+3);
    if(tab==='Méthodologie'||(tab==='Vue globale'&&s!=='Toutes sources')){
     const safeScope=s==='Crédit'?'credit':s==='Fraude'?'fraud':'all';
     await page.screenshot({path:'test-results/reports-c63-'+safeScope+'-'+(tab==='Méthodologie'?'methodology':'overview')+'-'+width+'x'+height+'.png',fullPage:true});
    }
   }
  }
 }
});
