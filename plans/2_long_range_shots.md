# Plan d'Implémentation : L'Artillerie Lourde (Tirs Lointains)

Ce plan détaille l'implémentation de la logique de tir pour les défenseurs, leur permettant de prendre leur chance depuis la ligne bleue lorsqu'ils ont le champ libre.

## 1. Analyse et Objectifs

### Problème Actuel
- Les tirs sont conditionnés par `SHOT_ZONE_RATIO` (0.35), ce qui signifie que les joueurs ne tirent que s'ils sont dans les 35% du terrain les plus proches du but.
- Les défenseurs, même s'ils montent (grâce au plan 1), ne tireront jamais car ils resteront à la ligne bleue (~65% du terrain, donc hors zone de tir).
- Le jeu manque de buts "de loin" ou de déviations devant le but.

### Objectifs
- **Zone de Tir Étendue** : Définir une `SLAPSHOT_ZONE` spécifique pour les défenseurs (entre 35% et 70% du terrain).
- **Condition de Tir** : Le défenseur ne doit tirer que si la voie est libre (pas d'adversaire immédiat devant lui).
- **Puissance Augmentée** : Ces tirs doivent être plus puissants (`SLAPSHOT_POWER`) pour simuler un "lancer frappé".
- **Précision Réduite** : Ajouter une variance plus grande pour favoriser les rebonds ou les tirs non cadrés (qui font bouger le jeu).

## 2. Modifications Techniques (`script.js`)

### A. Constantes
Ajout de constantes pour le tir des défenseurs :
```javascript
const SLAPSHOT_ZONE_RATIO = 0.70;      // Peut tirer jusqu'à 70% du terrain (depuis le but adverse)
const SLAPSHOT_POWER = 18;             // Plus puissant que le tir normal (15)
const SLAPSHOT_ACCURACY_VARIANCE = 90; // Dispersion plus grande (en pixels Y)
```

### B. Logique de Tir (`updateWithPuck`)
Modifier la méthode `updateWithPuck` de la classe `Player`.

#### Algorithme Proposé :
1.  **Détection du rôle** :
    - Si `this.role === 'defenseman'`, utiliser des règles différentes.

2.  **Vérification de la Position (Slapshot Zone)** :
    - Vérifier si le joueur est entre `SHOT_ZONE_RATIO` et `SLAPSHOT_ZONE_RATIO`.
    - Exemple (Home) : `x > rinkWidth * (1 - SLAPSHOT_ZONE_RATIO)` ET `x < rinkWidth * (1 - SHOT_ZONE_RATIO)`.

3.  **Analyse de la "Ligne de Tir" (Clear Sight)** :
    - Vérifier s'il y a un adversaire dans un cône devant le joueur (pas juste "nearby").
    - Utiliser une version modifiée de `countNearbyOpponents` ou une simple vérification de distance avec les adversaires situés *entre* le tireur et le but.
    - S'il y a un adversaire à moins de 80px DEVANT, ne pas tirer (risque de contre immédiat).

4.  **Exécution du Tir** :
    - Probabilité de tir : ex. 40% par frame si conditions réunies (pour ne pas qu'il tire *instantanément* à chaque fois, mais assez vite).
    - `puck.shoot(goalX, targetY, SLAPSHOT_POWER)`
    - `targetY` calculé avec `SLAPSHOT_ACCURACY_VARIANCE` (plus de hasard).

## 3. Étapes d'Implémentation

1.  **Ajouter les constantes** : `SLAPSHOT_ZONE_RATIO`, `SLAPSHOT_POWER`.
2.  **Modifier `updateWithPuck`** :
    - Insérer un bloc spécifique pour les défenseurs AVANT la logique standard.
    - Implémenter la vérification de position.
    - Implémenter la vérification d'adversaire "devant" (simple distance check sur les adversaires + vérification X).
3.  **Ajuster la puissance et la précision** dans l'appel `shoot`.

## 4. Vérification

- **Vérification Visuelle** :
    - Observer un défenseur recevoir le palet à la ligne bleue.
    - S'il n'est pas attaqué, il doit armer un tir puissant.
    - Le tir doit partir vite et fort.
- **Vérification de Non-Tir** :
    - Si un attaquant adverse est juste devant lui, le défenseur ne doit PAS tirer (il doit passer ou patiner).
