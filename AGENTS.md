# Spécifications Mini NHL

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

---

## Build / Development

This is a vanilla JavaScript project with no build system. Simply open `index.html` in a browser.

### Development Server
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

## Code Style Guidelines

### JavaScript
- **Language**: Vanilla ES6+ JavaScript, no transpilation
- **Classes**: Use ES6 class syntax with PascalCase (e.g., `Player`, `Game`)
- **Methods**: camelCase for methods and properties
- **Indentation**: 4 spaces
- **Comments**: French language for inline comments explaining logic
- **Variables**: Use `const` and `let`, avoid `var`
- **String quotes**: Double quotes preferred

### CSS
- **Indentation**: 4 spaces
- **Naming**: kebab-case for IDs and classes
- **Comments**: French language for explanations

### HTML
- **Language**: French (`lang="fr"`)
- **Indentation**: 4 spaces
- **Encoding**: UTF-8

### Naming Conventions
- **Files**: kebab-case (e.g., `script.js`, `style.css`)
- **Classes**: PascalCase (e.g., `Rink`, `Puck`, `Player`, `Game`)
- **Methods/Properties**: camelCase (e.g., `checkPossession`, `rinkWidth`)
- **Constants**: UPPER_SNAKE_CASE for true constants

### Architecture
- **Classes**: `Rink` (canvas/rendering), `Puck` (physics), `Player` (AI/behavior), `Game` (orchestration)
- **Game Loop**: Uses `requestAnimationFrame` with `animate()` method
- **Team Values**: `'home'` (red, left side) and `'away'` (blue, right side)
- **Roles**: `'goalie'`, `'defenseman'`, `'forward'`

### Error Handling
- Validate canvas context availability
- Check for null/undefined before DOM manipulation
- Guard against division by zero in collision detection

### Performance
- Minimize object creation in the game loop
- Use `const` for values that don't change
- Clear canvas with `clearRect` before each frame

### Class Structure
- **Constructor**: Initialize all properties (x, y, radius, speed, etc.)
- **Update**: Handle physics/movement/positioning logic
- **Draw**: Render to canvas context (receives ctx as parameter)
- Game entities follow pattern: `Rink` → `Puck` → `Player` → `Game`

### Physics/Math Guidelines
- **Coordinates**: x/y for position, vx/vy for velocity
- **Distances**: Use `Math.hypot(dx, dy)` or `Math.sqrt(dx*dx + dy*dy)`
- **Angles**: Use `Math.atan2(dy, dx)` for direction calculation
- **Collision**: Check `distance < radius1 + radius2` for overlaps
- **Friction**: Apply as multiplier (e.g., `this.vx *= 0.99`)
- **Bounds**: Clamp position with `Math.max(min, Math.min(max, value))`

### DOM & Events
- Use `window.onload` for initialization
- Event listeners on DOM elements via `getElementById`
- Create UI elements dynamically with `document.createElement`
- Use `insertBefore` for positioning UI elements

### Color Constants
- Home team: `#cc0000` (red)
- Away team: `#0033cc` (blue)
- Puck: `black`
- Center line: `#cc0000` (red, lineWidth 5)
- Circle: `#0033cc` (blue)
- Rink border: `#b00` (red)

### Testing & Linting
- No test framework or linter configured
- Manual testing via browser (`python -m http.server 8000`)
- No single test command available
