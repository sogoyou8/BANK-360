# BANK 360 — B4 : validation finale Fraud Analytics PaySim

**Date :** 28 octobre 2026  
**Statut :** `PASS` pour **l'expérimentation sur données simulées**, pas pour un produit antifraude bancaire réel.  
**Exécution officielle :** https://github.com/sogoyou8/BANK-360/actions/runs/40696747283  
**Développement :** PR #7 (https://github.com/sogoyou8/BANK-360/pull/7), correction de calibration PR #8 (https://github.com/sogoyou8/BANK-360/pull/8).

## Origine et contrôles des données

- Source distribuée : [PaySim — Synthetic Financial Datasets for Fraud Detection](https://www.kaggle.com/datasets/ealaxi/paysim1), simulation de paiement mobile. Lopez-Rojas, Elmir & Axelsson (2016). Licence CC BY-SA 4.0, attribution à conserver.
- Source récupérée depuis l'API Kaggle, aucune donnée de remplacement substituée : `https://www.kaggle.com/api/v1/datasets/download/ealaxi/paysim1`.
- Empreinte SHA256 de l'archive : `f7eef9ffad5cfa64a034143a5c9b30491d189420b273d5ad5723ca40b596613d`.
- **6 362 620 transactions** et **8 213 fraudes simulées** (0,1291 %). 743 étapes horaires ordonnées.
- Types/montants/labels contrôlés, totaux et partitionnements réconciliés ; données UCI B1–B3 conservées séparément.

## Protocole d'évaluation

| Partition temporelle | Étapes | Transactions | Fraudes | Prévalence |
|---|---|---:|---:|---:|
| Entraînement | 1–480 | 6 039 443 | 5 349 | 0,0886 % |
| Validation | 481–610 | 222 824 | 1 376 | 0,6175 % |
| Test réservé | 611–743 | 100 353 | 1 488 | 1,4828 % |

Les tailles ne sont **pas 60/20/20** ; le découpage chronologique respecte les étapes simulées et met en évidence une dérive de prévalence massive. Entraînement : sous-échantillonnage à 5 % des négatifs avec correction des odds, toutes les fraudes positives retenues. Validation et test non sous-échantillonnés.

- Deux modèles : régression logistique et Gradient Boosting (histogrammes). Choix sur la PR-AUC de validation. Gradient Boosting PR-AUC validation **0,2719** ; régression logistique **0,0557**.
- Caractéristiques : **type de transaction** et **log(1+montant)**. Identifiants clients et comptes, soldes avant/après, labels `isFraud`, règle `isFlaggedFraud` et `step` **exclus du modèle**. Cela évite des raccourcis connus du générateur.
- Seuil choisi **sur validation seulement**, pour environ 0,5 % d'alertes de validation, et gelé pour le test. Aucune valeur économique ou décision de fraude réelle ne découle de ce seuil.

## Résultats du test chronologique indépendant

| Indicateur | Valeur |
|---|---:|
| Transactions / fraudes simulées | 100 353 / 1 488 |
| PR-AUC | **0,3651** |
| ROC-AUC | **0,9200** |
| Brier | **0,01255** |
| Alertes | **790** (0,787 % du test) |
| Précision au seuil | **52,28 %** |
| Rappel au seuil | **27,76 %** |
| Vrais positifs | **413** |
| Faux positifs | **377** |
| Faux négatifs | **1 075** |
| Vrais négatifs | **98 488** |

La règle intégrée du simulateur `isFlaggedFraud` signale seulement **8** fraudes test et ne génère aucune fausse alerte. Elle n'entre pas dans les caractéristiques du modèle.

Le décile de score le plus élevé concentre **1 073 fraudes parmi 10 036 transactions**, soit **72,1 % des fraudes de test**. Le décile a une prévalence de 10,69 %. Les déciles montrent une capacité de classement dans cette simulation, pas des probabilités calibrées.

## Avertissement de calibration et de dérive (majeur)

Sur le test, le taux de fraude observé est **1,4828 %**, mais la moyenne des probabilités calculées vaut **0,2459 %** (rapport prédit/observé **0,1658**). Le modèle **sous-estime d'environ 6 fois** la prévalence de cette période. Les performances de classement ne permettent donc **ni de considérer les scores comme des probabilités fiables ni de transférer le modèle à une banque**. Un système opérationnel exigerait des données réelles autorisées, validation prospective, calibration récente, contrôle des coûts, audit d'équité et revue réglementaire.

## Exports, sécurité et validations

- [Rapport JSON complet](../reports/b4/B4-metrics.json) ; [Carte du modèle](../reports/b4/B4-model-card.md) ; exports CSV par type, jour simulé et décile disponibles dans `reports/b4/`.
- **11 tests B4** vérifient schéma, erreurs, séparations, sécurité des variables, correctifs de probabilité, calculs et exports ; exécution CI réussie.
- Scripts de contrôle indépendant sur GitHub Actions : réconciliation des 6 362 620 lignes, des fraudes, des déciles, des alertes, des groupes de transactions, des erreurs et de la prévalence.
- Aucune donnée transactionnelle d'origine, identité de compte, prédiction client, ni modèle compilé n'ont été intégrés au dépôt.
- **Aucun déploiement** : rien sur Power BI Service, Vercel, ni service de fraude.

## Clôture

**B4 terminé pour le volet Data/ML expérimental PaySim** et ses livrables auditables, **non opérationnel**. B5 (cockpit Web) et B6 (finalisation / portfolio) restent à réaliser.
