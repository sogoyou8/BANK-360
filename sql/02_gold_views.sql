-- All views are isolated to the UCI Taiwan 2005 historical dataset.
CREATE VIEW gold_credit_clients AS
SELECT
  credit_client_id, limit_bal_ntd, age_years, sex_code, education_code, marriage_code,
  pay_status_2005_09, default_next_month,
  CASE WHEN pay_status_2005_09 >= 1 THEN 1 ELSE 0 END AS delayed_september_flag,
  CASE WHEN pay_status_2005_09 = -2 THEN 'No consumption (-2)'
       WHEN pay_status_2005_09 = -1 THEN 'Paid duly (-1)'
       WHEN pay_status_2005_09 = 0 THEN 'Revolving credit (0)'
       ELSE 'Payment delay (>=1)' END AS september_payment_group,
  CASE WHEN age_years < 30 THEN '18-29'
       WHEN age_years < 40 THEN '30-39'
       WHEN age_years < 50 THEN '40-49'
       WHEN age_years < 60 THEN '50-59'
       ELSE '60+' END AS age_band,
  CASE WHEN limit_bal_ntd < 50000 THEN '<50k'
       WHEN limit_bal_ntd < 100000 THEN '50k-99k'
       WHEN limit_bal_ntd < 200000 THEN '100k-199k'
       WHEN limit_bal_ntd < 500000 THEN '200k-499k'
       ELSE '500k+' END AS credit_limit_band,
  pipeline_metadata.source_id AS source_id,
  CASE WHEN pipeline_metadata.dataset_scope='synthetic_test' THEN 'SYNTHETIC TEST — NOT REAL' ELSE 'Taiwan, 2005' END AS data_scope,
  pipeline_metadata.currency AS currency
FROM silver_credit_clients CROSS JOIN pipeline_metadata;

CREATE VIEW gold_credit_overview AS
SELECT COUNT(*) AS client_count,
       SUM(default_next_month) AS default_count,
       ROUND(100.0 * AVG(default_next_month), 4) AS default_rate_pct,
       SUM(delayed_september_flag) AS delayed_september_count,
       ROUND(100.0 * AVG(delayed_september_flag), 4) AS delayed_september_rate_pct,
       SUM(limit_bal_ntd) AS total_credit_limit_ntd,
       ROUND(AVG(limit_bal_ntd), 2) AS avg_credit_limit_ntd,
       ROUND(AVG(age_years), 2) AS avg_age_years,
       MIN(source_id) AS source_id, MIN(data_scope) AS data_scope, MIN(currency) AS currency
FROM gold_credit_clients;

CREATE VIEW gold_credit_status_segments AS
SELECT pay_status_2005_09 AS september_payment_status,
       september_payment_group,
       COUNT(*) AS client_count,
       SUM(default_next_month) AS default_count,
       ROUND(100.0 * AVG(default_next_month), 4) AS default_rate_pct,
       SUM(limit_bal_ntd) AS total_credit_limit_ntd,
       MIN(source_id) AS source_id, MIN(data_scope) AS data_scope
FROM gold_credit_clients
GROUP BY pay_status_2005_09, september_payment_group;

CREATE VIEW gold_credit_age_segments AS
SELECT age_band, COUNT(*) AS client_count,
       SUM(default_next_month) AS default_count,
       ROUND(100.0 * AVG(default_next_month), 4) AS default_rate_pct,
       SUM(limit_bal_ntd) AS total_credit_limit_ntd,
       MIN(source_id) AS source_id, MIN(data_scope) AS data_scope
FROM gold_credit_clients GROUP BY age_band;

CREATE VIEW gold_credit_limit_segments AS
SELECT credit_limit_band, COUNT(*) AS client_count,
       SUM(default_next_month) AS default_count,
       ROUND(100.0 * AVG(default_next_month), 4) AS default_rate_pct,
       SUM(limit_bal_ntd) AS total_credit_limit_ntd,
       MIN(source_id) AS source_id, MIN(data_scope) AS data_scope
FROM gold_credit_clients GROUP BY credit_limit_band;

CREATE VIEW gold_credit_payment_history AS
SELECT credit_client_id, '2005-09' AS period, 1 AS month_sort, pay_status_2005_09 AS payment_status,
       CASE WHEN pay_status_2005_09 >= 1 THEN 1 ELSE 0 END AS delayed_flag FROM silver_credit_clients
UNION ALL
SELECT credit_client_id, '2005-08', 2, pay_status_2005_08,
       CASE WHEN pay_status_2005_08 >= 1 THEN 1 ELSE 0 END FROM silver_credit_clients
UNION ALL
SELECT credit_client_id, '2005-07', 3, pay_status_2005_07,
       CASE WHEN pay_status_2005_07 >= 1 THEN 1 ELSE 0 END FROM silver_credit_clients
UNION ALL
SELECT credit_client_id, '2005-06', 4, pay_status_2005_06,
       CASE WHEN pay_status_2005_06 >= 1 THEN 1 ELSE 0 END FROM silver_credit_clients
UNION ALL
SELECT credit_client_id, '2005-05', 5, pay_status_2005_05,
       CASE WHEN pay_status_2005_05 >= 1 THEN 1 ELSE 0 END FROM silver_credit_clients
UNION ALL
SELECT credit_client_id, '2005-04', 6, pay_status_2005_04,
       CASE WHEN pay_status_2005_04 >= 1 THEN 1 ELSE 0 END FROM silver_credit_clients;

CREATE VIEW gold_credit_monthly_status AS
SELECT period, month_sort, COUNT(*) AS client_observations,
       SUM(delayed_flag) AS delayed_clients,
       ROUND(100.0 * AVG(delayed_flag), 4) AS delayed_rate_pct,
       (SELECT source_id FROM pipeline_metadata) AS source_id,
       (SELECT CASE WHEN dataset_scope='synthetic_test' THEN 'SYNTHETIC TEST — NOT REAL' ELSE 'Taiwan, 2005' END FROM pipeline_metadata) AS data_scope
FROM gold_credit_payment_history GROUP BY period, month_sort;
