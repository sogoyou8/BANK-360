# BANK 360 — B5 · Crédit unifié (vue 02)

## Architecture utilisateur

La section **Crédit** devient **une seule page** : **Portefeuille & segmentation**, avec trois perspectives internes **Vue globale**, **Risque**, **Paiements**. L'application comporte désormais **8 pages réparties en 6 sections** : accueil ; Crédit ; deux vues Fraude ; deux vues Intelligence ; Qualité ; Rapports.

Les trois perspectives ne sont **pas** des routes distinctes. Elles conservent les filtres, les graphiques, les KPI et les sélections. Les vues mettent l'accent sur une analyse différente sans faire disparaître les autres modules ni dupliquer les mêmes KPI dans trois pages.

## Données et jointures

L'unique jeu utilisé dans le cockpit Crédit provient des agrégats UCI 2005 de Taïwan : 196 groupes au grain âge × plafond × statut septembre, et 1176 groupes mensuels sur les mêmes clés. 30 000 dossiers, 6 636 défauts, six mois, 180 000 observations répétées. Les 180 000 observations **ne sont pas 180 000 personnes**.

Les données ont été rapprochées seulement par les clés d'agrégat (`age_band`, `credit_limit_band`, `september_status`) ; aucune jointure bancaire individuelle ni corrélation causale n'est prétendue. Les taux sont calculés à partir des numérateurs et dénominateurs **agrégés**. Un filtre âge, plafond ou code septembre s'applique au numérateur et dénominateur des KPI et aux six mois. Lorsqu'on sélectionne une **catégorie** de statut septembre, la population se restreint à la catégorie, puis les observations mensuelles de cette même cohorte sont agrégées sur les six mois.

**Code UCI** : −1 = à jour, 1–8 = mois de retard ; −2 et 0 sont présentés comme codes non précisés par la documentation UCI utilisée. On n'invente pas de signification de remboursement. Les quatre catégories septembre totalisent 30 000 dossiers : −2 = 2759 ; −1 = 5686 ; 0 = 14737 ; 1–8 = 6818.

## Les six modules et leurs comportements

- **Âge** : taux de défaut ou nombre de dossiers. Clic sur une barre pour filtrer l'âge ; second clic pour retirer le filtre.
- **Retards mensuels** : six mois d'avril à septembre, axe partant de zéro, valeurs exactes recalculées sur la population sélectionnée. Clic sur un mois = inspection et surbrillance seulement ; **ne réduit pas la population**.
- **Détail du portefeuille** : tableau sur âge, plafond ou statut, tri et recherche, export CSV de groupes uniquement ; clic sur une ligne pour appliquer le filtre de sa dimension.
- **Plafond** : taux de défaut ou dossiers. Clic pour appliquer un filtre croisé du plafond, avec effectifs affichés.
- **Statut de septembre** : diagramme à quatre catégories, sélection de catégorie, ouverture de la liste des 11 codes et clic sur un code pour filtrer. La ventilation part des données UCI officielles, pas de pourcentages fabriqués.
- **Détail mensuel** : six périodes, observations, retards, taux, sélection visuelle du mois et export agrégé.

En absence de dossiers, les taux non définis s'affichent « — » et les graphiques montrent l'état vide, pas 0 % fictif.

## Contrôles

`web/scripts/verify.mjs`, `npm run build`, `npm run standalone`, Playwright desktop 1440 × 900 et 1672 × 941, mobile 390 × 844, filtres croisés, réconciliation mois/dossiers, export, navigation depuis l'accueil, autres univers Fraude/Intelligence inchangés. Captures disponibles dans les artifacts GitHub Actions. **Aucun déploiement public avant inspection sur le PC et validation explicite.**


## C2.1 — Finition de la densité et de la fidélité graphique
- Les cinq tranches d'âge du détail portefeuille et les six mois du tableau mensuel sont visibles simultanément sur 1440 × 900 et 1672 × 941, sans scrollbar intérieure ; recherche, tri et export restent actifs.
- Les quatre cartes KPI retrouvent une action fléchée, avec navigation **dans les trois perspectives de la même page** plutôt que vers des routes supplémentaires.
- L'axe âge affiche quatre repères alignés sur la valeur maximum réelle, la courbe des retards retrouve sa profondeur et sa grille, le diagramme des statuts utilise un relief neumorphic maîtrisé.
- Même identité Aurora, dock fixe, huit pages / six sections, mêmes sources UCI et mêmes calculs. Aucun déploiement.
