# BANK 360 Data — B1

- `raw/` : fichier UCI brut téléchargé, hors versionnement.
- `silver/` : export CSV des 25 champs canoniques.
- `gold/` : vues analytiques exportées avec manifest SHA-256 et row counts.
- `bank360.sqlite` : base analytique SQLite reproductible.
- `sources.json` : registre des sources et de leur statut.
- `reports/B1-quality-report.json` : résumé qualité de l'exécution réelle.

Seuls les fichiers-source UCI authentiques (et le miroir identifié explicitement) pourront produire un rapport de données historiques ; le jeu de démonstration `examples/` est strictement synthétique. Aucun join entre populations UCI, PaySim et EBA.
