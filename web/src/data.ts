import segmentsSource from '../../powerbi/data/uci350_segments.csv?raw';
import paymentsSource from '../../powerbi/data/uci350_payment_months.csv?raw';
import b3Json from '../../reports/b3/B3-metrics.json';
import b4Json from '../../reports/b4/B4-metrics.json';
import b3DecilesSource from '../../reports/b3/B3-risk-deciles.csv?raw';
import b4DecilesSource from '../../reports/b4/B4-risk-deciles.csv?raw';
import fraudTypeSource from '../../reports/b4/B4-alerts-by-type.csv?raw';
import fraudDaysSource from '../../reports/b4/B4-alerts-by-simulated-day.csv?raw';

function csv<T extends Record<string, string>>(source: string): T[] {
  const [head, ...body] = source.trim().replace(/\r/g, '').split('\n');
  const keys = head.split(',');
  return body.filter(Boolean).map(line => Object.fromEntries(line.split(',').map((v, i) => [keys[i], v])) as T);
}
export interface Segment {
  age_band:string; credit_limit_band:string; september_status:string;
  client_count:number; default_count:number; delayed_count:number; total_credit_limit_ntd:number; total_age_years:number;
}
export interface Payment {age_band:string; credit_limit_band:string; september_status:string;period:string;client_observations:number;delayed_clients:number}
const parseCredit = (v: Record<string,string>): Segment => ({ age_band:v.age_band,credit_limit_band:v.credit_limit_band,september_status:v.september_status,client_count:+v.client_count,default_count:+v.default_count, delayed_count:+v.delayed_count,total_credit_limit_ntd:+v.total_credit_limit_ntd,total_age_years:+v.total_age_years});
export const segments: Segment[] = csv<Record<string,string>>(segmentsSource).map(parseCredit);
export const payments:Payment[] = csv<Record<string,string>>(paymentsSource).map(v=>({age_band:v.age_band,credit_limit_band:v.credit_limit_band,september_status:v.september_status,period:v.period,client_observations:+v.client_observations,delayed_clients:+v.delayed_clients}));
export const b3 = b3Json;
export const b4 = b4Json;
export const b3Deciles = csv<Record<string,string>>(b3DecilesSource).map(x=>({decile:+x.top_decile,n:+x.n,defaults:+x.defaults,rate:+x.default_rate,mean:+x.mean_prediction}));
export const b4Deciles = csv<Record<string,string>>(b4DecilesSource).map(x=>({decile:+x.decile,n:+x.transactions,frauds:+x.frauds,rate:+x.observed_fraud_rate,mean:+x.mean_probability}));
export const fraudTypes = csv<Record<string,string>>(fraudTypeSource).map(x=>({type:x.group,transactions:+x.transactions,frauds:+x.frauds,alerts:+x.alerts,tp:+x.tp,fp:+x.fp,fn:+x.fn,tn:+x.tn,precision:+x.precision,recall:+x.recall}));
export const fraudDays = csv<Record<string,string>>(fraudDaysSource).map(x=>({day:+x.group,transactions:+x.transactions,frauds:+x.frauds,alerts:+x.alerts,tp:+x.tp,fp:+x.fp,fn:+x.fn,tn:+x.tn}));
export const ages=['18-29','30-39','40-49','50-59','60+'];
export const limits=['<50k','50k-99k','100k-199k','200k-499k','500k+'];
export const fmtInt=(v:number)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(v);
export const fmtPct=(v:number,d=1)=>new Intl.NumberFormat('fr-FR',{style:'percent',maximumFractionDigits:d,minimumFractionDigits:d}).format(v);
export const fmtNtd=(v:number)=>fmtInt(Math.round(v))+' NTD';
export type CreditFilters={age:string,limit:string,status:string};
export const initialFilters:CreditFilters={age:'Tout',limit:'Tout',status:'Tout'};
export function filteredSegments(filters: CreditFilters):Segment[] {return segments.filter(s => (filters.age==='Tout'||s.age_band===filters.age)&&(filters.limit==='Tout'||s.credit_limit_band===filters.limit)&&(filters.status==='Tout'||s.september_status===filters.status));}
export function creditTotals(rows: Segment[]) {
 const total=rows.reduce((n,s)=>n+s.client_count,0),defaults=rows.reduce((n,s)=>n+s.default_count,0),delayed=rows.reduce((n,s)=>n+s.delayed_count,0), limit=rows.reduce((n,s)=>n+s.total_credit_limit_ntd,0), agesTotal=rows.reduce((n,s)=>n+s.total_age_years,0);
 return {total,defaults,delayed,rate:total?defaults/total:0,delayedRate:total?delayed/total:0,limit,avgLimit:total?limit/total:0,avgAge:total?agesTotal/total:0};
}
export type Slice={name:string,count:number,defaults:number,rate:number,avgLimit:number};
export function groupSegments(rows: Segment[], dimension: 'age_band'|'credit_limit_band'|'september_status'): Slice[] {
 const order = dimension==='age_band'?ages:dimension==='credit_limit_band'?limits:[...new Set(segments.map(x=>x.september_status))].sort((a,b)=>+a - +b);
 return order.map(name=>{const t=creditTotals(rows.filter(s=>s[dimension]===name));return {name,count:t.total,defaults:t.defaults,rate:t.rate,avgLimit:t.avgLimit};}).filter(x=>x.count>0);
}
export function paymentSeries(filters:CreditFilters) {
 return ['2005-04','2005-05','2005-06','2005-07','2005-08','2005-09'].map(period=> {
  const rows=payments.filter(p=>p.period===period&&(filters.age==='Tout'||p.age_band===filters.age)&&(filters.limit==='Tout'||p.credit_limit_band===filters.limit)&&(filters.status==='Tout'||p.september_status===filters.status));
  const observations=rows.reduce((s,p)=>s+p.client_observations,0),delayed=rows.reduce((s,p)=>s+p.delayed_clients,0);
  return {period,observations,delayed,rate:observations?delayed/observations:0};
 });
}
export function reconcile(){const t=creditTotals(segments);const p=paymentSeries(initialFilters);return {
 creditRows:segments.length,paymentRows:payments.length,population:t.total,defaults:t.defaults,paymentObservations:p.reduce((s,d)=>s+d.observations,0),creditOK:t.total===30000&&t.defaults===6636,paymentOK:p.length===6&&p.every(d=>d.observations===30000),fraudOK:b4.observed.rows===6362620&&b4.observed.frauds===8213, modelsOK:b3.holdout_test_metrics.pr_auc>0&&b4.holdout_test.pr_auc>0
};}
