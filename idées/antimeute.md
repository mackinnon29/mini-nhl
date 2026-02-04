# Plan Anti-Meute : Comportement Collectif Amélioré

**Date :** 2026-02-02  
**Base :** Plan Opus 4.5 + Rôles Fixes Kimi 2.5  
**Objectif :** Éliminer l'effet "meute" et créer une occupation réaliste de la patinoire

---

## Vue d'ensemble

Ce plan combine :
- **Opus 4.5** : Approche pragmatique avec chasseur unique, formation triangulaire et distance adaptative.
- **Kimi 2.5** : Assignation de rôles spécifiques (LW, RW, C) pour un positionnement intelligent.

---

## Amélioration #1 : Rôles Spécifiques des Attaquants

### Concept
Assigner un rôle positionnel à chaque attaquant à l'initialisation pour guider leur placement dans la formation.

### Implémentation

#### Étape 1 : Modifier le constructeur `Player`
```javascript
// Ajouter après la ligne "this.role = role;"
this.forwardPosition = null; // 'C', 'LW', 'RW' (null pour non-attaquants)
```

#### Étape 2 : Modifier `initTeams()` (ligne ~876)
```javascript
// Équipe Domicile (Rouge)
this.players.push(new Player(100, h / 2, 'home', 39, 'goalie'));
this.players.push(new Player(200, h / 2 - 50, 'home', 8, 'defenseman'));
this.players.push(new Player(200, h / 2 + 50, 'home', 7, 'defenseman'));

// Attaquants avec rôles spécifiques
const lw1 = new Player(350, h / 2 - 100, 'home', 29, 'forward');
lw1.forwardPosition = 'LW';
this.players.push(lw1);

const c1 = new Player(350, h / 2, 'home', 62, 'forward');
c1.forwardPosition = 'C';
this.players.push(c1);

const rw1 = new Player(350, h / 2 + 100, 'home', 88, 'forward');
rw1.forwardPosition = 'RW';
this.players.push(rw1);

// Idem pour l'équipe Away...
```

---

## Amélioration #2 : Chasseur Unique (Palet Libre)

### Concept
Quand le palet est libre, **un seul joueur par équipe** le chasse activement. Les autres maintiennent leur position de couverture.

### Implémentation

#### Modifier la section "PALET LIBRE" (lignes 474-510)
```javascript
// === PALET LIBRE - Chasser le palet ===
const myDistToPuck = this.distanceTo(puck.x, puck.y);
const teammates = allPlayers.filter(p =>
    p.team === this.team && p !== this && p.role !== 'goalie'
);

// Suis-je le plus proche du palet dans mon équipe ?
const isClosestToPuck = !teammates.some(mate =>
    mate.distanceTo(puck.x, puck.y) < myDistToPuck - 5
);

if (isClosestToPuck) {
    // JE suis le chasseur désigné
    targetX = puck.x;
    targetY = puck.y;
} else {
    // Je reste en position de soutien/couverture
    const lateralOffset = this.homeY > rinkHeight / 2 ? 1 : -1;
    const depthFactor = this.role === 'forward' ? 0.4 : 0.25;

    targetX = this.homeX + (puck.x - rinkWidth / 2) * depthFactor;
    targetY = this.homeY + lateralOffset * 40;
}

// Éviter l'agglutinement avec les coéquipiers
for (const mate of teammates) {
    const distToMate = this.distanceTo(mate.x, mate.y);
    if (distToMate < SPREAD_DISTANCE && distToMate > 0) {
        targetX += (this.x - mate.x) * 0.35;
        targetY += (this.y - mate.y) * 0.35;
    }
}
```

---

## Amélioration #3 : Formation Triangulaire Offensive

### Concept
Utiliser le `forwardPosition` pour étaler les attaquants en triangle plutôt qu'en ligne.

### Implémentation

#### Modifier `updateTeamHasPuck()` pour les attaquants (lignes 668-687)
```javascript
if (this.role === 'forward') {
    const depthOffset = this.team === 'home' ? 120 : -120;
    targetX = this.team === 'home'
        ? Math.min(carrier.x + depthOffset, rinkWidth - 80)
        : Math.max(carrier.x + depthOffset, 80);

    // Positionnement vertical basé sur le rôle
    switch (this.forwardPosition) {
        case 'LW':
            // Ailier gauche : haut de la patinoire
            targetY = rinkHeight * 0.2;
            break;
        case 'RW':
            // Ailier droit : bas de la patinoire
            targetY = rinkHeight * 0.8;
            break;
        case 'C':
        default:
            // Centre : proche du porteur, légèrement décalé
            targetY = carrier.y + (Math.random() - 0.5) * 60;
            break;
    }

    // Éviter l'agglutinement
    const teammates = allPlayers.filter(p => p.team === this.team && p !== this && p.role !== 'goalie');
    for (const mate of teammates) {
        const dist = this.distanceTo(mate.x, mate.y);
        if (dist < SPREAD_DISTANCE && dist > 0) {
            targetY += (this.y - mate.y) * 0.6;
        }
    }
}
```

---

## Amélioration #4 : Positionnement des Défenseurs

### Concept
Les défenseurs doivent aussi s'étaler verticalement (haut/bas) plutôt que rester groupés.

### Implémentation

