import {test,expect,type Page} from '@playwright/test';
const noMainScroll=async(page:Page)=>{const v=await page.locator('#main-content').evaluate(e=>e.scrollHeight-e.clientHeight);expect(v).toBeLessThanOrEqual(3)};
const credit=async(page:Page)=>{await page.getByRole('button',{name:'Crédit',exact:true}).click();await expect(page.locator('#main-content')).toHaveAttribute('data-page','portfolio')};
const section=async(page:Page,name:string,target?:string)=>{await page.getByRole('button',{name,exact:true}).click();if(target)await page.getByRole('menuitem',{name:new RegExp(target)}).click()};

test('Architecture : sept pages, six sections, une seule vue Crédit et données séparées',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'Vue d’ensemble'})).toBeVisible();
 await expect(page.locator('.dock-link')).toHaveCount(6);
 await credit(page);await expect(page.getByRole('heading',{name:'Portefeuille & segmentation'})).toBeVisible();
 await expect(page.getByRole('tab',{name:'Vue globale'})).toBeVisible();
 await expect(page.getByRole('tab',{name:'Risque'})).toBeVisible();
 await expect(page.getByRole('tab',{name:'Paiements'})).toBeVisible();
 await expect(page.getByText('30 000').first()).toBeVisible();
 await noMainScroll(page);
});
test('Mono-écran à 1440×900 : sept routes et crédit trois modes',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');await noMainScroll(page);
 await credit(page);for(const tab of ['Vue globale','Risque','Paiements']){await page.getByRole('tab',{name:tab}).click();await noMainScroll(page)}
 await section(page,'Fraude');for(const mode of ['Vue globale','Détection','Alertes']){await page.getByRole('tab',{name:mode}).click();await noMainScroll(page)}
 for(const [group,name] of [['Intelligence','Modèles'],['Intelligence','Explorer']]){await section(page,group,name);await noMainScroll(page)}
 await section(page,'Qualité');await noMainScroll(page);await section(page,'Rapports');await noMainScroll(page);
});
test('Portefeuille : population officielle, KPI pondérés, six panneaux',async({page})=>{
 await page.goto('/');await credit(page);
 await expect(page.locator('.cw-panel')).toHaveCount(6);
 await expect(page.getByText('6 636').first()).toBeVisible();
 await expect(page.getByText('167 484 NTD')).toBeVisible();
 await expect(page.getByText('6 818').first()).toBeVisible();
 await expect(page.locator('.cw-monthtable tbody tr')).toHaveCount(6);
});
test('Filtre âge croise portefeuille, défaut et six mois, reset restaure 30k',async({page})=>{
 await page.goto('/');await credit(page);
 await page.locator('#filter-age').selectOption('18-29');
 await expect(page.locator('.cw-kpi').first()).toContainText('9 618');
 await expect(page.locator('.cw-kpi').nth(1)).toContainText('2 197');
 await expect(page.locator('.cw-kpi').nth(2)).toContainText('124 209');
 await expect(page.locator('.cw-monthtable tbody tr')).toHaveCount(6);
 const totals=await page.locator('.cw-monthtable tbody tr').evaluateAll(rs=>rs.map(r=>(r.cells[1].textContent||'').replace(/\s/g,' ')));
 expect(totals).toEqual(Array(6).fill('9 618'));
 await page.getByRole('button',{name:'Réinitialiser les filtres'}).click();
 await expect(page.locator('.cw-kpi').first()).toContainText('30 000');
});
test('Crossfilter âge × plafond préserve les intersections réelles',async({page})=>{
 await page.goto('/');await credit(page);
 await page.locator('#filter-age').selectOption('18-29');
 await page.locator('#filter-limit').selectOption('<50k');
 const shown=await page.locator('.cw-kpi').first().textContent();
 expect(shown).not.toContain('30 000');expect(shown).not.toContain('9 618');
 const total=Number((await page.locator('.cw-kpi').first().locator('strong').textContent())!.replace(/\D/g,''));
 const counts=await page.locator('.cw-monthtable tbody tr').evaluateAll(rs=>rs.map(r=>Number((r.cells[1].textContent||'').replace(/\D/g,''))));
 expect(counts).toEqual(Array(6).fill(total));
 await page.getByRole('tab',{name:'Paiements'}).click();
 await expect(page.locator('#filter-age')).toHaveValue('18-29');
 await expect(page.locator('#filter-limit')).toHaveValue('<50k');
});
test('Clic graphique âge et plafond active puis désactive le filtre réel',async({page})=>{
 await page.goto('/');await credit(page);
 await page.locator('.cw-age-bar').filter({hasText:'18-29'}).click();
 await expect(page.locator('#filter-age')).toHaveValue('18-29');
 await page.locator('.cw-age-bar').filter({hasText:'18-29'}).click();
 await expect(page.locator('#filter-age')).toHaveValue('Tout');
 await page.locator('.cw-limit-row').filter({hasText:'<50k'}).click();
 await expect(page.locator('#filter-limit')).toHaveValue('<50k');
});
test('Mesures Dossiers / Défaut sur âge et plafond changent sans changer les effectifs',async({page})=>{
 await page.goto('/');await credit(page);
 const age=page.locator('.cw-age');
 await age.getByRole('button',{name:'Dossiers',exact:true}).click();
 await expect(age.locator('.cw-age-bar').filter({hasText:'18-29'})).toContainText('9 618');
 await age.getByRole('button',{name:'Défaut'}).click();
 await expect(age.locator('.cw-age-bar').filter({hasText:'18-29'})).toContainText('22,8 %');
 await page.locator('.cw-limit').getByRole('button',{name:'Dossiers',exact:true}).click();
 await expect(page.locator('.cw-limit-row').first()).toContainText('4 311');
});
test('Chronologie avril-septembre : sélection d’un mois ne modifie pas le portefeuille',async({page})=>{
 await page.goto('/');await credit(page);
 await expect(page.locator('.cw-trend-axis')).toContainText('0 %');
 await page.locator('.cw-month-picks button').filter({hasText:'04'}).click();
 await expect(page.locator('.cw-month-foot')).toContainText('2005-04 : 3 079 retards');
 await expect(page.locator('.cw-kpi').first()).toContainText('30 000');
 await expect(page.locator('.cw-monthtable tbody tr.active')).toContainText('2005-04');
});
test('Statuts septembre : quatre catégories réconciliées, sélection et drilldown code',async({page})=>{
 await page.goto('/');await credit(page);
 await expect(page.locator('.cw-status-list>button:not(.cw-drill)')).toHaveCount(4);
 await expect(page.locator('.cw-status-list')).toContainText('14 737');
 await expect(page.locator('.cw-status-list')).toContainText('6 818');
 await page.locator('.cw-status-list').getByRole('button',{name:/1–8 · retard/}).click();
 await expect(page.locator('.cw-kpi').first()).toContainText('6 818');
 await page.getByRole('button',{name:'Codes',exact:true}).click();
 await expect(page.getByRole('button',{name:'2 · 2 mois'})).toBeVisible();
 await page.getByRole('button',{name:'2 · 2 mois'}).click();
 await expect(page.locator('#filter-status')).toHaveValue('2');
 await expect(page.locator('.cw-kpi').first()).toContainText('2 667');
});
test('Sélection par statut de septembre : historique rétrospectif et observation unique',async({page})=>{
 await page.goto('/');await credit(page);
 await page.locator('#filter-status').selectOption('-1');
 await expect(page.locator('.cw-kpi').first()).toContainText('5 686');
 const obs=await page.locator('.cw-monthtable tbody tr').evaluateAll(rs=>rs.map(r=>(r.cells[1].textContent||'').replace(/\s/g,' ').trim()));
 expect(obs).toEqual(Array(6).fill('5 686'));
 await page.getByRole('tab',{name:'Risque'}).click();
 await expect(page.locator('.cw-kpi').first()).toContainText('5 686');
});
test('Table contextuelle : dimensions, tri, recherche et CSV sur sélection',async({page})=>{
 await page.goto('/');await credit(page);
 await expect(page.locator('.cw-detail tbody tr')).toHaveCount(5);
 await page.locator('.cw-detail').getByRole('button',{name:'Plafond',exact:true}).click();
 await expect(page.locator('.cw-detail tbody tr')).toHaveCount(5);
 await page.getByRole('textbox',{name:'Rechercher un groupe'}).fill('500k');
 await expect(page.locator('.cw-detail tbody tr')).toHaveCount(1);
 await page.getByRole('textbox',{name:'Rechercher un groupe'}).fill('');
 await page.locator('.cw-detail').getByRole('button',{name:'Dossiers'}).click();
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter les segments filtrés en CSV'}).click();
 expect((await dl).suggestedFilename()).toBe('bank360-portefeuille-selection.csv');
 await page.locator('.cw-detail').getByRole('button',{name:'Statut',exact:true}).click();
 await expect(page.locator('.cw-detail tbody tr')).toHaveCount(11);
});
test('Export des mois : données agrégées, six périodes',async({page})=>{
 await page.goto('/');await credit(page);const promise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Exporter le détail mensuel en CSV'}).click();
 const download=await promise;expect(download.suggestedFilename()).toBe('bank360-retards-mensuels-selection.csv');
});
test('Population vide : aucun taux artificiel et panneaux explicites',async({page})=>{
 await page.goto('/');await credit(page);
 await page.locator('#filter-age').selectOption('60+');
 await page.locator('#filter-limit').selectOption('<50k');
 await page.locator('#filter-status').selectOption('8');
 await expect(page.locator('.cw-kpi').first().locator('strong')).toHaveText('0');
 await expect(page.locator('.cw-empty').first()).toBeVisible();
 await expect(page.locator('.cw-kpi').nth(2).locator('strong')).toHaveText('—');
});
test('Navigation depuis accueil vers Risque sélectionne le mode interne',async({page})=>{
 await page.goto('/');await page.locator('.home-kpi').filter({hasText:'Taux de défaut'}).click();
 await expect(page.locator('#main-content')).toHaveAttribute('data-page','portfolio');
 await expect(page.getByRole('tab',{name:'Risque'})).toHaveAttribute('aria-selected','true');
 await page.goto('/');await page.locator('.home-credit-column').filter({hasText:'18-29'}).click();
 await expect(page.locator('#filter-age')).toHaveValue('18-29');
 await expect(page.getByRole('tab',{name:'Risque'})).toHaveAttribute('aria-selected','true');
});
test('Fraude, investigations et modèles ne régressent pas',async({page})=>{
 await page.goto('/');await section(page,'Fraude');
 await expect(page.getByText('6 362 620').first()).toBeVisible();
 await expect(page.getByText('790').first()).toBeVisible();
 await page.getByRole('tab',{name:'Alertes'}).click();
 await expect(page.getByText('1 075').first()).toBeVisible();
 await section(page,'Intelligence','Modèles');
 await expect(page.getByText('0,776').first()).toBeVisible();
 await page.getByRole('button',{name:'Variables',exact:true}).click();
 await expect(page.getByText('Retard · septembre').first()).toBeVisible();
 await page.getByRole('button',{name:'Sous-groupes'}).click();
 await expect(page.getByText('60+').first()).toBeVisible();
 await page.getByRole('button',{name:'Fraude',exact:true}).last().click();
 await expect(page.getByText('0,365').first()).toBeVisible();
});
test('Explorateur, rapports, gouvernance, recherche et thème',async({page})=>{
 await page.goto('/');await section(page,'Intelligence','Explorer');
 await expect(page.getByText('196').first()).toBeVisible();
 await page.getByRole('button',{name:'Fraude',exact:true}).last().click();
 await expect(page.getByText('100 353').first()).toBeVisible();
 await section(page,'Qualité');await expect(page.getByText('Dossiers et défauts')).toBeVisible();
 await section(page,'Rapports');await expect(page.getByText('Extraire les données')).toBeVisible();
 await page.getByRole('button',{name:'Changer le thème'}).last().click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.keyboard.press('Control+k');await page.getByPlaceholder('Rechercher une page…').fill('Portefeuille');await page.keyboard.press('Enter');
 await expect(page.locator('#main-content')).toHaveAttribute('data-page','portfolio');
});
test('Dock fixe ne provoque aucun reflow',async({page})=>{
 await page.goto('/');const nav=await page.locator('.nav-dock').boundingBox(),body=await page.locator('.work-area').boundingBox();
 await credit(page);const nav2=await page.locator('.nav-dock').boundingBox(),body2=await page.locator('.work-area').boundingBox();
 expect(Math.round(nav!.width)).toBe(Math.round(nav2!.width));expect(Math.round(body!.width)).toBe(Math.round(body2!.width));
});
test('Mobile : vue Crédit empilée, dock permanent, pas de débordement',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await credit(page);
 await expect(page.locator('.cw-panel')).toHaveCount(6);
 expect((await page.locator('.nav-dock').boundingBox())!.y).toBeGreaterThan(700);
 const width=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);expect(width).toBeLessThanOrEqual(2);
 await page.screenshot({path:'test-results/credit-mobile.png',fullPage:true});
});
test('L’aperçu HTML autonome ouvre la nouvelle page crédit',async({page})=>{
 const {resolve}=await import('node:path');const {pathToFileURL}=await import('node:url');
 await page.goto(pathToFileURL(resolve('dist/BANK-360-B5-APERCU-LOCAL.html')).href);
 await credit(page);await expect(page.locator('.cw-panel')).toHaveCount(6);
});
test('Capture de la référence crédit desktop 1672×941',async({page})=>{
 await page.setViewportSize({width:1672,height:941});await page.goto('/');await credit(page);
 await noMainScroll(page);await expect(page.locator('.cw-panel')).toHaveCount(6);
 await page.screenshot({path:'test-results/credit-integrated-1672.png',fullPage:true});
});
test('Capture de la référence crédit desktop 1440×900 sans panneau tronqué',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');await credit(page);
 await noMainScroll(page);
 const boxes=await page.locator('.cw-board>.cw-panel').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();const content=n.querySelector('.cw-panel-body')!;return{top:r.top,bottom:r.bottom,h:r.height,scroll:content.scrollHeight-content.clientHeight}}));
 expect(boxes).toHaveLength(6);expect(boxes.every(x=>x.h>=150&&x.bottom<=905)).toBe(true);
 await page.screenshot({path:'test-results/credit-integrated-1440.png',fullPage:true});
});

