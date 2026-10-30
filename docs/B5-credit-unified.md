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


## C2.2 — Ajustement adaptatif de hauteur (30 octobre 2026)

- **Structure inchangée** : quatre KPI, six panneaux et trois perspectives restent sur un même écran desktop, avec deux rangées de même hauteur. Les couleurs, chiffres, filtres croisés, clics, exports CSV et calculs historiques ne changent pas.
- **Tables** : la table d'âge (5 lignes) et le tableau mensuel (6 lignes, dont septembre) occupent leur espace disponible sans nécessiter de défilement interne dans les tailles desktop couvertes. L'historique répète les mêmes dossiers sur six mois ; ce n'est pas 180 000 clients.
- **Statut** : la dimension « Statut » avec ses 11 codes conserve volontairement le défilement dans le tableau Portefeuille ; elle ne doit pas forcer le défilement de toute l'application.
- **Hauteurs réduites / zoom** : la barre supérieure, le titre, les KPI et les marges se compactent pour les fenêtres desktop de hauteur <= 860 px, puis <= 760 px, sans modification des autres pages.
- **Recette supplémentaire** : tests géométriques sur 1280×720, 1366×768, 1440×800, 1440×900, 1512×820, 1672×860 et 1672×941 ; vérification des 3 perspectives, de la synthèse mensuelle, du non-défilement et de l'accès aux 11 codes de statut. Ces tailles réduites simulent l'effet du zoom sur la surface utile, sans prouver tous les facteurs de zoom natifs de Chrome.
- **Publication** : aucune publication publique. Validation technique CI et revue visuelle locale utilisateur nécessaires avant gel définitif.

## C2.2 — Recette visuelle et gel de la page 02 (30 octobre 2026)

- Capture locale fournie après intégration de la PR #18 et examinée : **les cinq tranches d'âge et les six mois (2005-04 à 2005-09) sont affichés simultanément**, sans défilement interne visible sur ces deux tableaux ; les six panneaux sont alignés sur deux rangées.
- Les quatre KPI, les trois perspectives, les visualisations et le style Aurora restent conformes au périmètre de la page Crédit unifiée.
- **Recette technique : 36/36 tests Chromium réussis** dans GitHub Actions (run `40990709505`), plus validation du build et des contrats de données ; PR #18 fusionnée dans `main`.
- **Décision produit : page 02 figée visuellement** sur le format desktop fourni. Toute réouverture demande une anomalie reproduite ou une évolution explicitement demandée ; le comportement sur tous les matériels et facteurs de zoom n'est pas certifié par une seule capture.
- Les autres pages de B5 restent soumises à leurs propres recettes. Aucun déploiement public ni publication de données client.
