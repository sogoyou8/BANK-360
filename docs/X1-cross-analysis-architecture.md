# BANK 360 — X1.0 + X1.1 — Cartographie et architecture en deux espaces

**Statut : chantier expérimental sur branche dédiée. `main` et les six pages B5 gelées ne sont pas modifiés. Aucun déploiement ni fusion autorisé sans validation locale.**

## Objectif et décision de structure

Remplacer la navigation répétitive parmi six cockpits par **deux espaces principaux** :

1. **Analyse 360** : lecture conjointe (et non jointure) des deux sources indépendantes UCI et PaySim, exploration immédiate des sous-populations compatibles, KPI, graphiques, tableau de détails et contexte des modèles.
2. **Gouvernance & preuves** : qualité, traçabilité, méthodologies, véritables exports CSV/XLSX, réglages existants. Accès aux preuves depuis le cockpit d'analyse.

La version initiale X1 est **activable sans perturber la version classique** (lien « Analyse 360 » dans la topbar / paramètre `?x1=1`). Pendant les tests, les six pages historiques et leurs parcours restent accessibles. En mode X1, le dock principal propose seulement deux destinations ; un retour à la version classique est possible. La bascule par défaut aura lieu **seulement après validation**, avec adaptation de la recette historique.

## X1.0 — Contrats de croisement et grains des données

| Source | Grain | Dimensions utilisables ensemble | Mesures dérivables | Restrictions |
|---|---|---|---|---|
| UCI `uci350_segments.csv` | Agrégat `age_band × credit_limit_band × september_status` | Âge, plafond, statut septembre | Dossiers, défauts, taux pondéré, plafond moyen | Aucun dossier nominatif ; seuls les groupes disponibles |
| UCI `uci350_payment_months.csv` | Mêmes dimensions + mois `2005-04..09` | Tous les filtres UCI, mois d'observation | Observations, retards, taux pondéré (somme numérateur / somme dénominateur) | 6 observations répétées des mêmes 30 000 dossiers, pas 180 000 clients |
| PaySim `B4-alerts-by-type.csv` | Type d'opération, jeu de test | Type d'opération | Transactions, alertes, vraies/fausses, fraudes manquées, précision, rappel | Pas de co-dimension `jour` présente |
| PaySim `B4-alerts-by-simulated-day.csv` | Jour simulé (J25–J30), jeu de test | Jour simulé | Transactions, alertes, vraies/fausses, manquées | Pas de co-dimension `type` présente |
| B3 `B3-risk-deciles.csv` / métriques | Décile / split de test global | Sélection de décile seulement | Taux observé par décile, ROC/PR-AUC de split | Impossible de filtrer ces métriques par âge/plafond, aucune clé de jointure avec groupes |
| B4 `B4-risk-deciles.csv` / métriques | Décile / split de test global | Sélection de décile seulement | Taux observé par décile, PR-AUC global | Impossible de relier décile à type/jour |
| UCI × PaySim | **Aucune clé d'entité commune** | **Aucune** | Comparaison indépendante côte à côte | **Jamais de corrélation client UCI ↔ transaction PaySim ; aucune colonne commune dans un faux tableau joint.** |

### Principes de synchronisation

- Un **état Crédit partagé** (âge, plafond, statut) alimente simultanément les KPI UCI, les cinq tranches d'âge, les plafonds, l'évolution mensuelle et les lignes de tableau/export compatibles.
- Cliquer une barre **âge** ou **plafond** change ce même filtre. Un second clic retire la restriction ; bouton « Réinitialiser » retire toutes les restrictions de la source.
- Un **état Fraude séparé** propose un unique axe de découpe : type **ou** jour simulé. Choisir un jour annule le type et inversement ; les mesures du test global gardent leur libellé « Test global ».
- En contexte de type, la vue par jour reste globale et n'est pas présentée comme découpée par type ; inversement en contexte de jour.
- Aucun mélange des dénominateurs, aucune moyenne simple de taux de sous-groupes. Quand un segment est vide, afficher « Aucun résultat » et éviter les pourcentages sans dénominateur.
- Les métriques B3/B4 sont **fixées à leur jeu de test** ; il est interdit d'afficher une PR-AUC « recalculée » sous les filtres d'agrégats.

## X1.1 — Composition retenue

### Page 01 — Analyse 360

1. En-tête compact et filtres Crédit / Fraude simultanément visibles.
2. Résumé de deux populations indépendantes avec libellés UCI historique et PaySim simulé.
3. **Panneau Crédit** : KPI calculés sur le sous-ensemble, histogramme des taux de défaut par âge, plafonds, tendance mensuelle des retards ; interactions sur les tranches.
4. **Panneau Fraude** : KPI sur l'axe sélectionné, barres par type, évolution des alertes par jour simulé ; indicateurs fixes de modèle explicitement « Test global ».
5. **Inspecteur de données** au bas : tableau des groupes UCI (ou agrégats PaySim) avec export réel, lecture des dimensions et note d'absence de jointure.
6. Les graphes et le tableau utilisent les mêmes agrégats et les mêmes sélections, sans navigation supplémentaire.

### Page 02 — Gouvernance & preuves

Bandeau `reconcile()`, quatre contrôles de cohérence avec leurs nombres et sources, cartes de provenance UCI/PaySim, trois méthodologies (B2/B3/B4), trois exports CSV/XLSX réels, apparence et remise à zéro des filtres. Un seul écran Aurora sur desktop, scroll mobile accepté.

## X1.2 — Cible Aurora

L'image cible est une **maquette de disposition**, non une source de données : ses valeurs graphiques et tableaux sont fictifs et **ne doivent jamais être reprises dans l'implémentation**. Couleurs : bleu nuit, surfaces vitrées, contours fins cyan/violet/menthe, états actifs lisibles, dock 2 destinations, présentation compacte. **Séparer visuellement UCI et PaySim** et éviter les lignes de tableau comportant simultanément des métriques provenant des deux sources.

## X1.3 — Contrat technique

- Nouveaux composants `CrossAnalysisWorkspace.tsx` et `CrossGovernanceWorkspace.tsx`, CSS préfixé `x1-`, sans modifier les composants classiques gelés.
- Brancher les nouveaux composants dans `main.tsx` via deux nouvelles destinations visibles dans le mode X1.
- Réutiliser `data.ts` pour l'agrégation et `reportExports.ts` pour les CSV/XLSX, ne pas dupliquer les données.
- Les filtres Crédit existants sont partagés avec la vue classique ; ceux de Fraude (type/jour) également.
- Les exports répondent aux filtres de leur source ; les méthodologies restent documentées.
- Versions sous source control et tests navigateur, aucune publication.

## X1.4 — Conditions de recette

- Cohérence des numérateurs/dénominateurs ; année et grain explicités.
- Scénarios clic âge → KPI + retards mensuels + lignes filtrés ; clic plafond → intersection réelle ; remise à zéro complète.
- Clic type puis jour PaySim → filtres exclusifs ; pas de faux croisement.
- Invariabilité des métriques B3/B4 de test global.
- Export CSV/XLSX inspectable, adapté aux seules lignes filtrées.
- Vue desktop 1648×928 / 1440×810 / 1366×768, mobile 390×844 ; pas de chevauchement, pas de scroll global desktop si lisibilité conservable.
- Anciennes pages B5 inchangées dans leur code ; campagne de régression historique.
- Captures réelles Chromium à comparer à la cible ; correction avant revue locale.
- Validation humaine préalable à tout remplacement de la navigation classique / merge.