test('Les six mois y compris septembre sont intégralement visibles sans scroll interne à 1440 et 1672',async({page})=>{
 for(const width of [1440,1672]){
  await page.setViewportSize({width,height:width===1440?900:941});await page.goto('/');await credit(page);
  const v=await page.locator('.cw-monthtable').evaluate(el=>{
    const view=el.querySelector('.cw-table-scroll')!.getBoundingClientRect();const last=el.querySelector('tbody tr:last-child')!.getBoundingClientRect();
    return {scroll:el.querySelector('.cw-table-scroll')!.scrollTop,last:last.bottom,limit:view.bottom};
  });
  expect(v.scroll).toBe(0);
  expect(v.last).toBeLessThanOrEqual(v.limit+1);
 }
});

test('C2.1 — les 5 segments et les 6 mois tiennent sans défilement interne à 1440 et 1672',async({page})=>{
 for(const width of [1440,1672]){
  await page.setViewportSize({width,height:width===1440?900:941});await page.goto('/');await credit(page);
  await expect(page.locator('.cw-detail tbody tr')).toHaveCount(5);
  await expect(page.locator('.cw-monthtable tbody tr')).toHaveCount(6);
  for(const selector of ['.cw-detail','.cw-monthtable']){
   const geometry=await page.locator(selector).evaluate(el=>{
    const sc=el.querySelector('.cw-table-scroll') as HTMLElement;
    const last=el.querySelector('tbody tr:last-child')!.getBoundingClientRect();
    const box=sc.getBoundingClientRect();
    return {lastBottom:last.bottom,viewBottom:box.bottom,scroll:sc.scrollTop,scrollHeight:sc.scrollHeight,clientHeight:sc.clientHeight}
   });
   expect(geometry.lastBottom,selector+' last row visible '+width).toBeLessThanOrEqual(geometry.viewBottom+1);
   expect(geometry.scroll,selector+' scroll offset '+width).toBe(0);
   expect(geometry.scrollHeight-geometry.clientHeight,selector+' no scroll '+width).toBeLessThanOrEqual(2);
  }
  await noMainScroll(page);
  await page.screenshot({path:'test-results/credit-c21-'+width+'.png'});
 }
});
test('C2.1 — flèches KPI ouvrent une perspective utile sans quitter la page Crédit',async({page})=>{
 await page.goto('/');await credit(page);
 await expect(page.locator('.cw-kpi-action')).toHaveCount(4);
 await page.getByRole('button',{name:'Examiner le risque de crédit'}).click();
 await expect(page.getByRole('tab',{name:'Risque'})).toHaveAttribute('aria-selected','true');
 await page.getByRole('button',{name:'Explorer les retards de paiement'}).click();
 await expect(page.getByRole('tab',{name:'Paiements'})).toHaveAttribute('aria-selected','true');
 await page.getByRole('button',{name:'Explorer les plafonds de crédit'}).click();
 await expect(page.getByRole('tab',{name:'Vue globale'})).toHaveAttribute('aria-selected','true');
 await expect(page.locator('.cw-detail').getByRole('button',{name:'Plafond',exact:true})).toHaveClass(/active/);
 await page.getByRole('button',{name:'Voir la composition du portefeuille'}).click();
 await expect(page.locator('.cw-detail').getByRole('button',{name:'Âge',exact:true})).toHaveClass(/active/);
 await expect(page.locator('.cw-age').getByRole('button',{name:'Dossiers',exact:true})).toHaveAttribute('aria-pressed','true');
 await noMainScroll(page);
});
test('C2.1 — KPI et tableau restent lisibles sur téléphone et thème clair',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await credit(page);
 const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,buttons:[...document.querySelectorAll('.cw-kpi-action')].every(el=>getComputedStyle(el).display!=='none')}));
 expect(metrics.overflow).toBeLessThanOrEqual(2);expect(metrics.buttons).toBe(true);
 await page.getByRole('button',{name:'Rapports',exact:true}).click();
 await page.getByRole('button',{name:'Changer le thème'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await credit(page);
 await expect(page.locator('.cw-kpi-action').first()).toBeVisible();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 expect(overflow).toBeLessThanOrEqual(2);
});

