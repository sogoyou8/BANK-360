# BANK 360 — C5 : Qualité & traçabilité

## Périmètre et statut

**Branche** : \`feature/b5-c5-quality-unified-cockpit\` (depuis \`main\`)  
**Revue** : [PR #21](https://github.com/sogoyou8/BANK-360/pull/21), brouillon ouvert, **aucune fusion et aucun déploiement**.  
**Référence** : image cible Aurora de la page « Qualité & traçabilité », 1648 × 928.

**Pages 01–04 : gelées.** La page 06 Rapports ne change pas.

## C5.0 — Sources vérifiées

Le projet contient déjà une fonction source de vérité \`reconcile()\` dans \`web/src/data.ts\`. Ses champs alimentent les badges et le bandeau du nouveau cockpit.

| Contrôle | Sources / logique existantes | Valeur de référence actuelle | Portée |
|---|---|---|---|
| Dossiers et défauts | \`powerbi/data/uci350_segments.csv\`, \`creditTotals(segments)\`, \`creditOK\` | 30 000 dossiers / 6 636 défauts | Egalité des totaux agrégés UCI |
| Historique des paiements | \`powerbi/data/uci350_payment_months.csv\`, \`paymentSeries(initialFilters)\`, \`paymentOK\` | 6 périodes × 30 000 = 180 000 observations | Observations répétées, **pas** 180 000 clients |
| Transactions simulées | \`reports/b4/B4-metrics.json\`, \`fraudOK\` | 6 362 620 transactions / 8 213 fraudes | Cohérence des métadonnées du **jeu simulé** |
| Évaluation des modèles | \`reports/b3/B3-metrics.json\`, \`reports/b4/B4-metrics.json\`, \`modelsOK\` | PR-AUC test rapportées strictement positives | Disponibilité et cohérence minimale des métriques ; **ni certification ni performance opérationnelle** |

Les états sont conditionnels : un contrôle en échec s'affiche « À examiner », et le bandeau ne dit « Sources réconciliées » que si tous les contrôles affichés ont réussi. Le nombre \`4\` résulte du nombre effectif de vérifications réussies, pas d'une constante graphique.

Les groupes de Crédit et les opérations de Fraude ne sont jamais joints. Les valeurs de test et les constats qualitatifs restent distincts.

## C5.1–C5.5 — Structure et interactions

- **Une seule page** \`quality\` avec trois panneaux, sans nouvelle route :
  - Contrôles des agrégats, quatre cartes cliquables et inspection centralisée ;
  - Provenance, liens directs et externes UCI / Kaggle PaySim ;
  - Limites d'utilisation, avec mentions historiques / simulées et aucune opération bancaire réelle.
- **Quatre perspectives internes** : Vue globale, Contrôles, Sources, Limites. Elles modifient la mise en évidence et la répartition des colonnes, en conservant le même cockpit.
- **Trois contextes** : Crédit, Fraude, Toutes sources (par défaut). Seuls les contrôles, les liens, les limites et les KPI pertinents au contexte restent visibles. Le détail modèle devient **B3 seul en Crédit**, **B4 seul en Fraude**, **B3+B4 seulement en Toutes sources**.
- **Inspecter un contrôle** ouvre un dialogue qui présente fichier source, condition, valeur observée, référence, statut et signification. Fermeture par Échap, bouton ou clic sur fond. Rien n'est créé au niveau individuel.
- **Fidélité Aurora** : glassmorphism/neumorphism, grandes cartes internes, bandeau menthe, dock existant, logo et topbar existants, fond spatial, interactions visibles. CSS isolé dans \`web/src/quality-workspace.css\`.
- **Thèmes** clair/sombre préservés.

## C5.6–C5.8 — Géométrie

Référence 1648×928 : dock et rails ciblés à x~17 et x~134, bord droit du contenu ~1618, bandeau y~262, modules y~373. Une règle CSS dédiée ≥1500px corrige les écarts visuels de la première capture Chromium sans changer le design des autres pages.

La page reste mono-écran sur desktop. Les tests utilisent 1920×1080, 1672×941, 1648×928, 1440×900, 1440×810, 1366×768 et 1280×720. Mobile à 390×844 en colonne, avec scroll vertical interne de la page autorisé et dock accessible.

## Validation

Exécuter depuis \`web\` :

\`\`\`powershell
npm.cmd run test
npm.cmd run build
npm.cmd run standalone
npm.cmd run test:e2e
\`\`\`

Les tests additionnels dans \`web/e2e/quality-c5.spec.ts\` vérifient l'origine des agrégats, les statuts, les contextes filtrés, les 4 perspectives, l'inspection des preuves, les liens réels, la navigation clavier, les hauteurs et l'absence de scroll global desktop, les captures et le mobile. Les tests existants continuent de protéger les pages 01–04 et 06.

Les captures réelles Chromium sont disponibles dans l'artefact \`bank360-b5-browser-evidence\`, sous \`test-results/quality-c5-*.png\` et \`quality-c58-target-1648x928.png\`. Ce ne sont pas des images générées.

**Ne pas fusionner** avant comparaison de l'application locale avec l'image cible et validation explicite de l'utilisateur. Aucune preview publique, GitHub Pages ou Vercel ne fait partie de C5.
