# B2 — Power BI : livraison et recette

**Date** : 28 octobre 2026  
**Projet** : DATA 05 / BANK 360  
**Périmètre** : Credit Risk BI (Taiwan 2005, UCI350)  
**Statut technique** : conception et génération PBIR/TMDL terminées; tests CI à exécuter; recette visuelle Power BI Desktop non disponible depuis l'environnement d'exécution.

## Choix métier

Le B2 comporte uniquement le portefeuille UCI350. Ajouter des ratios EBA dans la même page donnerait une fausse impression de population comparable; ils seront traités séparément à une phase ultérieure si des données sectorielles fiables sont acquises. Pas de projet fraude PaySim dans B2.

## Livrables

- Projet natif `powerbi/BANK-360/BANK-360.pbip` à 4 pages PBIR.
- Sémantique TMDL : 2 tables de faits *agrégées*, 3 dimensions Age/CreditLimit/Status et 13 mesures DAX filtrables.
- CSV agrégés (produits depuis les 30 000 dossiers officiels via GitHub Actions, sans identifiants individuels).
- Actualisation et CI ; tests Python, schémas et réconciliations indépendantes.

## Dénominateurs et pièges évités

- Le **taux de défaut** est `SUM(default_count) / SUM(client_count)` ; il reste exact après filtre de segment.
- La **part de retard** est `SUM(delayed_clients) / SUM(client_observations)` ; les mois 2005 correspondent aux mêmes 30 000 clients.
- Une **limite de crédit** ne mesure ni les tirages ni l'encours ; le total peut servir à décrire les limites accordées, pas les actifs du bilan.
- Les chiffres UCI de 2005 n'estiment pas le risque 2026 d'une banque française.
- Aucun algorithme automatique de décision individuelle n'est produit en B2.

## Critères de recette Windows

1. Ouvrir PBIP sur un Power BI Desktop prenant en charge PBIR (pas besoin d'authentification Fabric pour Desktop local).
2. Actualiser les sources Web agrégées publiques et examiner les éventuelles erreurs de requêtes M / parsing TMDL.
3. Confirmer : Dossiers = 30 000 ; Défauts = 6 636 ; Taux = 22,12 %, et montants en NTD.
4. Changer les filtres Age / CreditLimit / Status ; vérifier les cartes, les distributions et les taux recalculés.
5. Confirmer que les points mensuels sont ordonnés avril à septembre et que chaque dénominateur mensuel totalise 30 000.
6. Contrôler contrastes, libellés, débordements, interactions et enregistrer une copie PBIX si désiré.

**Clôture B2 = CI vert + recette visuelle Desktop.** Ne pas annoncer 100 % uniquement sur la base des tests statiques.
