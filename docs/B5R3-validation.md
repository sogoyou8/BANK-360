# BANK 360 — B5.R3 · Densité et sémantique

## Périmètre
Correction ciblée de cinq points observés sur la vidéo B5.R2, sans nouveau KPI, sans jeu de données supplémentaire, sans modification de l'architecture 10 pages / 6 sections.

1. Rapports : cartes compactes selon leur contenu réel, sans hauteur artificielle.
2. Qualité : contrôles et provenance présentés dans des blocs compacts, sans vide dans les cadres.
3. Modèles : comparaison des modèles alignée en haut sur peu de lignes, tout en préservant l'accès aux variables, à la calibration et aux sous-groupes.
4. Statuts de paiement : `-1` payé à jour, `1`–`8` mois de retard suivant la [description officielle UCI](https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients). Les codes `-2` et `0` présents dans le fichier ne reçoivent **pas** de signification non confirmée par la source officielle ; les valeurs brutes sont conservées.
5. Contexte des pourcentages : les taux de défaut par âge, plafond et statut affichent le nombre de dossiers `n` qui sert de dénominateur. Aucun client ni scoring individuel.

## Tests
- Contrats et agrégats historiques inchangés.
- Tests Playwright desktop sur les tailles réelles de panneaux, le mono-écran, les filtres par codes non traduits, les effectifs, les vues de modèle, mobile et fichier HTML autonome.
- Aucune publication Vercel/GitHub Pages. Recette utilisateur locale avant clôture B5.
