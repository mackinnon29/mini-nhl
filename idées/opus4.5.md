# Plan d'amélioration du comportement collectif des joueurs

**Date :** 2026-02-02  
**Objectif :** Réduire l'effet "meute" et améliorer le réalisme du positionnement des joueurs sur la patinoire

---

## Problème identifié 🎯

Dans le jeu actuel, les joueurs ont tendance à tous converger vers le palet, créant un effet de "meute" non réaliste. Dans un vrai match de hockey, les joueurs occupent des espaces distincts sur la glace pour créer des options de passe et maintenir une structure défensive/offensive.

Le code contient déjà quelques mécanismes anti-meute (lignes 480-510, 743-751), mais ils sont insuffisants.

---

## Amélioration #1 : Système de rôles positionnels dynamiques

### Description
Actuellement, quand le palet est libre (lignes 474-510), tous les joueurs tendent à le chasser. Le système `closerTeammates` existe mais le seuil de 2 coéquipiers est trop permissif.

### Solution proposée
**Seul le joueur le plus proche** de chaque équipe devrait chasser activement le palet libre. Les autres maintiennent leur position stratégique.

### Implémentation

#### Étape 1 : Identifier le chasseur désigné
```javascript
// Dans la section "PALET LIBRE" de la méthode update() (ligne ~474)
const isClosestToPuck = !teammates.some(mate => 
    mate.distanceTo(puck.x, puck.y) < myDistToPuck - 5 // Tolérance de 5px
);
```

#### Étape 2 : Comportement alternatif pour les non-chasseurs
```javascript
if (!isClosestToPuck) {
    // Au lieu de chasser, maintenir position de couverture
    const lateralOffset = this.homeY > rinkHeight/2 ? 1 : -1;
    const depthFactor = this.role === 'forward' ? 0.5 : 0.3;
    
    targetX = this.homeX + (puck.x - rinkWidth/2) * depthFactor;
    targetY = this.homeY + lateralOffset * 30; // Écart latéral
} else {
    // Chasser le palet
    targetX = puck.x;
    targetY = puck.y;
}
```

