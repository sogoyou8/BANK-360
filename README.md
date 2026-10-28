# BANK 360 — Banking Intelligence & Risk Analytics

**DATA 05 — B0 / B1 / B2 / B3 / B4** · 28 octobre 2026

## Situation réelle

- [x] **B0** : cadrage, inventaire des sources, règles métier et architecture
- [x] **B1 — Implémentation** : ETL Python, schéma SQL, vues Gold, exports Power BI, 16 tests automatisés, démonstration contrôlée
- [x] **B1 — Homologation sur les 30 000 dossiers UCI** : validation officielle réussie via GitHub Actions, le 28 octobre 2026.
- [x] **B2 — Power BI Credit Risk : TERMINÉ ET RECETTÉ (28/10/2026)**. PBIP/PBIR/TMDL, 4 pages, 13 mesures DAX, agrégats UCI officiels, CI réussie et validation visuelle/interactive Power BI Desktop sur captures et vidéos. Les indicateurs sectoriels EBA restent un chantier distinct.
- [x] **B3 — Credit Risk Analytics : TERMINÉ (28/10/2026)**. Étude de prédiction de défaut historique, trois approches comparées, train/validation/test 18k/6k/6k, audit de biais descriptifs et résultats agrégés ; aucun scoring bancaire réel.
- [x] **B4 — Fraud Analytics : TERMINÉ (28/10/2026), simulation PaySim uniquement**. 6 362 620 transactions simulées, modèles comparés, validation chronologique, métriques, contrôles de fuite, déciles et audits d'alertes. Aucune décision, aucun scoring réel ou déploiement.
- [ ] B5 : cockpit Web
- [ ] B6 : finalisation et portfolio

### Recette B1 sur données historiques réelles