test('C2.2 — tables fully visible on short and intermediate desktop viewports',async({page})=>{
 // These CSS viewports also represent reduced usable space when browser zoom increases.
 const sizes:[[number,number],...[number,number][]]=[[1280,720],[1366,768],[1440,800],[1440,900],[1512,820],[1672,860],[1672,941]];
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});await page.goto('/');await credit(page);
  await noMainScroll(page);
  for(const [selector,expected] of [['.cw-detail',5],['.cw-monthtable',6]] as const){
   const geometry=await page.locator(selector).evaluate(el=>{
    const sc=el.querySelector('.cw-table-scroll') as HTMLElement;
    const rows=[...el.querySelectorAll('tbody tr')];
    const viewport=sc.getBoundingClientRect(),first=rows[0]?.getBoundingClientRect(),last=rows.at(-1)?.getBoundingClientRect();
    const footer=el.querySelector('.cw-month-foot')?.getBoundingClientRect();
    return {count:rows.length,firstTop:first?.top,lastBottom:last?.bottom,viewTop:viewport.top,viewBottom:viewport.bottom,
      scroll:sc.scrollTop,overflow:sc.scrollHeight-sc.clientHeight,footerTop:footer?.top,panelBottom:el.getBoundingClientRect().bottom};
   });
   expect(geometry.count,`${selector} row count ${width}x${height}`).toBe(expected);
   expect(geometry.firstTop,`${selector} first row ${width}x${height}`).toBeGreaterThanOrEqual(geometry.viewTop-1);
   expect(geometry.lastBottom,`${selector} last row ${width}x${height}`).toBeLessThanOrEqual(geometry.viewBottom+1);
   expect(geometry.scroll,`${selector} scroll position ${width}x${height}`).toBe(0);
   expect(geometry.overflow,`${selector} no internal scrolling ${width}x${height}`).toBeLessThanOrEqual(2);
   if(selector==='.cw-monthtable'){
    expect(geometry.footerTop,`monthly summary remains visible ${width}x${height}`).toBeGreaterThanOrEqual(geometry.viewBottom-1);
    expect(geometry.panelBottom,`monthly summary fits panel ${width}x${height}`).toBeGreaterThanOrEqual(geometry.footerTop!+16);
   }
  }
  if((width===1280&&height===720)||(width===1440&&height===800)||(width===1672&&height===941))
   await page.screenshot({path:`test-results/credit-c22-${width}x${height}.png`,fullPage:true});
 }
});

