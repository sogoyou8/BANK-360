-- Each query must return 0 for a valid B1 dataset.
SELECT 'duplicate_client_ids' AS check_name, COUNT(*) AS failure_count
FROM (SELECT credit_client_id FROM silver_credit_clients GROUP BY credit_client_id HAVING COUNT(*) > 1)
UNION ALL
SELECT 'missing_target', COUNT(*) FROM silver_credit_clients WHERE default_next_month IS NULL
UNION ALL
SELECT 'missing_primary_key', COUNT(*) FROM silver_credit_clients WHERE credit_client_id IS NULL
UNION ALL
SELECT 'invalid_target', COUNT(*) FROM silver_credit_clients WHERE default_next_month NOT IN (0,1)
UNION ALL
SELECT 'invalid_september_status', COUNT(*) FROM silver_credit_clients WHERE pay_status_2005_09 NOT BETWEEN -2 AND 9
UNION ALL
SELECT 'gold_row_mismatch', ABS((SELECT COUNT(*) FROM gold_credit_clients) - (SELECT COUNT(*) FROM silver_credit_clients))
UNION ALL
SELECT 'payment_history_row_mismatch', ABS((SELECT COUNT(*) FROM gold_credit_payment_history) - 6*(SELECT COUNT(*) FROM silver_credit_clients))
UNION ALL
SELECT 'status_segment_count_mismatch', ABS((SELECT SUM(client_count) FROM gold_credit_status_segments) - (SELECT COUNT(*) FROM silver_credit_clients))
UNION ALL
SELECT 'age_segment_count_mismatch', ABS((SELECT SUM(client_count) FROM gold_credit_age_segments) - (SELECT COUNT(*) FROM silver_credit_clients))
UNION ALL
SELECT 'limit_segment_count_mismatch', ABS((SELECT SUM(client_count) FROM gold_credit_limit_segments) - (SELECT COUNT(*) FROM silver_credit_clients))
UNION ALL
SELECT 'target_count_mismatch', ABS((SELECT default_count FROM gold_credit_overview) - (SELECT SUM(default_next_month) FROM silver_credit_clients))
UNION ALL
SELECT 'credit_limit_sum_mismatch', ABS((SELECT total_credit_limit_ntd FROM gold_credit_overview) - (SELECT SUM(limit_bal_ntd) FROM silver_credit_clients))
UNION ALL
SELECT 'metadata_count_mismatch', ABS((SELECT recorded_rows FROM pipeline_metadata) - (SELECT COUNT(*) FROM silver_credit_clients))
;
