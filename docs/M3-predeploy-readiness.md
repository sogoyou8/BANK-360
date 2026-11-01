# BANK 360 — M3 · Recette de pré-déploiement

## Périmètre inchangé
- Cinq vues guidées autonomes : Accueil, Crédit historique UCI, Fraude simulée PaySim, Modèles B3/B4, Preuves.
- Mono-écran desktop à 1280×720, 1440×810 et 1648×928 ; lecture verticale mobile.
- Aucune jointure UCI × PaySim ; aucun chiffre inventé ; aucun usage bancaire opérationnel.
- Interface classique B5 (`?classic=1`) et Aurora antérieure (`?x1=1`) préservées.
- Travail uniquement sur `feature/r0-r5-guided-risk-lab` et PR #25 en brouillon. Pas de fusion, publication ni configuration de production.

## Audit visuel M2 (captures de la CI précédente)
- **Accueil** : deux parcours distincts, chiffres contextualisés, entrées Modèles et Preuves visibles.
- **Crédit desktop** : matrice réelle 25 cellules à gauche ; lecture du segment et six mois à droite ; 1280×720 sans coupure.
- **Fraude desktop** : six jours, lecture des alertes et composition VP/FP, avertissement de dérive visible en permanence.
- **Modèles** : déciles, calibration, matrice de confusion et limites, séparés entre protocoles B3/B4.
- **Preuves** : tableau de contrôles, sources et limitations sans KPI fabriqué.
- **Points M3 identifiés sur captures mobiles** : navigation partiellement masquée ; matrice Crédit dont la moitié des colonnes était hors écran ; sixième jour isolé dans une seconde rangée du graphique Fraude.

## Correctifs M3 (aucune donnée source modifiée)
1. Navigation : les **cinq vues sont visibles simultanément** sur un écran étroit, avec zone tactile minimale de 44 px.
2. Crédit : les **25 cellules de la matrice** tiennent dans la largeur mobile sans geste horizontal caché.
3. Fraude : les **six jours simulés** restent sur une rangée mobile ; le graphique par type présente toutes les cinq catégories, y compris celles sans alerte.
4. Export PaySim : quand le dénominateur est nul, précision ou rappel est **non défini** (cellule CSV/XLSX vide), et non une fausse valeur 0 %. La surface graphique conserve le symbole « — ».
5. Terminologie : la légende des alertes explicite le caractère **simulé** des vrais positifs.
6. Les modifications de disposition restent isolées dans `web/src/guided-m3-readiness.css`.

## Barrières vérifiables avant déploiement
- **Données** : B1 et B3 verts ; compilation TypeScript et contrôles d'agrégats non régressifs.
- **Parcours** : ensemble des tests Playwright R0–R5 / M1 / M2 / M3 / B5 réussis sur le **même commit de tête**.
- **Résolutions** : 1648×928, 1440×810, 1280×720 ; mobile 390×844 et 320×844, sans débordement horizontal.
- **Intégrité** : filtres UCI cohérents avec KPIs/matrice/historique/exports ; PaySim par jour **OU** type ; aucune métrique des modèles recalculée selon les filtres descriptifs.
- **Exports** : téléchargement CSV et XLSX des agrégats ; cas de dénominateur nul explicitement non défini ; aucune ligne individuelle publiée.
- **Accessibilité / UX** : cinq points de navigation disponibles ; grilles visibles ; aucune alerte réelle suggérée.
- **Vérification visuelle** : examiner les nouvelles captures M3 après exécution de la CI ; ne pas présumer l'absence de problèmes sans examen.

## Décision et séquencement
La branche demeure **en pré-déploiement**. Ne pas fusionner cette PR (base actuelle : `feature/x2-aurora-unified`) ni déployer depuis `main` avant :
1. un verdict vert sur le HEAD définitif et inspection des captures mises à jour ;
2. la validation explicite par le propriétaire du produit du design final et de la destination de fusion ;
3. l'accord de publication, distinct de la validation technique.

Le livrable pré-déploiement doit être une PR et ses preuves, **pas une mise en ligne**.
