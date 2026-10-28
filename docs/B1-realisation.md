# B1 — Réalisation Data Engineering et recette

**Dernière vérification : 28 octobre 2026**

## Périmètre réellement réalisé

1. Pipeline Python B1 autonome : téléchargement officiel/mirroir explicite, entrée CSV ou XLS/ZIP, ingestion par lots, validation stricte.
2. 25 colonnes conservées (ID + 23 variables + cible), codes et unités renommés sans inventer de valeurs.
3. Source brute immuable, clé d'origine positive unique, rejet des valeurs manquantes et domaines invalides, 30 000 dossiers requis en mode historique.
4. Base SQLite locale avec 1 table Silver, 7 vues Gold et table de traçabilité.
5. Exports CSV UTF-8 BOM (import Power BI), rapport qualité JSON et manifeste d'empreintes SHA-256.
6. Recalcul indépendant des totaux Python et SQL ; vérifications d'agrégation, de grain et d'idempotence.
7. Tests automatiques (12 tests positifs/négatifs), exécution synthétique réussie.

## Limitations d'environnement et seuils de validation

La session de préparation ne possède pas de résolution DNS / accès de téléchargement direct et ne permet pas d'installer de nouvelles bibliothèques. Les fichiers source UCI d'origine et CSV miroir ne peuvent pas y être acquis. L'archive livrée contient **le pipeline réellement exécuté sur fixture synthétique**, et non les 30 000 lignes historiques. L'import d'origine `xls` est implémenté mais non testé dans cette session (dépendance `xlrd` indisponible).

**Conclusion de recette B1 :** implémentation et tests hors-réseau **PASS** ; validation sur jeu original UCI 30k **NON EFFECTUÉE**. Ne pas annoncer « B1 homologuée sur 30k » avant succès de `python -m bank360 run --source official` suivi de `validate`.

## Garanties d'intégrité

- **Grain :** 1 ligne = 1 dossier historique de client UCI ; 6 lignes mensuelles dérivées par dossier dans la vue de paiements (pas 6 nouveaux clients).
- **Clé :** `credit_client_id` unique et non nul ; les comptes EBA/PaySim ne sont pas liés.
- **Types :** conversion entière stricte (notation scientifique acceptée), sans arrondi silencieux.
- **Domaine :** âge 18–110, crédit >0, codes `SEX` 1/2, `EDUCATION` 0–6, `MARRIAGE` 0–3, statut -2–9, paiements >=0, cible 0/1.
- **Exceptions documentées :** les factures négatives et codes non documentés sont conservés et comptabilisés en avertissements (sans imputation ni suppression).
- **Répétabilité :** les exports CSV sont triés et stables ; SHA256 vérifiable dans `B1-export-manifest.json`.
- **Contrôles :** vérification que les compteurs et totaux indépendants calculés en Python concordent avec les requêtes SQL.
- **Rejet :** un fichier incomplet, erroné ou dont la volumétrie n'est pas de 30k est rejeté (hors démo explicitement balisée).

## KPI calculés

| KPI Gold | Formule | Précaution |
|---|---|---|
| `client_count` | `COUNT(*)` | Clients historiques UCI uniquement |
| `default_count` | `SUM(default_next_month)` | Étiquette 2005, pas NPL |
| `default_rate_pct` | `100*AVG(default_next_month)` | Pourcentage, pas proportion décimale |
| `delayed_september_count` | `SUM(pay_status_2005_09 >= 1)` | Retard de paiement en septembre selon codes UCI |
| `delayed_september_rate_pct` | `100*AVG(delayed_september_flag)` | Un seul mois ; pas comparable à NPL |
| `total_credit_limit_ntd` | `SUM(limit_bal_ntd)` | Limites de crédit NT$, pas encours |

## Résultat du test de bout en bout sur fixture SYNTHÉTIQUE

- 24 clients fictifs, 6 cibles positives, 8 retards septembre.
- 25% de défaut **fictif** ; total fictif des plafonds 1 500 000 unités.
- 144 observations mensuelles dérivées (24 × 6).
- 13 contrôles SQL à zéro ; 16 tests automatiques réussis.
- Ces valeurs n'apparaissent **pas** dans le reporting professionnel UCI ; leur seul but est de prouver la cohérence du code.

## Pour terminer l'homologation sur données réelles (Windows)

```powershell
python -m pip install -r requirements-uci.txt
python -m bank360 run --source official
python -m bank360 validate
python -m unittest discover -s tests -v
```

La sortie attendue doit indiquer `dataset_kind=real_historical_UCI350`, `client_count=30000`, tous les contrôles à zéro, et une provenance avec hash source. Le rapport qualité sera alors le seul document autorisé à publier les KPI réels calculés (sous réserve de la licence et de la validation de B2).

## Risques restant pour B2

- Vérifier les égalités DAX/SQL pour chaque KPI et l'encodage CSV UTF-8.
- Réaliser un contrôle visuel du rapport Power BI sur données **réelles**, pas sur les fixtures.
- Ne pas additionner des limites de crédit dans des visuels laissant penser à un encours bancaire.
- Les séries EBA doivent rester séparées et être ingérées avec un contrat de donnée distinct.