test('C2.2 — three perspectives retain fitted tables and long status list still scrolls',async({page})=>{
 await page.setViewportSize({width:1440,height:800});await page.goto('/');await credit(page);
 for(const tab of ['Vue globale','Risque','Paiements']){
  await page.getByRole('tab',{name:tab}).click();
  for(const selector of ['.cw-detail','.cw-monthtable']){
   const dims=await page.locator(selector).evaluate(el=>{
    const sc=el.querySelector('.cw-table-scroll') as HTMLElement;
    return {last:el.querySelector('tbody tr:last-child')!.getBoundingClientRect().bottom,limit:sc.getBoundingClientRect().bottom,overflow:sc.scrollHeight-sc.clientHeight};
   });
   expect(dims.last,`${tab}, ${selector}`).toBeLessThanOrEqual(dims.limit+1);
   expect(dims.overflow,`${tab}, ${selector}`).toBeLessThanOrEqual(2);
  }
  await noMainScroll(page);
 }
 await page.locator('.cw-detail').getByRole('button',{name:'Statut',exact:true}).click();
 await expect(page.locator('.cw-detail tbody tr')).toHaveCount(11);
 const sc=page.locator('.cw-detail .cw-table-scroll');
 const before=await sc.evaluate(e=>({client:e.clientHeight,scroll:e.scrollHeight}));
 expect(before.scroll).toBeGreaterThan(before.client);
 await sc.evaluate(e=>e.scrollTop=e.scrollHeight);
 const end=await sc.evaluate(e=>({last:e.querySelector('tbody tr:last-child')!.getBoundingClientRect().bottom,limit:e.getBoundingClientRect().bottom}));
 expect(end.last).toBeLessThanOrEqual(end.limit+1);
});

