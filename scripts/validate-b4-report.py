"""Independent B4 report reconciliation; no individual scores or raw PaySim rows."""
import csv
import json
from pathlib import Path
p=Path('reports/b4');r=json.loads((p/'B4-metrics.json').read_text(encoding='utf-8'))
assert r['phase']=='B4' and r['status']=='PASS'
assert r['provenance']['kind']=='official_paysim_kaggle_zip', 'B4 cannot pass as official from demo'
assert r['observed']['rows']==6362620 and r['observed']['frauds']==8213
splits=r['split']['by_partition']; assert sum(z['n'] for z in splits.values())==6362620
assert sum(z['fraud'] for z in splits.values())==8213
assert splits['validation']['fraud']>0 and splits['test']['fraud']>0
assert r['alert_rate_budget_validation']==0.005
assert r['prevalence_by_partition']['test'] == splits['test']['fraud']/splits['test']['n']
assert 0 < r['test_predicted_probability_mean'] < 1
assert r['test_probability_to_observed_rate_ratio'] > 0
assert r['holdout_test']['n']==splits['test']['n']
conf=r['holdout_test']['confusion'];assert sum(conf.values())==splits['test']['n']
assert conf['tp']+conf['fn']==splits['test']['fraud']
assert 0<=r['holdout_test']['pr_auc']<=1 and 0<=r['holdout_test']['precision']<=1
assert 'isFraud' not in r['features'] and 'nameOrig' not in r['features']
with (p/'B4-risk-deciles.csv').open(newline='',encoding='utf-8') as f: rows=list(csv.DictReader(f))
assert len(rows)==10 and sum(int(x['transactions']) for x in rows)==splits['test']['n']
assert sum(int(x['frauds']) for x in rows)==splits['test']['fraud']
with (p/'B4-alerts-by-type.csv').open(newline='',encoding='utf-8') as f: rows=list(csv.DictReader(f))
assert sum(int(x['transactions']) for x in rows)==splits['test']['n']
assert sum(int(x['tp']) for x in rows)==conf['tp']
assert sum(int(x['fp']) for x in rows)==conf['fp']
for csvpath in p.glob('B4-*.csv'):
    header=csvpath.open(encoding='utf-8').readline().lower()
    assert 'nameorig' not in header and 'namedest' not in header and 'transaction_id' not in header
print('B4 PASS: dataset, split, confusion, risk deciles, channels and safe aggregate-only exports')
