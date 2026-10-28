# B4 — Fraud Analytics (PaySim simulé)

Le workflow `BANK 360 — B4 official PaySim fraud research` produit les livrables de **recherche uniquement** ci-dessous après un import complet du jeu de données PaySim. Si l'accès public à Kaggle échoue, aucun résultat réel n'est publié et le statut reste **non validé**.

- `B4-metrics.json` : provenance, invariants, split temporel, métriques des deux modèles, performance au seuil validation, comparaison à `isFlaggedFraud`.
- `B4-model-card.md` : interprétation de l'analyse et limites.
- `B4-alerts-by-type.csv` : alertes et fausses alertes par type d'opération, agrégées.
- `B4-alerts-by-simulated-day.csv` : alertes par groupe de 24 étapes, agrégées.
- `B4-risk-deciles.csv` : distribution des défauts simulés par décile de score, agrégée.

Ne publier ni identifiant de transaction, ni enregistrement individuel, ni prédiction ou modèle binaire. [Protocole complet](../../docs/B4-protocole.md).
