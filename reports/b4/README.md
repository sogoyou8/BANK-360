# B4 — Fraud Analytics (PaySim simulé)

**B4 validé le 28 octobre 2026 pour l'étude expérimentale de PaySim**, après import officiel complet et exécution réussie du [workflow GitHub Actions](https://github.com/sogoyou8/BANK-360/actions/runs/40696747283). Tous les résultats sont agrégés, jamais des enregistrements réels ni individuels. [Rapport de clôture](../../docs/B4-validation-finale.md).

- `B4-metrics.json` : provenance, invariants, split temporel, métriques des deux modèles, performance au seuil validation, comparaison à `isFlaggedFraud`.
- `B4-model-card.md` : interprétation de l'analyse et limites.
- `B4-alerts-by-type.csv` : alertes et fausses alertes par type d'opération, agrégées.
- `B4-alerts-by-simulated-day.csv` : alertes par groupe de 24 étapes, agrégées.
- `B4-risk-deciles.csv` : distribution des défauts simulés par décile de score, agrégée.

Ne publier ni identifiant de transaction, ni enregistrement individuel, ni prédiction ou modèle binaire. [Protocole complet](../../docs/B4-protocole.md).

**Réserve majeure :** dérive de prévalence 0,0886 % → 0,6175 % → 1,4828 % (train, validation, test). Moyenne des probabilités prédites sur le test 0,2459 % seulement, donc **sous-calibration importante**. Le modèle classe, mais les scores ne sont ni calibrés ni transférables à des opérations bancaires réelles.
