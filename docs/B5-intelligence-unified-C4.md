# C4 — Intelligence : modèles et explorateur unifiés

## Statut
Branche `feature/b5-c4-intelligence-unified-cockpit` créée depuis **C3** (PR #19 toujours ouverte au début de ce chantier). **PR dépendante : ne pas fusionner dans main avant approbation des pages 03 et 04. Pas de déploiement public ni publication de preview.**

## Contrat visuel
Référence utilisateur : maquette Aurora C4, 1648 × 928. Six sections et six routes, une page Intelligence avec 3 perspectives internes (Vue globale, Modèles, Explorer) et 3 contextes (Crédit, Fraude, Jours simulés). Dock, topbar, 4 KPI, deux panneaux supérieurs et un tableau pleine largeur. Glassmorphism/neumorphism en CSS dédié. Autres cockpits inchangés.

## Matrice cible / vérité / comportement
| Cible | Source réellement disponible | Règle |
|---|---|---|
| Crédit ROC-AUC et PR-AUC test | `reports/b3/B3-metrics.json` | Mesures globales B3 du test, jamais recalculées par filtre |
| Groupes / taux crédit | `powerbi/data/uci350_segments.csv` | 196 groupes ; 30 000 dossiers ; 6 636 défauts ; taux pondéré et effectifs filtrables |
| Déciles crédit | `reports/b3/B3-risk-deciles.csv` | 10 tranches de 600 dossiers, détails agrégés ; pas de jointure avec les segments |
| Comparaison modèles crédit | B3 validation | PR-AUC boosting / logistique / référence ; distincte du test |
| Brier et rappel | B3 test indépendant | Deux tuiles non filtrées |
| Variables | `reports/b3/B3-feature-importance.csv` | Importance par permutation, non causale |
| Calibration | `reports/b3/B3-calibration.csv` | Score moyen, taux observé, ligne idéale ; aucun score individuel |
| Sous-groupes | `reports/b3/B3-subgroup-audit.csv` | Suppressions conservées (notamment 60+) |
| Fraude métriques et déciles | `reports/b4/B4-metrics.json`, `B4-risk-deciles.csv` | Modèle PaySim, test chronologique, aucune décision opérationnelle |
| Fraude par type | `reports/b4/B4-alerts-by-type.csv` | 5 types PaySim ; ne pas inventer d'alertes |
| Jours simulés | `reports/b4/B4-alerts-by-simulated-day.csv` | J25–J30 du test ; pas de dates calendaires |
| Exploration agrégée | CSV ci-dessus | Filtre, tri, recherche, inspection de ligne et export des lignes visibles |
| Séparation des sources | UCI et PaySim | Aucun filtre segment UCI appliqué à métriques B3 test ou modèle PaySim ; aucune jointure fictive |

## Implémentation
- Nouveau `web/src/IntelligenceWorkspace.tsx` et styles `web/src/intelligence-workspace.css`.
- `main.tsx` garde l'alias de navigation depuis l'accueil, le dock Intelligence mène au cockpit unique.
- Les mesures de test restent indépendantes des filtres de la table UCI.
- Focus clavier sur lignes du tableau et boutons, tri accessible et CSV agrégé.

## Vérification
- `cd web && npm run test && npm run build && npm run standalone && npm run test:e2e`
- Captures à 1920×1080, 1672×941, 1648×928, 1440×900, 1366×768, 1280×720 et mobile 390×844.
- Comparaison réelle avec la cible et régressions des pages 01–03 obligatoires.

**Gel et fusion seulement après approbation explicite de l'utilisateur.**


## C4.8 — Ajustements visuels ciblés, validés sur vrai Chromium

Les captures locales du 30 octobre 2026 ont montré :
- Le troisième modèle « Référence » partiellement recouvert par les tuiles Brier/Rappel.
- Des panneaux supérieurs trop courts comparés à la maquette Aurora 1648×928.
- Sept lignes entièrement visibles dans l'explorateur au lieu des neuf demandées.
- Un décalage horizontal de 18–20 px entre le rail de navigation et la référence.

Les correctifs suivants ont été intégrés **exclusivement dans** \`web/src/intelligence-workspace.css\` :
- **C4.8.1** : rangées de diagnostics organisées en grille verticale explicite : légende, trois modèles, puis deux mini-KPI. Suppression du chevauchement et de la superposition avec la note.
- **C4.8.2** : proportions de la grille ajustées ; hauteur récupérée sur l'en-tête, les marges verticales, le topbar et le footer de C4.
- **C4.8.3** : densité de l'explorateur améliorée (filtres, en-tête, lignes, footer), en conservant le scroll **interne** de la table ; au moins neuf lignes entièrement visibles aux tailles desktop de référence, dix à 1648×928 sur la capture Chromium.
- **C4.8.4** : titre légèrement agrandi, dock élargi à 87 px et alignement de la colonne principale à partir de 1500 px uniquement ; changements CSS limités au cockpit Intelligence. Le rendu clair, le mobile et les résolutions desktop courtes restent pris en charge.

## C4.9 — Recette technique et comparaison de référence

Ajouts dans \`web/e2e/intelligence-c4.spec.ts\` : vérification géométrique de l'absence de collision entre modèles, tuiles et pied de panneau aux tailles 1920×1080, 1672×941, 1648×928, 1440×900, 1366×768 et 1280×720 ; rapport hauteur des panneaux ; nombre de lignes **complètement visibles**, sans scroll global ; alignement chiffré du dock, du titre, des perspectives et des KPI à 1648×928.

- **56/56 tests Chromium réussis** après alignement final (GitHub Actions [run 41008376189](https://github.com/sogoyou8/BANK-360/actions/runs/41008376189)).
- Contrôles GitHub Actions B1 et B3 : **réussis** sur le même commit.
- Captures réelles \`intelligence-c48-1648x928.png\`, \`intelligence-c48-1440x900.png\`, \`intelligence-c48-1280x720.png\` et autres tailles dans l'artefact privé \`bank360-b5-browser-evidence\`.
- Comparaison manuelle de la capture Chromium à 1648×928 avec la cible : les écarts visuels majeurs signalés sont corrigés.
- Aucun composant de données, modèle ou calcul B3/B4 modifié. Aucune modification visuelle des cockpits 01–03.
- **PR #20 non fusionnée**, empilée au-dessus de C3 (PR #19) ; **aucun déploiement / publication**.

Le **gel définitif de C4** attend la recette visuelle locale et l'approbation explicite de l'utilisateur.
