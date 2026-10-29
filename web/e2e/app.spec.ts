import {test,expect} from '@playwright/test';
const openSection=async(page:import('@playwright/test').Page,section:string,pageName:string)=>{await page.getByRole('button',{name:section,exact:true}).click();await page.getByRole('menuitem',{name:new RegExp(pageName)}).click()};
const noMainScroll=async(page:import('@playwright/test').Page)=>{const size=await page.locator('#main-content').evaluate(el=>({scroll:el.scrollHeight,client:el.clientHeight}));expect(size.scroll-size.client).toBeLessThanOrEqual(3)};
test('Architecture : dix pages, six sections et données séparées',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'Vue d’ensemble'})).toBeVisible();
 await expect(page.locator('.dock-link')).toHaveCount(6);
 await expect(page.getByText('30 000').first()).toBeVisible();
 await expect(page.getByText('413 fraudes détectées')).toBeVisible();
 await noMainScroll(page);
 await page.screenshot({path:'test-results/r-overview-1440.png',fullPage:true});
});
test('Mono-écran : dix pages sans scroll global à 1440 × 900',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');
 const routes:[string,string,string][]=[['Crédit','Portefeuille','portfolio'],['Crédit','Risque','risk'],['Crédit','Paiements','payments'],['Fraude','Fraude','fraud'],['Fraude','Alertes','alerts'],['Intelligence','Modèles','models'],['Intelligence','Explorer','explorer']];
 for(const [group,sub,id] of routes){await openSection(page,group,sub);await expect(page.locator('#main-content')).toHaveAttribute('data-page',id);await noMainScroll(page)}
 await page.getByRole('button',{name:'Qualité',exact:true}).click();await noMainScroll(page);
 await page.getByRole('button',{name:'Rapports',exact:true}).click();await noMainScroll(page);
});
test('Portefeuille fusionné : âge, seuils, chiffres pondérés et reset',async({page})=>{
 await page.goto('/');await openSection(page,'Crédit','Portefeuille');
 await expect(page.getByText('6 636').first()).toBeVisible();
 await page.locator('#filter-age').selectOption('18-29');
 await expect(page.getByText('9 618').first()).toBeVisible();
 await expect(page.getByText('2 197').first()).toBeVisible();
 await page.getByRole('button',{name:'Réinitialiser les filtres'}).click();
 await expect(page.getByText('30 000').first()).toBeVisible();
 await page.screenshot({path:'test-results/r-portfolio.png'});
});
test('Paiements : population et observations distinctes',async({page})=>{
 await page.goto('/');await openSection(page,'Crédit','Paiements');
 await expect(page.getByText('180 000').first()).toBeVisible();
 await expect(page.getByText('30 000').first()).toBeVisible();
});
test('Fraude : jeu complet distinct du test et de ses alertes',async({page})=>{
 await page.goto('/');await openSection(page,'Fraude','Fraude');
 await expect(page.getByText('6 362 620').first()).toBeVisible();
 await expect(page.getByText('8 213').first()).toBeVisible();
 await expect(page.getByText('790').first()).toBeVisible();
 await openSection(page,'Fraude','Alertes');
 await expect(page.getByText('1 075').first()).toBeVisible();
 await page.getByRole('button',{name:/CASH_OUT/}).click();
 await expect(page.getByText('304').first()).toBeVisible();
});
test('Modèles : performances, importance des variables, calibration et audit',async({page})=>{
 await page.goto('/');await openSection(page,'Intelligence','Modèles');
 await expect(page.getByText('0,776').first()).toBeVisible();
 await page.getByRole('button',{name:'Variables',exact:true}).click();
 await expect(page.getByText('Retard · septembre').first()).toBeVisible();
 await page.getByRole('button',{name:'Sous-groupes'}).click();
 await expect(page.getByText('60+').first()).toBeVisible();
 await page.getByRole('button',{name:'Fraude',exact:true}).last().click();
 await expect(page.getByText('0,365').first()).toBeVisible();
 await page.getByRole('button',{name:'Dérive',exact:true}).click();
 await expect(page.getByText('Score moyen · test')).toBeVisible();
});
test('Explorateur : univers de données et export',async({page})=>{
 await page.goto('/');await openSection(page,'Intelligence','Explorer');
 await expect(page.getByText('196').first()).toBeVisible();
 await page.getByRole('button',{name:'Fraude',exact:true}).last().click();
 await expect(page.getByText('100 353').first()).toBeVisible();
 await page.getByRole('button',{name:'Jours simulés'}).click();
 await expect(page.getByRole('columnheader',{name:'Jour simulé'})).toBeVisible();
});
test('Gouvernance, rapports, confidentialité et navigation rapide',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Qualité',exact:true}).click();
 await expect(page.getByText('Dossiers et défauts')).toBeVisible();
 await expect(page.getByText('Transactions simulées').first()).toBeVisible();
 await page.getByRole('button',{name:'Rapports',exact:true}).click();
 await expect(page.getByText('Extraire les données')).toBeVisible();
 await page.getByRole('button',{name:'Changer le thème'}).last().click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.keyboard.press('Control+k');
 await expect(page.getByRole('dialog',{name:'Navigation rapide'})).toBeVisible();
 await page.getByPlaceholder('Rechercher une page…').fill('Risque');
 await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Risque de crédit'})).toBeVisible();
});
test('Navigation fixe ne déplace pas le contenu',async({page})=>{
 await page.goto('/');const dock=await page.locator('.nav-dock').boundingBox(),content=await page.locator('.work-area').boundingBox();
 await page.getByRole('button',{name:'Crédit',exact:true}).click();
 await expect(page.getByRole('menu',{name:'Crédit'})).toBeVisible();
 const dock2=await page.locator('.nav-dock').boundingBox(),content2=await page.locator('.work-area').boundingBox();
 expect(Math.round(dock2!.width)).toBe(Math.round(dock!.width));expect(Math.round(content2!.width)).toBe(Math.round(content!.width));
 await page.keyboard.press('Escape');await expect(page.getByRole('menu',{name:'Crédit'})).toHaveCount(0);
});
test('Mobile : navigation sans reflow et sans débordement horizontal',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const nav=await page.locator('.nav-dock').boundingBox();expect(nav!.y).toBeGreaterThan(700);
 await openSection(page,'Crédit','Portefeuille');
 await expect(page.locator('#main-content')).toHaveAttribute('data-page','portfolio');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);expect(overflow).toBeLessThanOrEqual(2);
 await page.screenshot({path:'test-results/r-mobile.png',fullPage:true});
});
test('Prévisualisation HTML autonome',async({page})=>{
 const {resolve}=await import('node:path');const {pathToFileURL}=await import('node:url');
 await page.goto(pathToFileURL(resolve('dist/BANK-360-B5-APERCU-LOCAL.html')).href);
 await expect(page.getByRole('heading',{name:'Vue d’ensemble'})).toBeVisible();
 await openSection(page,'Crédit','Portefeuille');await expect(page.getByText('30 000').first()).toBeVisible();
});