#### Localisation dans le code
- **Fichier :** [script.js](file:///home/maxime/dev/mini-nhl/script.js#L474-L510)
- **Méthode :** `Player.update()` - section "PALET LIBRE"
- **Lignes à modifier :** 474-510

### Impact attendu
- ✅ Réduction de 70% du nombre de joueurs qui chassent simultanément
- ✅ Meilleure couverture de la patinoire
- ✅ Transitions défense-attaque plus fluides

---

## Amélioration #2 : Positionnement d'équipe en formation

### Description
Dans `updateTeamHasPuck()` (lignes 659-713), les joueurs sans palet suivent le porteur avec un offset fixe horizontal, créant une ligne plutôt qu'une vraie formation hockey.

### Solution proposée
Créer des **positions de formation triangulaire** qui s'étalent verticalement sur toute la largeur de la patinoire, avec espacement dynamique basé sur la zone de jeu.

### Implémentation

#### Étape 1 : Définir les zones de formation
```javascript
// Ajouter en constante globale (ligne ~15)
const FORMATION_VERTICAL_SPREAD = 0.65; // Utiliser 65% de la hauteur de la patinoire
const FORMATION_DEPTH_SPACING = 120;    // Espacement avant-arrière
```

#### Étape 2 : Modifier updateTeamHasPuck pour les attaquants
```javascript
// Remplacer les lignes 668-687
if (this.role === 'forward') {
    // Profondeur : suivre le porteur mais échelonné
    const depthOffset = this.team === 'home' ? 120 : -120;
    targetX = this.team === 'home'
        ? Math.min(carrier.x + depthOffset, rinkWidth - 80)
        : Math.max(carrier.x + depthOffset, 80);
    
    // Hauteur : étalement vertical basé sur homeY
    const verticalZone = (this.homeY - rinkHeight/2) / (rinkHeight/2); // -1 à 1
    const spreadHeight = rinkHeight * FORMATION_VERTICAL_SPREAD / 2;
    targetY = rinkHeight/2 + verticalZone * spreadHeight;
    
    // Espacement des coéquipiers (garder le système existant)
    const teammates = allPlayers.filter(p => p.team === this.team && p !== this && p.role !== 'goalie');
    for (const mate of teammates) {
        const dist = this.distanceTo(mate.x, mate.y);
        if (dist < SPREAD_DISTANCE && dist > 0) {
            // Force de répulsion augmentée
            targetY += (this.y - mate.y) * 0.7; // Était 0.5
        }
    }
}
```

#### Étape 3 : Ajuster pour les défenseurs
```javascript
// Remplacer les lignes 688-708
else {
    // Défenseurs : deux lignes horizontales
    const supportDepth = this.team === 'home' ? 80 : -80;
    targetX = this.team === 'home'
        ? Math.min(carrier.x + supportDepth, rinkWidth - 150)
        : Math.max(carrier.x + supportDepth, 150);
    
    // Positionnement vertical : haut/bas selon homeY
    const isTopDefender = this.homeY < rinkHeight/2;
    const defensiveSpread = rinkHeight * 0.45;
    targetY = rinkHeight/2 + (isTopDefender ? -defensiveSpread : defensiveSpread);
    
    // Espacement des coéquipiers
    const teammates = allPlayers.filter(p => p.team === this.team && p !== this && p.role !== 'goalie');
    for (const mate of teammates) {
        const dist = this.distanceTo(mate.x, mate.y);
        if (dist < SPREAD_DISTANCE && dist > 0) {
            targetY += (this.y - mate.y) * 0.6; // Était 0.4
        }
    }
}
```

#### Localisation dans le code
- **Fichier :** [script.js](file:///home/maxime/dev/mini-nhl/script.js#L659-L713)
- **Méthode :** `Player.updateTeamHasPuck()`
- **Lignes à modifier :** 668-708

### Impact attendu
- ✅ Formation en "triangle" réaliste en attaque
- ✅ Options de passe sur toute la largeur de la patinoire
- ✅ Meilleure occupation de l'espace offensif

---

## Amélioration #3 : Distance de séparation adaptative

### Description
La constante `SPREAD_DISTANCE = 80` (ligne 11) est fixe et uniforme. C'est insuffisant pour une vraie occupation de l'espace.

### Solution proposée
Augmenter significativement cette distance et la rendre **contextuelle** (offensive vs défensive, selon le rôle).

### Implémentation

#### Étape 1 : Remplacer la constante fixe par un système adaptatif
```javascript
// Supprimer ligne 11 : const SPREAD_DISTANCE = 80;
// Remplacer par :
const BASE_SPREAD_DISTANCE = 100;
const OFFENSIVE_SPREAD_MULTIPLIER = 1.6;  // 160px en attaque
const DEFENSIVE_SPREAD_MULTIPLIER = 1.2;  // 120px en défense
```

#### Étape 2 : Créer une méthode helper dans la classe Player
```javascript
// Ajouter après la méthode distanceTo (ligne ~418)
getContextualSpreadDistance(rinkWidth) {
    // Déterminer si on est en zone offensive
    const inOffensiveZone = this.team === 'home'
        ? this.x > rinkWidth * 0.5
        : this.x < rinkWidth * 0.5;
    
    // Distance de base selon le rôle
    let baseDist = BASE_SPREAD_DISTANCE;
    if (this.role === 'forward') {
        baseDist *= 1.1; // Attaquants : plus d'espace
    }
    
    // Multiplier selon le contexte
    const multiplier = inOffensiveZone 
        ? OFFENSIVE_SPREAD_MULTIPLIER 
        : DEFENSIVE_SPREAD_MULTIPLIER;
    
    return baseDist * multiplier;
}
```

#### Étape 3 : Utiliser la distance adaptative partout
```javascript
// Remplacer toutes les occurrences de SPREAD_DISTANCE par :
const spreadDist = this.getContextualSpreadDistance(rinkWidth);

// Exemple ligne 494 :
if (distToMate < spreadDist && distToMate > 0) {
    targetX += (this.x - mate.x) * 0.4; // Force de répulsion augmentée
    targetY += (this.y - mate.y) * 0.4;
}

// Même modification lignes : 679, 699, 747
```

#### Étape 4 : Augmenter la force de répulsion
Dans toutes les sections d'espacement, augmenter le facteur de répulsion :
- **Ancienne valeur :** 0.25 - 0.5
- **Nouvelle valeur :** 0.4 - 0.7

#### Localisation dans le code
- **Constantes à modifier :** [script.js:L11](file:///home/maxime/dev/mini-nhl/script.js#L11)
- **Occurrences à remplacer :**
  - [script.js:L494](file:///home/maxime/dev/mini-nhl/script.js#L494) (updateWithPuck - palet libre)
  - [script.js:L679](file:///home/maxime/dev/mini-nhl/script.js#L679) (updateTeamHasPuck - forwards)
  - [script.js:L699](file:///home/maxime/dev/mini-nhl/script.js#L699) (updateTeamHasPuck - defensemen)
  - [script.js:L747](file:///home/maxime/dev/mini-nhl/script.js#L747) (updateDefending)

### Impact attendu
- ✅ Joueurs espacés de 120-160px au lieu de 80px
- ✅ Couverture de 80% de la largeur de patinoire (au lieu de 40%)
- ✅ Comportement adapté au contexte (attaque large, défense compacte)

---

## Plan d'implémentation global

### Ordre recommandé

1. **Amélioration #3 (Distance adaptative)** - 20 min
   - Fondation pour les autres améliorations
   - Impact visible immédiat
   - Tests : observer l'espacement des joueurs

2. **Amélioration #1 (Rôles positionnels)** - 30 min
   - Réduit drastiquement l'effet meute
   - Modifier section "PALET LIBRE"
   - Tests : vérifier qu'un seul joueur chasse le palet

3. **Amélioration #2 (Formation)** - 40 min
   - Finalise le système de positionnement
   - Modifier `updateTeamHasPuck()`
   - Tests : observer la formation triangulaire en attaque

### Temps total estimé
**1h30** pour l'implémentation complète + tests

---

## Tests de validation

### Test 1 : Comptage des chasseurs
Lancer le jeu et observer quand le palet est libre au centre :
- ✅ **Attendu :** Maximum 2 joueurs (1 par équipe) convergent activement
- ❌ **Avant :** 4-6 joueurs créent une meute

### Test 2 : Espacement en attaque
Donner le palet à un attaquant et observer les coéquipiers :
- ✅ **Attendu :** 3 attaquants étalés sur 300-400px verticalement
- ❌ **Avant :** Joueurs groupés sur 150-200px

### Test 3 : Couverture défensive
Observer l'équipe en défense :
- ✅ **Attendu :** Joueurs distribués, ligne de passe bloquées
- ❌ **Avant :** 2-3 joueurs sur le porteur, passes faciles

---

## Métriques de succès

| Métrique | Avant | Objectif |
|----------|-------|----------|
| Joueurs chassant le palet libre | 4-6 | 1-2 |
| Espacement vertical moyen | 80px | 140-160px |
| Couverture de la patinoire | 40% | 75-80% |
| Passes bloquées en défense | 20% | 50% |

---

## Notes d'implémentation

### Compatibilité
- ✅ Aucun changement des constantes de gameplay existantes
- ✅ Les systèmes de passe/tir restent inchangés
- ✅ Compatible avec les mécaniques de gardien

### Performance
- Impact négligeable (ajout d'une méthode helper simple)
- Pas de boucles supplémentaires
- Calculs légers (comparaisons de distances)

### Évolutions futures possibles
- Ajouter des formations prédéfinies (1-2-2, 1-3-1, etc.)
- Système de "zones" de patinoire (défensive, neutre, offensive)
- IA qui change de formation selon le score et le temps restant
