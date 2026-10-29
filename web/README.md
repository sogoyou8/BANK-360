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

11 pages : Command Center, Portefeuille bancaire, Clients & Segmentation, Risque de crédit, Historique des paiements, Fraud Analytics, Alertes & Investigations, Modèles IA & Performance, Data Explorer, Data Quality & Traçabilité, Rapports & Paramètres.

Dock de navigation permanent, de largeur fixe (92 px desktop) et barre d'icônes fixe en bas sur mobile. Les sous-pages s'affichent dans un panneau flottant **sans redimensionner le cockpit**. Palette `Ctrl/Cmd + K`, interface adaptable et deux thèmes.

La navbar n'est plus dépliable : aucun bouton de réduction/extension. Ouvrir une section affiche uniquement ses sous-pages en superposition ; `Escape` ou un clic hors du menu le ferme.

## Contrat de données

Les données sont **embarquées à la compilation à partir des fichiers versionnés dans le dépôt** : `powerbi/data/uci350_segments.csv`, `powerbi/data/uci350_payment_months.csv`, `reports/b3/` et `reports/b4/`. Les fichiers UCI réels client-par-client et les transactions PaySim individuelles restent exclus. L'Atlas n'est qu'une illustration : aucune donnée géographique ne sous-tend les cartes.

L'application présente des études d'analyse historique et de simulation. **Pas un outil bancaire opérationnel, pas un modèle de décision de crédit, pas un service de détection de fraude en production**.

### Prévisualisation autonome

`npm run build && npm run standalone` produit un fichier `dist/BANK-360-B5-APERCU-LOCAL.html` entièrement autonome. Dans GitHub Actions, il est fourni dans le téléchargement `bank360-b5-static-preview`. Il s'ouvre directement dans Chrome sans serveur local.
