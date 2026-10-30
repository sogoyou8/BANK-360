import {useMemo,useState} from 'react';
import {Activity,ArrowDownToLine,Bell,CheckCircle2,ChevronRight,CircleAlert,Download,Fingerprint,Info,Layers3,Search,ShieldAlert,X} from 'lucide-react';
import {b4,fraudDays,fraudTypes,fmtInt,fmtPct} from './data';
import './fraud-workspace.css';

export type FraudMode='overview'|'detection'|'alerts';
export type FraudKind='all'|'tp'|'fp';
export type FraudScope={day:string,channel:string,kind:FraudKind};
export const initialFraudScope:FraudScope={day:'Tous',channel:'Tous',kind:'all'};
type Measure='alerts'|'transactions'|'frauds'|'tp';
type Group=typeof fraudDays[number];
type Channel=typeof fraudTypes[number];
const test=b4.holdout_test;
const channels=fraudTypes.filter(c=>c.alerts>0);
const int=fmtInt;
const pct=(v:number)=>fmtPct(v,1);
const value=(n:number)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:3,minimumFractionDigits:3}).format(n);
const kinds:{id:FraudKind,label:string}[]=[{id:'all',label:'Toutes'},{id:'tp',label:'Vraies'},{id:'fp',label:'Fausses'}];
const kindsName:Record<FraudKind,string>={all:'Alertes',tp:'Vraies alertes',fp:'Fausses alertes'};
const selectedCount=(g:{alerts:number,tp:number,fp:number},kind:FraudKind)=>g[kind==='all'?'alerts':kind];
const testGlobal={transactions:test.n,frauds:test.frauds,alerts:test.alerted,tp:test.confusion.tp,fp:test.confusion.fp,fn:test.confusion.fn};
type Stats=typeof testGlobal;

