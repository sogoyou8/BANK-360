# BANK 360 — Registre de gel des pages 01 à 05 (B5)

**Décision : 30 octobre 2026 · cinq cockpits validés, fusionnés dans `main` et gelés.**
**Aucun déploiement public n'a été déclenché pendant cette clôture.**

Ce registre devient la référence actuelle du gel B5. Le [registre précédent 01–04](B5-gel-pages-01-04.md) reste conservé comme historique des décisions et validations C3/C4.

## État des six pages du cockpit

| Page | Cockpit unifié | Validation / gel |
|---|---|---|
| **01** | Vue d'ensemble | Gelée — état antérieur conservé |
| **02** | Portefeuille & segmentation | Gelée — Crédit, Risque et Paiements en perspectives internes |
| **03** | Détection de fraude & analyse des alertes | Gelée — C3.10, [PR #19](https://github.com/sogoyou8/BANK-360/pull/19) fusionnée |
| **04** | Modèles & explorateur de données | Gelée — C4.13, [PR #20](https://github.com/sogoyou8/BANK-360/pull/20) fusionnée |
| **05** | Qualité & traçabilité | **Gelée — C5.9**, [PR #21](https://github.com/sogoyou8/BANK-360/pull/21) fusionnée |
| **06** | Rapports & préférences | **À travailler** — hors de ce gel |

**Architecture de référence : 6 pages / 6 sections.** Les perspectives internes ne créent pas de pages supplémentaires.

## Page 05 — clôture C5.9

**Branche source :** `feature/b5-c5-quality-unified-cockpit`.  
**Dernier commit de branche :** `09a9104025ad396eec5eaa99c8ff0fb93e7c938e`.  
**Fusion dans `main` :** `2fcd7852462d4258df5cdaa95b10f8f298612506`.

### Recette visuelle et fonctionnelle

- **Vue globale Aurora** : capture locale de la page 05 comparée à la cible ; même hiérarchie visuelle, bandeau de réconciliation, quatre contrôles, provenance, limites, navigation et footer.
- **C5.9.1** : les cartes filtrées Crédit (3) et Fraude (2) conservent une hauteur homogène et ne s'étirent pas artificiellement ; les périmètres restent distincts.
- **C5.9.2** : les perspectives Contrôles, Sources et Limites mettent chacune leur information au premier plan, tout en restant dans le cockpit mono-écran.
- **C5.9.3** : chaque contrôle ouvre ses preuves ; dialogue utilisable au clavier avec fermeture et restauration du focus.
- **Données vérifiables** : contrôles reposant sur `reconcile()`, les agrégats UCI 2005, les métadonnées PaySim simulées et les rapports B3/B4. Aucun client, transaction individuelle ou score inventé. Les quatre badges « Conforme » expriment la réussite des quatre contrôles définis, pas une certification bancaire ou réglementaire.
- **Liens et limites** : sources UCI/Kaggle PaySim, absence de décisions opérationnelles et avertissements sur les dérives chronologiques.

### Validation automatisée après fusion

- **[GitHub Actions B5 sur `main` — run 41033332558](https://github.com/sogoyou8/BANK-360/actions/runs/41033332558)** : **SUCCESS ; 76/76 tests Chromium réussis**, compilation React/TypeScript, validations des données, génération HTML autonome, captures d'écran de recette.
- **[GitHub Actions B1 sur `main` — run 41033332711](https://github.com/sogoyou8/BANK-360/actions/runs/41033332711)** : **SUCCESS**.
- **B3 avant fusion** : [run 41029092493](https://github.com/sogoyou8/BANK-360/actions/runs/41029092493) **SUCCESS**. La fusion C5 ne modifie pas le code des expériences B3/B4.
- Les fichiers modifiés dans la PR #21 sont limités à : `web/src/QualityWorkspace.tsx`, `web/src/quality-workspace.css`, l'intégration ciblée dans `web/src/main.tsx`, `web/e2e/quality-c5.spec.ts`, `docs/B5-quality-unified-C5.md`.

## Contrats et limites maintenus

- **Crédit UCI Taïwan 2005** : 30 000 dossiers historiques, 6 636 défauts, six périodes de paiement et 180 000 observations mensuelles répétées (non des clients distincts).
- **Fraude PaySim** : 6 362 620 transactions et 8 213 étiquettes de fraude **simulées**, sans association aux dossiers UCI.
- **Modèles B3/B4** : rapports expérimentaux historiques, métriques de validation et de test contextualisées ; aucune décision de crédit, scoring ou alerte bancaire réelle.
- **Aucune jointure artificielle UCI–PaySim**, aucune métrique fabriquée, aucun flux en temps réel.

## Politique de gel

Les pages **01 à 05** ne doivent plus être modifiées sans demande explicite, défaut reproductible ou correction des données étayée. Une évolution nécessitera branche, PR, tests et nouvelle recette.

**Reste à développer : page 06 — Rapports & préférences**, puis les étapes B6 / finalisation portfolio. Le projet BANK 360 dans son ensemble n'est donc **pas encore terminé**.

**État : modifications C5 intégrées dans `main`, tests post-fusion verts, aucun déploiement public effectué par cette clôture.** Les workflows de CI vérifiés construisent et conservent des artefacts sans publier le site ; les intégrations externes éventuelles restent hors de cet inventaire.
