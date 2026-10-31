# BANK 360 — R0 → R5 · Risk Analytics Lab

## R0 — Hypothèses et contrats relus (31 octobre 2026)

**Objectif** : une démonstration de bout en bout des compétences Data bancaires, depuis ingestion, qualité et Gold jusqu'à analyses descriptives, évaluations expérimentales et traçabilité. Public : recruteur, analyste, responsable Data. Ce n'est pas une console de surveillance bancaire.

**Sources contrôlées**
- `docs/00-cadrage.md`, `docs/02-kpi.md`, `README.md` et validations B1/B3/B4.
- `web/src/data.ts`, `riskEvidence.ts`, `reportExports.ts`, `CrossAnalysisWorkspace.tsx` et `CrossGovernanceWorkspace.tsx`.
- `reports/b3/B3-metrics.json`, `reports/b4/B4-metrics.json`, déciles et agrégats CSV versionnés.
- Rapport de recherche approfondie BANK 360 fourni dans la conversation (conclusions prises comme recommandations, vérifiées contre les fichiers quand un chiffre ou grain est en jeu).

**Contrats analytiques**
- UCI : historique Taïwan 2005, 30 000 dossiers, 6 636 défauts, agrégats âge × plafond × statut septembre. Taux = Σdéfauts / Σdossiers, jamais moyenne de pourcentages. Référence = portefeuille de tous les âges/plafonds à statut septembre constant s'il est filtré.
- Six retards mensuels : mêmes dossiers répétés avril–septembre 2005 ; les observations mensuelles ne représentent pas de nouveaux clients.
- PaySim : simulation de 6 362 620 transactions et 8 213 fraudes simulées, test chronologique réservé de 100 353 transactions, 1 488 fraudes, 790 alertes, VP 413, FP 377, FN 1075. Les agrégats sont disponibles **par type OU par jour**, pas par couple type × jour.
- B3 : test indépendant stratifié de 6 000 dossiers, pas de test temporel, PR-AUC ≈0,5486, seuil 0,13 illustratif. B4 : test chronologique, PR-AUC ≈0,3651, dérive de prévalence et calibration déficiente. Aucune décision réelle.
- B3/B4 : métriques globales, jamais recalculées par un filtre descriptif, et leurs PR-AUC ne sont pas classées comme des scores comparables.
- Aucune jointure entre UCI et PaySim ; aucune transaction client réelle, aucun déploiement ou certification bancaire.

## R1 — Parcours et navigation

Cinq destinations :
1. **Découvrir** : orientation rapide, explication des deux études, entrées Crédit / Fraude, liens Modèles et Preuves, aucun filtre global.
2. **Crédit historique** : principaux indicateurs UCI, filtres cohorte, matrice de taux âge × plafond, interprétation et six observations mensuelles, groupes/export contextuels.
3. **Fraude simulée** : qualité des alertes, sélection d'un axe (jour ou type), barres de distribution, erreurs de détection, avertissement de calibration, export.
4. **Modèles & performance** : B3 ou B4 sur leur test global, PR-AUC/ROC-AUC/Brier/rappel, déciles, calibration, confusion et limites.
5. **Sources & preuves** : cohérence des sources, provenance, rapports, limites, exports CSV/XLSX.

Nouvelle entrée par défaut `/`, URLs rechargeables `?view=credit|fraud|models|evidence`.
**B5 classique inchangée** via `?classic=1` ; **Aurora X1/X2 archivées** via `?x1=1`.
Cette branche repose sur `feature/x2-aurora-unified` pour l'historique, sans fusion.

## R2 — Crédit

- La matrice de 25 cellules forme la visualisation principale, avec grain UCI et effectifs dans les titres accessibles.
- Un clic sélectionne ou désélectionne `age + limit`, en conservant `status`. Les KPI, la référence et les six séries reçoivent les mêmes filtres.
- Aucun ratio calculé avec un zéro au dénominateur : afficher « — ».
- Les détails sont volontaires (`<details>`) plutôt que tronqués dans un petit dock.
- Export complet des lignes correspondant au segment et de ses six périodes, CSV ou XLSX.

## R3 — Fraude et R4 — Modèles / preuves

- Fraude : bouton d'axe `Jour | Type` qui réinitialise la sélection en changeant d'axe ; les valeurs du test global apparaissent au repos et celles d'un groupe sélectionné sont identifiées comme telles.
- Les métriques B3/B4 de test n'utilisent aucun état de filtre Crédit ni de sélection Fraude.
- Calibration Fraude : valeurs prédites et observées issues des déciles de test, pas une courbe inventée.
- Provenance UCI et PaySim distinctes, rapports B2/B3/B4 déjà publiés dans le dépôt, contrôles décrits comme techniques.
- Exports uniquement depuis les agrégats existants (pas de lignes individuelles fictives).

## R5 — Recette et garde-fous

Tests Playwright sous `web/e2e/guided-risk-lab.spec.ts` :
- Découverte + chemins distincts, `?classic=1`, `?x1=1`.
- Sélection vraie cohorte Crédit, taux et écart, six périodes, export.
- PaySim : J28 et TRANSFER, sélection exclusive, vraies/fausses alertes, proportion correcte.
- B3/B4 : protocole, scores globaux indépendants et avertissement de calibration.
- Preuves : contrôles et exports sans certification.
- 5 vues × 4 formats (1648×928, 1440×810, 1280×720, 390×844), pas de débordement horizontal global ; scroll vertical autorisé.
- Suite de régression historique X1/X2/B5 et tests B1/B3.
- **La validation métier/UX humaine et la recette visuelle restent indépendantes des tests automatisés**.

## Livraison protégée

**PR en brouillon sur une branche nouvelle.** Aucun merge dans `main`, aucune publication. La mise en production ne sera décidée qu'après revue UX, fonctionnelle et tests verts.
