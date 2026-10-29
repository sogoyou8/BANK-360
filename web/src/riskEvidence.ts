import calibrationSource from '../../reports/b3/B3-calibration.csv?raw';
import importanceSource from '../../reports/b3/B3-feature-importance.csv?raw';
import subgroupSource from '../../reports/b3/B3-subgroup-audit.csv?raw';

function parse(text:string):Record<string,string>[] {
  const [heading,...records]=text.trim().replace(/\r/g,'').split('\n');
  const keys=heading.split(',');
  return records.filter(Boolean).map(line=>Object.fromEntries(line.split(',').map((value,i)=>[keys[i],value])));
}
export const creditCalibration=parse(calibrationSource).map(r=>({bin:r.bin,n:+r.n,predicted:+r.mean_prediction,observed:+r.observed_default_rate}));
export const creditDrivers=parse(importanceSource).map(r=>({name:r.feature,impact:+r.delta_pr_auc}));
export const creditAudit=parse(subgroupSource).map(r=>({field:r.field,group:r.group,n:+r.n,positives:+r.positive_n,suppressed:r.suppressed==='True',observed:r.observed_rate===''?null:+r.observed_rate,recall:r.recall===''?null:+r.recall,fpr:r.false_positive_rate===''?null:+r.false_positive_rate}));
export const driverLabels:Record<string,string>={pay_status_2005_09:'Retard · septembre',pay_status_2005_08:'Retard · août',pay_status_2005_07:'Retard · juillet',bill_amt_2005_09_ntd:'Facture · septembre',limit_bal_ntd:'Limite de crédit',pay_amt_2005_07_ntd:'Paiement · juillet',pay_amt_2005_05_ntd:'Paiement · mai',pay_amt_2005_08_ntd:'Paiement · août',pay_amt_2005_04_ntd:'Paiement · avril',pay_amt_2005_09_ntd:'Paiement · septembre'};
