import {useEffect,useMemo,useState} from 'react';
import {Activity,ArrowLeft,ArrowRight,BookOpen,CheckCircle2,ChevronRight,Database,Download,FileSpreadsheet,Home,Info,Layers3,Moon,RotateCcw,ShieldAlert,ShieldCheck,Sun,Target,Wallet} from 'lucide-react';
import {
 segments,ages,limits,b3,b4,b3Deciles,b4Deciles,fraudTypes,fraudDays,
 initialFilters,filteredSegments,creditTotals,paymentSeries,reconcile,fmtInt,fmtPct,
 type CreditFilters
} from './data';
import {creditCalibration,creditDrivers,driverLabels} from './riskEvidence';
import {exportReport,type ReportDataset,type ExportFormat} from './reportExports';
import './guided-risk-lab.css';

type View='overview'|'credit'|'fraud'|'models'|'evidence';
type Domain='credit'|'fraud';
type FraudAxis='day'|'type';
type Scope='all'|'credit'|'fraud';
const views:{id:View;label:string;short:string;summary:string}[]=[
 {id:'overview',label:'Découvrir',short:'Accueil',summary:'Deux études indépendantes, un même projet Data'},
 {id:'credit',label:'Crédit historique',short:'Crédit',summary:'Défauts, cohortes et paiements · UCI 2005'},
 {id:'fraud',label:'Fraude simulée',short:'Fraude',summary:'Alertes et erreurs · PaySim, test chronologique'},
 {id:'models',label:'Modèles & performance',short:'Modèles',summary:'Évaluations expérimentales sur tests indépendants'},
 {id:'evidence',label:'Sources & preuves',short:'Preuves',summary:'Provenance, contrôles et exports d’agrégats'}
];
const validView=(v:string|null):View=>views.some(x=>x.id===v)?v as View:'overview';
const startView=()=>validView(new URLSearchParams(window.location.search).get('view'));
const num=(n:number)=>fmtInt(n);
const pct=(n:number,d=1)=>fmtPct(n,d);
const decimals=(n:number,d=3)=>new Intl.NumberFormat('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const statusName=(s:string)=>s==='-1'?'−1 · à jour':s==='-2'||s==='0'?s.replace('-','−')+' · non précisé':s+' · '+s+' mois';
const statuses=[...new Set(segments.map(x=>x.september_status))].sort((a,b)=>Number(a)-Number(b));
const b4test=b4.holdout_test;
const creditDataset=(rows:typeof segments):ReportDataset=>({
 name:'bank360-credit-cohortes-uci',columns:['age_band','credit_limit_band','september_status','client_count','default_count','delayed_count','total_credit_limit_ntd','total_age_years'],rows:rows.map(x=>({...x}))
});
const monthsDataset=(filters:CreditFilters):ReportDataset=>({
 name:'bank360-credit-retards-mensuels',columns:['period','observations','delayed','rate'],rows:paymentSeries(filters).map(x=>({...x}))
});
const fraudDataset=(axis:FraudAxis,selection:string):ReportDataset=>{
 const source=axis==='day'?fraudDays:fraudTypes;
 const rows=source.filter(x=>selection==='Tous'||('day' in x?String(x.day):x.type)===selection);
 return {name:'bank360-paysim-'+axis+'-test',columns:['group','transactions','frauds','alerts','tp','fp','fn','tn','precision','recall'],rows:rows.map(x=>({
  group:'day' in x?'J'+x.day:x.type,transactions:x.transactions,frauds:x.frauds,alerts:x.alerts,tp:x.tp,fp:x.fp,fn:x.fn,tn:x.tn,
  precision:x.alerts?x.tp/x.alerts:0,recall:x.frauds?x.tp/x.frauds:0
 }))};
};
function Figure({label,value,detail,tone='blue'}:{label:string;value:string;detail:string;tone?:'blue'|'pink'|'neutral'}){
 return <div className={'grl-figure grl-'+tone}><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;
}
function Context({children,kind='info'}:{children:React.ReactNode;kind?:'info'|'warning'}){
 return <div className={'grl-context '+(kind==='warning'?'grl-warning':'')}><Info size={17}/><span>{children}</span></div>;
}
function Unit({label,children}:{label:string;children:React.ReactNode}){return <section className="grl-unit"><div className="grl-unit-title">{label}</div>{children}</section>;}
function Export({dataset}:{dataset:ReportDataset}){
 const [format,setFormat]=useState<ExportFormat>('csv');
 return <div className="grl-export"><label>Format <select aria-label={'Format export '+dataset.name} value={format} onChange={e=>setFormat(e.target.value as ExportFormat)}><option value="csv">CSV</option><option value="xlsx">XLSX</option></select></label><button type="button" onClick={()=>exportReport(dataset,format)}><Download size={16}/> Exporter <span>{num(dataset.rows.length)} lignes</span></button></div>;
}
function ColumnBars({values,onPick,selected,unit='alertes'}:{values:{key:string;label:string;value:number;hint:string}[];onPick?:(key:string)=>void;selected?:string;unit?:string}){
 const max=Math.max(1,...values.map(x=>x.value));
 return <div className="grl-bars" role="group" aria-label={'Graphique : '+unit}>
  {values.map(x=><button key={x.key} type="button" className={'grl-bar '+(selected===x.key?'is-active':'')}
   onClick={()=>onPick?.(x.key)} disabled={!onPick} aria-pressed={selected===x.key}
   title={x.label+' · '+num(x.value)+' '+unit+' · '+x.hint}
   aria-label={x.label+' : '+num(x.value)+' '+unit+'. '+x.hint}>
    <b>{num(x.value)}</b><span className="grl-bar-track"><i style={{height:Math.max(x.value?3:0,100*x.value/max)+'%'}}/></span><small>{x.label}</small>
   </button>)}
 </div>;
}
function RankBars({values}:{values:{key:string;value:number;secondary?:number;label?:string}[]}){
 const max=Math.max(.0001,...values.map(x=>x.value));
 return <div className="grl-rank-list">{values.map(x=><div className="grl-rank-row" key={x.key}>
  <span>{x.label||x.key}</span><i><em style={{width:100*x.value/max+'%'}}/></i><b>{pct(x.value,1)}</b>{x.secondary!==undefined&&<small>n={num(x.secondary)}</small>}
 </div>)}</div>;
}
function Overview({go}:{go:(p:View)=>void}){
 return <div className="grl-page grl-overview" data-testid="guided-overview">
  <div className="grl-intro"><span className="grl-eyebrow">BANK 360 / RISK ANALYTICS LAB</span><h1>Deux études. Des données jusqu’aux preuves.</h1><p>Explorer le défaut de crédit historique et la détection de fraude sur une simulation. <strong>Les sources ne décrivent pas les mêmes personnes et ne sont jamais jointes.</strong></p></div>
  <div className="grl-paths">
   <article className="grl-path grl-path-credit"><div className="grl-path-top"><Wallet size={23}/><span>ÉTUDE 01 · HISTORIQUE</span></div><h2>Comprendre les défauts de crédit</h2><p>UCI · 30 000 dossiers taïwanais de 2005 · défaut du mois suivant.</p><div className="grl-path-metrics"><Figure label="Dossiers" value={num(creditTotals(segments).total)} detail="Échantillon historique"/><Figure label="Taux de défaut" value={pct(creditTotals(segments).rate)} detail={num(creditTotals(segments).defaults)+' dossiers'}/></div><button className="grl-primary" onClick={()=>go('credit')}>Explorer le crédit <ArrowRight size={17}/></button></article>
   <article className="grl-path grl-path-fraud"><div className="grl-path-top"><ShieldAlert size={23}/><span>ÉTUDE 02 · SIMULATION</span></div><h2>Évaluer des alertes antifraude</h2><p>PaySim · {num(b4.observed.rows)} transactions simulées · protocole chronologique.</p><div className="grl-path-metrics"><Figure tone="pink" label="Transactions du test" value={num(b4test.n)} detail="Jeu réservé"/><Figure tone="pink" label="Alertes du modèle" value={num(b4test.alerted)} detail={num(b4test.confusion.tp)+' vraies · '+num(b4test.confusion.fp)+' fausses'}/></div><button className="grl-primary grl-primary-pink" onClick={()=>go('fraud')}>Explorer la fraude <ArrowRight size={17}/></button></article>
  </div>
  <div className="grl-orientation"><button onClick={()=>go('models')}><Target size={21}/><span><strong>Modèles expérimentaux</strong><small>Protocoles et performances B3/B4, sans décision réelle.</small></span><ChevronRight size={18}/></button><button onClick={()=>go('evidence')}><ShieldCheck size={21}/><span><strong>Sources & preuves</strong><small>Qualité, reproductibilité, limites et exports.</small></span><ChevronRight size={18}/></button></div>
 </div>;
}
function Credit({go,filters,setFilters}:{go:(p:View)=>void;filters:CreditFilters;setFilters:(f:CreditFilters)=>void}){
 const rows=useMemo(()=>filteredSegments(filters),[filters]);
 const totals=useMemo(()=>creditTotals(rows),[rows]);
 const ref=useMemo(()=>creditTotals(filteredSegments({...filters,age:'Tout',limit:'Tout'})),[filters]);
 const difference=totals.total&&ref.total?100*(totals.rate-ref.rate):null;
 const selected=filters.age!=='Tout'||filters.limit!=='Tout'||filters.status!=='Tout';
 const monthly=useMemo(()=>paymentSeries(filters),[filters]);
 const heat=ages.map(a=>({age:a,cells:limits.map(l=>({...creditTotals(filteredSegments({age:a,limit:l,status:filters.status})),limitBand:l}))}));
 const maxMonth=Math.max(.001,...monthly.map(x=>x.rate));
 const choose=(age:string,limit:string)=>setFilters({...filters,age:filters.age===age&&filters.limit===limit?'Tout':age,limit:filters.age===age&&filters.limit===limit?'Tout':limit});
 return <div className="grl-page" data-testid="guided-credit">
  <div className="grl-page-title"><div><span className="grl-eyebrow">CRÉDIT · UCI TAIWAN 2005</span><h1>Quels segments présentent davantage de défauts ?</h1><p>Analyse descriptive de dossiers historiques, non décisionnelle.</p></div><button className="grl-inline-link" onClick={()=>go('models')}>Voir l'évaluation B3 <ArrowRight size={16}/></button></div>
  <div className="grl-metrics"><Figure label="Taux de défaut · sélection" value={totals.total?pct(totals.rate):'—'} detail={num(totals.defaults)+' défauts / '+num(totals.total)+' dossiers'}/><Figure label="Dossiers sélectionnés" value={num(totals.total)} detail="UCI · dossiers historiques"/><Figure label="Écart à la référence" value={difference===null?'—':(difference>0?'+':'')+decimals(difference,1)+' pt'} detail={(filters.status==='Tout'?'Portefeuille complet':'Même statut septembre')+' · '+(ref.total?pct(ref.rate):'—')}/></div>
  <div className="grl-filters" role="group" aria-label="Filtres cohorte Crédit">
   <label>Âge<select aria-label="Âge Crédit" value={filters.age} onChange={e=>setFilters({...filters,age:e.target.value})}><option value="Tout">Tous</option>{ages.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
   <label>Plafond de crédit<select aria-label="Plafond Crédit" value={filters.limit} onChange={e=>setFilters({...filters,limit:e.target.value})}><option value="Tout">Tous</option>{limits.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
   <label>Statut septembre<select aria-label="Statut Crédit" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}><option value="Tout">Tous</option>{statuses.map(x=><option value={x} key={x}>{statusName(x)}</option>)}</select></label>
   <button className="grl-quiet" onClick={()=>setFilters(initialFilters)}><RotateCcw size={15}/> Réinitialiser</button>
  </div>
  <div className="grl-credit-grid">
   <section className="grl-stage"><div className="grl-stage-heading"><div><h2>Carte des défauts · âge × plafond</h2><p>Taux de défaut du mois suivant · la couleur correspond au taux, pas au volume.</p></div><small>Cliquez une cellule pour filtrer</small></div>
    <div className="grl-heat-scroll" tabIndex={0} role="region" aria-label="Matrice Crédit : défilement horizontal possible">
     <div className="grl-heat"><span className="grl-heat-axis">Âge / plafond</span>{limits.map(l=><span className="grl-heat-col" key={l}>{l}</span>)}
      {heat.map(group=><div className="grl-heat-row" key={group.age}><b>{group.age}</b>{group.cells.map(x=><button key={x.limitBand} className={filters.age===group.age&&filters.limit===x.limitBand?'is-active':''} style={{backgroundColor:'rgba(77,130,218,'+(.14+.6*x.rate/.5)+')'}} disabled={!x.total} aria-pressed={filters.age===group.age&&filters.limit===x.limitBand} onClick={()=>choose(group.age,x.limitBand)} title={group.age+' · '+x.limitBand+' : '+num(x.defaults)+' défauts / '+num(x.total)+' dossiers'}>{x.total?pct(x.rate):'—'}</button>)}</div>)}
     </div>
    </div><p className="grl-footnote">Plafond = limite de crédit, pas encours de prêt. Le taux de chaque cellule est calculé à partir des effectifs.</p>
   </section>
   <aside className="grl-side-reading"><span className="grl-eyebrow">INTERPRÉTATION DU SEGMENT</span><h3>{selected?'Sélection active':'Portefeuille complet'}</h3><p>{filters.age==='Tout'?'Tous âges':filters.age} · {filters.limit==='Tout'?'Tous plafonds':filters.limit} · {filters.status==='Tout'?'Tous statuts':statusName(filters.status)}</p>
    <strong>{totals.total?pct(totals.rate):'Aucun résultat'}</strong><span>{num(totals.defaults)} défauts sur {num(totals.total)} dossiers</span>
    <div className="grl-reading-compare"><span>Référence : {ref.total?pct(ref.rate):'—'}</span><b>{difference===null?'—':(difference>0?'+':'')+decimals(difference,1)+' point(s)'}</b></div>
    <Context>Il s'agit d'une différence descriptive, non d'un effet causal. Sélectionnez une cellule ou modifiez les filtres pour examiner la même cohorte.</Context>
   </aside>
  </div>
  <section className="grl-stage grl-monthly"><div className="grl-stage-heading"><div><h2>Retards de paiement · avril à septembre 2005</h2><p>Même cohorte filtrée sur les six mois ; les observations mensuelles ne sont pas de nouveaux clients.</p></div></div>
    <div className="grl-month-chart" role="img" aria-label="Taux de retard sur six mois, même cohorte">
     {monthly.map(x=><div key={x.period} className="grl-month"><b>{x.observations?pct(x.rate):'—'}</b><div className="grl-month-track"><i style={{height:(x.observations?Math.max(2,x.rate/maxMonth*100):0)+'%'}}/></div><small>{x.period.slice(5)}/05</small><span>n={num(x.observations)}</span></div>)}
    </div>
   </section>
   <details className="grl-details"><summary>Consulter les groupes agrégés <span>{num(rows.length)} lignes · détails et export</span></summary><div className="grl-table-scroll"><table><thead><tr><th>Âge</th><th>Plafond</th><th>Statut</th><th>Dossiers</th><th>Défauts</th><th>Taux</th></tr></thead><tbody>{rows.slice(0,40).map((r,i)=><tr key={i}><td>{r.age_band}</td><td>{r.credit_limit_band}</td><td>{statusName(r.september_status)}</td><td>{num(r.client_count)}</td><td>{num(r.default_count)}</td><td>{r.client_count?pct(r.default_count/r.client_count):'—'}</td></tr>)}</tbody></table></div>{rows.length>40&&<small>Aperçu des 40 premiers groupes ; l'export contient l'intégralité des {num(rows.length)} groupes.</small>}</details>
   <div className="grl-footer-actions"><Export dataset={creditDataset(rows)}/><Export dataset={monthsDataset(filters)}/><button onClick={()=>go('evidence')} className="grl-inline-link">Source et contrôles UCI <ChevronRight size={16}/></button></div>
 </div>;
}
function Fraud({go}:{go:(p:View)=>void}){
 const [axis,setAxis]=useState<FraudAxis>('day');
 const [selection,setSelection]=useState('Tous');
 const source=axis==='day'?fraudDays:fraudTypes.filter(x=>x.alerts>0);
 const selected=source.find(x=>('day' in x?String(x.day):x.type)===selection);
 const total={transactions:b4test.n,frauds:b4test.frauds,alerts:b4test.alerted,tp:b4test.confusion.tp,fp:b4test.confusion.fp,fn:b4test.confusion.fn};
 const current=selected||total;
 const precision=current.alerts?current.tp/current.alerts:null,recall=current.frauds?current.tp/current.frauds:null;
 return <div className="grl-page" data-testid="guided-fraud">
  <div className="grl-page-title"><div><span className="grl-eyebrow grl-eyebrow-pink">FRAUDE · PAYSIM · SIMULATION</span><h1>Que signale le modèle sur le test ?</h1><p>Test chronologique simulé · aucune détection bancaire réelle.</p></div><button className="grl-inline-link" onClick={()=>go('models')}>Voir l'évaluation B4 <ArrowRight size={16}/></button></div>
  <div className="grl-metrics grl-fraud-metrics"><Figure tone="pink" label="Alertes · sélection" value={num(current.alerts)} detail={num(current.transactions)+' transactions test'}/><Figure tone="pink" label="Vraies / fausses alertes" value={num(current.tp)+' / '+num(current.fp)} detail="Vrais / faux positifs"/><Figure tone="pink" label="Précision" value={precision===null?'—':pct(precision)} detail="Vraies alertes / alertes"/><Figure tone="pink" label="Rappel" value={recall===null?'—':pct(recall)} detail="Fraudes détectées / fraudes du test"/></div>
  <div className="grl-axis-controls"><div role="group" aria-label="Axe d'analyse PaySim"><button className={axis==='day'?'is-active':''} aria-pressed={axis==='day'} onClick={()=>{setAxis('day');setSelection('Tous')}}>Par jour</button><button className={axis==='type'?'is-active':''} aria-pressed={axis==='type'} onClick={()=>{setAxis('type');setSelection('Tous')}}>Par type</button></div><span>Un seul axe à la fois : aucun croisement jour × type n'est disponible.</span><button className="grl-quiet" onClick={()=>setSelection('Tous')}><RotateCcw size={15}/> Tout afficher</button></div>
  <div className="grl-fraud-grid"><section className="grl-stage"><div className="grl-stage-heading"><div><h2>{axis==='day'?'Alertes par jour simulé':'Alertes par type de transaction'}</h2><p>{axis==='day'?'J25–J30 · test réservé':'CASH_OUT et TRANSFER · agrégats du test'}</p></div><small>Cliquer pour sélectionner</small></div>
   <ColumnBars unit="alertes" values={source.map(x=>({key:'day' in x?String(x.day):x.type,label:'day' in x?'J'+x.day:x.type,value:x.alerts,hint:num(x.tp)+' vraies, '+num(x.fp)+' fausses'}))}
   selected={selection} onPick={key=>setSelection(v=>v===key?'Tous':key)}/>
  </section><aside className="grl-side-reading grl-fraud-reading"><span className="grl-eyebrow grl-eyebrow-pink">PÉRIMÈTRE ACTIF</span><h3>{selection==='Tous'?'Test complet':axis==='day'?'Jour simulé J'+selection:'Type '+selection}</h3>
   <strong>{num(current.alerts)} alertes</strong><span>{num(current.tp)} vraies · {num(current.fp)} fausses · {num(current.fn)} fraudes manquées</span>
   <div className="grl-reading-compare"><span>Précision : {precision===null?'—':pct(precision)}</span><b>Rappel : {recall===null?'—':pct(recall)}</b></div>
   <Context>Les chiffres ci-dessus correspondent au {selection==='Tous'?'test global':axis==='day'?'jour choisi':'type choisi'}. Les métriques de classement du modèle restent globales et ne sont pas recalculées.</Context>
  </aside></div>
  <Context kind="warning"><strong>Limite majeure B4.</strong> La prévalence des fraudes simulées passe de {pct(b4.prevalence_by_partition.train,2)} à l'entraînement à {pct(b4.prevalence_by_partition.test,2)} au test. La probabilité moyenne prédite ({pct(b4.test_predicted_probability_mean,2)}) sous-estime la fréquence observée : pas d'usage opérationnel des scores.</Context>
  <details className="grl-details"><summary>Voir les groupes et les erreurs <span>{source.length} groupes · agrégats du test</span></summary><div className="grl-table-scroll"><table><thead><tr><th>Groupe</th><th>Transactions</th><th>Fraudes</th><th>Alertes</th><th>VP</th><th>FP</th><th>FN</th></tr></thead><tbody>{source.map(x=><tr key={'day' in x?x.day:x.type}><td>{'day' in x?'J'+x.day:x.type}</td><td>{num(x.transactions)}</td><td>{num(x.frauds)}</td><td>{num(x.alerts)}</td><td>{num(x.tp)}</td><td>{num(x.fp)}</td><td>{num(x.fn)}</td></tr>)}</tbody></table></div></details>
  <div className="grl-footer-actions"><Export dataset={fraudDataset(axis,selection)}/><button className="grl-inline-link" onClick={()=>go('evidence')}>Provenance PaySim et validation <ChevronRight size={16}/></button></div>
 </div>;
}
function Models({go}:{go:(p:View)=>void}){
 const [domain,setDomain]=useState<Domain>('credit');
 const credit=domain==='credit';
 const m=credit?b3.holdout_test_metrics:b4test;
 const confusion=m.confusion;
 const deciles=credit?b3Deciles.map(x=>({key:String(x.decile),value:x.rate,n:x.n})):b4Deciles.map(x=>({key:String(x.decile),value:x.rate,n:x.n}));
 const calibration=credit?creditCalibration.map(x=>({label:x.bin,observed:x.observed,predicted:x.predicted,n:x.n})):b4Deciles.map(x=>({label:'Décile '+x.decile,observed:x.rate,predicted:x.mean,n:x.n}));
 return <div className="grl-page" data-testid="guided-models">
  <div className="grl-page-title"><div><span className="grl-eyebrow">MODÈLES · RECHERCHE UNIQUEMENT</span><h1>Que valent les modèles sur leurs tests ?</h1><p>Performances expérimentales, jamais recalculées avec les filtres descriptifs.</p></div></div>
  <div className="grl-axis-controls"><div role="tablist" aria-label="Étude de modèle"><button role="tab" aria-selected={credit} className={credit?'is-active':''} onClick={()=>setDomain('credit')}>Crédit B3</button><button role="tab" aria-selected={!credit} className={!credit?'is-active':''} onClick={()=>setDomain('fraud')}>Fraude B4</button></div><span>{credit?'UCI 2005 · 6 000 dossiers de test · séparation aléatoire stratifiée':'PaySim simulé · 100 353 transactions de test · séparation chronologique'}</span></div>
  <div className="grl-metrics grl-model-metrics"><Figure label="PR-AUC · test" value={decimals(m.pr_auc,4)} detail="Qualité du classement précision-rappel"/><Figure label="ROC-AUC · test" value={decimals(m.roc_auc,4)} detail="Séparation entre classes"/><Figure label="Brier · test" value={decimals(m.brier,4)} detail="Erreur de probabilité · plus bas = mieux"/><Figure label="Rappel · seuil expérimental" value={pct(m.recall)} detail="Part des positifs retrouvés"/></div>
  <div className="grl-model-grid"><section className="grl-stage"><div className="grl-stage-heading"><div><h2>Risque observé par décile du score</h2><p>{credit?'Part des défauts dans chaque décile de test':'Part de fraudes simulées dans chaque décile de test'}</p></div></div><RankBars values={deciles}/></section>
   <section className="grl-stage"><div className="grl-stage-heading"><div><h2>Calibration · probabilité et fréquence observée</h2><p>Deux valeurs sur une même population de test ; comparaison descriptive.</p></div></div><div className="grl-calibration"><div className="grl-cal-legend"><i/> Score prédit <i/> Taux observé</div>{calibration.map(x=><div className="grl-cal-row" key={x.label}><small>{x.label}</small><div><span style={{width:Math.min(100,x.predicted*100)+'%'}}/><em style={{width:Math.min(100,x.observed*100)+'%'}}/></div><b>{pct(x.predicted,1)} / {pct(x.observed,1)}</b></div>)}</div></section>
  </div>
  <div className="grl-model-grid grl-model-bottom"><section className="grl-stage"><div className="grl-stage-heading"><h2>Matrice de confusion · seuil gelé</h2></div><div className="grl-confusion">{[['VP · détectés',confusion.tp],['FP · fausses alertes',confusion.fp],['FN · cas manqués',confusion.fn],['VN · négatifs corrects',confusion.tn]].map(([label,n])=><div key={String(label)}><small>{label}</small><strong>{num(Number(n))}</strong></div>)}</div></section>
   <section className="grl-stage grl-limit"><div className="grl-stage-heading"><h2>Interprétation et limites</h2></div>{credit?<><p><strong>Seuil expérimental : {decimals(b3.protocol.threshold,2)}.</strong> Choisi sur validation avec F2, pas pour refuser un crédit.</p><p>Entraînement/test stratifiés sans validation temporelle. Les résultats ne sont pas transférables à une banque contemporaine.</p><p>Variable influente sur validation : {driverLabels[creditDrivers[0].name]||creditDrivers[0].name} — importance non causale.</p></>:<><p><strong>Dérive de prévalence importante.</strong> Train {pct(b4.prevalence_by_partition.train,2)}, test {pct(b4.prevalence_by_partition.test,2)}.</p><p>La moyenne des scores prédits est {pct(b4.test_predicted_probability_mean,2)} pour {pct(b4.test_observed_fraud_rate,2)} de fraudes observées sur le test.</p><p>Les probabilités ne sont pas calibrées pour ce test : aucun transfert possible vers la production.</p></>}
   </section></div>
  <Context>Les PR-AUC B3 et B4 concernent des populations, prévalences et protocoles différents : ne pas les classer comme deux modèles d'un même problème.</Context>
  <div className="grl-footer-actions"><button className="grl-inline-link" onClick={()=>go('evidence')}>Consulter les protocoles et rapports <ChevronRight size={16}/></button></div>
 </div>;
}
function Evidence({filters,source,onSource,go}:{filters:CreditFilters;source:Scope;onSource:(x:Scope)=>void;go:(p:View)=>void}){
 const c=reconcile(),credit=creditTotals(filteredSegments(filters));
 const controls=[
  {id:'credit',source:'credit' as const,title:'Crédit UCI',ok:c.creditOK,description:num(c.population)+' dossiers · '+num(c.defaults)+' défauts',method:'Réconciliation agrégats : 30 000 dossiers et 6 636 défauts.'},
  {id:'months',source:'credit' as const,title:'Paiements sur six mois',ok:c.paymentOK,description:num(c.paymentObservations)+' observations répétées',method:'Six périodes comptant chacune les mêmes 30 000 dossiers.'},
  {id:'fraud',source:'fraud' as const,title:'Simulation PaySim',ok:c.fraudOK,description:num(b4.observed.rows)+' transactions · '+num(b4.observed.frauds)+' fraudes',method:'Réconciliation des totaux de la source simulée.'},
  {id:'models',source:'all' as const,title:'Rapports de test B3/B4',ok:c.modelsOK,description:'Métriques de test indépendantes',method:'Présence de métriques de test, pas homologation d’un modèle bancaire.'}
 ].filter(x=>source==='all'||x.source===source||x.source==='all');
 const links=[
  {domain:'credit',title:'Source UCI — crédit 2005',url:'https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients'},
  {domain:'credit',title:'Validation B3',url:'https://github.com/sogoyou8/BANK-360/blob/main/docs/B3-validation-finale.md'},
  {domain:'fraud',title:'Source PaySim (Kaggle)',url:'https://www.kaggle.com/datasets/ealaxi/paysim1'},
  {domain:'fraud',title:'Validation B4',url:'https://github.com/sogoyou8/BANK-360/blob/main/docs/B4-validation-finale.md'},
  {domain:'credit',title:'Validation BI B2',url:'https://github.com/sogoyou8/BANK-360/blob/main/docs/B2-validation-finale.md'}
 ].filter(x=>source==='all'||x.domain===source);
 return <div className="grl-page" data-testid="guided-evidence"><div className="grl-page-title"><div><span className="grl-eyebrow">GOUVERNANCE ET REPRODUCTIBILITÉ</span><h1>Peut-on vérifier les résultats ?</h1><p>Sources indépendantes, contrôles techniques, méthodes et exports agrégés.</p></div></div>
  <div className="grl-axis-controls"><div role="group" aria-label="Périmètre des preuves">{([{id:'all',label:'Toutes sources'},{id:'credit',label:'Crédit'},{id:'fraud',label:'Fraude'}] as const).map(x=><button key={x.id} aria-pressed={source===x.id} className={source===x.id?'is-active':''} onClick={()=>onSource(x.id)}>{x.label}</button>)}</div><span>Ces contrôles ne constituent pas une certification bancaire.</span></div>
  <section className="grl-stage"><div className="grl-stage-heading"><div><h2>Contrôles de cohérence</h2><p>Vérifications globales de données et de rapports, indépendantes des filtres de consultation.</p></div></div>
   <div className="grl-control-list">{controls.map(x=><details key={x.id}><summary><span><strong>{x.title}</strong><small>{x.description}</small></span><b className={x.ok?'grl-ok':'grl-bad'}>{x.ok?'Conforme':'À examiner'}</b></summary><p>{x.method}</p></details>)}</div></section>
  <div className="grl-model-grid"><section className="grl-stage"><div className="grl-stage-heading"><h2>Provenance et rapports</h2></div><div className="grl-evidence-links">{links.map(x=><a href={x.url} key={x.title} target="_blank" rel="noopener noreferrer"><BookOpen size={17}/>{x.title}<ArrowRight size={15}/></a>)}</div></section>
   <section className="grl-stage grl-limit"><div className="grl-stage-heading"><h2>Limites du périmètre</h2></div><p>UCI : échantillon taïwanais historique de 2005, pas une banque française ni un ratio NPL réglementaire.</p><p>PaySim : simulation de paiement mobile, pas de clients réels ni de monitoring connecté.</p><p>Les métriques de modèles sont expérimentales ; aucune jointure UCI × PaySim et aucune décision individuelle.</p></section></div>
  <section className="grl-stage"><div className="grl-stage-heading"><h2>Exports des données agrégées</h2></div><div className="grl-proof-exports">{source!=='fraud'&&<><div><strong>Portefeuille UCI · sélection active</strong><small>{num(credit.total)} dossiers · segments réellement filtrés</small><Export dataset={creditDataset(filteredSegments(filters))}/></div><div><strong>Retards UCI · mêmes dossiers</strong><small>Six observations mensuelles de la cohorte filtrée</small><Export dataset={monthsDataset(filters)}/></div></>}{source!=='credit'&&<div><strong>PaySim · types du test</strong><small>Transactions simulées et alertes agrégées</small><Export dataset={fraudDataset('type','Tous')}/></div>}</div></section>
  <button className="grl-inline-link" onClick={()=>go('overview')}><ArrowLeft size={16}/> Retour à la découverte</button>
 </div>;
}
export default function GuidedRiskLab(){
 const [view,setView]=useState<View>(startView);
 const [filters,setFilters]=useState<CreditFilters>(initialFilters);
 const [theme,setTheme]=useState<'dark'|'light'>('dark');
 const [proofSource,setProofSource]=useState<Scope>('all');
 useEffect(()=>{document.documentElement.dataset.theme=theme;return()=>{delete document.documentElement.dataset.theme}},[theme]);
 useEffect(()=>{const onBack=()=>setView(startView());window.addEventListener('popstate',onBack);return()=>window.removeEventListener('popstate',onBack)},[]);
 const go=(next:View)=>{
  setView(next);
  if(window.location.protocol!=='file:'){
   const url=new URL(window.location.href);url.searchParams.delete('classic');url.searchParams.delete('x1');
   if(next==='overview')url.searchParams.delete('view');else url.searchParams.set('view',next);
   window.history.pushState({},'',url.pathname+url.search+url.hash);
  }
  window.scrollTo({top:0,behavior:'instant'});
 };
 const chosen=views.find(x=>x.id===view)!;
 return <div className="grl-app"><header className="grl-topbar"><button className="grl-brand" onClick={()=>go('overview')} aria-label="BANK 360 — accueil"><span className="grl-orb"/><strong>BANK <em>360</em></strong></button><span className="grl-top-sub">RISK ANALYTICS LAB</span><span className="grl-top-spacer"/><span className="grl-history"><i/> Études historiques et simulées</span><button className="grl-icon-button" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} aria-label="Changer le thème">{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><a className="grl-classic" href="?classic=1">Version classique B5</a></header>
  <div className="grl-frame"><nav className="grl-nav" aria-label="Navigation Risk Analytics Lab">{views.map((x,i)=><button key={x.id} className={view===x.id?'is-active':''} aria-current={view===x.id?'page':undefined} onClick={()=>go(x.id)}><span className="grl-nav-count">0{i+1}</span><strong>{x.short}</strong><small>{x.summary}</small></button>)}</nav>
   <main id="guided-main" className="grl-main" data-view={view} aria-label={chosen.label}>
    {view==='overview'&&<Overview go={go}/>}
    {view==='credit'&&<Credit filters={filters} setFilters={setFilters} go={go}/>}
    {view==='fraud'&&<Fraud go={go}/>}
    {view==='models'&&<Models go={go}/>}
    {view==='evidence'&&<Evidence filters={filters} source={proofSource} onSource={setProofSource} go={go}/>}
   </main></div><footer className="grl-status"><span>UCI · historique 2005</span><span>PaySim · simulation indépendante</span><span>Portfolio analytique · pas de décision réelle</span></footer>
 </div>;
}
