# BANK 360 — X2 Aurora Unified : contrat de composition

**Statut : PR #24 en brouillon, base X1.9.1. Pas de fusion ni publication.**

## Motif de la refonte

Rejet explicite de X1.9.1 pour son esthétique trop découpée : panneaux, sous-cartes, cadres, fonds bleus et bordures répétées. Les tests de calcul et de navigation étaient réussis, mais la qualité de composition doit être évaluée séparément.

## Architecture cible

1. **Navigation existante** : seulement Analyse 360 et Gouvernance & preuves pour Aurora ; la version classique reste accessible.
2. **Filtres discrets** hors de la surface centrale : Crédit (âge, plafond, statut) et Fraude (type OU jour), avec reset et accès aux preuves.
3. **Une surface unique** `x2-surface` : quatre KPI intégrés au même fond, alignés par deux au-dessus de leur domaine.
4. **Deux domaines** sous les KPI, Crédit à gauche et Fraude à droite, séparés par une seule règle verticale. Les titres, comparaisons, matrices, graphiques et liens de diagnostic utilisent l'espace, pas des cadres individuels.
5. **Exploration intégrée** : barre d'inspection compacte en bas du même fond, avec une ligne agrégée d'aperçu et accès clair à l'agrandissement. Les exports, quatre vues et l'accessibilité clavier doivent fonctionner.
6. **Gouvernance homogène** : bannière et quatre zones organisées par règles fines sur une même surface, sans quatre cartes externes.

## Hiérarchie et principes visuels

- Une bordure principale par espace ; uniquement séparateurs de contexte à l'intérieur.
- Nombreux contenus importants visibles, mais pas de cartes imbriquées ou de glow décoratif répété.
- La sélection principale est affichée une fois dans les KPI ; les comparaisons montrent référence, différence et contexte, plutôt que dupliquer le même nombre.
- Crédit bleu / Fraude rose-violet, identités sobres et stables ; mode clair cohérent.
- Desktop mono-écran 1920, 1648, 1440, 1366 et 1280 ; mobile défilement vertical autorisé mais aucun débordement horizontal global.
- Ne pas ajouter de statistiques synthétiques pour occuper du vide.

## Contrats de données inchangés

- UCI : historique 2005, 30 000 dossiers, cohorte filtrable âge × plafond × statut.
- PaySim : simulation indépendante, type OU jour, jamais de jointure implicite avec UCI.
- Références de risque, PR-AUC, ROC-AUC, Brier et rappel B3/B4 : évaluations **globales de test** non filtrées.
- Ne jamais présenter l'application comme un outil bancaire opérationnel ni comme une certification.
- Conserver les exports CSV/XLSX et les groupes agrégés, jamais de faux enregistrements individuels.

## Preuves attendues

- Build TypeScript + contrats de données + 110 tests existants.
- Recette complémentaire X2 vérifiant surface unique, absence de bordure de carte, axes alignés et contrôles fonctionnels.
- Captures de Chromium : Analyse 1648×928, 1440×810 et 1280×720 ; Gouvernance 1648×928 ; mobile 390×844.
- Revue visuelle humaine avant de considérer la direction comme approuvée. Les tests seuls ne valident pas l'esthétique.

**Contrainte de livraison** : la branche X2 n'est pas fusionnée dans X1/main et n'est pas publiée tant que le visuel n'est pas validé.


## X2.1 — Recomposition de la hiérarchie (après revue locale)

La version X2 initiale supprimait les cadres sans modifier suffisamment l'ordre de lecture : filtres globaux, quatre KPI, puis deux colonnes et tableau. L'utilisateur a confirmé une amélioration insuffisante.

### Nouvelle disposition, effectivement implémentée
1. Les deux libellés de provenance définissent les deux zones principales.
2. À gauche, **le taux de défaut** est le chiffre dominant et le volume de dossiers devient une statistique d'appui ; à droite, **le nombre d'alertes** domine et le volume PaySim lui est subordonné.
3. Les trois filtres Crédit sont situés sous le héros Crédit, les deux filtres Fraude sous le héros Fraude. Ils contrôlent exactement les mêmes champs qu'avant.
4. Les analyses graphiques et la comparaison sont développées **dans leurs propres domaines**, sans bandeau KPI horizontal partagé.
5. L'écart de défaut en points apparaît à la place du taux UCI dupliqué ; la valeur de référence demeure affichée en contexte et le calcul de l'écart n'est pas modifié.
6. L'inspecteur conserve ses quatre onglets et une ligne agrégée d'aperçu, mais forme un dock secondaire dans le prolongement de l'écran.
7. Mobile : ordre Crédit (source, KPI, filtres, matrice) puis Fraude (source, KPI, filtres, graphes), puis inspecteur.

**Validation attendue :** tests X2.1 des positions réellement rendues aux formats desktop (1648, 1440, 1280) et mobile 390, anciens contrats X1/B5 (sources, filtres, exports, clavier), et captures de la nouvelle hiérarchie. La nouvelle direction ne sera pas considérée esthétiquement validée tant que l'utilisateur ne l'aura pas examinée.
