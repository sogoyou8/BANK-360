# BANK 360 — préparation Power BI (B2)

B1 ne contient **pas** de rapport `.pbix` ; ce sera le livrable B2. Les données Gold sont disponibles après `python -m bank360 run`.

## Fichiers Power BI à importer

- `data/gold/gold_credit_clients.csv` (détail pour slicers / visualisations segmentées)
- `data/gold/gold_credit_overview.csv` (chiffres de référence SQL ; éviter de les additionner)
- `data/gold/gold_credit_status_segments.csv` (retards septembre)
- `data/gold/gold_credit_age_segments.csv` et `gold_credit_limit_segments.csv` (cohortes)
- `data/gold/gold_credit_monthly_status.csv` (six mois historiques ; non cohortes indépendantes)

Utiliser l'encodage **UTF-8** et le séparateur `,`. Ne pas construire de relations inter-tables arbitraires qui multiplient les lignes. Les KPI globaux calculés à partir du détail doivent égaler `gold_credit_overview.csv`.

## Mesures DAX proposées pour vérification B2

```dax
Clients = DISTINCTCOUNT(gold_credit_clients[credit_client_id])
Défauts historiques = SUM(gold_credit_clients[default_next_month])
Taux défaut (%) = 100 * DIVIDE([Défauts historiques], [Clients])
Retards septembre = SUM(gold_credit_clients[delayed_september_flag])
Taux retards septembre (%) = 100 * DIVIDE([Retards septembre], [Clients])
Plafonds totaux (NTD) = SUM(gold_credit_clients[limit_bal_ntd])
```

Mettre en **nombre décimal** les deux mesures déjà multipliées par 100, avec le suffixe `%` sans appliquer une multiplication additionnelle. Ou utiliser une mesure en fraction, format `0.0%` ; ne pas faire les deux.

Afficher dans chaque page : `UCI350 · Taïwan 2005 · devise NTD · historique, démonstratif` et le type de donnée (réelle historique / synthétique de test). Les identifiants client sont techniques et ne doivent pas être affichés en libre consultation dans les pages publiques.
