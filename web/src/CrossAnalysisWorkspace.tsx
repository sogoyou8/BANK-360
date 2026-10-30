import {useMemo,useState} from 'react';
import {Activity,ArrowLeftRight,BarChart3,CheckCircle2,Database,Download,FilterX,Info,Layers3,ShieldAlert,ShieldCheck,Wallet} from 'lucide-react';
import {ages,limits,segments,b3,b4,b3Deciles,b4Deciles,fraudDays,fraudTypes,filteredSegments,groupSegments,creditTotals,paymentSeries,fmtInt,fmtPct,fmtNtd,initialFilters,type CreditFilters} from './data';
import {exportReport,type ExportFormat,type ReportDataset} from './reportExports';
import {type FraudScope} from './FraudWorkspace';
import './cross-analysis.css';

type Props={filters:CreditFilters,onFilters:(next:CreditFilters)=>void,fraud:FraudScope,onFraud:(next:FraudScope)=>void,onGovernance:()=>void};
type Detail='credit'|'fraud';
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
function Kpi({label,value,detail,tone='blue'}:{label:string,value:string,detail:string,tone?:string}){return <div className={'x1-kpi x1-'+tone}><small>{label}</small><b>{value}</b><span>{detail}</span></div>}
export default function CrossAnalysisWorkspace({filters,onFilters,fraud,onFraud,onGovernance}:Props){
 const [detail,setDetail]=useState<Detail>('credit');
 const [format,setFormat]=useState<ExportFormat>('csv');
 const [selectionInfo,setSelectionInfo]=useState(false);
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
 const chooseCredit=(key:'age'|'limit'|'status',value:string)=>onFilters({...filters,[key]:filters[key]===value?'Tout':value});
 const chooseChannel=(value:string)=>onFraud({...fraud,channel:fraud.channel===value?'Tous':value,day:'Tous'});
 const chooseDay=(value:string)=>onFraud({...fraud,day:fraud.day===value?'Tous':value,channel:'Tous'});
 const monthMax=Math.max(.01,...monthly.map(x=>x.rate));
 const ageMax=Math.max(.001,...ageGroups.map(x=>x.rate));
 const limitMax=Math.max(.001,...limitGroups.map(x=>x.rate));
 const typeMax=Math.max(1,...fraudTypes.map(x=>x.alerts));
 const dayMax=Math.max(1,...fraudDays.map(x=>x.alerts));
 const selectedFraudLabel=fraud.channel!=='Tous'?fraud.channel:fraud.day!=='Tous'?'J'+fraud.day:'Test chronologique';
 const hasCredit=Object.values(filters).some(x=>x!=='Tout');
 const hasFraud=fraud.channel!=='Tous'||fraud.day!=='Tous'||fraud.kind!=='all';
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
   <div><Database size={22}/><span><b>{fmtInt(credit.total)}</b><small>Dossiers UCI · sélection</small></span></div>
   <div><Wallet size={22}/><span><b>{asPct(credit.rate)}</b><small>Défauts UCI · {fmtInt(credit.defaults)}</small></span></div>
   <div><ArrowLeftRight size={22}/><span><b>{fmtInt(fraudValues.transactions)}</b><small>Transactions PaySim · {selectedFraudLabel}</small></span></div>
   <div><ShieldAlert size={22}/><span><b>{fmtInt(fraudValues.alerts)}</b><small>Alertes simulées · {selectedFraudLabel}</small></span></div>
   <button onClick={onGovernance} aria-label="Ouvrir la gouvernance et les preuves"><ShieldCheck size={18}/> Sources & preuves</button>
  </div>
  <div className="x1-analysis-grid">
   <Card className="x1-credit-panel" title="Crédit · portefeuille et paiements" note="UCI 2005 · mêmes sous-groupes pour défauts et six mois" extra={<span className="x1-scope-pill">{hasCredit?'Sélection filtrée':'30 000 dossiers historiques'}</span>}>
    <div className="x1-mini-kpis">
     <Kpi label="Dossiers" value={fmtInt(credit.total)} detail="Population sélectionnée"/>
     <Kpi label="Défauts" value={fmtInt(credit.defaults)} detail={asPct(credit.rate)} tone="violet"/>
     <Kpi label="Plafond moyen" value={credit.total?fmtNtd(credit.avgLimit):'—'} detail="Pondéré par dossiers"/>
     <Kpi label="Retards · septembre" value={fmtInt(monthly[5].delayed)} detail={monthly[5].observations?asPct(monthly[5].rate):'—'} tone="mint"/>
    </div>
    <div className="x1-credit-charts">
     <div className="x1-chart"><h3>Défauts par âge <small>Comparer / choisir</small></h3>{ageGroups.length?<Bars items={ageGroups} label="Taux de défaut par âge" max={ageMax} selected={filters.age} onClick={v=>chooseCredit('age',v)}/>:<div className="x1-empty">Aucun dossier</div>}</div>
     <div className="x1-chart"><h3>Défauts par plafond <small>Comparer / choisir</small></h3>{limitGroups.length?<Bars items={limitGroups} label="Taux de défaut par plafond" max={limitMax} selected={filters.limit} onClick={v=>chooseCredit('limit',v)}/>:<div className="x1-empty">Aucun dossier</div>}</div>
    </div>
    <div className="x1-month-chart"><div className="x1-subtitle"><h3>Retards mensuels</h3><span>Avril–sept. 2005 · mêmes filtres UCI</span></div><div className="x1-month-bars">{monthly.map(m=><div key={m.period} title={m.period+' · '+fmtInt(m.delayed)+' retards / '+fmtInt(m.observations)+' observations'}><b>{m.observations?asPct(m.rate):'—'}</b><span><i style={{height:Math.max(m.rate?2:0,100*m.rate/monthMax)+'%'}}/></span><small>{m.period.slice(-2)}</small></div>)}</div></div>
   </Card>
   <Card className="x1-fraud-panel" title="Fraude · surveillance simulée" note="PaySim · test chronologique, données indépendantes" extra={<span className="x1-scope-pill">{selectedFraudLabel}</span>}>
    <div className="x1-mini-kpis">
     <Kpi label="Alertes" value={fmtInt(fraudValues.alerts)} detail="Test sélectionné" tone="rose"/>
     <Kpi label="Vraies" value={fmtInt(fraudValues.tp)} detail="Vrais positifs" tone="mint"/>
     <Kpi label="Précision" value={fraudPrecision===null?'—':asPct(fraudPrecision)} detail="Vraies / alertes" tone="violet"/>
     <Kpi label="Rappel" value={fraudRecall===null?'—':asPct(fraudRecall)} detail="Vraies / fraudes"/>
    </div>
    <div className="x1-fraud-charts">
     <div className="x1-chart"><h3>Alertes par type <small>{fraud.day!=='Tous'?'Vue globale · clic = changer d’axe':'Choisir un type'}</small></h3>
      <div className="x1-horizontal-bars">{fraudTypes.filter(x=>x.alerts>0).map(t=><button key={t.type} aria-pressed={fraud.channel===t.type} onClick={()=>chooseChannel(t.type)} title={t.type+' : '+fmtInt(t.alerts)+' alertes du test global'}>
       <span>{t.type}</span><i><em style={{width:(100*t.alerts/typeMax)+'%'}}/></i><b>{fmtInt(t.alerts)}</b></button>)}</div>
     </div>
     <div className="x1-chart"><h3>Alertes par jour <small>{fraud.channel!=='Tous'?'Vue globale · clic = changer d’axe':'Choisir un jour'}</small></h3>
      <div className="x1-day-bars">{fraudDays.map(d=><button key={d.day} aria-pressed={fraud.day===String(d.day)} onClick={()=>chooseDay(String(d.day))} title={'J'+d.day+' : '+fmtInt(d.alerts)+' alertes du test global'}><b>{d.alerts}</b><span><i style={{height:(100*d.alerts/dayMax)+'%'}}/></span><small>J{d.day}</small></button>)}</div>
     </div>
    </div>
    <div className="x1-model-note"><Activity size={15}/><span>B3 PR-AUC {format3(b3.holdout_test_metrics.pr_auc)} · B4 PR-AUC {format3(test.pr_auc)} — <strong>tests globaux, non filtrables par segment</strong></span></div>
   </Card>
  </div>
  <Card className="x1-detail" title="Exploration détaillée" note={detail==='credit'?'Groupes UCI · âges, plafonds et statuts croisés':'PaySim · une dimension disponible par regroupement'} extra={<div className="x1-detail-actions"><div role="tablist" aria-label="Source du tableau"><button role="tab" aria-selected={detail==='credit'} onClick={()=>setDetail('credit')}>Crédit</button><button role="tab" aria-selected={detail==='fraud'} onClick={()=>setDetail('fraud')}>Fraude</button></div><label>Format <select aria-label="Format export X1" value={format} onChange={e=>setFormat(e.target.value as ExportFormat)}><option value="csv">CSV</option><option value="xlsx">XLSX</option></select></label><button onClick={exportCurrent}><Download size={13}/> Exporter</button></div>}>
   <div className="x1-detail-body"><table><thead><tr>{(detail==='credit'?['Âge','Plafond','Statut','Dossiers','Défauts','Taux défaut']:['Type / jour','Transactions','Fraudes','Alertes','Vraies','Précision']).map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.key}><td>{r.a}</td><td>{r.b}</td><td>{r.c}</td><td>{fmtInt(r.d)}</td><td>{fmtInt(r.e)}</td><td>{r.f===null?'—':asPct(r.f)}</td></tr>)}{!rows.length&&<tr><td colSpan={6}>Aucune donnée dans ce sous-groupe.</td></tr>}</tbody></table></div>
   <footer className="x1-detail-note"><Info size={13}/><span>{detail==='credit'?fmtInt(creditRows.length)+' groupes UCI filtrés · taux pondérés à partir de dossiers':'PaySim : regroupement par type OU par jour, jamais par les deux'}</span><button onClick={()=>setSelectionInfo(v=>!v)} aria-expanded={selectionInfo}>Limites <Layers3 size={13}/></button>{selectionInfo&&<div role="note" className="x1-limit-popover">UCI et PaySim n'ont aucune clé de jointure. Les déciles B3/B4 ne sont pas reliés aux groupes ; les taux modèles restent sur le test global.</div>}</footer>
  </Card>
 </div>;
}
