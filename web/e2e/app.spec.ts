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
 await expect(page.getByText('Jour simulé')).toBeVisible();
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
 await page.getByPlaceholder('Chercher une page ou une analyse…').fill('Risque');
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
