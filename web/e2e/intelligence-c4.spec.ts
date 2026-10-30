import {test,expect,type Page} from '@playwright/test';
const intelligence=async(page:Page)=>{await page.goto('/');await page.getByRole('button',{name:'Intelligence',exact:true}).click();await expect(page.locator('#main-content')).toHaveAttribute('data-page','models')};
const contexts=(page:Page)=>page.getByRole('group',{name:'Jeu de données'});
const noScroll=async(page:Page)=>{const v=await page.locator('#main-content').evaluate(el=>el.scrollHeight-el.clientHeight);expect(v).toBeLessThanOrEqual(3)};

test('C4 — une route Intelligence, trois perspectives, quatre KPI et trois panneaux',async({page})=>{
 await intelligence(page);
 await expect(page.getByRole('heading',{name:'Modèles & explorateur de données'})).toBeVisible();
 await expect(page.locator('.dock-link')).toHaveCount(6);
 await expect(page.locator('.iw-kpi')).toHaveCount(4);
 await expect(page.locator('.iw-panel')).toHaveCount(3);
 await expect(page.locator('.iw-kpi strong')).toHaveText(['0,776','0,549','196','22,1 %']);
 await expect(page.getByRole('tab',{name:'Vue globale'})).toHaveAttribute('aria-selected','true');
 for(const mode of ['Modèles','Explorer','Vue globale']){
  const tab=page.getByRole('tablist',{name:'Perspectives Intelligence'}).getByRole('tab',{name:mode});
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#main-content')).toHaveAttribute('data-page','models');
  await expect(page.locator('.iw-panel')).toHaveCount(3);
 }
 await expect(page.locator('.iw-table-window tbody tr')).toHaveCount(196);
 await noScroll(page);
});
test('C4 — déciles B3 véridiques et sélection contextuelle sans faux filtrage',async({page})=>{
 await intelligence(page);
 await expect(page.locator('.iw-bar')).toHaveCount(10);
 await expect(page.locator('.iw-bar-value')).toHaveText(['69,5 %','42,3 %','24,7 %','20,0 %','17,2 %','14,8 %','11,2 %','11,3 %','5,0 %','5,2 %']);
 await page.locator('.iw-bar').first().click();
 await expect(page.locator('.iw-chart-note')).toContainText('600 observations');
 await expect(page.locator('.iw-chart-note')).toContainText('417 cas');
 await expect(page.locator('.iw-kpi strong').first()).toHaveText('0,776');
 await page.getByLabel('Âge Intelligence').selectOption('18-29');
 await expect(page.locator('.iw-kpi strong').first()).toHaveText('0,776');
 await expect(page.locator('.iw-chart-note')).toContainText('D1');
 await expect(page.locator('.iw-table-window tbody tr').first()).toContainText('18-29');
 await expect(page.locator('.iw-kpi').nth(2).locator('strong')).not.toHaveText('196');
 await page.getByRole('button',{name:'Réinitialiser',exact:true}).click();
 await expect(page.locator('.iw-kpi').nth(2).locator('strong')).toHaveText('196');
});
test('C4 — vrais diagnostics Crédit : validation, variables, calibration et audit suppressions',async({page})=>{
 await intelligence(page);
 await expect(page.locator('.iw-ranking-row')).toHaveCount(3);
 await expect(page.locator('.iw-ranking')).toContainText('0,572');
 await expect(page.locator('.iw-ranking')).toContainText('0,514');
 await expect(page.locator('.iw-ranking')).toContainText('0,221');
 await expect(page.locator('.iw-mini-kpis')).toContainText('0,136');
 await expect(page.locator('.iw-mini-kpis')).toContainText('85,2 %');
 await page.getByRole('tab',{name:'Variables'}).click();
 await expect(page.locator('.iw-evidence')).toContainText('Retard · septembre');
 await page.getByRole('tab',{name:'Calibration'}).click();
 await expect(page.locator('.iw-calibration circle')).toHaveCount(8);
 await expect(page.locator('.iw-calibration')).toContainText('Score moyen');
 await page.getByRole('tab',{name:'Sous-groupes'}).click();
 await expect(page.locator('.iw-audit tbody tr')).toHaveCount(5);
 await expect(page.locator('.iw-audit tbody')).toContainText('Masqué');
 await expect(page.locator('.iw-audit tbody')).toContainText('60+');
});
test('C4 — exploration UCI : filtres croisés, recherche, tri, détail au clavier et CSV',async({page})=>{
 await intelligence(page);
 await page.getByLabel('Âge Intelligence').selectOption('18-29');
 await page.getByLabel('Plafond Intelligence').selectOption('100k-199k');
 await expect(page.locator('.iw-table-window tbody tr').first()).toContainText('18-29');
 await expect(page.locator('.iw-table-window tbody tr').first()).toContainText('100k-199k');
 await page.getByLabel('Rechercher des groupes').fill('à jour');
 const matched=await page.locator('.iw-table-window tbody tr').count();
 expect(matched).toBeGreaterThan(0);expect(matched).toBeLessThan(196);
 await page.getByRole('button',{name:'Trier par Dossiers'}).click();
 await page.locator('.iw-table-window tbody tr').first().focus();
 await page.keyboard.press('Enter');
 await expect(page.locator('.iw-explorer-footer')).toContainText('Groupe sélectionné');
 const dl=page.waitForEvent('download');
 await page.getByRole('button',{name:'Exporter les groupes affichés en CSV'}).click();
 expect((await dl).suggestedFilename()).toBe('bank360-intelligence-credit-agregats.csv');
 await page.getByRole('button',{name:'Réinitialiser',exact:true}).click();
 await expect(page.locator('.iw-table-window tbody tr')).toHaveCount(196);
});
test('C4 — PaySim : contexte Fraude et jours, aucun mélange UCI ou fausse transaction',async({page})=>{
 await intelligence(page);
 await contexts(page).getByRole('button',{name:'Fraude'}).click();
 await expect(page.locator('.intelligence-workspace')).toHaveAttribute('data-context','fraud');
 await expect(page.locator('.iw-kpi strong').first()).toHaveText('0,920');
 await expect(page.locator('.iw-kpi strong').nth(1)).toHaveText('0,365');
 await expect(page.locator('.iw-table-window tbody tr')).toHaveCount(5);
 await expect(page.locator('.iw-bar')).toHaveCount(10);
 await expect(page.locator('.iw-diag-tabs')).toContainText('Dérive');
 await page.getByRole('tab',{name:'Dérive'}).click();
 await expect(page.locator('.iw-evidence')).toContainText('Sous-calibration', {ignoreCase:true});
 await contexts(page).getByRole('button',{name:'Jours simulés'}).click();
 await expect(page.locator('.intelligence-workspace')).toHaveAttribute('data-context','days');
 await expect(page.locator('.iw-bar')).toHaveCount(6);
 await expect(page.locator('.iw-table-window tbody tr')).toHaveCount(6);
 await expect(page.locator('.iw-chart')).toContainText('299');
 await expect(page.locator('.iw-explorer')).not.toContainText('2025-09-30');
 await expect(page.locator('.iw-explorer')).not.toContainText('Score client');
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter les groupes affichés en CSV'}).click();
 expect((await dl).suggestedFilename()).toContain('days');
});
test('C4 — mono écran Aurora aux tailles desktop, captures de recette',async({page})=>{
 for(const [width,height] of [[1920,1080],[1672,941],[1648,928],[1440,900],[1366,768],[1280,720]] as const){
  await page.setViewportSize({width,height});await intelligence(page);
  await noScroll(page);
  const positions=await page.evaluate(()=>{
   const root=document.querySelector('#main-content')!.getBoundingClientRect();
   const panels=[...document.querySelectorAll('.iw-panel')].map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,right:r.right}});
   return {panels,right:root.right,bottom:root.bottom,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(positions.panels).toHaveLength(3);
  expect(positions.overflow).toBeLessThanOrEqual(2);
  for(const x of positions.panels){expect(x.height,'panel height '+width+'×'+height).toBeGreaterThan(120);expect(x.bottom,'panel bottom '+width+'×'+height).toBeLessThanOrEqual(positions.bottom+1);expect(x.right).toBeLessThanOrEqual(positions.right+1)}
  const visible=await page.locator('.iw-table-window').evaluate(el=>{
   const box=el.getBoundingClientRect();return [...el.querySelectorAll('tbody tr')].filter(row=>{const r=row.getBoundingClientRect();return r.top>=box.top&&r.bottom<=box.bottom+1}).length;
  });
  expect(visible,'fully visible table rows '+width+'×'+height).toBeGreaterThanOrEqual(height>=900?8:4);
  await page.screenshot({path:'test-results/intelligence-c4-'+width+'x'+height+'.png',fullPage:true});
 }
});
test('C4 — thème clair, mobile, dock et scroll limité au tableau',async({page})=>{
 await page.setViewportSize({width:390,height:844});await intelligence(page);
 await expect(page.locator('.iw-panel')).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
 await page.getByRole('button',{name:'Basculer le thème'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.screenshot({path:'test-results/intelligence-c4-mobile-light.png',fullPage:true});
});

test('C4.8.1–C4.8.2 — Diagnostics : aucune collision avec Référence, deux mini-KPI et note',async({page})=>{
 for(const [width,height] of [[1920,1080],[1672,941],[1648,928],[1440,900],[1366,768],[1280,720]] as const){
  await page.setViewportSize({width,height});await intelligence(page);
  const layout=await page.locator('.iw-diagnostics').evaluate(panel=>{
   const box=(el:Element)=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height}};
   const rows=[...panel.querySelectorAll('.iw-ranking-row')].map(box);
   const cards=box(panel.querySelector('.iw-mini-kpis')!);
   const note=box(panel.querySelector('.iw-diag-footnote')!);
   const body=box(panel.querySelector('.iw-panel-content')!);
   const panelRect=box(panel);
   const title=box(panel.querySelector('.iw-panel-header')!);
   return {rows,cards,note,body,panelRect,title,
    scroll:(panel.querySelector('.iw-panel-content') as HTMLElement).scrollHeight-(panel.querySelector('.iw-panel-content') as HTMLElement).clientHeight};
  });
  expect(layout.rows).toHaveLength(3);
  expect(layout.rows.every(r=>r.height>=13),'all model rows visible '+width+'x'+height).toBe(true);
  for(let i=1;i<3;i++)expect(layout.rows[i].top,'separated rows at '+width+'x'+height).toBeGreaterThanOrEqual(layout.rows[i-1].bottom-1);
  expect(layout.cards.top,'mini KPI must be below Reference '+width+'x'+height).toBeGreaterThanOrEqual(layout.rows[2].bottom+2);
  expect(layout.note.top,'footnote must not overlap mini KPI '+width+'x'+height).toBeGreaterThanOrEqual(layout.cards.bottom-1);
  expect(layout.note.bottom,'footnote within panel '+width+'x'+height).toBeLessThanOrEqual(layout.panelRect.bottom);
  expect(layout.scroll,'no clipped diagnostic body '+width+'x'+height).toBeLessThanOrEqual(2);
  await noScroll(page);
 }
});

