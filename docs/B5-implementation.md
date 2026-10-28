# BANK 360 — B5 (Application Web) : contrat d'implémentation

## Objectif

Application de portfolio React 18 + TypeScript + Vite. **11 pages fonctionnelles** regroupées en six ensembles dans un dock flottant inspiré de la sélection Aurora / Spatial Workspace / Atlas : accueil, crédit (portefeuille, segments, risque, paiements), fraude (analyse, investigations), intelligence (modèles, exploration), gouvernance (qualité, rapports & paramètres).

## Jeux de données (strictement séparés)

- **Crédit UCI350 / Taïwan 2005** : le projet Vite charge les CSV B2 depuis `powerbi/data` lors de la compilation. 196 groupes âge × limite × statut, 1 176 groupes de paiement mensuel ; 30 000 dossiers, 6 636 défauts. Taux recalculés *à partir des numérateurs et dénominateurs* après filtrage. Pas de dossiers individuels ni de scoring personnel.
- **Fraude PaySim simulée** : le bundle compile les rapports agrégés de `reports/b4` produits par GitHub Actions (6 362 620 transactions, 8 213 fraudes simulées). Les alertes et déciles concernent le **test chronologique uniquement** (100 353 transactions) ; pas de pseudo-alertes individuelles.
- **Modèles B3 et B4** : indicateurs ROC-AUC, PR-AUC et Brier repris exclusivement des JSON publiés sur GitHub ; modèles non exécutés dans le navigateur.

La visualisation Atlas est **schématique, non une carte de clients ou une preuve géographique**. Aucune latitude/longitude n'existe dans ces agrégats. Les graphiques ne montrent pas de comparaison fictive à une « période précédente ».

## Fonctionnalités

- Palette de navigation `Ctrl/Cmd + K`, navigation par souris/clavier, dock extensible, version mobile, préférences clair/sombre.
- Filtres âge, tranche de crédit, statut de paiement répercutés sur KPI, graphiques, paiements et exports de l'univers crédit.
- Navigation contextuelle depuis les graphiques, reset, exploration et tri des agrégats.
- Fraude : investigation **par canal agrégé**, précision et rappel du modèle au seuil fixé sur validation ; avertissement de dérive et de sous-calibration.
- Page qualité : contrôles de concordance, liens vers les analyses B2/B3/B4 ; aucune prétention de fonctionnement bancaire en temps réel.
- Exports CSV des **seuls agrégats** ; aucun export client individuel.

## Exécution locale

Depuis la racine du dépôt :

```powershell
cd web
npm install
npm run test
npm run build
npm run dev
```

Ouvrir `http://127.0.0.1:5173`. En CI, `npm ci` remplace `npm install` **une fois un `package-lock.json` généré** ; le workflow initial utilise `npm install` pour créer le lock, puis exécute les tests et la compilation. Aucun endpoint privé ni secret nécessaire, les fichiers sont embarqués à la compilation. Pour une publication ultérieure, le répertoire à publier sera `web/dist`.

## Recette à compléter sur Windows

Vérifier le rendu réel à 1440 × 900 et sur mobile ; le contraste du mode clair ; l'ouverture de chaque page ; la navigation au clavier ; les filtres `18-29` (9 618 dossiers, 2 197 défauts) puis remise à Tout ; 180 000 observations de paiement sans filtre ; la sélection d'un canal fraude ; les exports CSV et les liens de provenance ; la séparation stricte des champs UCI/PaySim. Les tests de structure ne remplacent pas cette vérification visuelle.

**Aucun déploiement** et aucune connexion bancaire réelle dans B5. B6 finalisera l'acceptation et les éléments de portfolio.