function csv(name:string,rows:Record<string,string|number>[],keys:string[]){
 const escape=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';
 const contents=[keys.map(escape).join(','),...rows.map(r=>keys.map(k=>escape(r[k])).join(','))].join('\r\n');
 const url=URL.createObjectURL(new Blob(['\uFEFF'+contents+'\r\n'],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function Panel({title,subtitle,extra,children,role}:{title:string,subtitle?:string,extra?:React.ReactNode,children:React.ReactNode,role:string}){
 return <section className={'fw-panel '+role} aria-label={title}>
   <header className="fw-panel-head"><div><h2>{title}</h2>{subtitle&&<small>{subtitle}</small>}</div>{extra}</header>
   <div className="fw-panel-body">{children}</div>
 </section>;
}
export function FraudFilterBar({scope,onScope}:{scope:FraudScope,onScope:(f:FraudScope)=>void}){
 return <div className="fw-filters" role="group" aria-label="Filtres fraude PaySim">
   <label>Jour simulé<select aria-label="Jour simulé" value={scope.day} onChange={e=>onScope({...scope,day:e.target.value,channel:'Tous'})}><option value="Tous">J25 – J30</option>{fraudDays.map(d=><option value={String(d.day)} key={d.day}>J{d.day}</option>)}</select></label>
   <label>Canal<select aria-label="Canal" value={scope.channel} onChange={e=>onScope({...scope,channel:e.target.value,day:'Tous'})}><option value="Tous">Tous</option>{channels.map(c=><option value={c.type} key={c.type}>{c.type}</option>)}</select></label>
   <label>Statut alerte<select aria-label="Statut alerte" value={scope.kind} onChange={e=>onScope({...scope,kind:e.target.value as FraudKind})}>{kinds.map(k=><option value={k.id} key={k.id}>{k.label}</option>)}</select></label>
   <button className="fw-reset" onClick={()=>onScope(initialFraudScope)}><X size={14}/> Réinitialiser</button>
 </div>;
}
export default function FraudWorkspace({mode,onMode,scope,onScope}:{mode:FraudMode,onMode:(x:FraudMode)=>void,scope:FraudScope,onScope:(f:FraudScope)=>void}){
 const [measure,setMeasure]=useState<Measure>('alerts');
 const [trendView,setTrendView]=useState<'alerts'|'transactions'|'combined'>('alerts');
 const [detailType,setDetailType]=useState<'days'|'channels'>('days');
 const [query,setQuery]=useState('');
 const [sortDesc,setSortDesc]=useState(true);
 const [detailSort,setDetailSort]=useState<'group'|'alerts'>('group');
 const source:Stats=useMemo(()=>{
  if(scope.channel!=='Tous'){const c=channels.find(x=>x.type===scope.channel);if(c)return {transactions:c.transactions,frauds:c.frauds,alerts:c.alerts,tp:c.tp,fp:c.fp,fn:c.fn}}
  if(scope.day!=='Tous'){const d=fraudDays.find(x=>String(x.day)===scope.day);if(d)return {transactions:d.transactions,frauds:d.frauds,alerts:d.alerts,tp:d.tp,fp:d.fp,fn:d.fn}}
  return testGlobal;
 },[scope.day,scope.channel]);
 const populationName=scope.channel!=='Tous'?scope.channel:scope.day!=='Tous'?'J'+scope.day:'Test chronologique';
 const totalKind=selectedCount(source,scope.kind);
 const shownDays=fraudDays;
 const shownChannels=channels;
 const channelsMax=Math.max(1,...shownChannels.map(c=>selectedCount(c,scope.kind)));
 const totalChannel=shownChannels.reduce((a,c)=>a+selectedCount(c,scope.kind),0);
 const maximum=Math.max(1,...shownDays.map(d=>d[measure]));
 const trendTransMax=Math.max(1,...fraudDays.map(d=>d.transactions));
 const trendAlertMax=Math.max(1,...fraudDays.map(d=>selectedCount(d,scope.kind)));
 const trendPoints=fraudDays.map((d,i)=>(45+i*81)+','+(164-137*selectedCount(d,scope.kind)/trendAlertMax)).join(' ');
 const trendBarValue=(d:Group)=>trendView==='alerts'?selectedCount(d,scope.kind):d.transactions;
 const trendBarMax=trendView==='alerts'?trendAlertMax:trendTransMax;
 const trendIsCombined=trendView==='combined';
 const ring=source.alerts?'conic-gradient(#56dac4 0 '+(100*source.tp/source.alerts)+'%,#ef83b7 '+(100*source.tp/source.alerts)+'% 100%)':'#31436d';
 const selectDay=(d:number)=>onScope({...scope,day:scope.day===String(d)?'Tous':String(d),channel:'Tous'});
 const selectChannel=(name:string)=>onScope({...scope,channel:scope.channel===name?'Tous':name,day:'Tous'});
 const detailRows=(detailType==='days'?fraudDays.map(d=>({group:'J'+d.day,order:d.day,alerts:d.alerts,tp:d.tp,fp:d.fp,fn:d.fn})):fraudTypes.filter(c=>c.alerts>0).map(c=>({group:c.type,order:c.type,alerts:c.alerts,tp:c.tp,fp:c.fp,fn:c.fn})))
 .filter(x=>x.group.toLowerCase().includes(query.trim().toLowerCase()))
 .sort((a,b)=>detailSort==='alerts'?(a.alerts-b.alerts)*(sortDesc?-1:1):String(a.order).localeCompare(String(b.order),'fr')*(sortDesc?-1:1));
 const exportDays=()=>csv('bank360-paysim-jours-test.csv',fraudDays.map(d=>({jour:'J'+d.day,transactions:d.transactions,fraudes:d.frauds,alertes:d.alerts,vraies:d.tp,fausses:d.fp,manquees:d.fn})),['jour','transactions','fraudes','alertes','vraies','fausses','manquees']);
 const exportChannels=()=>csv('bank360-paysim-canaux-test.csv',fraudTypes.map(d=>({canal:d.type,transactions:d.transactions,fraudes:d.frauds,alertes:d.alerts,vraies:d.tp,fausses:d.fp,manquees:d.fn,precision:d.precision,rappel:d.recall})),['canal','transactions','fraudes','alertes','vraies','fausses','manquees','precision','rappel']);
 const inspect=()=>{onMode('alerts');setDetailType('channels')};
 return <div className="screen fraud-workspace" data-mode={mode} data-scope={populationName}>
   <div className="fw-tabs" role="tablist" aria-label="Perspective fraude">
    {([{id:'overview',label:'Vue globale'},{id:'detection',label:'Détection'},{id:'alerts',label:'Alertes'}] as const).map(m=><button key={m.id} role="tab" aria-selected={mode===m.id} className={mode===m.id?'active':''} onClick={()=>onMode(m.id)}>{m.label}</button>)}
    <span className="fw-tabs-space"/>
    <span className="fw-scope" title="Un seul axe de regroupement sélectionnable à la fois">{populationName} · PaySim simulé</span>
    <button className="fw-export" onClick={exportChannels} aria-label="Exporter les agrégats de fraude en CSV"><Download size={15}/> Exporter</button>
   </div>
   <div className="fw-kpis" aria-label="Indicateurs de fraude, global et test">
    {[
     {id:'transactions',title:'Transactions simulées',value:int(b4.observed.rows),note:'PaySim complet · simulation',icon:Layers3,tone:'blue',action:()=>onMode('detection')},
     {id:'alerts',title:'Alertes détectées',value:int(test.alerted),note:pct(test.alerted/test.n)+' du test',icon:Bell,tone:'violet',action:()=>onMode('alerts')},
     {id:'true',title:'Vraies alertes',value:int(test.confusion.tp),note:pct(test.precision)+' de précision · test',icon:CheckCircle2,tone:'mint',action:inspect},
     {id:'missed',title:'Fraudes manquées',value:int(test.confusion.fn),note:pct(test.recall)+' de rappel · test',icon:ShieldAlert,tone:'rose',action:()=>{onMode('alerts');setDetailType('days')}}
    ].map(k=>{const Icon=k.icon;return <div className={'fw-kpi tone-'+k.tone} key={k.id}><span className="fw-kpi-icon"><Icon size={23}/></span><div className="fw-kpi-copy"><span>{k.title}</span><strong>{k.value}</strong><small>{k.note}</small></div><span aria-hidden="true" className="fw-spark"><i/><i/><i/><i/><i/><i/></span><button className="fw-kpi-action" onClick={k.action} aria-label={'Examiner : '+k.title}><ChevronRight size={19}/></button></div>})}
   </div>
   <div className="fw-board">
    <Panel title="Évolution des alertes" role="fw-trend" subtitle="J25–J30 · 100 353 transactions au test" extra={<div className="fw-trend-switch" role="group" aria-label="Lecture de l'évolution">{([{id:'alerts',label:'Alertes'},{id:'transactions',label:'Transactions'},{id:'combined',label:'Combinée'}] as const).map(t=><button key={t.id} type="button" onClick={()=>setTrendView(t.id)} aria-pressed={trendView===t.id} className={trendView===t.id?'active':''}>{t.label}</button>)}</div>}>
     <div className="fw-legend" aria-live="polite">
      <span><i className={'fw-key '+(trendView==='alerts'?'violet':'blue')}/>{trendView==='alerts'?kindsName[scope.kind]+' · axe gauche':'Transactions · axe gauche'}</span>
      {trendIsCombined&&<span><i className="fw-key pink"/>{kindsName[scope.kind]} · axe droit</span>}
     </div>
     <div className="fw-combo" role="group" aria-label="Évolution agrégée par jour simulé">
      <div className="fw-combo-axis" aria-hidden="true"><span>{int(trendBarMax)}</span><span>{int(Math.round(trendBarMax/2))}</span><span>0</span></div>
      <svg viewBox="0 0 500 186" preserveAspectRatio="none" aria-label={trendView==='combined'?'Transactions en barres et alertes en courbe, deux axes distincts':trendView==='alerts'?'Alertes du test par jour simulé':'Transactions du test par jour simulé'} role="img">
       <defs><linearGradient id="fw-grad-b" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#75bbff"/><stop offset="1" stopColor="#4044b3"/></linearGradient><linearGradient id="fw-grad-alert" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#cb9aff"/><stop offset="1" stopColor="#6555c2"/></linearGradient><linearGradient id="fw-grad-p" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f58ec9" stopOpacity=".20"/><stop offset="1" stopColor="#f58ec9" stopOpacity="0"/></linearGradient></defs>
       {[26,95,164].map(y=><path key={y} d={'M 20 '+y+' H 490'} stroke="#a8c5ff26" strokeDasharray="3 5"/>)}
       {fraudDays.map((d,i)=>{const count=trendBarValue(d);return <rect key={d.day} x={29+i*81} y={164-137*count/trendBarMax} width="32" height={137*count/trendBarMax} rx="5" fill={trendView==='alerts'?'url(#fw-grad-alert)':'url(#fw-grad-b)'} opacity={scope.day===String(d.day)?1:.91}><title>{'J'+d.day+' · '+int(count)+' '+(trendView==='alerts'?kindsName[scope.kind].toLowerCase():'transactions')+' · test'}</title></rect>})}
       {trendIsCombined&&<><path d={'M 45 164 L '+trendPoints.replaceAll(' ', ' L ')+' L 450 164 Z'} fill="url(#fw-grad-p)"/><polyline points={trendPoints} fill="none" stroke="#ff64ae" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"/>{fraudDays.map((d,i)=><circle key={d.day} cx={45+i*81} cy={164-137*selectedCount(d,scope.kind)/trendAlertMax} r={scope.day===String(d.day)?5:3.5} fill="#ffb9dc" stroke="#ff4d9a" strokeWidth="2"><title>{'J'+d.day+' : '+int(selectedCount(d,scope.kind))+' '+kindsName[scope.kind].toLowerCase()}</title></circle>)}</>}
      </svg>
      {trendIsCombined&&<div className="fw-combo-axis fw-right" aria-hidden="true"><span>{int(trendAlertMax)}</span><span>{int(Math.round(trendAlertMax/2))}</span><span>0</span></div>}
     </div>
     <div className="fw-trend-labels" data-trend-view={trendView}>{fraudDays.map(d=><button key={d.day} className={scope.day===String(d.day)?'active':''} onClick={()=>selectDay(d.day)} aria-label={'Inspecter J'+d.day}><span>J{d.day}</span><b>{int(trendBarValue(d))}</b></button>)}</div>
    </Panel>
    <Panel title="Alertes par canal" role="fw-channels" subtitle="Test chronologique · seules catégories alertées" extra={<span className="fw-head-caption">{kindsName[scope.kind]}</span>}>
     <div className="fw-channel-rows">{shownChannels.map(c=>{const n=selectedCount(c,scope.kind);return <button key={c.type} className={'fw-channel-row '+(scope.channel===c.type?'active':'')} onClick={()=>selectChannel(c.type)} aria-label={c.type+' : '+int(n)+' '+kindsName[scope.kind].toLowerCase()}>
      <span className="fw-channel-main"><span className="fw-channel-name"><Fingerprint size={14}/>{c.type}</span><span className="fw-channel-track"><i style={{width:(100*n/channelsMax)+'%'}}/></span><strong>{int(n)}</strong><small>{pct(totalChannel?n/totalChannel:0)}</small></span>
      <span className="fw-channel-metrics"><span>Vraies <b>{int(c.tp)}</b></span><span>Fausses <b>{int(c.fp)}</b></span><span>Précision <b>{pct(c.precision)}</b></span><span>Rappel <b>{pct(c.recall)}</b></span></span>
     </button>})}</div>
     <div className="fw-channel-summary">{scope.day!=='Tous'?'Canaux du test complet : pas de jointure jour × canal.':'Sélectionner un canal actualise la qualité, sans modifier les jours.'}</div>
    </Panel>
    <Panel title="Qualité de détection" role="fw-quality" extra={<div className="fw-quality-tools"><span className="fw-head-caption" title="PR-AUC mesurée uniquement sur le test chronologique global">PR-AUC test {value(test.pr_auc)}</span><button className="fw-icon" onClick={()=>onMode('alerts')} title="Perspective Alertes" aria-label="Examiner la qualité de détection"><ChevronRight size={16}/></button></div>}>
     <div className="fw-quality-layout">
      <div className="fw-ring" style={{background:ring}} role="img" aria-label={int(source.tp)+' vraies alertes et '+int(source.fp)+' fausses alertes'}><div><strong>{int(source.alerts)}</strong><small>alertes</small></div></div>
      <div className="fw-quality-legend">
       <div><i className="mint"/><span>Vraies alertes</span><b>{int(source.tp)}</b><small>{pct(source.alerts?source.tp/source.alerts:0)}</small></div>
       <div><i className="rose"/><span>Fausses alertes</span><b>{int(source.fp)}</b><small>{pct(source.alerts?source.fp/source.alerts:0)}</small></div>
       <div className="fw-missed"><i className="violet"/><span>Fraudes manquées*</span><b>{int(source.fn)}</b><small>exclues</small></div>
      </div>
     </div>
     <div className="fw-quality-footer"><span>{populationName} · précision {pct(source.alerts?source.tp/source.alerts:0)} · rappel {pct(source.frauds?source.tp/source.frauds:0)}</span><span><Info size={13}/> *Non incluses dans le diagramme. Dérive et sous-calibration importantes.</span></div>
    </Panel>
    <Panel title="Alertes selon le jour simulé" role="fw-days" extra={<select aria-label="Mesure journalière" value={measure} onChange={e=>setMeasure(e.target.value as Measure)}><option value="alerts">Alertes</option><option value="transactions">Transactions</option><option value="frauds">Fraudes</option><option value="tp">Vraies alertes</option></select>}>
     <div className="fw-day-chart">
      <div className="fw-day-axis" aria-hidden="true"><span>{int(maximum)}</span><span>{int(Math.round(maximum/2))}</span><span>0</span></div>
      <div className="fw-day-bars">{shownDays.map(d=><button key={d.day} onClick={()=>selectDay(d.day)} className={'fw-day '+(scope.day===String(d.day)?'active':'')} aria-label={'Jour simulé J'+d.day+' : '+int(d[measure])+' '+measure} title={'J'+d.day+' · '+int(d[measure])}><b>{int(d[measure])}</b><span className="fw-day-track"><i style={{height:(100*d[measure]/maximum)+'%'}}/></span><small>J{d.day}</small></button>)}</div>
     </div>
    </Panel>
    <Panel title="Canaux d'investigation" role="fw-investigation" extra={<button className="fw-icon" onClick={exportChannels} aria-label="Exporter les canaux en CSV"><ArrowDownToLine size={16}/></button>}>
     <div className="fw-invest-head"><span>Canal</span><span>Alertes</span><span>Vraies</span><span>Fausses</span><span>Précision</span></div>
     <div className="fw-invest-list">{[...shownChannels].sort((a,b)=>(b.alerts-a.alerts)*(sortDesc?1:-1)).map(c=><button key={c.type} onClick={()=>selectChannel(c.type)} className={'fw-invest-row '+(scope.channel===c.type?'active':'')} aria-label={'Inspecter '+c.type}><span><Fingerprint size={14}/>{c.type}</span><b>{int(c.alerts)}</b><b>{int(c.tp)}</b><b>{int(c.fp)}</b><b>{pct(c.precision)}</b></button>)}</div>
     <div className="fw-invest-foot"><span>2 canaux avec alertes · test global</span><button onClick={()=>setSortDesc(x=>!x)}>Tri alertes {sortDesc?'↓':'↑'}</button></div>
    </Panel>
    <Panel title="Détail agrégé des alertes" role="fw-detail" extra={<div className="fw-detail-actions"><label><Search size={13}/><input aria-label="Rechercher un agrégat" placeholder="Rechercher..." value={query} onChange={e=>setQuery(e.target.value)}/></label><button className="fw-icon" aria-label="Exporter le détail agrégé en CSV" onClick={detailType==='days'?exportDays:exportChannels}><Download size={15}/></button></div>}>
     <div className="fw-detail-tools"><div role="group" aria-label="Dimension du détail"><button className={detailType==='days'?'active':''} onClick={()=>{setDetailType('days');setQuery('')}}>Jours</button><button className={detailType==='channels'?'active':''} onClick={()=>{setDetailType('channels');setQuery('')}}>Canaux</button></div><span>Groupes simulés uniquement</span></div>
     <div className="fw-detail-table"><table><thead><tr><th><button onClick={()=>{setDetailSort('group');setSortDesc(x=>!x)}}>{detailType==='days'?'Jour':'Canal'}</button></th><th><button onClick={()=>{setDetailSort('alerts');setSortDesc(x=>!x)}}>Alertes</button></th><th>Vraies</th><th>Fausses</th><th>Manquées</th></tr></thead><tbody>{detailRows.map(d=><tr key={d.group} className={(detailType==='days'?scope.day===d.group.slice(1):scope.channel===d.group)?'active':''} onClick={()=>detailType==='days'?selectDay(Number(d.group.slice(1))):selectChannel(d.group)} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')detailType==='days'?selectDay(Number(d.group.slice(1))):selectChannel(d.group)}}><td>{d.group}</td><td>{int(d.alerts)}</td><td>{int(d.tp)}</td><td>{int(d.fp)}</td><td>{int(d.fn)}</td></tr>)}{detailRows.length===0&&<tr><td colSpan={5}>Aucun groupe correspondant</td></tr>}</tbody></table></div>
     <div className="fw-detail-foot"><CheckCircle2 size={13}/>{populationName} : {int(totalKind)} {kindsName[scope.kind].toLowerCase()} <span>Pas de transactions individuelles</span></div>
    </Panel>
   </div>
 </div>;
}
