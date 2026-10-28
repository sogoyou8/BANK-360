# B0 — Architecture logique

```text
Sources indépendantes
├── UCI 350 : clients / risque de crédit (2005, Taiwan)
├── PaySim : transactions simulées / fraude
├── EBA : séries sectorielles UE/EEE
└── BCE / BdF : contexte macroéconomique (optionnel)
          │
          ▼
BRONZE : archives brutes conservées hors Git
          │
          ▼
SILVER : schémas harmonisés, unités et contrôles qualité
          │
          ▼
GOLD : tables analytiques séparées par domaine
├── gold_credit_clients + gold_credit_segments
├── gold_fraud_transactions + gold_fraud_evaluation
└── gold_eba_indicators
          │
          ├── Power BI : reporting traçable
          └── BANK 360 Web : interface et exploration
```

## Principes d'implémentation

- **Python** : ingestion, validation, préparation et évaluation modèles.
- **SQL** : tables, vues métier, tests de réconciliation.
- **DuckDB / fichiers Parquet** : stockage analytique local, léger, exploitable sur PC.
- **Power BI** : modèle sémantique, mesures DAX et dashboards.
- **React + TypeScript** : cockpit Web final, sur une API explicite si nécessaire.
- **GitHub** : code et documentation, pas de données brutes volumineuses ni de secrets.

## Modèle analytique v0

### Crédit
- `credit_client_id` : clé technique locale ; pas de relation avec PaySim.
- `default_next_month` : 0 ou 1 ; défaut de paiement le mois suivant.
- `limit_bal_ntd` : plafond, NT$, ne pas renommer en encours.
- `pay_status_2005_09` : code source de statut de paiement.

### Fraude
- `transaction_id` : clé technique locale de PaySim.
- `step_hour` : temps simulé depuis le début ; pas une date réelle.
- `is_fraud` : étiquette simulée.

### Secteur
- Clé `series_id + geography + period + source_version`.
- Stocker la source, l'unité et les notes méthodologiques avec chaque observation.

## Contrainte capitale

Aucune clé fictive de client, banque ou transaction ne doit relier UCI, PaySim et EBA. Le « 360 » désigne la **couverture des thèmes analytiques**, pas une vue client omnicanale d'une banque réelle.