test('C3 — Fraud has one route, six panels, four true KPI and three perspectives',async({page})=>{
 await page.setViewportSize({width:1672,height:941});await page.goto('/');
 await section(page,'Fraude');
 await expect(page.locator('.fw-panel')).toHaveCount(6);
 await expect(page.locator('.fw-kpi')).toHaveCount(4);
 const kpis=await page.locator('.fw-kpi strong').allTextContents();
 expect(kpis.map(x=>x.replace(/\s/g,''))).toEqual(['6362620','790','413','1075']);
 for(const tab of ['Vue globale','Détection','Alertes']){
  await page.getByRole('tab',{name:tab}).click();
  await expect(page.getByRole('tab',{name:tab})).toHaveAttribute('aria-selected','true');
  await expect(page.locator('.fw-panel')).toHaveCount(6);
 }
 await noMainScroll(page);
 await page.screenshot({path:'test-results/fraud-c3-1672x941.png',fullPage:true});
});
test('C3 — source-derived channels and days reconcile; no individual transactions',async({page})=>{
 await page.goto('/');await section(page,'Fraude');
 await expect(page.locator('.fw-day')).toHaveCount(6);
 await expect(page.locator('.fw-channel-row')).toHaveCount(2);
 await expect(page.locator('.fw-invest-row')).toHaveCount(2);
 const days=await page.locator('.fw-trend-labels button b').allTextContents();
 expect(days.map(v=>Number(v.replace(/\D/g,'')))).toEqual([76,93,147,299,102,73]);
 await expect(page.locator('.fw-ring')).toHaveAttribute('aria-label',/413 vraies alertes et 377 fausses/);
 await expect(page.locator('.fw-quality-legend')).toContainText('1 075');
 const src=await page.locator('.fraud-workspace').innerText();
 for(const fake of ['TXN_','CUST_','Score modèle','Montant moyen','2025-09-30'])expect(src).not.toContain(fake);
});
test('C3 — channel, day, and alert status are never silently joined',async({page})=>{
 await page.goto('/');await section(page,'Fraude');
 await page.getByLabel('Canal',{exact:true}).selectOption('TRANSFER');
 await expect(page.getByLabel('Canal',{exact:true})).toHaveValue('TRANSFER');
 await expect(page.locator('.fw-ring')).toHaveAttribute('aria-label',/125 vraies alertes et 361 fausses/);
 await expect(page.locator('.fw-channel-summary')).toContainText('Sélectionne un canal');
 await page.getByLabel('Jour simulé',{exact:true}).selectOption('28');
 await expect(page.getByLabel('Canal',{exact:true})).toHaveValue('Tous');
 await expect(page.locator('.fw-ring')).toHaveAttribute('aria-label',/85 vraies alertes et 214 fausses/);
 await page.getByLabel('Statut alerte').selectOption('tp');
 await expect(page.locator('.fw-channel-row').filter({hasText:'TRANSFER'})).toContainText('125');
 await expect(page.locator('.fw-channel-summary')).toContainText('pas de jointure jour × canal');
 await page.getByRole('button',{name:'Réinitialiser'}).click();
 await expect(page.getByLabel('Statut alerte')).toHaveValue('all');
 await expect(page.locator('.fw-ring')).toHaveAttribute('aria-label',/413 vraies alertes et 377 fausses/);
});
test('C3 — aggregation exploration, search, keyboard, and exports',async({page})=>{
 await page.goto('/');await section(page,'Fraude');
 await page.getByRole('button',{name:'Canaux',exact:true}).click();
 await expect(page.locator('.fw-detail-table tbody tr')).toHaveCount(2);
 await page.getByLabel('Rechercher un agrégat').fill('CASH_OUT');
 await expect(page.locator('.fw-detail-table tbody tr')).toHaveCount(1);
 await page.locator('.fw-detail-table tbody tr').first().focus();
 await page.keyboard.press('Enter');
 await expect(page.getByLabel('Canal',{exact:true})).toHaveValue('CASH_OUT');
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Exporter les canaux en CSV'}).click();
 const file=await download;
 expect(file.suggestedFilename()).toContain('canaux');
 await expect(page.locator('.fw-quality')).toContainText('288');
});
test('C3 — compact desktop geometries and mobile theme parity',async({page})=>{
 for(const [width,height] of [[1672,941],[1440,900],[1366,768]] as const){
  await page.setViewportSize({width,height});await page.goto('/');await section(page,'Fraude');
  const result=await page.evaluate(()=>{
   const main=document.querySelector('#main-content') as HTMLElement;
   const panels=[...document.querySelectorAll('.fw-panel')].map(el=>{const rect=el.getBoundingClientRect();return{bottom:rect.bottom,height:rect.height,client:(el.querySelector('.fw-panel-body') as HTMLElement).clientHeight,scroll:(el.querySelector('.fw-panel-body') as HTMLElement).scrollHeight}});
   return{mainScroll:main.scrollHeight-main.clientHeight,overflow:document.documentElement.scrollWidth-innerWidth,panels,viewBottom:main.getBoundingClientRect().bottom}
  });
  expect(result.mainScroll,width+'x'+height+' no global scroll').toBeLessThanOrEqual(3);
  expect(result.overflow,width+'x'+height+' no horizontal overflow').toBeLessThanOrEqual(2);
  expect(result.panels).toHaveLength(6);
  for(const p of result.panels){
   expect(p.height,width+'x'+height+' panel visible').toBeGreaterThanOrEqual(165);
   expect(p.bottom,width+'x'+height+' panel within main').toBeLessThanOrEqual(result.viewBottom+1);
  }
  await page.screenshot({path:'test-results/fraud-c3-'+width+'x'+height+'.png',fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});await page.goto('/');await section(page,'Fraude');
 await expect(page.locator('.fw-panel')).toHaveCount(6);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
 await page.getByRole('button',{name:'Basculer le thème'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.screenshot({path:'test-results/fraud-c3-mobile.png',fullPage:true});
});

test('C3 — six daily aggregate rows and all channel rows fit without an internal scrollbar',async({page})=>{
 for(const [width,height] of [[1672,941],[1440,900],[1366,768]] as const){
  await page.setViewportSize({width,height});await page.goto('/');await section(page,'Fraude');
  const dims=await page.locator('.fw-detail-table').evaluate(el=>{
   const box=el.getBoundingClientRect(),first=el.querySelector('tbody tr:first-child')!.getBoundingClientRect(),last=el.querySelector('tbody tr:last-child')!.getBoundingClientRect();
   return {scroll:el.scrollHeight-el.clientHeight,firstTop:first.top,lastBottom:last.bottom,top:box.top,bottom:box.bottom};
  });
  expect(dims.scroll,'no unnecessary 6-row scroll at '+width+'×'+height).toBeLessThanOrEqual(2);
  expect(dims.firstTop).toBeGreaterThanOrEqual(dims.top-1);
  expect(dims.lastBottom).toBeLessThanOrEqual(dims.bottom+1);
  await page.getByRole('button',{name:'Canaux',exact:true}).click();
  await expect(page.locator('.fw-detail-table tbody tr')).toHaveCount(2);
  await noMainScroll(page);
 }
});
