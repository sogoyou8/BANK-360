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

## Statut de vérification GitHub au 28 octobre 2026

- [Test natif PBIP (statique) PASS](https://github.com/sogoyou8/BANK-360/actions/runs/40662864649).
- [Agrégations UCI source officielle PASS](https://github.com/sogoyou8/BANK-360/actions/runs/40662864723) : 196 segments, 1 176 segment-mois.
- **Power BI Desktop non ouvert ici** : la validation graphique et fonctionnelle du PBIP reste explicitement non vérifiée.

## B2 — R2.3 : finition Power BI (28 octobre 2026)

R2.3 réorganise les quatre pages en lecture **KPI → filtres → analyse**, avec deux tableaux plus larges, tri métier des tranches d'âge et de limite de crédit et une page méthodologie allégée. Les calculs, sources et fichiers de données officielles UCI restent inchangés. Voir [`docs/B2-R2.3-recette.md`](../docs/B2-R2.3-recette.md).

Pour utiliser la version corrigée, **fermer Power BI Desktop avant de remplacer les fichiers** et ouvrir le `.pbip` depuis un nouveau dossier. La recette d'affichage native reste à confirmer sur Windows, même si les tests GitHub réussissent. Ne pas réexécuter le générateur après des ajustements manuels dans Power BI Desktop sans sauvegarde : il reconstruira les visuels.

## B2 — R2.4 : notes, périmètre affiché et recette de filtres

R2.4 remonte les notes de bas de page pour qu'elles soient visibles à 65 %, augmente leur lisibilité et distingue explicitement la **base totale UCI (30 000 dossiers)** des KPI modifiés par les filtres ou les clics dans les graphiques. Aucun indicateur ni jeu de données n'est modifié. Les six filtres restent connectés aux dimensions du modèle.

**Validation Desktop encore nécessaire :** d'abord effacer une éventuelle barre sélectionnée, puis **choisir la tranche 18–29 dans le menu déroulant**. Résultats attendus : 9 618 dossiers, 2 197 défauts et 22,8 % ; revenir à « Tout » doit restaurer 30 000 / 6 636. Test similaire pour Limite et Statut, puis les deux contrôles de la page 04 à `1`. Voir [`docs/B2-R2.4-cloture.md`](../docs/B2-R2.4-cloture.md).
