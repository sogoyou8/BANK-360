"""B2 semantic/PBIR static contract + aggregate reconciliation tests.
Desktop engine rendering is intentionally NOT claimed by these checks.
"""
from __future__ import annotations
import csv, importlib.util, json, re, sqlite3, tempfile, unittest
from collections import Counter,defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'powerbi/BANK-360'
class BIProject(unittest.TestCase):
    def test_project_and_model_references(self):
        b=json.loads((P/'BANK-360.pbip').read_text(encoding='utf-8'))
        self.assertEqual(b['artifacts'][0]['report']['path'],'BANK-360.Report')
        r=json.loads((P/'BANK-360.Report/definition.pbir').read_text(encoding='utf-8'))
        self.assertEqual(r['datasetReference']['byPath']['path'],'../BANK-360.SemanticModel')
        self.assertTrue((P/'BANK-360.SemanticModel/definition/model.tmdl').is_file())
    def test_pages_and_visuals_valid_references(self):
        report=P/'BANK-360.Report/definition'
        pages=json.loads((report/'pages/pages.json').read_text(encoding='utf-8'))['pageOrder']
        self.assertEqual(pages,['overview','risk','history','quality'])
        modeldir=P/'BANK-360.SemanticModel/definition/tables'
        fields={}
        measures=set()
        for f in modeldir.glob('*.tmdl'):
            txt=f.read_text(encoding='utf-8')
            fields[f.stem]=set(re.findall(r'^\s*column (\w+)',txt,re.M))
            measures.update((f.stem,x) for x in re.findall(r"^\s*measure '(.*?)' =",txt,re.M))
        self.assertEqual(len(measures),13)
        for pid in pages:
            folder=report/'pages'/pid
            p=json.loads((folder/'page.json').read_text(encoding='utf-8'))
            self.assertEqual(p['name'],pid)
            visuals=list((folder/'visuals').glob('*/visual.json'))
            self.assertGreaterEqual(len(visuals),5)
            for vpath in visuals:
                obj=json.loads(vpath.read_text(encoding='utf-8'))
                self.assertEqual(vpath.parent.name,obj['name'])
                self.assertIn('visualType',obj['visual'])
                pos=obj['position']
                self.assertGreater(pos['width'],0);self.assertGreater(pos['height'],0)
                self.assertGreaterEqual(pos['x'],0);self.assertGreaterEqual(pos['y'],0)
                self.assertLessEqual(pos['x']+pos['width'],1280)
                self.assertLessEqual(pos['y']+pos['height'],720)
                for role in obj['visual'].get('query',{}).get('queryState',{}).values():
                    for pr in role.get('projections',[]):
                        fld=pr['field']; t='Measure' if 'Measure' in fld else 'Column';item=fld[t]
                        table=item['Expression']['SourceRef']['Entity']; prop=item['Property']
                        self.assertTrue((table,prop) in measures if t=='Measure' else prop in fields.get(table,set()),(pid,table,prop,t))
    def test_table_definitions_and_relationships(self):
        model=(P/'BANK-360.SemanticModel/definition')
        tables=(model/'model.tmdl').read_text(encoding='utf-8')
        for name in ('Age','CreditLimit','Status','Segments','Payments','Metrics'):
            self.assertIn(f'ref table {name}',tables)
            self.assertTrue((model/'tables'/f'{name}.tmdl').is_file())
        r=(model/'relationships.tmdl').read_text(encoding='utf-8')
        self.assertEqual(r.count('relationship '),6)
        for t in ('Segments','Payments'):
            for d,c in [('Age','age_band'),('CreditLimit','credit_limit_band'),('Status','september_status')]:
                self.assertIn(f'fromColumn: {t}.{c}',r)
                self.assertIn(f'toColumn: {d}.{c}',r)
    def test_calculations_are_weighted_and_sources_are_not_pii(self):
        s=(P/'BANK-360.SemanticModel/definition/tables/Metrics.tmdl').read_text(encoding='utf-8')
        self.assertIn('DIVIDE([Défauts],[Dossiers])',s)
        self.assertIn('DIVIDE([Clients retard mensuels],[Observations mensuelles])',s)
        self.assertNotIn('AVERAGE(Segments[default_count])',s)
        for t in ('Segments','Payments'):
            content=(P/'BANK-360.SemanticModel/definition/tables'/f'{t}.tmdl').read_text(encoding='utf-8')
            self.assertIn('https://raw.githubusercontent.com',content)
            self.assertNotIn('credit_client_id',content)
    def test_real_snapshot_if_present(self):
        data=ROOT/'powerbi/data';a=data/'uci350_segments.csv';b=data/'uci350_payment_months.csv';m=data/'B2-aggregation-manifest.json'
        if not all(x.exists() for x in (a,b,m)):
            self.skipTest('Real snapshot not committed yet (CI job generates it)')
        with a.open(newline='',encoding='utf-8') as f:segments=list(csv.DictReader(f))
        with b.open(newline='',encoding='utf-8') as f:monthly=list(csv.DictReader(f))
        report=json.loads(m.read_text(encoding='utf-8'))
        self.assertEqual(report['scope'],'historical_uci')
        self.assertEqual(sum(int(x['client_count']) for x in segments),30000)
        self.assertEqual(sum(int(x['default_count']) for x in segments),6636)
        self.assertEqual(sum(int(x['total_credit_limit_ntd']) for x in segments),5024529680)
        self.assertEqual(len({tuple(x[k] for k in ('age_band','credit_limit_band','september_status')) for x in segments}),len(segments))
        self.assertTrue(all('credit_client_id' not in row for row in segments))
        self.assertEqual({x['period'] for x in monthly},{'2005-04','2005-05','2005-06','2005-07','2005-08','2005-09'})
        for period in {x['period'] for x in monthly}:
            self.assertEqual(sum(int(x['client_observations']) for x in monthly if x['period']==period),30000)
        self.assertEqual(sum(int(x['delayed_clients']) for x in monthly if x['period']=='2005-09'),sum(int(x['delayed_count']) for x in segments))
    def test_demo_reconciliation_and_no_individual_rows(self):
        # Runs against the B1 *synthetic* database as a negative-scope isolation test.
        p=ROOT/'examples/demo-output/data/bank360.sqlite'
        if not p.is_file(): self.skipTest('Local synthetic integration fixture missing')
        spec=importlib.util.spec_from_file_location('b2aggregates',ROOT/'scripts/build-b2-aggregates.py')
        m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
        with tempfile.TemporaryDirectory() as td:
            report=m.run(db=p,out=Path(td),require_official=False)
            self.assertEqual(report['population'],24)
            with (Path(td)/'uci350_segments.csv').open(newline='',encoding='utf-8') as f:
                rows=list(csv.DictReader(f))
            self.assertEqual(sum(int(x['client_count']) for x in rows),24)
            self.assertNotIn('credit_client_id',rows[0])
if __name__=='__main__':unittest.main()
