# BANK 360 — M1 : cinq vues mono-écran (desktop)

## Intention validée
Après validation et recette du Risk Analytics Lab R0–R5, l'utilisateur demande de conserver les **cinq vues fonctionnelles** mais de les afficher sans scroll vertical global sur ordinateur.

**Ne pas remettre Crédit et Fraude dans un même cockpit.** Mono-écran signifie **une vue par écran**, pas toutes les analyses sur une page.

## Contrat de disposition

- Activation desktop : largeur >= 901 px et hauteur >= 650 px ; cible testée 1280×720, 1440×810, 1648×928.
- Nav latérale et barre supérieure toujours visibles, corps de chaque vue à hauteur du viewport, aucun scroll vertical global ni débordement horizontal.
- **Accueil** : contexte, deux études indépendantes, accès Modèles/Preuves sur la même surface.
- **Crédit** : KPI + filtres ; matrice de 25 cellules à gauche ; lecture de la cohorte et six mois de retards à droite ; exports et détail agrégé via barre inférieure. Ne pas masquer les dernières cases.
- **Fraude** : KPI, axe Jour OU Type, graphe + lecture à droite ; avertissement de dérive visible ; détails par groupe et exports contextuels.
- **Modèles** : protocole B3/B4, 4 métriques, grille 2×2 de déciles, calibration, confusion et limites ; avertissement sur les populations indépendantes en bas. Aucune métrique de test modifiée par les sélections descriptives.
- **Preuves** : contrôles à gauche, provenance et limites à droite, exports en accès explicite dans la barre d'action.
- **Agrégats et exports** : restent disponibles dans des fenêtres accessibles ouvertes par des éléments `<details>`. Le récapitulatif de la fenêtre permet de la refermer ; Échap lorsqu'elle a le focus.
- **Mobile et écrans trop bas (<650 px)** : affichage vertical à défilement naturel pour ne pas supprimer ni miniaturiser les données. Aucun défilement horizontal global.

## Tests d'acceptation
- `web/e2e/guided-mono-screen.spec.ts` : cinq vues × trois tailles desktop avec contrôle de hauteur réelle, contenu de premier niveau non tronqué, défilement global nul, capture desktop.
- Vérification spécifique de la dernière cellule de matrice et du dernier mois à 1280×720.
- Ouverture/fermeture de tableaux/exports détaillés, sans consommer la hauteur du cockpit au repos.
- Vérification du défilement mobile (390×844) et du débordement horizontal.
- Non-régression des suites R0–R5 (125 tests avant M1), X1/X2 et B5 historique.

## Sécurité de livraison
Branche `feature/r0-r5-guided-risk-lab`, PR #25 **en brouillon**. Aucune fusion `main`, aucun déploiement, aucune donnée ou modèle inventé. Les tests automatiques ne remplacent pas la revue visuelle humaine.