test('C4.8.3–C4.8.4 — visual target proportions, at least nine table rows on reference desktop',async({page})=>{
 for(const [width,height] of [[1920,1080],[1672,941],[1648,928],[1440,900],[1366,768],[1280,720]] as const){
  await page.setViewportSize({width,height});await intelligence(page);
  const geometry=await page.evaluate(()=>{
   const rect=(sel:string)=>document.querySelector(sel)!.getBoundingClientRect();
   const upper=rect('.iw-deciles'),lower=rect('.iw-explorer'),table=rect('.iw-table-window');
   const title=document.querySelector('.iw-title h1')!;
   const rows=[...document.querySelectorAll('.iw-table-window tbody tr')].filter(el=>{
    const r=el.getBoundingClientRect();return r.top>=table.top&&r.bottom<=table.bottom+1;
   }).length;
   return {upper:upper.height,lower:lower.height,
     visibleRows:rows,headingSize:parseFloat(getComputedStyle(title).fontSize),
     horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
     tableScroll:(document.querySelector('.iw-table-window') as HTMLElement).scrollHeight-(document.querySelector('.iw-table-window') as HTMLElement).clientHeight};
  });
  const minRows=height>=900?9:height>=760?6:4;
  expect(geometry.visibleRows,'table rows at '+width+'x'+height).toBeGreaterThanOrEqual(minRows);
  expect(geometry.upper/geometry.lower,'top / explorer panel ratio '+width+'x'+height).toBeGreaterThanOrEqual(.59);
  expect(geometry.upper/geometry.lower,'top / explorer panel ratio '+width+'x'+height).toBeLessThan(1.05);
  expect(geometry.headingSize,'heading legible at '+width+'x'+height).toBeGreaterThanOrEqual(width>1450?26:20);
  expect(geometry.horizontalOverflow,'no horizontal page scroll').toBeLessThanOrEqual(2);
  await noScroll(page);
  await page.screenshot({path:'test-results/intelligence-c48-'+width+'x'+height+'.png',fullPage:true});
 }
});

