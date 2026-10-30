# BANK 360 — B5 · Aurora Spatial Atlas

Application React 18 + TypeScript, développée sans backend bancaire ni infrastructure payante.

## Démarrage

```sh
cd web
npm install
npm run test
npm run build
npm run dev
```

Le rendu est disponible sur `http://127.0.0.1:5173`. Pour les tests de navigateur : `npx playwright install chromium` puis `npm run test:e2e` (ou via GitHub Actions).

## Navigation

8 pages / 6 sections : Vue d’ensemble ; **Crédit unifié** (Portefeuille & segmentation, avec 3 perspectives internes Vue globale / Risque / Paiements) ; Détection de fraude, Analyse des alertes ; Modèles & performance, Explorateur de données ; Qualité & traçabilité ; Rapports & préférences. Les trois anciennes pages Crédit deviennent une seule page interactive : filtres communs et six modules.

Dock de navigation permanent, de largeur fixe (92 px desktop) et barre d'icônes fixe en bas sur mobile. Les sous-pages s'affichent dans un panneau flottant **sans redimensionner le cockpit**. Palette `Ctrl/Cmd + K`, interface adaptable et deux thèmes.

La navbar n'est plus dépliable : aucun bouton de réduction/extension. Ouvrir une section affiche uniquement ses sous-pages en superposition ; `Escape` ou un clic hors du menu le ferme.

## Contrat de données

Les données sont **embarquées à la compilation à partir des fichiers versionnés dans le dépôt** : `powerbi/data/uci350_segments.csv`, `powerbi/data/uci350_payment_months.csv`, `reports/b3/` et `reports/b4/`. Les fichiers UCI réels client-par-client et les transactions PaySim individuelles restent exclus. L'Atlas n'est qu'une illustration : aucune donnée géographique ne sous-tend les cartes.

L'application présente des études d'analyse historique et de simulation. **Pas un outil bancaire opérationnel, pas un modèle de décision de crédit, pas un service de détection de fraude en production**.

### Prévisualisation autonome

`npm run build && npm run standalone` produit un fichier `dist/BANK-360-B5-APERCU-LOCAL.html` entièrement autonome. Dans GitHub Actions, il est fourni dans le téléchargement `bank360-b5-static-preview`. Il s'ouvre directement dans Chrome sans serveur local.

## UX mono-écran — B5.R

Sur desktop (largeur d'au moins 1120 px et hauteur utile d'au moins 720 px), chaque page occupe l'écran sans scroll global. Les tables scrollent à l'intérieur de leurs panneaux. Sur mobile, le contenu est volontairement vertical pour éviter tout écrasement des graphiques. Navigation permanente à six sections, popovers hors flux et palette clavier. L'interface ne montre aucun numéro de phase ni faux statut temps réel. Consulte `docs/B5R-architecture.md` pour le contrat.

## Finition R2

Les huit vues utilisent désormais des compositions différentes selon l'activité (synthèse, crédit, risques, fraude, gouvernance, rapports), et non une grille de cartes répétée. Les graphiques quantitatifs affichent zéro et des repères numériques, la série des paiements utilise une échelle démarrant à zéro, et l'écran des modèles distingue explicitement métriques de **test** et comparaisons de **validation**. La calibration met côte à côte score moyen prédit et taux réellement observé. Les contrôles de navigation ont un matériau translucide, les surfaces analytiques sont plus opaques, et le thème clair a été renforcé. La recherche sert exclusivement à accéder à une page.

## R3 — Finition métier ciblée

- Rapports et Qualité : panneaux calibrés sur la quantité réelle de contenu, sans cartes vides ni données ajoutées artificiellement.
- Modèles : comparaisons PR-AUC de validation de hauteur compacte ; les autres onglets continuent d'afficher les variables, la calibration et l'audit.
- Retards septembre : légende lisible des codes UCI sans invention de sens pour les codes `-2` et `0`. Les valeurs d'origine restent inchangées dans les filtres/exportations.
- Graphiques de défaut par âge, plafond et code : `n=` dossiers affiché avec chaque taux. Aucun indicateur supplémentaire factice.
- Mono-écran conservé sur desktop, mobile scrollable.

## Crédit unifié (B5, écran 02)

- Une seule route `portfolio` ; modes internes `Vue globale / Risque / Paiements` ; le bouton Crédit du dock et les liens Accueil/Risque conservent leur fonctionnement.
- Six panneaux en grille à trois colonnes : Âge, Évolution des retards, Détail portefeuille, Plafond, Statuts septembre et Détail mensuel.
- Âge × plafond × statut septembre : agrégats de cohorte croisés, avec 6 mois répétés. Réinitialisation, drill-down codes UCI, mesures Dossiers / Défaut, mois inspectable, tableau triable/recherchable, exports agrégés.
- Fond Aurora / surfaces vitrées et relief discret ; mono-écran desktop à 1440×900 et 1672×941, vertical mobile. Voir `docs/B5-credit-unified.md`.
