# Plan d'Implémentation : Le "Général de la Ligne Bleue" (Soutien Offensif)

Ce plan détaille l'implémentation de la logique de soutien offensif pour les défenseurs, leur permettant de monter jusqu'à la ligne bleue et d'offrir des options de passe latérales sans encombrer la zone d'attaque.

## 1. Analyse et Objectifs

### Problème Actuel
- Les défenseurs restent bloqués très bas (souvent derrière la ligne médiane) même quand leur équipe attaque.
- Ils gardent une position verticale fixe ("sur des rails"), ce qui limite les lignes de passe.
- Ils sont inutiles en phase offensive, laissant les 3 attaquants se débrouiller seuls contre 5 adversaires.

### Objectifs
- **Positionnement Haut** : Les défenseurs doivent monter jusqu'à la limite de la zone offensive (environ 2/3 du terrain) lorsque le palet y est.
- **Déplacement Latéral** : Ils doivent "slider" latéralement pour se démarquer et offrir une ligne de passe diagonale au porteur du palet.
- **Sécurité** : Ils ne doivent pas dépasser le porteur du palet s'il est proche de la ligne bleue pour éviter les contre-attaques faciles.

## 2. Modifications Techniques (`script.js`)

### A. Constantes
Ajout/Modification de constantes pour définir les zones :
```javascript
const OFFENSIVE_BLUE_LINE_PCT = 0.65; // ~2/3 du terrain (ligne bleue offensive)
const DEFENDER_SUPPORT_DEPTH = 150;   // Distance derrière le porteur ou la ligne bleue
```

### B. Logique de Positionnement (`updateTeamHasPuck`)
Modifier la section `else` (défenseurs) dans la méthode `updateTeamHasPuck` de la classe `Player`.

#### Algorithme Proposé :
1.  **Déterminer la ligne de front** :
    *   Si le palet est en zone offensive (> ligne bleue), la ligne de front est la ligne bleue.
    *   Si le palet est en zone neutre, la ligne de front est en retrait du palet (soutien).

2.  **Calcul de la cible X (Profondeur)** :
    *   *Home Team* : `Math.min(carrier.x - 100, RinkWidth * OFFENSIVE_BLUE_LINE_PCT)`
    *   ATTENTION : Ne jamais dépasser le palet de manière imprudente.
    
3.  **Calcul de la cible Y (Latéral)** :
    *   Au lieu de rester fixe, calculer un `idealY` qui est à l'opposé de la congestion ou qui ouvre un angle.
    *   Si le porteur est sur le bord (ex: bas), le défenseur du même côté se rapproche un peu (soutien court), l'autre défenseur va au centre (soutien long/tir).
    *   Utiliser `game.puckCarrier.y` pour ajuster la position.
    
    *Exemple de logique Y :*
    - Si je suis le défenseur GAUCHE (Haut) et le palet est en BAS : Je vais vers le CENTRE (pour un tir sur réception).
    - Si je suis le défenseur GAUCHE et le palet est en HAUT : Je reste le long de la bande (pour une passe en retrait de sécurité).

## 3. Étapes d'Implémentation

1.  **Définir les constantes** : Ajouter `OFFENSIVE_BLUE_LINE_PCT` et ajuster les distances de répulsion si nécessaire.
2.  **Refondre `updateTeamHasPuck` pour les défenseurs** :
    - Supprimer la logique actuelle simple (`carrier.x + supportDepth`).
    - Implémenter la logique conditionnelle basée sur la position du palet (Zone Défensive vs Neutre vs Offensive).
3.  **Ajouter le déplacement latéral (Sliding)** :
    - Faire dépendre `targetY` de la position Y du palet (`carrier.y`).
    - Formule : `targetY = baseHomeY + (carrier.y - CenterY) * Factor`.

## 4. Vérification

- **Vérification Visuelle** :
    - Lancer le jeu.
    - Attendre qu'une équipe prenne le contrôle et monte en attaque.
    - Observer si les défenseurs suivent jusqu'au tiers adverse (au lieu de rester au milieu).
    - Vérifier qu'ils ne rentrent PAS dans la zone profonde (coins/cages).
- **Test de la Passe en Retrait** :
    - Le porteur du palet (joueur humain ou IA) doit pouvoir faire une passe arrière vers la ligne bleue qui arrive sur un défenseur.
