# BANK 360 — Vue d’ensemble : reproduction haute fidélité

Le design de référence fourni a une taille de 1672 × 941 pixels. Seule la page d’accueil est reconstruite, dans web/src/HomeOverview.tsx et web/src/home-reference.css. Les neuf autres pages sont inchangées.

Le dock demeure fixe à six sections. La composition cible comporte quatre KPI, le graphique de défaut par âge (taux + effectif), deux canaux de fraude et trois vigilances. Les données UCI historiques et PaySim simulées ne sont jamais mélangées.

Interactions : clic KPI vers sa page, âge vers Risque filtré, canal de fraude vers Alertes filtrées, vigilance sur calibration vers l’onglet Dérive de fraude, vigilance de provenance vers Qualité.

Les tests Playwright vérifient les dimensions de référence 1672 × 941, la variante 1440 × 900, les débordements, l’absence de contenu coupé, les parcours et le mobile. Les captures sont conservées comme preuves dans GitHub Actions.

Aucune publication Vercel ni GitHub Pages. Revue visuelle utilisateur nécessaire avant homologation.