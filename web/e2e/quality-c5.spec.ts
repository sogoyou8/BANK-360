import {test,expect,type Page} from '@playwright/test';

async function openQuality(page:Page){
 await page.goto('/');
 await page.getByRole('button',{name:'Qualité',exact:true}).click();
 await expect(page.getByTestId('quality-workspace')).toBeVisible();
}
test('C5 — cockpit unique Aurora, quatre contrôles issus de reconcile()',async({page})=>{
 await openQuality(page);
 await expect(page.locator('.dock-link.active')).toHaveAttribute('aria-label','Qualité');
 await expect(page.getByRole('heading',{name:'Qualité & traçabilité'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Sources réconciliées'})).toBeVisible();
 await expect(page.locator('.qw-check-card')).toHaveCount(4);
 await expect(page.locator('.qw-status-pill')).toHaveCount(4);
 await expect(page.locator('.qw-status-good')).toHaveCount(4);
 await expect(page.locator('.qw-reconciliation-kpis')).toContainText('30 000');
 await expect(page.locator('.qw-reconciliation-kpis')).toContainText('6 362 620');
 await expect(page.locator('.qw-reconciliation-kpis')).toContainText('4');
 await expect(page.locator('.qw-check-list')).toContainText('6 636');
 await expect(page.locator('.qw-check-list')).toContainText('180 000');
 await expect(page.locator('.qw-limits-list>div')).toHaveCount(3);
 await expect(page.locator('.qw-source-card')).toHaveCount(2);
 await expect(page.locator('.nav-dock nav button')).toHaveCount(6);
});
test('C5 — source scopes are distinct; counters never masquerade as filtered totals',async({page})=>{
 await openQuality(page);
 const group=page.getByRole('group',{name:'Sources analysées'});
 await group.getByRole('button',{name:'Crédit'}).click();
 await expect(page.locator('.qw-check-card')).toHaveCount(3);
 await expect(page.locator('.qw-source-card')).toHaveCount(1);
 await expect(page.locator('.qw-check-list')).not.toContainText('Transactions simulées');
 await expect(page.locator('.qw-reconciliation-kpis')).not.toContainText('6 362 620');
 await group.getByRole('button',{name:'Fraude'}).click();
 await expect(page.locator('.qw-check-card')).toHaveCount(2);
 await expect(page.locator('.qw-source-card')).toHaveCount(1);
 await expect(page.locator('.qw-check-list')).not.toContainText('Dossiers et défauts');
 await expect(page.locator('.qw-reconciliation-kpis')).not.toContainText('30 000');
 await expect(page.locator('.qw-limits-list')).toContainText('dérive chronologique');
 await group.getByRole('button',{name:'Toutes sources'}).click();
 await expect(page.locator('.qw-check-card')).toHaveCount(4);
 await expect(page.locator('.qw-source-card')).toHaveCount(2);
});
test('C5 — four actual perspectives stay in one route and rearrange the cockpit',async({page})=>{
 await openQuality(page);
 const tabs=page.getByRole('tablist',{name:'Perspectives Qualité'});
 for(const [name,css] of [['Contrôles','qw-perspective-controls'],['Sources','qw-perspective-sources'],['Limites','qw-perspective-limits'],['Vue globale','qw-perspective-overview']] as const){
  await tabs.getByRole('tab',{name}).click();
  await expect(tabs.getByRole('tab',{name})).toHaveAttribute('aria-selected','true');
  await expect(page.getByTestId('quality-workspace')).toHaveClass(new RegExp(css));
  await expect(page.locator('#main-content')).toHaveAttribute('data-page','quality');
  await expect(page.locator('.qw-panel')).toHaveCount(3);
 }
});
test('C5 — cards disclose actual sources, criteria and observations, keyboard escape closes',async({page})=>{
 await openQuality(page);
 const names=['Dossiers et défauts','Historique de paiement','Transactions simulées','Évaluation des modèles'];
 for(const name of names){
  await page.getByRole('button',{name:'Inspecter le contrôle '+name}).click();
  const dialog=page.getByRole('dialog',{name:name});
  await expect(dialog).toBeVisible();
  for(const text of ['Preuve utilisée','Critère','Valeur observée','Valeur attendue'])await expect(dialog).toContainText(text);
  await expect(dialog).toContainText(name==='Transactions simulées'?'B4-metrics.json':name==='Évaluation des modèles'?'B3-metrics.json':'uci350_');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
 }
});
test('C5 — provenance links point to existing source URLs, not invented records',async({page})=>{
 await openQuality(page);
 await expect(page.getByRole('link',{name:/Portefeuille de crédit/})).toHaveAttribute('href','https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients');
 await expect(page.getByRole('link',{name:/Fraude · paiements mobiles/})).toHaveAttribute('href','https://www.kaggle.com/datasets/ealaxi/paysim1');
 for(const link of await page.locator('.qw-source-card').all()){
  await expect(link).toHaveAttribute('target','_blank');
  await expect(link).toHaveAttribute('rel',/noopener/);
 }
});
test('C5 — no global scrolling, panel overlap, cutoff or hidden footer on desktop',async({page})=>{
 for(const [width,height] of [[1920,1080],[1672,941],[1648,928],[1440,900],[1440,810],[1366,768],[1280,720]] as const){
  await page.setViewportSize({width,height});
  await openQuality(page);
  const geometry=await page.evaluate(()=>{
   const box=(selector:string)=>document.querySelector(selector)!.getBoundingClientRect();
   const main=document.querySelector('#main-content')!;
   const root=box('.qw-root'),banner=box('.qw-reconciliation'),left=box('.qw-checks-panel'),right=box('.qw-sources-panel'),lower=box('.qw-limits-panel'),footer=box('.statusline');
   const cards=[...document.querySelectorAll('.qw-check-card')].map(e=>e.getBoundingClientRect());
   const sources=[...document.querySelectorAll('.qw-source-card')].map(e=>e.getBoundingClientRect());
   const limits=[...document.querySelectorAll('.qw-limits-list>div')].map(e=>e.getBoundingClientRect());
   return {
    pageScroll:main.scrollHeight-main.clientHeight,globalScroll:document.documentElement.scrollHeight-innerHeight,
    overflowX:document.documentElement.scrollWidth-innerWidth,rootBottom:root.bottom,footerTop:footer.top,
    bannerBottom:banner.bottom,leftTop:left.top,leftBottom:left.bottom,rightTop:right.top,rightBottom:right.bottom,
    lowerTop:lower.top,lowerBottom:lower.bottom,
    cardBounds:cards.map(r=>({top:r.top,bottom:r.bottom,height:r.height})),
    sources:sources.map(r=>({top:r.top,bottom:r.bottom,height:r.height})),
    limits:limits.map(r=>({top:r.top,bottom:r.bottom,height:r.height}))
   };
  });
  const msg=width+'×'+height;
  expect(geometry.pageScroll,'main scroll '+msg).toBeLessThanOrEqual(3);
  expect(geometry.globalScroll,'global scroll '+msg).toBeLessThanOrEqual(3);
  expect(geometry.overflowX,'x overflow '+msg).toBeLessThanOrEqual(3);
  expect(geometry.rootBottom,'root below footer '+msg).toBeLessThanOrEqual(geometry.footerTop+3);
  expect(geometry.leftTop,'banner overlaps cards '+msg).toBeGreaterThanOrEqual(geometry.bannerBottom-1);
  expect(geometry.rightTop).toBeGreaterThanOrEqual(geometry.bannerBottom-1);
  expect(geometry.lowerTop,'panels overlap '+msg).toBeGreaterThanOrEqual(geometry.rightBottom-1);
  expect(geometry.leftBottom).toBeLessThanOrEqual(geometry.rootBottom+1);
  expect(geometry.lowerBottom).toBeLessThanOrEqual(geometry.rootBottom+1);
  expect(geometry.cardBounds).toHaveLength(4);
  for(let i=0;i<geometry.cardBounds.length;i++){
   const r=geometry.cardBounds[i];
   expect(r.height,'quality item height '+msg).toBeGreaterThanOrEqual(42);
   expect(r.top).toBeGreaterThanOrEqual(geometry.leftTop);
   expect(r.bottom).toBeLessThanOrEqual(geometry.leftBottom+1);
   if(i>0)expect(r.top).toBeGreaterThanOrEqual(geometry.cardBounds[i-1].bottom-1);
  }
  expect(geometry.sources.every(r=>r.height>=45),'source row height '+msg).toBe(true);
  expect(geometry.limits.every(r=>r.height>=20),'limit row height '+msg).toBe(true);
  await page.screenshot({path:'test-results/quality-c5-'+width+'x'+height+'.png',fullPage:true});
 }
});
test('C5 — 390px mobile is usable with visible navigation and no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await openQuality(page);
 await expect(page.locator('.qw-check-card')).toHaveCount(4);
 await page.getByRole('button',{name:'Inspecter le contrôle Dossiers et défauts'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('button',{name:'Fermer le détail'}).click();
 const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,mainScroll:document.querySelector('#main-content')!.scrollHeight-document.querySelector('#main-content')!.clientHeight}));
 expect(geometry.overflow).toBeLessThanOrEqual(2);
 expect(geometry.mainScroll).toBeGreaterThan(0);
 await page.screenshot({path:'test-results/quality-c5-mobile-390x844.png',fullPage:true});
});
test('C5 — dark/light appearance remains operable; other page shells preserved',async({page})=>{
 await openQuality(page);
 await page.getByRole('button',{name:'Basculer le thème'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.locator('.qw-check-card').first()).toBeVisible();
 await page.getByRole('button',{name:'Basculer le thème'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.getByRole('button',{name:'Rapports',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Rapports & préférences'})).toBeVisible();
 await page.getByRole('button',{name:'Intelligence',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Modèles & explorateur de données'})).toBeVisible();
 await page.locator('.nav-dock').getByRole('button',{name:'Fraude',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Détection de fraude & analyse des alertes'})).toBeVisible();
});
