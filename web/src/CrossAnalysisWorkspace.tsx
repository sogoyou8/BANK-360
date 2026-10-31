import {useEffect,useMemo,useRef,useState} from 'react';
import {Activity,ArrowLeftRight,BarChart3,CheckCircle2,Database,Download,FilterX,Info,Layers3,ShieldAlert,ShieldCheck,Wallet,Maximize2,Minimize2,X,Table2,Grid3X3,ChevronRight} from 'lucide-react';
import {ages,limits,segments,b3,b4,b3Deciles,b4Deciles,fraudDays,fraudTypes,filteredSegments,groupSegments,creditTotals,paymentSeries,fmtInt,fmtPct,fmtNtd,initialFilters,type CreditFilters} from './data';
import {exportReport,type ExportFormat,type ReportDataset} from './reportExports';
import {type FraudScope} from './FraudWorkspace';
import {creditDrivers,creditCalibration,creditAudit,driverLabels} from './riskEvidence';
import './cross-analysis.css';

type Props={filters:CreditFilters,onFilters:(next:CreditFilters)=>void,fraud:FraudScope,onFraud:(next:FraudScope)=>void,onGovernance:()=>void};
type Detail='credit'|'fraud';
type InspectTab='data'|'monthly'|'models'|'compare';
type ModelTab='ranking'|'deciles'|'variables'|'calibration'|'groups'|'drift';
const asPct=(n:number)=>fmtPct(n,1);
const statusCodes=[...new Set(segments.map(s=>s.september_status))].sort((a,b)=>Number(a)-Number(b));
const statusLabel=(v:string)=>v==='-1'?'−1 · à jour':v==='-2'||v==='0'?v.replace('-','−')+' · non précisé':v+' · '+v+' mois';
const format3=(x:number)=>new Intl.NumberFormat('fr-FR',{minimumFractionDigits:3,maximumFractionDigits:3}).format(x);
function Card({title,note,children,extra,className=''}:{title:string,note?:string,children:React.ReactNode,extra?:React.ReactNode,className?:string}){
 return <section className={'x1-card '+className}><div className="x1-card-head"><div><h2>{title}</h2>{note&&<small>{note}</small>}</div>{extra}</div>{children}</section>;
}
function Bars({items,label,selected,onClick,max,unit='rate'}:{items:{name:string,count:number,rate:number}[],label:string,selected:string,onClick:(name:string)=>void,max:number,unit?:'rate'|'count'}){
 return <div className="x1-bars" role="group" aria-label={label}>
  {items.map(item=><button key={item.name} type="button" title={item.name+' · '+fmtInt(item.count)+' dossiers · '+asPct(item.rate)} aria-pressed={selected===item.name} onClick={()=>onClick(item.name)} className={'x1-bar '+(selected===item.name?'active':'')}>
   <b>{unit==='rate'?asPct(item.rate):fmtInt(item.count)}</b><span className="x1-bar-well"><i style={{height:Math.max(2,100*(unit==='rate'?item.rate:item.count)/max)+'%'}}/></span><small>{item.name}</small>
  </button>)}
 </div>;
}
function navigateTabs(e:React.KeyboardEvent<HTMLDivElement>){
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 const tabs=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
 const current=tabs.indexOf(document.activeElement as HTMLButtonElement);
 if(current<0||!tabs.length)return;
 e.preventDefault();
 const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(current+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
 tabs[next].focus();tabs[next].click();
}
function Kpi({label,value,detail,tone='blue'}:{label:string,value:string,detail:string,tone?:string}){return <div className={'x1-kpi x1-'+tone}><small>{label}</small><b>{value}</b><span>{detail}</span></div>}
export default function CrossAnalysisWorkspace({filters,onFilters,fraud,onFraud,onGovernance}:Props){
 const [detail,setDetail]=useState<Detail>('credit');
 const [format,setFormat]=useState<ExportFormat>('csv');
 const [selectionInfo,setSelectionInfo]=useState(false);
 const [inspectTab,setInspectTab]=useState<InspectTab>('data');
 const [expanded,setExpanded]=useState(false);
 const [modelTab,setModelTab]=useState<ModelTab>('ranking');
 const [selectedRow,setSelectedRow]=useState<string|null>(null);
 const [filterFeedback,setFilterFeedback]=useState('');
 const panelRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{setSelectedRow(null)},[filters,fraud.channel,fraud.day,detail]);
 useEffect(()=>{if(!filterFeedback)return;const timeout=window.setTimeout(()=>setFilterFeedback(''),3500);return()=>window.clearTimeout(timeout)},[filterFeedback]);
 useEffect(()=>{
  if(!expanded)return;
  const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const surface=panelRef.current;
  surface?.querySelector<HTMLButtonElement>('.x1-inspector-size')?.focus();
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();setExpanded(false);return}
   if(e.key!=='Tab'||!surface)return;
   const focusables=Array.from(surface.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])'))
    .filter(el=>el.getClientRects().length>0&&window.getComputedStyle(el).visibility!=='hidden');
   if(!focusables.length){e.preventDefault();return}
   const first=focusables[0],last=focusables[focusables.length-1];
   if(e.shiftKey&&(document.activeElement===first||!surface.contains(document.activeElement))){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&(document.activeElement===last||!surface.contains(document.activeElement))){e.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onKey);
  return()=>{document.removeEventListener('keydown',onKey);opener?.focus()};
 },[expanded]);
 const creditRows=useMemo(()=>filteredSegments(filters),[filters]);
 const credit=useMemo(()=>creditTotals(creditRows),[creditRows]);
 const ageGroups=useMemo(()=>groupSegments(filteredSegments({...filters,age:'Tout'}),'age_band'),[filters]);
 const limitGroups=useMemo(()=>groupSegments(filteredSegments({...filters,limit:'Tout'}),'credit_limit_band'),[filters]);
 const monthly=useMemo(()=>paymentSeries(filters),[filters]);
 const activeFraud=fraud.channel!=='Tous'?
  fraudTypes.find(x=>x.type===fraud.channel):
  fraud.day!=='Tous'?fraudDays.find(x=>String(x.day)===fraud.day):undefined;
 const test=b4.holdout_test;
 const fraudValues=activeFraud||{transactions:test.n,frauds:test.frauds,alerts:test.alerted,tp:test.confusion.tp,fp:test.confusion.fp,fn:test.confusion.fn};
 const fraudPrecision=fraudValues.alerts?fraudValues.tp/fraudValues.alerts:null;
 const fraudRecall=fraudValues.frauds?fraudValues.tp/fraudValues.frauds:null;
 const chooseCredit=(key:'age'|'limit'|'status',value:string)=>{
  const next={...filters,[key]:filters[key]===value?'Tout':value};
  onFilters(next);setFilterFeedback('Crédit : âge, plafond, retards et tableau recalculés ensemble.');
 };
 const chooseMatrix=(age:string,limit:string)=>{
  const selected=filters.age===age&&filters.limit===limit;
  onFilters({...filters,age:selected?'Tout':age,limit:selected?'Tout':limit});
  setDetail('credit');setFilterFeedback(selected?'Sélection retirée.':'Croisement âge × plafond actif, retards et dossiers liés.');
 };
 const creditReference=creditTotals(filteredSegments({...filters,age:'Tout',limit:'Tout'}));
 const referenceLabel=filters.status==='Tout'?'Référence · tous statuts, âges et plafonds':'Référence · même statut de septembre';
 const difference=credit.total&&creditReference.total?100*(credit.rate-creditReference.rate):null;
 const matrix=ages.map(age=>({age,cells:limits.map(limit=>{
  const t=creditTotals(filteredSegments({age,limit,status:filters.status}));
  return {...t,limitBand:limit};
 })}));
 const inspectionTitle=inspectTab==='data'?'Groupes et agrégats':inspectTab==='monthly'?'Retards dans le temps':inspectTab==='models'?'Diagnostics des modèles':'Comparaison des segments';
 const chooseChannel=(value:string)=>{onFraud({...fraud,channel:fraud.channel===value?'Tous':value,day:'Tous',kind:'all'});setFilterFeedback('Fraude : le type remplace le jour, sans croisement fictif.')};
 const chooseDay=(value:string)=>{onFraud({...fraud,day:fraud.day===value?'Tous':value,channel:'Tous',kind:'all'});setFilterFeedback('Fraude : le jour remplace le type, sans croisement fictif.')};
 const monthMax=Math.max(.01,...monthly.map(x=>x.rate));
 const ageMax=Math.max(.001,...ageGroups.map(x=>x.rate));
 const limitMax=Math.max(.001,...limitGroups.map(x=>x.rate));
 const typeMax=Math.max(1,...fraudTypes.map(x=>x.alerts));
 const dayMax=Math.max(1,...fraudDays.map(x=>x.alerts));
 const selectedFraudLabel=fraud.channel!=='Tous'?fraud.channel:fraud.day!=='Tous'?'J'+fraud.day:'Test chronologique';
 const hasCredit=Object.values(filters).some(x=>x!=='Tout');
 const hasFraud=fraud.channel!=='Tous'||fraud.day!=='Tous';
 const rows=detail==='credit'?creditRows.map((r,i)=>({key:'uci-'+i,a:r.age_band,b:r.credit_limit_band,c:statusLabel(r.september_status),d:r.client_count,e:r.default_count,f:r.client_count?r.default_count/r.client_count:null})):
 (fraud.day!=='Tous'?fraudDays.filter(x=>String(x.day)===fraud.day):fraud.channel!=='Tous'?fraudTypes.filter(x=>x.type===fraud.channel):fraudTypes.filter(x=>x.alerts>0))
 .map((r,i)=>({key:'paysim-'+i,a:'day' in r?'J'+r.day:r.type,b:r.transactions,c:r.frauds,d:r.alerts,e:r.tp,f:r.alerts?r.tp/r.alerts:null}));
 const exportCurrent=()=>{
  const ds:ReportDataset=detail==='credit'?{
   name:'bank360-x1-credit-selection',columns:['age_band','credit_limit_band','september_status','client_count','default_count','delayed_count','total_credit_limit_ntd','total_age_years'],
   rows:creditRows.map(x=>({...x}))
  }:{
   name:'bank360-x1-paysim-selection',columns:['group','transactions','frauds','alerts','tp','fp','fn','tn','precision','recall'],
   rows:(fraud.day!=='Tous'?fraudDays.filter(x=>String(x.day)===fraud.day):fraud.channel!=='Tous'?fraudTypes.filter(x=>x.type===fraud.channel):fraudTypes)
    .map(x=>({group:'day' in x?'J'+x.day:x.type,transactions:x.transactions,frauds:x.frauds,alerts:x.alerts,tp:x.tp,fp:x.fp,fn:x.fn,tn:x.tn,precision:x.alerts?x.tp/x.alerts:0,recall:x.frauds?x.tp/x.frauds:0}))
  };
  exportReport(ds,format);
 };
 return <div className="x1-root" data-testid="x1-analysis">
  <div className="x1-filterrail" aria-label="Filtres de l'analyse">
   <div className="x1-filter-group"><span className="x1-filter-domain"><Wallet size={13}/> UCI · Crédit</span>
    <label>Âge<select aria-label="Âge Analyse 360" value={filters.age} onChange={e=>onFilters({...filters,age:e.target.value})}><option value="Tout">Tous</option>{ages.map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Plafond<select aria-label="Plafond Analyse 360" value={filters.limit} onChange={e=>onFilters({...filters,limit:e.target.value})}><option value="Tout">Tous</option>{limits.map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Statut septembre<select aria-label="Statut Analyse 360" value={filters.status} onChange={e=>onFilters({...filters,status:e.target.value})}><option value="Tout">Tous</option>{statusCodes.map(x=><option value={x} key={x}>{statusLabel(x)}</option>)}</select></label>
    <button aria-label="Réinitialiser Crédit" onClick={()=>onFilters(initialFilters)} title="Réinitialiser Crédit"><FilterX size={15}/></button>
   </div>
   <div className="x1-filter-group"><span className="x1-filter-domain x1-rose"><ShieldAlert size={13}/> PaySim · Fraude</span>
    <label>Type<select aria-label="Type Analyse 360" value={fraud.channel} onChange={e=>onFraud({...fraud,channel:e.target.value,day:'Tous'})}><option value="Tous">Tous</option>{fraudTypes.filter(x=>x.alerts>0).map(x=><option key={x.type}>{x.type}</option>)}</select></label>
    <label>Jour simulé<select aria-label="Jour Analyse 360" value={fraud.day} onChange={e=>onFraud({...fraud,day:e.target.value,channel:'Tous'})}><option value="Tous">Tous</option>{fraudDays.map(x=><option key={x.day} value={String(x.day)}>J{x.day}</option>)}</select></label>
    <button aria-label="Réinitialiser Fraude" title="Réinitialiser Fraude" onClick={()=>onFraud({day:'Tous',channel:'Tous',kind:'all'})}><FilterX size={15}/></button>
   </div>
  </div>
  <div className="x1-summary">
   <div title="Nombre de dossiers de crédit historiques UCI en 2005, après les filtres Crédit"><Database size={22}/><span><b>{fmtInt(credit.total)}</b><small>Dossiers UCI · sélection</small></span></div>
   <div title="Taux de défaut : dossiers sans remboursement le mois suivant, divisés par tous les dossiers de crédit sélectionnés"><Wallet size={22}/><span><b>{credit.total?asPct(credit.rate):'—'}</b><small>Taux de défaut · {fmtInt(credit.defaults)} dossiers</small></span></div>
   <div title="Transactions de la simulation PaySim dans le périmètre de test choisi, distinctes des dossiers UCI"><ArrowLeftRight size={22}/><span><b>{fmtInt(fraudValues.transactions)}</b><small>PaySim simulé · {selectedFraudLabel}</small></span></div>
   <div title="Transactions signalées par le modèle de fraude : une alerte n'est pas nécessairement une fraude réelle"><ShieldAlert size={22}/><span><b>{fmtInt(fraudValues.alerts)}</b><small>Alertes du modèle · {selectedFraudLabel}</small></span></div>
   <button onClick={onGovernance} aria-label="Ouvrir la gouvernance et les preuves"><ShieldCheck size={18}/> Sources & preuves</button>
  </div>
  <div className="x1-analysis-grid">
   <Card className="x1-credit-panel" title="Crédit · portefeuille et paiements" note="UCI 2005 · défaut = non-paiement le mois suivant" extra={<span className="x1-scope-pill">{hasCredit?'Sélection filtrée':'30 000 dossiers historiques'}</span>}>
    <div className="x1-comparison" aria-live="polite">
     <div title="Taux de défaut : défauts du mois suivant divisés par les dossiers sélectionnés"><small>Taux de défaut · sélection</small><b>{credit.total?asPct(credit.rate):'—'}</b><small>{fmtInt(credit.total)} dossiers · {fmtInt(credit.defaults)} défauts</small></div>
     <div title="Référence calculée sur les mêmes données UCI, sans les restrictions âge et plafond"><small>{referenceLabel}</small><b>{creditReference.total?asPct(creditReference.rate):'—'}</b><small>{difference===null?'Aucune comparaison':(difference>=0?'+':'')+new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1,minimumFractionDigits:1}).format(difference)+' point(s)'}</small></div>
     <button className="x1-compare-open" onClick={()=>{setDetail('credit');setInspectTab('compare');setExpanded(true)}} aria-label="Comparer la sélection au portefeuille" title="Ouvrir l'analyse détaillée de la comparaison Crédit"><ChevronRight size={17}/></button>
    </div>
    <div className="x1-matrix-section" role="region" aria-label="Carte des taux de défaut, défilement horizontal possible sur mobile" tabIndex={0}>
     <div className="x1-subtitle"><h3>Carte des défauts · âge × plafond</h3><span className="x1-matrix-desktop-help">Cliquez une case pour filtrer âge et plafond</span><span className="x1-matrix-mobile-help">Balayez pour voir →</span></div>
     <div className="x1-matrix" role="group" aria-label="Matrice taux de défaut âge par plafond">
      <div className="x1-matrix-head"><span>Âge / plafond</span>{limits.map(l=><span key={l} title={l}>{l}</span>)}</div>
      {matrix.map(row=><div className="x1-matrix-row" key={row.age}><strong>{row.age}</strong>{row.cells.map(c=>{
       const active=filters.age===row.age&&filters.limit===c.limitBand;
       return <button type="button" key={c.limitBand} aria-pressed={active} disabled={!c.total} onClick={()=>chooseMatrix(row.age,c.limitBand)} aria-label={'Âge '+row.age+', plafond '+c.limitBand+' : '+fmtInt(c.total)+' dossiers, '+fmtInt(c.defaults)+' défauts, '+(c.total?asPct(c.rate):'aucun dossier')} title={row.age+' · '+c.limitBand+' : '+fmtInt(c.total)+' dossiers, '+fmtInt(c.defaults)+' défauts, '+(c.total?asPct(c.rate):'aucun dossier')} style={{background:c.total?'rgba(106,144,247,'+(0.13+Math.min(.55,c.rate*.84))+')':undefined}}>{c.total?asPct(c.rate):'—'}</button>
      })}</div>)}
     </div>

    </div>
    <div className="x1-month-inline"><div><strong>Retards · septembre</strong><span>{fmtInt(monthly[5].delayed)} dossiers · {monthly[5].observations?asPct(monthly[5].rate):'—'}</span></div><button onClick={()=>{setInspectTab('monthly');setExpanded(true)}}>Comparer les six mois <Maximize2 size={12}/></button></div>
   </Card>
   <Card className="x1-fraud-panel" title="Fraude · surveillance simulée" note="PaySim · test chronologique, données indépendantes" extra={<span className="x1-scope-pill">{selectedFraudLabel}</span>}>
    <div className="x1-comparison x1-fraud-comparison" aria-live="polite">
     <div><small>Alertes · {selectedFraudLabel}</small><b>{fmtInt(fraudValues.alerts)}</b><small>{fmtInt(fraudValues.tp)} vraies · {fmtInt(fraudValues.fp)} fausses</small></div>
     <div title="Précision : proportion des alertes qui correspondent réellement à une fraude simulée"><small>Précision · sélection / test global</small><b>{fraudPrecision===null?'—':asPct(fraudPrecision)}</b><small>Référence : {asPct(test.confusion.tp/test.alerted)} · Rappel : {fraudRecall===null?'—':asPct(fraudRecall)}</small></div>
     <button className="x1-compare-open" onClick={()=>{setDetail('fraud');setInspectTab('compare');setExpanded(true)}} aria-label="Inspecter la qualité des alertes" title="Comprendre la précision et le rappel des alertes"><ChevronRight size={17}/></button>
    </div>
    <div className="x1-source-axis" role="status">{fraud.channel!=='Tous'?'Type '+fraud.channel+' sélectionné · jours affichés pour le test global':fraud.day!=='Tous'?'Jour J'+fraud.day+' sélectionné · types affichés pour le test global':'Choisissez un type OU un jour : chaque choix remplace l’autre, sans croisement entre les deux.'}</div>
    <div className="x1-fraud-charts">
     <div className="x1-chart"><h3>Alertes par type <small>{fraud.day!=='Tous'?'Vue globale · clic = changer d’axe':'Choisir un type'}</small></h3>
      <div className="x1-horizontal-bars">{fraudTypes.filter(x=>x.alerts>0).map(t=><button key={t.type} aria-pressed={fraud.channel===t.type} onClick={()=>chooseChannel(t.type)} title={t.type+' : '+fmtInt(t.alerts)+' alertes du test global'}>
       <span>{t.type}</span><i><em style={{width:(100*t.alerts/typeMax)+'%'}}/></i><b>{fmtInt(t.alerts)}</b></button>)}</div>
     </div>
     <div className="x1-chart"><h3>Alertes par jour <small>{fraud.channel!=='Tous'?'Vue globale · clic = changer d’axe':'Choisir un jour'}</small></h3>
      <div className="x1-day-bars">{fraudDays.map(d=><button key={d.day} aria-pressed={fraud.day===String(d.day)} onClick={()=>chooseDay(String(d.day))} title={'J'+d.day+' : '+fmtInt(d.alerts)+' alertes du test global'}><b>{d.alerts}</b><span><i style={{height:(100*d.alerts/dayMax)+'%'}}/></span><small>J{d.day}</small></button>)}</div>
     </div>
    </div>
    <button className="x1-model-note" title="Ouvrir les diagnostics des modèles. PR-AUC : aire sous la courbe précision-rappel ; ces scores sont calculés sur le test global." onClick={()=>{setInspectTab('models');setExpanded(true)}}><Activity size={15}/><span>Modèles B3 / B4 : PR-AUC {format3(b3.holdout_test_metrics.pr_auc)} / {format3(test.pr_auc)} · <strong>tests globaux non filtrés</strong></span><ChevronRight size={15}/></button>
   </Card>
  </div>

  {filterFeedback&&<div className="x1-selection-feedback" role="status">{filterFeedback}</div>}
  <section className={'x1-inspector '+(expanded?'x1-inspector-expanded':'')} aria-label="Inspecteur analytique" data-testid="x1-inspector">
   {expanded&&<button className="x1-inspector-backdrop" aria-label="Fermer inspecteur" onClick={()=>setExpanded(false)}/>}
   <div ref={panelRef} className="x1-inspector-surface" role={expanded?'dialog':undefined} aria-modal={expanded?true:undefined} aria-label={expanded?'Inspecteur analytique agrandi':undefined}>
    <header className="x1-inspector-head">
     <div><h2>Explorer les relations</h2><small>{inspectionTitle} · {detail==='credit'?'UCI historique 2005':'PaySim · simulation'}</small></div>
     <div className="x1-inspector-tabs" role="tablist" aria-label="Type d'inspection" onKeyDown={navigateTabs}>
      {([['data','Données'],['monthly','Retards'],['compare','Comparaison'],['models','Modèles']] as const).map(([id,label])=><button role="tab" key={id} tabIndex={inspectTab===id?0:-1} aria-selected={inspectTab===id} onClick={()=>{setInspectTab(id);if(id==='monthly')setDetail('credit')}}>{label}</button>)}
     </div>
     <button className="x1-inspector-size" aria-label={expanded?'Réduire l’inspecteur':'Agrandir l’inspecteur'} onClick={()=>setExpanded(v=>!v)}>{expanded?<Minimize2 size={16}/>:<Maximize2 size={16}/>}<span>{expanded?'Réduire':'Agrandir'}</span></button>
    </header>
    {inspectTab==='data'&&<>
     <div className="x1-inspector-data-toolbar"><div role="tablist" aria-label="Source du tableau" onKeyDown={navigateTabs}><button role="tab" tabIndex={detail==='credit'?0:-1} aria-selected={detail==='credit'} onClick={()=>setDetail('credit')}>Crédit</button><button role="tab" tabIndex={detail==='fraud'?0:-1} aria-selected={detail==='fraud'} onClick={()=>setDetail('fraud')}>Fraude</button></div><label>Format <select aria-label="Format export X1" value={format} onChange={e=>setFormat(e.target.value as ExportFormat)}><option value="csv">CSV</option><option value="xlsx">XLSX</option></select></label><button onClick={exportCurrent}><Download size={14}/> Exporter la sélection</button></div>
     <div className="x1-inspector-scroll" tabIndex={0} role="region" aria-label="Groupes agrégés filtrés"><table className="x1-inspector-table"><thead><tr>{(detail==='credit'?['Âge','Plafond','Statut','Dossiers','Défauts','Taux défaut']:['Type / jour','Transactions','Fraudes','Alertes','Vraies','Précision']).map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.key} className={selectedRow===r.key?'selected':''} tabIndex={0} onClick={()=>setSelectedRow(selectedRow===r.key?null:r.key)} onKeyDown={e=>{if(e.key==='Enter')setSelectedRow(selectedRow===r.key?null:r.key)}}><td>{r.a}</td><td>{r.b}</td><td>{r.c}</td><td>{fmtInt(r.d)}</td><td>{fmtInt(r.e)}</td><td>{r.f===null?'—':asPct(r.f)}</td></tr>)}{!rows.length&&<tr><td colSpan={6}>Aucune donnée pour cette sélection.</td></tr>}</tbody></table></div>
     <footer className="x1-inspector-foot"><Info size={13}/>{detail==='credit'?fmtInt(creditRows.length)+' groupes UCI filtrés · taux pondérés par effectif':'PaySim : regroupement par type OU par jour, jamais les deux'}<button onClick={()=>setSelectionInfo(v=>!v)} aria-expanded={selectionInfo}>Limites <Layers3 size={13}/></button>{selectionInfo&&<span className="x1-inspector-limit">Sources indépendantes, pas de jointure UCI/PaySim. Modèles B3/B4 = test global.</span>}</footer>
    </>}
    {inspectTab==='monthly'&&<div className="x1-inspector-scroll x1-inspector-evidence"><p>Les six mois décrivent les <strong>mêmes dossiers UCI</strong> observés à plusieurs dates. Âge, plafond et statut s’appliquent simultanément.</p><table className="x1-inspector-table"><thead><tr><th>Mois 2005</th><th>Observations</th><th>Retards</th><th>Taux</th></tr></thead><tbody>{monthly.map(m=><tr key={m.period}><td>{m.period}</td><td>{fmtInt(m.observations)}</td><td>{fmtInt(m.delayed)}</td><td>{m.observations?asPct(m.rate):'—'}</td></tr>)}</tbody></table></div>}
    {inspectTab==='compare'&&<div className="x1-inspector-scroll x1-compare-panel">
     {detail==='credit'?<><p>Le <strong>taux de défaut</strong> correspond aux dossiers en défaut divisés par les dossiers étudiés. Comparer un segment avec {filters.status==='Tout'?<strong>tout le portefeuille, sans restriction de statut</strong>:<strong>les dossiers de même statut de septembre</strong>}, sans moyenner les taux.</p>
      <div className="x1-inspector-compare-kpis"><div><small>Référence</small><b>{creditReference.total?asPct(creditReference.rate):'—'}</b><small>{fmtInt(creditReference.total)} dossiers</small></div><div><small>Sélection</small><b>{credit.total?asPct(credit.rate):'—'}</b><small>{fmtInt(credit.total)} dossiers</small></div><div><small>Écart</small><b>{difference===null?'—':(difference>0?'+':'')+difference.toFixed(1).replace('.',',')+' pt'}</b><small>Différence descriptive, pas causale</small></div></div>
      <div className="x1-inspector-compare-charts"><div><h3>Répartition par âge</h3><Bars items={ageGroups} label="Taux de défaut par âge" max={ageMax} selected={filters.age} onClick={v=>chooseCredit('age',v)}/></div><div><h3>Répartition par plafond</h3><Bars items={limitGroups} label="Taux de défaut par plafond" max={limitMax} selected={filters.limit} onClick={v=>chooseCredit('limit',v)}/></div></div>
      </>:<><p>Regroupement <strong>{selectedFraudLabel}</strong> du test PaySim. Les types et les jours sont deux axes distincts. <strong>Précision</strong> : part des alertes qui sont de vraies fraudes simulées ; <strong>rappel</strong> : part des fraudes simulées détectées.</p><div className="x1-inspector-compare-kpis"><div><small>Alertes sélectionnées</small><b>{fmtInt(fraudValues.alerts)}</b></div><div><small>Précision</small><b>{fraudPrecision===null?'—':asPct(fraudPrecision)}</b></div><div><small>Rappel</small><b>{fraudRecall===null?'—':asPct(fraudRecall)}</b></div></div></>}
    </div>}
    {inspectTab==='models'&&<div className="x1-inspector-scroll x1-model-inspection">
      <div className="x1-model-toolbar"><div role="group" aria-label="Source de modèles"><button aria-pressed={detail==='credit'} onClick={()=>{setDetail('credit');setModelTab('ranking')}}>Modèles Crédit B3</button><button aria-pressed={detail==='fraud'} onClick={()=>{setDetail('fraud');setModelTab('ranking')}}>Modèles Fraude B4</button></div><div role="tablist" aria-label="Diagnostics des modèles" onKeyDown={navigateTabs}>{(detail==='credit'?[['ranking','Performance'],['deciles','Déciles'],['variables','Variables'],['calibration','Calibration'],['groups','Sous-groupes']]:[['ranking','Performance'],['deciles','Déciles'],['drift','Dérive']] as string[][]).map(([id,label])=><button role="tab" tabIndex={modelTab===id?0:-1} aria-selected={modelTab===id} key={id} onClick={()=>setModelTab(id as ModelTab)}>{label}</button>)}</div></div>
      <p>Évaluation des <strong>jeux de test globaux</strong> : ces diagnostics ne changent pas lorsque les segments Crédit ou Fraude sont filtrés.</p>
      {modelTab==='ranking'&&<><div className="x1-model-kpis">{((detail==='credit'?[['ROC-AUC',b3.holdout_test_metrics.roc_auc],['PR-AUC',b3.holdout_test_metrics.pr_auc],['Brier',b3.holdout_test_metrics.brier],['Rappel',b3.holdout_test_metrics.recall]]:[['ROC-AUC',test.roc_auc],['PR-AUC',test.pr_auc],['Brier',test.brier],['Rappel',test.recall]]) as [string,number][]).map(([label,value])=><div key={label}><small>{label} · test</small><b>{label==='Rappel'?asPct(value):format3(value)}</b></div>)}</div><div className="x1-metric-glossary"><Info size={16}/><p><strong>Comment lire ces scores ?</strong> ROC-AUC mesure la séparation des classes ; PR-AUC est l'aire sous la courbe précision-rappel ; Brier mesure l'erreur des probabilités (plus bas = mieux) ; le rappel est la part des cas positifs retrouvés. <strong>Ils ne changent pas avec les filtres.</strong></p></div></>}
      {modelTab==='deciles'&&<div className="x1-decile-grid">{(detail==='credit'?b3Deciles:b4Deciles).map(d=><div key={d.decile}><small>D{d.decile}</small><b>{asPct(d.rate)}</b></div>)}</div>}
      {modelTab==='variables'&&detail==='credit'&&<div className="x1-model-items">{creditDrivers.filter(x=>x.impact>0).slice(0,8).map(x=><div key={x.name}><span>{driverLabels[x.name]||x.name}</span><b>{format3(x.impact)}</b></div>)}<small>Importance par permutation sur validation, non causale.</small></div>}
      {modelTab==='calibration'&&detail==='credit'&&<table className="x1-inspector-table"><thead><tr><th>Tranche</th><th>Dossiers</th><th>Probabilité prédite</th><th>Défaut observé</th></tr></thead><tbody>{creditCalibration.map(x=><tr key={x.bin}><td>{x.bin}</td><td>{fmtInt(x.n)}</td><td>{asPct(x.predicted)}</td><td>{asPct(x.observed)}</td></tr>)}</tbody></table>}
      {modelTab==='groups'&&detail==='credit'&&<table className="x1-inspector-table"><thead><tr><th>Âge</th><th>Effectif</th><th>Rappel</th><th>Taux faux positifs</th></tr></thead><tbody>{creditAudit.filter(x=>x.field==='age_band').map(x=><tr key={x.group}><td>{x.group}</td><td>{fmtInt(x.n)}</td><td>{x.suppressed?'Masqué':x.recall===null?'—':asPct(x.recall)}</td><td>{x.suppressed?'Masqué':x.fpr===null?'—':asPct(x.fpr)}</td></tr>)}</tbody></table>}
      {modelTab==='drift'&&detail==='fraud'&&<div className="x1-model-items">{([['Entraînement',b4.prevalence_by_partition.train],['Validation',b4.prevalence_by_partition.validation],['Test',b4.prevalence_by_partition.test]] as const).map(([label,value])=><div key={label}><span>Prévalence · {label}</span><b>{asPct(value)}</b></div>)}<small>Simulation PaySim · risque de dérive chronologique.</small></div>}
     </div>}
   </div>
  </section>
 </div>;
}
