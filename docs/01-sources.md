# B0 — Registre des sources

_Date de revue : 28 octobre 2026._

## D1 — UCI Default of Credit Card Clients

- Site officiel : https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients
- Identifiant UCI : **350**. 30 000 dossiers, 23 variables explicatives, une étiquette de défaut le mois suivant.
- Population : clients de cartes de crédit **taïwanais** ; historique de paiements d'avril à septembre **2005**.
- Usage : **risque de crédit historique** et prototype de classification.
- Licence indiquée par UCI : **CC BY 4.0** avec attribution.
- Attention : montants en **dollars taïwanais** ; plafond autorisé ≠ encours de prêt. La cible est le défaut du mois suivant, pas un ratio NPL bancaire réglementaire.
- Statut : **identifié et vérifié sur catalogue**, fichiers non téléchargés dans ce kit.

## D2 — EBA Risk Dashboard

- Source : https://www.eba.europa.eu/risk-and-data-analysis/risk-analysis/risk-monitoring/risk-dashboard
- Publication récente vérifiée : tableau de bord **T2 2026**, avec annexe XLS.
- Population : échantillon de banques UE/EEE ; indicateurs réglementaires **agrégés**.
- Usage : **pilotage sectoriel**, NPL, CET1, rentabilité, coût du risque, etc. selon série/annexe réellement disponible.
- Attention : définitions publiées par l'EBA, millésimes, unités et pays doivent être extraits des métadonnées avant calcul.
- Statut : source et annexe repérées ; parseur non développé.

## D3 — PaySim, transactions synthétiques

- Source d'origine : https://www.kaggle.com/datasets/ealaxi/paysim1
- Auteur : Edgar Alonso López-Rojas. Licence annoncée **CC BY-SA 4.0** sur la page Kaggle.
- Transactions **simulées** de mobile money. Ne représente pas une banque française ni des paiements réels au niveau individuel.
- Usage : **fraude transactionnelle simulée**, contrôle des faux positifs.
- Volume important (plusieurs millions de lignes) : importer en lots et ne pas versionner la donnée brute.
- Précaution essentielle indiquée par la source : ne pas utiliser les soldes post-transaction pour prédire la fraude s'ils créent une fuite d'information.
- Statut : source identifiée, accès Kaggle et téléchargement à traiter en B4.

## D4 — Banque de France Webstat (option France)

- Catalogue : https://www.data.gouv.fr/dataservices/webstat
- API ouverte **avec compte** selon data.gouv.fr ; accès non encore configuré.
- Usage : comparaisons françaises sur taux de crédit, épargne et contexte macroéconomique.
- Statut : optionnel ; pas une dépendance bloquante du MVP.

## D5 — BCE (alternative accessible pour séries macro)

- API ECB SDMX : https://data.ecb.europa.eu/help/api/overview
- Séries agrégées accessibles via service API documenté.
- Usage : données contextuelles distinctes du portefeuille UCI et des transactions PaySim.

## Règle de visualisation

**Ne pas additionner ni comparer directement** des indicateurs qui ont une population, une devise, une période ou une définition différente. Utiliser des badges de source dans chaque espace métier et une documentation des filtres.
