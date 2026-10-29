import React from 'react';
import { Activity, ArrowUpRight, BarChart3, Bell, ChevronRight, CircleAlert, Database, Layers3, Shield, ShieldCheck, Target, Wallet } from 'lucide-react';
import { b4, creditTotals, fmtInt, fmtPct, fraudTypes, groupSegments, segments } from './data';
import './home-reference.css';

type Destination = 'portfolio' | 'risk' | 'fraud' | 'alerts' | 'models' | 'quality';
interface HomeOverviewProps {
  onGo: (page: Destination) => void;
  onAge: (age: string) => void;
  onChannel: (type: string) => void;
  onCalibration: () => void;
}

const credit = creditTotals(segments);
const ageBands = groupSegments(segments, 'age_band');
const test = b4.holdout_test;
const activeChannels = fraudTypes.filter(x => x.alerts > 0);
const maxChannelAlerts = Math.max(1, ...activeChannels.map(x => x.alerts));

const kpis = [
  { key:'clients', label:'Dossiers de crédit', value:fmtInt(credit.total), note:'UCI · 2005', icon:Wallet, tone:'blue', destination:'portfolio' as const },
  { key:'default', label:'Taux de défaut', value:fmtPct(credit.rate,2), note:`${fmtInt(credit.defaults)} dossiers`, icon:ShieldCheck, tone:'violet', destination:'risk' as const },
  { key:'transactions', label:'Transactions analysées', value:(b4.observed.rows / 1_000_000).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' M', note:'PaySim · simulées', icon:Layers3, tone:'mint', destination:'fraud' as const },
  { key:'alerts', label:'Alertes de test', value:fmtInt(test.alerted), note:`${fmtInt(test.confusion.tp)} fraudes détectées`, icon:Bell, tone:'rose', destination:'alerts' as const },
];

function HomeCreditChart({onAge}:{onAge:(age:string)=>void}) {
 return <div className="home-credit-chart" aria-label="Taux de défaut par tranche d'âge et nombre de dossiers">
  <div className="home-chart-axis" aria-hidden="true"><span>30 %</span><span>20 %</span><span>10 %</span><span>0 %</span></div>
  <div className="home-chart-plot">
   <div className="home-chart-gridlines" aria-hidden="true"><i/><i/><i/><i/></div>
   {ageBands.map(band => <button key={band.name} className="home-credit-column" type="button" onClick={()=>onAge(band.name)}
    aria-label={`${band.name} ans : ${fmtPct(band.rate)}, ${fmtInt(band.count)} dossiers. Examiner ce groupe dans Risque de crédit.`}
    title={`${band.name} ans · ${fmtPct(band.rate)} de défaut · ${fmtInt(band.count)} dossiers`}>
      <span className="home-credit-bar" style={{height:`${Math.min(100,band.rate/0.30*100)}%`}}>
       <strong className="home-credit-value">{fmtPct(band.rate)}</strong>
      </span>
      <span className="home-credit-age">{band.name}</span>
      <small className="home-credit-count">n={fmtInt(band.count)}</small>
    </button>)}
  </div>
 </div>;
}

