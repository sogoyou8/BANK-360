"""B1 zero-network tests using strictly SYNTHETIC clients.

Run: python -m unittest discover -s tests -v
"""
import csv
import hashlib
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from bank360.pipeline import (
    SOURCE_COLUMNS, DataQualityError, build, validate_database, sha256_file
)


def sample_rows(count=24):
    rows = []
    for i in range(1, count+1):
        rows.append(
            [i, 50000+i*1000, 1 if i%2 else 2, 0 if i==3 else 2,
             0 if i==5 else 1, 22+i%40,
             2 if i%3==0 else 0, -1, -2, 0, 1, 0,
             -9 if i == 1 else 2000+i, 2100, 2200, 2300, 2400, 2500,
             100, 200, 300, 400, 500, 600,
             1 if i%4==0 else 0]
        )
    return rows


def write_fixture(path, rows, header=SOURCE_COLUMNS):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)


class TestB1(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.root = Path(self.folder.name)
        self.src = self.root / 'test_source.csv'
        self.output = self.root / 'output'
        write_fixture(self.src, sample_rows())

    def run_demo(self):
        return build(self.src, output_dir=self.output, origin='synthetic-test', demo=True, expected_rows=24)

    def test_successful_end_to_end(self):
        report = self.run_demo()
        self.assertEqual(report['metrics']['client_count'], 24)
        self.assertEqual(report['metrics']['default_count'], 6)
        self.assertEqual(report['metrics']['delayed_september_count'], 8)
        self.assertEqual(report['metrics']['total_credit_limit_ntd'], 1500000)
        self.assertEqual(report['metrics']['default_rate_pct'], 25.0)
        self.assertEqual(report['origin_claim'], 'synthetic-test')
        self.assertEqual(report['dataset_kind'], 'synthetic_fixture_NOT_REAL')
        self.assertEqual(len(report['files_exported']), 8)
        self.assertTrue(all(v == 0 for v in report['integrity_checks'].values()))

    def test_silver_preserves_undocumented_codes_and_negative_bills(self):
        report = self.run_demo()
        self.assertEqual(report['warnings']['education_undocumented_code_0_5_6'], 1)
        self.assertEqual(report['warnings']['marriage_undocumented_code_0'], 1)
        self.assertEqual(report['warnings']['negative_bill_amount_any_month'], 1)
        con = sqlite3.connect(self.output / 'data/bank360.sqlite')
        try:
            self.assertEqual(con.execute('select education_code from silver_credit_clients where credit_client_id=3').fetchone()[0], 0)
            self.assertEqual(con.execute('select bill_amt_2005_09_ntd from silver_credit_clients where credit_client_id=1').fetchone()[0], -9)
        finally:
            con.close()

    def test_payment_history_and_separation(self):
        self.run_demo()
        con = sqlite3.connect(self.output / 'data/bank360.sqlite')
        try:
            self.assertEqual(con.execute('SELECT count(*) FROM gold_credit_payment_history').fetchone()[0], 144)
            self.assertEqual(con.execute('SELECT count(*) FROM gold_credit_monthly_status').fetchone()[0], 6)
            self.assertEqual(con.execute('SELECT source_id FROM gold_credit_clients LIMIT 1').fetchone()[0], 'SYNTHETIC_B1_TEST')
            self.assertEqual(con.execute('SELECT data_scope FROM gold_credit_monthly_status LIMIT 1').fetchone()[0], 'SYNTHETIC TEST — NOT REAL')
            self.assertEqual(con.execute('SELECT sum(client_count) FROM gold_credit_age_segments').fetchone()[0], 24)
        finally:
            con.close()

    def test_independent_database_validation(self):
        self.run_demo()
        check = validate_database(self.output / 'data/bank360.sqlite')
        self.assertEqual(check['status'], 'PASS')
        self.assertEqual(check['client_count'], 24)

    def test_idempotent_exports(self):
        self.run_demo()
        old = sha256_file(self.output / 'data/gold/gold_credit_clients.csv')
        self.run_demo()
        new = sha256_file(self.output / 'data/gold/gold_credit_clients.csv')
        self.assertEqual(old,new)

    def test_duplicate_id_rejected_without_partial_overwrite(self):
        self.run_demo()
        original = sha256_file(self.output / 'reports/B1-quality-report.json')
        rows = sample_rows();rows[-1][0] = rows[0][0]
        write_fixture(self.src, rows)
        with self.assertRaisesRegex(DataQualityError, 'duplicate'):
            self.run_demo()
        self.assertEqual(sha256_file(self.output / 'reports/B1-quality-report.json'), original)

    def test_missing_value_rejected(self):
        rows = sample_rows();rows[2][3] = ''
        write_fixture(self.src, rows)
        with self.assertRaisesRegex(DataQualityError, 'missing'):
            self.run_demo()

    def test_noninteger_value_rejected(self):
        rows = sample_rows();rows[2][1] = '50000.5'
        write_fixture(self.src, rows)
        with self.assertRaisesRegex(DataQualityError, 'not a finite integer'):
            self.run_demo()

    def test_wrong_count_rejected(self):
        with self.assertRaisesRegex(DataQualityError, 'Row count mismatch'):
            build(self.src, output_dir=self.output, origin='synthetic-test', demo=True, expected_rows=30)

    def test_incorrect_header_rejected(self):
        write_fixture(self.src, sample_rows(), header=['ID','bad']+SOURCE_COLUMNS[2:])
        with self.assertRaisesRegex(DataQualityError, 'schema mismatch'):
            self.run_demo()

    def test_illegal_status_rejected(self):
        rows = sample_rows();rows[0][6] = 12
        write_fixture(self.src,rows)
        with self.assertRaisesRegex(DataQualityError, 'PAY status'):
            self.run_demo()

    def test_scientific_notation_for_integer_amount_is_accepted(self):
        rows = sample_rows(); rows[0][1] = '5e+04'
        write_fixture(self.src, rows)
        report = self.run_demo()
        self.assertEqual(report['metrics']['client_count'], 24)
        # Case 1 replaces 51000 with 50000.
        self.assertEqual(report['metrics']['total_credit_limit_ntd'], 1499000)

    def test_nan_is_rejected(self):
        rows = sample_rows(); rows[0][1] = 'NaN'
        write_fixture(self.src, rows)
        with self.assertRaisesRegex(DataQualityError, 'not a finite integer'):
            self.run_demo()

    def test_invalid_target_is_rejected(self):
        rows = sample_rows(); rows[0][-1] = 2
        write_fixture(self.src, rows)
        with self.assertRaisesRegex(DataQualityError, 'Target must be binary'):
            self.run_demo()

    def test_negative_payment_is_rejected(self):
        rows = sample_rows(); rows[0][18] = -20
        write_fixture(self.src, rows)
        with self.assertRaisesRegex(DataQualityError, 'Negative payment amount'):
            self.run_demo()

    def test_production_requires_30000_and_not_synthetic(self):
        with self.assertRaisesRegex(DataQualityError, 'Noncanonical'):
            build(self.src, output_dir=self.output, origin='local-unknown', expected_rows=24)
        with self.assertRaisesRegex(DataQualityError, 'Synthetic source'):
            build(self.src, output_dir=self.output, origin='synthetic-test')


if __name__ == '__main__':
    unittest.main()