- **Statut : PASS** — [GitHub Actions : import de l'archive officielle UCI](https://github.com/sogoyou8/BANK-360/actions/runs/40661255296).
- **30 000 dossiers clients** importés, **6 636 défauts historiques** (22,12 % dans cet échantillon).
- **13 contrôles SQL réussis** ; 16 tests Python exécutés sur données synthétiques, également réussis.
- Les exports et le rapport qualité du traitement réel sont disponibles comme *artifact* de l'exécution GitHub Actions (conservation temporaire). Aucune donnée client UCI réelle n'est commise dans le dépôt.
- Les données concernent Taïwan en 2005 ; ce taux ne décrit **ni** le marché français actuel **ni** le ratio réglementaire de créances non performantes.

Le code est opérationnel avec CSV au schéma UCI (Python 3.10+ / SQLite 3, **aucune installation Python externe pour le CSV**). Le ZIP et le XLS officiels nécessitent les dépendances `requirements-uci.txt`. SQLite est utilisé en B1 à la place de DuckDB pour permettre une exécution sans installation ni serveur. Les CSV sont prêts à être importés dans Power BI.

## Exécution sur Windows PowerShell (cas normal)

Depuis le dossier extrait `BANK-360-B1` :

```powershell
Set-Location "C:\chemin\vers\BANK-360-B1"
python -m pip install -r requirements-uci.txt
python -m bank360 run --source official
python -m bank360 validate
python -m unittest discover -s tests -v
```

Cela télécharge **l'archive d'origine UCI**, importe les 30 000 lignes, rejette un fichier non conforme et génère le rapport de qualité plus les CSV. Le téléchargement ne fonctionne que si l'ordinateur dispose d'un accès Internet autorisé.

En cas d'indisponibilité de l'archive officielle, utiliser **explicitement** le miroir CSV (pas de substitution silencieuse) :

```powershell
python -m bank360 run --source mirror
```

Le miroir est un exemplaire de diffusion tiers attribué à l'ensemble UCI ; `origin_claim=mirror` et le SHA-256 du fichier figurent dans le rapport. Si tu disposes déjà du fichier UCI :

```powershell
python -m bank360 build --input "C:\chemin\UCI_Credit_Card.csv" --origin local-unknown
```

Le processus **n'écrase aucun livrable existant en cas d'échec des contrôles avant export**.

## Ce que B1 produit

| Chemin | Utilité |
|---|---|
| `data/raw/` | Source brute et inchangée, non versionnée |
| `data/bank360.sqlite` | Base SQLite locale avec 1 table Silver + vues Gold |
| `data/silver/silver_credit_clients.csv` | 25 colonnes canoniques, grain client |
| `data/gold/gold_credit_clients.csv` | Table client enrichie pour BI |
| `data/gold/gold_credit_overview.csv` | KPI globaux historiques |
| `data/gold/gold_credit_status_segments.csv` | Segments par code de retard septembre |
| `data/gold/gold_credit_age_segments.csv` | Segments d'âge |
| `data/gold/gold_credit_limit_segments.csv` | Tranches de plafond de crédit |
| `data/gold/gold_credit_payment_history.csv` | 6 observations mensuelles par client (non indépendantes) |
| `data/gold/gold_credit_monthly_status.csv` | Indicateur mensuel descriptif de retard |
| `data/gold/B1-export-manifest.json` | Hash SHA-256 et nombre de lignes pour chaque export |
| `reports/B1-quality-report.json` | Résultats vérifiés, contrôles, avertissements, provenance |

## SQL et critères de qualité

- `sql/01_schema.sql` : schéma strict, clés, contraintes d'intégrité
- `sql/02_gold_views.sql` : vues analytiques et agrégats reproductibles
- `sql/03_integrity_checks.sql` : 13 tests SQL devant tous retourner zéro
- `bank360/` : acquisition, parsing CSV/XLS, contrôles, réconciliation Python↔SQL, CLI
- `tests/test_pipeline.py` : 16 tests d'intégration sans réseau
- `docs/B1-realisation.md` : méthodes, limites, reproductibilité et statut
- `powerbi/README.md` : guide de préparation pour B2

Les valeurs d'origine `EDUCATION=0/5/6`, `MARRIAGE=0`, les codes de paiement -2/-1/0, et les soldes de facture négatifs ne sont pas inventés ni supprimés : ils sont préservés et signalés.

## Démonstration hors réseau

Un jeu de **24 enregistrements entièrement fictifs** et sa sortie sont disponibles dans `examples/`. Ce jeu sert seulement à vérifier le fonctionnement du code. Les exports portent explicitement la provenance `SYNTHETIC_B1_TEST` ; **ils ne représentent pas les mesures de l'échantillon UCI**.

```powershell
python -m bank360 build --input examples/demo_credit_24.csv --origin synthetic-test --demo --expected-rows 24 --output-dir examples/demo-output
python -m bank360 validate --db examples/demo-output/data/bank360.sqlite
```

## Interdictions analytiques

1. Aucune jointure entre clients UCI, transactions PaySim et indicateurs EBA.
2. Taux de défaut UCI ≠ ratio réglementaire NPL ; `LIMIT_BAL` ≠ encours de crédits.
3. Population Taiwan 2005 ≠ clientèle française 2026 ; ne pas extrapoler.
4. Aucune décision d'octroi/refus de crédit ; finalité démonstrative exclusivement.
5. Le code est visible sur ce dépôt GitHub public ; aucun déploiement applicatif n'a été effectué.

**Source originale / attribution** : I-Cheng Yeh (2009), *Default of Credit Card Clients*, UCI Machine Learning Repository, DOI [10.24432/C55S3H](https://doi.org/10.24432/C55S3H), licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Les noms de colonnes, vues et agrégations constituent des adaptations attribuées à BANK 360.

## B4 — Fraud Analytics PaySim : expérimentation validée

- **Exécution PaySim Kaggle complète :** [GitHub Actions — PASS](https://github.com/sogoyou8/BANK-360/actions/runs/40696747283) ; [rapport final](docs/B4-validation-finale.md) ; [carte du modèle](reports/b4/B4-model-card.md).
- **6 362 620 transactions simulées / 8 213 étiquettes de fraude**, non liées aux dossiers UCI.
- **Test chronologique : 100 353 transactions, 1 488 fraudes** ; Gradient Boosting PR-AUC **0,3651**, ROC-AUC **0,9200** ; au seuil de validation (volume d'alertes 0,5 %), **790 alertes** dont **413 vraies** et **377 fausses** ; **1 075 fraudes manquées**.
- **Avertissement :** la prévalence de fraude passe de 0,0886 % dans le train à 1,4828 % sur le test ; la probabilité moyenne prédite sur test (0,2459 %) sous-estime fortement cette fréquence. Les performances ne sont pas calibrées pour un usage réel.
- La sélection, les seuils, les audits et tous les exports sont strictement expérimentaux, agrégés, sans transaction individuelle. **Aucune banque réelle** ni transaction réelle.

## B3 — Credit Risk Analytics : expérimentation officielle vérifiée

- [Modèle et interprétation B3](reports/b3/B3-model-card.md) · [Protocole](docs/B3-protocole.md) · [Rapport de clôture](docs/B3-validation-finale.md)
- [Exécution GitHub Actions officielle — PASS](https://github.com/sogoyou8/BANK-360/actions/runs/40694443901)
- **Modèle retenu sur validation :** Histogram Gradient Boosting. **Test indépendant 6 000 dossiers :** ROC-AUC 0,7758 ; PR-AUC 0,5486 ; Brier 0,1359, contre PR-AUC 0,2212 et Brier 0,1723 pour la référence.
- Seuil de **0,13** sélectionné sur validation pour optimiser F2 (non bancaire) : rappel 85,2 % mais 2 465 faux positifs sur 4 673 non-défaillants au test ; **non adapté à une décision réelle**.
- Export seulement d'agrégats : déciles, calibration, importance des variables et audit sexe/âge (les attributs sensibles ne sont pas utilisés par les modèles). Pas de données individuelles, pas de modèle déployé.
- Résultats **Taïwan 2005 seulement**, aucun transfert démontré à une banque française actuelle.

## B2 — Rapport Power BI natif

**Statut final : CLOTURÉ (28/10/2026).** Recette Power BI Desktop réussie sur l'ordinateur utilisateur : 4 pages visibles, 2 contrôles qualité affichés à 1, interactions graphiques et tableaux vérifiées, sélection `18-29` dans le menu Tranche d'âge donnant 9 618 dossiers / 2 197 défauts / 22,8 %. Voir [preuve de recette](docs/B2-validation-finale.md). Le fichier PBIP est versionné ; aucune publication sur Power BI Service ni preuve d'ouverture d'un PBIX exporté n'est revendiquée.

Le projet est dans [`powerbi/BANK-360/BANK-360.pbip`](powerbi/BANK-360/BANK-360.pbip). Voir [`powerbi/README.md`](powerbi/README.md) pour son ouverture et les sources.

- [Tests GitHub B2 réussis](https://github.com/sogoyou8/BANK-360/actions/runs/40662864649)
- [UCI350 : agrégats officiels créés, contrôlés et versionnés](https://github.com/sogoyou8/BANK-360/actions/runs/40662864723)
- 30 000 dossiers historiques · 6 636 défauts · 196 segments · 1 176 groupes mensuels

**Remarque :** GitHub Actions contrôle le modèle et les données ; il ne peut pas confirmer l'affichage dans Power BI Desktop. Aucun déploiement de rapport ou application n'a été effectué.
