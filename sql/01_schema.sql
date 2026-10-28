-- BANK 360 · B1 credit dataset. SQLite 3, one row per UCI credit-card client.
-- Historical 2005 Taiwan data. Credit LIMIT_BAL is a limit, not loan outstanding.
CREATE TABLE silver_credit_clients (
  credit_client_id INTEGER PRIMARY KEY CHECK(credit_client_id > 0),
  limit_bal_ntd INTEGER NOT NULL CHECK(limit_bal_ntd > 0),
  sex_code INTEGER NOT NULL CHECK(sex_code IN (1,2)),
  education_code INTEGER NOT NULL CHECK(education_code BETWEEN 0 AND 6),
  marriage_code INTEGER NOT NULL CHECK(marriage_code BETWEEN 0 AND 3),
  age_years INTEGER NOT NULL CHECK(age_years BETWEEN 18 AND 110),
  pay_status_2005_09 INTEGER NOT NULL CHECK(pay_status_2005_09 BETWEEN -2 AND 9),
  pay_status_2005_08 INTEGER NOT NULL CHECK(pay_status_2005_08 BETWEEN -2 AND 9),
  pay_status_2005_07 INTEGER NOT NULL CHECK(pay_status_2005_07 BETWEEN -2 AND 9),
  pay_status_2005_06 INTEGER NOT NULL CHECK(pay_status_2005_06 BETWEEN -2 AND 9),
  pay_status_2005_05 INTEGER NOT NULL CHECK(pay_status_2005_05 BETWEEN -2 AND 9),
  pay_status_2005_04 INTEGER NOT NULL CHECK(pay_status_2005_04 BETWEEN -2 AND 9),
  bill_amt_2005_09_ntd INTEGER NOT NULL,
  bill_amt_2005_08_ntd INTEGER NOT NULL,
  bill_amt_2005_07_ntd INTEGER NOT NULL,
  bill_amt_2005_06_ntd INTEGER NOT NULL,
  bill_amt_2005_05_ntd INTEGER NOT NULL,
  bill_amt_2005_04_ntd INTEGER NOT NULL,
  pay_amt_2005_09_ntd INTEGER NOT NULL CHECK(pay_amt_2005_09_ntd >= 0),
  pay_amt_2005_08_ntd INTEGER NOT NULL CHECK(pay_amt_2005_08_ntd >= 0),
  pay_amt_2005_07_ntd INTEGER NOT NULL CHECK(pay_amt_2005_07_ntd >= 0),
  pay_amt_2005_06_ntd INTEGER NOT NULL CHECK(pay_amt_2005_06_ntd >= 0),
  pay_amt_2005_05_ntd INTEGER NOT NULL CHECK(pay_amt_2005_05_ntd >= 0),
  pay_amt_2005_04_ntd INTEGER NOT NULL CHECK(pay_amt_2005_04_ntd >= 0),
  default_next_month INTEGER NOT NULL CHECK(default_next_month IN (0,1))
);
CREATE TABLE pipeline_metadata (
  source_id TEXT NOT NULL,
  source_title TEXT NOT NULL,
  original_uri TEXT NOT NULL,
  input_filename TEXT NOT NULL,
  input_sha256 TEXT NOT NULL,
  source_format TEXT NOT NULL,
  dataset_scope TEXT NOT NULL CHECK(dataset_scope IN ('historical_uci','synthetic_test')),
  recorded_rows INTEGER NOT NULL,
  reference_period TEXT NOT NULL,
  currency TEXT NOT NULL,
  license TEXT NOT NULL
);
