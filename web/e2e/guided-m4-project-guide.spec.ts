import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('M4 — overview exposes an accessible guide without replacing the five views',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/');
 const overview=page.getByTestId('guided-overview');
 await expect(overview).toBeVisible();
 await expect(overview.locator('.grl-orientation button')).toHaveCount(3);
 await overview.getByTestId('guide-overview-trigger').click();
 const dialog=page.getByRole('dialog',{name:'Comprendre BANK 360'});
 await expect(dialog).toBeVisible();
 await expect(dialog).toContainText('Deux études Data indépendantes');
 await expect(dialog.getByRole('button',{name:/Consulter le PDF/})).toBeVisible();
 await expect(dialog.getByRole('button',{name:/Télécharger le PDF/})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(dialog).not.toBeVisible();
 const scroll=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
 expect(scroll).toBeLessThanOrEqual(3);
 await expect(page.locator('.grl-nav button')).toHaveCount(5);
});

test('M4 — help changes by view while independent analytical results remain intact',async({page})=>{
 const paths:[
  string,string,string
 ][]=[
  ['credit','Comment lire la vue Crédit ?','Les six mois'],
  ['fraud','Comment lire la vue Fraude ?','par jour OU par type'],
  ['models','Comment lire les modèles ?','PR-AUC'],
  ['evidence','Comment vérifier les preuves ?','CSV/XLSX']
 ];
 for(const [view,header,content] of paths){
  await page.goto('/?view='+view);
  await page.getByTestId('guide-top-trigger').click();
  const dialog=page.getByRole('dialog',{name:'Comprendre BANK 360'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading',{name:header})).toBeVisible();
  await expect(dialog).toContainText(content);
  await dialog.getByRole('button',{name:/Fermer/}).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByTestId('guided-'+view)).toBeVisible();
 }
});

test('M4 — eight-page PDF is served as a genuine browser-readable file',async({page})=>{
 const response=await page.request.get('/bank360-guide.pdf');
 expect(response.ok()).toBeTruthy();
 const body=await response.body();
 expect(body.subarray(0,5).toString('ascii')).toBe('%PDF-');
 expect(body.toString('latin1')).toContain('/Count 8');
 expect(body.toString('latin1')).toContain('%%EOF');
 expect(body.byteLength).toBeGreaterThan(15000);
 await page.goto('/');
 await page.getByTestId('guide-top-trigger').click();
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:/Télécharger le PDF/}).click();
 const file=await download;
 expect(file.suggestedFilename()).toBe('BANK-360-Guide-du-projet.pdf');
 const saved=await readFile(await file.path()!);
 expect(saved.subarray(0,5).toString('ascii')).toBe('%PDF-');
});

test('M4 — standalone HTML embeds the actual PDF for offline consultation',async()=>{
 const html=await readFile('dist/BANK-360-B5-APERCU-LOCAL.html','utf8');
 const marker=html.match(/<script type="application\/octet-stream" id="bank360-guide-embedded">([A-Za-z0-9+/=]+)<\/script>/);
 expect(marker,'PDF must be embedded, not a remote dependency').not.toBeNull();
 const pdf=Buffer.from(marker![1],'base64');
 expect(pdf.subarray(0,5).toString('ascii')).toBe('%PDF-');
 expect(pdf.toString('latin1')).toContain('/Count 8');
});
