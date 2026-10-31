import {test,expect} from '@playwright/test';

test('R1 — guided overview is default, names both independent studies and preserves B5',async({page})=>{
 await page.goto('/');
 await expect(page.getByTestId('guided-overview')).toBeVisible();
 await expect(page.getByRole('heading',{name:'Deux études. Des données jusqu’aux preuves.'})).toBeVisible();
 await expect(page.getByTestId('guided-overview')).toContainText('ne sont jamais jointes');
 await expect(page.locator('.grl-nav button')).toHaveCount(5);
 await expect(page.getByRole('link',{name:'Version classique B5'})).toHaveAttribute('href','?classic=1');
 await page.getByRole('link',{name:'Version classique B5'}).click();
 await expect(page.getByRole('heading',{name:'Vue d’ensemble'})).toBeVisible();
 await expect(page.locator('.nav-dock .dock-link')).toHaveCount(6);
 await page.goto('/?x1=1');
 await expect(page.getByTestId('x1-analysis')).toBeVisible();
});

test('R2 — credit matrix drives one coherent UCI cohort, six monthly observations and exports',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Explorer le crédit/}).click();
 await expect(page.getByTestId('guided-credit')).toBeVisible();
 await expect(page.locator('.grl-metrics')).toContainText('30 000');
 const rows=page.locator('.grl-heat-row button');
 await expect(rows).toHaveCount(25);
 await page.getByLabel('Statut Crédit').selectOption('Tout');
 await page.locator('.grl-heat-row button[title^="40-49 · 50k-99k"]').click();
 await expect(page.getByLabel('Âge Crédit')).toHaveValue('40-49');
 await expect(page.getByLabel('Plafond Crédit')).toHaveValue('50k-99k');
 await expect(page.locator('.grl-metrics')).toContainText('+5,0 pt');
 await expect(page.locator('.grl-month')).toHaveCount(6);
 await page.getByText('Consulter les groupes agrégés').click();
 const rowCounts=await page.locator('.grl-table-scroll tbody tr').count();
 expect(rowCounts).toBeGreaterThan(0);
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:/Exporter.*lignes/}).first().click();
 const file=await download; expect(file.suggestedFilename()).toMatch(/credit-cohortes-uci\.csv$/);
 await page.reload();
 await expect(page.getByTestId('guided-credit')).toBeVisible();
});

test('R3 — fraud analysis uses one axis at a time with correct scoped precision',async({page})=>{
 await page.goto('/?view=fraud');
 await expect(page.getByTestId('guided-fraud')).toBeVisible();
 await expect(page.locator('.grl-fraud-metrics')).toContainText('790');
 await page.getByRole('button',{name:/J28 : 299 alertes/}).click();
 await expect(page.locator('.grl-fraud-metrics')).toContainText('299');
 await expect(page.locator('.grl-fraud-metrics')).toContainText('28,4');
 await expect(page.getByText('214 fausses')).toBeVisible();
 await page.getByRole('button',{name:'Par type'}).click();
 await expect(page.locator('.grl-fraud-metrics')).toContainText('790');
 await page.getByRole('button',{name:/TRANSFER : 486 alertes/}).click();
 await expect(page.locator('.grl-fraud-metrics')).toContainText('486');
 await expect(page.getByTestId('guided-fraud')).toContainText('aucun croisement jour × type');
});

