# BANK 360 — B4 Fraud Analytics : protocole

**Périmètre :** détection expérimentale d'étiquettes de fraude dans un simulateur de paiement mobile, pas enquête AML, pas règles bancaires françaises, pas évaluation en production. Les données de crédit UCI (B1/B2/B3) ne sont **jamais jointes** à PaySim.

## Source et droits

- **Distribution originale :** [PaySim — Synthetic Financial Datasets for Fraud Detection (Kaggle)](https://www.kaggle.com/datasets/ealaxi/paysim1).
- Auteur du simulateur : Lopez-Rojas, Elmir & Axelsson (2016), *PaySim: A financial mobile money simulator for fraud detection*.
- Licence de la distribution : CC BY-SA 4.0, attribution maintenue. Ne pas commettre le CSV original (~470 Mo).
- Sous étiquette « officiel PaySim », l'outil ne valide que la copie exacte téléchargée sur l'API Kaggle, et exige **6 362 620 transactions**, **8 213 fraudes**. Pas de substitution silencieuse par un jeu synthétique de test.

## Découpage et validation

- Partitions **strictement ordonnées selon les étapes simulées**, non aléatoires : train `step<=480`, validation `481..610`, test `611..744`. Les effectifs exacts sont contrôlés et publiés après ingestion.
- Entraînement seulement : garder tous les positifs et échantillonner 5 % des négatifs, puis **corriger les odds** des probabilités pour revenir à la prévalence naturelle (aucun rééquilibrage en validation/test).
- **Modèles** : régression logistique mise à l'échelle, gradient boosting d'histogrammes. Sélection sur PR-AUC validation, départage par Brier. Test chronologique **jamais utilisé pour sélectionner modèle ou seuil**.
- **Point de fonctionnement illustratif** : seuil calculé pour 0,5 % d'alertes sur la validation. Sur test, mesurer TP, FP, TN, FN, précision, rappel, FPR et alertes. En pratique, il faudrait les coûts d'enquête et d'erreur.
- **Comparateur externe au fit** : `isFlaggedFraud`, règle intégrée au simulateur, jamais prise pour une variable prédictive.
- **Features autorisées** : type d'opération et log(1+montant). Pas de compte, d'identifiant d'opération, ni de soldes `oldbalance*`/`newbalance*` : PaySim génère des égalités de soldes qui peuvent entraîner des performances artificiellement parfaites. Pas de `step` dans les prédicteurs.
- **Qualité** : contrat de colonnes, types, montants positifs, labels 0/1, monotonie de `step`, fraude limitée à deux types, effectifs totaux réconciliés, distincts train/validation/test.
- **Exports** : uniquement des fichiers agrégés : métriques, matrice de confusion, taux par type de transaction, jour simulé, déciles. Aucune ligne transactionnelle, aucun ID de compte, aucun score individuel, aucun modèle compilé.

## Reproduction

`python -m pip install -r requirements-b4.txt`

`python -m bank360.b4_fraud --download --out reports/b4`

`python scripts/validate-b4-report.py`

La connexion Kaggle publique doit fonctionner pour l'import réel ; si elle exige une authentification sur un environnement, **le workflow échoue** sans données d'imitation. Les données et résultats bruts ne sont pas publiés en service Web. La totalité de B4 reste exploratoire.

## Risques de validité

1. **Fraudes synthétiques et comportements imposés par le simulateur** : aucune garantie sur les cartes bancaires ou transferts français.
2. Évolution simulée dans un même jeu, pas de validation hors source ni prospective.
3. Fraude rare : l'accuracy est trompeuse ; privilégier PR-AUC, rappel, précision, alertes et coûts.
4. Répartition des types et comportement des montants potentiellement prédictibles uniquement dans PaySim.
5. Aucune décision de bloquer, accuser, signaler ou refuser une opération ne doit être automatisée depuis cette étude.
