import {test,expect} from '@playwright/test';
test('B5 : page d’accueil, 11 pages, deux origines explicitement séparées',async({page})=>{
 await page.goto('/');
 await expect(page.getByText('Une vision plus claire.')).toBeVisible();
 await expect(page.getByText('dossiers UCI historiques')).toBeVisible();
 await expect(page.getByText('transactions PaySim simulées')).toBeVisible();
 const paths=['Command Center','Crédit & Portefeuille','Fraude & Investigations','Intelligence & Modèles','Qualité des données','Rapports'];
 for (const p of paths) await expect(page.locator(`nav .nav-primary[title="${p}"]`)).toBeAttached();
 await page.screenshot({path:'test-results/b5-desktop.png',fullPage:true});
});
test('B5 : filtrage âge réel et reset, regroupement de paiements',async({page})=>{
 await page.goto('/');
 await page.locator('nav .nav-primary[title="Crédit & Portefeuille"]').click();
 await page.locator('nav .nav-sub-link[title="Portefeuille bancaire"]').click();
 await expect(page.getByText('30 000',{exact:true}).first()).toBeVisible();
 await page.locator('#filter-age').selectOption('18-29');
 await expect(page.locator('.kpi-grid .kpi-copy strong').first()).toContainText('9 618');
 await expect(page.locator('.kpi-grid .kpi-copy strong').nth(1)).toContainText('2 197');
 await page.getByRole('button',{name:'Réinitialiser les filtres'}).click();
 await expect(page.locator('.kpi-grid .kpi-copy strong').first()).toContainText('30 000');
 await page.getByRole('button',{name:'Paiements'}).last().click();
 await expect(page.getByText('180 000').first()).toBeVisible();
});
test('B5 : fraude, investigations et modèles avec métriques sourcées',async({page})=>{
 await page.goto('/');
 await page.locator('nav .nav-primary[title="Fraude & Investigations"]').click();
 await page.locator('nav .nav-sub-link[title="Fraud Analytics"]').click();
 await expect(page.getByText('6 362 620').first()).toBeVisible();
 await expect(page.getByText('8 213').first()).toBeVisible();
 await page.getByRole('button',{name:'Investigations'}).last().click();
 await expect(page.getByText('1 075').first()).toBeVisible();
 await page.getByRole('button',{name:/CASH_OUT/}).click();
 await expect(page.getByText('CASH_OUT').first()).toBeVisible();
 await page.locator('nav .nav-primary[title="Intelligence & Modèles"]').click();
 await page.locator('nav .nav-sub-link[title="Modèles IA & Performance"]').click();
 await expect(page.getByText('0,776')).toBeVisible();
 await expect(page.getByText('0,365')).toBeVisible();
});
test('B5 : navigation clavier et viewport mobile',async({page})=>{
 await page.goto('/');
 await page.keyboard.press('Control+k');
 await expect(page.getByRole('dialog',{name:'Navigation rapide'})).toBeVisible();
 await page.getByPlaceholder('Chercher une page ou une analyse…').fill('Data Quality');
 await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Data Quality & Traçabilité'})).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 await page.locator('nav .nav-primary[title="Rapports"]').click();
 await expect(page.getByRole('heading',{name:'Rapports & Paramètres'})).toBeVisible();
 await page.screenshot({path:'test-results/b5-mobile.png',fullPage:true});
});

test('B5 : aperçu HTML autonome utilisable hors ligne',async({page})=>{
 const {resolve}=await import('node:path');
 const {pathToFileURL}=await import('node:url');
 const localFile=resolve(process.cwd(),'dist/BANK-360-B5-APERCU-LOCAL.html');
 await page.goto(pathToFileURL(localFile).href);
 await expect(page.getByText('Une vision plus claire.')).toBeVisible();
 await page.locator('nav .nav-primary[title="Crédit & Portefeuille"]').click();
 await page.locator('nav .nav-sub-link[title="Portefeuille bancaire"]').click();
 await expect(page.locator('.kpi-grid .kpi-copy strong').first()).toContainText('30 000');
});


test('B5 R5.1 : dock desktop fixe, sous-pages en superposition, aucun redimensionnement',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/');
 const nav=page.locator('.nav-rail');
 const main=page.locator('.main-wrap');
 const beforeNav=await nav.boundingBox(),beforeMain=await main.boundingBox();
 expect(beforeNav).toBeTruthy();expect(beforeMain).toBeTruthy();
 expect(Math.round(beforeNav!.width)).toBe(92);
 await expect(page.getByRole('button',{name:'Développer la navigation'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Réduire la navigation'})).toHaveCount(0);
 await page.locator('nav .nav-primary[title="Crédit & Portefeuille"]').click();
 await expect(page.locator('nav .nav-flyout.is-open')).toBeVisible();
 const afterNav=await nav.boundingBox(),afterMain=await main.boundingBox();
 expect(Math.round(afterNav!.width)).toBe(Math.round(beforeNav!.width));
 expect(Math.round(afterMain!.x)).toBe(Math.round(beforeMain!.x));
 expect(Math.round(afterMain!.width)).toBe(Math.round(beforeMain!.width));
 expect(await page.locator('nav .nav-flyout.is-open').evaluate(e=>getComputedStyle(e).position)).toBe('absolute');
 await page.getByRole('button',{name:'Fermer les sous-pages'}).click({position:{x:1100,y:500}});
 await expect(page.locator('nav .nav-flyout.is-open')).toHaveCount(0);
 await page.screenshot({path:'test-results/b5-r51-dock-desktop.png',fullPage:true});
});

test('B5 R5.1 : dock mobile permanent, sous-menu flottant sans variation du contenu',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const nav=page.locator('.nav-rail'),main=page.locator('.main-wrap');
 const navBox=await nav.boundingBox(),mainBox=await main.boundingBox();
 expect(navBox!.y).toBeGreaterThan(700);
 await expect(page.getByRole('button',{name:'Ouvrir le menu'})).toHaveCount(0);
 await page.locator('nav .nav-primary[title="Crédit & Portefeuille"]').click();
 const flyout=page.locator('nav .nav-flyout.is-open');
 await expect(flyout).toBeVisible();
 const flyBox=await flyout.boundingBox();
 expect(flyBox!.y+flyBox!.height).toBeLessThan(navBox!.y+5);
 const mainAfter=await main.boundingBox(),navAfter=await nav.boundingBox();
 expect(Math.round(mainAfter!.width)).toBe(Math.round(mainBox!.width));
 expect(Math.round(navAfter!.width)).toBe(Math.round(navBox!.width));
 await page.locator('nav .nav-sub-link[title="Portefeuille bancaire"]').click();
 await expect(page.getByText('30 000',{exact:true}).first()).toBeVisible();
 await page.screenshot({path:'test-results/b5-r51-dock-mobile.png',fullPage:true});
});
