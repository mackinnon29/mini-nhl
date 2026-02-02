# Spécifications des Agents (IA) - Mini NHL

Ce document décrit le comportement fonctionnel attendu pour les agents autonomes (IA) du jeu. Il sert de référence pour l'implémentation des règles de jeu et de l'intelligence artificielle.

## 1. Rôles et Composition des Équipes
Chaque équipe est composée de **4 joueurs** sur la glace.

### Composition
*   **1 Gardien (Goalie)** : Protège le filet.
*   **1 Défenseur (Defenseman)** : Nouveau rôle. Se concentre sur la protection de la zone défensive mais peut monter en attaque.
*   **2 Attaquants (Forwards)** : Se concentrent sur l'offensive et la pression.

*(Note : Les coachs et arbitres sont envisagés pour une version ultérieure).*

## 2. Attributs et Statistiques
Les agents ne sont pas identiques. Ils possèdent des profils définis par des statistiques :
*   **Vitesse** : Capacité de déplacement.
*   **Précision des tirs** : Probabilité que le tir atteigne la cible visée (but ou passe).

*Note : La fatigue n'est pas gérée.*

## 3. Perception et Physique
*   **Vision Omnisciente** : Les agents connaissent la position exacte de tous les joueurs et du palet sur l'ensemble du terrain.
*   **Collisions** :
    *   **Coéquipiers** : Les agents évitent activement les collisions avec les membres de leur équipe.
    *   **Adversaires** : Les agents peuvent effectuer des mises en échec (body checks) pour déstabiliser l'adversaire.

## 4. Comportements (Machine à États)

### A. Phase Offensive (Possession du palet)
Lorsqu'un joueur possède le palet :
1.  **Analyse** : Il évalue la position de ses coéquipiers et du but.
2.  **Décision** :
    *   **Passe** : Si un coéquipier est mieux placé (plus proche du but, démarqué), le porteur fait une passe.
    *   **Tir** : Si aucune passe n'est évidente ou s'il est en bonne position, il tire au but.

**Comportement des coéquipiers (sans palet)** :
*   Ils cherchent à **se démarquer** (trouver des espaces libres) pour offrir des solutions de passe et créer des occasions.

### B. Phase Défensive (Sans le palet)
L'objectif est de récupérer le palet et d'empêcher les tirs.
*   **Défenseurs** :
    *   Priorité : **Bloquer les lignes de passe**.
    *   Peuvent être agressifs (mises en échec) si l'occasion se présente.

### C. Gardien de But (Goalie)
*   **Positionnement** : Reste majoritairement devant sa cage.
*   **Sorties** : Peut sortir de sa zone (crease) exceptionnellement (rarement).
*   **Actions avec le palet** :
    *   **Geler le disque** : Arrêter le jeu pour provoquer une mise au jeu.
    *   **Passe** : Relancer le jeu en faisant une passe, prioritairement à ses défenseurs.