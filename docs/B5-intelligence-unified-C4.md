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


## C4.10 — Explorateur : lignes complètes et géométrie vérifiée

**Objectif :** éviter la dernière ligne partiellement coupée dans la fenêtre interne du tableau, y compris après redimensionnement, filtre, changement de contexte ou défilement jusqu'en bas.

**Correctif ciblé :**
- \`IntelligenceWorkspace.tsx\` : un conteneur \`.iw-table-slot\` conserve la flexibilité verticale du panneau. Un \`ResizeObserver\` mesure le conteneur, l'en-tête et la hauteur effective d'une ligne, puis dimensionne la fenêtre \`.iw-table-window\` à un nombre entier de lignes. Il reste moins d'une ligne de réserve, sans changer les dimensions des caractères ni la hauteur des autres panneaux.
- \`intelligence-workspace.css\` : la fenêtre conserve le défilement interne, un en-tête sticky et un positionnement du scroll aligné sur les lignes. Le footer demeure visible et les styles restent propres à C4.
- **Aucune source UCI/PaySim, aucun indicateur, calcul, graphique ou composant des pages 01–03 n'a été modifié.**

**Recette étendue :** deux nouveaux tests dans \`web/e2e/intelligence-c4.spec.ts\` vérifient, à 1920×1080, 1672×941, 1648×928, 1440×900, 1366×768, 1280×720 et 390×844, les lignes complètes à l'ouverture, l'absence de ligne tronquée en bas au scroll maximal, l'absence de débordement horizontal, les filtres et changements de contexte Crédit/Fraude/Jours simulés, et la préservation du cockpit mono-écran desktop. Les nouvelles captures portent le nom \`intelligence-c410-[largeur]x[hauteur].png\` et sont conservées dans l'artefact GitHub Actions \`bank360-b5-browser-evidence\`.

**Résultat confirmé : 58/58 tests Chromium réussis**, plus les workflows B1 et B3 réussis, [run GitHub Actions 41010207008](https://github.com/sogoyou8/BANK-360/actions/runs/41010207008). Le premier passage C4.10 avait révélé un décalage fractionnaire au scroll maximal (57/58) ; une correction du calcul de hauteur a abouti à 58/58.

**Statut :** C4.10 terminé techniquement. La PR #20 reste ouverte, empilée sur la branche C3 / PR #19 ; aucune fusion ni aucun déploiement. Gel uniquement après approbation visuelle locale explicite.


## C4.11 — Mesurer le viewport réel avant tout nouvel ajustement CSS

**Contexte.** Sur les deux captures de revue, l'image locale mesure 2048×1152 pixels, contre 1672×941 pour la cible. Ces dimensions physiques ne révèlent pas à elles seules la taille du viewport CSS, ni le zoom du navigateur et la mise à l'échelle Windows. Le passage C4.10 avait déjà confirmé au moins neuf lignes complètes à 1648×928 en Chromium. **Ne pas imposer une réduction arbitraire des polices ou hauteurs de panneaux sans une mesure locale.**

**Implémentation ciblée.** Un diagnostic visuel opt-in s'ouvre dans le cockpit Intelligence lorsque l'URL comporte \`?c4diag=1\`, sans changer l'interface normale. Il mesure :
- viewport CSS (\`innerWidth × innerHeight\`) ; écran et taille extérieure ;
- \`devicePixelRatio\`, \`visualViewport.scale\` et zoom CSS déclaré (ces valeurs ne permettent pas d'isoler à elles seules le zoom navigateur du zoom Windows) ;
- hauteurs du panneau Explorateur, de son slot, de la table, de l'en-tête et d'une ligne ;
- lignes intégralement visibles, lignes partiellement coupées, et pixels supplémentaires nécessaires à neuf lignes ;
- éventuel défilement global.
Un bouton permet de copier ces mesures en texte depuis le navigateur local. Le diagnostic ne s'affiche pas dans les autres pages ni sans le paramètre.

**Recette ajoutée.** Les tests C4.11 vérifient l'absence d'interface diagnostique dans l'application normale, les relevés réels à 1648×928 et 1318×742, et un contexte Chromium avec \`deviceScaleFactor=1.25\` tout en gardant un viewport CSS inchangé. **60/60 tests Chromium réussis**, plus les contrôles B1/B3 réussis : [GitHub Actions 41011906097](https://github.com/sogoyou8/BANK-360/actions/runs/41011906097). Trois captures de diagnostic sont dans l'artefact \`bank360-b5-browser-evidence\` : \`intelligence-c411-diagnostic-1648x928.png\`, \`intelligence-c411-diagnostic-1318x742.png\` et \`intelligence-c411-dpr125.png\`.

**Protocole local** : ouvrir \`http://127.0.0.1:5174/?c4diag=1\`, aller dans Intelligence, relever les mesures ou cliquer sur « Copier le diagnostic », puis essayer \`Ctrl+0\` dans le navigateur et comparer les deux relevés. Le DPR ne doit pas être assimilé automatiquement à un zoom de navigateur. En cas de viewport réellement inférieur aux dimensions de la cible, conserver le design et le nombre de lignes physiquement disponibles ; en cas de 1648×928 CSS et de moins de neuf lignes, inspecter l'espace manquant indiqué pour effectuer une correction locale fondée sur des mesures.

**Aucune fusion de PR et aucun déploiement.** Les pages 01–03, les métriques B3/B4 et les données agrégées restent inchangées. PR #20 toujours dépendante de la PR #19.


## C4.12 — Correction fondée sur les mesures locales (30 octobre 2026)

**Observation utilisateur C4.11, viewport CSS 1440 × 722** : DPR 2, scale visuelle 1, zoom CSS déclaré 1. Panneau Explorateur 251 px, slot 138 px, tableau aligné 122 px ; en-tête 22 px, ligne 20 px ; **5 lignes complètes** et zéro coupure. Il manque **63,9 px** de hauteur de slot pour atteindre neuf lignes. Le DPR seul ne permet pas d'attribuer cette différence au zoom navigateur.

**Adaptation ciblée** : nouvelle règle CSS \`@media (min-width:1320px) and (max-width:1450px) and (min-height:690px) and (max-height:750px)\`. Le cockpit Intelligence compacte légèrement son en-tête, les KPI, ses espacements et la hauteur non analytique des panneaux, puis réalloue la grille vers l'Explorateur. Conserve les données, les polices du tableau, le scroll par ligne entière, le pied du panneau, les onglets et les deux mini-KPI sans chevauchement. Le rendu hors de cette plage reste inchangé.

**Tests ajoutés** : Playwright mesure les neuf lignes complètes, l'absence de ligne coupée et de scroll global, l'absence de collision dans Diagnostics et les dimensions des panneaux à **1440 × 722**, **1440 × 740** et **1366 × 720**. Un deuxième test réplique **1440 × 722 CSS à DPR=2**. Captures sous \`test-results/intelligence-c412-*.png\` dans l'artefact \`bank360-b5-browser-evidence\`.

**Résultat : 62/62 tests Chromium PASS**, contrôles B1/B3 et compilation réussis, [GitHub Actions 41017977297](https://github.com/sogoyou8/BANK-360/actions/runs/41017977297).

**Limite** : le succès en navigateur automatisé ne confirme pas encore le rendu physique sur le PC de l'utilisateur : effectuer un \`git pull\` C4 puis contrôler la page Intelligence en 1440 × 722 et l'option \`?c4diag=1\`. Ne pas fusionner les PR #19/#20 ni déployer sans validation explicite.
