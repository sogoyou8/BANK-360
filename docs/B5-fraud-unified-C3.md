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
