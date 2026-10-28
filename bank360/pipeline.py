"""B1 ingestion, quality gates and reproducible SQL/CSV outputs.

This code NEVER makes decisions about real applicants. Labels are historical.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import sqlite3
import tempfile
import zipfile
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / 'data' / 'raw'
SILVER_DIR = ROOT / 'data' / 'silver'
GOLD_DIR = ROOT / 'data' / 'gold'
REPORT_DIR = ROOT / 'reports'
DB_PATH = ROOT / 'data' / 'bank360.sqlite'
UCI_SOURCE = 'https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients'
DOWNLOADS = {
    'official': ('https://archive.ics.uci.edu/static/public/350/default+of+credit+card+clients.zip', 'default_of_credit_card_clients_uci350.zip'),
    'mirror': ('https://huggingface.co/datasets/scikit-learn/credit-card-clients/raw/main/UCI_Credit_Card.csv', 'UCI_Credit_Card.csv'),
}
SOURCE_COLUMNS = (
    ['ID', 'LIMIT_BAL', 'SEX', 'EDUCATION', 'MARRIAGE', 'AGE']
    + ['PAY_0', 'PAY_2', 'PAY_3', 'PAY_4', 'PAY_5', 'PAY_6']
    + [f'BILL_AMT{i}' for i in range(1, 7)]
    + [f'PAY_AMT{i}' for i in range(1, 7)]
    + ['default.payment.next.month']
)
TARGET_COLUMNS = (
    ['credit_client_id', 'limit_bal_ntd', 'sex_code', 'education_code', 'marriage_code', 'age_years']
    + [f'pay_status_2005_{m:02d}' for m in (9,8,7,6,5,4)]
    + [f'bill_amt_2005_{m:02d}_ntd' for m in (9,8,7,6,5,4)]
    + [f'pay_amt_2005_{m:02d}_ntd' for m in (9,8,7,6,5,4)]
    + ['default_next_month']
)
VIEWS = [
    'gold_credit_clients', 'gold_credit_overview', 'gold_credit_status_segments',
    'gold_credit_age_segments', 'gold_credit_limit_segments',
    'gold_credit_payment_history', 'gold_credit_monthly_status',
]

class DataQualityError(ValueError):
    """Input cannot be trusted for downstream BI."""


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def download_dataset(source='official', force=False, out_dir=None) -> Path:
    if source not in DOWNLOADS:
        raise ValueError(f'Unknown source: {source}')
    url, name = DOWNLOADS[source]
    folder = Path(out_dir) if out_dir else RAW_DIR
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / name
    if path.exists() and not force:
        if path.stat().st_size < 50_000:
            raise DataQualityError('Cached source suspiciously small; remove or redownload')
        return path
    # Fetch exact URLs; never silently swap official UCI and 3rd-party mirror.
    req = Request(url, headers={'User-Agent': 'BANK360-B1/0.1 (+data attribution UCI350)'})
    tmp_name = None
    try:
        with urlopen(req, timeout=60) as resp, tempfile.NamedTemporaryFile(dir=folder, delete=False) as tmp:
            tmp_name = tmp.name
            while True:
                block = resp.read(1024 * 1024)
                if not block:
                    break
                tmp.write(block)
        tmp_path = Path(tmp_name)
        if tmp_path.stat().st_size < 50_000:
            raise DataQualityError('Downloaded source too small; may be login/error page')
        if source == 'official' and not zipfile.is_zipfile(tmp_path):
            raise DataQualityError('Expected UCI ZIP, received unexpected response')
        if source == 'mirror':
            with tmp_path.open('r', newline='', encoding='utf-8-sig') as f:
                header = next(csv.reader(f))
            if header != SOURCE_COLUMNS:
                raise DataQualityError(f'Mirror CSV column contract mismatch: {header!r}')
        os.replace(tmp_path, path)
        return path
    finally:
        if tmp_name:
            Path(tmp_name).unlink(missing_ok=True)


def _as_int(value, *, field: str, row_no: int) -> int:
    if value is None or str(value).strip() == '':
        raise DataQualityError(f'Row {row_no}: {field} is missing')
    try:
        num = Decimal(str(value).strip())
        if not num.is_finite() or num != num.to_integral_value():
            raise InvalidOperation('Nonintegral value')
        return int(num)
    except (InvalidOperation, TypeError, ValueError, OverflowError) as exc:
        raise DataQualityError(f'Row {row_no}: {field} not a finite integer: {value!r}') from exc


def _csv_rows(path: Path):
    with path.open('r', newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != SOURCE_COLUMNS:
            raise DataQualityError(f'CSV schema mismatch. Expected {SOURCE_COLUMNS}, got {reader.fieldnames}')
        for row in reader:
            if None in row or any(v is None for v in row.values()):
                raise DataQualityError('CSV contains unexpected extra/missing fields')
            yield row


def _excel_rows(excel_data):
    try:
        import pandas as pd
    except ImportError as exc:
        raise RuntimeError('For UCI original XLS: pip install -r requirements-uci.txt') from exc
    try:
        # Original UCI XLS has a descriptive X1..Y first row, canonical names in second row.
        frame = pd.read_excel(excel_data, sheet_name=0, header=1, engine='xlrd')
    except ImportError as exc:
        raise RuntimeError('For UCI original XLS: pip install -r requirements-uci.txt') from exc
    # Official XLS uses a space-separated label for the target; CSV mirrors often
    # rewrite it with dots. Normalize that one known spelling, never reorder fields.
    normalized_cols = [str(c).strip().replace('default payment next month',
                        'default.payment.next.month') for c in frame.columns]
    if normalized_cols != SOURCE_COLUMNS:
        raise DataQualityError(f'Original XLS contract mismatch: {list(frame.columns)!r}')
    for row in frame.itertuples(index=False, name=None):
        yield dict(zip(SOURCE_COLUMNS, row))


def read_source(path: Path):
    suffix = path.suffix.lower()
    if suffix == '.csv':
        yield from _csv_rows(path)
    elif suffix == '.xls':
        yield from _excel_rows(path)
    elif suffix == '.zip':
        if not zipfile.is_zipfile(path):
            raise DataQualityError('Input .zip is invalid')
        with zipfile.ZipFile(path) as zf:
            items = [item for item in zf.infolist() if item.filename.lower().endswith('.xls') and not item.is_dir()]
            if len(items) != 1 or items[0].file_size > 30_000_000:
                raise DataQualityError('UCI archive must contain exactly one reasonably sized XLS workbook')
            yield from _excel_rows(io.BytesIO(zf.read(items[0])))
    else:
        raise DataQualityError('Input must be a .csv, original .xls or UCI ZIP')


def _domain_checks(row: tuple[int, ...], no: int):
    cid, limit, sex, education, marriage, age = row[:6]
    statuses, bills, payments = row[6:12], row[12:18], row[18:24]
    label = row[-1]
    rules = (
        (cid > 0, 'ID must be positive'),
        (limit > 0, 'LIMIT_BAL must be positive'),
        (sex in (1,2), 'SEX not in 1,2'),
        (education in range(0,7), 'EDUCATION code invalid'),
        (marriage in range(0,4), 'MARRIAGE code invalid'),
        (18 <= age <= 110, 'AGE not in 18..110'),
        (all(-2 <= n <= 9 for n in statuses), 'PAY status code invalid'),
        (all(n >= 0 for n in payments), 'Negative payment amount'),
        (label in (0,1), 'Target must be binary'),
    )
    for success, error in rules:
        if not success:
            raise DataQualityError(f'Row {no}: {error}; ID={cid}')
    # Negative BILL_AMT values are valid statement credits and are preserved.
    return bool(any(x < 0 for x in bills))


def _load(conn: sqlite3.Connection, path: Path):
    seen = set()
    anomalies = Counter()
    totals = {'rows':0, 'default_count':0, 'delayed_count':0, 'limit_sum_ntd':0}
    insert = 'INSERT INTO silver_credit_clients (' + ','.join(TARGET_COLUMNS) + ') VALUES (' + ','.join('?' for _ in TARGET_COLUMNS) + ')'
    batch = []
    for no, record in enumerate(read_source(path), 1):
        row = tuple(_as_int(record[k], field=k, row_no=no) for k in SOURCE_COLUMNS)
        has_negative_bill = _domain_checks(row, no)
        if row[0] in seen:
            raise DataQualityError(f'Row {no}: duplicate client ID {row[0]}')
        seen.add(row[0]); batch.append(row)
        totals['rows'] += 1
        totals['default_count'] += row[-1]
        totals['delayed_count'] += int(row[6] >= 1)
        totals['limit_sum_ntd'] += row[1]
        anomalies['education_undocumented_code_0_5_6'] += int(row[3] in (0,5,6))
        anomalies['marriage_undocumented_code_0'] += int(row[4] == 0)
        anomalies['negative_bill_amount_any_month'] += int(has_negative_bill)
        if len(batch) == 1000:
            conn.executemany(insert, batch)
            batch.clear()
    if batch: conn.executemany(insert, batch)
    if totals['rows'] == 0:
        raise DataQualityError('No rows in source dataset')
    return totals, dict(anomalies)


def _quality_queries(conn: sqlite3.Connection):
    res = conn.execute((ROOT / 'sql' / '03_integrity_checks.sql').read_text(encoding='utf-8')).fetchall()
    checks = {name: count for name, count in res}
    if any(v != 0 for v in checks.values()):
        raise DataQualityError(f'SQL integrity checks failed: {checks}')
    return checks


def _export_query(conn, sql, output):
    output.parent.mkdir(parents=True, exist_ok=True)
    cur = conn.execute(sql)
    with output.open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([d[0] for d in cur.description])
        while batch := cur.fetchmany(4000):
            writer.writerows(batch)


def build(input_path: Path, *, output_dir: Path | None = None, demo=False, expected_rows=30000, origin='local-unknown') -> dict:
    """Build atomic B1 output. Production expects exact UCI 30k; demo is labeled synthetic."""
    input_path = Path(input_path).resolve()
    if not input_path.is_file():
        raise FileNotFoundError(input_path)
    if demo and origin != 'synthetic-test':
        raise DataQualityError('Demo mode must use --origin synthetic-test')
    if not demo and origin == 'synthetic-test':
        raise DataQualityError('Synthetic source cannot be called historical UCI')
    if expected_rows != 30000 and not demo:
        raise DataQualityError('Noncanonical row count allowed only in explicit synthetic demo')
    if expected_rows <= 0:
        raise DataQualityError('Expected rows must be positive')
    root = Path(output_dir or ROOT).resolve()
    root.mkdir(parents=True, exist_ok=True)
    # All outputs are staged in a temporary directory, swapped after validation.
    with tempfile.TemporaryDirectory(prefix='.b1-stage-', dir=root) as stage_str:
        stage = Path(stage_str)
        db = stage / 'data' / 'bank360.sqlite'
        db.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(db)
        try:
            conn.executescript((ROOT / 'sql' / '01_schema.sql').read_text(encoding='utf-8'))
            totals, anomalies = _load(conn, input_path)
            if totals['rows'] != expected_rows:
                raise DataQualityError(f'Row count mismatch: {totals["rows"]} vs expected {expected_rows}')
            scope = 'synthetic_test' if demo else 'historical_uci'
            input_sha = sha256_file(input_path)
            source_actual = DOWNLOADS.get(origin, ('supplied local file (origin unverified)', ''))[0]
            conn.execute('INSERT INTO pipeline_metadata VALUES (?,?,?,?,?,?,?,?,?,?,?)', (
                'SYNTHETIC_B1_TEST' if demo else 'UCI350',
                'BANK 360 synthetic integration fixture' if demo else 'Default of Credit Card Clients',
                source_actual, input_path.name, input_sha, input_path.suffix.lower(), scope,
                totals['rows'], 'synthetic' if demo else 'Taiwan 2005 (Apr-Sep data; next-month label)',
                'NTD' if not demo else 'FICTIONAL', 'internal test fixture' if demo else 'CC BY 4.0 (UCI original)',
            ))
            conn.executescript((ROOT / 'sql' / '02_gold_views.sql').read_text(encoding='utf-8'))
            checks = _quality_queries(conn)
            overview_cursor = conn.execute('SELECT * FROM gold_credit_overview')
            metric = dict(zip([x[0] for x in overview_cursor.description], overview_cursor.fetchone()))
            if (metric['client_count'] != totals['rows'] or metric['default_count'] != totals['default_count']
                    or metric['delayed_september_count'] != totals['delayed_count']
                    or metric['total_credit_limit_ntd'] != totals['limit_sum_ntd']):
                raise DataQualityError('Independent Python ↔ SQL reconciliation mismatch')
            conn.commit()
            _export_query(conn, 'SELECT * FROM silver_credit_clients ORDER BY credit_client_id', stage / 'data' / 'silver' / 'silver_credit_clients.csv')
            for name in VIEWS:
                order = ('credit_client_id, month_sort' if name == 'gold_credit_payment_history' else
                         'credit_client_id' if name == 'gold_credit_clients' else
                         'month_sort DESC' if name == 'gold_credit_monthly_status' else '1')
                _export_query(conn, f'SELECT * FROM {name} ORDER BY {order}', stage / 'data' / 'gold' / (name + '.csv'))
            report = {
                'project':'BANK 360', 'phase':'B1', 'status':'PASS',
                'dataset_kind':'synthetic_fixture_NOT_REAL' if demo else 'real_historical_UCI350',
                'input_file':input_path.name, 'input_sha256':input_sha,
                'origin_claim':origin, 'official_reference':UCI_SOURCE,
                'license':'CC BY 4.0 (UCI original; attribution required)' if not demo else 'synthetic test data',
                'population':'SYNTHETIC FOR TESTS ONLY' if demo else 'Taiwan historical credit card clients (2005)',
                'currency':'FICTIONAL' if demo else 'NTD',
                'grain':'one historical client record', 'expected_rows':expected_rows,
                'metrics':metric, 'source_reconciliation':totals,
                'integrity_checks':checks, 'warnings':anomalies,
                'interpretation_limits':[
                    'LIMIT_BAL is a credit limit, not loan outstanding.',
                    'default_next_month is a historical classification label, not regulatory NPL.',
                    'Do not join to PaySim transactions or EBA sector observations.',
                    'No real credit decisions; no generalization to France/2026.',
                    'The six historic payment months are not independent time-series cohorts.',
                ],
                'files_exported':['data/silver/silver_credit_clients.csv'] + [f'data/gold/{x}.csv' for x in VIEWS]
            }
            export_manifest = {
                'dataset_kind':report['dataset_kind'], 'input_sha256':input_sha,
                'exports':{
                    relative:{
                        'sha256':sha256_file(stage / relative),
                        'rows':conn.execute('SELECT COUNT(*) FROM ' + (
                            'silver_credit_clients' if relative.startswith('data/silver/')
                            else Path(relative).stem)).fetchone()[0]
                    }
                    for relative in report['files_exported']
                }
            }
            manifest_path = stage / 'data' / 'gold' / 'B1-export-manifest.json'
            manifest_path.write_text(json.dumps(export_manifest, ensure_ascii=False, indent=2), encoding='utf-8')
            report['export_manifest']='data/gold/B1-export-manifest.json'
            report_path = stage / 'reports' / 'B1-quality-report.json'
            report_path.parent.mkdir(exist_ok=True)
            report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        finally:
            conn.close()
        # Move staged files after successful checks; no output from a failed import.
        destinations = ['data/bank360.sqlite','data/silver/silver_credit_clients.csv',
                        *[f'data/gold/{v}.csv' for v in VIEWS], 'data/gold/B1-export-manifest.json', 'reports/B1-quality-report.json']
        for rel in destinations:
            dst = root / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            os.replace(stage / rel, dst)
        return report


def validate_database(db_path: Path) -> dict:
    conn = sqlite3.connect(f'file:{Path(db_path).resolve()}?mode=ro', uri=True)
    try:
        checks = _quality_queries(conn)
        overview = conn.execute('SELECT * FROM gold_credit_overview').fetchone()
        return {'status':'PASS', 'integrity_checks':checks, 'client_count':overview[0],
                'default_count':overview[1], 'default_rate_pct':overview[2]}
    finally:
        conn.close()
