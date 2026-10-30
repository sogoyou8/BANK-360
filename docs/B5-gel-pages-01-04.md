# BANK 360 — Gel des pages 01 à 04 (B5)

**Décision du 30 octobre 2026 — VALIDÉ / INTÉGRÉ DANS `main` — AUCUN DÉPLOIEMENT PUBLIC.**

Ce document constitue le registre de clôture visuelle et fonctionnelle des **quatre premiers cockpits** du projet BANK 360. Il remplace les statuts « en cours / PR ouverte » des rapports historiques C3 et C4 pour leur état de fusion, sans effacer l'historique des recettes.

## Architecture B5 après unification

- **01 — Vue d'ensemble : gelée.** Accueil Aurora, quatre indicateurs, graphique de défaut par âge, canaux de fraude, vigilances contextualisées, navigation et interactions existantes.
- **02 — Portefeuille & segmentation : gelée.** Cockpit Crédit unique ; perspectives **Vue globale / Risque / Paiements**, filtres âge/plafond/statut, six panneaux, tableaux et exports agrégés UCI.
- **03 — Détection de fraude & analyse des alertes : gelée.** Cockpit Fraude unique ; perspectives **Vue globale / Détection / Alertes**, graphiques de transactions et alertes, investigation par canal, données et exports agrégés PaySim. Finition **C3.10** validée visuellement ; [PR #19](https://github.com/sogoyou8/BANK-360/pull/19) fusionnée dans `main`, commit `524ff098ff796d176064bd36a06e0ad2ebb6d630`.
- **04 — Modèles & explorateur de données : gelée.** Cockpit Intelligence unique ; perspectives **Vue globale / Modèles / Explorer**, contextes **Crédit / Fraude / Jours simulés**, déciles, diagnostics B3/B4 et exploration agrégée. Finition **C4.13** validée localement ; [PR #20](https://github.com/sogoyou8/BANK-360/pull/20) fusionnée dans `main`, commit `864aa44462bd3377578c92575b47a01d5d7bc6f7`.
- **05 — Qualité des données : hors de ce gel.**
- **06 — Rapports : hors de ce gel.**

L'application est structurée en **6 pages / 6 sections** après unification ; les perspectives des pages 02, 03 et 04 n'ajoutent aucune route.

## Preuves de validation

### Page 04 — recette locale finale

Le dernier diagnostic de l'utilisateur, sur la version C4.13 locale :

| Indicateur | Valeur |
|---|---:|
| Viewport CSS | 1440 × 810 |
| DPR / échelle visuelle | 2 / 1 |
| Hauteur panneau / slot / table | 342 / 231 / 223 px |
| Hauteur en-tête / ligne | 25 / 22 px |
| Lignes de tableau entièrement visibles | **9** |
| Lignes coupées | **0** |
| Hauteur supplémentaire requise pour 9 | **0 px** |
| Scroll global | **0 px** |

L'égalité `25 + (9 × 22) = 223 px` confirme la géométrie locale de l'Explorateur à la résolution mesurée.

### CI après fusion sur main

- PR #19 (C3) : fusion réussie dans `main` ; [tests B5 post-fusion](https://github.com/sogoyou8/BANK-360/actions/runs/41020442137) : **SUCCESS**.
- PR #20 (C4) : fusion réussie dans `main` ; [tests B5 post-fusion](https://github.com/sogoyou8/BANK-360/actions/runs/41020574278) : **64/64 tests Chromium réussis**, compilation, validation du contrat et génération HTML autonome **SUCCESS**.
- [Contrôles B1 post-fusion C4](https://github.com/sogoyou8/BANK-360/actions/runs/41020574084) : **SUCCESS**.
- Les résultats B3 sont présents dans les données historiques de modélisation déjà contrôlées avant la fusion ; aucun nouvel entraînement n'a été demandé par ce gel.

Les workflows GitHub Actions du dépôt ont été inspectés : pas de workflow de publication publique. Les artefacts CI, temporaires, restent privés au flux de travail GitHub ; **aucune opération de déploiement Vercel ou GitHub Pages n'a été lancée dans cette clôture**. Une intégration de déploiement externe hors de ces workflows n'est pas couverte par cet inventaire.

## Contrats de données maintenus

- **Crédit :** UCI Taïwan 2005 ; 30 000 dossiers, 6 636 défauts, 196 groupes d'exploration. Taux agrégés pondérés par effectif.
- **Fraude :** PaySim simulé ; résultats de test chronologique et alertes seulement sous forme agrégée. Aucune transaction ou score individuel fictif.
- **Modèles :** validation et test distingués ; indicateurs B3/B4 jamais recalculés à partir de regroupements incompatibles. Aucune décision bancaire opérationnelle.
- Les jeux UCI et PaySim ne sont pas artificiellement joints.

## Politique de gel

Les pages **01–04** sont stabilisées : ne plus modifier leur géométrie, leurs interactions ou leurs calculs sans nouvelle demande explicite, défaut reproductible ou correction de données confirmée. Toute évolution fait l'objet d'une branche dédiée, d'une PR, de tests et d'une nouvelle recette adaptée.

Le gel **n'implique pas que BANK 360 entier soit terminé** : les pages 05 et 06, ainsi que la finalisation B6 / portfolio, conservent leur propre périmètre.

**État de livraison : source fusionnée dans `main`, tests verts, pas de publication publique.**
