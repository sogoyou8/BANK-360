import {test,expect,type Page} from '@playwright/test';
const noMainScroll=async(page:Page)=>{const v=await page.locator('#main-content').evaluate(e=>e.scrollHeight-e.clientHeight);expect(v).toBeLessThanOrEqual(3)};
const credit=async(page:Page)=>{await page.getByRole('button',{name:'Crédit',exact:true}).click();await expect(page.locator('#main-content')).toHaveAttribute('data-page','portfolio')};
const section=async(page:Page,name:string,target?:string)=>{await page.getByRole('button',{name,exact:true}).click();if(target)await page.getByRole('menuitem',{name:new RegExp(target)}).click()};

test('Architecture : huit pages, six sections, une seule vue Crédit et données séparées',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'Vue d’ensemble'})).toBeVisible();
 await expect(page.locator('.dock-link')).toHaveCount(6);
 await credit(page);await expect(page.getByRole('heading',{name:'Portefeuille & segmentation'})).toBeVisible();
 await expect(page.getByRole('tab',{name:'Vue globale'})).toBeVisible();
 await expect(page.getByRole('tab',{name:'Risque'})).toBeVisible();
 await expect(page.getByRole('tab',{name:'Paiements'})).toBeVisible();
 await expect(page.getByText('30 000').first()).toBeVisible();
 await noMainScroll(page);
});
test('Mono-écran à 1440×900 : huit routes et crédit trois modes',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');await noMainScroll(page);
 await credit(page);for(const tab of ['Vue globale','Risque','Paiements']){await page.getByRole('tab',{name:tab}).click();await noMainScroll(page)}
 for(const [group,name] of [['Fraude','Fraude'],['Fraude','Alertes'],['Intelligence','Modèles'],['Intelligence','Explorer']]){await section(page,group,name);await noMainScroll(page)}
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
 await page.goto('/');await section(page,'Fraude','Fraude');
 await expect(page.getByText('6 362 620').first()).toBeVisible();
 await expect(page.getByText('8 213').first()).toBeVisible();
 await section(page,'Fraude','Alertes');
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
