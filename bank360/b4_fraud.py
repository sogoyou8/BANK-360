"""BANK 360 B4: reproducible, non-operational simulated mobile-money fraud analysis.

PaySim records are a *simulation*. Model input contains only the authorized-at-event
transaction type and amount. No account identifiers, balances, generator flags,
or fraud labels are used to train a prediction.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
import math
import os
from pathlib import Path
import urllib.request
import zipfile

import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (average_precision_score, roc_auc_score, brier_score_loss,
                             confusion_matrix, precision_score, recall_score)
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

TYPES = ('CASH_IN', 'CASH_OUT', 'DEBIT', 'PAYMENT', 'TRANSFER')
# We deliberately do not load account IDs or pre/post balances: simulated ledger
# balance equalities can produce near-perfect but non-transferable predictions.
ALLOWED_COLUMNS = ('step','type','amount','isFraud','isFlaggedFraud')
RAW_COLUMNS = ('step','type','amount','nameOrig','oldbalanceOrg','newbalanceOrig',
               'nameDest','oldbalanceDest','newbalanceDest','isFraud','isFlaggedFraud')
KAGGLE_URL = 'https://www.kaggle.com/api/v1/datasets/download/ealaxi/paysim1'
EXPECTED_ROWS, EXPECTED_FRAUDS = 6362620, 8213
TRAIN_END, VALID_END = 480, 610
ALERT_BUDGET = 0.005  # 0.5% of natural-prevalence validation traffic
NEGATIVE_KEEP = 0.05  # sampling only negatives for training; all positives retained
SEED = 42
FRAUD_REPORT = 'B4-metrics.json'


def acquire(target: Path, url: str = KAGGLE_URL) -> Path:
    """Download public, unmodified Kaggle PaySim ZIP (no credential required in 2026).
    Never publish/download raw data into git. HTTPS network access is mandatory.
    """
    target = Path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        if target.stat().st_size < 100_000:
            raise ValueError('Cached archive suspiciously small')
        if not zipfile.is_zipfile(target):
            raise ValueError('Cached archive is not a ZIP')
        return target
    tmp = target.with_name(target.name + '.part')
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'BANK-360-research/1.0'})
        with urllib.request.urlopen(req, timeout=120) as res, tmp.open('wb') as dst:
            while data := res.read(2**20):
                dst.write(data)
        if tmp.stat().st_size < 100_000 or not zipfile.is_zipfile(tmp):
            raise ValueError('Response is not the PaySim ZIP dataset; no fallback applied')
        tmp.replace(target)
        return target
    finally:
        tmp.unlink(missing_ok=True)


def _read_zip(path: Path):
    with zipfile.ZipFile(path) as z:
        csvs = [p for p in z.infolist() if p.filename.endswith('.csv') and not p.is_dir()]
        if len(csvs)!=1:
            raise ValueError('Expected exactly one CSV inside PaySim ZIP')
        if csvs[0].file_size > 900_000_000:
            raise ValueError('Dataset exceeds reasonable size limit')
        with z.open(csvs[0]) as f:
            yield from pd.read_csv(f, usecols=list(ALLOWED_COLUMNS), chunksize=250_000,
                                   dtype={'step':'int32','type':'category','amount':'float64',
                                          'isFraud':'int8','isFlaggedFraud':'int8'})


def iter_frames(path: Path):
    if path.suffix.lower() == '.zip':
        yield from _read_zip(path)
    elif path.suffix.lower() == '.csv':
        yield from pd.read_csv(path, usecols=list(ALLOWED_COLUMNS), chunksize=250_000,
                              dtype={'step':'int32','type':'category','amount':'float64',
                                     'isFraud':'int8','isFlaggedFraud':'int8'})
    else:
        raise ValueError('Expected PaySim .csv or .zip')


def check_frame(frame: pd.DataFrame, last_step: int=0):
    if tuple(frame.columns) != ALLOWED_COLUMNS:
        # Pandas usecols follows input order; the canonical PaySim order is identical.
        raise ValueError(f'Invalid PaySim column contract: {tuple(frame.columns)}')
    if len(frame)==0 or frame[list(ALLOWED_COLUMNS)].isnull().values.any():
        raise ValueError('Empty chunk or missing values')
    if not (frame.step.ge(1).all() and frame.step.le(744).all()):
        raise ValueError('Step outside 1..744')
    if frame.step.iloc[0] < last_step or frame.step.diff().iloc[1:].lt(0).any():
        raise ValueError('Time steps not chronological')
    if not frame.type.isin(TYPES).all():
        raise ValueError('Unexpected PaySim transaction type')
    if not (np.isfinite(frame.amount).all() and frame.amount.ge(0).all()):
        raise ValueError('Invalid transaction amount')
    if not frame.isFraud.isin((0,1)).all() or not frame.isFlaggedFraud.isin((0,1)).all():
        raise ValueError('Labels/flags must be binary')
    if (frame.isFraud.gt(0)&~frame.type.isin(('TRANSFER','CASH_OUT'))).any():
        raise ValueError('Fraud outside documented PaySim types')


def features(frame: pd.DataFrame) -> np.ndarray:
    """Only two observable fields; no leakage from balances or account names."""
    amount = np.log1p(frame.amount.to_numpy(dtype=float))
    onehot = (frame.type.astype(str).to_numpy()[:,None] == np.asarray(TYPES)[None,:]).astype(float)
    return np.column_stack([amount, onehot])


def gather(path: Path, official: bool):
    rng = np.random.default_rng(SEED)
    samples = {'train':[], 'validation':[], 'test':[]}
    yparts = {'train':[], 'validation':[], 'test':[]}
    types = {'validation':[], 'test':[]}
    steps = {'validation':[], 'test':[]}
    flagged = {'validation':[], 'test':[]}
    totals = {k:{'n':0,'fraud':0} for k in samples}
    count=frauds=last=0
    for frame in iter_frames(path):
        check_frame(frame, last)
        last=int(frame.step.iloc[-1]); count+=len(frame); frauds+=int(frame.isFraud.sum())
        for part,cond in (('train',frame.step.le(TRAIN_END)),
                          ('validation',frame.step.gt(TRAIN_END)&frame.step.le(VALID_END)),
                          ('test',frame.step.gt(VALID_END))):
            section=frame.loc[cond]
            if section.empty:continue
            y=section.isFraud.to_numpy(dtype=np.int8)
            totals[part]['n']+=len(section); totals[part]['fraud']+=int(y.sum())
            if part=='train':
                selection=(y==1)|(rng.random(len(section))<NEGATIVE_KEEP)
                section=section.iloc[np.flatnonzero(selection)]; y=y[selection]
            samples[part].append(features(section)); yparts[part].append(y)
            if part!='train':
                types[part].append(section.type.astype(str).to_numpy())
                steps[part].append(section.step.to_numpy(dtype='int32'))
                flagged[part].append(section.isFlaggedFraud.to_numpy(dtype='int8'))
    if official and (count!=EXPECTED_ROWS or frauds!=EXPECTED_FRAUDS):
        raise ValueError(f'Full PaySim invariant mismatch: n={count} frauds={frauds}')
    if official and (last<730 or last>744):
        raise ValueError(f'Unexpected last simulated step: {last}')
    for p in samples:
        if not samples[p] or totals[p]['fraud']<5 or totals[p]['n']<30:
            raise ValueError(f'Insufficient sample/class support for {p}: {totals[p]}')
    X={p:np.concatenate(samples[p]) for p in samples}
    Y={p:np.concatenate(yparts[p]) for p in samples}
    T={p:np.concatenate(v) for p,v in types.items()}
    S={p:np.concatenate(v) for p,v in steps.items()}
    F={p:np.concatenate(v) for p,v in flagged.items()}
    return (X,Y,T,S,F,totals,{'rows':count,'frauds':frauds,'max_step':last})


def correct_prior(sample_prediction: np.ndarray, negative_keep: float=NEGATIVE_KEEP):
    """Correct the negative downsampling: odds(population)=odds(sample)*q_neg."""
    p=np.clip(np.asarray(sample_prediction,dtype=float),1e-9,1-1e-9)
    odds=(p/(1-p))*negative_keep
    return odds/(1+odds)


def metrics(y, prob, threshold, *, budget=None):
    pred=(prob>=threshold).astype(np.int8)
    tn,fp,fn,tp=(int(v) for v in confusion_matrix(y,pred,labels=[0,1]).ravel())
    return dict(n=int(len(y)),frauds=int(y.sum()),alerted=int(pred.sum()),
                alert_rate=float(pred.mean()),precision=float(precision_score(y,pred,zero_division=0)),
                recall=float(recall_score(y,pred,zero_division=0)),
                false_positive_rate=float(fp/max(1,fp+tn)),
                pr_auc=float(average_precision_score(y,prob)),
                roc_auc=float(roc_auc_score(y,prob)),
                brier=float(brier_score_loss(y,prob)),
                confusion={'tn':tn,'fp':fp,'fn':fn,'tp':tp},
                **({} if budget is None else {'target_validation_alert_budget':budget}))


def group_rows(y, pred, categories, *, dimension, minimum=100):
    rows=[]
    for value in sorted(np.unique(categories)):
        mask=(categories==value);n=int(mask.sum())
        if n<minimum:continue
        tn,fp,fn,tp=(int(v) for v in confusion_matrix(y[mask],pred[mask],labels=[0,1]).ravel())
        rows.append({'dimension':dimension,'group':str(value),'transactions':n,
                     'frauds':int(y[mask].sum()),'alerts':int(pred[mask].sum()),
                     'tp':tp,'fp':fp,'fn':fn,'tn':tn,
                     'precision':tp/max(1,tp+fp),'recall':tp/max(1,tp+fn)})
    return rows


def risk_deciles(y,proba):
    sort=np.argsort(-proba,kind='stable'); groups=np.array_split(sort,10)
    return [{'decile':i+1,'transactions':len(ix),'frauds':int(y[ix].sum()),
             'observed_fraud_rate':float(y[ix].mean()),'mean_probability':float(proba[ix].mean())}
            for i,ix in enumerate(groups)]


def write_csv(path, rows):
    if not rows:raise ValueError(f'No rows for {path.name}')
    with path.open('w',newline='',encoding='utf-8') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)


def run(input_path:Path,output:Path,*,official:bool):
    input_path=Path(input_path);output=Path(output)
    X,y,types,steps,flagged,split,observed=gather(input_path,official)
    if observed['rows'] != sum(v['n'] for v in split.values()):raise ValueError('Split reconciliation failed')
    if observed['frauds'] != sum(v['fraud'] for v in split.values()):raise ValueError('Fraud reconciliation failed')
    approaches={
        'logistic':make_pipeline(StandardScaler(),LogisticRegression(max_iter=500,random_state=SEED)),
        'gradient_boosting':HistGradientBoostingClassifier(max_iter=55,max_leaf_nodes=13,
                                                         l2_regularization=2.0,random_state=SEED)
    }
    validation={};probs={}
    for name,model in approaches.items():
        model.fit(X['train'],y['train'])
        pred=correct_prior(model.predict_proba(X['validation'])[:,1])
        validation[name]={'pr_auc':float(average_precision_score(y['validation'],pred)),
                          'brier':float(brier_score_loss(y['validation'],pred)),
                          'roc_auc':float(roc_auc_score(y['validation'],pred))}
        probs[name]=(model,pred)
    selected=max(validation,key=lambda name:(validation[name]['pr_auc'],-validation[name]['brier']))
    model,val_pred=probs[selected]
    threshold=float(np.quantile(val_pred,1-ALERT_BUDGET))
    test_prob=correct_prior(model.predict_proba(X['test'])[:,1]);test_y=y['test']
    test_result=metrics(test_y,test_prob,threshold,budget=ALERT_BUDGET)
    base_pred=flagged['test'].astype(bool);tn,fp,fn,tp=(int(v) for v in confusion_matrix(test_y,base_pred,labels=[0,1]).ravel())
    baseline={'name':'PaySim simulator isFlaggedFraud rule (not model input)',
              'alerted':int(base_pred.sum()),'recall':tp/max(1,tp+fn),
              'precision':tp/max(1,tp+fp),'confusion':{'tn':tn,'fp':fp,'fn':fn,'tp':tp}}
    candidate_types=types['test'];candidate_steps=steps['test']
    event_pred=test_prob>=threshold
    type_summary=group_rows(test_y,event_pred,candidate_types,dimension='type',minimum=100)
    hourly=(candidate_steps//24).astype('int32')
    time_summary=group_rows(test_y,event_pred,hourly,dimension='day_step_bucket',minimum=100)
    deciles=risk_deciles(test_y,test_prob)
    sha=hashlib.sha256(input_path.read_bytes()).hexdigest() if input_path.stat().st_size<100_000_000 else sha256_stream(input_path)
    report={
        'phase':'B4','status':'PASS','experiment':'SIMULATED_PAYMENTS_ONLY',
        'provenance':{'source_url':KAGGLE_URL if official else 'LOCAL_SYNTHETIC_TEST_FIXTURE',
                      'download_sha256':sha,'kind':'official_paysim_kaggle_zip' if official else 'synthetic_test',
                      'usage':'research/portfolio only; no real-world fraud claims'},
        'observed':observed,
        'prevalence_by_partition':{p:split[p]['fraud']/split[p]['n'] for p in split},
        'test_predicted_probability_mean':float(test_prob.mean()),
        'test_observed_fraud_rate':float(test_y.mean()),
        'test_probability_to_observed_rate_ratio':float(test_prob.mean()/test_y.mean()),
        'split':{'train_steps':[1,TRAIN_END],'validation_steps':[TRAIN_END+1,VALID_END],
                 'test_steps':[VALID_END+1,744],'by_partition':split,
                 'train_negative_keep':NEGATIVE_KEEP,'seed':SEED},
        'features':['log1p(amount)','type (five one-hot flags)'],
        'excluded':['step from model','isFraud','isFlaggedFraud','nameOrig','nameDest',
                    'oldbalanceOrg','newbalanceOrig','oldbalanceDest','newbalanceDest'],
        'selection':'highest validation PR-AUC; tie-break lowest Brier; one untouched chronological test',
        'validation':validation,'model':selected,'alert_rate_budget_validation':ALERT_BUDGET,
        'threshold_validation':threshold,'holdout_test':test_result,'simulator_rule_baseline':baseline,
        'high_risk_decile':deciles[0],
        'limitations':['Full dataset is a SIMULATOR, not true banking records',
                       'Chronological step split is not external time validation',
                       'Some generator-specific patterns cannot generalize',
                       'No cost of investigation or real sanctions modeled',
                       'No person-level transactions/scores/model binary exported']}
    output.mkdir(parents=True,exist_ok=True)
    (output/FRAUD_REPORT).write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    write_csv(output/'B4-alerts-by-type.csv',type_summary)
    write_csv(output/'B4-alerts-by-simulated-day.csv',time_summary)
    write_csv(output/'B4-risk-deciles.csv',deciles)
    top=deciles[0]
    card=f'''# BANK 360 — B4 | Fraud Analytics (PaySim simulated payments)

**Research only.** No real bank fraud data, no operational alarm rule.  Source: [PaySim Kaggle](https://www.kaggle.com/datasets/ealaxi/paysim1), simulated mobile money, CC BY-SA 4.0 attribution required.

**Data checked:** {observed['rows']:,} simulated mobile-money transactions; {observed['frauds']:,} fraud labels ({observed['frauds']/observed['rows']:.3%}). Chronological step split (NOT equal sample sizes): {split['train']['n']:,} train / {split['validation']['n']:,} validation / {split['test']['n']:,} holdout test.

**Selected model (validation only):** {selected}, validation PR-AUC {validation[selected]['pr_auc']:.5f}. Input only transaction type and log transaction amount. Excluded all account identifiers, account balance values and built-in fraud flags. No model leakage from post-transaction balances.

## Test held out — at 0.5% validation alert-volume budget

| Measure | Result |
|---|---:|
| PR-AUC | {test_result['pr_auc']:.5f} |
| ROC-AUC | {test_result['roc_auc']:.5f} |
| Brier | {test_result['brier']:.6f} |
| Alerts | {test_result['alerted']:,} / {test_result['n']:,} |
| Precision | {test_result['precision']:.3%} |
| Recall | {test_result['recall']:.3%} |
| False positive rate | {test_result['false_positive_rate']:.3%} |
| True positive | {test_result['confusion']['tp']:,} |
| False positive | {test_result['confusion']['fp']:,} |
| Missed simulated fraud | {test_result['confusion']['fn']:,} |
| High-risk decile — observed rate | {top['observed_fraud_rate']:.3%} |

**Simulator baseline `isFlaggedFraud`:** recall {baseline['recall']:.3%} at {baseline['alerted']} alarms. This is a comparison with a built-in flag, not a separate deployed fraud-detection product.

## Severe simulated population shift / calibration warning

Fraud prevalence by simulated step window: **train {split['train']['fraud']/split['train']['n']:.3%}** → **validation {split['validation']['fraud']/split['validation']['n']:.3%}** → **test {split['test']['fraud']/split['test']['n']:.3%}**. These are not equally sized time windows by transaction count. The mean test prediction is only **{test_prob.mean():.3%}**, versus **{test_y.mean():.3%} observed fraud**. Thus, model probabilities are **materially undercalibrated under temporal shift** despite ranking value: do not interpret these scores as trustworthy default/fraud probabilities.

## Interpretation

Alerts are simulation-based analytical examples, **never decisions to block payments**. Threshold was fixed from validation on an illustrative 0.5% review-volume budget; review capacity and economic loss are not available and may not transfer. No accounts, transaction-level records or scores are published. The true test prevalence and error count must accompany any PR-AUC claim.

Detailed metadata: [B4-metrics.json](B4-metrics.json). Simulated channel and time aggregates, risk deciles are adjacent CSVs. Re-run source and procedure: `docs/B4-protocole.md`.
'''
    (output/'B4-model-card.md').write_text(card,encoding='utf-8')
    return report


def sha256_stream(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for buf in iter(lambda:f.read(2**20),b''):h.update(buf)
    return h.hexdigest()


def main(argv=None):
    parser=argparse.ArgumentParser(description='B4 non-operational PaySim fraud analytics')
    parser.add_argument('--input',type=Path)
    parser.add_argument('--out',type=Path,default=Path('reports/b4'))
    parser.add_argument('--demo',action='store_true',help='Only locally synthetic demo input')
    parser.add_argument('--download',action='store_true',help='Download canonical PaySim Kaggle dataset')
    args=parser.parse_args(argv)
    if args.demo and args.download:parser.error('Demo and download cannot be combined')
    source=(acquire(Path('data/raw/paysim1.zip')) if args.download else args.input)
    if source is None:parser.error('Provide --input or --download')
    report=run(source,args.out,official=not args.demo)
    print(json.dumps({'status':report['status'],'kind':report['provenance']['kind'],
                      'observed':report['observed'],'model':report['model'],
                      'holdout_test':report['holdout_test']},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
