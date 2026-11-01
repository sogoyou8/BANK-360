# BANK 360 — M4 · Guide pédagogique du projet

## But et audience

Le dashboard BANK 360 vise à démontrer une démarche Data bancaire complète, mais un lecteur non spécialiste peut difficilement en comprendre seul les concepts. La phase **M4** crée une double voie de lecture, sans modifier les cinq vues mono-écran :

1. **Aide contextuelle dans l'application** : bouton `Comprendre le projet`, accessible sur chaque vue ; une explication spécifique de l'objectif, des gestes à faire et des conclusions interdites. Ouverture en boîte de dialogue native `<dialog>` avec retour clavier Escape.
2. **PDF de huit pages** : `web/public/bank360-guide.pdf`, consultable dans un nouvel onglet ou téléchargeable depuis l'aide, lisible dans un navigateur PDF classique. La version HTML autonome embarque ce PDF en base64 pour fonctionner hors ligne.

**Aucune navigation analytique supplémentaire** : l'architecture reste Accueil, Crédit, Fraude, Modèles, Preuves. La boîte de dialogue n'altère ni le filtre actif, ni les métriques de test.

## Contenu du PDF

| Page | Question traitée | Points factuels |
|---|---|---|
| 1 | À quoi sert BANK 360 ? | Deux études indépendantes, historique / simulation |
| 2 | Pourquoi ce projet ? | Sources → qualité → analyses → modèles → preuves |
| 3 | Quelles données ? | UCI : 30 000 dossiers / 6 636 défauts ; PaySim : 6 362 620 transactions / 8 213 fraudes simulées |
| 4 | Où cliquer ? | Les cinq vues et leur fonction |
| 5 | Comment interpréter Crédit ? | 22,12 % de défauts globaux, 25 cellules, six mois répétés ; agrégation pondérée |
| 6 | Comment interpréter Fraude ? | Test 100 353 transactions, 790 alertes, 413 VP, 377 FP, 1 075 FN, précision 52,28 %, rappel 27,76 % |
| 7 | Comment lire Modèles ? | PR-AUC B3 0,5486, B4 0,3651 ; protocoles incomparables, problème de calibration |
| 8 | Quels sont les apports et preuves ? | Limites, compétences, rapports B3/B4, liens de provenance |

La matrice décorative de la page Crédit est explicitement marquée **illustrative** et ne contient aucun taux inventé. Les chiffres et les mises en garde proviennent des validations B3/B4 et du contrat R0–R5.

## Contrats non négociables

- **UCI** : Taïwan 2005 ; les 30 000 dossiers ne sont pas une banque française actuelle ; `taux = somme des défauts / somme des dossiers`.
- **PaySim** : entièrement simulé, indépendant d'UCI ; aucune jointure fictive.
- **Tests** : B3 sur 6 000 dossiers de test stratifiés, B4 sur 100 353 transactions de test chronologique ; comparaison directe des deux PR-AUC interdite.
- **Fraude** : dérive de prévalence entre entraînement et test et probabilités insuffisamment calibrées.
- **Aucune décision réelle**, aucune détection réelle, aucun déploiement bancaire, aucune certification réglementaire implicite.

## Accès, dégradation et aperçu hors ligne

- Depuis l'Accueil : bouton `Comprendre le projet` dans les entrées de découverte.
- Depuis toutes les vues : bouton identique dans l'en-tête.
- Boutons de la boîte de dialogue : `Consulter le PDF · 8 pages` et `Télécharger le PDF`.
- En web : le fichier est servi depuis `./bank360-guide.pdf` ; son accès n'exige ni backend ni connexion à une banque.
- En prévisualisation autonome : `web/scripts/standalone.mjs` embarque le contenu de `dist/bank360-guide.pdf` dans le HTML. Le navigateur crée un Blob PDF uniquement au clic. Le téléchargement et l'ouverture ne dépendent pas d'un site distant.

## Vérifications de clôture

- PDF valide, huit pages, texte lisible, liens de source ; pas de fonds/chiffres masqués, pas de chevauchements.
- Affichage du PDF en ligne et téléchargement direct.
- Aide rédigée et adaptée aux cinq vues, clavier Escape et fermeture.
- Mono-écran desktop conservé malgré la troisième entrée d'Accueil ; mobile garde son défilement normal.
- Non-régression des analyses, exports CSV/XLSX, B5 classique et X1.
- Tests `web/e2e/guided-m4-project-guide.spec.ts`, B1, B3 et suite B5 complète sur le même HEAD.

## Publication

La PR #25 reste **en brouillon**. Aucune fusion vers `main`, aucun déploiement et aucune configuration publique tant que le propriétaire du projet n'a pas validé la livraison et sa destination.
