# BANK 360 — B2 : validation finale Power BI Desktop

**Date :** 28 octobre 2026  
**État :** clôturé — rapport Power BI Credit Risk UCI / R2.4  
**Nature de la preuve :** captures d'écran et vidéos d'acceptation utilisateur dans la conversation, non archivées ici. Ne pas confondre recette visuelle avec automatisation de Power BI Desktop.

## Périmètre vérifié

- Les quatre pages (Vue générale, Risque de crédit, Paiements 2005, Qualité et méthode) se sont affichées dans Power BI Desktop Windows.
- La source UCI350 historique a été chargée ; totaux globaux : **30 000 dossiers**, **6 636 défauts** et **22,12 %** de taux de défaut (22,1 % à l'écran avec un chiffre décimal).
- Les deux cartes de contrôle qualité de la page 04 affichent chacune `1`.
- Les interactions graphiques et tableaux provoquent des recalculs cohérents sur les vues.
- Une capture finale confirme **la sélection directe de `18-29` dans le segment « Tranche d'âge »**, au lieu de « Tout ». Les KPI affichent alors **9 618 dossiers**, **2 197 défauts**, **22,8 %** et **124 209 NTD** de limite de crédit moyenne. Ces volumes concordent avec l'agrégat UCI officiel.
- La dernière passe R2.4 corrige l'emplacement des annotations, clarifie le périmètre total de 30 000 et rend les libellés visibles.

## Réserves et exclusions

- Le taux de défaut est celui du **jeu historique Taïwan 2005**, pas un taux réglementaire NPL français 2026.
- La clôture porte sur le **rapport Power BI crédit**. Aucun tableau EBA sectoriel n'a été fusionné au jeu UCI ; la fraude PaySim et le scoring B3 sont hors de ce périmètre.
- Pas de déploiement sur Power BI Service ni de fichier `.pbix` exporté et validé ; le livrable est le projet `.pbip` versionnable et son modèle TMDL.
- Les contrôles de chaque combinaison de filtres n'ont pas été exhaustivement filmés ; la recette atteste le scénario métier représentatif confirmé ci-dessus.

## Suites

Conserver B2 comme référence validée. Démarrer B3 Credit Risk Analytics sur la source UCI, sans modifier les résultats historiques ou élargir implicitement le périmètre B2.
