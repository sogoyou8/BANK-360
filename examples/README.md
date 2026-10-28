# Démonstration locale — valeurs fictives uniquement

Le fichier `demo_credit_24.csv` a été généré par BANK 360, sans aucun client ou banque réel. Il contient 24 dossiers de démonstration et des statuts volontairement variés pour tester les calculs. Les sorties `demo-output` sont dérivées de ces données synthétiques et ne doivent jamais servir à illustrer le portefeuille UCI réel.

Commande :

```powershell
python -m bank360 build --input examples/demo_credit_24.csv --origin synthetic-test --demo --expected-rows 24 --output-dir examples/demo-output
python -m bank360 validate --db examples/demo-output/data/bank360.sqlite
```
