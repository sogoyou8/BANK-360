import {test,expect,type Page} from '@playwright/test';
async function openX1(page:Page){
 await page.goto('/?x1=1');
 await expect(page.getByTestId('x1-analysis')).toBeVisible();
}
test('X1 — two main destinations and frozen classic shell remain available',async({page})=>{
 await openX1(page);
 await expect(page.locator('.nav-dock .dock-link')).toHaveCount(2);
 await expect(page.getByRole('heading',{name:'Analyse 360 — Crédit & fraude'})).toBeVisible();
 await page.getByRole('button',{name:'Gouvernance & preuves',exact:true}).click();
 await expect(page.getByTestId('x1-governance')).toBeVisible();
 await page.locator('.nav-dock').getByRole('button',{name:'Analyse 360',exact:true}).click();
 await expect(page.getByTestId('x1-analysis')).toBeVisible();
 await page.getByRole('button',{name:'Revenir aux six pages classiques'}).click();
 await expect(page.locator('.nav-dock .dock-link')).toHaveCount(6);
 await expect(page.getByRole('heading',{name:'Vue d’ensemble'})).toBeVisible();
});
test('X1 — credit age and limit filter the SAME cohort, six months, rows and weighted rate',async({page})=>{
 await openX1(page);
 const credit=page.locator('.x1-credit-panel');
 await expect(page.locator('.x1-summary>div').first()).toContainText('30 000');
 await page.getByLabel('Âge Analyse 360').selectOption('18-29');
 await expect(page.locator('.x1-summary>div').first()).toContainText('9 618');
 await expect(credit.locator('.x1-comparison')).toContainText('2 197');
 await expect(credit.locator('.x1-month-inline')).toContainText('Retards · septembre');
 await page.getByLabel('Plafond Analyse 360').selectOption('100k-199k');
 await expect(page.locator('.x1-inspector-table tbody tr').first()).toContainText('18-29');
 await expect(page.locator('.x1-inspector-table tbody tr').first()).toContainText('100k-199k');
 const counts=await page.locator('.x1-inspector-table tbody tr').evaluateAll(xs=>xs.filter(x=>x.querySelector('td')).map(x=>Number((x.querySelectorAll('td')[3].textContent||'').replace(/\s/g,''))));
 const kpi=Number((await page.locator('.x1-summary>div').first().locator('b').innerText()).replace(/\s/g,''));
 expect(counts.reduce((a,b)=>a+b,0)).toBe(kpi);
 await credit.getByRole('button',{name:'Comparer les six mois'}).click();
 const monthlyRows=page.locator('.x1-inspector-evidence tbody tr');
 await expect(monthlyRows).toHaveCount(6);
 const denominators=await monthlyRows.evaluateAll(rs=>rs.map(r=>Number((r.querySelectorAll('td')[1].textContent||'').replace(/\s/g,''))));
 expect(denominators.every(v=>v===kpi)).toBe(true);
 await page.keyboard.press('Escape');
 await page.getByRole('tab',{name:'Données'}).click();
 await page.getByRole('button',{name:'Réinitialiser Crédit'}).click();
 await expect(page.locator('.x1-summary>div').first()).toContainText('30 000');
});
test('X1.5 — selecting a matrix cell filters age and limit together, including the monthly denominators',async({page})=>{
 await openX1(page);
 const grid=page.getByRole('group',{name:'Matrice taux de défaut âge par plafond'});
 await expect(grid.locator('.x1-matrix-row button')).toHaveCount(25);
 const cell=grid.locator('.x1-matrix-row').first().getByRole('button').nth(2);
 await cell.click();
 await expect(page.getByLabel('Âge Analyse 360')).toHaveValue('18-29');
 await expect(page.getByLabel('Plafond Analyse 360')).toHaveValue('100k-199k');
 await expect(cell).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.x1-comparison').first()).toContainText('Référence');
 const kpi=Number((await page.locator('.x1-summary>div').first().locator('b').innerText()).replace(/\s/g,''));
 await page.getByRole('button',{name:'Comparer les six mois'}).click();
 const months=await page.locator('.x1-inspector-evidence tbody tr').evaluateAll(rs=>rs.map(r=>Number((r.querySelectorAll('td')[1].textContent||'').replace(/\s/g,''))));
 expect(months).toHaveLength(6);
 expect(months.every(n=>n===kpi)).toBe(true);
 await page.keyboard.press('Escape');
 await cell.click();
 await expect(page.getByLabel('Âge Analyse 360')).toHaveValue('Tout');
 await expect(page.getByLabel('Plafond Analyse 360')).toHaveValue('Tout');
});
test('X1 — PaySim channel and day are EXCLUSIVE (never fake joint dimensions)',async({page})=>{
 await openX1(page);
 await page.getByLabel('Type Analyse 360').selectOption('TRANSFER');
 await expect(page.locator('.x1-summary>div').nth(3)).toContainText('486');
 await expect(page.getByLabel('Jour Analyse 360')).toHaveValue('Tous');
 await expect(page.locator('.x1-fraud-panel')).toContainText('clic = changer d’axe');
 await page.getByLabel('Jour Analyse 360').selectOption('28');
 await expect(page.getByLabel('Type Analyse 360')).toHaveValue('Tous');
 await expect(page.locator('.x1-summary>div').nth(3)).toContainText('299');
 await expect(page.locator('.x1-fraud-panel')).toContainText('clic = changer d’axe');
 await expect(page.locator('.x1-model-note')).toContainText('tests globaux non filtrés');
 await expect(page.getByRole('tab',{name:'Crédit'})).toHaveAttribute('aria-selected','true');
 await page.getByRole('tab',{name:'Fraude'}).click();
 await expect(page.locator('.x1-inspector-table tbody tr')).toHaveCount(1);
 await expect(page.locator('.x1-inspector-table tbody tr')).toContainText('J28');
 await page.getByRole('button',{name:'Réinitialiser Fraude'}).click();
 await expect(page.getByLabel('Jour Analyse 360')).toHaveValue('Tous');
});
test('X1 — CSV export contains exactly the filtered UCI grouping, no PaySim columns',async({page})=>{
 await openX1(page);
 await page.getByLabel('Âge Analyse 360').selectOption('18-29');
 const promise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Exporter la sélection',exact:true}).click();
 const download=await promise;
 expect(download.suggestedFilename()).toBe('bank360-x1-credit-selection.csv');
});
test('X1 — governance condenses checks, methodology, genuine downloads and preferences',async({page})=>{
 await openX1(page);
 await page.getByRole('button',{name:'Ouvrir la gouvernance et les preuves'}).click();
 await expect(page.getByTestId('x1-governance')).toBeVisible();
 await expect(page.locator('.x1-proof-row')).toHaveCount(4);
 await expect(page.locator('.x1-method-link')).toHaveCount(3);
 await expect(page.locator('.x1-export-row')).toHaveCount(3);
 await expect(page.locator('.x1-gov-banner')).toContainText('30 000');
 await expect(page.locator('.x1-gov-banner')).toContainText('6 362 620');
 await page.getByRole('group',{name:'Périmètre de gouvernance'}).getByRole('button',{name:'Fraude',exact:true}).click();
 await expect(page.locator('.x1-export-row')).toHaveCount(1);
 await expect(page.locator('.x1-method-link')).toHaveCount(1);
 await page.locator('.x1-proof-row').first().click();
 await expect(page.locator('.x1-proof-row').first()).toContainText('Règle vérifiée');
 await expect(page.locator('.x1-proof-row').first()).toContainText('Mesuré');
 const save=page.waitForEvent('download');
 await page.locator('.x1-export-row').first().getByRole('button').click();
 expect((await save).suggestedFilename()).toMatch(/bank360-x1-alertes\.csv$/);
});
test('X1 — main geometry fits, controls are visible, and mobile remains scrollable',async({page})=>{
 for(const [width,height] of [[1648,928],[1440,810],[1366,768],[1280,720]] as const){
  await page.setViewportSize({width,height});
  await openX1(page);
  const g=await page.evaluate(()=>{
   const main=document.querySelector('#main-content')!;
   const root=document.querySelector('.x1-root')!.getBoundingClientRect();
   const footer=document.querySelector('.statusline')!.getBoundingClientRect();
   const cards=[...document.querySelectorAll('.x1-analysis-grid .x1-card,.x1-inspector')].map(x=>x.getBoundingClientRect());
   return {vertical:main.scrollHeight-main.clientHeight,horizontal:document.documentElement.scrollWidth-innerWidth,bottom:root.bottom,footer:footer.top,cardFits:cards.every(x=>x.left>=root.left-3&&x.right<=root.right+3)};
  });
  expect(g.horizontal).toBeLessThanOrEqual(3);
  expect(g.vertical).toBeLessThanOrEqual(3);
  expect(g.bottom).toBeLessThanOrEqual(g.footer+5);
  expect(g.cardFits).toBe(true);
  if(width===1648||width===1440)await page.screenshot({path:'test-results/x1-analysis-'+width+'x'+height+'.png',fullPage:true});
  await page.getByRole('button',{name:'Gouvernance & preuves',exact:true}).click();
  await expect(page.locator('.x1-gov-exports')).toBeVisible();
  if(width===1648)await page.screenshot({path:'test-results/x1-governance-1648x928.png',fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});
 await openX1(page);
 await expect(page.locator('.x1-filterrail')).toBeVisible();
 await expect(page.locator('.x1-inspector')).toBeVisible();
 await page.screenshot({path:'test-results/x1-analysis-mobile-390x844.png',fullPage:true});
});


test('X1.5 — inspect-in-place retains all B3/B4 diagnostics, monthly detail, comparison and keyboard Escape',async({page})=>{
 await page.setViewportSize({width:1440,height:810});await openX1(page);
 await page.getByRole('button',{name:'Comparer la sélection au portefeuille'}).click();
 await expect(page.locator('.x1-inspector')).toHaveClass(/x1-inspector-expanded/);
 await expect(page.locator('.x1-inspector-compare-kpis')).toContainText('Référence');
 await expect(page.getByRole('group',{name:'Taux de défaut par âge'}).getByRole('button')).toHaveCount(5);
 await page.getByRole('tab',{name:'Retards'}).click();
 await expect(page.locator('.x1-inspector-evidence tbody tr')).toHaveCount(6);
 await page.getByRole('tab',{name:'Modèles'}).click();
 await expect(page.locator('.x1-model-kpis')).toContainText('PR-AUC');
 for(const label of ['Déciles','Variables','Calibration','Sous-groupes'] as const){
  await page.getByRole('tab',{name:label}).click();
  await expect(page.locator('.x1-model-inspection')).toBeVisible();
 }
 await page.getByRole('button',{name:'Modèles Fraude B4'}).click();
 await expect(page.locator('.x1-model-kpis')).toContainText('PR-AUC');
 await page.getByRole('tab',{name:'Dérive'}).click();
 await expect(page.locator('.x1-model-inspection')).toContainText('Prévalence');
 await page.keyboard.press('Escape');
 await expect(page.locator('.x1-inspector')).not.toHaveClass(/x1-inspector-expanded/);
});

test('X1.5 — governance fraud export follows active day, and evidence displays real validation rule',async({page})=>{
 await openX1(page);
 await page.getByLabel('Jour Analyse 360').selectOption('28');
 await page.getByRole('button',{name:'Ouvrir la gouvernance et les preuves'}).click();
 await page.getByRole('group',{name:'Périmètre de gouvernance'}).getByRole('button',{name:'Fraude',exact:true}).click();
 const exportCard=page.locator('.x1-export-row');
 await expect(exportCard).toHaveCount(1);
 await expect(exportCard).toContainText('J28');
 await expect(exportCard).toContainText('1 lignes agrégées');
 await expect(page.locator('.x1-gov-banner')).not.toContainText('30 000');
 await page.locator('.x1-proof-row').first().click();
 await expect(page.locator('.x1-proof-details')).toContainText('Règle vérifiée');
 await expect(page.locator('.x1-proof-details')).toContainText('Mesuré');
 await expect(page.locator('.x1-proof-details')).toContainText('Provenance');
 const download=page.waitForEvent('download');
 await exportCard.getByRole('button').click();
 expect((await download).suggestedFilename()).toBe('bank360-x1-alertes.csv');
});

test('X1.5 — all chart text and matrix stay within their actual containers in multiple desktop sizes',async({page})=>{
 for(const [width,height] of [[1920,1080],[1648,928],[1440,810],[1366,768],[1280,720]] as const){
  await page.setViewportSize({width,height});await openX1(page);
  const g=await page.evaluate(()=>{
   const get=(e:Element)=>e.getBoundingClientRect();
   const credit=document.querySelector('.x1-credit-panel')!;
   const fraud=document.querySelector('.x1-fraud-panel')!;
   const matrix=document.querySelector('.x1-matrix-section')!;
   const month=document.querySelector('.x1-credit-panel .x1-month-inline')!;
   const inspector=document.querySelector('.x1-inspector')!;
   const titles=[...document.querySelectorAll('.x1-credit-panel h3,.x1-fraud-panel h3')];
   const rowCells=[...document.querySelectorAll('.x1-matrix-row button')];
   const matrixRows=[...document.querySelectorAll('.x1-matrix-row')].map(get);
   const matrixHeading=get(matrix.querySelector('.x1-subtitle')!);
   const matrixHeader=get(matrix.querySelector('.x1-matrix-head')!);
   const matrixBottom=get(matrix).bottom;
   const matrixRowLabels=[...document.querySelectorAll('.x1-matrix-row strong')].map(get);
   const matrixTextGeometry=
    matrixRows.length===5&&matrixRows.every((r,i)=>r.height>=16&&
     matrixRowLabels[i].top>=r.top-1&&matrixRowLabels[i].bottom<=r.bottom+1&&
     (!i||matrixRows[i-1].bottom<=r.top+1))&&
    matrixHeading.bottom<=matrixHeader.top+2&&
    matrixHeader.bottom<=matrixRows[0].top+2&&
    matrixRows[4].bottom<=matrixBottom+1;

   const dayValues=[...document.querySelectorAll('.x1-day-bars button')];
   const horizontalValues=[...document.querySelectorAll('.x1-horizontal-bars button')];
   const inside=(parent:Element,child:Element)=>{
    const a=get(parent),b=get(child);
    return b.left>=a.left-2&&b.right<=a.right+2&&b.top>=a.top-2&&b.bottom<=a.bottom+2;
   };
   return {
    chartOverlap:get(matrix).bottom-get(month).top,
    creditEnd:get(credit).bottom,monthBottom:get(month).bottom,
    inspectorTop:get(inspector).top,fraudEnd:get(fraud).bottom,
    cells:rowCells.length,cellsInside:rowCells.every(e=>inside(matrix,e)),matrixTextGeometry,
    headingsInside:titles.every(x=>inside(x.closest('.x1-card')!,x)),
    dayInside:dayValues.every(x=>inside(fraud,x)),
    horizontalInside:horizontalValues.every(x=>inside(fraud,x)),
    overall:document.documentElement.scrollHeight-innerHeight,
    horizontal:document.documentElement.scrollWidth-innerWidth,
    main:document.querySelector('#main-content')!.scrollHeight-document.querySelector('#main-content')!.clientHeight
   };
  });
  const note=width+'×'+height;
  expect(g.chartOverlap,'matrix versus monthly '+note).toBeLessThanOrEqual(1);
  expect(g.monthBottom,'credit footer '+note).toBeLessThanOrEqual(g.creditEnd+1);
  expect(g.fraudEnd,'fraud panel versus inspector '+note).toBeLessThanOrEqual(g.inspectorTop+2);
  expect(g.cells,'25 matrix combinations '+note).toBe(25);
  expect(g.cellsInside,'matrix cell bounds '+note).toBe(true);
  expect(g.matrixTextGeometry,'five complete matrix lines, no label/footer collision '+note).toBe(true);
  expect(g.headingsInside,'titles fit '+note).toBe(true);
  expect(g.dayInside,'day buttons fit '+note).toBe(true);
  expect(g.horizontalInside,'fraud rows fit '+note).toBe(true);
  expect(g.overall,'no body overflow '+note).toBeLessThanOrEqual(3);
  expect(g.horizontal,'no horizontal overflow '+note).toBeLessThanOrEqual(3);
  expect(g.main,'no main scroll '+note).toBeLessThanOrEqual(3);
  await page.screenshot({path:'test-results/x15-analysis-'+width+'x'+height+'.png',fullPage:true});
 }
});


test('X1.5.3 — short viewport does not show half a data row; expanded inspector restores all records',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 await openX1(page);
 const collapsed=page.locator('.x1-inspector:not(.x1-inspector-expanded)');
 await expect(collapsed).toBeVisible();
 await expect(collapsed.locator('.x1-inspector-table tbody')).toHaveCSS('visibility','hidden');
 await expect(collapsed.getByRole('button',{name:/Agrandir/i})).toBeVisible();
 await collapsed.getByRole('button',{name:/Agrandir/i}).click();
 const expanded=page.locator('.x1-inspector-expanded');
 await expect(expanded).toBeVisible();
 await expect(expanded.locator('.x1-inspector-table tbody')).toHaveCSS('visibility','visible');
 await expect(expanded.locator('.x1-inspector-table tbody tr').first()).toBeVisible();
 await page.screenshot({path:'test-results/x15-expanded-1280x720.png',fullPage:true});
});


