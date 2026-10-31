import {useMemo,useState} from 'react';
import {Activity,ArrowUpRight,BookOpen,CheckCircle2,CircleAlert,Database,Download,FileText,Info,Layers3,Settings2,ShieldCheck,Wallet} from 'lucide-react';
import {b3,b4,filteredSegments,paymentSeries,fraudDays,fraudTypes,fmtInt,type CreditFilters,type reconcile} from './data';
import {type FraudScope} from './FraudWorkspace';
import {exportReport,type ExportFormat,type ReportDataset} from './reportExports';
import './cross-analysis.css';

type Props={filters:CreditFilters,fraud:FraudScope,onReset:()=>void,theme:'dark'|'light',onTheme:()=>void,checks:ReturnType<typeof reconcile>,onAnalysis:()=>void};
const docs=[
 {name:'Analyse du portefeuille',description:'Segmentation et agrégats historiques UCI',source:'Crédit UCI · historique 2005',url:'https://github.com/sogoyou8/BANK-360/blob/main/docs/B2-validation-finale.md'},
 {name:'Évaluation du risque',description:'Modèles et validation B3, scores de test global',source:'Crédit UCI · expérience B3',url:'https://github.com/sogoyou8/BANK-360/blob/main/docs/B3-validation-finale.md'},
 {name:'Détection de fraude',description:'Simulation PaySim et validation chronologique B4',source:'PaySim · expérience B4',url:'https://github.com/sogoyou8/BANK-360/blob/main/docs/B4-validation-finale.md'}
];
export default function CrossGovernanceWorkspace({filters,fraud,onReset,theme,onTheme,checks,onAnalysis}:Props){
 const [format,setFormat]=useState<ExportFormat>('csv');
 const [selected,setSelected]=useState<string|null>(null);
 const [scope,setScope]=useState<'all'|'credit'|'fraud'>('all');
 const fraudExportRows=fraud.channel!=='Tous'?fraudTypes.filter(x=>x.type===fraud.channel):
  fraud.day!=='Tous'?fraudDays.filter(x=>String(x.day)===fraud.day):fraudTypes;
 const isCreditFiltered=Object.values(filters).some(x=>x!=='Tout');
 const isFraudFiltered=fraud.day!=='Tous'||fraud.channel!=='Tous';
 const creditSelection=filteredSegments(filters);
 const selectedCreditDossiers=creditSelection.reduce((total,row)=>total+row.client_count,0);
 const selectedCreditDefaults=creditSelection.reduce((total,row)=>total+row.default_count,0);
 const selectedFraud=fraud.channel!=='Tous'?fraudTypes.find(x=>x.type===fraud.channel):
  fraud.day!=='Tous'?fraudDays.find(x=>String(x.day)===fraud.day):undefined;
 const selectedFraudLabel=fraud.channel!=='Tous'?fraud.channel:'J'+fraud.day;
 const exportItems=useMemo(()=>[
  {id:'portfolio',name:'Portefeuille agrégé',source:'Crédit · UCI',dataset:{name:'bank360-x1-portefeuille',columns:['age_band','credit_limit_band','september_status','client_count','default_count','delayed_count','total_credit_limit_ntd','total_age_years'],rows:filteredSegments(filters).map(r=>({...r}))} as ReportDataset},
  {id:'payments',name:'Paiements · six mois',source:'Crédit · UCI',dataset:{name:'bank360-x1-paiements',columns:['period','observations','delayed','rate'],rows:paymentSeries(filters).map(r=>({...r}))} as ReportDataset},
  {id:'alerts',name:'Alertes PaySim sélectionnées',source:'Fraude · PaySim simulé · '+(fraud.channel!=='Tous'?fraud.channel:fraud.day!=='Tous'?'J'+fraud.day:'Types du test'),dataset:{name:'bank360-x1-alertes',columns:['group','transactions','frauds','alerts','tp','fp','fn','tn','precision','recall'],rows:fraudExportRows.map(r=>({group:'day' in r?'J'+r.day:r.type,transactions:r.transactions,frauds:r.frauds,alerts:r.alerts,tp:r.tp,fp:r.fp,fn:r.fn,tn:r.tn,precision:r.alerts?r.tp/r.alerts:0,recall:r.frauds?r.tp/r.frauds:0}))} as ReportDataset}
 ],[filters,fraud.channel,fraud.day]);
 const controls=[
  {id:'credit',label:'Dossiers et défauts',info:fmtInt(checks.population)+' dossiers · '+fmtInt(checks.defaults)+' défauts',ok:checks.creditOK,from:'powerbi/data/uci350_segments.csv',rule:'Total dossiers = 30 000 ; total défauts = 6 636',observed:'Dossiers : '+fmtInt(checks.population)+' ; défauts : '+fmtInt(checks.defaults)},
  {id:'payments',label:'Historique de paiement',info:fmtInt(checks.paymentObservations)+' observations répétées · '+fmtInt(checks.paymentRows)+' groupes mensuels',ok:checks.paymentOK,from:'powerbi/data/uci350_payment_months.csv',rule:'6 mois contenant chacun 30 000 observations des mêmes dossiers',observed:'Mois : '+fmtInt(paymentSeries({age:'Tout',limit:'Tout',status:'Tout'}).length)+' ; observations : '+fmtInt(checks.paymentObservations)},
  {id:'fraud',label:'Transactions simulées',info:fmtInt(b4.observed.rows)+' transactions · '+fmtInt(b4.observed.frauds)+' fraudes simulées',ok:checks.fraudOK,from:'reports/b4/B4-metrics.json',rule:'Simulation attendue : 6 362 620 opérations et 8 213 fraudes',observed:'Opérations : '+fmtInt(b4.observed.rows)+' ; fraudes : '+fmtInt(b4.observed.frauds)},
  {id:'models',label:'Évaluation des modèles',info:'B3 et B4 · expériences de test',ok:checks.modelsOK,from:'reports/b3/B3-metrics.json + reports/b4/B4-metrics.json',rule:'Les deux rapports fournissent une PR-AUC de test supérieure à zéro',observed:'B3 : '+b3.holdout_test_metrics.pr_auc.toFixed(3)+' ; B4 : '+b4.holdout_test.pr_auc.toFixed(3)}
 ];
 const qualityOk=controls.every(x=>x.ok);
 const visibleControls=controls.filter(x=>scope==='all'||x.id==='models'||(scope==='credit'?(x.id==='credit'||x.id==='payments'):x.id==='fraud'));
 const visibleExports=exportItems.filter(x=>scope==='all'||(scope==='credit'?x.id!=='alerts':x.id==='alerts'));
 const visibleDocs=docs.filter(x=>scope==='all'||(scope==='credit'?x.source.includes('UCI'):x.source.includes('PaySim')));
 const relevantCounts=scope==='all'?[
  [isCreditFiltered?'Dossiers UCI · sélection':'Dossiers UCI · total historique',fmtInt(isCreditFiltered?selectedCreditDossiers:checks.population)],
  [isFraudFiltered?'PaySim · '+selectedFraudLabel+' · test':'Opérations PaySim · simulation totale',fmtInt(isFraudFiltered?(selectedFraud?.transactions??0):b4.observed.rows)]
 ]:scope==='credit'?[
  [isCreditFiltered?'Dossiers · sélection UCI':'Dossiers · historique UCI',fmtInt(isCreditFiltered?selectedCreditDossiers:checks.population)],
  [isCreditFiltered?'Défauts · sélection UCI':'Défauts · historique UCI',fmtInt(isCreditFiltered?selectedCreditDefaults:checks.defaults)]
 ]:[
  [isFraudFiltered?'Transactions · '+selectedFraudLabel+' · test':'Opérations · simulation totale',fmtInt(isFraudFiltered?(selectedFraud?.transactions??0):b4.observed.rows)],
  [isFraudFiltered?'Fraudes · '+selectedFraudLabel+' · test':'Fraudes · simulation totale',fmtInt(isFraudFiltered?(selectedFraud?.frauds??0):b4.observed.frauds)]
 ];
 return <div className="x1-root x1-governance" data-testid="x1-governance">
  <div className="x1-gov-toolbar"><div role="group" aria-label="Périmètre de gouvernance">{([{id:'all',label:'Toutes sources'},{id:'credit',label:'Crédit'},{id:'fraud',label:'Fraude'}] as const).map(x=><button key={x.id} aria-pressed={scope===x.id} onClick={()=>{setScope(x.id);setSelected(null)}}>{x.label}</button>)}</div><button onClick={onAnalysis}><Layers3 size={15}/> Analyse 360</button></div>
  <section className={'x1-gov-banner '+(qualityOk?'pass':'fail')}><ShieldCheck size={29}/><div><h2>{qualityOk?'Sources réconciliées':'Contrôles à examiner'}</h2><small>Contrôles globaux des sources · chiffres ajustés aux filtres actifs, si présents.</small></div><span><b>{visibleControls.filter(x=>x.ok).length} / {visibleControls.length}</b><small>Contrôles du périmètre</small></span>{relevantCounts.map(([label,value])=><span key={label}><b>{value}</b><small>{label}</small></span>)}</section>
  <div className="x1-gov-grid">
   <section className="x1-card x1-gov-quality"><div className="x1-card-head"><div><h2>Qualité & preuves</h2><small>Inspecter les contrôles de cohérence réels</small></div><CheckCircle2 size={19}/></div>
    <div className="x1-gov-rows">{visibleControls.map(x=><button key={x.id} aria-expanded={selected===x.id} onClick={()=>setSelected(selected===x.id?null:x.id)} className="x1-proof-row">
      <span className="x1-icon"><ShieldCheck size={19}/></span><span className="x1-proof-copy"><b>{x.label}</b><small>{x.info}</small>{selected===x.id&&<span className="x1-proof-details"><em><strong>Règle vérifiée</strong> {x.rule}</em><em><strong>Mesuré</strong> {x.observed}</em><em><strong>Provenance</strong> {x.from}</em><em>Contrôle de cohérence d'agrégats, et non certification bancaire.</em></span>}</span><span className={x.ok?'x1-ok':'x1-bad'}>{x.ok?'Conforme':'À examiner'}</span>
    </button>)}</div>
    <div className="x1-proof-footer"><Info size={14}/> Contrôles d'agrégats, pas certification bancaire.</div>
   </section>
   <section className="x1-card x1-gov-methods"><div className="x1-card-head"><div><h2>Méthodologies et provenance</h2><small>Documents de validation existants B2, B3, B4</small></div><BookOpen size={19}/></div>
    <div className="x1-gov-rows">{visibleDocs.map(x=><a key={x.name} href={x.url} target="_blank" rel="noopener noreferrer" className="x1-method-link"><span className="x1-icon"><BookOpen size={18}/></span><span><b>{x.name}</b><small>{x.description}</small></span><ArrowUpRight size={18}/></a>)}</div>
    <div className="x1-proof-footer"><Database size={14}/> Sources : <a href="https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients" target="_blank" rel="noopener noreferrer">UCI 2005</a> · <a href="https://www.kaggle.com/datasets/ealaxi/paysim1" target="_blank" rel="noopener noreferrer">PaySim (simulation)</a></div>
   </section>
   <section className="x1-card x1-gov-exports"><div className="x1-card-head"><div><h2>Centre d'exports</h2><small>Fichiers réels, groupes filtrés selon la source</small></div><label>Format <select aria-label="Format export Gouvernance" value={format} onChange={e=>setFormat(e.target.value as ExportFormat)}><option value="csv">CSV</option><option value="xlsx">XLSX</option></select></label></div>
    <div className="x1-gov-rows">{visibleExports.map(x=><div className="x1-export-row" key={x.id}><span className="x1-icon"><FileText size={18}/></span><span><b>{x.name}</b><small>{x.source} · {fmtInt(x.dataset.rows.length)} lignes agrégées</small></span><button aria-label={'Télécharger '+x.name} onClick={()=>exportReport(x.dataset,format)}><Download size={18}/></button></div>)}</div>
    <div className="x1-proof-footer"><Info size={14}/> {isCreditFiltered||isFraudFiltered?'Exports basés sur les filtres actifs de l’analyse.':'Données indépendantes : aucune jointure de dossiers et transactions.'}</div>
   </section>
   <section className="x1-card x1-gov-settings"><div className="x1-card-head"><div><h2>Préférences et limites</h2><small>Réglages existants de l'application</small></div><Settings2 size={19}/></div>
    <div className="x1-setting-row"><span><b>Apparence</b><small>{theme==='dark'?'Sombre':'Clair'}</small></span><button onClick={onTheme}>Changer</button></div>
    <div className="x1-setting-row"><span><b>Filtres Crédit</b><small>{Object.values(filters).some(x=>x!=='Tout')?'Sélection active':'Tous les âges · tous les plafonds'}</small></span><button onClick={onReset}>Réinitialiser</button></div>
    <div className="x1-limit-text"><CircleAlert size={15}/><span>Pas de décisions de crédit, ni d'alertes opérationnelles. Les modèles B3/B4 sont des évaluations de test non recalculées sur les segments.</span></div>
   </section>
  </div>
 </div>;
}
