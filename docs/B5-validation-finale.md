# BANK 360 — B5 · Validation technique et recette Web

**Note :** rapport historique de l'architecture initiale à 11 pages. La version actuelle rassemble **8 pages / 6 sections**, dont Crédit unifié, voir [B5-credit-unified.md](B5-credit-unified.md). La refonte **B5.R du 29 octobre 2026** remplace cette architecture par **10 pages dans six sections**, voir [le cahier B5.R](B5R-architecture.md) et les exécutions du workflow Web. Les résultats des audits B1–B4 sont inchangés.

**Date :** 28 octobre 2026 · **Statut :** `PASS — build et tests automatisés` · **Design utilisateur : à confirmer visuellement après ouverture.**

## Livrables

- Frontend React 18, TypeScript, Vite dans `web/`, sans backend bancaire et sans secret.
- Architecture **11 pages** et **6 sections du dock** Aurora / Spatial Workspace / Atlas : Command Center ; Crédit & Portefeuille (4 sous-pages) ; Fraude & Investigations (2 sous-pages) ; Intelligence & Modèles (2 sous-pages) ; Qualité des données ; Rapports.
- Navigation dock à six entrées avec sous-menus, onglets contextuels, palette Ctrl/Cmd+K, responsive desktop/mobile, mode clair/sombre, tables, graphiques SVG et exports CSV.
- Atlas illustratif exclusivement : pas de coordonnée/position client, pas de carte de densité réelle.
- Deux familles de sources **non fusionnées** : agrégats crédit UCI350 (Taïwan 2005) et simulation mobile PaySim. Modèles B3/B4 alimentés par métriques agrégées vérifiées.

## Contrôles exécutés

- [Exécution GitHub Actions du 28 octobre 2026](https://github.com/sogoyou8/BANK-360/actions/runs/40710999940) : **PASS** (source, npm, TypeScript, Vite, création HTML autonome, installation Chromium, tests navigateur, artefacts de captures).
- Script de contrat de données vérifie 196 groupes, 1 176 groupes mensuels, 30 000 dossiers UCI, 6 636 défauts, 9 618 dossiers/2 197 défauts (18–29 ans), 180 000 observations sur six mois, 6 362 620 transactions PaySim et 8 213 fraudes simulées.
- **5 tests Playwright** : accueil + 6 entrées, filtres crédits / reset / paiements, fraude / investigations / modèles, navigation clavier / mobile, **prévisualisation `file://` autonome**.
- La version compilée n'est pas déployée ; les téléchargements se trouvent dans les *artifacts* de la CI (rétention temporaire de 14 jours).

## Procédure utilisateur, sans commandes

1. Ouvrir [Actions B5](https://github.com/sogoyou8/BANK-360/actions/runs/40710999940).
2. Sous **Artifacts**, télécharger `bank360-b5-static-preview`, puis extraire le ZIP.
3. Double-cliquer `BANK-360-B5-APERCU-LOCAL.html` pour ouvrir dans Chrome.
4. Inspecter la finition du dock, les 11 pages, les interactions, le mobile et les exports. Les captures automatiques sont dans `bank360-b5-browser-evidence`.

## Limites et exclusions explicites

- **Recette visuelle humaine** non encore donnée ; les captures d'écran Playwright n'établissent pas une approbation du style par l'utilisateur.
- Aucun hébergement public, aucune authentification réelle, aucune base bancaire, aucun historique temps réel.
- Aucun individu ou score par client, aucune transaction brute PaySim. Les alertes sont **agrégées au niveau canal et période de simulation**.
- Le modèle PaySim affiche de forts écarts de calibration ; l'application ne doit pas déclencher des décisions ou des alertes opérationnelles.
- B6 finalisation/portfolio reste ouvert.

**Verdict : B5 livré et automatisé sur GitHub ; esthétique finale à valider lors de la revue de l'aperçu.**
