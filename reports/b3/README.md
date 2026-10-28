# B3 — Résultats agrégés

Ce dossier contient les résultats **agrégés, vérifiés et publiés par GitHub Actions** du traitement UCI350 historique du 28 octobre 2026. L'expérience sur les 30 000 dossiers est réussie.

- [`B3-model-card.md`](B3-model-card.md) : interprétation, modèle retenu et comparaison.
- [`B3-metrics.json`](B3-metrics.json) : métriques machine, provenance et protocole.
- CSV par déciles, calibration, importance de permutation et audit agrégé des groupes.

**Interdit :** scores individuels, identifiants de clients, données bancaires brutes, artefact `.joblib` ou `.pkl` déployable. Étude académique non opérationnelle uniquement.

Procédure et limites : [`docs/B3-protocole.md`](../../docs/B3-protocole.md).

**Sélection sur validation :** Histogram Gradient Boosting. **Test :** ROC-AUC 0,7758, PR-AUC 0,5486 (baseline 0,2212), Brier 0,1359 (baseline 0,1723). **Seuil expérimental de 0,13 :** rappel élevé (85,2 %) mais 2 465 faux positifs — non opérationnel. [Compte rendu détaillé](../../docs/B3-validation-finale.md).
