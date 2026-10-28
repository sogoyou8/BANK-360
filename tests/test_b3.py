"""B3 deterministic local tests. No network, no real customer records."""
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
import numpy as np
from bank360.b3_risk import (FEATURES, PROHIBITED, extract, transform_features,
    split_indices, basic_metrics, choose_threshold, bins_calibration, risk_deciles,
    subgroup_audit, run)

class B3Tests(unittest.TestCase):
    def test_feature_contract_no_post_outcome_or_protected_predictors(self):
        self.assertEqual(len(FEATURES),19)
        self.assertFalse(set(FEATURES)&PROHIBITED)
        self.assertNotIn('default_next_month',FEATURES)
    def test_transform_financial_domain(self):
        x=np.ones((3,19));x[:,7]=-100
        z=transform_features(x)
        self.assertTrue((z[:,7]<0).all())
        self.assertTrue(np.isfinite(z).all())
        bad=x.copy();bad[0,13]=-1
        with self.assertRaises(ValueError): transform_features(bad)
    def test_disjoint_reproducible_stratified_split(self):
        y=np.array([0]*400+[1]*100)
        a=split_indices(y);b=split_indices(y)
        for x,z in zip(a,b):self.assertTrue(np.array_equal(x,z))
        self.assertEqual([len(x) for x in a],[300,100,100])
        self.assertEqual([int(y[x].sum()) for x in a],[60,20,20])
        self.assertEqual(len(set(a[0])&set(a[1])),0)
    def test_metrics_confusion(self):
        y=np.array([0,0,1,1]);p=np.array([.1,.7,.3,.9])
        r=basic_metrics(y,p,threshold=.5)
        self.assertEqual(r['confusion'],{'tn':1,'fp':1,'fn':1,'tp':1})
        self.assertAlmostEqual(r['precision'],.5)
        self.assertEqual(sum(x['n'] for x in bins_calibration(y,p)),4)
        self.assertEqual(sum(x['defaults'] for x in risk_deciles(y,p)),2)
    def test_threshold_independent_of_holdout(self):
        y=np.array([0]*100+[1]*30);s=np.linspace(0,1,len(y))
        t,f=choose_threshold(y,s)
        self.assertGreaterEqual(t,.1);self.assertLessEqual(t,.75)
        self.assertGreaterEqual(f,0)
    def test_subgroup_audit_suppresses_small_cells(self):
        y=np.r_[np.zeros(96,dtype=int),np.ones(24,dtype=int)]
        p=np.linspace(.01,.99,120)
        g={'sex':np.ones(120,dtype=int),'age':np.full(120,25)}
        rows=subgroup_audit(y,p,.5,g)
        self.assertTrue(all(x['suppressed'] for x in rows))
        self.assertTrue(all(x['recall'] is None for x in rows))
    @staticmethod
    def populate(path,n=600):
        rng=np.random.default_rng(1337)
        months=('09','08','07','06','05','04')
        feat=['limit_bal_ntd']+[f'pay_status_2005_{m}' for m in months]+[f'bill_amt_2005_{m}_ntd' for m in months]+[f'pay_amt_2005_{m}_ntd' for m in months]
        with sqlite3.connect(path) as db:
            db.execute('CREATE TABLE pipeline_metadata (source_id TEXT,original_uri TEXT,input_sha256 TEXT,dataset_scope TEXT,recorded_rows INTEGER)')
            db.execute('INSERT INTO pipeline_metadata VALUES(?,?,?,?,?)',('SYNTHETIC','not official','0'*64,'synthetic_test',n))
            defs=['credit_client_id INTEGER PRIMARY KEY','default_next_month INTEGER','sex_code INTEGER','age_years INTEGER']+[f'"{x}" REAL' for x in feat]
            db.execute('CREATE TABLE silver_credit_clients ('+','.join(defs)+')')
            data=[]
            for i in range(n):
                limit=int(rng.choice([30000,80000,150000,300000]));status=int(rng.choice([-2,-1,0,1,2,3],p=[.1,.2,.4,.15,.1,.05]))
                statuses=[status]+[int(rng.integers(-2,3)) for _ in range(5)]
                bills=[int(rng.normal(25000,12000)) for _ in range(6)]
                payments=[int(rng.integers(0,25000)) for _ in range(6)]
                risk=-1.4+.6*status+.000008*(200000-limit)+rng.normal(0,1)
                default=int(rng.random()<1/(1+np.exp(-risk)))
                data.append([i+1,default,int(rng.choice([1,2])),int(rng.integers(18,66)),limit,*statuses,*bills,*payments])
            db.executemany('INSERT INTO silver_credit_clients VALUES('+','.join('?'*23)+')',data)
            db.commit()
    def test_end_to_end_on_explicit_synthetic_only(self):
        with tempfile.TemporaryDirectory() as td:
            db=Path(td)/'synthetic.sqlite';self.populate(db)
            with self.assertRaisesRegex(ValueError,'unofficial or synthetic'):extract(db,require_official=True)
            out=Path(td)/'out'
            result=run(db,out,require_official=False)
            self.assertEqual(result['status'],'PASS')
            self.assertEqual(result['protocol']['train_n'],360)
            self.assertEqual(result['protocol']['validation_n'],120)
            self.assertEqual(result['protocol']['test_n'],120)
            self.assertEqual(len(result['validation_permutation_importance']),19)
            for file in ('B3-metrics.json','B3-model-card.md','B3-risk-deciles.csv','B3-calibration.csv','B3-subgroup-audit.csv','B3-feature-importance.csv'):
                self.assertTrue((out/file).is_file(),file)
            report=json.loads((out/'B3-metrics.json').read_text())
            self.assertEqual(report['dataset']['population'],600)
            self.assertNotIn('client_id',(out/'B3-subgroup-audit.csv').read_text())

if __name__=='__main__':unittest.main()
