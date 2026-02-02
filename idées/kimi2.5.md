# Améliorations du Comportement Collectif - Mini NHL

## Contexte

Analyse du code du projet Mini NHL pour améliorer le comportement collectif des joueurs et réduire l'effet "meute" où tous les joueurs convergent vers le palet.

---

## Amélioration 1 : Zones de Responsabilité par Rôle

### Problème Identifié

Dans `script.js` lignes 474-510, quand le palet est libre (`game.teamWithPuck === null`), tous les joueurs chassent directement le palet :

```javascript
// === PALET LIBRE - Chasser le palet ===
// Tous les joueurs peuvent chasser le palet
targetX = puck.x;
targetY = puck.y;
```

Cela crée un effet de "meute" où 6 joueurs (3 par équipe) convergent vers le même point.

### Solution Proposée

Implémenter un système de **zones de responsabilité** basé sur les rôles :

#### Défenseurs
- **Zone défensive** : Restent derrière la ligne bleue (ou 30% du terrain depuis leur but)
- **Condition de montée** : Ne montent en zone offensive que si :
  - Le palet est en zone offensive ET
  - Au moins 2 coéquipiers sont déjà en zone offensive
- **Repli** : Priorité absolue au repli défensif si le palet passe la ligne bleue vers leur but

#### Attaquants
- **Zone offensive** : Pressent le palet en zone offensive
- **Zone neutre** : Position intermédiaire, prêts à récupérer ou défendre
- **Zone défensive** : Se replient pour aider les défenseurs, coupent les lignes de passe

#### Gardien
- Reste dans sa zone de but (déjà implémenté)

### Plan d'Implémentation

1. **Ajouter des constantes de zones**
   ```javascript
   const DEFENSIVE_ZONE_RATIO = 0.30;  // 30% du terrain depuis le but
   const OFFENSIVE_ZONE_RATIO = 0.70;  // 70% du terrain depuis le but
   ```

2. **Créer une méthode `getZoneResponsibility()`**
   - Détermine la zone cible selon le rôle et la position du palet
   - Retourne un point cible (x, y) pondéré entre `homeX/homeY` et la position du palet

3. **Modifier `update()` pour les joueurs sans palet**
   - Lignes 474-510 : Remplacer le comportement "chasser le palet" par la logique de zones
   - Les attaquants pressent, les défenseurs couvrent

4. **Ajouter une méthode `shouldAdvance()`**
   - Vérifie si un défenseur peut monter en zone offensive
   - Prend en compte la position des coéquipiers

### Fichiers à Modifier

- `script.js` : Méthode `update()` de la classe `Player`, lignes 474-510

---

## Amélioration 2 : Formation Offensive Structurée

### Problème Identifié

Dans `script.js` lignes 659-713, les attaquants se positionnent de manière trop linéaire :

```javascript
if (this.role === 'forward') {
    targetX = this.team === 'home'
        ? Math.min(carrier.x + 120, rinkWidth - 80)
        : Math.max(carrier.x - 120, 80);
    targetY = this.homeY;
```

Les attaquants suivent le porteur sur la même ligne Y avec un simple décalage de 120px, ce qui ne crée pas d'options de passe intéressantes.

### Solution Proposée

Implémenter une **formation offensive en triangle** avec des rôles spécifiques :

#### Rôles des Attaquants (à définir à l'initialisation)

1. **Centre (C)**
   - Position : Proche du porteur (soutien immédiat)
   - Distance : 60-80px devant ou sur le côté
   - Rôle : Option de passe courte, démarquage rapide

2. **Ailier Gauche (LW)**
   - Position : Côté gauche de la patinoire (Y < hauteur/2)
   - Distance : 100-150px du porteur
   - Rôle : Option de passe latérale, tir depuis l'aile

3. **Ailier Droit (RW)**
   - Position : Côté droit de la patinoire (Y > hauteur/2)
   - Distance : 100-150px du porteur
   - Rôle : Option de passe latérale, tir depuis l'aile

#### Formation Dynamique

La formation s'adapte selon :
- **Zone offensive** : Triangle large, ailiers près des poteaux
- **Zone neutre** : Triangle resserré, prêt à récupérer
- **Zone défensive** : Ailiers remontent pour soutenir

### Plan d'Implémentation

1. **Modifier la classe `Player`**
   - Ajouter une propriété `forwardRole` : `'center'`, `'leftWing'`, `'rightWing'`
   - Modifier `initTeams()` pour assigner ces rôles aux attaquants

2. **Créer une méthode `getFormationPosition(carrier, rinkWidth, rinkHeight)`**
   ```javascript
   getFormationPosition(carrier, rinkWidth, rinkHeight) {
       const baseX = carrier.x + (this.team === 'home' ? 100 : -100);
       
       switch(this.forwardRole) {
           case 'center':
               return { x: baseX, y: carrier.y + (Math.random() - 0.5) * 40 };
           case 'leftWing':
               return { x: baseX - 30, y: Math.max(80, carrier.y - 100) };
           case 'rightWing':
               return { x: baseX - 30, y: Math.min(rinkHeight - 80, carrier.y + 100) };
       }
   }
   ```

3. **Modifier `updateTeamHasPuck()`**
   - Lignes 659-713 : Utiliser `getFormationPosition()` pour calculer les cibles
   - Garder la logique d'évitement des coéquipiers