test('X1.6 — expanded inspector is a keyboard-accessible dialog with restored focus',async({page})=>{
 await openX1(page);
 const opener=page.getByRole('button',{name:'Comparer la sélection au portefeuille'});
 await opener.click();
 const dialog=page.getByRole('dialog',{name:'Inspecteur analytique agrandi'});
 await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('button',{name:/Réduire/})).toBeFocused();
 await page.keyboard.press('Tab');
 expect(await page.evaluate(()=>Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true);
 await dialog.getByRole('tab',{name:'Données'}).focus();
 await page.keyboard.press('ArrowRight');
 await expect(dialog.getByRole('tab',{name:'Retards'})).toHaveAttribute('aria-selected','true');
 await page.keyboard.press('Escape');
 await expect(dialog).not.toBeVisible();
 await expect(opener).toBeFocused();
});

test('X1.6 — governance makes active selection distinct from global controls',async({page})=>{
 await openX1(page);
 await page.getByLabel('Âge Analyse 360').selectOption('18-29');
 const creditCount=await page.locator('.x1-summary>div').first().locator('b').innerText();
 await page.getByRole('button',{name:'Ouvrir la gouvernance et les preuves'}).click();
 await page.getByRole('group',{name:'Périmètre de gouvernance'}).getByRole('button',{name:'Crédit',exact:true}).click();
 await expect(page.locator('.x1-gov-banner')).toContainText(creditCount);
 await expect(page.locator('.x1-gov-banner')).toContainText('sélection UCI');
 await expect(page.locator('.x1-gov-banner')).toContainText('Contrôles globaux');
 await page.getByRole('button',{name:'Analyse 360',exact:true}).last().click();
 await page.getByLabel('Jour Analyse 360').selectOption('28');
 const fraudCount=await page.locator('.x1-summary>div').nth(2).locator('b').innerText();
 await page.getByRole('button',{name:'Ouvrir la gouvernance et les preuves'}).click();
 await page.getByRole('group',{name:'Périmètre de gouvernance'}).getByRole('button',{name:'Fraude',exact:true}).click();
 await expect(page.locator('.x1-gov-banner')).toContainText(fraudCount);
 await expect(page.locator('.x1-gov-banner')).toContainText('J28 · test');
 await expect(page.locator('.x1-gov-banner')).not.toContainText('6 362 620');
});

