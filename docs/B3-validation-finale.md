# BANK 360 — B3 · Procès-verbal de validation sur données officielles

**Date :** 28 octobre 2026 · **Statut :** PASS pour l'expérimentation historique non opérationnelle.  
**Workflow :** https://github.com/sogoyou8/BANK-360/actions/runs/40694443901  
**PR de réalisation :** https://github.com/sogoyou8/BANK-360/pull/6

## Source, préparation et protocole

Le pipeline B1 a importé l'original UCI350 (30 000 clients historiques de Taïwan, dont 6 636 défauts). Empreinte SHA256 de l'archive : `56c885f84457f6680f8438f02bfcdac9579323d8a94465ee5f26e32baa727602`.

- Entraînement : 18 000 dossiers / 3 982 défauts.
- Validation : 6 000 dossiers / 1 327 défauts.
- Test **hors entraînement et choix** : 6 000 dossiers / 1 327 défauts.
- Aucun chevauchement entre les trois ensembles ; graine 42, séparation aléatoire stratifiée, **pas de validation temporelle**.
- 19 prédicteurs financiers disponibles avant l'étiquette du mois suivant. Sexe, âge, état matrimonial, éducation, identifiant et label **exclus des variables du modèle**.
- Référence constante comparée à la régression logistique et au Histogram Gradient Boosting. **Choix sur PR-AUC de validation uniquement**. Seuil optimisé **sur validation uniquement** avec F2 non économique.

## Validation, modèle sélectionné

| Méthode (validation) | ROC-AUC | PR-AUC | Brier |
|---|---:|---:|---:|
| Prévalence constante (référence) | 0,5000 | 0,2212 | 0,1723 |
| Régression logistique | 0,7505 | 0,5139 | 0,1413 |
| **Histogram Gradient Boosting** | **0,7915** | **0,5716** | **0,1318** |

## Performance finale : test indépendant (6 000 dossiers)

| Mesure | Histogram Gradient Boosting | Prévalence constante |
|---|---:|---:|
| ROC-AUC | **0,7758** | 0,5000 |
| PR-AUC / Average Precision | **0,5486** | 0,2212 |
| Brier | **0,1359** | 0,1723 |
| Précision au seuil 0,13 | 31,45 % | 22,12 % |
| Rappel au seuil 0,13 | 85,23 % | 100 % |

**Matrice de confusion au seuil expérimental 0,13 :** VP=1 131, FN=196, FP=2 465, VN=2 208. **Point important :** plus d'une moitié des dossiers qui ne font pas défaut déclenchent une alerte. Le seuil F2 est choisi pour un exercice d'analyse, et **ne doit jamais déclencher une décision de crédit**. La baseline de prévalence au même seuil alerte tous les dossiers.

**Incertitude descriptive :** IC bootstrap stratifié (200 tirages) ROC-AUC [0,7617 ; 0,7905], PR-AUC [0,5250 ; 0,5745], Brier [0,1317 ; 0,1397]. Ces intervalles ne modélisent pas la dérive future ou les incertitudes du dataset source.

**Concentration des défauts :** le décile le plus élevé du score comprend 600 dossiers dont 417 défauts, soit **69,5 %** du décile et **31,4 %** des défauts de test (417/1 327). Ce résultat ne constitue pas une politique bancaire de seuil.

## Explicabilité et audit

- La variable la plus influente selon l'importance de permutation sur **validation** est le statut de remboursement en septembre 2005, avec une baisse moyenne de **0,2253 de PR-AUC** après permutation. Mesure descriptive, pas attribution causale.
- Vérifications agrégées sexe et âge : les taux de rappel et de faux positifs diffèrent d'un groupe à l'autre. Par exemple, pour les tranches 18–29 et 30–39, FPR respectifs 58,2 % et 47,0 % au seuil choisi. Cela justifie une vigilance, sans permettre une conclusion de discrimination ou d'équité.
- Le groupe d'âge 60+ compte 76 personnes sur le test et **ses métriques sensibles sont masquées** par seuil de petite cellule.

## Vérifications d'intégrité et livrables

- Relecture automatique de la source B1 officielle et de sa provenance.
- Test croisé : population = 30 000, défauts = 6 636, partitions = 18k / 6k / 6k, confusion = 6 000.
- Test de non-inclusion des champs sensibles et du label parmi les variables du modèle.
- Tests B1, B2, B3 dans des workflows séparés, tous **PASS**.
- Livrables regroupés dans [reports/b3](../reports/b3/README.md) : métriques JSON, carte du modèle, déciles CSV, calibration CSV, importance par permutation CSV, audit groupes CSV.
- Aucun score individuel exporté sur GitHub, aucune application Web déployée, aucun modèle binaire mis en production.

## Limite de portée

**B3 est terminé pour une démonstration analytique et prédictive sur UCI350 historique.** Il n'existe pas de validation prospective, géographique, temporelle ou réglementaire pour une banque réelle. Les résultats ne prouvent pas de capacité de décision de crédit sur la France d'aujourd'hui. La phase B4 (fraude PaySim), B5 (application) et B6 (portfolio) restent à réaliser.
