# BANK 360 — Registre de gel B5 : pages 01 à 06

**Décision : 30 octobre 2026 — six cockpits validés visuellement, fusionnés dans `main` et gelés.**  
Ce registre remplace le [registre 01–05](B5-gel-pages-01-05.md), conservé comme historique.
Le gel porte sur l'**interface B5**, et non sur la clôture de toutes les phases du projet Data BANK 360.

## État des pages

| Page | Cockpit | Décision |
|---|---|---|
| 01 | Vue d'ensemble | Gelée — état antérieur validé |
| 02 | Portefeuille & segmentation | Gelée — Crédit, Risque et Paiements intégrés |
| 03 | Détection de fraude & analyse des alertes | Gelée — C3.10, [PR #19](https://github.com/sogoyou8/BANK-360/pull/19) |
| 04 | Modèles & explorateur de données | Gelée — C4.13, [PR #20](https://github.com/sogoyou8/BANK-360/pull/20) |
| 05 | Qualité & traçabilité | Gelée — C5.9, [PR #21](https://github.com/sogoyou8/BANK-360/pull/21) |
| **06** | **Rapports & préférences** | **Gelée — C6.3**, [PR #22](https://github.com/sogoyou8/BANK-360/pull/22) |

**Architecture de référence : six pages / six sections**, avec perspectives internes à chaque cockpit. Les variantes Crédit/Fraude et onglets ne sont pas des pages supplémentaires.

## Clôture de C6 sans C6.4

- **Branche** : `feature/b5-c6-reports-unified-cockpit` ; dernier commit de branche `e7535fad1a7e58418be4d874233e7980be10a726`.
- **Merge PR #22** : `89866a23f44c2e397fc25ac7e054c447bac2a31d` dans `main`.
- **Revue visuelle locale** : le rendu Vue globale à 1648 × 928 a été accepté après C6.3 ; le cockpit reste mono-écran et les panneaux Exports/Méthodologie/Préférences sont alignés, sans chevauchement visible.
- **C6.3.1** : les deux lignes Préférences restent lisibles en perspective Méthodologie, y compris dans les contextes Crédit et Fraude.
- **C6.3.2** : espace des exports rééquilibré et encadré de périmètre réel dans les contextes filtrés, sans volumes ni transactions inventés ; Vue globale « Toutes sources » conservée.
- **C6.3.3** : contrôle de collision textuelle et boutons sur **48 combinaisons** (4 résolutions desktop × 3 contextes × 4 perspectives), sans débordement global.
- **C6.3.4** : captures Chromium de revue pour la cible 1648 × 928 et les cas contextuels, jusqu'à 1280 × 720. Détails : [dossier C6](B5-reports-unified-C6.md).

### Contrats fonctionnels préservés

- **Trois exports CSV et XLSX réellement générés** à partir des agrégats existants (portefeuille UCI, historique mensuel UCI, alertes PaySim de test). Les formats XLSX sont des classeurs Open XML et non des CSV renommés.
- **Trois méthodologies** reliées aux documents B2, B3, B4 réellement présents.
- **Préférences** : thème clair/sombre et réinitialisation des filtres Crédit raccordés aux états existants.
- **Trois contextes de sources** : Crédit, Fraude, Toutes sources, sans jointure fictive entre UCI et PaySim.
- **Aucun client individuel, montant ou score inventé**. Les observations mensuelles du crédit représentent des dossiers répétés, non de nouveaux clients ; la fraude PaySim est simulée, non une banque connectée.

### Vérifications

- **Dernier commit de PR #22** : [B5 GitHub Actions #41053333500](https://github.com/sogoyou8/BANK-360/actions/runs/41053333500) — **89/89 tests Chromium réussis**, compilation et contrôles de données réussis ; B1 [#41053333501](https://github.com/sogoyou8/BANK-360/actions/runs/41053333501) et B3 [#41053333668](https://github.com/sogoyou8/BANK-360/actions/runs/41053333668) réussis.
- **Vérification `main` post-fusion** : [B5 #41055392969](https://github.com/sogoyou8/BANK-360/actions/runs/41055392969) — **SUCCESS, 89/89 tests Chromium**, build React/TypeScript et validation de données réussis ; [B1 #41055392974](https://github.com/sogoyou8/BANK-360/actions/runs/41055392974) — **SUCCESS**.
- Aucun workflow B5 n'exécute une publication : compilation, tests et création d'artefacts téléchargables uniquement. Aucun déploiement public initié par cette clôture.

### Politique de gel

Les **six pages 01–06** sont désormais sous gel visuel et fonctionnel. Toute modification nécessite un défaut reproductible ou une demande explicite, une branche dédiée, des tests et une nouvelle validation. **Ne pas lancer de C6.4** sans nouveau besoin démontré.

**Suite du projet :** validation globale des données, de la sécurité et du packaging portfolio, puis décision distincte concernant toute publication. **La fin des six pages B5 ne vaut pas achèvement de toutes les phases de BANK 360.**
