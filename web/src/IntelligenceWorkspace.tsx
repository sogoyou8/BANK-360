import React,{useMemo,useState} from 'react';
import {Activity,BarChart3,CheckCircle2,ChevronRight,Download,Info,Layers3,Search,ShieldAlert,Target,X} from 'lucide-react';
import {ages,b3,b3Deciles,b4,b4Deciles,creditTotals,filteredSegments,fraudDays,fraudTypes,fmtInt,fmtPct,initialFilters,limits,segments,type CreditFilters} from './data';
import {creditAudit,creditCalibration,creditDrivers,driverLabels} from './riskEvidence';
import './intelligence-workspace.css';
export type IntelligencePerspective='overview'|'models'|'explorer';
export type IntelligenceContext='credit'|'fraud'|'days';
export type DiagnosticView='ranking'|'drivers'|'calibration'|'audit'|'drift';
const num=(n:number)=>new Intl.NumberFormat('fr-FR',{minimumFractionDigits:3,maximumFractionDigits:3}).format(n);
const pct=(n:number)=>fmtPct(n,1);
const count=(n:number)=>fmtInt(n);
const statusLabel=(v:string)=>v==='-1'?'−1 · à jour':v==='-2'||v==='0'?v.replace('-','−')+' · non précisé':/^[1-8]$/.test(v)?v+' · '+v+' mois':v+' · non précisé';
const statuses=[...new Set(segments.map(x=>x.september_status))].sort((a,b)=>Number(a)-Number(b));
export function IntelligenceHeader({perspective,onPerspective,context,onContext}:{perspective:IntelligencePerspective,onPerspective:(v:IntelligencePerspective)=>void,context:IntelligenceContext,onContext:(v:IntelligenceContext)=>void}){
 const perspectives:[IntelligencePerspective,string][]=[['overview','Vue globale'],['models','Modèles'],['explorer','Explorer']];
 const contexts:[IntelligenceContext,string][]=[['credit','Crédit'],['fraud','Fraude'],['days','Jours simulés']];
 return <div className="iw-header-controls"><div className="iw-segments" role="tablist" aria-label="Perspectives Intelligence">{perspectives.map(([id,label])=><button type="button" role="tab" key={id} aria-selected={perspective===id} className={perspective===id?'active':''} onClick={()=>onPerspective(id)}>{label}</button>)}</div><div className="iw-segments iw-contexts" role="group" aria-label="Jeu de données">{contexts.map(([id,label])=><button type="button" key={id} aria-pressed={context===id} className={context===id?'active':''} onClick={()=>onContext(id)}>{label}</button>)}</div></div>;
}
type Row={id:string;[name:string]:string|number};
type Column={key:string,label:string,unit?:'integer'|'percent'};
const creditColumns:Column[]=[{key:'age',label:'Âge'},{key:'limit',label:'Plafond'},{key:'status',label:'Statut'},{key:'n',label:'Dossiers',unit:'integer'},{key:'defaults',label:'Défauts',unit:'integer'},{key:'rate',label:'Taux',unit:'percent'}];
const fraudColumns:Column[]=[{key:'type',label:'Type'},{key:'transactions',label:'Transactions',unit:'integer'},{key:'frauds',label:'Fraudes',unit:'integer'},{key:'alerts',label:'Alertes',unit:'integer'},{key:'tp',label:'Vraies',unit:'integer'},{key:'fp',label:'Fausses',unit:'integer'},{key:'precision',label:'Précision',unit:'percent'}];
const daysColumns:Column[]=[{key:'day',label:'Jour simulé'},{key:'transactions',label:'Transactions',unit:'integer'},{key:'frauds',label:'Fraudes',unit:'integer'},{key:'alerts',label:'Alertes',unit:'integer'},{key:'tp',label:'Vraies',unit:'integer'},{key:'fp',label:'Fausses',unit:'integer'},{key:'fn',label:'Manquées',unit:'integer'}];
const display=(v:string|number,unit?:Column['unit'])=>typeof v==='number'?(unit==='percent'?pct(v):unit==='integer'?count(v):String(v)):v;
function downloadCsv(name:string,rows:Row[],columns:Column[]){
 const quote=(v:string|number)=>'"'+String(v??'').replaceAll('"','""')+'"';
 const content=[columns.map(c=>quote(c.label)).join(','),...rows.map(r=>columns.map(c=>quote(r[c.key])).join(','))].join('\r\n');
 const uri=URL.createObjectURL(new Blob(['\uFEFF'+content+'\r\n'],{type:'text/csv;charset=utf-8'}));
 const anchor=document.createElement('a');anchor.href=uri;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(uri),1000);
}
function Panel({title,extra,children,className}:{title:string,extra?:React.ReactNode,children:React.ReactNode,className:string}){return <section className={'iw-panel '+className} aria-label={title}><header className="iw-panel-header"><h2>{title}</h2>{extra}</header><div className="iw-panel-content">{children}</div></section>}
export default function IntelligenceWorkspace({perspective,onPerspective,context,onContext,filters,onFilters,diagnostic,onDiagnostic}:{perspective:IntelligencePerspective,onPerspective:(v:IntelligencePerspective)=>void,context:IntelligenceContext,onContext:(v:IntelligenceContext)=>void,filters:CreditFilters,onFilters:(v:CreditFilters)=>void,diagnostic:DiagnosticView,onDiagnostic:(v:DiagnosticView)=>void}){
 const [selectedDecile,setSelectedDecile]=useState<number|null>(null);
 const [selectedRow,setSelectedRow]=useState<string|null>(null);
 const [query,setQuery]=useState('');
 const [sortKey,setSortKey]=useState('');
 const [sortDescending,setSortDescending]=useState(false);
 const creditRows=useMemo(()=>filteredSegments(filters),[filters]);
 const total=useMemo(()=>creditTotals(creditRows),[creditRows]);
 const isCredit=context==='credit',isDays=context==='days';
 const c=b3.holdout_test_metrics,f=b4.holdout_test;
 const deciles=isCredit?b3Deciles:b4Deciles;
 const creditFiltered=filters.age!=='Tout'||filters.limit!=='Tout'||filters.status!=='Tout';
 const rows=useMemo<Row[]>(()=>{
  if(context==='credit')return creditRows.map((x,i)=>({id:'credit-'+i,age:x.age_band,limit:x.credit_limit_band,status:statusLabel(x.september_status),n:x.client_count,defaults:x.default_count,rate:x.client_count?x.default_count/x.client_count:0}));
  if(context==='fraud')return fraudTypes.map(x=>({id:'type-'+x.type,type:x.type,transactions:x.transactions,frauds:x.frauds,alerts:x.alerts,tp:x.tp,fp:x.fp,precision:x.precision}));
  return fraudDays.map(x=>({id:'day-'+x.day,day:'J'+x.day,transactions:x.transactions,frauds:x.frauds,alerts:x.alerts,tp:x.tp,fp:x.fp,fn:x.fn}));
 },[creditRows,context]);
 const columns=context==='credit'?creditColumns:context==='fraud'?fraudColumns:daysColumns;
 const visibleRows=useMemo(()=>{
  const text=query.toLocaleLowerCase('fr').trim();
  const filtered=text?rows.filter(x=>columns.some(col=>String(x[col.key]).toLocaleLowerCase('fr').includes(text))):rows;
  if(!sortKey)return filtered;
  return [...filtered].sort((a,b)=>{const left=a[sortKey],right=b[sortKey],order=typeof left==='number'&&typeof right==='number'?left-right:String(left??'').localeCompare(String(right??''),'fr');return order*(sortDescending?-1:1)});
 },[rows,columns,query,sortKey,sortDescending]);
 const changeContext=(v:IntelligenceContext)=>{onContext(v);onDiagnostic('ranking');setSelectedRow(null);setSelectedDecile(null);setQuery('');setSortKey('')};
 const allowed:DiagnosticView[]=isCredit?['ranking','drivers','calibration','audit']:['ranking','drift'];
 const activeDiag=allowed.includes(diagnostic)?diagnostic:'ranking';
 const detail=rows.find(x=>x.id===selectedRow);
 const selectedBars=isDays?fraudDays.map(x=>({id:x.day,label:'J'+x.day,rate:x.alerts,n:x.transactions,observed:x.frauds,mean:0})):deciles.map(x=>({id:x.decile,label:'D'+x.decile,rate:x.rate,n:x.n,observed:'defaults' in x?x.defaults:x.frauds,mean:x.mean}));
 const highest=Math.max(.00001,...selectedBars.map(x=>x.rate));
 const test=isCredit?c:f;
 const kpis=isCredit?[
  {label:'ROC-AUC · test',value:num(c.roc_auc),note:'B3 · test global',icon:Activity,to:'models' as const},
  {label:'PR-AUC · test',value:num(c.pr_auc),note:'B3 · test global',icon:BarChart3,to:'models' as const},
  {label:'Groupes',value:count(creditRows.length),note:creditFiltered?'Après filtres':'Agrégats UCI',icon:Layers3,to:'explorer' as const},
  {label:'Taux',value:total.total?pct(total.rate):'—',note:count(total.defaults)+' / '+count(total.total)+' défauts/dossiers',icon:Target,to:'explorer' as const}
 ]:[
  {label:'ROC-AUC · test',value:num(f.roc_auc),note:'PaySim · test global',icon:Activity,to:'models' as const},
  {label:'PR-AUC · test',value:num(f.pr_auc),note:'PaySim · test global',icon:BarChart3,to:'models' as const},
  {label:isDays?'Jours simulés':'Canaux',value:count(isDays?fraudDays.length:fraudTypes.length),note:'Groupes PaySim du test',icon:Layers3,to:'explorer' as const},
  {label:isDays?'Alertes · test':'Précision · test',value:isDays?count(f.alerted):pct(f.precision),note:'PaySim · simulation',icon:Target,to:'explorer' as const}
 ];
 const comparison=isCredit?[
 {name:'Gradient boosting',v:b3.validation_metrics.hist_gradient_boosting.pr_auc},
 {name:'Régression logistique',v:b3.validation_metrics.logistic_regression.pr_auc},
 {name:'Référence',v:b3.validation_metrics.baseline_prevalence.pr_auc}
 ]:[{name:'Gradient boosting',v:b4.validation.gradient_boosting.pr_auc},{name:'Régression logistique',v:b4.validation.logistic.pr_auc}];
 return <div className={'screen intelligence-workspace iw-focus-'+perspective} data-context={context} data-perspective={perspective}>
 <div className="iw-kpis">{kpis.map(k=>{const Icon=k.icon;return <button type="button" key={k.label} className="iw-kpi" onClick={()=>onPerspective(k.to)} title={'Examiner '+k.label}><span className="iw-kpi-icon"><Icon size={21}/></span><span className="iw-kpi-copy"><span>{k.label}</span><strong>{k.value}</strong><small>{k.note}</small></span><ChevronRight size={15} className="iw-kpi-arrow"/></button>})}</div>
 <div className="iw-board">
