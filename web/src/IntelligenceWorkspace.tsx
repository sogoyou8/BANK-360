import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
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
 const tableSlotRef=useRef<HTMLDivElement>(null);
 const tableViewportRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{setSelectedRow(null);setSelectedDecile(null);setQuery('');setSortKey('')},[context]);
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
 const allowed:DiagnosticView[]=isCredit?['ranking','drivers','calibration','audit']:['ranking','drift'];
 const activeDiag=allowed.includes(diagnostic)?diagnostic:'ranking';
 const detail=rows.find(x=>x.id===selectedRow);

 // C4.10: keep the scrolling viewport at an exact number of physical table rows.
 // The parent slot owns the flexible layout; quantizing the child never changes
 // its measured available height, avoiding ResizeObserver feedback loops.
 useLayoutEffect(()=>{
  const slot=tableSlotRef.current;
  const viewport=tableViewportRef.current;
  if(!slot||!viewport)return;
  const align=()=>{
   const header=viewport.querySelector('thead tr') as HTMLElement|null;
   const row=viewport.querySelector('tbody tr') as HTMLElement|null;
   if(!header||!row)return;
   const available=slot.getBoundingClientRect().height;
   const headerHeight=header.getBoundingClientRect().height;
   const rowHeight=row.getBoundingClientRect().height;
   if(available<=0||headerHeight<=0||rowHeight<=0)return;
   const capacity=Math.floor((available-headerHeight+.25)/rowHeight);
   const aligned=capacity>=1?Math.min(available,headerHeight+capacity*rowHeight):available;
   viewport.style.height=Math.max(0,aligned)+'px';
   viewport.style.setProperty('--iw-table-header-height',headerHeight+'px');
  };
  align();
  const observer=new ResizeObserver(align);
  observer.observe(slot);
  const header=viewport.querySelector('thead tr');
  const row=viewport.querySelector('tbody tr');
  if(header)observer.observe(header);
  if(row)observer.observe(row);
  return()=>observer.disconnect();
 },[context,visibleRows.length,perspective]);
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

  <Panel className="iw-deciles" title={isCredit?'Risque par décile · test':isDays?'Alertes par jour simulé · test':'Fraude par décile · test'} extra={<span className="iw-chip">{isCredit?'UCI · B3':isDays?'J25–J30':'PaySim · B4'}</span>}>
   <div className="iw-chart" role="group" aria-label={isDays?'Nombre d’alertes par jour simulé':isCredit?'Taux de défaut par décile':'Taux de fraude par décile'}><div className="iw-chart-axis" aria-hidden="true"><span>{isDays?count(highest):pct(highest)}</span><span>{isDays?count(highest/2):pct(highest/2)}</span><span>{isDays?'0':'0,0 %'}</span></div><div className="iw-bars">{selectedBars.map(b=><button key={b.id} type="button" className={'iw-bar '+(selectedDecile===b.id?'active':'')} aria-pressed={selectedDecile===b.id} onClick={()=>setSelectedDecile(selectedDecile===b.id?null:b.id)} title={b.label+' · '+(isDays?count(b.rate)+' alertes':pct(b.rate))+' · '+count(b.n)+' observations · '+count(b.observed)+' cas observés'}><span className="iw-bar-value">{isDays?count(b.rate):pct(b.rate)}</span><span className="iw-bar-track"><i style={{height:100*b.rate/highest+'%'}}/></span><span className="iw-bar-label">{b.label}</span></button>)}</div></div>
   <div className="iw-chart-note" aria-live="polite">{selectedDecile===null?(isCredit?'D1 = risque le plus élevé · B3 test global':isDays?'Six jours simulés, pas de date calendaire':'D1 = risque le plus élevé · B4 test global'):(()=>{const b=selectedBars.find(x=>x.id===selectedDecile);return b?b.label+' · '+count(b.n)+' observations · '+count(b.observed)+' cas · '+(isDays?count(b.rate)+' alertes':pct(b.rate)+' observé · prédit '+pct(b.mean)):'—'})()}</div>
  </Panel>
  <Panel className="iw-diagnostics" title={isDays?'Diagnostics · PaySim':'Diagnostics · validation'} extra={<div className="iw-diag-tabs" role="tablist" aria-label="Diagnostic du modèle">{(isCredit?[['ranking','Modèles'],['drivers','Variables'],['calibration','Calibration'],['audit','Sous-groupes']]:[['ranking','Modèles'],['drift','Dérive']]).map(([id,label])=><button type="button" role="tab" aria-selected={activeDiag===id} className={activeDiag===id?'active':''} key={id} onClick={()=>onDiagnostic(id as DiagnosticView)}>{label}</button>)}</div>}>
   {activeDiag==='ranking'&&<div className="iw-ranking"><div className="iw-panel-caption">Comparaison PR-AUC · validation (non filtrée)</div><div className="iw-ranking-rows">{comparison.map(c=><div className="iw-ranking-row" key={c.name}><span>{c.name}</span><span className="iw-ranking-track"><i style={{width:100*c.v/Math.max(...comparison.map(x=>x.v))+'%'}}/></span><b>{num(c.v)}</b></div>)}</div><div className="iw-mini-kpis"><div><Target size={24}/><span>Brier · test<strong>{num(test.brier)}</strong></span></div><div><ShieldAlert size={24}/><span>Rappel · test<strong>{pct(test.recall)}</strong></span></div></div></div>}
   {activeDiag==='drivers'&&isCredit&&<div className="iw-evidence"><div className="iw-panel-caption">Importance par permutation · validation · non causale</div>{creditDrivers.filter(x=>x.impact>0).slice(0,6).map(x=><div className="iw-evidence-row" key={x.name}><span title={x.name}>{driverLabels[x.name]||x.name}</span><div><i style={{width:100*x.impact/creditDrivers[0].impact+'%'}}/></div><b>{num(x.impact)}</b></div>)}</div>}
   {activeDiag==='calibration'&&isCredit&&<div className="iw-calibration"><div className="iw-panel-caption">Score moyen / taux observé · test B3 · diagonale idéale</div><svg viewBox="0 0 430 205" role="img" aria-label="Calibration crédit : huit tranches du score prédit et taux observé"><g stroke="#c5d9ff35">{[0,1,2,3,4].map(i=><path key={i} d={'M 41 '+(179-i*36)+' H 401'}/>)}</g><path d="M 41 179 L 401 17" stroke="#b6c8fd" strokeDasharray="5 6" opacity=".7" strokeWidth="2"/><polyline points={creditCalibration.map(x=>String(41+x.predicted*360/.8)+','+String(179-x.observed*162/.8)).join(' ')} fill="none" stroke="#69d9d0" strokeWidth="3"/>{creditCalibration.map(x=><circle key={x.bin} cx={41+x.predicted*360/.8} cy={179-x.observed*162/.8} r="4" fill="#69d9d0"><title>{x.bin+' · '+count(x.n)+' dossiers · prédiction '+pct(x.predicted)+' · observé '+pct(x.observed)}</title></circle>)}<text x="220" y="201" textAnchor="middle" fill="#a8bfed" fontSize="10">Probabilité prédite</text></svg></div>}
   {activeDiag==='audit'&&isCredit&&<div className="iw-audit"><div className="iw-panel-caption">Sous-groupes par âge · effectifs faibles masqués</div><table><thead><tr><th>Âge</th><th>Effectif</th><th>Rappel</th><th>Taux FP</th></tr></thead><tbody>{creditAudit.filter(x=>x.field==='age_band').map(x=><tr key={x.group}><td>{x.group}</td><td>{count(x.n)}</td><td>{x.suppressed?'Masqué':x.recall===null?'—':pct(x.recall)}</td><td>{x.suppressed?'Masqué':x.fpr===null?'—':pct(x.fpr)}</td></tr>)}</tbody></table></div>}
   {activeDiag==='drift'&&!isCredit&&<div className="iw-evidence"><div className="iw-panel-caption">Prévalence selon la partition · PaySim simulé</div>{([['Entraînement',b4.prevalence_by_partition.train],['Validation',b4.prevalence_by_partition.validation],['Test',b4.prevalence_by_partition.test],['Score moyen · test',b4.test_predicted_probability_mean]] as const).map(([label,val])=><div key={label} className="iw-evidence-row"><span>{label}</span><div><i style={{width:100*val/b4.prevalence_by_partition.test+'%'}}/></div><b>{fmtPct(val,3)}</b></div>)}<div className="iw-limit"><Info size={14}/> Dérive chronologique et sous-calibration importantes.</div></div>}
   <div className="iw-diag-footnote">{isCredit?'UCI · Taïwan 2005 · étude historique, aucune décision de crédit':'PaySim · simulation · aucune alerte bancaire opérationnelle'}</div>
  </Panel>

  <Panel className="iw-explorer" title="Explorateur de données" extra={<div className="iw-explore-actions"><label className="iw-search"><Search size={14}/><input value={query} onChange={e=>{setQuery(e.target.value);setSelectedRow(null)}} aria-label="Rechercher des groupes" placeholder="Rechercher..."/></label><button type="button" className="iw-download" onClick={()=>downloadCsv('bank360-intelligence-'+context+'-agregats.csv',visibleRows,columns)} aria-label="Exporter les groupes affichés en CSV"><Download size={16}/> CSV</button></div>}>
   <div className="iw-explorer-toolbar">{isCredit?<div className="iw-credit-filters" role="group" aria-label="Filtres de l'explorateur crédit"><label>Âge<select value={filters.age} aria-label="Âge Intelligence" onChange={e=>{onFilters({...filters,age:e.target.value});setSelectedRow(null)}}><option value="Tout">Tous</option>{ages.map(x=><option key={x}>{x}</option>)}</select></label><label>Plafond<select value={filters.limit} aria-label="Plafond Intelligence" onChange={e=>{onFilters({...filters,limit:e.target.value});setSelectedRow(null)}}><option value="Tout">Tous</option>{limits.map(x=><option key={x}>{x}</option>)}</select></label><label>Statut septembre<select value={filters.status} aria-label="Statut septembre Intelligence" onChange={e=>{onFilters({...filters,status:e.target.value});setSelectedRow(null)}}><option value="Tout">Tous</option>{statuses.map(x=><option key={x} value={x}>{statusLabel(x)}</option>)}</select></label><button type="button" className="iw-reset" onClick={()=>{onFilters(initialFilters);setSelectedRow(null);setQuery('')}}><X size={15}/> Réinitialiser</button></div>:<div className="iw-readonly"><Info size={13}/>{isDays?'Jours simulés J25–J30 · test B4':'Cinq types d’opérations PaySim · test B4'} · agrégats uniquement</div>}<span className="iw-rowcount">{count(visibleRows.length)} groupes affichés</span></div>
   <div className="iw-table-slot" ref={tableSlotRef}><div className="iw-table-window" ref={tableViewportRef} role="region" aria-label="Groupes agrégés" tabIndex={0}><table><thead><tr>{columns.map(col=><th key={col.key}><button type="button" aria-label={'Trier par '+col.label} onClick={()=>{setSortKey(col.key);setSortDescending(sortKey===col.key?!sortDescending:false)}}>{col.label}{sortKey===col.key?(sortDescending?' ↓':' ↑'):''}</button></th>)}</tr></thead><tbody>{visibleRows.map(row=><tr key={row.id} tabIndex={0} className={selectedRow===row.id?'selected':''} onClick={()=>setSelectedRow(selectedRow===row.id?null:row.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedRow(selectedRow===row.id?null:row.id)}}}>{columns.map(col=><td key={col.key} className={typeof row[col.key]==='number'?'numeric':''}>{display(row[col.key],col.unit)}</td>)}</tr>)}{visibleRows.length===0&&<tr><td colSpan={columns.length}>Aucun groupe pour ces filtres ou cette recherche.</td></tr>}</tbody></table></div></div>
   <div className="iw-explorer-footer" aria-live="polite">{detail?<><CheckCircle2 size={14}/>Groupe sélectionné : {columns.slice(0,3).map(col=>display(detail[col.key],col.unit)).join(' · ')} · {columns.slice(-2).map(col=>col.label+' '+display(detail[col.key],col.unit)).join(' · ')}</>:<><Info size={13}/>{isCredit?'196 groupes UCI au total · taux pondérés par effectif':isDays?'Six jours simulés · aucune date calendaire':'Types PaySim · test chronologique'}</>}<span>Export CSV des lignes visibles</span></div>
  </Panel>
 </div>
 </div>;
}
