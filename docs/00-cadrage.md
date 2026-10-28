# B0 — Charte de projet

## Objectif

Démontrer un workflow bancaire de bout en bout : collecte contrôlée, qualité, modélisation SQL, indicateurs BI, analyses et restitution métier, puis application Web. Cible professionnelle volontairement généraliste.

## Public cible du produit de démonstration

- **Responsable risques** : défauts historiques, distribution des retards, suivi des segments.
- **Analyste fraude** : investigations, precision/recall, priorisation des alertes.
- **Analyste pilotage** : tendances sectorielles et comparaisons d'indicateurs publiés.
- **Responsable data** : qualité, métadonnées, fraîcheur et traçabilité.

## Trois décisions couvertes

1. **Risque** : quels profils historiques présentent une plus forte fréquence de défaut le mois suivant ? (analyse descriptive, pas de décision individuelle)
2. **Fraude** : quelle règle/modèle permet de retrouver plus d'opérations simulées frauduleuses en limitant les fausses alertes ?
3. **Pilotage** : comment évoluent les indicateurs agrégés de solidité, rentabilité et risque du secteur bancaire européen ?

## MVP de BANK 360

### Parcours A — Crédit
- 1 écran global + 1 écran d'exploration de cohortes
- 1 extract SQL versionné et contrôlé
- 1 page Power BI sourcée

### Parcours B — Fraude (étape ultérieure)
- Vue transactions, filtres, alertes simulées, comparaison des modèles

### Parcours C — Indicateurs bancaires (étape ultérieure)
- Série temporelle EBA et comparaison pays quand le périmètre statistique le permet

## Hors périmètre initial

- Système bancaire réel, paiement bancaire, données client réelles, intégration core-banking.
- Évaluation d'un demandeur de crédit réel ou moteur de refus/acceptation.
- Agrégation fictive du portefeuille UCI avec le secteur européen (aucun lien de population).
- Déploiement, accès public et publication automatique.

## Succès mesurable

1. Données conformes au contrat de qualité documenté.
2. KPI SQL = KPI Power BI pour un même filtre/périmètre.
3. Chaque carte affiche ses **unité, période, provenance et population**.
4. Études de risque/fraude évaluées sur jeux de test indépendants avec métriques explicites.
5. Rapport et application sans affirmations non étayées sur des banques réelles.