export default function HomeOverview({onGo,onAge,onChannel,onCalibration}:HomeOverviewProps){
 const cautions=[
  {label:`${fmtInt(test.confusion.fn)} fraudes non détectées`,sub:`Jeu de test simulé · ${fmtInt(test.n)} transactions`,icon:CircleAlert,tone:'rose',click:()=>onGo('alerts'),aria:'Examiner les fraudes non détectées'},
  {label:'Calibrage des scores à examiner',sub:`${fmtPct(b4.test_predicted_probability_mean,3)} prédit · ${fmtPct(b4.test_observed_fraud_rate,3)} observé`,icon:Activity,tone:'violet',click:onCalibration,aria:'Examiner la calibration du modèle de fraude'},
  {label:'Deux sources indépendantes',sub:'UCI historique · PaySim simulé',icon:Database,tone:'mint',click:()=>onGo('quality'),aria:'Consulter la provenance des données'},
 ];
 return <div className="screen home-screen home-reference-screen">
  <div className="home-overview-kpis" aria-label="Indicateurs clés">
   {kpis.map(k=>{const Icon=k.icon;return <button key={k.key} type="button" className={'home-kpi home-kpi-'+k.tone} onClick={()=>onGo(k.destination)} aria-label={`${k.label} : ${k.value}. ${k.note}. Ouvrir ${k.destination}`}>
     <span className="home-kpi-icon"><Icon size={30} strokeWidth={2.15}/></span>
     <span className="home-kpi-text"><span className="home-kpi-label">{k.label}</span><strong>{k.value}</strong><small>{k.note}</small></span>
     <span className="home-kpi-action"><ChevronRight size={20}/></span>
    </button>})}
  </div>
  <div className="home-overview-grid">
   <section className="home-glass-panel home-risk-panel" aria-labelledby="home-risk-heading">
    <header className="home-panel-header"><span className="home-panel-symbol home-symbol-credit"><BarChart3 size={29}/></span><span className="home-panel-title"><h2 id="home-risk-heading">Risque de crédit</h2><small>Défaut par tranche d’âge</small></span><button type="button" className="home-analyze" onClick={()=>onGo('risk')}>Analyser <ArrowUpRight size={19}/></button></header>
    <HomeCreditChart onAge={onAge}/>
   </section>
   <div className="home-right-stack">
    <section className="home-glass-panel home-fraud-panel" aria-labelledby="home-fraud-heading">
     <header className="home-panel-header"><span className="home-panel-symbol home-symbol-fraud"><Activity size={31}/></span><span className="home-panel-title"><h2 id="home-fraud-heading">Détection de fraude</h2><small>Alertes · test chronologique</small></span><button type="button" className="home-analyze" onClick={()=>onGo('fraud')}>Analyser <ArrowUpRight size={19}/></button></header>
     <div className="home-fraud-body">
      <div className="home-fraud-channels">{activeChannels.map(ch=><button type="button" key={ch.type} className="home-fraud-channel" onClick={()=>onChannel(ch.type)} title={`${ch.type} · ${fmtInt(ch.alerts)} alertes. Examiner ce canal.`} aria-label={`${ch.type}, ${fmtInt(ch.alerts)} alertes, examiner le canal`}>
        <span className="home-fraud-channel-name">{ch.type.replace('_',' ')}</span><span className="home-fraud-track"><i style={{width:`${100*ch.alerts/maxChannelAlerts}%`}}/></span><strong>{fmtInt(ch.alerts)}</strong>
       </button>)}</div>
      <div className="home-fraud-metrics"><div><span className="home-fraud-mini-icon"><Target size={26}/></span><span><small>Précision</small><strong>{fmtPct(test.precision)}</strong></span></div><div><span className="home-fraud-mini-icon home-mini-blue"><BarChart3 size={22}/></span><span><small>Rappel</small><strong>{fmtPct(test.recall)}</strong></span></div></div>
     </div>
    </section>
    <section className="home-glass-panel home-watch-panel" aria-labelledby="home-watch-heading">
     <header className="home-panel-header"><span className="home-panel-symbol home-symbol-watch"><Shield size={27}/></span><span className="home-panel-title"><h2 id="home-watch-heading">Points de vigilance</h2></span></header>
     <div className="home-watch-list">{cautions.map(x=>{const Icon=x.icon;return <button key={x.label} type="button" className="home-watch-row" aria-label={x.aria} onClick={x.click}><span className={'home-watch-icon home-watch-'+x.tone}><Icon size={24}/></span><span className="home-watch-text"><strong>{x.label}</strong><small>{x.sub}</small></span><span className="home-watch-next"><ChevronRight size={20}/></span></button>})}</div>
    </section>
   </div>
  </div>
 </div>;
}
