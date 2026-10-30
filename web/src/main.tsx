import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {
 Activity,ArrowDownRight,ArrowLeft,ArrowRight,ArrowUpRight,BarChart3,Bell,BrainCircuit,Check,ChevronDown,ChevronRight,
 CircleAlert,Command,Compass,CreditCard,Database,Download,FileBarChart2,Fingerprint,Folder,Home,Info,Layers3,
 Menu, Moon,Search,Settings2,Shield,ShieldAlert,ShieldCheck,SlidersHorizontal,Sun,Target,TrendingUp,Users2,
 Wallet,X,Clock3,Table2,LayoutDashboard,Eye,CheckCircle2,ChartNoAxesCombined
} from 'lucide-react';
import {
 segments,ages,limits,b3,b4,b3Deciles,b4Deciles,fraudTypes,fraudDays,filteredSegments,groupSegments,
 creditTotals,paymentSeries,reconcile,initialFilters,fmtInt,fmtPct,fmtNtd,
 type CreditFilters
} from './data';
import {creditCalibration,creditDrivers,creditAudit,driverLabels} from './riskEvidence';
import './styles.css';
import HomeOverview from './HomeOverview';
import CreditWorkspace,{type CreditMode} from './CreditWorkspace';
import FraudWorkspace,{FraudFilterBar,initialFraudScope,type FraudScope,type FraudMode} from './FraudWorkspace';
import IntelligenceWorkspace,{IntelligenceHeader,type IntelligencePerspective,type IntelligenceContext,type DiagnosticView} from './IntelligenceWorkspace';
import QualityWorkspace from './QualityWorkspace';
import ReportsWorkspace from './ReportsWorkspace';
import CrossAnalysisWorkspace from './CrossAnalysisWorkspace';
import CrossGovernanceWorkspace from './CrossGovernanceWorkspace';

