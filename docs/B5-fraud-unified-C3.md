# C3 — Fraude & alertes unifiées

**Statut : proposition soumise à revue, non fusionnée.** Référence visuelle : image fournie pour C3 (BANK 360, cockpit sombre Aurora). Source de vérité : agrégats PaySim versionnés.

## Architecture

- 7 pages, 6 sections du dock. `Fraude` affiche un seul cockpit : `Vue globale / Détection / Alertes`, sans routes séparées.
- 4 KPI : total simulé (`b4.observed.rows`), alertes test (`b4.holdout_test.alerted`), vrais positifs (`tp`), faux négatifs (`fn`). Les libellés différencient population globale et test.
- 6 panneaux : évolution jour (transactions/alertes, axes distincts), alertes par canal, qualité (donut limité à TP + FP), comparaison journalière, tableau des canaux, détail agrégé jours/canaux.
- Filtres jour / canal / nature de l'alerte ; réinitialisation, exports CSV, sélection et focus clavier ; 3 perspectives qui mettent en avant des panneaux sans masquer les autres.

## Contraintes sur les données

- Export B4 : 6 362 620 transactions simulées, 8 213 fraudes globales, test chronologique 100 353 transactions, 790 alertes = 413 TP + 377 FP, 1 075 FN *hors alertes*, PR-AUC 0,3651.
- `B4-alerts-by-type.csv` : canaux alertés CASH_OUT (304) et TRANSFER (486). Les autres types restent conservés en source, sans alertes inventées.
- `B4-alerts-by-simulated-day.csv` : J25–J30, regroupements par jours **simulés**. Pas de date calendaire.
- Aucun tableau jour × type n'existe. Choisir le jour annule le canal sélectionné, et réciproquement. Lors d'une sélection par jour, les barres par canal conservent le contexte du test complet, explicitement signalé.
- Aucune identité, transaction individuelle, score client, montant, marchand, zone géographique ou attribut inventé. Les mini-barres des KPI sont **une texture décorative non quantitative**.
- Les performances proviennent de l'échantillon PaySim simulé ; aucune affirmation de fraude bancaire réelle, d'évaluation actuelle ou de probabilité calibrée.

## Recette avant fusion

`cd web && npm run test && npm run build && npm run standalone && npm run test:e2e`

Valider les captures Chromium 1672×941, 1440×900, 1366×768 et mobile 390×844, les filtres, CSV, focus clavier, les 7 routes, les jeux B1/B3/B4 et les pages 01/02.

**Gel visuel : uniquement après validation explicite de l'utilisateur.** Aucun déploiement public.


## C3.6 à C3.9 — Finition et contrôle de fidélité (30 octobre 2026)

**C3.6 — Évolution** : trois lectures réelles (Alertes, Transactions, Combinée) sur les six groupes J25–J30. La lecture « Alertes » est initiale : les barres ne sont plus écrasées par les 55 037 transactions du groupe J28. La lecture Combinée affiche deux échelles distinctes et explicites ; toutes les hauteurs partent de zéro. Aucun changement des valeurs ni de leur grain.

**C3.7 — Canaux** : les deux seuls canaux avec alertes (CASH_OUT et TRANSFER) occupent désormais leurs panneaux avec barres plus lisibles et diagnostics réellement disponibles : vrais positifs, faux positifs, précision et rappel calculés par canal. Les autres catégories ne sont pas inventées. Leur sélection est toujours exclusive du jour faute de table croisée jour × type.

**C3.8 — Aurora** : dégradés, bords lumineux, verre, relief intérieur, cartes d'investigation, boutons de sélection et contraste renforcés par une feuille CSS propre à Fraude. Pages 01/02 intactes. Thème clair et mobile préservés.

**C3.9 — Contrôle** : Playwright couvre maintenant les trois modes de lecture, les agrégats de canaux (CASH_OUT : 304 alertes dont 288 TP / 16 FP, précision 94,7 %, rappel 38,7 % ; TRANSFER : 486 alertes dont 125 TP / 361 FP, précision 25,7 %, rappel 16,8 %), le refus de jointure jour × canal, CSV, focus clavier, les perspectives, la palette claire, les sorties mobiles et la géométrie desktop de 1672×941, 1440×900, 1366×768 et 1280×720. Les six lignes J25–J30 tiennent aussi à 1280×720 sans défilement interne. Les captures de ces résolutions et le build local HTML sont stockés comme artifacts privés GitHub Actions.

**Dernière validation technique avant recette utilisateur : 45/45 tests Chromium PASS**, builds et contrôles B1/B3/B5 PASS (run GitHub Actions `41000393347`, commit applicatif `dcf3608eacc88fe418107785dca4f100ab7b664a`). Aucune modification de UCI, du contrat B4 ou des KPI de test.

**Décision : C3.6–C3.9 techniquement terminés, gel et fusion de la PR #19 en attente de la capture et de l'approbation explicite de l'utilisateur. Aucun déploiement.**


## C3.10 — Finition finale du mode graphique et des canaux (30 octobre 2026)

- **Mode initial « Combinée »** : transactions simulées en barres et alertes en courbe, chaque série sur son axe et son échelle réels. Les deux modes alternatifs (« Alertes », « Transactions ») restent sélectionnables, avec des valeurs recalculées depuis les agrégats PaySim inchangés.
- **Lisibilité des canaux CASH_OUT et TRANSFER** : les quatre statistiques (vraies alertes, fausses alertes, précision, rappel) ont des libellés au-dessus de nombres plus lisibles. Des règles de densité ciblées sur le cockpit Fraude préservent la compatibilité avec les fenêtres desktop courtes.
- **Tests** : 46/46 tests Playwright/Chromium réussis, dont nouveau contrôle d'ouverture en mode Combinée, de bascule entre modes, de deux axes distincts, des caractères non tronqués et de la taille de police sur 1672×941, 1440×900, 1366×768, 1280×720 et mobile 390×844. Contrôles B1/B3/B5 au vert : [GitHub Actions run 41001911084](https://github.com/sogoyou8/BANK-360/actions/runs/41001911084).
- **Preuves** : captures Chromium et aperçu HTML autonome dans les artefacts privés de cette exécution. Aucune modification des pages 01/02, des sources de données ou des chiffres de B4.
- **Statut** : PR #19 laissée ouverte et non fusionnée. Pas de publication ni déploiement. Gel de la page 03 uniquement après approbation explicite de la nouvelle capture locale par l'utilisateur.