test('R2 : quatre mises en page métier distinctes sans scroll global',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');
 const designs:[string,string,string][]=[['Crédit','Portefeuille','portfolio'],['Crédit','Risque','risk'],['Fraude','Fraude','fraud'],['Rapports','','reports']];
 for(const [group,item,id] of designs){if(item)await openSection(page,group,item);else await page.getByRole('button',{name:group,exact:true}).click();
 await expect(page.locator('#main-content')).toHaveAttribute('data-page',id);
 const rect=await page.locator('.screen-grid').evaluate(el=>{const s=getComputedStyle(el);return{cols:s.gridTemplateColumns,rows:s.gridTemplateRows}});
 expect(rect.cols.split(' ').length).toBe(2);
 await noMainScroll(page);
 await page.screenshot({path:'test-results/r2-'+id+'.png'});
 }
});
test('R2 : graphiques avec zéro visible et courbe de retards à base zéro',async({page})=>{
 await page.goto('/');await expect(page.locator('.home-chart-axis')).toBeVisible();
 await expect(page.locator('.home-chart-axis').getByText('0 %')).toBeVisible();
 await openSection(page,'Crédit','Paiements');
 await expect(page.locator('.trend-scale')).toBeVisible();
 await expect(page.locator('.trend-scale').getByText('0,0 %')).toBeVisible();
 const top=await page.locator('.trend-scale').locator('span').first().textContent();expect(top).not.toBe('0,0 %');
});
test('R2 : calibration compare prédit et observé, contexte validation versus test',async({page})=>{
 await page.goto('/');await openSection(page,'Intelligence','Modèles');
 await expect(page.getByText('ROC-AUC · test')).toBeVisible();
 await page.getByRole('button',{name:'Calibration'}).click();
 await expect(page.getByText('Score moyen').first()).toBeVisible();
 await expect(page.getByText('Défaut observé').first()).toBeVisible();
 await expect(page.locator('.calibration-row')).toHaveCount(8);
 await page.getByRole('button',{name:'Modèles',exact:true}).last().click();
 await expect(page.getByText('Comparaison PR-AUC · validation')).toBeVisible();
});
test('R2 : thème clair lisible et recherche strictement dédiée aux pages',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Basculer le thème'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 const color=await page.locator('.home-kpi-text small').first().evaluate(e=>getComputedStyle(e).color);
 expect(color).toBe('rgb(69, 96, 134)');
 await page.screenshot({path:'test-results/r2-light.png'});
 await page.getByRole('button',{name:/Accéder à une page/}).click();
 await expect(page.getByRole('dialog',{name:'Navigation rapide'})).toBeVisible();
 await expect(page.getByText(/Navigation uniquement/)).toBeVisible();
 await page.getByPlaceholder('Rechercher une page…').fill('Risque');
 await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Risque de crédit'})).toBeVisible();
});

