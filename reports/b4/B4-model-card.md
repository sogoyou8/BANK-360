# BANK 360 — B4 | Fraud Analytics (PaySim simulated payments)

**Research only.** No real bank fraud data, no operational alarm rule.  Source: [PaySim Kaggle](https://www.kaggle.com/datasets/ealaxi/paysim1), simulated mobile money, CC BY-SA 4.0 attribution required.

**Data checked:** 6,362,620 simulated transfers; 8,213 fraud labels (0.129%). Full chronological split: 6,039,443 train / 222,824 validation / 100,353 holdout test.

**Selected model (validation only):** gradient_boosting, validation PR-AUC 0.27188. Input only transaction type and log transaction amount. Excluded all account identifiers, account balance values and built-in fraud flags. No model leakage from post-transaction balances.

## Test held out — at 0.5% validation alert-volume budget

| Measure | Result |
|---|---:|
| PR-AUC | 0.36511 |
| ROC-AUC | 0.91997 |
| Brier | 0.012550 |
| Alerts | 790 / 100,353 |
| Precision | 52.278% |
| Recall | 27.755% |
| False positive rate | 0.381% |
| True positive | 413 |
| False positive | 377 |
| Missed simulated fraud | 1,075 |
| High-risk decile — observed rate | 10.692% |

**Simulator baseline `isFlaggedFraud`:** recall 0.538% at 8 alarms. This is a comparison with a built-in flag, not a separate deployed fraud-detection product.

## Interpretation

Alerts are simulation-based analytical examples, **never decisions to block payments**. Threshold was fixed from validation on an illustrative 0.5% review-volume budget; review capacity and economic loss are not available and may not transfer. No accounts, transaction-level records or scores are published. The true test prevalence and error count must accompany any PR-AUC claim.

Detailed metadata: [B4-metrics.json](B4-metrics.json). Simulated channel and time aggregates, risk deciles are adjacent CSVs. Re-run source and procedure: `docs/B4-protocole.md`.
