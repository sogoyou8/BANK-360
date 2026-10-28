import {test,expect} from '@playwright/test';
test('B5 : page d’accueil, 11 pages, deux origines explicitement séparées',async({page})=>{
 await page.goto('/');
 await expect(page.getByText('Une vision plus claire.')).toBeVisible();
 await expect(page.getByText('dossiers UCI historiques')).toBeVisible();
 await expect(page.getByText('transactions PaySim simulées')).toBeVisible();
 const paths=['Accueil','Portefeuille','Segments','Risque','Paiements','Fraude','Investigations','Modèles','Explorer','Qualité','Rapports'];
 for (const p of paths) await expect(page.locator('nav .nav-link[title]').filter({hasText:p}).or(page.locator(`nav .nav-link[title="${p}"]`)).first()).toBeAttached();
 await page.screenshot({path:'test-results/b5-desktop.png',fullPage:true});
});
test('B5 : filtrage âge réel et reset, regroupement de paiements',async({page})=>{
 await page.goto('/');
 await page.locator('nav .nav-link[title="Portefeuille bancaire"]').click();
 await expect(page.getByText('30 000',{exact:true}).first()).toBeVisible();
 await page.locator('#filter-age').selectOption('18-29');
 await expect(page.locator('.kpi-grid .kpi-copy strong').first()).toContainText('9 618');
 await expect(page.locator('.kpi-grid .kpi-copy strong').nth(1)).toContainText('2 197');
 await page.getByRole('button',{name:'Effacer'}).click();
 await expect(page.locator('.kpi-grid .kpi-copy strong').first()).toContainText('30 000');
 await page.locator('nav .nav-link[title="Historique des paiements"]').click();
 await expect(page.getByText('180 000').first()).toBeVisible();
});
test('B5 : fraude, investigations et modèles avec métriques sourcées',async({page})=>{
 await page.goto('/');
 await page.locator('nav .nav-link[title="Fraud Analytics"]').click();
 await expect(page.getByText('6 362 620').first()).toBeVisible();
 await expect(page.getByText('8 213').first()).toBeVisible();
 await page.locator('nav .nav-link[title="Alertes & Investigations"]').click();
 await expect(page.getByText('1 075').first()).toBeVisible();
 await page.getByRole('button',{name:/CASH_OUT/}).click();
 await expect(page.getByText('CASH_OUT').first()).toBeVisible();
 await page.locator('nav .nav-link[title="Modèles IA & Performance"]').click();
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
 await page.getByRole('button',{name:'Ouvrir le menu'}).click();
 await page.locator('nav .nav-link[title="Rapports & Paramètres"]').click();
 await expect(page.getByRole('heading',{name:'Rapports & Paramètres'})).toBeVisible();
 await page.screenshot({path:'test-results/b5-mobile.png',fullPage:true});
});
