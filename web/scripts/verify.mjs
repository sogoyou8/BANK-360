import fs from 'node:fs';import assert from 'node:assert/strict';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const rows=txt=>{const [h,...r]=txt.trim().split(/\r?\n/),keys=h.split(',');return r.map(x=>Object.fromEntries(x.split(',').map((v,i)=>[keys[i],v])))};
const seg=rows(read('powerbi/data/uci350_segments.csv')),pay=rows(read('powerbi/data/uci350_payment_months.csv'));
const b3=JSON.parse(read('reports/b3/B3-metrics.json')),b4=JSON.parse(read('reports/b4/B4-metrics.json'));
assert.equal(seg.length,196);assert.equal(pay.length,1176);
assert.equal(seg.reduce((s,x)=>s+ +x.client_count,0),30000);assert.equal(seg.reduce((s,x)=>s+ +x.default_count,0),6636);
assert.equal(seg.filter(x=>x.age_band==='18-29').reduce((s,x)=>s+ +x.client_count,0),9618);
assert.equal(seg.filter(x=>x.age_band==='18-29').reduce((s,x)=>s+ +x.default_count,0),2197);
for(const m of ['2005-04','2005-05','2005-06','2005-07','2005-08','2005-09'])assert.equal(pay.filter(x=>x.period===m).reduce((s,x)=>s+ +x.client_observations,0),30000);
assert.equal(b3.dataset.population,30000);assert.equal(b4.observed.rows,6362620);assert.equal(b4.observed.frauds,8213);
assert.equal(b4.holdout_test.alerted,b4.holdout_test.confusion.tp+b4.holdout_test.confusion.fp);
const src=read('web/src/main.tsx');
const ids=['home','portfolio','fraud','alerts','models','explorer','quality','reports'];
for(const id of ids){assert.ok(src.includes(`id:'${id}'`),`Page ${id} absente`);assert.ok(src.includes(`page==='${id}'`),`Vue ${id} absente`)}
assert.ok(!src.includes("id:'clients'"));
assert.ok(!src.includes("id:'risk'")&&!src.includes("id:'payments'"),'Anciennes routes Crédit à retirer');
const creditSrc=read('web/src/CreditWorkspace.tsx');
for(const key of ['cw-age','cw-trend','cw-detail','cw-limit','cw-status','cw-monthtable'])assert.ok(creditSrc.includes(key),'Module crédit absent '+key);
assert.ok(creditSrc.includes('bucketMatch')&&creditSrc.includes('const monthly=useMemo'),'Agrégation cohorte/mensuelle requise');
assert.ok(creditSrc.includes('Aucun dossier pour cette sélection'),'État vide requis');assert.equal((src.match(/title:'[^']+',icon:/g)||[]).length>=6,true);
for(const phase of ['B1 ·','B2 ·','B3 ·','B4 ·','EXPERIENCE','PROJET'])assert.ok(!src.includes(phase),`Étiquette interne inutile ${phase}`);
for(const name of ['B3-calibration.csv','B3-feature-importance.csv','B3-subgroup-audit.csv'])assert.ok(read('web/src/riskEvidence.ts').includes(name));
assert.ok(!src.includes('Math.random('));assert.ok(!src.includes('new Date()'));
console.log('B5 Crédit unifié: 8 pages / 6 sections, sources réconciliées, recherche, diagnostics, pas de métriques fabriquées — PASS');

assert.ok(src.includes('function CalibrationView'), 'Calibration prédite et observée requise');
assert.ok(src.includes('chart-scale'), 'Repères des axes requis');
assert.ok(src.includes('Comparaison PR-AUC · validation'), 'Séparation validation/test requise');
assert.ok(!src.includes('Rechercher une analyse'), 'Recherche limitée à la navigation');

assert.ok(src.includes('paymentStatusLabel'), 'Labels des codes de remboursement requis');
assert.ok(src.includes("Code ${code} : signification non précisée"), 'Codes non documentés à préserver');
assert.ok(src.includes('bar-count')&&src.includes('row-count'), 'Effectifs des segments requis');
