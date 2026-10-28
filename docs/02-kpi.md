# B0 — Dictionnaire KPI version 0.1

Les indicateurs ci-dessous sont des **définitions de travail**. Ils ne disposent pas encore de résultats calculés.

## Domaine Crédit — UCI 350

| KPI | Formule | Grain/Population | Unité | Avertissement |
|---|---|---|---|---|
| Nombre de dossiers | `COUNT(DISTINCT id)` | Enregistrements UCI | clients | Contrôler l'unicité de l'ID avant calcul. |
| Taux de défaut du mois suivant | `SUM(default_next_month) / COUNT(*)` | Clients UCI avec cible connue | % | Étiquette historique 2005 ; ne pas appeler « NPL ». |
| Retard observé en septembre | `SUM(pay_0 >= 1) / COUNT(valid_pay_0)` | UCI avec statut valide | % | Définir précisément codes négatifs et 0. |
| Plafond de crédit total | `SUM(limit_bal)` | UCI, NT$ | NT$ | Ce n'est pas un encours réel de prêts. |

### Garde-fous crédit
- Taux de valeurs manquantes sur les champs critiques.
- Nombre d'identifiants clients dupliqués.
- Distribution de la cible dans les sous-ensembles d'entraînement et de test.
- Pour les modèles : courbes de calibration, évaluation par sous-groupes, interdiction de conclusions décisionnelles réelles.

## Domaine Fraude — PaySim (B4)

| KPI | Formule | Unité | Notes |
|---|---|---|---|
| Taux de fraude simulée | `fraud = 1 / N transactions` | % | Seulement sur PaySim. |
| Rappel (recall) | `TP / (TP + FN)` | % | Fraudes détectées parmi les fraudes simulées. |
| Précision | `TP / (TP + FP)` | % | Alertes correctes parmi les alertes produites. |
| Faux positifs | `FP` | alertes | Toujours présenter avec le volume de transactions. |
| PR-AUC | Aire sous la courbe précision-rappel | indice | Plus informative que l'accuracy seule en cas de classes rares. |

### Garde-fous fraude
- Séparation train/test chronologique si la structure temporelle le permet.
- Prévenir toute fuite de la cible dans les caractéristiques.
- Ne jamais présenter les métriques sur transactions simulées comme une performance bancaire réelle.

## Domaine Secteur — EBA (B2/B5)

- **CET1 ratio** : reprendre directement la définition réglementaire et l'unité de la série EBA.
- **NPL ratio** : reprendre directement la définition réglementaire et l'unité de la série EBA.
- **ROE** : afficher la série EBA en précisant période et population.

Ne pas fabriquer des dénominateurs réglementaires avec la base UCI.
