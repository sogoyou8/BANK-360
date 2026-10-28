from pathlib import Path
import csv
import json
import tempfile
import unittest
import numpy as np
import pandas as pd
from bank360 import b4_fraud as b4


def fixture(path, *, invalid=None):
    # Locally constructed, deliberately synthetic; in no way PaySim data.
    rng=np.random.default_rng(51)
    with path.open('w',encoding='utf-8',newline='') as f:
        writer=csv.writer(f);writer.writerow(b4.RAW_COLUMNS)
        for step in range(1,744):
            for j in range(12):
                fraud=int((step*12+j)%47==0)
                kind=('TRANSFER' if fraud else ['CASH_IN','CASH_OUT','DEBIT','PAYMENT','TRANSFER'][(step+j)%5])
                amount=100000.0 if fraud else float(np.exp(rng.uniform(3,11)))
                row=[step,kind,amount,'C_TEST_ID',1000000,999000,'C_TEST_DEST',0,0,fraud,int(fraud and amount>200000)]
                if invalid=='type' and step==40 and j==0:row[1]='UNSUPPORTED'
                if invalid=='missing' and step==40 and j==0:row[2]=''
                if invalid=='fraud_type' and step==40 and j==0:row[1]='PAYMENT';row[-2]=1
                writer.writerow(row)
    return path


class B4Tests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
    def tearDown(self):self.tmp.cleanup()
    def test_whitelist_inputs(self):
        self.assertEqual(b4.ALLOWED_COLUMNS,('step','type','amount','isFraud','isFlaggedFraud'))
        data=pd.DataFrame({'step':[1,2],'type':['TRANSFER','PAYMENT'],'amount':[10.,20.]})
        x=b4.features(data);self.assertEqual(x.shape,(2,6))
        self.assertFalse(np.isnan(x).any())
        data['nameOrig']='ACCOUNT_IDENTIFIER';data['newbalanceOrig']=12345
        np.testing.assert_allclose(x,b4.features(data))
    def test_prior_correction(self):
        np.testing.assert_allclose(b4.correct_prior(np.array([.5]),.05),[.05/1.05])
        p=b4.correct_prior(np.array([0.01,0.5,0.99]));self.assertTrue(np.all(np.diff(p)>0))
    def test_temporal_split_and_report(self):
        p=fixture(self.root/'demo.csv');out=self.root/'reports'
        report=b4.run(p,out,official=False)
        self.assertEqual(report['status'],'PASS');self.assertEqual(report['split']['train_steps'],[1,480]);self.assertEqual(report['split']['test_steps'],[611,744]);
        self.assertEqual(report['observed']['rows'],743*12)
        self.assertEqual(sum(a['n'] for a in report['split']['by_partition'].values()),743*12)
        self.assertEqual(sum(a['fraud'] for a in report['split']['by_partition'].values()),report['observed']['frauds'])
        self.assertEqual(report['holdout_test']['n'],(743-610)*12)
        self.assertEqual(sum(report['holdout_test']['confusion'].values()),report['holdout_test']['n'])
        self.assertEqual(report['provenance']['kind'],'synthetic_test')
        self.assertTrue(0 <= report['test_predicted_probability_mean'] <= 1)
        self.assertAlmostEqual(report['test_observed_fraud_rate'],report['split']['by_partition']['test']['fraud']/report['split']['by_partition']['test']['n'])
        self.assertEqual(set(report['prevalence_by_partition']),{'train','validation','test'})
        for file in ['B4-metrics.json','B4-model-card.md','B4-risk-deciles.csv','B4-alerts-by-type.csv','B4-alerts-by-simulated-day.csv']:
            self.assertTrue((out/file).is_file())
        self.assertNotIn('nameOrig',json.loads((out/'B4-metrics.json').read_text())['features'])
    def test_refuse_fake_official_fixture(self):
        p=fixture(self.root/'demo.csv')
        with self.assertRaisesRegex(ValueError,'Full PaySim invariant mismatch'):
            b4.run(p,self.root/'official',official=True)
    def test_invalid_type(self):
        p=fixture(self.root/'bad.csv',invalid='type')
        with self.assertRaisesRegex(ValueError,'Unexpected PaySim'):
            b4.gather(p,official=False)
    def test_missing_values(self):
        p=fixture(self.root/'bad.csv',invalid='missing')
        with self.assertRaisesRegex(ValueError,'missing values'):
            b4.gather(p,official=False)
    def test_impossible_fraud_type(self):
        p=fixture(self.root/'bad.csv',invalid='fraud_type')
        with self.assertRaisesRegex(ValueError,'Fraud outside'):
            b4.gather(p,official=False)
    def test_out_of_order_step(self):
        rows={'step':[9,8],'type':['TRANSFER','TRANSFER'],'amount':[10.,20.], 'isFraud':[0,1], 'isFlaggedFraud':[0,0]}
        with self.assertRaisesRegex(ValueError,'chronological'):
            b4.check_frame(pd.DataFrame(rows))
    def test_deciles_and_group_suppression(self):
        y=np.array([0,1]*20,dtype=np.int8);prob=np.linspace(0,1,40)
        rows=b4.risk_deciles(y,prob)
        self.assertEqual(len(rows),10);self.assertEqual(sum(x['transactions'] for x in rows),40)
        self.assertEqual(sum(x['frauds'] for x in rows),int(y.sum()))
        gr=b4.group_rows(y,prob>.5,np.array(['small']*40),dimension='type',minimum=100)
        self.assertEqual(gr,[])
    def test_threshold_budget_implementation(self):
        probs=np.arange(1000)/1000
        threshold=float(np.quantile(probs,1-b4.ALERT_BUDGET))
        self.assertLessEqual(int((probs>=threshold).sum()),int(1000*b4.ALERT_BUDGET)+1)
    def test_no_hidden_paysim_dump_committed(self):
        root=Path(__file__).resolve().parents[1]
        for x in (root/'reports/b4').glob('*.csv'):
            self.assertNotIn('nameOrig',x.read_text(encoding='utf-8').split('\n')[0])

if __name__=='__main__':unittest.main()
