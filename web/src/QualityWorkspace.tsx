import React,{useEffect,useMemo,useRef,useState} from 'react';
import {
 Activity,ArrowRightLeft,ArrowUpRight,BarChart3,Check,CheckCircle2,ChevronRight,
 CircleAlert,CreditCard,Database,FileText,Fingerprint,Info,LayoutDashboard,
 Settings2,Shield,ShieldCheck,X
} from 'lucide-react';
import {b3,b4,fmtInt,type reconcile} from './data';
import './quality-workspace.css';

type QualityChecks=ReturnType<typeof reconcile>;
type QualityScope='all'|'credit'|'fraud';
type QualityPerspective='overview'|'controls'|'sources'|'limits';
type QualityStatus='passed'|'failed'|'unknown';
type QualitySource='credit'|'fraud'|'both';
type QualityItem={
 id:string;name:string;subtitle:string;scope:QualitySource;status:QualityStatus;
 file:string;criterion:string;observed:string;expected:string;meaning:string;
 icon:typeof FileText;
};
const UCI_URL='https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients';
const PAYSIM_URL='https://www.kaggle.com/datasets/ealaxi/paysim1';
const perspectives:[
 {id:QualityPerspective;label:string;icon:typeof FileText},
 ...{id:QualityPerspective;label:string;icon:typeof FileText}[]
]=[
 {id:'overview',label:'Vue globale',icon:BarChart3},
 {id:'controls',label:'Contrôles',icon:ShieldCheck},
 {id:'sources',label:'Sources',icon:Database},
 {id:'limits',label:'Limites',icon:Info}
];
const scopes:[
 {id:QualityScope;label:string;icon:typeof FileText},
 ...{id:QualityScope;label:string;icon:typeof FileText}[]
]=[
 {id:'credit',label:'Crédit',icon:FileText},
 {id:'fraud',label:'Fraude',icon:CreditCard},
 {id:'all',label:'Toutes sources',icon:Database}
];
function StatusIcon({state}:{state:QualityStatus}){
 return state==='passed'?<Check size={18}/>:state==='failed'?<CircleAlert size={18}/>:<Info size={18}/>;
}
function buildEvidence(checks:QualityChecks):QualityItem[]{
 const creditRate=b3.holdout_test_metrics.pr_auc;
 const fraudRate=b4.holdout_test.pr_auc;
 return [
  {
   id:'credit',name:'Dossiers et défauts',subtitle:fmtInt(checks.population)+' dossiers · '+fmtInt(checks.defaults)+' défauts',
   scope:'credit',status:checks.creditOK?'passed':'failed',icon:FileText,
   file:'powerbi/data/uci350_segments.csv',
   criterion:'Total des dossiers = 30 000 et total des défauts = 6 636, calculés sur les segments agrégés UCI.',
   observed:fmtInt(checks.population)+' dossiers · '+fmtInt(checks.defaults)+' défauts',
   expected:'30 000 dossiers · 6 636 défauts',
   meaning:'Vérification d’égalité des totaux agrégés, et non audit des dossiers individuels.'
  },
  {
   id:'payments',name:'Historique de paiement',subtitle:fmtInt(checks.paymentObservations)+' observations',
   scope:'credit',status:checks.paymentOK?'passed':'failed',icon:BarChart3,
   file:'powerbi/data/uci350_payment_months.csv',
   criterion:'Six périodes mensuelles d’avril à septembre 2005, chacune avec 30 000 observations.',
   observed:fmtInt(checks.paymentObservations)+' observations · '+fmtInt(checks.paymentRows)+' groupes mensuels',
   expected:'180 000 observations sur 6 mois (30 000 par mois)',
   meaning:'Les observations mensuelles sont répétées sur les mêmes dossiers. Elles ne représentent pas 180 000 clients distincts.'
  },
  {
   id:'fraud',name:'Transactions simulées',subtitle:fmtInt(b4.observed.rows)+' opérations',
   scope:'fraud',status:checks.fraudOK?'passed':'failed',icon:ArrowRightLeft,
   file:'reports/b4/B4-metrics.json',
   criterion:'Volume PaySim attendu de 6 362 620 transactions simulées et 8 213 fraudes simulées.',
   observed:fmtInt(b4.observed.rows)+' opérations · '+fmtInt(b4.observed.frauds)+' fraudes simulées',
   expected:'6 362 620 opérations · 8 213 fraudes',
   meaning:'Réconciliation des métadonnées disponibles du jeu simulé. Ce contrôle ne prouve pas la validité de transactions réelles.'
  },
  {
   id:'models',name:'Évaluation des modèles',subtitle:'Rapports expérimentaux disponibles',
   scope:'both',status:checks.modelsOK?'passed':'failed',icon:Settings2,
   file:'reports/b3/B3-metrics.json · reports/b4/B4-metrics.json',
   criterion:'Les métriques PR-AUC rapportées dans les résultats B3 et B4 doivent être strictement positives.',
   observed:'B3 PR-AUC test : '+creditRate.toFixed(3).replace('.',',')+' · B4 PR-AUC test : '+fraudRate.toFixed(3).replace('.',','),
   expected:'Deux valeurs PR-AUC test présentes et strictement positives',
   meaning:'Présence et cohérence minimale des métriques expérimentales ; cela ne démontre ni calibration suffisante, ni conformité, ni aptitude à une décision bancaire.'
  }
 ];
}
function QualityCheckDetail({item,onClose}:{item:QualityItem;onClose:()=>void}){
 const closer=useRef<HTMLButtonElement>(null);
 const dialogRef=useRef<HTMLElement>(null);
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  closer.current?.focus();
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose();return;}
   if(event.key!=='Tab')return;
   const options=[...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')??[])];
   if(!options.length){event.preventDefault();return;}
   const first=options[0],last=options[options.length-1];
   if(event.shiftKey && (document.activeElement===first || !dialogRef.current?.contains(document.activeElement))){
    event.preventDefault();last.focus();
   } else if(!event.shiftKey && (document.activeElement===last || !dialogRef.current?.contains(document.activeElement))){
    event.preventDefault();first.focus();
   }
  };
  window.addEventListener('keydown',key);
  return()=>{window.removeEventListener('keydown',key);previous?.focus();};
 },[onClose]);
 const Row=({term,value}:{term:string;value:string})=><div className="qw-evidence-row"><dt>{term}</dt><dd>{value}</dd></div>;
 return <div className="qw-dialog-layer" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
  <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="qw-dialog-title" aria-describedby="qw-dialog-desc" className="qw-dialog">
   <div className="qw-dialog-top"><div className="qw-icon"><item.icon size={25}/></div><div><span>Inspection du contrôle</span><h2 id="qw-dialog-title">{item.name}</h2></div><button ref={closer} aria-label="Fermer le détail" onClick={onClose}><X size={20}/></button></div>
   <p id="qw-dialog-desc" className="qw-dialog-intro">{item.meaning}</p>
   <div className={'qw-result qw-result-'+item.status}><StatusIcon state={item.status}/>{item.status==='passed'?'Contrôle conforme':item.status==='failed'?'Contrôle à examiner':'Contrôle indisponible'}</div>
   <dl className="qw-evidence">
    <Row term="Périmètre" value={item.scope==='credit'?'Crédit · UCI 2005':item.scope==='fraud'?'Fraude · PaySim simulé':'Modèles B3 / B4 · sources indépendantes'}/>
    <Row term="Preuve utilisée" value={item.file}/>
    <Row term="Critère" value={item.criterion}/>
    <Row term="Valeur observée" value={item.observed}/>
    <Row term="Valeur attendue" value={item.expected}/>
   </dl>
   <div className="qw-dialog-bottom"><Info size={16}/> Analyse descriptive sur données historiques et simulées, sans décision opérationnelle.</div>
   <div className="qw-dialog-actions"><button type="button" onClick={onClose}>Fermer l’inspection</button></div>
  </section>
 </div>;
}
export default function QualityWorkspace({checks}:{checks:QualityChecks}){
 const [scope,setScope]=useState<QualityScope>('all');
 const [perspective,setPerspective]=useState<QualityPerspective>('overview');
 const [detail,setDetail]=useState<QualityItem|null>(null);
 const items=useMemo(()=>buildEvidence(checks),[checks.creditOK,checks.paymentOK,checks.fraudOK,checks.modelsOK,checks.population,checks.defaults,checks.paymentObservations,checks.paymentRows]);
 const selected=items.filter(item=>scope==='all'||item.scope===scope||item.scope==='both').map(item=>{
  if(item.id!=='models'||scope==='all')return item;
  const isCredit=scope==='credit';
  const metric=isCredit?b3.holdout_test_metrics.pr_auc:b4.holdout_test.pr_auc;
  return {...item,scope,status:metric>0?'passed' as const:'failed' as const,
   file:isCredit?'reports/b3/B3-metrics.json':'reports/b4/B4-metrics.json',
   criterion:'PR-AUC test déclarée et strictement positive dans le rapport expérimental '+(isCredit?'B3 (Crédit UCI).':'B4 (Fraude PaySim).'),
   observed:'PR-AUC test '+(isCredit?'B3':'B4')+' : '+metric.toFixed(3).replace('.',','),
   expected:'PR-AUC test strictement positive dans la source sélectionnée',
   meaning:'Contrôle de présence et de cohérence minimale du rapport expérimental sélectionné ; il ne certifie pas la fiabilité opérationnelle du modèle.'
  };
 });
 const passed=selected.filter(item=>item.status==='passed').length;
 const isGood=selected.length>0&&passed===selected.length;
 const uciscoped=scope!=='fraud',fraudscoped=scope!=='credit';
 const limits=[
  {id:'records',label:'Aucun dossier individuel ni transaction brute dans l’interface.',scope:'all'},
  {id:'operational',label:'Pas de décisions de crédit ni d’alertes opérationnelles.',scope:'all'},
  {id:'drift',label:'Les résultats de fraude sont sensibles à une dérive chronologique.',scope:'fraud'}
 ].filter(x=>scope!=='credit'||x.scope!=='fraud');
 const sourceCards=[
  {id:'credit',icon:Database,title:'Portefeuille de crédit',description:'UCI · Taïwan, 2005 · données historiques',url:UCI_URL,proof:'powerbi/data/uci350_segments.csv · uci350_payment_months.csv'},
  {id:'fraud',icon:Shield,title:'Fraude · paiements mobiles',description:'PaySim · transactions entièrement simulées',url:PAYSIM_URL,proof:'reports/b4/B4-metrics.json · simulation PaySim'}
 ].filter(x=>scope==='all'||x.id===scope);
 const perspectiveDescriptions:Record<QualityPerspective,string>={
  overview:'Synthèse des contrôles, des sources et des limites.',
  controls:'Inspection des critères et résultats de chaque contrôle.',
  sources:'Origine et fichiers de référence des deux jeux indépendants.',
  limits:'Contraintes méthodologiques et périmètre d’utilisation.'
 };
 const scopeDescriptions:Record<QualityScope,string>={
  all:'UCI historique et PaySim simulé : contrôles indépendants.',
  credit:'Crédit : agrégats UCI 2005 et rapport expérimental B3 uniquement.',
  fraud:'Fraude : métadonnées PaySim simulées et rapport expérimental B4 uniquement.'
 };
 return <section className={'qw-root qw-perspective-'+perspective+' qw-scope-'+scope} aria-label="Qualité et traçabilité" data-testid="quality-workspace">
  <header className="qw-header">
   <div className="qw-head-top">
    <div className="qw-heading"><div className="qw-heading-main"><span className="qw-overline">GOUVERNANCE</span><h1>Qualité &amp; traçabilité</h1></div><p>Contrôles de qualité, provenance et limites d’utilisation des données.</p></div>
    <div className="qw-scope-tabs" role="group" aria-label="Sources analysées">
     {scopes.map(x=><button type="button" key={x.id} aria-pressed={scope===x.id} className={scope===x.id?'is-active':''} onClick={()=>{setScope(x.id);setDetail(null)}}><x.icon size={18}/>{x.label}</button>)}
    </div>
   </div>
   <nav className="qw-perspective-tabs" aria-label="Perspectives Qualité" role="tablist">
    {perspectives.map(x=><button type="button" role="tab" key={x.id} aria-selected={perspective===x.id} className={perspective===x.id?'is-active':''} onClick={()=>setPerspective(x.id)}><x.icon size={19}/><span>{x.label}</span></button>)}
   </nav>
  </header>
  <div className={'qw-reconciliation '+(isGood?'is-reconciled':'is-review')} role="status" aria-label="État de réconciliation">
   <div className="qw-reconciliation-heading">
    <div className="qw-main-shield">{isGood?<ShieldCheck size={38}/>:<CircleAlert size={38}/>}</div>
    <div><h2>{isGood?'Sources réconciliées':'Contrôles à examiner'}</h2><p>{isGood?'Les contrôles de cohérence et de traçabilité sont conformes.':selected.length-passed+' contrôle(s) du périmètre nécessitent une vérification.'}</p></div>
   </div>
   <div className="qw-reconciliation-kpis" aria-label="Indicateurs de qualité">
    {uciscoped&&<div><FileText size={24}/><span><strong>{fmtInt(checks.population)}</strong><small>dossiers historiques</small></span></div>}
    {fraudscoped&&<div><ArrowRightLeft size={25}/><span><strong>{fmtInt(b4.observed.rows)}</strong><small>transactions simulées</small></span></div>}
    <div><CheckCircle2 size={26}/><span><strong>{passed}</strong><small>contrôles conformes{scope==='all'?'':' / '+selected.length}</small></span></div>
   </div>
  </div>
  <div className="qw-grid" data-testid="quality-grid" aria-label={perspectiveDescriptions[perspective]}>
   <section className="qw-panel qw-checks-panel" aria-label="Contrôles des agrégats">
    <div className="qw-panel-heading"><div className="qw-panel-icon"><Settings2 size={25}/></div><div><h2>Contrôles des agrégats</h2><p>Vérifications de la qualité et de la cohérence des données</p></div></div>
    <div className={'qw-check-list qw-check-count-'+selected.length}>
     {selected.map(item=><button type="button" key={item.id} className="qw-check-card" onClick={()=>setDetail(item)} aria-label={'Inspecter le contrôle '+item.name} data-testid={'quality-check-'+item.id}>
      <span className="qw-card-icon"><item.icon size={26}/></span>
      <span className="qw-check-copy"><strong>{item.name}</strong><small>{item.subtitle}</small></span>
      <span className={'qw-status-pill '+(item.status==='passed'?'qw-status-good':'qw-status-review')}><StatusIcon state={item.status}/>{item.status==='passed'?'Conforme':item.status==='failed'?'À examiner':'Indisponible'}</span>
      <ChevronRight size={21} className="qw-chevron"/>
     </button>)}
    </div>
    {selected.length<4&&<p className="qw-scope-note" data-testid="quality-scope-note"><Info size={14}/>{scopeDescriptions[scope]}</p>}
    {perspective==='controls'&&<div className="qw-perspective-info" data-testid="quality-controls-focus"><ShieldCheck size={15}/>{passed} contrôle(s) conformes sur {selected.length} · Cliquez sur une carte pour consulter le critère, la mesure et la source.</div>}
   </section>
   <section className="qw-panel qw-sources-panel" aria-label="Provenance">
    <div className="qw-panel-heading"><div className="qw-panel-icon"><Database size={25}/></div><div><h2>Provenance</h2><p>Origine et nature des sources de données</p></div></div>
    <div className={'qw-source-list '+(sourceCards.length===1?'qw-one-source':'')}>
     {sourceCards.map(item=><a key={item.id} href={item.url} target="_blank" rel="noreferrer noopener" className="qw-source-card" aria-label={'Ouvrir la source '+item.title}>
      <span className={'qw-card-icon '+(item.id==='fraud'?'qw-source-fraud':'')}><item.icon size={27}/></span>
      <span className="qw-source-copy"><span className="qw-source-line"><strong>{item.title}</strong>{item.id==='credit'&&<em>Source principale</em>}</span><small>{item.description}</small>{perspective==='sources'&&<span className="qw-source-proof">{item.proof}</span>}</span>
      <span className="qw-open-source"><ArrowUpRight size={22}/></span>
     </a>)}
    </div>
    {perspective==='sources'&&<p className="qw-perspective-info" data-testid="quality-sources-focus"><Database size={15}/>Sources historiques UCI et simulées PaySim, sans rapprochement de données individuelles.</p>}
   </section>
   <section className="qw-panel qw-limits-panel" aria-label="Limites d’utilisation">
    <div className="qw-panel-heading"><div className="qw-panel-icon"><Info size={25}/></div><div><h2>Limites d’utilisation</h2><p>Contraintes et périmètre d’usage des données</p></div></div>
    <div className="qw-limits-list">{limits.map(limit=><div key={limit.id}><Info size={19}/><span>{limit.label}</span></div>)}</div>
    {perspective==='limits'&&<p className="qw-perspective-info" data-testid="quality-limits-focus"><CircleAlert size={15}/>{scope==='credit'?'Périmètre historique UCI : aucune décision réelle de crédit.':scope==='fraud'?'PaySim est simulé ; la dérive chronologique limite la généralisation.':'Données historiques ou simulées : aucun usage bancaire opérationnel.'}</p>}
   </section>
  </div>
  {detail&&<QualityCheckDetail item={detail} onClose={()=>setDetail(null)}/>}
 </section>;
}