type Page='home'|'portfolio'|'fraud'|'models'|'quality'|'reports'|'cross'|'cross-governance';
type Domain='credit'|'fraud';
type IconType=typeof Home;
const pageInfo:{id:Page,title:string,short:string,domain:string,icon:IconType}[]=[
 {id:'home',title:'Vue d’ensemble',short:'Accueil',domain:'Pilotage',icon:Home},
 {id:'portfolio',title:'Portefeuille & segmentation',short:'Portefeuille',domain:'Crédit',icon:Wallet},
 {id:'fraud',title:'Détection de fraude & analyse des alertes',short:'Fraude',domain:'Fraude',icon:Fingerprint},
 {id:'models',title:'Modèles & explorateur de données',short:'Intelligence',domain:'Intelligence',icon:BrainCircuit},
 {id:'quality',title:'Qualité & traçabilité',short:'Qualité',domain:'Gouvernance',icon:Database},
 {id:'reports',title:'Rapports & préférences',short:'Rapports',domain:'Gouvernance',icon:FileBarChart2},
 {id:'cross',title:'Analyse 360 · vision croisée',short:'Analyse 360',domain:'Analyse',icon:ChartNoAxesCombined},
 {id:'cross-governance',title:'Gouvernance & preuves',short:'Preuves',domain:'Gouvernance',icon:ShieldCheck}
];
const byId=Object.fromEntries(pageInfo.map(x=>[x.id,x])) as Record<Page,typeof pageInfo[number]>;
const groups:{id:string,title:string,icon:IconType,items:Page[]}[]=[
 {id:'home',title:'Vue d’ensemble',icon:Home,items:['home']},
 {id:'credit',title:'Crédit',icon:Wallet,items:['portfolio']},
 {id:'fraud',title:'Fraude',icon:Shield,items:['fraud']},
 {id:'intelligence',title:'Intelligence',icon:BrainCircuit,items:['models']},
 {id:'quality',title:'Qualité',icon:Database,items:['quality']},
 {id:'reports',title:'Rapports',icon:FileBarChart2,items:['reports']}
];
const crossGroups:{id:string,title:string,icon:IconType,items:Page[]}[]=[
 {id:'cross',title:'Analyse 360',icon:ChartNoAxesCombined,items:['cross']},
 {id:'cross-governance',title:'Gouvernance & preuves',icon:ShieldCheck,items:['cross-governance']}
];
const asInt=(n:number)=>fmtInt(n);
const asPct=(n:number,decimals=1)=>fmtPct(n,decimals);
const asNum=(n:number,decimals=3)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:decimals,minimumFractionDigits:decimals}).format(n);
// PAY_0 : the source dictionary defines -1 and 1–8. Other raw codes occur
// in the dataset but do not receive an invented business meaning.
const paymentStatusLabel=(code:string)=>code==='-1'?'−1 · à jour':(code==='-2'||code==='0')?code.replace('-','−')+' · non précisé':/^[1-8]$/.test(code)?code+' · '+code+' mois':code+' · non précisé';
const paymentStatusFull=(code:string)=>code==='-1'?'Paiement à jour':/^[1-8]$/.test(code)?'Retard de '+code+' mois':`Code ${code} : signification non précisée par la source UCI`;
const f=b4.holdout_test;
const r=b3.holdout_test_metrics;
const xCsv=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';
function downloadCsv(name:string,rows:Record<string,string|number|null>[],cols:string[]){
 const body=[cols.map(xCsv).join(','),...rows.map(row=>cols.map(k=>xCsv(row[k])).join(','))].join('\r\n');
 const url=URL.createObjectURL(new Blob(['\uFEFF'+body+'\r\n'],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function Card({title,children,extra,className='',subtitle}:{title?:string,children:React.ReactNode,extra?:React.ReactNode,className?:string,subtitle?:string}){
 return <section className={'surface '+className}>{(title||extra)&&<div className="surface-head"><div><h2>{title}</h2>{subtitle&&<span className="surface-subtitle">{subtitle}</span>}</div>{extra}</div>}<div className="surface-body">{children}</div></section>
}
function Metric({label,value,note,accent='blue',icon:Icon}:{label:string,value:string,note?:string,accent?:'blue'|'rose'|'mint'|'violet',icon?:IconType}){
 return <div className={'metric metric-'+accent}><div className="metric-top">{Icon?<Icon size={16}/>:<span className="metric-mark"/>}<span>{label}</span></div><strong>{value}</strong>{note&&<small>{note}</small>}</div>
}
function KPIs({children}:{children:React.ReactNode}){return <div className="metrics">{children}</div>}
function Tabs({options,value,onChange,label}:{options:{id:string,label:string}[],value:string,onChange:(id:string)=>void,label:string}){
 return <div className="segmented" role="group" aria-label={label}>{options.map(o=><button type="button" key={o.id} aria-pressed={value===o.id} className={value===o.id?'is-selected':''} onClick={()=>onChange(o.id)}>{o.label}</button>)}</div>
}
function ChartBars({items,format=asPct,accent='blue',selected,onSelect}:{items:{id:string,label:string,value:number,count?:number}[],format?:(n:number)=>string,accent?:'blue'|'rose'|'mint'|'violet',selected?:string,onSelect?:(x:string)=>void}){
 const highest=Math.max(...items.map(x=>x.value),.0001);
 return <div className={'chart-bars tone-'+accent} role="group" aria-label={'Graphique par groupe, échelle de zéro à '+format(highest)}>
   <div className="chart-scale" aria-hidden="true"><span>{format(highest)}</span><span>{format(highest/2)}</span><span>{format(0)}</span></div>
   {items.map(item=><button type="button" className={'chart-bar '+(selected===item.id?'bar-selected':'')} onClick={()=>onSelect?.(item.id)} disabled={!onSelect} key={item.id} title={item.label+' : '+format(item.value)+(item.count===undefined?'':' · '+asInt(item.count)+' dossiers')} aria-label={item.label+' : '+format(item.value)+(item.count===undefined?'':' sur '+asInt(item.count)+' dossiers')}><span className="bar-value">{format(item.value)}</span><span className="bar-track"><i style={{height:Math.max(3,100*item.value/highest)+'%'}}/></span><span className="bar-label">{item.label}</span>{item.count!==undefined&&<small className="bar-count">n={asInt(item.count)}</small>}</button>)}
  </div>;
}
function ChartRows({items,format=asPct,accent='blue',onSelect,selected}:{items:{id:string,label:string,value:number,count?:number}[],format?:(n:number)=>string,accent?:'blue'|'rose'|'mint'|'violet',onSelect?:(s:string)=>void,selected?:string}){
 const top=Math.max(...items.map(x=>x.value),.0001);
 return <div className={'chart-rows tone-'+accent}>{items.map(v=><button type="button" key={v.id} className={'chart-row '+(selected===v.id?'bar-selected':'')} disabled={!onSelect} onClick={()=>onSelect?.(v.id)} title={v.label+' : '+format(v.value)+(v.count===undefined?'':' · '+asInt(v.count)+' dossiers')} aria-label={v.label+' : '+format(v.value)+(v.count===undefined?'':' sur '+asInt(v.count)+' dossiers')}><span className="row-group"><span className="row-name">{v.label}</span>{v.count!==undefined&&<small className="row-count">n={asInt(v.count)}</small>}</span><span className="row-track"><i style={{width:100*v.value/top+'%'}}/></span><b>{format(v.value)}</b></button>)}</div>
}
function Trend({items,accent='blue',format=asPct}:{items:{label:string,value:number}[],accent?:'blue'|'rose'|'mint',format?:(v:number)=>string}){
 const highest=Math.max(.001,...items.map(i=>i.value));
 const points=items.map((v,i)=>`${6+(i*728/Math.max(1,items.length-1))},${148-(v.value/highest)*118}`).join(' ');
 return <div className={'trend tone-'+accent}>
  <div className="trend-plot"><div className="trend-scale" aria-hidden="true"><span>{format(highest)}</span><span>{format(highest/2)}</span><span>{format(0)}</span></div>
   <svg viewBox="0 0 740 160" preserveAspectRatio="none" role="img" aria-label={'Part des retards, axe vertical de zéro à '+format(highest)}>
    <defs><linearGradient id="trend-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".20"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
    {[29,89,148].map(y=><path key={y} d={`M 0 ${y} H 740`} className="trend-line"/>)}<polygon points={`6,148 ${points} 734,148`} fill="url(#trend-shade)"/><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/></svg>
  </div><div className="trend-legend">{items.map(i=><div key={i.label}><small>{i.label}</small><b>{format(i.value)}</b></div>)}</div>
 </div>;
}
function CalibrationView(){
 return <div className="calibration-view" aria-label="Calibration du modèle de crédit : score moyen et taux observé par tranche">
  <div className="calibration-legend"><span><i className="predicted"/>Score moyen</span><span><i className="observed"/>Défaut observé</span></div>
  <div className="calibration-list">{creditCalibration.map(x=><div className="calibration-row" key={x.bin}>
   <span className="calibration-name">{x.bin}<small>{asInt(x.n)} dossiers</small></span>
   <div className="calibration-pair"><div className="calibration-bar predicted" title={'Score moyen : '+asPct(x.predicted)}><i style={{width:100*x.predicted+'%'}}/></div><div className="calibration-bar observed" title={'Défaut observé : '+asPct(x.observed)}><i style={{width:100*x.observed+'%'}}/></div></div>
   <strong>{asPct(x.predicted)} / {asPct(x.observed)}</strong>
  </div>)}</div>
  <div className="calibration-caption">Score moyen / fréquence observée · test indépendant</div>
 </div>;
}
function Table({headers,rows}:{headers:{key:string,label:string,format?:(x:unknown)=>React.ReactNode}[],rows:Record<string,unknown>[]}){
 const [sort,setSort]=useState(''),[desc,setDesc]=useState(false);
 const ordered=useMemo(()=>sort?[...rows].sort((a,b)=>{const u=a[sort],v=b[sort];return (typeof u==='number'&&typeof v==='number'?u-v:String(u??'').localeCompare(String(v??''),'fr'))*(desc?-1:1)}):rows,[rows,sort,desc]);
 return <div className="table-viewport"><table><thead><tr>{headers.map(h=><th key={h.key}><button type="button" onClick={()=>{setSort(h.key);setDesc(sort===h.key?!desc:false)}}>{h.label}{sort===h.key?(desc?' ↓':' ↑'):''}</button></th>)}</tr></thead><tbody>{ordered.map((row,i)=><tr key={i}>{headers.map(h=><td key={h.key}>{h.format?h.format(row[h.key]):String(row[h.key]??'—')}</td>)}</tr>)}{rows.length===0&&<tr><td colSpan={headers.length}>Aucun groupe pour ces filtres.</td></tr>}</tbody></table></div>
}
function SourceTag({kind}:{kind:Domain}){return <span className={'source-tag '+kind}><span/>{kind==='credit'?'Crédit · Taïwan 2005':'Fraude · simulation'}</span>}
function FilterBar({value,onChange,withStatus=false}:{value:CreditFilters,onChange:(f:CreditFilters)=>void,withStatus?:boolean}){
 const selects=[{id:'age',label:'Âge',options:ages},{id:'limit',label:'Plafond',options:limits},...(withStatus?[{id:'status',label:'Statut septembre',options:[...new Set(segments.map(s=>s.september_status))].sort((a,b)=>+a-+b)}]:[])];
 return <div className="filterbar">{selects.map(cfg=><label key={cfg.id}>{cfg.label}<select id={'filter-'+cfg.id} value={value[cfg.id as keyof CreditFilters]} onChange={e=>onChange({...value,[cfg.id]:e.target.value})}><option value="Tout">Tous</option>{cfg.options.map(o=><option key={o} value={o}>{cfg.id==='status'?paymentStatusLabel(o):o}</option>)}</select></label>)}<button type="button" className="reset-btn" aria-label="Réinitialiser les filtres" onClick={()=>onChange(initialFilters)}><X size={15}/> Réinitialiser</button></div>
}
function Empty(){return <div className="empty"><Info size={18}/> Aucun résultat pour cette sélection.</div>}

function App(){
 const [page,setPage]=useState<Page>(()=>new URLSearchParams(window.location.search).get('x1')==='1'?'cross':'home');
 const [menu,setMenu]=useState<string|null>(null);
 const [searchOpen,setSearchOpen]=useState(false),[query,setQuery]=useState('');
 const [theme,setTheme]=useState<'dark'|'light'>('dark');
 const [filters,setFilters]=useState<CreditFilters>(initialFilters);
 const [creditMode,setCreditMode]=useState<CreditMode>('overview');
 const [intelligenceContext,setIntelligenceContext]=useState<IntelligenceContext>('credit');
 const [intelligencePerspective,setIntelligencePerspective]=useState<IntelligencePerspective>('overview');
 const [modelView,setModelView]=useState<DiagnosticView>('ranking');
 const [fraudMode,setFraudMode]=useState<FraudMode>('overview');
 const [fraudScope,setFraudScope]=useState<FraudScope>(initialFraudScope);
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{document.documentElement.dataset.theme=theme},[theme]);
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setSearchOpen(true)}if(e.key==='Escape'){setSearchOpen(false);setMenu(null)}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[]);
 const go=(id:Page|'risk'|'payments'|'alerts'|'explorer')=>{if(id==='risk'||id==='payments'){setCreditMode(id);setPage('portfolio')}else if(id==='alerts'){setFraudMode('alerts');setPage('fraud')}else if(id==='explorer'){setIntelligencePerspective('explorer');setPage('models')}else{if(id==='fraud')setFraudMode('overview');if(id==='models')setIntelligencePerspective('overview');setPage(id)}setMenu(null);setSearchOpen(false);setQuery('')};
 const crossMode=page==='cross'||page==='cross-governance';
 const currentGroups=crossMode?crossGroups:groups;
 const selected=byId[page];
 const credit=useMemo(()=>filteredSegments(filters),[filters]);
 const total=useMemo(()=>creditTotals(credit),[credit]);
 const agesGroup=useMemo(()=>groupSegments(credit,'age_band'),[credit]);
 const limitsGroup=useMemo(()=>groupSegments(credit,'credit_limit_band'),[credit]);
 const statusGroup=useMemo(()=>groupSegments(credit,'september_status'),[credit]);
 const months=useMemo(()=>paymentSeries(filters),[filters]);
 const checks=reconcile();
 const navMatches=pageInfo.filter(p=>(p.title+' '+p.short+' '+p.domain).toLowerCase().includes(query.toLowerCase()));
 const stepper=groups.find(g=>g.items.includes(page));
 const scopedCredit=page==='portfolio';
 const showScope=page==='portfolio';
 const segmentRows=agesGroup.map(x=>({segment:x.name,clients:x.count,defaults:x.defaults,rate:x.rate,avg:x.avgLimit}));
 const monthTotal=months.reduce((a,x)=>a+x.observations,0),lateTotal=months.reduce((a,x)=>a+x.delayed,0);
 const downloadFiltered=()=>downloadCsv('bank360-portefeuille.csv',credit.map(x=>({...x})),['age_band','credit_limit_band','september_status','client_count','default_count','delayed_count','total_credit_limit_ntd','total_age_years']);
 const downloadAlerts=()=>downloadCsv('bank360-alertes.csv',fraudTypes.map(x=>({...x})),['type','transactions','frauds','alerts','tp','fp','fn','precision','recall']);
 return <div className="app">
  <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
  {menu&&<button className="nav-dismiss" aria-label="Fermer les sous-pages" onClick={()=>setMenu(null)}/>}
  <div className="app-layout">
   <aside className={'nav-dock '+(crossMode?'x1-active':'')} aria-label="Navigation BANK 360"><div className="dock-emblem" aria-label="BANK 360"><div/></div><nav aria-label="Sections">{currentGroups.map(g=>{const Icon=g.icon;const active=g.items.includes(page);const open=menu===g.id;return <div className="dock-group" key={g.id}><button type="button" className={'dock-link '+(active?'active':'')} title={g.title} aria-label={g.title} aria-expanded={g.items.length>1?open:undefined} onClick={()=>g.items.length===1?go(g.items[0]):setMenu(open?null:g.id)}><Icon size={20}/></button>{open&&g.items.length>1&&<div className="dock-popover" role="menu" aria-label={g.title}><span className="popover-heading">{g.title}</span>{g.items.map(id=>{const item=byId[id],SubIcon=item.icon;return <button key={id} role="menuitem" className={page===id?'selected':''} onClick={()=>go(id)}><SubIcon size={16}/>{item.short}<ChevronRight size={14}/></button>})}</div>}</div>})}</nav><div className="dock-footer" title="BANK 360"><span>B</span></div></aside>
   <div className="work-area">
    <header className="topbar"><div className="wordmark">BANK <span>360</span></div><div className="top-divider"/><button className="search-trigger" onClick={()=>setSearchOpen(true)}><Search size={17}/><span>Accéder à une page</span><kbd>Ctrl K</kbd></button><button type="button" className="x1-switch" aria-label={crossMode?"Revenir aux six pages classiques":"Ouvrir Analyse 360"} onClick={()=>setPage(crossMode?"home":"cross")}>{crossMode?"Version classique":"Analyse 360"}</button><div className="top-spacer"/><span className="archive-label"><span/>Données historisées</span><button className="top-icon" title="Changer le thème" aria-label="Basculer le thème" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><button className="top-icon" title="Provenance des données" aria-label="Ouvrir la traçabilité" onClick={()=>crossMode?setPage('cross-governance'):go('quality')}><ShieldCheck size={18}/></button><div className="profile-bubble" aria-label="BANK 360">B</div></header>
    <div className="view-head"><div className="view-name"><span className="view-overline">{selected.domain}</span>{page==='fraud'?<div className="fw-heading-copy"><h1>{selected.title}</h1><small>Transactions simulées · détection et investigation agrégées</small></div>:page==='models'?<div className="iw-title"><h1>{selected.title}</h1><small>Performance des modèles, diagnostics et lecture agrégée des groupes.</small></div>:<h1>{selected.title}</h1>}</div><div className="view-tools">{page==='fraud'&&<FraudFilterBar scope={fraudScope} onScope={setFraudScope}/>} {showScope&&<SourceTag kind="credit"/>} {scopedCredit&&<FilterBar value={filters} onChange={setFilters} withStatus/>} {page==='models'&&<IntelligenceHeader perspective={intelligencePerspective} onPerspective={setIntelligencePerspective} context={intelligenceContext} onContext={v=>{setIntelligenceContext(v);setModelView('ranking')}}/>} </div></div>
    <main className="view" id="main-content" data-page={page}>
    {page==='home'&&<HomeOverview
onGo={go}
onAge={age=>{setFilters({...initialFilters,age});go('risk')}}
onChannel={type=>{setFraudScope({...initialFraudScope,channel:type});setFraudMode('alerts');setPage('fraud')}}
onCalibration={()=>{go('models');setIntelligenceContext('fraud');setModelView('drift');setIntelligencePerspective('models')}}
/>}
    {page==='portfolio'&&<CreditWorkspace filters={filters} onFilters={setFilters} mode={creditMode} onMode={setCreditMode}/>}
     {page==='fraud'&&<FraudWorkspace mode={fraudMode} onMode={setFraudMode} scope={fraudScope} onScope={setFraudScope}/>}
    {page==='models'&&<IntelligenceWorkspace perspective={intelligencePerspective} onPerspective={setIntelligencePerspective} context={intelligenceContext} onContext={setIntelligenceContext} filters={filters} onFilters={setFilters} diagnostic={modelView} onDiagnostic={setModelView}/>}
     {page==='quality'&&<QualityWorkspace checks={checks}/>}
    {page==='reports'&&<ReportsWorkspace filters={filters} onResetFilters={()=>setFilters(initialFilters)} theme={theme} onToggleTheme={()=>setTheme(t=>t==='dark'?'light':'dark')} checks={checks}/>}
    {page==='cross'&&<CrossAnalysisWorkspace filters={filters} onFilters={setFilters} fraud={fraudScope} onFraud={setFraudScope} onGovernance={()=>setPage('cross-governance')}/>}
    {page==='cross-governance'&&<CrossGovernanceWorkspace filters={filters} fraud={fraudScope} onReset={()=>setFilters(initialFilters)} theme={theme} onTheme={()=>setTheme(t=>t==='dark'?'light':'dark')} checks={checks} onAnalysis={()=>setPage('cross')}/>}
    </main>
    <div className="statusline"><span>UCI · historique 2005</span><span className="status-divider"/><span>PaySim · simulation</span><span className="status-spacer"/><span>Analyse descriptive</span></div>
   </div>
  </div>
  {searchOpen&&<div className="command-backdrop" onMouseDown={()=>setSearchOpen(false)}><div className="command-panel" role="dialog" aria-modal="true" aria-label="Navigation rapide" onMouseDown={e=>e.stopPropagation()}><div className="command-input"><Search size={21}/><input ref={input} autoFocus placeholder="Rechercher une page…" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&navMatches[0])go(navMatches[0].id)}}/><button onClick={()=>setSearchOpen(false)} aria-label="Fermer la recherche"><X size={19}/></button></div><div className="command-results">{navMatches.map(x=>{const Icon=x.icon;return <button key={x.id} onClick={()=>go(x.id)}><Icon size={18}/><span>{x.title}</span><small>{x.domain}</small><ArrowRight size={15}/></button>})}{navMatches.length===0&&<div className="command-empty">Aucun résultat.</div>}</div><div className="command-hint">Navigation uniquement · Entrée pour ouvrir · Échap pour fermer</div></div></div>}
 </div>
}
createRoot(document.getElementById('root')!).render(<App/>);
