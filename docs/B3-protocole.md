# B3 — Credit Risk Analytics · protocole de recherche

**Périmètre :** classification binaire du défaut de paiement **du mois suivant**, à partir de variables financières déjà observées entre avril et septembre 2005 (UCI Default of Credit Card Clients). Ce n'est **pas** un score réglementaire ni un outil pour accepter/refuser des crédits, et ne doit jamais être mis en production ou réutilisé sur des données personnelles réelles.

## Source et lignée

Pipeline B1 → `silver_credit_clients` (1 ligne par client). Seul l'original historique **UCI350 officiel** est admissible pour les résultats publiés; le SHA256 de sa source, les 30 000 clients et les 6 636 défauts sont vérifiés. Les CSV agrégés de B2 ne sont pas appropriés pour un modèle individuel, car l'agrégation détruit les jointures au niveau dossier. **Aucune donnée client, prédiction individuelle ou modèle binaire n'est commise sur GitHub.**

Source : UCI Machine Learning Repository, Yeh (2009), DOI 10.24432/C55S3H, licence CC BY 4.0. Devise NTD, Taïwan, millésime 2005.

## Variables et risques de fuite

19 variables financières disponibles **avant** le défaut du mois suivant : limite de crédit, 6 états de remboursement, 6 montants de facturation et 6 paiements. Transformations signées `log1p` sur les montants, train-only standardisation/median imputation via `Pipeline` pour la régression logistique. Aucun champ de label, identifiant, sexe, âge, éducation ou état marital parmi les prédicteurs. Sexe et âge sont conservés **exclusivement pour audit agrégé** et ne sont jamais transmis à `.fit()`.

Les périodes mensuelles sont des observations de la **même cohorte**, donc pas d'entraînement sur avril et de test sur septembre : cela créerait une fuite inter-individus. Séparation aléatoire stratifiée unique 60 % / 20 % / 20 % au **grain client** (seed 42), avec impossibilité de valider la robustesse temporelle sur cette base.

## Modèles et garde-fous

- Référence : probabilité constante égale à la prévalence observée sur train (`DummyClassifier`).
- Candidats : régression logistique normalisée et Histogram Gradient Boosting CPU.
- Choix : **PR-AUC** (average precision) sur validation; Brier comme départage. Jamais de sélection selon les résultats sur test.
- Seuil illustratif : maximise **F2 sur validation**, puis fixé pour le test (ce n'est **pas** un seuil de crédit). Le taux réel de défaut est le point de comparaison pertinent pour la PR-AUC.
- Test indépendant : PR-AUC, ROC-AUC, Brier, log-loss, matrice de confusion, précision, rappel, F2, top décile de capture. Intervalle bootstrap stratifié descriptif (200 répétitions) pour 3 métriques; **ne mesure pas le décalage historique/géographique**.
- Calibration : dix classes de probabilité, leurs moyennes et leurs taux observés; l'adéquation de ces valeurs doit être vérifiée avant toute interprétation probabiliste.
- Audit : recall, FPR, prévalence observée et score moyen selon sexe et tranche d'âge, **sans usage en entraînement**. Cellules petites supprimées (n < 100, positifs < 30 ou négatifs < 30). Différences descriptives ≠ preuve d'équité, de causalité ou de conformité réglementaire.
- Importance : permutation sur **validation uniquement** (PR-AUC). Perturbations corrélées et proxys empêchent une lecture causale des importances.

## Éthique et restriction de réutilisation

Une application de sélection ou d'évaluation de solvabilité réelle pourrait être régulée comme **à haut risque** en Europe; le projet ne dispose ni de validation prospective ni des éléments nécessaires pour un usage réel. Aucune inférence sur la solvabilité d'une personne réelle; aucune recommandation d'octroi de crédit. Les données de 2005 ne prouvent rien sur les emprunteurs français actuels. Même lorsque les attributs sensibles sont exclus, des variables financières peuvent être des **proxys**.

## Exécution et sorties

En local (à partir du dépôt complet) :

```powershell
python -m pip install -r requirements-uci.txt -r requirements-ml.txt
python -m bank360 run --source official
python -m bank360.b3_risk --db data/bank360.sqlite --out reports/b3
python -m unittest tests.test_b3 -v
```

Ou sans aucune commande utilisateur, le workflow **BANK 360 — B3 official UCI experiment** exécute le même pipeline sur GitHub Actions et commit uniquement des **résultats agrégés** dans `reports/b3/`. Le workflow refuse les données synthétiques pour la recette officielle.

Fichiers : `B3-metrics.json`, `B3-model-card.md`, `B3-risk-deciles.csv`, `B3-calibration.csv`, `B3-subgroup-audit.csv`, `B3-feature-importance.csv`.
