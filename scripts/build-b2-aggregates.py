#!/usr/bin/env python3
"""Produce public-safe aggregates from B1's OFFICIAL historical UCI pipeline.

The export intentionally contains no individual client IDs or per-customer rows.
"""
from __future__ import annotations
import csv, hashlib, json, sqlite3, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DB=ROOT/'data/bank360.sqlite'
OUT=ROOT/'powerbi/data'
EXPECTED={'client_count':30000,'default_count':6636,'total_credit_limit_ntd':5024529680}
SEG='''SELECT age_band,credit_limit_band,pay_status_2005_09 AS september_status,
 COUNT(*) AS client_count,SUM(default_next_month) AS default_count,
 SUM(delayed_september_flag) AS delayed_count,
 SUM(limit_bal_ntd) AS total_credit_limit_ntd,SUM(age_years) AS total_age_years
 FROM gold_credit_clients GROUP BY age_band,credit_limit_band,pay_status_2005_09
 ORDER BY age_band,credit_limit_band,september_status'''
MONTH='''SELECT c.age_band,c.credit_limit_band,c.pay_status_2005_09 AS september_status,
 h.period, COUNT(*) AS client_observations,SUM(h.delayed_flag) AS delayed_clients
 FROM gold_credit_clients c JOIN gold_credit_payment_history h
 ON c.credit_client_id=h.credit_client_id
 GROUP BY c.age_band,c.credit_limit_band,c.pay_status_2005_09,h.period
 ORDER BY age_band,credit_limit_band,september_status,period'''
def export(conn,query,path):
    cur=conn.execute(query)
    with path.open('w',encoding='utf-8',newline='') as f:
        w=csv.writer(f);w.writerow([x[0] for x in cur.description]);w.writerows(cur.fetchall())
    return conn.execute('SELECT changes()').fetchone()[0]
def run(db=DB,out=OUT,require_official=True):
    if not Path(db).is_file(): raise RuntimeError('B1 database missing. Run python -m bank360 run --source official')
    conn=sqlite3.connect(f'file:{Path(db).resolve()}?mode=ro',uri=True)
    try:
        meta=conn.execute('SELECT source_id,original_uri,input_sha256,dataset_scope,recorded_rows,currency FROM pipeline_metadata').fetchone()
        if require_official and (meta[0]!='UCI350' or meta[3]!='historical_uci' or meta[4]!=30000 or meta[5]!='NTD' or 'archive.ics.uci.edu' not in meta[1]):
            raise RuntimeError(f'B2 requires source official UCI350. Metadata={meta}')
        main=conn.execute('SELECT client_count,default_count,total_credit_limit_ntd FROM gold_credit_overview').fetchone()
        if require_official and dict(zip(EXPECTED,main))!=EXPECTED:raise RuntimeError(f'Official UCI invariant mismatch: {main}')
        out=Path(out);out.mkdir(parents=True,exist_ok=True)
        seg=out/'uci350_segments.csv';mon=out/'uci350_payment_months.csv'
        export(conn,SEG,seg);export(conn,MONTH,mon)
        def summary(p):
            with p.open(newline='',encoding='utf-8') as f: rows=list(csv.DictReader(f))
            return rows
        a,b=summary(seg),summary(mon)
        if sum(int(r['client_count']) for r in a)!=main[0] or sum(int(r['default_count']) for r in a)!=main[1] or sum(int(r['total_credit_limit_ntd']) for r in a)!=main[2]:raise RuntimeError('Segments do not reconcile to B1')
        if len(set((r['age_band'],r['credit_limit_band'],r['september_status']) for r in a))!=len(a):raise RuntimeError('Duplicate segment key')
        if len(set((r['age_band'],r['credit_limit_band'],r['september_status'],r['period']) for r in b))!=len(b):raise RuntimeError('Duplicate history key')
        months={x['period'] for x in b}
        if months!={f'2005-{i:02d}' for i in range(4,10)}:raise RuntimeError(f'Unexpected months: {months}')
        if any(sum(int(r['client_observations']) for r in b if r['period']==m)!=main[0] for m in months):raise RuntimeError('Monthly denominator mismatch')
        if any(int(r['delayed_clients'])>int(r['client_observations']) for r in b):raise RuntimeError('Delayed count exceeds population')
        if sum(int(r['delayed_clients']) for r in b if r['period']=='2005-09')!=sum(int(r['delayed_count']) for r in a):raise RuntimeError('September delay mismatch')
        report={'project':'BANK 360','phase':'B2','source':'UCI350 historical Taiwan 2005' if require_official else 'synthetic B1 fixture','population':main[0], 'defaults':main[1], 'default_rate_pct':round(100*main[1]/main[0],4), 'credit_limits_ntd':main[2], 'months':sorted(months), 'segment_rows':len(a),'monthly_rows':len(b), 'status':'PASS','source_zip_sha256':meta[2], 'scope':'historical_uci' if require_official else 'synthetic_test','origin_url':meta[1], 'license':'CC BY 4.0; Yeh (2009), DOI 10.24432/C55S3H' if require_official else 'synthetic test data', 'limitation':'Cohort history 2005; credit limits are not outstanding loan balances; not French 2026 data'}
        for path in (seg,mon): report[path.name+'_sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
        (out/'B2-aggregation-manifest.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
        print(json.dumps(report,indent=2,ensure_ascii=False))
        return report
    finally:conn.close()
if __name__=='__main__':
    run()
