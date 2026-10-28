# BANK 360 — B3 | Model card (non opérationnel)

**Source :** UCI350, Taïwan 2005 · **Statut :** PASS expérimental, aucune décision bancaire.  
**Modèle sélectionné :** `hist_gradient_boosting` sur validation seulement (PR-AUC).  
**Train / validation / test :** 18,000 / 6,000 / 6,000 dossiers, séparation stratifiée.  
**Population :** 30,000 dossiers, 6,636 défauts (22.12%).

## Test indépendant

| Mesure | Modèle | Baseline prévalence |
|---|---:|---:|
| ROC-AUC | 0.7758 | 0.5000 |
| PR-AUC (average precision) | 0.5486 | 0.2212 |
| Brier (plus faible = mieux) | 0.1359 | 0.1723 |
| Précision au seuil de validation (0.13) | 0.315 | 0.221 |
| Rappel au même seuil | 0.852 | 1.000 |

*Intervalle bootstrap descriptif ROC-AUC (test) : [0.762, 0.791].*  
*Top 10 % des scores : 31.4% des défauts du test.*

## Précautions

- **AUC n'est pas une probabilité de défaut**. La calibration et les différences par groupes doivent être examinées.
- Seuil F2 = démonstration, **jamais une règle d'acceptation/refus de prêt**.
- 19 caractéristiques financières, **aucun identifiant, sexe, âge, éducation ou statut marital** dans le modèle ; sexe/âge réservés à l'audit agrégé.
- Risque de décalage historique et géographique élevé. Aucun échantillon récent, aucune validation prospective.
- Aucune prédiction client ni données brutes dans GitHub ; aucun modèle binaire publié.
- Reproduction : `python -m bank360 run --source official`, puis `python -m bank360.b3_risk --db data/bank360.sqlite --out reports/b3`.

Détails machine : `B3-metrics.json` ; calibration : `B3-calibration.csv` ; déciles : `B3-risk-deciles.csv` ; importance de permutation sur validation : `B3-feature-importance.csv` ; audit sexe/âge : `B3-subgroup-audit.csv`.