test('R3 — Rapports et Qualité : cartes compactes à la hauteur de leur contenu',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/');
 for(const tab of ['Qualité','Rapports']){
   await page.getByRole('button',{name:tab,exact:true}).click();
   const cards=await page.locator('.screen-grid>.surface').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return{height:b.height,width:b.width,top:b.top}}));
   expect(cards).toHaveLength(3);
   expect(cards.every(x=>x.height>80&&x.height<430),tab+' : panneaux réellement compacts').toBe(true);
   await noMainScroll(page);
   await page.screenshot({path:'test-results/r3-'+tab.toLowerCase()+'.png'});
 }
});
test('R3 — Risk : statuts UCI explicites et effectifs représentés sans modifier les codes de filtre',async({page})=>{
 await page.goto('/');
 await openSection(page,'Crédit','Risque');
 const card=page.locator('.risk-grid>.surface').last();
 await expect(card.getByText(/codes non précisés/)).toBeVisible();
 await expect(card.getByText('−1 · à jour')).toBeVisible();
 await expect(card.getByText('2 · 2 mois')).toBeVisible();
 await expect(card.getByText('−2 · non précisé')).toBeVisible();
 const group=card.locator('.chart-row').filter({hasText:'2 · 2 mois'});
 await expect(group.locator('.row-count')).toContainText('n=');
 await page.locator('#filter-status').selectOption('2');
 await expect(page.locator('#filter-status')).toHaveValue('2');
 await expect(page.locator('#filter-status option:checked')).toContainText('2 · 2 mois');
 await expect(page.locator('.risk-grid .bar-count').first()).toContainText('n=');
});
test('R3 — Taille des groupes visible dans les répartitions de défaut',async({page})=>{
 await page.goto('/');
 const age=page.locator('.home-credit-column').first();
 await expect(age.locator('.home-credit-count')).toContainText('n=');
 await openSection(page,'Crédit','Portefeuille');
 await expect(page.locator('.portfolio-grid .row-count').first()).toContainText('n=');
 await expect(page.locator('.portfolio-grid .chart-row').first()).toHaveAttribute('title',/dossiers/);
});
test('R3 — Modèles : comparaison de validation compacte sans masquer les sous-vues',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');
 await openSection(page,'Intelligence','Modèles');
 let diag=page.locator('.models-grid>.surface').last();
 let h=await diag.evaluate(e=>e.getBoundingClientRect().height);expect(h).toBeLessThan(390);
 await expect(page.getByText('Comparaison PR-AUC · validation')).toBeVisible();
 await page.getByRole('button',{name:'Variables',exact:true}).click();
 await expect(page.getByText('Retard · septembre').first()).toBeVisible();
 await page.getByRole('button',{name:'Calibration'}).click();
 await expect(page.locator('.calibration-row')).toHaveCount(8);
 await page.getByRole('button',{name:'Sous-groupes'}).click();
 await expect(page.getByText('60+').first()).toBeVisible();
 await noMainScroll(page);
 await page.screenshot({path:'test-results/r3-models.png'});
});
