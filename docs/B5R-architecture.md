# BANK 360 — B5.R · Refonte UX/UI et cohérence fonctionnelle

## Contrat et périmètre

Dix pages, regroupées en six sections fixes :

1. Vue d'ensemble — synthèse du risque, du portefeuille et des alertes.
2. Crédit : Portefeuille & segmentation (fusion), Risque de crédit, Paiements & comportements.
3. Fraude : Détection de fraude, Analyse des alertes (uniquement des agrégats).
4. Intelligence : Modèles & performance, Explorateur multi-sources.
5. Qualité : Qualité & traçabilité.
6. Rapports : Rapports & préférences.

## Cohérence métier

Les données UCI350 sont historiques (Taïwan, 2005) ; les données PaySim sont une simulation indépendante. Elles ne sont jamais jointes à un niveau individuel. Dossiers/clients UCI et transactions/fraudes PaySim n'ont pas la même unité d'analyse. Les 790 alertes et leurs 413 vrais positifs portent sur le **test chronologique** de PaySim, pas sur les 6,36 M transactions du corpus complet. Les retards des six mois de 2005 sont des observations répétées, pas 180 000 personnes.

Les pages Crédit partagent uniquement des filtres métier, mais n'ont pas de graphiques redondants : composition → facteurs de risque → dynamique des paiements. Les diagnostics du modèle de crédit permettent d'inspecter les comparaisons, variables importantes, calibration et audit des sous-groupes (cellules supprimées toujours respectées). Fraude distingue test et corpus complet, affiche les compromis volume/erreurs, et la dérive de prévalence.

## Interface et responsive

La vue principale est **mono-écran sur desktop de référence >= 1120 px de large et >= 720 px de haut**, sans scroll global ; la consultation approfondie des tables et longues listes se fait par défilement *dans les panneaux*. Les vues très étroites/mobile passent volontairement en lecture verticale scrollable pour assurer la lisibilité et éviter une réduction illisible. Ne jamais forcer les graphiques à se comprimer sur un téléphone.

Style inspiré des principes Apple Human Interface Guidelines (hiérarchie, matériau et clarté) : commandes flottantes et translucides en premier plan, surfaces analytiques plus mates, relief doux type neumorphism dans les états actifs, contraste accessible, positionnement prévisible, réduction des animations et libellés sobres. Ce n'est pas une interface Apple officielle ni un usage du code propriétaire Apple. Le dock ne change jamais la largeur disponible pour les modules.

## Tests et publication

Les validations se font via `web/scripts/verify.mjs`, `npm run build`, `npm run standalone`, Playwright desktop (10 pages, mono-écran, filtres, modèles, explorateur, export, navigation) et mobile. Pas de déploiement public ni donnée brute commise. La revue visuelle et la validation finale du rendu par l'utilisateur restent requises avant B6.