test('X1.6 — light mode has readable labels and preserves X1 navigation',async({page})=>{
 await openX1(page);
 await page.getByRole('button',{name:'Basculer le thème'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.locator('.x1-matrix-row button').first()).toHaveCSS('color','rgb(20, 52, 88)');
 await expect(page.locator('.x1-root select').first()).toHaveCSS('color','rgb(22, 52, 86)');
 await page.getByRole('button',{name:'Ouvrir la gouvernance et les preuves'}).click();
 await expect(page.locator('.x1-gov-banner')).toBeVisible();
 await expect(page.locator('.x1-gov-banner h2')).toHaveCSS('color','rgb(10, 112, 95)');
 await page.getByRole('button',{name:'Analyse 360',exact:true}).last().click();
 await expect(page.getByTestId('x1-analysis')).toBeVisible();
 await page.getByRole('button',{name:'Revenir aux six pages classiques'}).click();
 await expect(page.locator('.nav-dock .dock-link')).toHaveCount(6);
});


test('X1.7 — Aurora is the default route, governance has a bookmark and classic stays reachable',async({page})=>{
 await page.goto('/');
 await expect(page.getByTestId('x1-analysis')).toBeVisible();
 await expect(page.locator('.nav-dock .dock-link')).toHaveCount(2);
 await page.getByRole('button',{name:'Gouvernance & preuves',exact:true}).click();
 await expect(page.getByTestId('x1-governance')).toBeVisible();
 await expect(page).toHaveURL(/\?view=governance$/);
 await page.reload();
 await expect(page.getByTestId('x1-governance')).toBeVisible();
 await page.locator('.nav-dock').getByRole('button',{name:'Analyse 360',exact:true}).click();
 await expect(page.getByTestId('x1-analysis')).toBeVisible();
 await expect(page).not.toHaveURL(/view=governance/);
 await page.getByRole('button',{name:'Revenir aux six pages classiques'}).click();
 await expect(page.locator('.nav-dock .dock-link')).toHaveCount(6);
 await expect(page).toHaveURL(/\?classic=1$/);
 await page.reload();
 await expect(page.getByRole('heading',{name:'Vue d’ensemble'})).toBeVisible();
 await page.getByRole('button',{name:'Ouvrir Analyse 360'}).click();
 await expect(page.getByTestId('x1-analysis')).toBeVisible();
 await expect(page).not.toHaveURL(/classic=1/);
 await page.goto('/?x1=1');
 await expect(page.getByTestId('x1-analysis')).toBeVisible();
 await page.goto('/?classic=1');
 await expect(page.getByRole('heading',{name:'Vue d’ensemble'})).toBeVisible();
});