test('C4.8.4 — 1648px reference rail, title and card alignment',async({page})=>{
 await page.setViewportSize({width:1648,height:928});await intelligence(page);
 const rails=await page.evaluate(()=>{
  const rect=(sel:string)=>{const r=document.querySelector(sel)!.getBoundingClientRect();return{x:r.x,width:r.width}};
  return {dock:rect('.nav-dock'),title:rect('.iw-title h1'),kpi:rect('.iw-kpi'),tab:rect('.iw-header-controls .iw-segments')};
 });
 expect(Math.abs(rails.dock.x-17),'Aurora dock left').toBeLessThanOrEqual(4);
 expect(Math.abs(rails.dock.width-87),'Aurora dock width').toBeLessThanOrEqual(2);
 expect(Math.abs(rails.kpi.x-134),'cockpit left rail').toBeLessThanOrEqual(6);
 expect(Math.abs(rails.title.x-263),'Intelligence title alignment').toBeLessThanOrEqual(14);
 expect(Math.abs(rails.tab.x-782),'perspectives horizontal alignment').toBeLessThanOrEqual(20);
 await noScroll(page);
});


test('C4.10 — aucune ligne partiellement coupée au repos ni au bas de l’Explorateur',async({page})=>{
 const sizes:[[number,number],...[number,number][]]=[[1920,1080],[1672,941],[1648,928],[1440,900],[1366,768],[1280,720],[390,844]];
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});
  await intelligence(page);
  const state=async()=>page.locator('.iw-table-window').evaluate(viewport=>{
   const slot=viewport.parentElement!;
   const rect=(el:Element)=>el.getBoundingClientRect();
   const box=rect(viewport),available=rect(slot),heading=rect(viewport.querySelector('thead')!);
   const dataTop=heading.bottom;
   const rows=[...viewport.querySelectorAll('tbody tr')].map(rect);
   const intersecting=rows.filter(r=>r.bottom>dataTop+1&&r.top<box.bottom-1);
   const partialAtBottom=intersecting.filter(r=>r.bottom>box.bottom+1);
   const complete=intersecting.filter(r=>r.top>=dataTop-1&&r.bottom<=box.bottom+1);
   return {partialAtBottom:partialAtBottom.length,complete:complete.length,overflow:document.documentElement.scrollWidth-innerWidth,
    viewportHeight:box.height,slotHeight:available.height,unused:available.bottom-box.bottom,
    top:viewport.scrollTop,max:viewport.scrollHeight-viewport.clientHeight,header:heading.height,
    firstComplete:complete[0]?.top,lastComplete:complete.at(-1)?.bottom,tableBottom:box.bottom};
  });
  const initial=await state();
  expect(initial.partialAtBottom,'clipped last row at rest '+width+'×'+height).toBe(0);
  expect(initial.complete,'full rows at rest '+width+'×'+height).toBeGreaterThanOrEqual(height>=900?9:height>=760?6:3);
  expect(initial.unused,'unused area smaller than a row '+width+'×'+height).toBeGreaterThanOrEqual(-1);
  expect(initial.unused,'unused area smaller than a row '+width+'×'+height).toBeLessThanOrEqual(28);
  expect(initial.overflow,'horizontal viewport overflow '+width+'×'+height).toBeLessThanOrEqual(2);
  await page.screenshot({path:'test-results/intelligence-c410-'+width+'x'+height+'.png',fullPage:true});
  await page.locator('.iw-table-window').evaluate(el=>el.scrollTo({top:el.scrollHeight,behavior:'instant'}));
  await expect.poll(async()=>(await state()).partialAtBottom,{timeout:4000,message:'no cut row at end '+width+'×'+height}).toBe(0);
  const end=await state();
  expect(end.complete,'full rows at end '+width+'×'+height).toBeGreaterThanOrEqual(height>=900?9:height>=760?6:3);
  if(width>900)await noScroll(page);
 }
});

