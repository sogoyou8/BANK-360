import React,{useMemo,useState} from 'react';
import {
 Activity,ArrowUpRight,BarChart3,BookOpen,CheckCircle2,ChevronRight,
 CreditCard,Database,Download,FileBarChart2,FileText,Fingerprint,
 Info,Moon,Settings2,ShieldCheck,Sun,X
} from 'lucide-react';
import {filteredSegments,paymentSeries,fraudTypes,fmtInt,initialFilters,type CreditFilters,type reconcile} from './data';
import {exportReport,type ExportFormat,type ReportDataset,type ReportRow} from './reportExports';
import './reports-workspace.css';

type Scope='all'|'credit'|'fraud';
type Perspective='overview'|'exports'|'methodology'|'preferences';
type ExportId='portfolio'|'payments'|'alerts';
type ExportInfo={
 id:ExportId;title:string;caption:string;description:string;scope:'credit'|'fraud';
 icon:typeof FileText;filename:string;columns:string[];rows:ReportRow[];tag:string;
};
const SOURCES=[
 {id:'credit' as const,label:'Crédit',icon:FileText},
 {id:'fraud' as const,label:'Fraude',icon:CreditCard},
 {id:'all' as const,label:'Toutes sources',icon:Database}
];
const PERSPECTIVES=[
 {id:'overview' as const,label:'Vue globale',icon:BarChart3},
 {id:'exports' as const,label:'Exports',icon:FileText},
 {id:'methodology' as const,label:'Méthodologie',icon:BookOpen},
 {id:'preferences' as const,label:'Préférences',icon:Settings2}
];
const DOCS=[
 {scope:'credit',title:'Analyse du portefeuille',description:'Segmentation, agrégations et indicateurs UCI',icon:BarChart3,url:'https://github.com/sogoyou8/BANK-360/blob/main/docs/B2-validation-finale.md'},
 {scope:'credit',title:'Évaluation du risque',description:'Expérimentation de scoring UCI et validation B3',icon:ShieldCheck,url:'https://github.com/sogoyou8/BANK-360/blob/main/docs/B3-validation-finale.md'},
 {scope:'fraud',title:'Détection de fraude',description:'Évaluation chronologique PaySim et limites B4',icon:Fingerprint,url:'https://github.com/sogoyou8/BANK-360/blob/main/docs/B4-validation-finale.md'}
] as const;
const csvColumns={
 portfolio:['age_band','credit_limit_band','september_status','client_count','default_count','delayed_count','total_credit_limit_ntd','total_age_years'],
 payments:['period','observations','delayed','rate'],
 alerts:['type','transactions','frauds','alerts','tp','fp','fn','precision','recall']
};
const plain=(obj:object):ReportRow=>({...obj} as ReportRow);
type Props={
 filters:CreditFilters;onResetFilters:()=>void;theme:'dark'|'light';onToggleTheme:()=>void;
 checks:ReturnType<typeof reconcile>;
};
function ExportCard({item,format,onFormat,onExport}:{item:ExportInfo;format:ExportFormat;onFormat:(f:ExportFormat)=>void;onExport:()=>void}){
 const Icon=item.icon;
 return <article className="rw-export-card" data-testid={'report-export-'+item.id}>
  <span className="rw-export-icon"><Icon size={29}/></span>
  <div className="rw-export-copy"><strong>{item.title}</strong><span>{item.caption}</span><small>{item.description}</small></div>
  <div className="rw-format-group" role="group" aria-label={'Format '+item.title}>
   {(['csv','xlsx'] as const).map(f=><button type="button" key={f} aria-pressed={format===f} className={format===f?'is-active':''} onClick={()=>onFormat(f)}>{f.toUpperCase()}</button>)}
  </div>
  <span className={'rw-export-tag '+(item.scope==='fraud'?'is-fraud':'')}>{item.tag}</span>
  <button type="button" className="rw-download" aria-label={'Télécharger '+item.title+' en '+format.toUpperCase()} onClick={onExport}><Download size={23}/></button>
 </article>;
}
export default function ReportsWorkspace({filters,onResetFilters,theme,onToggleTheme,checks}:Props){
 const [scope,setScope]=useState<Scope>('all');
 const [perspective,setPerspective]=useState<Perspective>('overview');
 const [formats,setFormats]=useState<Record<ExportId,ExportFormat>>({portfolio:'csv',payments:'csv',alerts:'csv'});
 const [message,setMessage]=useState('');
 const exportItems=useMemo<ExportInfo[]>(()=>[
  {id:'portfolio',scope:'credit',icon:Database,title:'Portefeuille agrégé',caption:'Segments et défauts historiques',
   description:'Groupes UCI selon les filtres actuels',filename:'bank360-portefeuille',
   columns:csvColumns.portfolio,rows:filteredSegments(filters).map(plain),tag:'Agrégé'},
  {id:'payments',scope:'credit',icon:Activity,title:'Historique des paiements',caption:'Six mois · sélection actuelle',
   description:'Observations mensuelles agrégées et répétées',filename:'bank360-paiements',
   columns:csvColumns.payments,rows:paymentSeries(filters).map(plain),tag:'Historique'},
  {id:'alerts',scope:'fraud',icon:Fingerprint,title:'Alertes par canal',caption:'Transactions simulées · test',
   description:'Comptages et métriques agrégés PaySim',filename:'bank360-alertes',
   columns:csvColumns.alerts,rows:fraudTypes.map(plain),tag:'Simulation'}
 ],[filters]);
 const exportsVisible=exportItems.filter(item=>scope==='all'||item.scope===scope);
 const docsVisible=DOCS.filter(item=>scope==='all'||item.scope===scope);
 const applicable=scope==='credit'?[checks.creditOK,checks.paymentOK,checks.modelsOK]:
  scope==='fraud'?[checks.fraudOK,checks.modelsOK]:
   [checks.creditOK,checks.paymentOK,checks.fraudOK,checks.modelsOK];
 const ready=applicable.every(Boolean);
 const anyCreditFilter=Object.values(filters).some(v=>v!=='Tout');
 const onDownload=(item:ExportInfo)=>{
  const format=formats[item.id],dataset:ReportDataset={name:item.filename,columns:item.columns,rows:item.rows};
  exportReport(dataset,format);
  setMessage(item.title+' : '+fmtInt(item.rows.length)+' lignes agrégées exportées en '+format.toUpperCase()+'.');
 };
 const sourceLabel=scope==='all'?'UCI historique 2005 et PaySim simulé':scope==='credit'?'UCI · données historiques 2005':'PaySim · données entièrement simulées';
 const contextNote=scope==='all'?'Exports calculés sur des sources indépendantes, jamais jointes.':scope==='credit'?'Les exports Crédit utilisent les filtres d’âge, de plafond et de statut septembre.':'Les alertes PaySim sont agrégées et ne représentent pas des transactions bancaires réelles.';
 const contextDetails=scope==='credit'?
  {title:'Périmètre Crédit',description:'UCI · Taïwan 2005 · groupes historiques, sans dossiers individuels',
   meta:[{label:'Lignes exportables',value:fmtInt(exportItems[0].rows.length+exportItems[1].rows.length)},
    {label:'Filtres',value:anyCreditFilter?'Sélection de crédit active':'Toutes les tranches'}]}:
  scope==='fraud'?
  {title:'Périmètre Fraude',description:'PaySim · simulation · résultats agrégés du test chronologique',
   meta:[{label:'Lignes exportables',value:fmtInt(exportItems[2].rows.length)},
    {label:'Source',value:'Rapport B4'}]}:null;
 return <section className={'rw-root rw-perspective-'+perspective+' rw-scope-'+scope} aria-label="Rapports et préférences" data-testid="reports-workspace">
  <header className="rw-header">
   <div className="rw-heading-row">
    <div className="rw-heading"><div className="rw-heading-main"><span className="rw-overline">GOUVERNANCE</span><h1>Rapports &amp; préférences</h1></div><p>Exportez vos données, consultez les méthodologies et configurez vos préférences d’utilisation.</p></div>
    <div className="rw-scope-tabs" role="group" aria-label="Sources des rapports">{SOURCES.map(s=><button key={s.id} type="button" aria-pressed={scope===s.id} className={scope===s.id?'is-active':''} onClick={()=>{setScope(s.id);setMessage('')}}><s.icon size={18}/>{s.label}</button>)}</div>
   </div>
   <div className="rw-perspective-tabs" role="tablist" aria-label="Perspectives Rapports">{PERSPECTIVES.map(t=><button key={t.id} type="button" role="tab" aria-selected={perspective===t.id} className={perspective===t.id?'is-active':''} onClick={()=>setPerspective(t.id)}><t.icon size={19}/>{t.label}</button>)}</div>
  </header>
  <div className={'rw-banner '+(ready?'is-ready':'is-review')} role="status">
   <div className="rw-banner-title"><span className="rw-banner-icon">{ready?<ShieldCheck size={36}/>:<Info size={36}/>}</span><div><h2>{ready?'Centre de rapports disponible':'Sources à vérifier'}</h2><p>{ready?'Exports et documents disponibles sur les données déclarées.':'Certains contrôles de cohérence ne sont pas conformes : vérifier Qualité & traçabilité.'}</p></div></div>
   <div className="rw-banner-metrics">
    <div><FileText size={25}/><span><strong>{exportsVisible.length}</strong><small>exports disponibles</small></span></div>
    <div><BookOpen size={25}/><span><strong>{docsVisible.length}</strong><small>méthodologies</small></span></div>
    <div><Settings2 size={25}/><span><strong>2</strong><small>réglages accessibles</small></span></div>
    <div className="rw-banner-state"><CheckCircle2 size={28}/><span><b>{ready?'Sources contrôlées':'À examiner'}</b><small>{sourceLabel}</small></span></div>
   </div>
  </div>
  <div className="rw-grid" data-testid="reports-grid">
   <section className="rw-panel rw-export-panel" aria-label="Centre d’exports">
    <div className="rw-panel-title"><span className="rw-panel-icon"><FileBarChart2 size={24}/></span><div><h2>Centre d’exports</h2><p>Extraire les données en CSV ou XLSX pour les analyses.</p></div></div>
    <div className={'rw-export-list rw-export-count-'+exportsVisible.length}>
     {exportsVisible.map(item=><ExportCard key={item.id} item={item} format={formats[item.id]} onFormat={f=>setFormats(v=>({...v,[item.id]:f}))} onExport={()=>onDownload(item)}/>)}
    </div>
    {contextDetails&&<aside className="rw-context-summary" data-testid="reports-context-summary" aria-label="Périmètre des exports sélectionnés">
     <div className="rw-context-heading"><Info size={17}/><strong>{contextDetails.title}</strong></div>
     <p>{contextDetails.description}</p>
     <div className="rw-context-meta">{contextDetails.meta.map(entry=><span key={entry.label}><small>{entry.label}</small><b>{entry.value}</b></span>)}</div>
    </aside>}
    <div className="rw-export-bottom"><Info size={17}/><span>{perspective==='exports'?'Formats réels : CSV UTF-8 et XLSX Open XML. '+contextNote:'Les exports respectent les filtres du contexte sélectionné. '+contextNote}</span></div>
    <span className="rw-message" role="status" aria-live="polite">{message}</span>
   </section>
   <section className="rw-panel rw-method-panel" aria-label="Méthodologie">
    <div className="rw-panel-title"><span className="rw-panel-icon"><BookOpen size={25}/></span><div><h2>Méthodologie</h2><p>Consulter les rapports expérimentaux et méthodes.</p></div></div>
    <div className={'rw-method-list rw-method-count-'+docsVisible.length}>
     {docsVisible.map(d=><a key={d.title} href={d.url} target="_blank" rel="noopener noreferrer" className="rw-method-card"><span className={'rw-method-icon '+(d.scope==='fraud'?'is-fraud':'')}><d.icon size={23}/></span><span><strong>{d.title}</strong><small>{d.description}</small>{perspective==='methodology'&&<em>{d.scope==='credit'?'Crédit UCI · rapport historique':'Fraude PaySim · expérience simulée'}</em>}</span><span className="rw-method-arrow"><ArrowUpRight size={22}/></span></a>)}
    </div>
    {perspective==='methodology'&&<p className="rw-focus-note" data-testid="reports-methodology-focus"><Info size={15}/>Les rapports décrivent des expérimentations historiques ou simulées, sans décision bancaire opérationnelle.</p>}
   </section>
   <section className="rw-panel rw-preferences-panel" aria-label="Préférences">
    <div className="rw-panel-title"><span className="rw-panel-icon"><Settings2 size={25}/></span><div><h2>Préférences</h2><p>Réglages de la session et filtres actuels.</p></div></div>
    <div className="rw-preferences-list">
     <div><span><strong>Apparence</strong><small>{theme==='dark'?'Sombre':'Clair'}</small></span><button type="button" aria-label="Changer le thème" onClick={onToggleTheme}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>} Changer</button></div>
     <div><span><strong>Filtres de crédit</strong><small>{anyCreditFilter?'Sélection active · '+[filters.age,filters.limit,filters.status].filter(v=>v!=='Tout').join(' · '):'Tous les âges · tous les plafonds'}</small></span><button type="button" onClick={()=>{onResetFilters();setMessage('Filtres de crédit réinitialisés.')}} aria-label="Réinitialiser les filtres de crédit"><X size={18}/> Réinitialiser</button></div>
    </div>
    {perspective==='preferences'&&<p className="rw-focus-note" data-testid="reports-preferences-focus"><Settings2 size={15}/>Les préférences s’appliquent à cette session et aux exports filtrés. Aucun profil bancaire n’est créé.</p>}
   </section>
  </div>
 </section>;
}
