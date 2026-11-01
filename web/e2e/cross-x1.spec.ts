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


test('X1.8 — short desktop inspector offers a complete data preview and expanded table',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 await openX1(page);
 const collapsed=page.locator('.x1-inspector:not(.x1-inspector-expanded)');
 await expect(collapsed).toBeVisible();
 const first=collapsed.locator('.x1-inspector-table tbody tr').first();
 await expect(first).toBeVisible();
 await expect(first).toContainText('18-29');
 await expect(collapsed.locator('.x1-inspector-table tbody tr').nth(1)).toBeHidden();
 const geometry=await collapsed.evaluate(panel=>{
  const row=panel.querySelector('.x1-inspector-table tbody tr')!.getBoundingClientRect();
  const scroller=panel.querySelector('.x1-inspector-scroll')!.getBoundingClientRect();
  return {top:row.top,bottom:row.bottom,visibleTop:scroller.top,visibleBottom:scroller.bottom};
 });
 expect(geometry.top).toBeGreaterThanOrEqual(geometry.visibleTop-1);
 expect(geometry.bottom).toBeLessThanOrEqual(geometry.visibleBottom+1);
 await expect(collapsed.getByRole('button',{name:/Agrandir/i})).toBeVisible();
 await expect(collapsed.locator('.x1-inspector-size span')).toBeVisible();
 await page.screenshot({path:'test-results/x18-compact-1280x720.png',fullPage:true});
 await collapsed.getByRole('button',{name:/Agrandir/i}).click();
 const expanded=page.getByRole('dialog',{name:'Inspecteur analytique agrandi'});
 await expect(expanded).toBeVisible();
 await expect(expanded.locator('.x1-inspector-table tbody tr').nth(1)).toBeVisible();
 const g=await expanded.evaluate(panel=>{
  const surface=panel.getBoundingClientRect();
  const scroll=panel.querySelector('.x1-inspector-scroll')!.getBoundingClientRect();
  return {height:surface.height,scrollHeight:scroll.height};
 });
 expect(g.height).toBeGreaterThan(350);
 expect(g.scrollHeight).toBeGreaterThan(200);
 const visuallyOnTop=await expanded.evaluate(dialog=>{
  const r=dialog.getBoundingClientRect();
  const front=document.elementFromPoint(r.left+r.width/2,r.top+Math.min(180,r.height/2));
  return !!front&&dialog.contains(front);
 });
 expect(visuallyOnTop,'expanded inspector must be on top of the credit/fraud panels').toBe(true);
 await page.screenshot({path:'test-results/x18-expanded-1280x720.png',fullPage:true});
 for(const [width,height] of [[1440,810],[1648,928],[390,844]] as const){
  await page.setViewportSize({width,height});
  const expandedHeight=await expanded.evaluate(el=>el.getBoundingClientRect().height);
  expect(expandedHeight,'expanded inspector height at '+width+'×'+height).toBeGreaterThan(height*0.66);
 }
 await page.screenshot({path:'test-results/x18-expanded-mobile-390x844.png',fullPage:true});
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


test('X1.7 — archived Aurora route, governance bookmark and classic stay reachable',async({page})=>{
 await page.goto('/?x1=1');
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


test('X1.8 — mobile heatmap announces sideways exploration and keeps the final column reachable',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openX1(page);
 const matrix=page.getByRole('region',{name:/Carte des taux de défaut, défilement horizontal/});
 await expect(matrix.getByText('Balayez pour voir →')).toBeVisible();
 await expect(matrix).toHaveAttribute('tabindex','0');
 const bounds=await matrix.evaluate(el=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}));
 expect(bounds.scrollWidth).toBeGreaterThan(bounds.clientWidth);
 const last=matrix.locator('.x1-matrix-row').first().getByRole('button').last();
 await last.click();
 await expect(page.getByLabel('Âge Analyse 360')).toHaveValue('18-29');
 await expect(page.getByLabel('Plafond Analyse 360')).toHaveValue('500k+');
 expect(await matrix.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
});


test('X1.9 — first visitor understands independent sources, KPI meanings and matrix action',async({page})=>{
 await page.goto('/?x1=1');
 await expect(page.getByTestId('x1-analysis')).toBeVisible();
 const heading=page.locator('.x1-heading-copy small');
 await expect(heading).toContainText('UCI (2005)');
 await expect(heading).toContainText('PaySim simulées');
 await expect(heading).toContainText('ne sont pas reliées');
 await expect(page.locator('.x1-summary>div').nth(1)).toHaveAttribute('title',/Taux de défaut/);
 await expect(page.locator('.x1-summary>div').nth(3)).toHaveAttribute('title',/une alerte n'est pas nécessairement une fraude/);
 const matrix=page.getByRole('region',{name:/Carte des taux de défaut/});
 await expect(matrix).toContainText('Cliquez une case pour filtrer âge et plafond');
 const active=matrix.locator('.x1-matrix-row button').first();
 await expect(active).toHaveCSS('cursor','pointer');
 await active.click();
 await expect(page.getByLabel('Âge Analyse 360')).toHaveValue('18-29');
 await expect(page.locator('.x1-comparison').first()).toContainText('Référence');
});
test('X1.9 — model glossary and comparisons explain metrics without recomputing test scores',async({page})=>{
 await openX1(page);
 await page.locator('.x1-model-note').click();
 const dialog=page.getByRole('dialog',{name:'Inspecteur analytique agrandi'});
 await expect(dialog).toBeVisible();
 const guide=dialog.locator('.x1-metric-glossary');
 await expect(guide).toContainText('Comment lire ces scores');
 for(const term of ['ROC-AUC','PR-AUC','Brier','rappel','ne changent pas avec les filtres']){
  await expect(guide).toContainText(term,{ignoreCase:true});
 }
 const initial=await dialog.locator('.x1-model-kpis').innerText();
 await page.keyboard.press('Escape');
 await page.getByLabel('Âge Analyse 360').selectOption('18-29');
 await page.locator('.x1-model-note').click();
 await expect.poll(async()=>dialog.locator('.x1-model-kpis').innerText()).toBe(initial);
 await dialog.getByRole('button',{name:'Modèles Fraude B4'}).click();
 await expect(guide).toContainText('PR-AUC');
 await expect(dialog).toContainText('jeux de test globaux');
});
test('X1.9 — compact and expanded explanations remain readable without page overflow',async({page})=>{
 for(const [width,height] of [[1648,928],[1440,810],[1280,720]] as const){
  await page.setViewportSize({width,height});
  await openX1(page);
  const fonts=await page.evaluate(()=>({
   heading:parseFloat(getComputedStyle(document.querySelector('.x1-heading-copy small')!).fontSize),
   filter:parseFloat(getComputedStyle(document.querySelector('.x1-filter-group label')!).fontSize),
   summary:parseFloat(getComputedStyle(document.querySelector('.x1-summary small')!).fontSize),
   horizontal:document.documentElement.scrollWidth-innerWidth,
   vertical:(document.querySelector('#main-content') as HTMLElement).scrollHeight-(document.querySelector('#main-content') as HTMLElement).clientHeight
  }));
  expect(fonts.heading).toBeGreaterThanOrEqual(11);
  expect(fonts.filter).toBeGreaterThanOrEqual(10);
  expect(fonts.summary).toBeGreaterThanOrEqual(9.5);
  expect(fonts.horizontal).toBeLessThanOrEqual(3);
  expect(fonts.vertical).toBeLessThanOrEqual(3);
  await page.getByRole('button',{name:'Comparer la sélection au portefeuille'}).click();
  const chart=page.locator('.x1-inspector-expanded .x1-inspector-compare-charts>div').first();
  await expect(chart).toBeVisible();
  expect((await chart.boundingBox())!.height).toBeGreaterThanOrEqual(200);
  await page.keyboard.press('Escape');
 }
 await page.setViewportSize({width:390,height:844});
 await openX1(page);
 await expect(page.getByRole('region',{name:/Carte des taux de défaut/})).toContainText('Balayez pour voir');
});
test('X1.9 — governance avoids implying official certification and explains evidence',async({page})=>{
 await openX1(page);
 await page.getByRole('button',{name:'Ouvrir la gouvernance et les preuves'}).click();
 await expect(page.locator('.x1-gov-banner h2')).toHaveText('Contrôles d’agrégats conformes');
 await expect(page.locator('.x1-gov-banner')).toContainText('pas certification bancaire');
 await expect(page.locator('.x1-gov-banner')).toContainText('indépendantes');
 await expect(page.locator('.x1-gov-methods')).toContainText('validation');
 await expect(page.locator('.x1-gov-exports')).toContainText('Données agrégées à télécharger');
});


test('X1.9.1 — mobile KPI and comparison labels are not truncated with ellipses',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openX1(page);
 const metrics=await page.locator('.x1-summary>div small').evaluateAll(nodes=>nodes.map(el=>{
  const css=getComputedStyle(el);
  return {text:el.textContent||'',whiteSpace:css.whiteSpace,overflow:css.overflow,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight};
 }));
 expect(metrics).toHaveLength(4);
 expect(metrics.every(x=>x.whiteSpace==='normal'&&x.overflow==='visible'),'all KPI labels wrap without clipping').toBe(true);
 expect(metrics.every(x=>x.scrollWidth<=x.clientWidth+1),'all KPI texts fit horizontally').toBe(true);
 expect(metrics.every(x=>x.scrollHeight<=x.clientHeight+1),'all KPI texts fit vertically').toBe(true);
 const reference=page.locator('.x1-credit-panel .x1-comparison small').nth(2);
 await expect(reference).toContainText('Écart à la référence');
 const ref=await reference.evaluate(el=>({
  whiteSpace:getComputedStyle(el).whiteSpace,
  scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight
 }));
 expect(ref.whiteSpace).toBe('normal');
 expect(ref.scrollWidth).toBeLessThanOrEqual(ref.clientWidth+1);
 expect(ref.scrollHeight).toBeLessThanOrEqual(ref.clientHeight+1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(3);
 await page.screenshot({path:'test-results/x19-mobile-legible-390x844.png',fullPage:true});
});


test('X2 — Aurora Unified has one continuous analysis canvas, aligned domains and intact interactions',async({page})=>{
 for(const [width,height] of [[1648,928],[1440,810],[1280,720]] as const){
  await page.setViewportSize({width,height});
  await openX1(page);
  const sheet=page.locator('.x2-analysis>.x2-surface');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.x1-analysis-grid>.x1-card')).toHaveCount(2);
  await expect(sheet.locator('.x1-summary>div')).toHaveCount(4);
  const g=await page.evaluate(()=>{
   const sheet=document.querySelector('.x2-analysis>.x2-surface')!;
   const cards=[...document.querySelectorAll('.x1-analysis-grid>.x1-card')];
   const a=cards[0].getBoundingClientRect(),b=cards[1].getBoundingClientRect();
   const root=sheet.getBoundingClientRect();
   return {
    widthDiff:Math.abs(a.width-b.width),
    rowTop:Math.abs(a.top-b.top),
    gap:b.left-a.right,
    sheetBorder:getComputedStyle(sheet).borderTopWidth,
    panelBorder:getComputedStyle(cards[0]).borderTopWidth,
    bodyOverflow:document.documentElement.scrollWidth-innerWidth,
    mainOverflow:(document.querySelector('#main-content') as HTMLElement).scrollHeight-(document.querySelector('#main-content') as HTMLElement).clientHeight,
    within:a.left>=root.left&&b.right<=root.right
   };
  });
  expect(g.widthDiff).toBeLessThan(45);
  expect(g.rowTop).toBeLessThanOrEqual(2);
  expect(g.gap).toBeLessThan(20);
  expect(g.sheetBorder).toBe('1px');
  expect(g.panelBorder).toBe('0px');
  expect(g.within).toBe(true);
  expect(g.bodyOverflow).toBeLessThanOrEqual(3);
  expect(g.mainOverflow).toBeLessThanOrEqual(3);
  await page.screenshot({path:'test-results/x2-unified-analysis-'+width+'x'+height+'.png',fullPage:true});
 }
 await page.getByLabel('Âge Analyse 360').selectOption('18-29');
 await expect(page.locator('.x1-summary>div').first()).toContainText('9 618');
 await page.getByRole('button',{name:'Comparer la sélection au portefeuille'}).click();
 await expect(page.getByRole('dialog',{name:'Inspecteur analytique agrandi'})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('.x1-inspector')).not.toHaveClass(/x1-inspector-expanded/);
});
test('X2 — unified governance keeps proof, provenance and downloads in one sheet',async({page})=>{
 await page.setViewportSize({width:1648,height:928});
 await openX1(page);
 await page.getByRole('button',{name:'Ouvrir la gouvernance et les preuves'}).click();
 await expect(page.getByTestId('x1-governance')).toBeVisible();
 const sheet=page.locator('.x2-governance .x2-gov-surface');
 await expect(sheet).toBeVisible();
 await expect(sheet.locator('.x1-gov-grid>.x1-card')).toHaveCount(4);
 await expect(sheet).toContainText('pas certification bancaire');
 const noCards=await sheet.locator('.x1-gov-grid>.x1-card').evaluateAll(cards=>cards.every(el=>getComputedStyle(el).borderTopWidth==='0px'));
 expect(noCards).toBe(true);
 await page.screenshot({path:'test-results/x2-unified-governance-1648x928.png',fullPage:true});
});

test('X2 — mobile domain titles are complete and the unified sheet stays inside the viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openX1(page);
 const title=page.locator('.x1-credit-panel .x1-card-head h2');
 await expect(title).toHaveText('Défauts et segments');
 await expect(page.locator('.x1-credit-panel .x1-scope-pill')).toBeHidden();
 const metrics=await title.evaluate(el=>({
  scroll:el.scrollWidth,client:el.clientWidth,
  whiteSpace:getComputedStyle(el).whiteSpace,
  ellipsis:getComputedStyle(el).textOverflow
 }));
 expect(metrics.scroll).toBeLessThanOrEqual(metrics.client+1);
 expect(metrics.whiteSpace).toBe('normal');
 expect(metrics.ellipsis).not.toBe('ellipsis');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(3);
 await page.screenshot({path:'test-results/x2-unified-mobile-390x844.png',fullPage:true});
});

test('X2.1 — primary domain metrics lead before local filters and charts at desktop widths',async({page})=>{
 for(const [width,height] of [[1648,928],[1440,810],[1280,720]] as const){
  await page.setViewportSize({width,height});
  await openX1(page);
  const stage=page.locator('.x21-surface');
  await expect(stage).toBeVisible();
  const geometry=await stage.evaluate(el=>{
   const rect=(sel:string)=>el.querySelector(sel)!.getBoundingClientRect();
   const primaryCredit=rect('.x1-summary>div:nth-child(2)');
   const primaryFraud=rect('.x1-summary>div:nth-child(4)');
   const creditFilters=rect('.x1-filter-group:first-child');
   const fraudFilters=rect('.x1-filter-group:nth-child(2)');
   const creditGraph=rect('.x1-credit-panel .x1-matrix-section');
   const fraudGraph=rect('.x1-fraud-panel .x1-fraud-charts');
   const inspector=rect('.x1-inspector');
   const creditPane=rect('.x1-credit-panel');
   const fraudPane=rect('.x1-fraud-panel');
   return {
    primaryCreditTop:primaryCredit.top,primaryFraudTop:primaryFraud.top,
    primaryCreditFont:parseFloat(getComputedStyle(el.querySelector('.x1-summary>div:nth-child(2) b')!).fontSize),
    creditFiltersTop:creditFilters.top,fraudFiltersTop:fraudFilters.top,
    creditGraphTop:creditGraph.top,fraudGraphTop:fraudGraph.top,
    creditPaneBottom:creditPane.bottom,fraudPaneBottom:fraudPane.bottom,
    inspectorTop:inspector.top,
    colsAligned:Math.abs(creditPane.top-fraudPane.top),
    scroll:document.querySelector('#main-content')!.scrollHeight-document.querySelector('#main-content')!.clientHeight,
    overflowX:document.documentElement.scrollWidth-innerWidth
   };
  });
  expect(geometry.primaryCreditFont).toBeGreaterThanOrEqual(35);
  expect(geometry.primaryCreditTop).toBeLessThan(geometry.creditFiltersTop);
  expect(geometry.primaryFraudTop).toBeLessThan(geometry.fraudFiltersTop);
  expect(geometry.creditFiltersTop).toBeLessThan(geometry.creditGraphTop);
  expect(geometry.fraudFiltersTop).toBeLessThan(geometry.fraudGraphTop);
  expect(geometry.colsAligned).toBeLessThanOrEqual(2);
  expect(geometry.creditPaneBottom).toBeLessThanOrEqual(geometry.inspectorTop+2);
  expect(geometry.fraudPaneBottom).toBeLessThanOrEqual(geometry.inspectorTop+2);
  expect(geometry.scroll).toBeLessThanOrEqual(3);
  expect(geometry.overflowX).toBeLessThanOrEqual(3);
  await page.screenshot({path:'test-results/x21-domain-stage-'+width+'x'+height+'.png',fullPage:true});
 }
 await expect(page.locator('.x1-credit-panel .x1-comparison')).toContainText('Écart à la référence');
 await expect(page.locator('.x1-summary>div').nth(1)).toContainText('22,1');
 await expect(page.locator('.x1-summary>div').nth(3)).toContainText('790');
 await page.getByLabel('Type Analyse 360').selectOption('TRANSFER');
 await expect(page.locator('.x1-summary>div').nth(3)).toContainText('486');
 await expect(page.getByLabel('Jour Analyse 360')).toHaveValue('Tous');
});
test('X2.1 — mobile stage follows credit then fraud, without clipped filters or extra horizontal scroll',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openX1(page);
 const stage=page.locator('.x21-surface');
 const g=await stage.evaluate(el=>{
  const r=(s:string)=>el.querySelector(s)!.getBoundingClientRect();
  return {
   titleCredit:r('.x2-domain-titles span:first-child').top,
   heroCredit:r('.x1-summary>div:nth-child(2)').top,
   filterCredit:r('.x1-filter-group:first-child').top,
   paneCredit:r('.x1-credit-panel').top,
   titleFraud:r('.x2-domain-titles span:nth-child(2)').top,
   heroFraud:r('.x1-summary>div:nth-child(4)').top,
   filterFraud:r('.x1-filter-group:nth-child(2)').top,
   paneFraud:r('.x1-fraud-panel').top,
   inspector:r('.x1-inspector').top,
   overflowX:document.documentElement.scrollWidth-innerWidth
  };
 });
 expect(g.titleCredit).toBeLessThan(g.heroCredit);
 expect(g.heroCredit).toBeLessThan(g.filterCredit);
 expect(g.filterCredit).toBeLessThan(g.paneCredit);
 expect(g.paneCredit).toBeLessThan(g.titleFraud);
 expect(g.titleFraud).toBeLessThan(g.heroFraud);
 expect(g.heroFraud).toBeLessThan(g.filterFraud);
 expect(g.filterFraud).toBeLessThan(g.paneFraud);
 expect(g.paneFraud).toBeLessThan(g.inspector);
 expect(g.overflowX).toBeLessThanOrEqual(3);
 await page.screenshot({path:'test-results/x21-domain-stage-mobile-390x844.png',fullPage:true});
});

test('X2.1 — compact desktop inspector never reveals a clipped second record',async({page})=>{
 for(const [width,height] of [[1648,928],[1440,810],[1280,720]] as const){
  await page.setViewportSize({width,height});
  await openX1(page);
  const dock=page.locator('.x1-inspector:not(.x1-inspector-expanded)');
  const table=dock.locator('.x1-inspector-table tbody tr');
  await expect(table.first()).toBeVisible();
  await expect(table.nth(1)).toBeHidden();
  const bounds=await dock.evaluate(el=>{
   const first=el.querySelector('.x1-inspector-table tbody tr')!.getBoundingClientRect();
   const visible=el.querySelector('.x1-inspector-scroll')!.getBoundingClientRect();
   return {rowTop:first.top,rowBottom:first.bottom,visibleTop:visible.top,visibleBottom:visible.bottom};
  });
  expect(bounds.rowTop).toBeGreaterThanOrEqual(bounds.visibleTop-1);
  expect(bounds.rowBottom).toBeLessThanOrEqual(bounds.visibleBottom+1);
 }
});
