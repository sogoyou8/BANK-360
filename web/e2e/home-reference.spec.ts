import {test,expect} from '@playwright/test';

const navigate=async(page:import('@playwright/test').Page,section:string,target:string)=>{
 await page.getByRole('button',{name:section,exact:true}).click();
 await page.getByRole('menuitem',{name:new RegExp(target)}).click();
};

test('Référence 1672 × 941 : proportions des panneaux, zéro contenu coupé et capture',async({page})=>{
 await page.setViewportSize({width:1672,height:941});await page.goto('/');
 await expect(page.locator('.home-kpi')).toHaveCount(4);
 await expect(page.locator('.home-credit-column')).toHaveCount(5);
 await expect(page.locator('.home-watch-row')).toHaveCount(3);
 const pos=await page.evaluate(()=>{
  const box=(sel:string)=>{const b=document.querySelector(sel)!.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,right:b.right}};
  const m=document.querySelector('#main-content')!;
  return {dock:box('.nav-dock'),topbar:box('.topbar'),heading:box('.view-head'),metrics:box('.home-overview-kpis'),credit:box('.home-risk-panel'),fraud:box('.home-fraud-panel'),watch:box('.home-watch-panel'),mainScroll:m.scrollHeight-m.clientHeight,bodyOverflow:document.documentElement.scrollWidth-window.innerWidth};
 });
 const near=(observed:number,reference:number,tolerance:number,label:string)=>expect(Math.abs(observed-reference),label+': '+observed+' versus '+reference).toBeLessThanOrEqual(tolerance);
 near(pos.dock.x,18,5,'dock x');near(pos.dock.width,87,5,'dock largeur');
 near(pos.topbar.y,17,5,'topbar y');near(pos.topbar.bottom,88,5,'topbar fin');
 near(pos.metrics.y,165,8,'KPI départ');near(pos.metrics.height,116,5,'KPI hauteur');
 near(pos.credit.x,132,7,'crédit x');near(pos.credit.y,297,8,'crédit y');near(pos.credit.width,834,13,'crédit largeur');near(pos.credit.bottom,878,12,'crédit fin');
 near(pos.fraud.x,981,12,'fraude x');near(pos.fraud.y,297,8,'fraude y');near(pos.watch.bottom,879,12,'vigilance fin');
 expect(pos.mainScroll).toBeLessThanOrEqual(3);expect(pos.bodyOverflow).toBeLessThanOrEqual(2);
 for(const el of await page.locator('.home-watch-row').all()){
  const bbox=await el.boundingBox();expect(bbox).not.toBeNull();expect(bbox!.y+bbox!.height).toBeLessThanOrEqual(pos.watch.bottom-5);
 }
 await page.screenshot({path:'test-results/home-reference-1672x941.png',fullPage:true});
});

test('Référence 1440 × 900 : mono écran, panneau vigilance entièrement visible',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');
 const result=await page.evaluate(()=>{
  const watch=document.querySelector('.home-watch-panel')!.getBoundingClientRect();
  const rows=[...document.querySelectorAll('.home-watch-row')].map(el=>el.getBoundingClientRect());
  const main=document.querySelector('#main-content')!;
  return {watch:watch.bottom,allRowsFit:rows.every(x=>x.bottom<=watch.bottom-4),scroll:main.scrollHeight-main.clientHeight,htmlWidth:document.documentElement.scrollWidth-window.innerWidth};
 });
 expect(result.allRowsFit).toBe(true);expect(result.scroll).toBeLessThanOrEqual(3);expect(result.htmlWidth).toBeLessThanOrEqual(2);
 await page.screenshot({path:'test-results/home-reference-1440x900.png',fullPage:true});
});

test('Accueil : les quatre KPI sont de vrais liens de navigation',async({page})=>{
 const checks:[string,string][]=[['Dossiers de crédit','portfolio'],['Taux de défaut','risk'],['Transactions analysées','fraud'],['Alertes de test','alerts']];
 for(const [name,destination] of checks){await page.goto('/');await page.locator('.home-kpi').filter({hasText:name}).click();await expect(page.locator('#main-content')).toHaveAttribute('data-page',destination)}
});

test('Graphique crédit : les âges réutilisent le filtre réel dans Risque',async({page})=>{
 await page.goto('/');
 const age=page.locator('.home-credit-column').filter({hasText:'18-29'});
 await expect(age).toHaveAttribute('title',/9\s?618 dossiers/);
 await age.click();
 await expect(page.locator('#main-content')).toHaveAttribute('data-page','risk');
 await expect(page.locator('#filter-age')).toHaveValue('18-29');
 await expect(page.getByText('2 197').first()).toBeVisible();
});