test('C4.10 — filtres, onglets, recherche et export préservent le découpage du tableau',async({page})=>{
 await page.setViewportSize({width:1648,height:928});await intelligence(page);
 const check=async()=>page.locator('.iw-table-window').evaluate(viewport=>{
  const vr=viewport.getBoundingClientRect();
  const hr=viewport.querySelector('thead')!.getBoundingClientRect();
  const rows=[...viewport.querySelectorAll('tbody tr')].map(el=>el.getBoundingClientRect());
  const partial=rows.filter(r=>r.bottom>hr.bottom+1&&r.top<vr.bottom-1&&r.bottom>vr.bottom+1).length;
  return {partial,visible:rows.filter(r=>r.top>=hr.bottom-1&&r.bottom<=vr.bottom+1).length};
 });
 await expect.poll(async()=>(await check()).partial).toBe(0);
 await page.getByLabel('Âge Intelligence').selectOption('18-29');
 await expect.poll(async()=>(await check()).partial).toBe(0);
 await page.getByLabel('Rechercher des groupes').fill('à jour');
 await expect.poll(async()=>(await check()).partial).toBe(0);
 await page.getByRole('button',{name:'Réinitialiser',exact:true}).click();
 await expect.poll(async()=>(await check()).visible).toBeGreaterThanOrEqual(9);
 await page.getByRole('group',{name:'Jeu de données'}).getByRole('button',{name:'Fraude'}).click();
 await expect(page.locator('.iw-table-window tbody tr')).toHaveCount(5);
 await expect.poll(async()=>(await check()).partial).toBe(0);
 await page.getByRole('group',{name:'Jeu de données'}).getByRole('button',{name:'Jours simulés'}).click();
 await expect(page.locator('.iw-table-window tbody tr')).toHaveCount(6);
 await expect.poll(async()=>(await check()).partial).toBe(0);
 await page.getByRole('group',{name:'Jeu de données'}).getByRole('button',{name:'Crédit'}).click();
 await expect.poll(async()=>(await check()).visible).toBeGreaterThanOrEqual(9);
 await noScroll(page);
});


