# BANK 360 — B5.R2 · Finition UX/UI

## Objectifs de la recette
- 10 pages / 6 sections inchangées, dock de taille fixe, déploiement interdit sans validation.
- **Layouts par métier** : accueil et risque différenciés ; Portefeuille donne priorité au tableau de groupes ; fraude priorise les jours simulés, alertes et gouvernance les éléments métier ; rapports priorisent les exports.
- **Lisibilité** : repères max, milieu et zéro sur les barres, ligne mensuelle des retards à base zéro (évite l'exagération de faibles écarts), valeurs et unités visibles.
- **Machine Learning** : KPIs du test, comparaisons PR-AUC de validation, calibration taux prédits vs taux observés, audits de sous-groupes et réserves de PaySim. Rien ne suggère une utilisation opérationnelle.
- **Interaction** : recherche explicitement dédiée à l'accès aux pages, contrastes du thème clair renforcés, tables scrollables dans leurs panneaux.
- **Matériaux** : translucence concentrée sur navigation/commandes et relief doux ; graphiques et tableaux sur fond moins transparent, conformément au principe de hiérarchie des matériaux.
- **Responsive** : desktop mono-écran à 1440x900, mobile en défilement vertical avec dock permanent.

## Preuves
Scripts : `web/scripts/verify.mjs`, TypeScript+Vite, Playwright, comparaison des dimensions, interactions crédit/fraude/modèles, vue de calibration, thème clair et aperçu offline. Les traces et captures sont dans les artifacts du workflow B5.

**Limite** : le test de rendu automatisé ne remplace pas la recette visuelle utilisateur sur Windows. Aucune publication ni transfert de données individuelles.
