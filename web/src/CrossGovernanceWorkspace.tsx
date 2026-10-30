import {useMemo,useState} from 'react';
import {Activity,ArrowUpRight,BookOpen,CheckCircle2,CircleAlert,Database,Download,FileText,Info,Layers3,Settings2,ShieldCheck,Wallet} from 'lucide-react';
import {b3,b4,filteredSegments,paymentSeries,fraudTypes,fmtInt,initialFilters,type CreditFilters,type reconcile} from './data';
import {exportReport,type ExportFormat,type ReportDataset} from './reportExports';
import './cross-analysis.css';

type Props={filters:CreditFilters,onReset:()=>void,theme:'dark'|'light',onTheme:()=>void,checks:ReturnType<typeof reconcile>,onAnalysis:()=>void};
const docs=[
 {name:'Analyse du portefeuille',description:'Segmentation et agrégats historiques UCI',source:'Crédit UCI · historique 2005',url:'https://github.com/sogoyou8/BANK-360/blob/main/docs/B2-validation-finale.md'},
 {name:'Évaluation du risque',description:'Modèles et validation B3, scores de test global',source:'Crédit UCI · expérience B3',url:'https://github.com/sogoyou8/BANK-360/blob/main/docs/B3-validation-finale.md'},
 {name:'Détection de fraude',description:'Simulation PaySim et validation chronologique B4',source:'PaySim · expérience B4',url:'https://github.com/sogoyou8/BANK-360/blob/main/docs/B4-validation-finale.md'}
];
export default function CrossGovernanceWorkspace({filters,onReset,theme,onTheme,checks,onAnalysis}:Props){
 const [format,setFormat]=useState<ExportFormat>('csv');
 const [selected,setSelected]=useState<string|null>(null);
 const [scope,setScope]=useState<'all'|'credit'|'fraud'>('all');
 const exportItems=useMemo(()=>[
  {id:'portfolio',name:'Portefeuille agrégé',source:'Crédit · UCI',dataset:{name:'bank360-x1-portefeuille',columns:['age_band','credit_limit_band','september_status','client_count','default_count','delayed_count','total_credit_limit_ntd','total_age_years'],rows:filteredSegments(filters).map(r=>({...r}))} as ReportDataset},
  {id:'payments',name:'Paiements · six mois',source:'Crédit · UCI',dataset:{name:'bank360-x1-paiements',columns:['period','observations','delayed','rate'],rows:paymentSeries(filters).map(r=>({...r}))} as ReportDataset},
  {id:'alerts',name:'Alertes par type',source:'Fraude · PaySim simulé',dataset:{name:'bank360-x1-alertes',columns:['type','transactions','frauds','alerts','tp','fp','fn','tn','precision','recall'],rows:fraudTypes.map(r=>({...r}))} as ReportDataset}
 ],[filters]);
 const controls=[
  {id:'credit',label:'Dossiers et défauts',info:fmtInt(checks.population)+' dossiers · '+fmtInt(checks.defaults)+' défauts',ok:checks.creditOK,from:'powerbi/data/uci350_segments.csv'},
  {id:'payments',label:'Historique de paiement',info:fmtInt(checks.paymentObservations)+' observations répétées · '+fmtInt(checks.paymentRows)+' groupes mensuels',ok:checks.paymentOK,from:'powerbi/data/uci350_payment_months.csv'},
  {id:'fraud',label:'Transactions simulées',info:fmtInt(b4.observed.rows)+' transactions · '+fmtInt(b4.observed.frauds)+' fraudes simulées',ok:checks.fraudOK,from:'reports/b4/B4-metrics.json'},
  {id:'models',label:'Évaluation des modèles',info:'B3 et B4 · expériences de test',ok:checks.modelsOK,from:'reports/b3/B3-metrics.json + reports/b4/B4-metrics.json'}
 ];
 const qualityOk=controls.every(x=>x.ok);
 const visibleControls=controls.filter(x=>scope==='all'||x.id==='models'||(scope==='credit'?(x.id==='credit'||x.id==='payments'):x.id==='fraud'));
 const visibleExports=exportItems.filter(x=>scope==='all'||(scope==='credit'?x.id!=='alerts':x.id==='alerts'));
 const visibleDocs=docs.filter(x=>scope==='all'||(scope==='credit'?x.source.includes('UCI'):x.source.includes('PaySim')));
 return <div className="x1-root x1-governance" data-testid="x1-governance">
  <div className="x1-gov-toolbar"><div role="group" aria-label="Périmètre de gouvernance">{([{id:'all',label:'Toutes sources'},{id:'credit',label:'Crédit'},{id:'fraud',label:'Fraude'}] as const).map(x=><button key={x.id} aria-pressed={scope===x.id} onClick={()=>{setScope(x.id);setSelected(null)}}>{x.label}</button>)}</div><button onClick={onAnalysis}><Layers3 size={15}/> Analyse 360</button></div>
  <section className={'x1-gov-banner '+(qualityOk?'pass':'fail')}><ShieldCheck size={29}/><div><h2>{qualityOk?'Sources réconciliées':'Contrôles à examiner'}</h2><small>Vérifications indépendantes des agrégats historiques UCI et simulés PaySim.</small></div><span><b>{visibleControls.filter(x=>x.ok).length} / {visibleControls.length}</b><small>Contrôles du périmètre</small></span><span><b>{fmtInt(checks.population)}</b><small>Dossiers historiques UCI</small></span><span><b>{fmtInt(b4.observed.rows)}</b><small>Transactions PaySim simulées</small></span></section>
  <div className="x1-gov-grid">
   <section className="x1-card x1-gov-quality"><div className="x1-card-head"><div><h2>Qualité & preuves</h2><small>Inspecter les contrôles de cohérence réels</small></div><CheckCircle2 size={19}/></div>
    <div className="x1-gov-rows">{visibleControls.map(x=><button key={x.id} aria-expanded={selected===x.id} onClick={()=>setSelected(selected===x.id?null:x.id)} className="x1-proof-row">
      <span className="x1-icon"><ShieldCheck size={19}/></span><span className="x1-proof-copy"><b>{x.label}</b><small>{x.info}</small>{selected===x.id&&<em>Source : {x.from} · Résultat : {x.ok?'conforme':'non conforme'} · Critère déclaré dans le contrôle reconcile()</em>}</span><span className={x.ok?'x1-ok':'x1-bad'}>{x.ok?'Conforme':'À examiner'}</span>
    </button>)}</div>
    <div className="x1-proof-footer"><Info size={14}/> Contrôles d'agrégats, pas certification bancaire.</div>
   </section>
   <section className="x1-card x1-gov-methods"><div className="x1-card-head"><div><h2>Méthodologies et provenance</h2><small>Documents de validation existants B2, B3, B4</small></div><BookOpen size={19}/></div>
    <div className="x1-gov-rows">{visibleDocs.map(x=><a key={x.name} href={x.url} target="_blank" rel="noopener noreferrer" className="x1-method-link"><span className="x1-icon"><BookOpen size={18}/></span><span><b>{x.name}</b><small>{x.description}</small></span><ArrowUpRight size={18}/></a>)}</div>
    <div className="x1-proof-footer"><Database size={14}/> Sources : <a href="https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients" target="_blank" rel="noopener noreferrer">UCI 2005</a> · <a href="https://www.kaggle.com/datasets/ealaxi/paysim1" target="_blank" rel="noopener noreferrer">PaySim (simulation)</a></div>
   </section>
   <section className="x1-card x1-gov-exports"><div className="x1-card-head"><div><h2>Centre d'exports</h2><small>Fichiers réels, groupes filtrés selon la source</small></div><label>Format <select aria-label="Format export Gouvernance" value={format} onChange={e=>setFormat(e.target.value as ExportFormat)}><option value="csv">CSV</option><option value="xlsx">XLSX</option></select></label></div>
    <div className="x1-gov-rows">{visibleExports.map(x=><div className="x1-export-row" key={x.id}><span className="x1-icon"><FileText size={18}/></span><span><b>{x.name}</b><small>{x.source} · {fmtInt(x.dataset.rows.length)} lignes agrégées</small></span><button aria-label={'Télécharger '+x.name} onClick={()=>exportReport(x.dataset,format)}><Download size={18}/></button></div>)}</div>
    <div className="x1-proof-footer"><Info size={14}/> Données indépendantes : aucune jointure de dossiers et transactions.</div>
   </section>
   <section className="x1-card x1-gov-settings"><div className="x1-card-head"><div><h2>Préférences et limites</h2><small>Réglages existants de l'application</small></div><Settings2 size={19}/></div>
    <div className="x1-setting-row"><span><b>Apparence</b><small>{theme==='dark'?'Sombre':'Clair'}</small></span><button onClick={onTheme}>Changer</button></div>
    <div className="x1-setting-row"><span><b>Filtres Crédit</b><small>{Object.values(filters).some(x=>x!=='Tout')?'Sélection active':'Tous les âges · tous les plafonds'}</small></span><button onClick={onReset}>Réinitialiser</button></div>
    <div className="x1-limit-text"><CircleAlert size={15}/><span>Pas de décisions de crédit, ni d'alertes opérationnelles. Les modèles B3/B4 sont des évaluations de test non recalculées sur les segments.</span></div>
   </section>
  </div>
 </div>;
}