test('R4 — model test metrics do not depend on descriptive filters and source caveats remain visible',async({page})=>{
 await page.goto('/?view=credit');
 await page.getByLabel('Âge Crédit').selectOption('18-29');
 await page.getByRole('button',{name:/Voir l’évaluation B3|Voir l'évaluation B3/}).click();
 await expect(page.getByTestId('guided-models')).toBeVisible();
 await expect(page.locator('.grl-model-metrics')).toContainText('0,5486');
 await expect(page.locator('.grl-model-metrics')).toContainText('0,7758');
 await expect(page.getByTestId('guided-models')).toContainText('pas pour refuser un crédit');
 await page.getByRole('tab',{name:'Fraude B4'}).click();
 await expect(page.locator('.grl-model-metrics')).toContainText('0,3651');
 await expect(page.getByTestId('guided-models')).toContainText('Dérive de prévalence');
 await page.reload();
 await expect(page.getByTestId('guided-models')).toBeVisible();
});

test('R4 — evidence reports technical controls and exports without implying certification',async({page})=>{
 await page.goto('/?view=evidence');
 await expect(page.getByTestId('guided-evidence')).toBeVisible();
 await expect(page.getByTestId('guided-evidence')).toContainText('ne constituent pas une certification');
 await expect(page.getByTestId('guided-evidence')).toContainText('30 000 dossiers');
 await page.getByRole('button',{name:'Fraude',exact:true}).last().click();
 await expect(page.getByTestId('guided-evidence')).toContainText('Simulation PaySim');
 await expect(page.getByTestId('guided-evidence')).not.toContainText('Portefeuille UCI · sélection active');
 const a=page.getByRole('link',{name:'Source PaySim (Kaggle)'});
 await expect(a).toHaveAttribute('href',/kaggle/);
});

test('R5 — 1648, 1440, 1280 and 390 render all five views with no global horizontal overflow',async({page})=>{
 for(const [w,h] of [[1648,928],[1440,810],[1280,720],[390,844]] as const){
  await page.setViewportSize({width:w,height:h});
  for(const view of ['overview','credit','fraud','models','evidence'] as const){
   await page.goto(view==='overview'?'/':'/?view='+view);
   await expect(page.getByTestId('guided-'+view)).toBeVisible();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   expect(overflow,'global horizontal overflow '+w+' '+view).toBeLessThanOrEqual(3);
   if(w===1648||w===390||(w===1280&&view==='credit'))await page.screenshot({path:'test-results/guided-'+view+'-'+w+'x'+h+'.png',fullPage:true});
  }
 }
});


test('R3-R4 — fraud model link opens B4 and keeps the chosen day on return',async({page})=>{
 await page.goto('/?view=fraud');
 await page.getByRole('button',{name:/J28 : 299 alertes/}).click();
 await expect(page.locator('.grl-fraud-metrics')).toContainText('299');
 await page.getByRole('button',{name:/Voir l’évaluation B4|Voir l'évaluation B4/}).click();
 await expect(page.getByTestId('guided-models')).toBeVisible();
 await expect(page.getByRole('tab',{name:'Fraude B4'})).toHaveAttribute('aria-selected','true');
 await expect(page.locator('.grl-model-metrics')).toContainText('0,3651');
 await page.locator('.grl-nav button').filter({hasText:'Fraude'}).click();
 await expect(page.locator('.grl-fraud-metrics')).toContainText('299');
});


test('R5.1 — first-visit interpretation does not simply duplicate global metrics',async({page})=>{
 await page.goto('/?view=credit');
 const creditReading=page.locator('.grl-side-reading');
 await expect(creditReading).toContainText('Choisissez un segment');
 await expect(creditReading).not.toContainText('0,0 point(s)');
 await page.locator('.grl-heat-row button[title^="40-49 · 50k-99k"]').click();
 await expect(creditReading).toContainText('Sélection active');
 await expect(creditReading).toContainText('27,1 %');
 await expect(creditReading).toContainText('+5,0 pt');
 await page.goto('/?view=fraud');
 const fraudReading=page.locator('.grl-fraud-reading');
 await expect(fraudReading).toContainText("Une alerte n'est pas une fraude confirmée");
 await expect(fraudReading).toContainText('1 075 fraudes manquées');
 await expect(fraudReading).not.toContainText('790 alertes');
 await page.getByRole('button',{name:/J28 : 299 alertes/}).click();
 await expect(fraudReading).toContainText('299 alertes');
 await expect(fraudReading).toContainText('214 fausses');
});

test('R5.1 — B3 credit confusion is not mislabeled as fraud alerts',async({page})=>{
 await page.goto('/?view=models');
 const matrix=page.locator('.grl-confusion');
 await expect(matrix).toContainText('défauts prédits à tort');
 await expect(matrix).toContainText('défauts manqués');
 await expect(matrix).not.toContainText('fausses alertes');
 await page.getByRole('tab',{name:'Fraude B4'}).click();
 await expect(matrix).toContainText('fausses alertes');
 await expect(matrix).toContainText('fraudes manquées');
});