test('C4.11 — diagnostic viewport CSS explicite, actif uniquement sur demande',async({page})=>{
 await page.setViewportSize({width:1648,height:928});
 await intelligence(page);
 await expect(page.getByTestId('iw-viewport-diagnostic')).toHaveCount(0);
 await page.goto('/?c4diag=1');
 await page.getByRole('button',{name:'Intelligence',exact:true}).click();
 const diag=page.getByTestId('iw-viewport-diagnostic');
 await expect(diag).toBeVisible();
 await expect(page.getByTestId('iw-css-viewport')).toHaveText('1648 × 928');
 await expect.poll(async()=>Number(await page.getByTestId('iw-full-rows').textContent())).toBeGreaterThanOrEqual(9);
 await expect(diag).toContainText('Espace manquant pour 9');
 await page.screenshot({path:'test-results/intelligence-c411-diagnostic-1648x928.png',fullPage:true});
 await page.setViewportSize({width:1318,height:742});
 await expect(page.getByTestId('iw-css-viewport')).toHaveText('1318 × 742');
 await expect.poll(async()=>{
  const count=Number(await page.getByTestId('iw-full-rows').textContent());
  return count>0;
 }).toBe(true);
 const reading=await page.locator('.iw-table-window').evaluate(viewport=>{
  const slot=viewport.parentElement!;
  const head=viewport.querySelector('thead')!.getBoundingClientRect();
  const row=viewport.querySelector('tbody tr')!.getBoundingClientRect();
  const available=slot.getBoundingClientRect().height;
  const realCount=[...viewport.querySelectorAll('tbody tr')].filter(x=>{
   const r=x.getBoundingClientRect(),v=viewport.getBoundingClientRect();
   return r.top>=head.bottom-1&&r.bottom<=v.bottom+1;
  }).length;
  return {realCount,shortfall:Math.max(0,Math.ceil(head.height+9*row.height-available))};
 });
 expect(Number(await page.getByTestId('iw-full-rows').textContent())).toBe(reading.realCount);
 if(reading.realCount<9)expect(reading.shortfall).toBeGreaterThan(0);
 await page.screenshot({path:'test-results/intelligence-c411-diagnostic-1318x742.png',fullPage:true});
});

test('C4.11 — DPR 125 % sans changement du viewport CSS ne réduit pas le nombre de lignes',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1648,height:928},deviceScaleFactor:1.25});
 try{
  const page=await context.newPage();
  await page.goto('/?c4diag=1');
  await page.getByRole('button',{name:'Intelligence',exact:true}).click();
  await expect(page.getByTestId('iw-css-viewport')).toHaveText('1648 × 928');
  const resolution=await page.evaluate(()=>({w:innerWidth,h:innerHeight,dpr:devicePixelRatio}));
  expect(resolution).toEqual({w:1648,h:928,dpr:1.25});
  await expect.poll(async()=>Number(await page.getByTestId('iw-full-rows').textContent())).toBeGreaterThanOrEqual(9);
  await expect(page.getByTestId('iw-viewport-diagnostic')).toContainText('1.25');
  await page.screenshot({path:'test-results/intelligence-c411-dpr125.png',fullPage:true});
 }finally{await context.close()}
});
