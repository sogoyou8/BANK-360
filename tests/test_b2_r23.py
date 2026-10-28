"""R2.3: spatial layout, governed sorting, readability and native PBIR regression.

These checks validate the native files, not the actual Windows Desktop rendering.
"""
import json
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MODEL=ROOT/'powerbi/BANK-360/BANK-360.SemanticModel/definition/tables'
PAGES=ROOT/'powerbi/BANK-360/BANK-360.Report/definition/pages'


def visuals(page):
    return [json.loads(p.read_text(encoding='utf-8'))
            for p in sorted((PAGES/page/'visuals').glob('*/visual.json'))]


class R23Contract(unittest.TestCase):
    def test_dimensions_have_natural_band_order(self):
        expected={
            'Age': ['18-29','30-39','40-49','50-59','60+'],
            'CreditLimit': ['<50k','50k-99k','100k-199k','200k-499k','500k+']
        }
        for table, bands in expected.items():
            s=(MODEL/(table+'.tmdl')).read_text(encoding='utf-8')
            self.assertIn('sortByColumn: order_index',s)
            self.assertIn('column order_index\n\t\tisHidden',s)
            self.assertIn('dataType: int64',s)
            for i,band in enumerate(bands):
                self.assertIn('{'+'"'+band+'",'+str(i)+'}',s)
            # Unique mapped ranks, no duplicate order.
            self.assertEqual(len(re.findall(r'\{".*?",\d+\}',s)),5)

    def test_pages_have_no_overlapping_visuals_and_fit_canvas(self):
        expected={'overview':12,'risk':12,'history':11,'quality':12}
        for page,count in expected.items():
            vs=visuals(page)
            self.assertEqual(len(vs),count,page)
            self.assertEqual(len({v['name'] for v in vs}),count)
            for i,a in enumerate(vs):
                pa=a['position']
                self.assertLessEqual(pa['x']+pa['width'],1280)
                self.assertLessEqual(pa['y']+pa['height'],720)
                self.assertGreater(pa['width'],0)
                self.assertGreater(pa['height'],0)
                for b in vs[i+1:]:
                    pb=b['position']
                    ix=max(0,min(pa['x']+pa['width'],pb['x']+pb['width'])-max(pa['x'],pb['x']))
                    iy=max(0,min(pa['y']+pa['height'],pb['y']+pb['height'])-max(pa['y'],pb['y']))
                    self.assertEqual(ix*iy,0,(page,a['name'],b['name']))

    def test_charts_tables_and_filter_rail_are_readable(self):
        for page in ('overview','risk','history'):
            vs=visuals(page)
            for v in vs:
                k=v['visual']['visualType']
                if k=='slicer':
                    self.assertEqual(v['position']['y'],241)
                    self.assertGreaterEqual(v['position']['height'],76)
                    self.assertEqual(v['visual']['objects']['data'][0]['properties']['mode']['expr']['Literal']['Value'],"'Dropdown'")
                if k in ('clusteredBarChart','clusteredColumnChart','lineChart','tableEx'):
                    self.assertGreaterEqual(v['position']['height'],320)
                    self.assertGreaterEqual(v['position']['y'],330)
                    self.assertGreaterEqual(v['position']['width'],540)
            tables=[v for v in vs if v['visual']['visualType']=='tableEx']
            for t in tables:
                obj=t['visual']['objects']
                self.assertEqual(obj['columnHeaders'][0]['properties']['fontSize']['expr']['Literal']['Value'],'11D')
                self.assertEqual(len(obj['columnWidth']),4)
                self.assertEqual(len(t['visual']['query']['queryState']['Values']['projections']),4)
                self.assertTrue(all(p.get('displayName') for p in t['visual']['query']['queryState']['Values']['projections']))
                self.assertLess(sum(int(z['properties']['value']['expr']['Literal']['Value'][:-1]) for z in obj['columnWidth']),t['position']['width']-40)

    def test_visual_sorting_and_no_measures_or_fact_change(self):
        for page,visual,field in (
            ('overview','overview_age','Age'),
            ('overview','overview_limit','CreditLimit'),
            ('risk','risk_status','Status'),
            ('risk','risk_cohort','CreditLimit'),
            ('history','history_line','Payments'),
            ('history','history_table','Payments')
        ):
            v=next(x for x in visuals(page) if x['name']==visual)
            d=v['visual']['query']['sortDefinition']['sort'][0]
            self.assertEqual(d['direction'],'Ascending')
            self.assertEqual(d['field']['Column']['Expression']['SourceRef']['Entity'],field)
        metrics=(MODEL/'Metrics.tmdl').read_text(encoding='utf-8')
        self.assertEqual(len(re.findall(r'^\s*measure ',metrics,re.M)),13)
        self.assertIn("DIVIDE([Défauts],[Dossiers])",metrics)
        self.assertIn('SUMX(ALL(Segments),Segments[client_count])=30000',metrics)
        for fact in ('Segments','Payments'):
            self.assertIn('raw.githubusercontent.com',(MODEL/(fact+'.tmdl')).read_text(encoding='utf-8'))

if __name__=='__main__':
    unittest.main()
