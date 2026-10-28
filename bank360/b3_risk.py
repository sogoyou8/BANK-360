"""BANK 360 B3: reproducible, NON-OPERATIONAL historical credit-risk experiment.

No customer-level export; no credit decisions; no protected attributes in the predictors.
Train/validation/test are disjoint and stratified, with final test opened once.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
import os
import sqlite3
import tempfile
from pathlib import Path

import numpy as np
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (average_precision_score, roc_auc_score, brier_score_loss,
                             log_loss, confusion_matrix, fbeta_score, precision_score,
                             recall_score)
from sklearn.model_selection import train_test_split
from sklearn.inspection import permutation_importance
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

BASE = Path(__file__).resolve().parents[1]
MONTHS = ('09','08','07','06','05','04')
FEATURES = (['limit_bal_ntd'] + [f'pay_status_2005_{m}' for m in MONTHS]
            + [f'bill_amt_2005_{m}_ntd' for m in MONTHS]
            + [f'pay_amt_2005_{m}_ntd' for m in MONTHS])
AUDIT_FIELDS = ('sex_code','age_years')
ALL_FIELDS = ['credit_client_id', 'default_next_month', *AUDIT_FIELDS, *FEATURES]
SEED = 42
LABEL = 'default_next_month'
PROHIBITED = {'credit_client_id','default_next_month','sex_code','age_years','education_code','marriage_code'}
assert not PROHIBITED.intersection(FEATURES)


def extract(db: Path, require_official=True):
    if not db.is_file():
        raise RuntimeError(f'B1 database missing: {db}. Run python -m bank360 run --source official')
    with sqlite3.connect(f'file:{db.resolve()}?mode=ro', uri=True) as c:
        meta = c.execute('SELECT source_id,original_uri,input_sha256,dataset_scope,recorded_rows FROM pipeline_metadata').fetchall()
        if len(meta)!=1: raise ValueError('Expected exactly one B1 provenance record')
        source,uri,sha,scope,count=meta[0]
        if require_official and not (source=='UCI350' and scope=='historical_uci' and count==30000 and
                                     'archive.ics.uci.edu' in uri and len(sha)==64):
            raise ValueError('B3 refuses unofficial or synthetic source')
        cols = ','.join('"'+f+'"' for f in ALL_FIELDS)
        # Silver rather than Gold: all original predictors, unique customer grain.
        records = c.execute('SELECT '+cols+' FROM silver_credit_clients ORDER BY credit_client_id').fetchall()
    if len(records)!=count or len({row[0] for row in records})!=len(records):
        raise ValueError('Source grain mismatch: duplicate/missing customers')
    data=np.asarray(records,dtype=np.float64)
    if not np.isfinite(data).all(): raise ValueError('Non-finite feature or target values')
    y=data[:,1].astype(np.int64)
    if set(y.tolist())!={0,1}: raise ValueError('Binary target required')
    x=data[:,4:]
    age=data[:,3].astype(int)
    sex=data[:,2].astype(int)
    if x.shape[1]!=19 or len(np.unique(data[:,0]))!=len(data): raise ValueError('Feature shape/ID contract violated')
    return x,y,{'sex':sex,'age':age},{'source':source,'scope':scope,'sha256':sha,'n':count,'uri':uri}


def transform_features(x):
    """Signed logs preserve negative statement credits; repayment status remains an integer."""
    z=np.asarray(x,dtype=float).copy()
    if z.ndim!=2 or z.shape[1]!=19: raise ValueError('Expected 19 pre-outcome financial features')
    if not np.isfinite(z).all() or np.any(z[:,0]<=0) or np.any(z[:,13:]<0):
        raise ValueError('Invalid financial feature domain')
    z[:,0]=np.log1p(z[:,0])
    z[:,7:13]=np.sign(z[:,7:13])*np.log1p(np.abs(z[:,7:13]))
    z[:,13:]=np.log1p(z[:,13:])
    return z


def split_indices(y):
    ix=np.arange(len(y))
    dev,test=train_test_split(ix,test_size=.20,random_state=SEED,stratify=y)
    train,val=train_test_split(dev,test_size=.25,random_state=SEED+1,stratify=y[dev])
    for a,b in ((train,val),(train,test),(val,test)):
        if np.intersect1d(a,b).size: raise AssertionError('Data leakage: overlapping splits')
    return train,val,test


def candidates():
    return {
      'baseline_prevalence':DummyClassifier(strategy='prior'),
      'logistic_regression':make_pipeline(SimpleImputer(strategy='median'), StandardScaler(),
                                           LogisticRegression(max_iter=700,random_state=SEED)),
      'hist_gradient_boosting':HistGradientBoostingClassifier(max_iter=150, max_leaf_nodes=15,
                                      learning_rate=.06, l2_regularization=20,
                                      min_samples_leaf=35,random_state=SEED),
    }


def basic_metrics(y, scores, threshold=.5):
    if not (np.isfinite(scores).all() and np.all((scores>=0)&(scores<=1))):
        raise ValueError('Invalid probability scores')
    pred=(scores>=threshold).astype(int)
    tn,fp,fn,tp=[int(v) for v in confusion_matrix(y,pred,labels=[0,1]).ravel()]
    return {
      'roc_auc':float(roc_auc_score(y,scores)),
      'pr_auc':float(average_precision_score(y,scores)),
      'brier':float(brier_score_loss(y,scores)),
      'log_loss':float(log_loss(y,np.clip(scores,1e-12,1-1e-12),labels=[0,1])),
      'precision':float(precision_score(y,pred,zero_division=0)),
      'recall':float(recall_score(y,pred,zero_division=0)),
      'f2':float(fbeta_score(y,pred,beta=2,zero_division=0)),
      'confusion':{'tn':tn,'fp':fp,'fn':fn,'tp':tp},
    }


def choose_threshold(y,scores):
    # Model operating threshold chosen ONLY on validation. F2 is an illustrative,
    # non-economic demonstration; never interpreted as a loan-approval policy.
    options=np.linspace(.10,.75,66)
    vals=[float(fbeta_score(y,(scores>=t).astype(int),beta=2,zero_division=0)) for t in options]
    best=max(range(len(options)),key=lambda i:(vals[i],options[i]))
    return float(options[best]),float(vals[best])


def bins_calibration(y,scores):
    # Equal-width bins aggregated only; don't export individual scores.
    k=np.minimum(np.floor(scores*10).astype(int),9)
    out=[]
    for i in range(10):
        mask=k==i
        if np.count_nonzero(mask):
            out.append({'bin':f'{i/10:.1f}–{(i+1)/10:.1f}', 'n':int(mask.sum()),
                        'mean_prediction':float(np.mean(scores[mask])),
                        'observed_default_rate':float(np.mean(y[mask]))})
    return out


def risk_deciles(y,scores):
    ix=np.argsort(-scores,kind='stable')
    out=[]
    for j,part in enumerate(np.array_split(ix,min(len(ix),10)),1):
        yy=y[part]; pp=scores[part]
        out.append({'top_decile':j,'n':len(part),'defaults':int(yy.sum()),
                    'default_rate':float(yy.mean()),'mean_prediction':float(pp.mean())})
    return out


def subgroup_audit(y,scores,threshold,groups):
    result=[]
    age=groups['age']
    ages=np.where(age<30,'18-29',np.where(age<40,'30-39',np.where(age<50,'40-49',np.where(age<60,'50-59','60+'))))
    for field,arr in (('sex_code',groups['sex'].astype(str)),('age_band',ages)):
        for group in np.unique(arr):
            mask=arr==group
            n=int(mask.sum()); pos=int(y[mask].sum()); neg=n-pos
            # Suppress small cells and outcomes to reduce disclosure and false certainty.
            if n<100 or pos<30 or neg<30:
                result.append({'field':field,'group':str(group),'n':n,'positive_n':pos,'suppressed':True,
                               'observed_rate':None,'predicted_mean':None,'recall':None,'false_positive_rate':None})
                continue
            yy=y[mask]; pred=scores[mask]>=threshold
            result.append({'field':field,'group':str(group),'n':n,'positive_n':pos,'suppressed':False,
                           'observed_rate':float(yy.mean()),'predicted_mean':float(scores[mask].mean()),
                           'recall':float(((pred==1)&(yy==1)).sum()/pos),
                           'false_positive_rate':float(((pred==1)&(yy==0)).sum()/neg)})
    return result


def bootstrap_intervals(y,scores,nboot=200):
    # Stratified resampling of TEST ONLY to report descriptive sampling uncertainty.
    rng=np.random.default_rng(SEED+13)
    neg=np.flatnonzero(y==0);pos=np.flatnonzero(y==1)
    values={'roc_auc':[],'pr_auc':[],'brier':[]}
    for _ in range(nboot):
        ix=np.r_[rng.choice(pos,len(pos),replace=True),rng.choice(neg,len(neg),replace=True)]
        values['roc_auc'].append(roc_auc_score(y[ix],scores[ix]))
        values['pr_auc'].append(average_precision_score(y[ix],scores[ix]))
        values['brier'].append(brier_score_loss(y[ix],scores[ix]))
    return {k:{'low':float(np.percentile(v,2.5)),'high':float(np.percentile(v,97.5))}
            for k,v in values.items()}


def atomic_write(path:Path, content:str):
    path.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile('w',encoding='utf-8',dir=path.parent,delete=False) as tmp:
        tmp.write(content);tmpname=tmp.name
    os.replace(tmpname,path)


def csv_dump(path,rows):
    import io
    if not rows: raise ValueError('No aggregate rows')
    buf=io.StringIO(newline='');writer=csv.DictWriter(buf,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    atomic_write(path,buf.getvalue())


def run(db:Path, out:Path, require_official=True):
    x,y,groups,provenance=extract(Path(db),require_official=require_official)
    if require_official and (len(y)!=30000 or int(y.sum())!=6636):
        raise ValueError('B3 dataset must reconcile exactly with B1/B2')
    if len(y)<150: raise ValueError('Insufficient dataset for three-way split')
    tx=transform_features(x)
    train,val,test=split_indices(y)
    candidates_models=candidates()
    validation={};scores_val={}
    for name,model in candidates_models.items():
        model.fit(tx[train],y[train]);pred=model.predict_proba(tx[val])[:,1]
        validation[name]=basic_metrics(y[val],pred)
        scores_val[name]=pred
    eligible=['logistic_regression','hist_gradient_boosting']
    selected=max(eligible,key=lambda name:(validation[name]['pr_auc'],-validation[name]['brier'],name))
    threshold,val_f2=choose_threshold(y[val],scores_val[selected])
    # Untouched test predictions are used only here, once the model and cutoff are fixed.
    test_scores={name:model.predict_proba(tx[test])[:,1] for name,model in candidates_models.items()}
    final=basic_metrics(y[test],test_scores[selected],threshold)
    baseline=basic_metrics(y[test],test_scores['baseline_prevalence'],threshold)
    deciles=risk_deciles(y[test],test_scores[selected])
    bands=bins_calibration(y[test],test_scores[selected])
    audit=subgroup_audit(y[test],test_scores[selected],threshold,{k:v[test] for k,v in groups.items()})
    captured=sum(row['defaults'] for row in deciles[:1])/max(int(y[test].sum()),1)
    # Validation-only permutation ranking — no reuse of untouched TEST to select features.
    probe=val[:min(len(val),2000)]
    importance=permutation_importance(candidates_models[selected],tx[probe],y[probe],
                    scoring='average_precision',n_repeats=2,random_state=SEED,n_jobs=1)
    feature_importance=sorted([{'feature':n,'delta_pr_auc':float(v)}
                      for n,v in zip(FEATURES,importance.importances_mean)],
                      key=lambda r:r['delta_pr_auc'],reverse=True)

    model_record={
      'project':'BANK 360','phase':'B3', 'status':'PASS','use':'historical research / portfolio only — NOT operational credit scoring',
      'dataset':{'name':'UCI350 / Taiwan 2005','source_sha256':provenance['sha256'],
                 'source_uri':provenance['uri'],'population':int(len(y)),'defaults':int(y.sum()),
                 'overall_rate':float(y.mean())},
      'protocol':{'seed':SEED,'split':'60/20/20 stratified one record per client; no temporal holdout available',
                  'train_n':int(len(train)),'validation_n':int(len(val)),'test_n':int(len(test)),
                  'train_defaults':int(y[train].sum()),'validation_defaults':int(y[val].sum()),'test_defaults':int(y[test].sum()),
                  'features':FEATURES,'excluded_predictors':sorted(PROHIBITED),
                  'selection':'maximum validation average precision among logistic and histogram GB; Brier tie-break',
                  'operating_point':'validation F2 threshold for illustration only; NOT a credit decision rule',
                  'threshold':threshold,'validation_f2':val_f2},
      'validation_metrics':validation,
      'selected_model':selected,
      'validation_permutation_importance':feature_importance,
      'holdout_test_metrics':final,
      'holdout_prevalence_baseline':baseline,
      'holdout_95pct_bootstrap_descriptive_ci':bootstrap_intervals(y[test],test_scores[selected]),
      'top_10pct_test_defaults_capture':float(captured),
      'limitations':['Historical Taiwan 2005; not a French bank, no transportability or temporal validation',
                     'Observational labels and incomplete feature provenance; outcomes are not causal',
                     'Sex and age excluded from fit but subgroup differences can persist via proxies',
                     'Subgroup metrics are diagnostic only, not an approval or discrimination assessment',
                     'No individual score exported; no deployment or decisions'],
    }
    if require_official:
        if abs(model_record['dataset']['overall_rate']-(6636/30000))>1e-12: raise ValueError('Unexpected source labels')
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    atomic_write(out/'B3-metrics.json',json.dumps(model_record,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
    csv_dump(out/'B3-risk-deciles.csv',deciles)
    csv_dump(out/'B3-calibration.csv',bands)
    csv_dump(out/'B3-subgroup-audit.csv',audit)
    csv_dump(out/'B3-feature-importance.csv',feature_importance)

    mr=final
    markdown=f'''# BANK 360 — B3 | Model card (non opérationnel)\n\n**Source :** UCI350, Taïwan 2005 · **Statut :** PASS expérimental, aucune décision bancaire.  
**Modèle sélectionné :** `{selected}` sur validation seulement (PR-AUC).  
**Train / validation / test :** {len(train):,} / {len(val):,} / {len(test):,} dossiers, séparation stratifiée.  
**Population :** {len(y):,} dossiers, {int(y.sum()):,} défauts ({y.mean():.2%}).\n\n## Test indépendant\n\n| Mesure | Modèle | Baseline prévalence |\n|---|---:|---:|\n| ROC-AUC | {mr['roc_auc']:.4f} | {baseline['roc_auc']:.4f} |\n| PR-AUC (average precision) | {mr['pr_auc']:.4f} | {baseline['pr_auc']:.4f} |\n| Brier (plus faible = mieux) | {mr['brier']:.4f} | {baseline['brier']:.4f} |\n| Précision au seuil de validation ({threshold:.2f}) | {mr['precision']:.3f} | {baseline['precision']:.3f} |\n| Rappel au même seuil | {mr['recall']:.3f} | {baseline['recall']:.3f} |\n\n*Intervalle bootstrap descriptif ROC-AUC (test) : [{model_record['holdout_95pct_bootstrap_descriptive_ci']['roc_auc']['low']:.3f}, {model_record['holdout_95pct_bootstrap_descriptive_ci']['roc_auc']['high']:.3f}].*  
*Top 10 % des scores : {captured:.1%} des défauts du test.*\n\n## Précautions\n\n- **AUC n'est pas une probabilité de défaut**. La calibration et les différences par groupes doivent être examinées.\n- Seuil F2 = démonstration, **jamais une règle d'acceptation/refus de prêt**.\n- 19 caractéristiques financières, **aucun identifiant, sexe, âge, éducation ou statut marital** dans le modèle ; sexe/âge réservés à l'audit agrégé.\n- Risque de décalage historique et géographique élevé. Aucun échantillon récent, aucune validation prospective.\n- Aucune prédiction client ni données brutes dans GitHub ; aucun modèle binaire publié.\n- Reproduction : `python -m bank360 run --source official`, puis `python -m bank360.b3_risk --db data/bank360.sqlite --out reports/b3`.\n\nDétails machine : `B3-metrics.json` ; calibration : `B3-calibration.csv` ; déciles : `B3-risk-deciles.csv` ; importance de permutation sur validation : `B3-feature-importance.csv` ; audit sexe/âge : `B3-subgroup-audit.csv`.\n'''
    atomic_write(out/'B3-model-card.md',markdown)
    return model_record


def main():
    p=argparse.ArgumentParser(description='BANK 360 — historical UCI research only, no live credit decisions')
    p.add_argument('--db',type=Path,default=BASE/'data/bank360.sqlite')
    p.add_argument('--out',type=Path,default=BASE/'reports/b3')
    p.add_argument('--synthetic-test',action='store_true',help='allow ONLY explicitly synthetic test database')
    args=p.parse_args()
    report=run(args.db,args.out,require_official=not args.synthetic_test)
    print(json.dumps({'status':report['status'],'model':report['selected_model'],
                      'test_metrics':report['holdout_test_metrics'],
                      'train':report['protocol']['train_n'],'test':report['protocol']['test_n']},indent=2))

if __name__=='__main__':main()
