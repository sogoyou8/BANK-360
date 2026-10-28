# BANK 360 — B2 Power BI

## Artefact principal

`BANK-360/BANK-360.pbip` est le projet Power BI Desktop. Il contient un rapport PBIR natif de 4 pages, un modèle sémantique TMDL, 13 mesures DAX, 3 dimensions partagées et 2 tables agrégées.

**Aucune donnée de client individuel n'est publiée.** Les deux CSV de `powerbi/data/` sont regroupés par tranche d'âge × tranche de limite de crédit × code de paiement; le second les subdivise par mois. Le modèle effectue les taux via `DIVIDE(SUM(numérateur),SUM(dénominateur))` et jamais une moyenne simple de pourcentages par groupe. Les 6 points mensuels sont des *statuts de paiement* pour les mêmes clients, pas des millésimes de défaut.

## Ouvrir dans Power BI Desktop (Windows)

1. Cloner/télécharger ce dépôt, puis ouvrir `powerbi/BANK-360/BANK-360.pbip` dans Power BI Desktop récent avec prise en charge PBIR/TMDL.
2. Si Power BI le demande, autoriser la connexion Web **anonyme** à `https://raw.githubusercontent.com` pour les deux CSV agrégés publics.
3. Cliquer **Actualiser** pour importer les CSV et enregistrer le rapport. Aucun identifiant Fabric ni licence Pro requis pour un rapport local.
4. Vérifier 30 000 dossiers, 6 636 défauts et un taux de défaut de 22,12 % dans la vue générale, puis les sélecteurs âge/limite et la courbe 2005.

La première actualisation requiert Internet ; le rapport n'a pas été ouvert dans Power BI Desktop dans cet environnement Linux. Les fichiers sont testés statiquement et les données par GitHub Actions. **Ne pas déclarer une recette visuelle Power BI Desktop réussie avant ouverture, actualisation, contrôle des interactions et capture d'écran sur Windows.**

## Périmètre

- 01 Vue générale : volume clients, défauts, taux, limite moyenne, segments âge / limite, filtres.
- 02 Risque de crédit : défauts par statut historique de paiement, limite de crédit, sélecteurs.
- 03 Paiements 2005 : évolution du *retard de paiement* pour les mêmes clients d'avril à septembre, avec dénominateurs explicites.
- 04 Qualité et méthode : référence à l'UCI, limites d'usage, contrôles globaux non filtrés.

## Sources

Yeh (2009), **Default of Credit Card Clients**, UCI Machine Learning Repository, DOI [10.24432/C55S3H](https://doi.org/10.24432/C55S3H) ; licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Il s'agit de données de Taïwan en 2005, de limites de crédit en NTD, et d'une étiquette de défaut historique non assimilable au NPL réglementaire. Les agrégats sont issus du pipeline B1 `--source official` (archive d'origine UCI). EBA, PaySim et autres populations bancaires ne sont pas jointes au modèle B2.

Les CSV regroupés ont une licence d'adaptation conforme à la source avec attribution. Le manifeste `powerbi/data/B2-aggregation-manifest.json` garde le SHA256 du ZIP original et des deux exports.

## Actualisation reproductible en GitHub Actions

`BANK 360 — B2 official aggregate data` télécharge l'archive officielle UCI, valide les 30 000 lignes avec B1, produit les deux CSV par agrégation SQL, vérifie les équivalences puis versionne exclusivement les CSV agrégés et leur manifeste. Ce pipeline ne déploie aucun site ni rapport dans Power BI Service. Il peut être relancé via **Actions → B2 official aggregate data → Run workflow**.

## Recette

`python scripts/build-b2-pbip.py` régénère les fichiers sémantiques / visuels de façon déterministe.
`python -m unittest discover -s tests -v` valide les schémas, les références de champs, les formules, les rapports, les mesures, les agrégats et les tests B1.

**Limite :** il n'existe pas ici de moteur Power BI Desktop pour enregistrer un fichier `.pbix` ou vérifier le rendu DAX/visuel interactif natif. Le PBIP livré est à ouvrir dans Desktop pour la recette de rendu, pas un PBIX déjà homologué.

## Résultat réel vérifié (28 octobre 2026)

Les [tests B2](https://github.com/sogoyou8/BANK-360/actions/runs/40662864649) et [l'agrégation officielle](https://github.com/sogoyou8/BANK-360/actions/runs/40662864723) ont réussi (196 groupes de crédit et 1 176 groupes mensuels). Il reste à ouvrir le PBIP dans Power BI Desktop pour vérifier les visuels, les interactions et sauvegarder le modèle. Aucun PBIX vérifié dans Desktop n'a été produit ici.