test('Canal fraude : approfondissement préselectionné dans les investigations',async({page})=>{
 await page.goto('/');
 await page.locator('.home-fraud-channel').filter({hasText:'CASH OUT'}).click();
 await expect(page.locator('#main-content')).toHaveAttribute('data-page','alerts');
 await expect(page.getByText('CASH_OUT').first()).toBeVisible();
 await expect(page.getByText('304').first()).toBeVisible();
});

test('Vigilances : navigation directe vers les alertes, la dérive et la provenance',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Examiner les fraudes non détectées'}).click();
 await expect(page.locator('#main-content')).toHaveAttribute('data-page','alerts');
 await page.goto('/');
 await page.getByRole('button',{name:'Examiner la calibration du modèle de fraude'}).click();
 await expect(page.locator('#main-content')).toHaveAttribute('data-page','models');
 await expect(page.getByText('Score moyen · test')).toBeVisible();
 await page.goto('/');
 await page.getByRole('button',{name:'Consulter la provenance des données'}).click();
 await expect(page.locator('#main-content')).toHaveAttribute('data-page','quality');
});

test('Mobile : dock fixe, aucun dépassement horizontal, modules lisibles',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.locator('.home-kpi')).toHaveCount(4);
 await expect(page.locator('.home-credit-column')).toHaveCount(5);
 const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-window.innerWidth,dockY:document.querySelector('.nav-dock')!.getBoundingClientRect().y}));
 expect(state.overflow).toBeLessThanOrEqual(2);expect(state.dockY).toBeGreaterThan(700);
 await page.screenshot({path:'test-results/home-reference-mobile.png',fullPage:true});
});

test('Finition des vigilances : typographie hiérarchisée et sous-textes non tronqués sur desktop',async({page})=>{
 for(const [width,height,minTitle,minSub] of [[1672,941,14.9,12.9],[1440,900,12.4,11.4]] as const){
  await page.setViewportSize({width,height});await page.goto('/');
  await expect(page.locator('.home-watch-row')).toHaveCount(3);
  const state=await page.locator('.home-watch-row').evaluateAll(nodes=>nodes.map(row=>{
   const title=row.querySelector('.home-watch-text strong') as HTMLElement;
   const sub=row.querySelector('.home-watch-text small') as HTMLElement;
   const panel=row.closest('.home-watch-panel')!.getBoundingClientRect();
   const bounds=row.getBoundingClientRect();
   return {
    titleSize:parseFloat(getComputedStyle(title).fontSize),
    subSize:parseFloat(getComputedStyle(sub).fontSize),
    titleOverflow:title.scrollWidth-title.clientWidth,
    subOverflow:sub.scrollWidth-sub.clientWidth,
    bottom:bounds.bottom,
    panelBottom:panel.bottom,
    subColor:getComputedStyle(sub).color
   };
  }));
  for(const item of state){
   expect(item.titleSize).toBeGreaterThanOrEqual(minTitle);
   expect(item.subSize).toBeGreaterThanOrEqual(minSub);
   expect(item.titleOverflow).toBeLessThanOrEqual(1);
   expect(item.subOverflow).toBeLessThanOrEqual(1);
   expect(item.bottom).toBeLessThanOrEqual(item.panelBottom-4);
   expect(item.subColor).toBe('rgb(213, 225, 248)');
  }
  const main=await page.locator('#main-content').evaluate(el=>el.scrollHeight-el.clientHeight);
  expect(main).toBeLessThanOrEqual(3);
  await page.screenshot({path:'test-results/home-legibility-'+width+'.png'});
 }
});
test('Finition : mobile lisible sans débordement ni régression du dock',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.locator('.home-watch-row')).toHaveCount(3);
 const metrics=await page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth-window.innerWidth,
   dockBottom:document.querySelector('.nav-dock')!.getBoundingClientRect().bottom,
   headings:[...document.querySelectorAll('.home-watch-text strong')].map(x=>parseFloat(getComputedStyle(x).fontSize))
 }));
 expect(metrics.overflow).toBeLessThanOrEqual(2);
 expect(metrics.dockBottom).toBeLessThanOrEqual(844);
 expect(metrics.headings.every(x=>x>=12)).toBe(true);
 await page.screenshot({path:'test-results/home-legibility-mobile.png',fullPage:true});
});