#### Modifier `updateTeamHasPuck()` pour les défenseurs (lignes 688-708)
```javascript
else {
    // Défenseurs : suivre l'attaque mais en retrait
    const supportDepth = this.team === 'home' ? 80 : -80;
    targetX = this.team === 'home'
        ? Math.min(carrier.x + supportDepth, rinkWidth - 150)
        : Math.max(carrier.x + supportDepth, 150);

    // Positionnement vertical : haut/bas selon homeY initial
    const isTopDefender = this.homeY < rinkHeight / 2;
    const defensiveSpread = rinkHeight * 0.45;
    targetY = rinkHeight / 2 + (isTopDefender ? -defensiveSpread : defensiveSpread);

    // Espacement des coéquipiers
    const teammates = allPlayers.filter(p => p.team === this.team && p !== this && p.role !== 'goalie');
    for (const mate of teammates) {
        const dist = this.distanceTo(mate.x, mate.y);
        if (dist < SPREAD_DISTANCE && dist > 0) {
            targetY += (this.y - mate.y) * 0.6;
        }
    }
}
```

---

## Amélioration #5 : Distance de Séparation Adaptative

### Concept
Remplacer la constante `SPREAD_DISTANCE = 80` par un système dynamique.

### Implémentation

#### Étape 1 : Remplacer la constante (ligne 11)
```javascript
// Supprimer : const SPREAD_DISTANCE = 80;
// Remplacer par :
const BASE_SPREAD_DISTANCE = 100;
const OFFENSIVE_SPREAD_MULTIPLIER = 1.6;  // 160px en attaque
const DEFENSIVE_SPREAD_MULTIPLIER = 1.2;  // 120px en défense

// Constantes de formation (optionnelles, pour référence)
const FORMATION_VERTICAL_SPREAD = 0.65;   // 65% de la hauteur
const FORMATION_DEPTH_SPACING = 120;      // Écart avant-arrière
```

#### Étape 2 : Ajouter une méthode helper dans `Player`
```javascript
getSpreadDistance(rinkWidth) {
    const inOffensiveZone = this.team === 'home'
        ? this.x > rinkWidth * 0.5
        : this.x < rinkWidth * 0.5;

    // Bonus pour les attaquants : plus d'espace
    let baseDist = BASE_SPREAD_DISTANCE;
    if (this.role === 'forward') {
        baseDist *= 1.1;
    }

    const multiplier = inOffensiveZone
        ? OFFENSIVE_SPREAD_MULTIPLIER
        : DEFENSIVE_SPREAD_MULTIPLIER;

    return baseDist * multiplier;
}
```

#### Étape 3 : Utiliser cette méthode partout
Remplacer `SPREAD_DISTANCE` par `this.getSpreadDistance(rinkWidth)` dans :
- Ligne 494 (palet libre)
- Ligne 679 (attaquants en possession)
- Ligne 699 (défenseurs en possession)
- Ligne 747 (défense)

#### Étape 4 : Augmenter les forces de répulsion
| Section | Ancienne valeur | Nouvelle valeur |
|---------|-----------------|-----------------|
| Palet libre | 0.3 | 0.4 |
| Attaquants possession | 0.5 | 0.7 |
| Défenseurs possession | 0.4 | 0.6 |
| Défense | 0.25 | 0.4 |

---

## Ordre d'Implémentation

| # | Amélioration | Temps | Impact |
|---|--------------|-------|--------|
| 1 | Rôles spécifiques (LW/RW/C) | 10 min | Fondation pour le reste |
| 2 | Distance adaptative | 20 min | Espacement visible immédiat |
| 3 | Chasseur unique | 15 min | Tue l'effet meute sur palet libre |
| 4 | Formation triangulaire attaquants | 20 min | Étalement offensif |
| 5 | Positionnement défenseurs | 15 min | Couverture défensive |

**Temps total estimé : ~1h30**

---

## Métriques de Succès

| Métrique | Avant | Objectif |
|----------|-------|----------|
| Joueurs chassant le palet libre | 4-6 | 1-2 |
| Espacement vertical moyen | 80px | 140-160px |
| Couverture de la patinoire | 40% | 75-80% |
| Passes bloquées en défense | 20% | 50% |

---

## Tests de Validation

### Test 1 : Chasseur Unique
- Lancer le jeu, laisser le palet au centre
- ✅ **Attendu** : 1 joueur par équipe converge, les autres restent en position
- ❌ **Avant** : 4-6 joueurs créent une meute

### Test 2 : Formation Triangle
- Donner le palet à un attaquant
- ✅ **Attendu** : LW en haut, RW en bas, C au centre = triangle
- ❌ **Avant** : Ligne horizontale

### Test 3 : Espacement
- Observer la distance entre coéquipiers
- ✅ **Attendu** : 120-160px de séparation
- ❌ **Avant** : ~80px, souvent moins

### Test 4 : Couverture Défensive
- Observer l'équipe en défense
- ✅ **Attendu** : Joueurs distribués, lignes de passe bloquées
- ❌ **Avant** : 2-3 joueurs sur le porteur

---

## Notes d'Implémentation

### Compatibilité
- ✅ Aucun changement des constantes de gameplay existantes (tir, passe)
- ✅ Les systèmes de passe/tir restent inchangés
- ✅ Compatible avec les mécaniques de gardien

### Performance
- Impact négligeable (ajout d'une méthode helper simple)
- Pas de boucles supplémentaires
- Calculs légers (comparaisons de distances)

### Évolutions Futures Possibles
- Formations prédéfinies (1-2-2, 1-3-1, etc.)
- Système de zones (défensive, neutre, offensive)
- IA adaptative selon le score et le temps restant

---

## Fichiers à Modifier

- [script.js](file:///home/maxime/dev/mini-nhl/script.js)
  - Constructeur `Player` (ligne ~396)
  - `initTeams()` (ligne ~876)
  - Section "PALET LIBRE" (lignes 474-510)
  - `updateTeamHasPuck()` (lignes 668-708)
  - `updateDefending()` (lignes 715-754)
  - Constantes (ligne ~11)
