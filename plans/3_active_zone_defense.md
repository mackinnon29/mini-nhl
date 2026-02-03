# Plan d'Implémentation : La "Défense de Zone Active"

Ce plan détaille l'implémentation de la logique de défense active, permettant aux défenseurs d'engager le porteur du palet lorsqu'il pénètre dans leur zone de responsabilité, au lieu de reculer passivement.

## 1. Analyse et Objectifs

### Problème Actuel
- Le code stipule explicitement (commentaires et logique) que les défenseurs "ne chassent jamais".
- Ils reculent indéfiniment vers leur but (`targetX = puck.x + defenseOffset`), laissant le porteur avancer librement jusqu'au gardien.
- Il n'y a pas de pression sur le porteur en zone défensive.

### Objectifs
- **Engagement Territorial** : Définir des zones d'engagement pour chaque défenseur (ex: Défenseur Gauche couvre le quart gauche de la zone défensive).
- **Condition d'Attaque (Trigger)** : Si le palet entre dans ma zone ET est à portée (`ENGAGEMENT_DISTANCE`), je fonce sur le porteur.
- **Ligne de Non-Recul** : Définir une limite (ex: haut des cercles) au-delà de laquelle le défenseur DOIT arrêter de reculer et forcer le duel.

## 2. Modifications Techniques (`script.js`)

### A. Constantes
Ajout de constantes pour l'engagement :
```javascript
const DEFENSIVE_ENGAGEMENT_DIST = 120; // Distance pour déclencher l'attaque (plus courte que PRESSURE_DISTANCE?)
const NO_RETREAT_LINE_RATIO = 0.20;    // 20% / 80% du terrain (proche des buts)
```

### B. Logique de Défense (`updateDefending`)
Modifier la section `else` (défenseurs) dans `updateDefending`.

#### Algorithme Proposé :

1.  **Définir ma Zone de Responsabilité** :
    - Diviser la largeur de la patinoire en deux (Gauches / Droite).
    - `isPuckInMySide` : Si je suis défenseur du "Haut" (Y < CenterY, visuellement gauche/haut), est-ce que le palet est dans la moitié haute (Y < CenterY + Marge) ?

2.  **Calcul de la Distance au But** :
    - Si le palet est trop proche de MON but (franchissement de la `NO_RETREAT_LINE`), le mode "Rattrapage/Urgence" s'active.

3.  **Décision (State Machine)** :
    - **Cas A : Le palet est dans ma zone ET proche (`< DEFENSIVE_ENGAGEMENT_DIST`)** -> **ENGAGER !**
        - `targetX = carrier.x`
        - `targetY = carrier.y`
        - On devient temporairement un "Chasseur" (ignorer la règle "jamais de chasse").
    
    - **Cas B : Le palet est de l'autre côté (Zone de mon partenaire)** -> **COUVRIR (Slot)**.
        - `targetX = (ButX + carrier.x) / 2` (Entre le but et le palet)
        - `targetY = CenterY` (Protéger l'axe central, "The Slot")
        - Ne pas aller sur le bord oppposé (laisser le partenaire gérer).
    
    - **Cas C : Le palet est loin (Zone Neutre)** -> **RECULER / GAP CONTROL**.
        - Comportement actuel conservé (reculer en gardant l'écart), mais s'assurer de ne pas reculer jusque *dans* le gardien.

## 3. Étapes d'Implémentation

1.  **Supprimer le commentaire "jamais de chasse"** : (Symbolique mais important pour la clarté).
2.  **Implémenter la détection de zone** :
    - Utiliser `this.homeY` pour savoir si je suis le défenseur de gauche ou de droite.
    - Comparer avec `carrier.y`.
3.  **Ajouter la condition d'engagement** :
    - Si `InMyZone` AND `Distance < Threshold` -> Targets = Puck.
4.  **Ajouter la couverture du Slot** :
    - Si `!InMyZone` -> Target = Centre devant le but.

## 4. Vérification

- **Vérification Visuelle** :
    - Lancer le jeu, laisser l'IA attaquer.
    - Observer : Quand l'attaquant arrive sur un côté, le défenseur de ce côté doit aller à son contact.
    - Observer : Le défenseur opposé doit venir se placer devant le but (et non rester collé à sa bande inutilement).
- **Test de Non-Meute** :
    - Vérifier que les deux défenseurs ne foncent pas EN MÊME TEMPS sur le palet (grâce au check `InMyZone`).
