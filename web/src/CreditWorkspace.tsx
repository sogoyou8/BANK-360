import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {ArrowDownToLine,Check,ChevronDown,Clock3,CreditCard,Info,Search,ShieldAlert,Wallet,X} from 'lucide-react';
import {segments,payments,filteredSegments,creditTotals,groupSegments,fmtInt,fmtPct,fmtNtd,initialFilters,type CreditFilters} from './data';
import './credit-workspace.css';

export type CreditMode='overview'|'risk'|'payments';
type Bucket='all'|'minus2'|'current'|'zero'|'delayed';
type Dimension='age_band'|'credit_limit_band'|'september_status';
type Measure='count'|'rate';
const PERIODS=['2005-04','2005-05','2005-06','2005-07','2005-08','2005-09'];
const toPct=(v:number)=>fmtPct(v,1);
const codeLabel=(code:string)=>code==='-1'?'−1 · à jour':code==='-2'?'−2 · non précisé':code==='0'?'0 · non précisé':`${code} · ${code} mois`;
const bucketMatch=(s:string,b:Bucket)=>b==='all'||(b==='minus2'&&s==='-2')||(b==='current'&&s==='-1')||(b==='zero'&&s==='0')||(b==='delayed'&&Number(s)>=1);
const BUCKETS:{id:Bucket,label:string,color:string}[]=[
 {id:'minus2',label:'Code −2',color:'#69e1d3'},
 {id:'current',label:'−1 · à jour',color:'#a48afd'},
 {id:'zero',label:'Code 0',color:'#70a8ff'},
 {id:'delayed',label:'1–8 · retard',color:'#f28bb6'}
];
function exportCsv(filename:string,rows:Record<string,string|number>[],keys:string[]){
 const escaped=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';
 const text=[keys.map(escaped).join(','),...rows.map(row=>keys.map(k=>escaped(row[k])).join(','))].join('\r\n');
 const href=URL.createObjectURL(new Blob(['\uFEFF'+text+'\r\n'],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=href;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);
}
function Panel({title,subtitle,children,extra,id,role}:{title:string,subtitle?:string,children:ReactNode,extra?:React.ReactNode,id?:string,role?:string}){
 return <section className={'cw-panel '+(role||'')} id={id} aria-label={title}>
  <div className="cw-panel-head"><div><h2>{title}</h2>{subtitle&&<small>{subtitle}</small>}</div>{extra}</div>
  <div className="cw-panel-body">{children}</div>
 </section>
}
function Switcher({measure,onChange}:{measure:Measure,onChange:(m:Measure)=>void}){
 return <div role="group" className="cw-switch" aria-label="Mesure du graphique">
  <button aria-pressed={measure==='count'} className={measure==='count'?'active':''} onClick={()=>onChange('count')}>Dossiers</button>
  <button aria-pressed={measure==='rate'} className={measure==='rate'?'active':''} onClick={()=>onChange('rate')}>Défaut</button>
 </div>
}
function Nothing(){return <div className="cw-empty"><Info size={18}/>Aucun dossier pour cette sélection. Modifie ou réinitialise les filtres.</div>}
const tableColumns={age_band:'Âge',credit_limit_band:'Plafond',september_status:'Statut'} as const;

export default function CreditWorkspace({filters,onFilters,mode,onMode}:{filters:CreditFilters,onFilters:(x:CreditFilters)=>void,mode:CreditMode,onMode:(x:CreditMode)=>void}){
 const [bucket,setBucket]=useState<Bucket>('all');
 const [ageMeasure,setAgeMeasure]=useState<Measure>('rate');
 const [limitMeasure,setLimitMeasure]=useState<Measure>('rate');
 const [month,setMonth]=useState('2005-09');
 const [dimension,setDimension]=useState<Dimension>('age_band');
 const [search,setSearch]=useState('');
 const [sortBy,setSortBy]=useState<'name'|'count'|'defaults'|'rate'>('name');
 const [sortDesc,setSortDesc]=useState(false);
 const [showCodes,setShowCodes]=useState(false);
 useEffect(()=>{setBucket('all');setShowCodes(false)},[filters.age,filters.limit,filters.status]);
 useEffect(()=>{if(mode==='risk'){setAgeMeasure('rate');setLimitMeasure('rate')}},[mode]);
 const base=useMemo(()=>filteredSegments(filters),[filters]);
 const rows=useMemo(()=>base.filter(s=>bucketMatch(s.september_status,bucket)),[base,bucket]);
 const totals=useMemo(()=>creditTotals(rows),[rows]);
 const agesData=useMemo(()=>groupSegments(rows,'age_band'),[rows]);
 const limitsData=useMemo(()=>groupSegments(rows,'credit_limit_band'),[rows]);
 const grouped=useMemo(()=>groupSegments(rows,dimension),[rows,dimension]);
 const monthly=useMemo(()=>{
  const keys=new Set(rows.map(s=>s.age_band+'|'+s.credit_limit_band+'|'+s.september_status));
  const map=new Map(PERIODS.map(period=>[period,{period,observations:0,delayed:0,rate:0}]));
  for(const p of payments){if(!keys.has(p.age_band+'|'+p.credit_limit_band+'|'+p.september_status))continue;
   const v=map.get(p.period);if(v){v.observations+=p.client_observations;v.delayed+=p.delayed_clients}
  }
  return PERIODS.map(period=>{const x=map.get(period)!;return {...x,rate:x.observations?x.delayed/x.observations:0}});
 },[rows]);
 const september=monthly[5];
 const bucketSlices=useMemo(()=>BUCKETS.map(b=>({ ...b,count:base.filter(x=>bucketMatch(x.september_status,b.id)).reduce((n,x)=>n+x.client_count,0)})),[base]);
 const activeSum=bucketSlices.reduce((n,b)=>n+b.count,0);
 const ring=activeSum?`conic-gradient(${bucketSlices.map((b,i)=>`${b.color} ${100*bucketSlices.slice(0,i).reduce((n,x)=>n+x.count,0)/activeSum}% ${100*bucketSlices.slice(0,i+1).reduce((n,x)=>n+x.count,0)/activeSum}%`).join(',')})`:'rgba(144,166,231,.16)';
 const dataRows=useMemo(()=>grouped.map(x=>({name:x.name,label:dimension==='september_status'?codeLabel(x.name):x.name,count:x.count,defaults:x.defaults,rate:x.rate,avgLimit:x.avgLimit})),[grouped,dimension]);
 const visibleRows=useMemo(()=>dataRows.filter(x=>(x.label+' '+x.name).toLowerCase().includes(search.trim().toLowerCase())).sort((a,b)=>sortBy==='name'?((dimension==='september_status'?Number(a.name)-Number(b.name):a.label.localeCompare(b.label,'fr'))*(sortDesc?-1:1)):(a[sortBy]-b[sortBy])*(sortDesc?-1:1)),[dataRows,search,sortBy,sortDesc,dimension]);
 const updateFilter=(field:'age'|'limit'|'status',value:string)=>onFilters({...filters,[field]:filters[field]===value?'Tout':value});
 const exportGroups=()=>exportCsv('bank360-portefeuille-selection.csv',visibleRows.map(x=>({groupe:x.name,dossiers:x.count,defauts:x.defaults,taux_defaut:x.rate,plafond_moyen_ntd:Math.round(x.avgLimit)})),['groupe','dossiers','defauts','taux_defaut','plafond_moyen_ntd']);
 const exportMonths=()=>exportCsv('bank360-retards-mensuels-selection.csv',monthly.map(x=>({mois:x.period,observations:x.observations,retards:x.delayed,taux_retard:x.rate})),['mois','observations','retards','taux_retard']);
 const sort=(col:'name'|'count'|'defaults'|'rate')=>{setSortDesc(sortBy===col?!sortDesc:col!=='name');setSortBy(col)};
 const chosenMonth=monthly.find(x=>x.period===month)||september;
 const topRate=totals.total?totals.defaults/totals.total:0;
 const ageTop=Math.max(...agesData.map(x=>x.rate),.01);
 const ageScale=ageMeasure==='rate'?Math.max(.3,Math.ceil(ageTop*10)/10):Math.max(1,...agesData.map(x=>x.count));
 const maxMonthly=Math.max(...monthly.map(m=>m.rate),.01);
 const maxMonthlyScale=Math.max(.1,Math.ceil(maxMonthly*100/10)/10);
 const monthlyPoints=monthly.map((m,i)=>`${28+i*69},${150-124*m.rate/maxMonthlyScale}`).join(' ');
 const fullFilters=filters.age!=='Tout'||filters.limit!=='Tout'||filters.status!=='Tout'||bucket!=='all';
 return <div className="screen credit-workspace" data-mode={mode} data-population={totals.total}>
  <div className="cw-modebar" role="tablist" aria-label="Perspective crédit">
   {([{id:'overview',title:'Vue globale'},{id:'risk',title:'Risque'},{id:'payments',title:'Paiements'}] as const).map(x=><button role="tab" aria-selected={mode===x.id} className={mode===x.id?'active':''} key={x.id} onClick={()=>onMode(x.id)}>{x.title}</button>)}
   <div className="cw-mode-spacer"/>
   {fullFilters&&<button className="cw-clear-scope" onClick={()=>{onFilters(initialFilters);setBucket('all')}}><X size={14}/>Effacer la sélection</button>}
   {bucket!=='all'&&<span className="cw-active-bucket">{BUCKETS.find(x=>x.id===bucket)?.label}</span>}
  </div>
  <div className="cw-kpis" aria-label="Indicateurs du portefeuille filtré">
   {[
    {id:'clients',icon:Wallet,label:'Dossiers de crédit',value:fmtInt(totals.total),note:'Clients distincts',tone:'blue'},
    {id:'defaults',icon:ShieldAlert,label:'Dossiers en défaut',value:fmtInt(totals.defaults),note:totals.total?`${toPct(topRate)} du portefeuille`:'Aucun dossier',tone:'violet'},
    {id:'limit',icon:CreditCard,label:'Plafond moyen',value:totals.total?fmtNtd(totals.avgLimit):'—',note:'Moyenne pondérée · NTD',tone:'mint'},
    {id:'late',icon:Clock3,label:'Retards · septembre',value:fmtInt(september.delayed),note:september.observations?`${toPct(september.rate)} des dossiers`:'Aucun dossier',tone:'rose'}
   ].map(k=>{const Icon=k.icon;return <div className={'cw-kpi tone-'+k.tone} key={k.id}><span className="cw-kpi-icon"><Icon size={23}/></span><div><span>{k.label}</span><strong>{k.value}</strong><small>{k.note}</small></div></div>})}
  </div>
  <div className="cw-board">
   <Panel title="Segmentation par âge" role="cw-age cw-credit-priority" extra={<Switcher measure={ageMeasure} onChange={setAgeMeasure}/>}>
    {totals.total===0?<Nothing/>:<div className="cw-age-layout">
     <div className="cw-axis" aria-hidden="true"><span>{ageMeasure==='rate'?fmtPct(ageScale,0):fmtInt(ageScale)}</span><span>{ageMeasure==='rate'?fmtPct(ageScale/2,0):''}</span><span>{ageMeasure==='rate'?'0 %':'0'}</span></div>
     <div className="cw-age-bars" role="group" aria-label="Segmentation par âge">
      {agesData.map(a=>{const val=ageMeasure==='rate'?a.rate:a.count;const scale=ageScale;return <button type="button" className={'cw-age-bar '+(filters.age===a.name?'active':'')} key={a.name} onClick={()=>updateFilter('age',a.name)} aria-label={`${a.name} : ${ageMeasure==='rate'?toPct(val):fmtInt(val)+' dossiers'}, ${fmtInt(a.count)} dossiers`}>
        <b>{ageMeasure==='rate'?toPct(val):fmtInt(val)}</b><div className="cw-age-track"><i style={{height:(100*val/scale)+'%'}}/></div><span>{a.name}</span><small>n={fmtInt(a.count)}</small>
       </button>})}
     </div>
    </div>}
   </Panel>
   <Panel title="Évolution des retards" subtitle="Avril à septembre 2005 · taux mensuel" role="cw-trend cw-payment-priority">
    {totals.total===0?<Nothing/>:<div className="cw-trend-chart">
      <div className="cw-trend-axis" aria-hidden="true"><span>{toPct(maxMonthlyScale)}</span><span>{toPct(maxMonthlyScale/2)}</span><span>0 %</span></div>
      <div className="cw-trend-plot"><svg viewBox="0 0 400 170" preserveAspectRatio="none" role="img" aria-label="Taux mensuel de retards, échelle à partir de zéro">
       <defs><linearGradient id="cw-line-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ac88fd" stopOpacity=".25"/><stop offset="1" stopColor="#ac88fd" stopOpacity="0"/></linearGradient></defs>
       {[26,88,150].map(y=><path key={y} d={`M 28 ${y} L 373 ${y}`} stroke="#b8c8ff33" strokeDasharray="3 5" fill="none"/>)}
       <path d={`M 28 150 L ${monthlyPoints} L 373 150 Z`} fill="url(#cw-line-fill)"/>
       <polyline points={monthlyPoints} fill="none" stroke="#b391fd" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
       {monthly.map((m,i)=><circle key={m.period} cx={28+i*69} cy={150-124*m.rate/maxMonthlyScale} r={m.period===month?5:3.5} fill={m.period===month?'#edbcff':'#c9b2ff'} stroke="#714fb7" strokeWidth="1.5"/>)}
      </svg>
       <div className="cw-month-picks">{monthly.map(x=><button key={x.period} aria-pressed={month===x.period} onClick={()=>setMonth(x.period)} className={month===x.period?'active':''} title={`${x.period} · ${toPct(x.rate)}`}><strong>{toPct(x.rate)}</strong><span>{x.period.slice(5)}</span></button>)}</div>
      </div>
     </div>}
   </Panel>
   <Panel title="Détail du portefeuille" role="cw-detail cw-credit-priority" extra={<div className="cw-detail-actions"><button className="cw-icon-action" onClick={exportGroups} aria-label="Exporter les segments filtrés en CSV" title="Exporter CSV"><ArrowDownToLine size={16}/></button><label className="cw-search"><Search size={14}/><input aria-label="Rechercher un groupe" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."/></label></div>}>
    <div className="cw-table-tools"><div role="group" aria-label="Dimension du tableau">{([{id:'age_band',label:'Âge'},{id:'credit_limit_band',label:'Plafond'},{id:'september_status',label:'Statut'}] as const).map(x=><button className={dimension===x.id?'active':''} key={x.id} onClick={()=>{setDimension(x.id);setSearch('')}}>{x.label}</button>)}</div><span>{fmtInt(visibleRows.reduce((n,x)=>n+x.count,0))} dossiers</span></div>
    <div className="cw-table-scroll"><table><thead><tr>{([{id:'name',label:tableColumns[dimension]},{id:'count',label:'Dossiers'},{id:'defaults',label:'Défauts'},{id:'rate',label:'Taux'}] as const).map(x=><th key={x.id}><button onClick={()=>sort(x.id)}>{x.label}{sortBy===x.id?(sortDesc?' ↓':' ↑'):''}</button></th>)}</tr></thead><tbody>
     {visibleRows.map(x=><tr key={x.name} onClick={()=>{if(dimension==='age_band')updateFilter('age',x.name);if(dimension==='credit_limit_band')updateFilter('limit',x.name);if(dimension==='september_status')updateFilter('status',x.name)}} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'){if(dimension==='age_band')updateFilter('age',x.name);if(dimension==='credit_limit_band')updateFilter('limit',x.name);if(dimension==='september_status')updateFilter('status',x.name)}}} title="Filtrer ce groupe"><td>{x.label}</td><td>{fmtInt(x.count)}</td><td>{fmtInt(x.defaults)}</td><td>{toPct(x.rate)}</td></tr>)}
     {visibleRows.length===0&&<tr><td colSpan={4}>Aucun segment correspondant.</td></tr>}
    </tbody></table></div>
   </Panel>
   <Panel title="Segmentation par plafond" role="cw-limit cw-credit-priority" extra={<Switcher measure={limitMeasure} onChange={setLimitMeasure}/>}>
    {totals.total===0?<Nothing/>:<div className="cw-limits">{limitsData.map(x=>{const value=limitMeasure==='rate'?x.rate:x.count;const scale=limitMeasure==='rate'?Math.max(...limitsData.map(y=>y.rate),.01):Math.max(...limitsData.map(y=>y.count),1);return <button key={x.name} className={'cw-limit-row '+(filters.limit===x.name?'active':'')} onClick={()=>updateFilter('limit',x.name)} aria-label={`${x.name} : ${limitMeasure==='rate'?toPct(value):fmtInt(value)+' dossiers'} sur ${fmtInt(x.count)} dossiers`}><span className="cw-limit-name">{x.name}<small>n={fmtInt(x.count)}</small></span><span className="cw-limit-track"><i style={{width:(value/scale*100)+'%'}}/></span><b>{limitMeasure==='rate'?toPct(value):fmtInt(value)}</b></button>})}</div>}
   </Panel>
   <Panel title="Statut de paiement · septembre" role="cw-status cw-payment-priority" extra={<button className="cw-expand" aria-expanded={showCodes} onClick={()=>setShowCodes(x=>!x)}><span>Codes</span><ChevronDown size={14}/></button>}>
    {activeSum===0?<Nothing/>:<div className="cw-status-layout">
     <div className="cw-donut" role="img" aria-label={`Répartition des codes de septembre, ${fmtInt(activeSum)} dossiers`} style={{background:ring}}><div><strong>{fmtInt(activeSum)}</strong><span>dossiers</span></div></div>
     <div className="cw-status-list">{bucketSlices.map(b=><button key={b.id} aria-pressed={bucket===b.id} className={bucket===b.id?'active':''} onClick={()=>setBucket(bucket===b.id?'all':b.id)}><i style={{background:b.color}}/><span>{b.label}</span><strong>{fmtInt(b.count)}</strong><small>{toPct(b.count/activeSum)}</small></button>)}
      {bucket==='delayed'&&<button className="cw-drill" onClick={()=>setShowCodes(v=>!v)}>Inspecter les codes 1–8 <ChevronDown size={13}/></button>}
     </div>
     {showCodes&&<div className="cw-code-detail"><span>Codes de septembre · sélectionne un retard</span><div>{[...new Set(segments.map(s=>s.september_status))].sort((a,b)=>Number(a)-Number(b)).map(code=><button key={code} onClick={()=>{onFilters({...filters,status:code});setShowCodes(false)}} aria-pressed={filters.status===code}>{codeLabel(code)}</button>)}</div></div>}
    </div>}
   </Panel>
   <Panel title="Détail mensuel" role="cw-monthtable cw-payment-priority" extra={<button className="cw-icon-action" onClick={exportMonths} aria-label="Exporter le détail mensuel en CSV" title="Exporter CSV"><ArrowDownToLine size={16}/></button>}>
    <div className="cw-table-scroll"><table><thead><tr><th>Mois</th><th>Observations</th><th>Retards</th><th>Taux</th></tr></thead><tbody>{monthly.map(x=><tr key={x.period} className={month===x.period?'active':''} onClick={()=>setMonth(x.period)} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')setMonth(x.period)}}><td>{x.period}</td><td>{fmtInt(x.observations)}</td><td>{fmtInt(x.delayed)}</td><td>{x.observations?toPct(x.rate):'—'}</td></tr>)}</tbody></table></div>
    <div className="cw-month-foot"><span><Check size={14}/> {chosenMonth.period} : {fmtInt(chosenMonth.delayed)} retards</span><small>6 mois · mêmes dossiers · observations répétées</small></div>
   </Panel>
  </div>
 </div>;
}
