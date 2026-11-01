# BANK 360 — M2 · Composition et occupation utile

## Origine
La revue de la vidéo M1 du 31 octobre 2026 a confirmé cinq vues fonctionnelles mono-écran mais révélé des zones de faible densité utile : Accueil (espace vide entre description et chiffres), Crédit (matrice placée en haut d'un grand espace), Fraude (panneau latéral trop peu informatif), Preuves (cadres séparés trop présents). Modèles a été jugée la vue la plus équilibrée : elle ne nécessite pas de refonte.

## Contrat de M2

**Une vue = un écran sur ordinateur**, pour 1648×928, 1440×810 et 1280×720 ; mobile garde le défilement. Ne pas fusionner UCI et PaySim, ni inventer des mesures ou des relations inter-sources.

1. **Accueil** — Répartir régulièrement titre de l'étude, description, population, indicateurs et CTA dans les cartes. Réduire l'espace mort par la composition CSS, pas en ajoutant des KPI décoratifs.
2. **Crédit** — Conserver la matrice réelle âge × plafond × statut UCI et lui allouer la hauteur du panneau ; afficher les 25 cellules et les 6 mois complets, sans croissance horizontale/verticale hors écran. Les cellules gardent les vrais taux pondérés de leurs groupes.
3. **Fraude** — Ajouter un petit graphique de composition **vraies alertes / fausses alertes** basé exclusivement sur `current.tp` et `current.fp`, soit 413/377 pour les 790 alertes du test au repos. Recalculer visuellement lors d'une sélection de jour ou type. Cette représentation ne se substitue pas aux KPI précision/rappel, et le cas zéro alerte affiche « — » au lieu de NaN.
4. **Preuves** — Organiser les contrôles, sources et limites par séparateurs fins dans une surface commune, sans supprimer les rapports ni les exports.
5. **Modèles** — Préserver la disposition M1 et les métriques B3/B4 globales, testées sur leurs partitions respectives.

## Code
- `web/src/GuidedRiskLab.tsx` : composant de répartition PaySim et import M2.
- `web/src/guided-m2-composition.css` : couche de mise en page spécifique, après R0–R5 et M1.
- `web/e2e/guided-m2-composition.spec.ts` : occupation des cellules, vraie part VP/FP, surface de preuve et mobile.
- Aucune transformation de `web/src/data.ts`, ni modification des contrats B3/B4, ni de la version classique B5.

## Recette
- Compiler et exécuter les tests de calcul B1/B3.
- Rejouer les tests navigateur R0–R5, M1 et M2.
- Contrôler le taux de remplissage de la matrice Crédit aux trois résolutions, la part VP/FP correcte au repos et après J28, les téléchargements Preuves, et le scroll mobile.
- Faire une revue esthétique réelle des captures du navigateur avant validation humaine.

**Publication protégée** : PR #25 en brouillon, aucune fusion de main, aucun déploiement.
