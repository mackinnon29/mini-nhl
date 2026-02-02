# Analyse et Amélioration de l'IA : Mini-NHL

Ce document détaille les propositions d'amélioration pour le comportement des joueurs (IA) dans le projet Mini-NHL, avec pour objectif principal de réduire l'effet de "meute" et d'augmenter le réalisme tactique.

## Problème Identifié

Actuellement, l'IA souffre d'un manque de coordination spatiale :
-   **Effet de meute :** Tous les joueurs ont tendance à chasser le palet simultanément.
-   **Collision des rôles :** Les défenseurs et attaquants se retrouvent souvent au même endroit.
-   **Manque de structure :** L'équipe ne garde pas sa forme ("shape") tactique en défense ou en attaque.

## 3 Piliers d'Amélioration

Voici trois améliorations majeures pour structurer le jeu.

### 1. Spécialisation des Zones (Jeu de Position)

Dans le hockey réel, chaque joueur a une "voie" (lane) ou une zone de responsabilité.

**Concept :**
Assigner une zone "domicile" (`homeRegion`) dynamique à chaque joueur en fonction de son poste précis (Ailier Gauche, Centre, Ailier Droit, Défenseur Gauche, Défenseur Droit) et non juste "Attaquant/Défenseur".

**Détails d'implémentation :**
-   **Postes :**
    -   `LW` (Ailier Gauche) : Reste dans le tiers gauche de la patinoire.
    -   `RW` (Ailier Droit) : Reste dans le tiers droit.
    -   `C` (Centre) : Libre de parcourir toute la largeur mais soutient le palet.
    -   `LD`/`RD` (Défenseurs) : Restent en retrait et couvrent leur côté respectif.
-   **Logique de Cible :**
    -   Au lieu de `target = puck.position`, la cible devient un barycentre pondéré :
        ```javascript
        Target = (PuckPosition * Weight_Puck) + (HomeRegion * Weight_Tactical)
        ```
    -   Si le palet est à l'opposé de ma zone (ex: palet à droite, je suis ailier gauche), je ne traverse pas toute la glace pour le chasser, je reste en soutien au centre/gauche pour une passe croisée.

### 2. Structure Défensive du "Box + 1" (Protection d'Enclave)

En défense, courir après le palet est une erreur si cela laisse le devant du but vide.

**Concept :**
Implémenter une logique de "Zone Defense" où la priorité absolue est de protéger l'enclave (la zone dangereuse devant le but).

**Détails d'implémentation :**
-   **Règle du "Qui presse ?" :**
    -   Un seul joueur (le plus proche du palet) doit presser le porteur (`Pressing`).
    -   Les autres doivent basculer en mode `Coverage` (Couverture).
-   **Positions de couverture :**
    -   Les défenseurs bloquent les lignes de tir devant le but.
    -   Les ailiers couvrent les défenseurs adverses (pointes bleues) pour empêcher les tirs lointains.
    -   Le centre aide devant le but ou poursuit le palet dans les coins.

### 3. Mécanisme de Séparation Active (Anti-Crowding)

Pour contrer physiquement l'agglutinement des joueurs.

**Concept :**
Utiliser des comportements de type "Boids" (flocking) pour forcer une séparation entre coéquipiers.

**Détails d'implémentation :**
-   **Vecteur de Répulsion :**
    -   Si `distance(moi, coequipier) < SEPARATION_RADIUS`, appliquer une force inverse importante.
    -   Cette force doit être plus forte quand le coéquipier est le porteur du palet (pour lui laisser de l'espace).
-   **Support Offensif :**
    -   Si je suis un attaquant sans palet, je cherche une ligne de vue dégagée vers le porteur ("Se démarquer") plutôt que de me rapprocher de lui.

---

## Plan d'Implémentation Technique

### Étape 1 : Modification de la Classe `Player`
Ajouter les attributs nécessaires pour la gestion fine des positions.

```javascript
class Player {
    constructor(..., positionSpecific) {
        // ...
        this.positionSpecific = positionSpecific; // 'LW', 'RW', 'C', 'LD', 'RD'
        this.homeRegion = this.calculateHomeRegion(); // Zone de responsabilité rectangulaire
    }
    // ...
}
```

### Étape 2 : Algorithme de Prise de Décision (FSM)
Remplacer la logique `if/else` géante par une Machine à États (State Machine) simplifiée :

1.  **State LEADING (Porteur)** : J'ai le palet -> Attaque / Passe.
2.  **State CHASING (Chasseur)** : Je suis le plus proche du palet libre -> Je fonce.
3.  **State SUPPORTING (Soutien)** : Mon équipe a le palet -> Je me démarque dans ma zone/lane.
4.  **State DEFENDING (Défense)** : L'adversaire a le palet ->
    -   Si je suis le plus proche -> Je presse.
    -   Sinon -> Je retourne à ma position défensive (devant le but ou ma zone).

### Étape 3 : Ajustement des Constantes
Réviser les distances d'interaction pour éviter les collages.
-   Augmenter `SPREAD_DISTANCE` (Distance de séparation).
-   Réduire `PUCK_CONTROL_DISTANCE` pour exiger plus de précision (éviter que tout le monde l'attrape de loin).