4. **Ajouter une rotation de formation**
   - Si un attaquant a le palet, les autres s'ajustent pour maintenir le triangle
   - Le porteur devient temporairement le "centre" de la formation

### Fichiers à Modifier

- `script.js` : 
  - Constructeur `Player` (ajouter `forwardRole`)
  - `initTeams()` (assigner les rôles)
  - `updateTeamHasPuck()` (lignes 659-713)

---

## Amélioration 3 : Couverture Défensive par Zone

### Problème Identifié

Dans `script.js` lignes 715-754, les défenseurs choisissent aléatoirement leur comportement :

```javascript
if (this.role === 'forward') {
    if (carrier && Math.random() < 0.7) {
        // Presser le porteur
        targetX = carrier.x;
        targetY = carrier.y;
    } else {
        // Bloquer une ligne de passe
        targetX = puck.x + (this.team === 'home' ? -30 : 30);
        targetY = this.homeY;
    }
}
```

Le hasard (`Math.random()`) crée des comportements incohérents et des trous dans la défense.

### Solution Proposée

Implémenter un système de **couverture défensive structurée** :

#### Rôles Défensifs Assignés

1. **Défenseur 1 (Couverture Homme)**
   - Assigné au porteur du palet
   - Distance : 20-40px du porteur (pression directe)
   - Objectif : Gêner le porteur, forcer une erreur

2. **Défenseur 2 (Couverture Zone)**
   - Positionné entre le porteur et le but
   - Distance : 60-100px du porteur
   - Objectif : Couper les lignes de passe directes, protéger le centre

3. **Attaquants Défensifs (Couverture des Ailiers)**
   - Couvrent les passes vers les ailiers adverses
   - Position : Entre le porteur et les ailiers adverses
   - Objectif : Intercepter les passes latérales

#### Priorités Défensives

1. **Protection du centre** : Toujours garder un joueur entre le palet et le but
2. **Couverture des options** : Chaque passe potentielle doit être couverte
3. **Pression intelligente** : Presser seulement quand c'est avantageux

### Plan d'Implémentation

1. **Modifier la classe `Player`**
   - Ajouter une propriété `defensiveAssignment` : `'man'`, `'zone'`, `'passCoverage'`
   - Modifier `initTeams()` pour assigner ces rôles

2. **Créer une méthode `getDefensivePosition(carrier, allPlayers, rinkWidth, rinkHeight)`**
   ```javascript
   getDefensivePosition(carrier, allPlayers, rinkWidth, rinkHeight) {
       const goalX = this.team === 'home' ? 60 : rinkWidth - 60;
       const goalY = rinkHeight / 2;
       
       switch(this.defensiveAssignment) {
           case 'man':
               // Presser le porteur
               return {
                   x: carrier.x + (this.team === 'home' ? -25 : 25),
                   y: carrier.y
               };
           case 'zone':
               // Position entre porteur et but
               const ratio = 0.6;  // 60% vers le but
               return {
                   x: carrier.x + (goalX - carrier.x) * ratio,
                   y: carrier.y + (goalY - carrier.y) * 0.3
               };
           case 'passCoverage':
               // Couvrir l'ailier adverse le plus dangereux
               const dangerousWing = this.findDangerousWing(allPlayers);
               return {
                   x: (carrier.x + dangerousWing.x) / 2,
                   y: (carrier.y + dangerousWing.y) / 2
               };
       }
   }
   ```

3. **Créer une méthode `findDangerousWing(allPlayers)`**
   - Identifie l'ailier adverse le mieux placé pour recevoir une passe
   - Prend en compte la distance au but et la proximité des défenseurs

4. **Modifier `updateDefending()`**
   - Lignes 715-754 : Utiliser `getDefensivePosition()` au lieu du hasard
   - Ajouter une logique de switch : si le défenseur "homme" est battu, le défenseur "zone" prend le relais

5. **Ajouter une méthode `shouldPress(carrier)`**
   - Détermine si presser est avantageux (distance, soutien défensif)
   - Évite de laisser des espaces vides

### Fichiers à Modifier

- `script.js` :
  - Constructeur `Player` (ajouter `defensiveAssignment`)
  - `initTeams()` (assigner les rôles défensifs)
  - `updateDefending()` (lignes 715-754)

---

## Ordre de Priorité d'Implémentation

1. **Amélioration 1** (Zones de Responsabilité) - Impact maximal sur l'effet "meute"
2. **Amélioration 3** (Couverture Défensive) - Améliore significativement le réalisme défensif
3. **Amélioration 2** (Formation Offensive) - Ajoute de la profondeur tactique

## Tests et Validation

Pour chaque amélioration :

1. **Test visuel** : Observer que les joueurs occupent plus d'espace sur la patinoire
2. **Test de gameplay** : Vérifier que les passes sont plus variées et intéressantes
3. **Test de cohérence** : S'assurer qu'il n'y a pas de trous défensifs évidents

## Notes Techniques

- Garder la logique d'évitement des coéquipiers (`SPREAD_DISTANCE`) dans toutes les améliorations
- Maintenir la compatibilité avec le système de passe existant
- Préserver les performances (éviter les calculs trop complexes dans la boucle de jeu)
- Les constantes proposées sont des points de départ, à ajuster selon les tests

---

*Document généré le 2 février 2026*
*Analyse basée sur le code de script.js*
