"""R2.4 regression: fixed-population copy, safely visible notes and filter contracts.

These checks are static; selecting a slicer in Power BI Desktop remains a manual
acceptance criterion. Do not claim a UI interaction from this file alone.
"""
import csv
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'powerbi/BANK-360/BANK-360.Report/definition/pages'
MODEL = ROOT / 'powerbi/BANK-360/BANK-360.SemanticModel/definition'
SNAP = ROOT / 'powerbi/data/uci350_segments.csv'


def visual(page, key):
    return json.loads((REPORT/page/'visuals'/(page+'_'+key)/'visual.json').read_text(encoding='utf-8'))


def text_of_visual(obj):
    ps = obj['visual']['objects']['general'][0]['properties']['paragraphs']
    return ' '.join(run['value'] for p in ps for run in p['textRuns'])


class R24DesktopAcceptanceContract(unittest.TestCase):
    def test_footnotes_are_not_in_page_bottom_risk_zone(self):
        for page in ('overview', 'risk', 'history'):
            foot = visual(page, 'footer')
            coords = foot['position']
            self.assertLessEqual(coords['y'],650)
            self.assertGreaterEqual(coords['height'],35)
            self.assertLessEqual(coords['y'] + coords['height'],690)
            style = foot['visual']['objects']['general'][0]['properties']['paragraphs'][0]['textRuns'][0]['textStyle']
            self.assertGreaterEqual(float(style['fontSize'].removesuffix('pt')),11)
            chart_visuals = [json.loads(f.read_text(encoding='utf-8')) for f in (REPORT/page/'visuals').glob('*/visual.json')]
            for obj in chart_visuals:
                if obj['visual']['visualType'] not in ('lineChart','clusteredColumnChart','clusteredBarChart','tableEx'):
                    continue
                rect = obj['position']
                self.assertLessEqual(rect['y']+rect['height'],630)
                self.assertGreaterEqual(coords['y'] - (rect['y']+rect['height']),12)

    def test_population_note_says_total_is_fixed_and_metrics_are_selected(self):
        msg = text_of_visual(visual('overview','note'))
        self.assertIn('Base totale UCI : 30 000 dossiers',msg)
        self.assertIn('KPI et graphiques reflètent les filtres',msg)
        self.assertIn('barres sélectionnées',msg)
        self.assertNotIn('Périmètre : 30 000 dossiers UCI',msg)
        self.assertIn('groupes sélectionnés',text_of_visual(visual('risk','note')))

    def test_slicers_have_unique_dimension_bindings_and_fact_paths(self):
        expected = {
            'overview': [('ageFilter','Age','age_band'),('limitFilter','CreditLimit','credit_limit_band')],
            'risk': [('statusfilter','Status','september_status'),('agefilter','Age','age_band')],
            'history': [('agefilter','Age','age_band'),('limitfilter','CreditLimit','credit_limit_band')],
        }
        relation = (MODEL/'relationships.tmdl').read_text(encoding='utf-8')
        for page, slicers in expected.items():
            for name, dim, col in slicers:
                v = visual(page,name)['visual']
                self.assertEqual(v['visualType'],'slicer')
                pr = v['query']['queryState']['Values']['projections'][0]
                self.assertEqual(pr['field']['Column']['Expression']['SourceRef']['Entity'],dim)
                self.assertEqual(pr['field']['Column']['Property'],col)
                self.assertEqual(v['objects']['data'][0]['properties']['mode']['expr']['Literal']['Value'],"'Dropdown'")
                for fact in ('Segments','Payments'):
                    self.assertIn(f'fromColumn: {fact}.{col}',relation)
                    self.assertIn(f'toColumn: {dim}.{col}',relation)
        measures=(MODEL/'tables/Metrics.tmdl').read_text(encoding='utf-8')
        self.assertIn('DIVIDE([Défauts],[Dossiers])',measures)

    def test_known_age_selection_reconciles_when_source_snapshot_is_present(self):
        if not SNAP.is_file():
            self.skipTest('Official aggregate source is fetched in repository CI')
        with SNAP.open(newline='', encoding='utf-8-sig') as handle:
            records = list(csv.DictReader(handle))
        cohort = [r for r in records if r['age_band']=='18-29']
        self.assertEqual(sum(int(r['client_count']) for r in cohort),9618)
        self.assertEqual(sum(int(r['default_count']) for r in cohort),2197)
        self.assertEqual(sum(int(r['client_count']) for r in records),30000)
        self.assertEqual(sum(int(r['default_count']) for r in records),6636)


if __name__=='__main__':
    unittest.main()
