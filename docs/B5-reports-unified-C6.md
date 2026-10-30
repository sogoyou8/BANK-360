# BANK 360 — C6 : Rapports & préférences, cockpit unifié

## Statut

- Branche : `feature/b5-c6-reports-unified-cockpit`
- Revue : [PR #22](https://github.com/sogoyou8/BANK-360/pull/22), **brouillon, non fusionnée**
- Périmètre : uniquement la page **06 — Rapports & préférences**, et ses tests/documentation
- **Pages 01–05 gelées**, aucune modification de leurs composants ou CSS
- Aucun déploiement public ni preview publiée

## C6.0 — Audit de l'existant

La page Rapports originale contenait déjà trois téléchargements CSV :
- `bank360-portefeuille.csv` — groupes UCI filtrés, colonnes des segments de crédit ;
- `bank360-paiements.csv` — 6 périodes UCI agrégées selon la sélection courante ;
- `bank360-alertes.csv` — groupes et alertes PaySim du test chronologique.

Elle contenait également les liens de méthodologie B2, B3 et B4, ainsi que les deux actions réelles : changement de thème et réinitialisation des filtres de crédit. Ces comportements sont conservés.

## C6.1–C6.5 — Vue cible Aurora

Une seule page React `reports` :
- Bandeau de disponibilité basé sur les contrôles déjà disponibles dans `reconcile()`, jamais certification métier.
- Sélecteur **Crédit / Fraude / Toutes sources** (par défaut). Les indicateurs et cartes décrivent uniquement les ressources effectivement disponibles dans ce périmètre.
- Quatre perspectives **Vue globale / Exports / Méthodologie / Préférences**, dans le même cockpit. Les perspectives spécialisées modifient les proportions et mettent les informations pertinentes en avant.
- **Trois panneaux** (Exports à gauche sur deux rangées, Méthodologie et Préférences superposés à droite).
- Surface Aurora avec glassmorphism/neumorphism, boutons et liens vérifiables, navigation clavier et thème clair/sombre.
- Pas de tailles de fichier affichées : les tailles indiquées dans l'image cible étaient des valeurs de maquette non vérifiées.

### Exports garantis

Le nouveau `web/src/reportExports.ts` fournit :
- **CSV UTF-8 avec BOM**, colonnes réelles, valeurs échappées et protection contre l'injection de formules dans les chaînes ;
- **XLSX Open XML réellement téléchargeable**, composé des fichiers Open XML d'un classeur et d'une feuille, dans une archive ZIP standard sans compression ;
- **aucune dépendance tierce** nécessaire au téléchargement ;
- conservation de la distinction entre les groupes agrégés et les données individuelles absentes.

Choix de format par carte, état du format sélectionné accessible, bouton de téléchargement effectif. Chaque téléchargement reflète le contenu disponible au moment de l'action.

### Contrat des sources

- Crédit : `filteredSegments(filters)` et `paymentSeries(filters)` (les mêmes filtres globaux que la page Crédit, y compris le statut septembre).
- Fraude : `fraudTypes`, calculé sur les résultats B4 PaySim de test, sans opérations individuelles ni montants inventés.
- Documents : `docs/B2-validation-finale.md`, `docs/B3-validation-finale.md`, `docs/B4-validation-finale.md`. Les liens ouvrent GitHub et la provenance reste explicite.
- Préférences : thème clair/sombre courant et remise des filtres de crédit au niveau global, appliquées immédiatement à l'interface.
- Les données UCI et PaySim restent séparées. Aucun fichier PDF ou rapport automatisé nouveau n'est simulé.

## C6.6 — Test et vérification

Les tests `web/e2e/reports-c6.spec.ts` couvrent :
- trois exports, trois documents, deux paramètres en vue globale ;
- contextes Crédit et Fraude, perspectives et actions ;
- téléchargement CSV et inspection des colonnes réelles ;
- téléchargement XLSX et contrôle des structures ZIP / workbook.xml / worksheet.xml ;
- export Crédit filtré selon l'âge, réinitialisation des filtres ;
- changement de thème, liens vers les documents B2/B3/B4 ;
- géométrie mono-écran aux résolutions 1920×1080, 1672×941, 1648×928, 1440×900, 1440×810, 1366×768 et 1280×720 ;
- variantes filtrées et perspectives, mobile 390×844 ;
- régressions automatiques existantes sur les six pages.

Le workflow `B5 Web cockpit` lance `npm run test`, `npm run build`, `npm run standalone` et `npm run test:e2e`. Les preuves Chromium sont déposées dans l'artefact `bank360-b5-browser-evidence` sans déploiement.

## Clôture

Une fois tous les tests réussis, comparer la capture réelle de C6 à la maquette Aurora. **La fusion de la PR #22, le gel de la page 06 et toute publication exigent une validation locale explicite de l'utilisateur.** Le gel historique des pages 01–05 reste valable.


## C6.1 — Finition et validation de la maquette

Dernier ajustement visuel sur grand écran, **sans modification des pages 01–05** :
- Dock et rails principaux calés sur la cible Aurora à 1672 × 941.
- Bandeau déplacé vers la bonne ligne de composition.
- Répartition Méthodologie / Préférences équilibrée, les trois cartes d'export restent entièrement visibles.
- Aucune valeur de taille « ~2,4 Mo », « ~1,8 Mo » ou « ~0,9 Mo » reproduite : il ne s'agit pas de mesures issues des exports.

**GitHub Actions B5 C6.1 :** [run 41042207316](https://github.com/sogoyou8/BANK-360/actions/runs/41042207316), **87/87 tests Chromium réussis**, \`npm run test\`, compilation TypeScript / React et \`npm run standalone\` réussis. Les workflows B1 et B3 de cette version sont également réussis.

**Validation XLSX indépendante :** le fichier produit par Playwright (\`reports-c6-alertes-real.xlsx\`) a été importé avec un lecteur de classeur distinct du code React. Le classeur « Données agrégées » contient bien les 9 colonnes \`type, transactions, frauds, alerts, tp, fp, fn, precision, recall\` et des lignes de groupes PaySim, sans transactions individuelles. Le ZIP/OOXML est conforme à cette lecture.

**Captures Chromium disponibles** dans l'artefact \`bank360-b5-browser-evidence\` de ce run :
- \`reports-c61-reference-1672x941.png\`, comparaison à la cible ;
- \`reports-c6-1440x810.png\` et \`reports-c6-mobile-390x844.png\` ;
- autres formats et contextes \`reports-c6-context-*.png\` ;
- fichier réel \`reports-c6-alertes-real.xlsx\`.

Les captures automatisées vérifient l'intégrité du cockpit à 1920×1080, 1672×941, 1648×928, 1440×900, 1440×810, 1366×768, 1280×720 et 390×844, y compris les filtres et perspectives.

**Statut : C6.1 prêt à être inspecté localement.** PR #22 ouverte en brouillon, non fusionnée, aucun déploiement. Seule la validation explicite de la capture locale permettra de geler la page 06.

## C6.2 — Dernière correction de proportion et recette à 1648 × 928 (30 octobre 2026)

- Rapport des colonnes de la **Vue globale** adapté à la maquette : grand panneau Exports ≈ **54–55 %**, Méthodologie et Préférences ≈ **45–46 %**, au lieu du partage antérieur 57/43.
- Titre, bandeau et cartes réalignés verticalement pour se rapprocher de la cible originale à **1648 × 928**.
- Styles limités à `web/src/reports-workspace.css` dans un media query desktop ≥ 1500 px ; aucun impact sur les pages 01–05 gelées.
- Test Playwright supplémentaire `C6.2` dans `web/e2e/reports-c6.spec.ts`, vérifiant proportion des colonnes, rails, absence de chevauchement, aucune barre de défilement globale et footer visible.
- **[Run B5 #41048958089](https://github.com/sogoyou8/BANK-360/actions/runs/41048958089)** : **88/88 tests Chromium réussis** ; compilation et contrôles du cockpit passés.
- Les workflows B1 et B3 du même commit sont réussis.
- Capture réelle : `test-results/reports-c62-target-1648x928.png` dans l'artefact `bank360-b5-browser-evidence` de la run B5 ; également `reports-c6-1440x810.png` et les captures mobiles/contextuelles.
- Le fichier XLSX PaySim réel est toujours généré ; colonnes et valeurs reconnues par un lecteur OOXML indépendant, aucun montant, identifiant ou score de transaction inventé.

**Décision : C6.2 est techniquement prête à la revue locale. PR #22 reste en brouillon, sans fusion ni déploiement public.** La page 06 ne sera gelée qu'après validation de l'utilisateur sur sa machine.

## C6.3 — Finition unique après revue vidéo locale (30 octobre 2026)

**Objectif :** corriger dans une seule intervention le tassement de Préférences sous la perspective Méthodologie, l'espace sous-utilisé des contextes Crédit/Fraude et compléter les tests géométriques, sans modifier la Vue globale Toutes sources ni les pages 01–05 gelées.

### C6.3.1 — Préférences lisibles sous Méthodologie

- Le découpage vertical Méthodologie/Préférences réserve une hauteur minimum au panneau inférieur dans toute fenêtre desktop.
- Chaque préférence (« Apparence » et « Filtres de crédit ») dispose d'un espace propre pour son titre, sa valeur et son bouton.
- Des règles adaptées aux fenêtres de hauteur inférieure ou égale à 850 px et à 750 px préviennent le chevauchement de lignes et boutons.
- Aucune nouvelle route, aucune donnée modifiée.

### C6.3.2 — Densité des contextes filtrés

- **Crédit** : largeur des deux colonnes rééquilibrée en Vue globale ; les deux exports restent compacts et un encadré « Périmètre Crédit » précise la provenance UCI, le caractère historique, le nombre calculé de lignes exportables et si un filtre est actif.
- **Fraude** : la colonne Exports se resserre en Vue globale ; la carte « Alertes par canal » reste compacte. L'encadré « Périmètre Fraude » précise PaySim simulé, l'origine B4 et le nombre réel de lignes exportables.
- Ces encadrés réutilisent les lignes réelles des exports déjà calculées. Ils n'inventent ni transactions individuelles, ni volumes, ni montants.
- **Toutes sources / Vue globale** : proportions et disposition validées C6.2 conservées.

### C6.3.3 — Détection de collisions et non seulement de débordements

Le test C6.3 « no label/button collisions or clipped preferences across sources, perspectives and viewports » parcourt **48 combinaisons** :

- Résolutions : **1648×928, 1440×810, 1366×768, 1280×720**.
- Contextes : Toutes sources, Crédit, Fraude.
- Perspectives : Méthodologie, Préférences, Exports, Vue globale.
- Contrôles de géométrie : bouton strictement dans la ligne et séparé de son texte, absence de recouvrement entre les deux lignes, descriptif et bouton visibles, note méthodologique contenue dans son panneau, encadré de périmètre entre la dernière carte et le pied du panneau, aucune coupure interne ni défilement global.

**Résultat : 89/89 tests Chromium réussis** sur [GitHub Actions run 41052242912](https://github.com/sogoyou8/BANK-360/actions/runs/41052242912), dont C6.3. Les contrôles B1 et B3 du même commit sont également réussis.

### C6.3.4 — Captures et comparaison réelle

Captures Chromium dans l'artefact bank360-b5-browser-evidence du run B5 :

- reports-c62-target-1648x928.png : Vue globale Toutes sources, comparée à la cible, sans changement de composition.
- reports-c63-all-methodology-1648x928.png : trois méthodologies et deux préférences sans chevauchement.
- reports-c63-credit-overview-1648x928.png et reports-c63-fraud-overview-1648x928.png : nouvelles proportions et périmètres de source réels.
- reports-c63-credit-methodology-1648x928.png, reports-c63-fraud-methodology-1648x928.png : deux préférences lisibles.
- Mêmes contrôles et captures à **1280×720** : absence de collision ou coupure.

**Inspection visuelle des captures :** textes, contrôles et footer intégralement visibles. La perspective Méthodologie réserve désormais à Préférences un espace stable. La Vue globale de référence est conservée. Les contextes filtrés gardent naturellement de l'espace libre, mais l'encadré de périmètre en améliore l'usage sans inventer d'indicateurs.

**Périmètre C6.3 :** fichiers ReportsWorkspace.tsx, reports-workspace.css, reports-c6.spec.ts et cette documentation, exclusivement sur la branche C6.

**Statut : C6.3 techniquement validé et capturé ; prêt pour revue locale.** La [PR #22](https://github.com/sogoyou8/BANK-360/pull/22) demeure en brouillon sur sa branche, **non fusionnée, non déployée**. La page 06 ne sera gelée qu'après validation du rendu local par l'utilisateur.
