# B0 — Plan de livraison et critères de sortie

| Phase | Livrables | Validation de sortie |
|---|---|---|
| B0 | Charte, catalogue sources, dictionnaire KPI, architecture | 3 domaines séparés ; hypothèses et licences visibles. |
| B1 | Pipeline UCI reproductible + SQL/DuckDB + tests | Ingestion déterministe, contrôles qualité et résultats auditables. |
| B2 | Power BI Risque + indicateurs sectoriels EBA selon disponibilité | Mesures DAX réconciliées avec SQL, filtres et sources affichés. |
| B3 | EDA et modèles de défaut historiques | Baseline, séparation des jeux, évaluation et limites explicites. |
| B4 | Pipeline PaySim, modèles/anomalies, alertes | Mesures precision/recall/PR-AUC, tests contre fuite de données. |
| B5 | BANK 360 Web, navigation et explorations | UI utilisable desktop/mobile, données traçables, tests de non-régression. |
| B6 | Documentation, démonstration et portfolio | Validation finale et autorisation explicite avant publication. |

## Premier lot technique recommandé (B1.1)

1. Télécharger **UCI 350** depuis la source officielle.
2. Produire profilage (dimensions, types, duplicats, nulls, plages, dictionnaire).
3. Générer un modèle SQL **client UCI** et un agrégat par niveau de retard.
4. Contrôler la cohérence entre les résultats Python et SQL.
5. Préparer 1 export de travail Power BI, sans résultats de démonstration inventés.

## Risques projet

- **Données historiques** : ne pas extrapoler à la France 2026.
- **Sources hétérogènes** : afficher des univers de données séparés.
- **Données sensibles/biais** : documentation de fairness, pas de moteur de décision réelle.
- **Licences et volumes** : respecter attribution et conserver la volumétrie brute hors Git.
- **Intégration UI** : ne pas remplacer la rigueur BI par un simple mockup esthétique.
