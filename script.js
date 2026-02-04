// ==================== CONSTANTES DE JEU ====================
const PUCK_CONTROL_DISTANCE = 25;  // Distance pour contrôler le palet
const SHOT_CONTROL_DISTANCE = 12;  // Distance réduite pour intercepter un tir rapide
const SHOT_POWER = 15;             // Puissance des tirs (augmentée pour traverser)
const PASS_POWER = 10;             // Puissance des passes
const SHOT_SPEED_THRESHOLD = 10;   // Vitesse au-dessus de laquelle c'est considéré comme un tir
const PRESSURE_DISTANCE = 60;      // Distance considérée comme "sous pression"
const CLOSE_PRESSURE_DISTANCE = 35; // Distance très proche (duel)
const SHOT_ZONE_RATIO = 0.35;      // Zone de tir (35% depuis le but adverse)
const SLAPSHOT_ZONE_RATIO = 0.70;      // Peut tirer jusqu'à 70% du terrain (depuis le but adverse)
const SLAPSHOT_POWER = 18;             // Plus puissant que le tir normal (15)
const SLAPSHOT_ACCURACY_VARIANCE = 90; // Dispersion plus grande (en pixels Y)
const PASS_COOLDOWN = 8;           // Frames avant de pouvoir repasser
const BASE_SPREAD_DISTANCE = 100;           // Distance de base entre coéquipiers
const OFFENSIVE_SPREAD_MULTIPLIER = 1.6;    // 160px en zone offensive
const DEFENSIVE_SPREAD_MULTIPLIER = 1.2;    // 120px en zone défensive
const FORMATION_VERTICAL_SPREAD = 0.65;     // 65% de la hauteur de patinoire
const FORMATION_DEPTH_SPACING = 120;        // Écart avant-arrière

// ==================== CONSTANTES ANTI-MEUTE ====================
const REPULSION_FORCE_FREE_PUCK = 0.4;      // Force de répulsion palet libre
const REPULSION_FORCE_ATTACKING = 0.7;      // Force de répulsion en attaque
const REPULSION_FORCE_DEFENDING = 0.6;      // Force de répulsion défenseurs
const REPULSION_FORCE_DEFENSE = 0.4;        // Force de répulsion phase défensive
const DEFENSIVE_ENGAGEMENT_DIST = 150;      // Distance pour déclencher l'attaque (Active Zone Defense)
const NO_RETREAT_LINE_RATIO = 0.20;         // Ligne de non-recul (20% du terrain depuis le but)
const WINGER_HIGH_POSITION = 0.2;           // Position haute LW (20% de la patinoire)
const WINGER_LOW_POSITION = 0.8;            // Position basse RW (80% de la patinoire)
const DEFENDER_OFFENSIVE_SPREAD = 0.45;     // Étalement défenseurs en attaque
const DEFENDER_OFFENSIVE_PUSH = 0.40;       // Position X des défenseurs en zone offensive (40% = ligne bleue offensive)
const DEFENDER_PASS_BONUS = 100;            // Bonus pour passe à un défenseur bien placé pour tirer
const DEFENDER_DEFENSIVE_SPREAD = 0.35;     // Étalement défenseurs en défense
const CONTESTED_THRESHOLD = 25;    // Frames sous pression avant dégagement forcé
const CLEAR_POWER = 10;            // Puissance du dégagement
const GOALIE_HOLD_TIMEOUT = 120;   // Frames avant remise au centre si gardien ne bouge pas (~2s)
const MAX_POSSESSION_TIME = 40;    // Frames max avec le palet avant passe forcée

// ==================== CONSTANTES PASSE ====================
const PUCK_MIN_SPEED_FOR_PASS = 3; // Vitesse min du palet pour être considéré comme "en passe"
const PASS_PRIORITY_FRAMES = 15;   // Frames pendant lesquelles le receveur a la priorité
const PASS_RECEIVE_DISTANCE = 40;  // Distance pour recevoir une passe (plus large que contrôle normal)
const INTERCEPTION_COOLDOWN = 10;  // Frames pendant lesquelles les adversaires ne peuvent pas intercepter
const RECEIVE_PASS_COOLDOWN = 20;  // Frames avant que le receveur puisse repasser (~0.33s)
const INTERCEPTION_PASS_COOLDOWN = 25; // Frames avant qu'un intercepteur puisse passer (~0.4s)

class Rink {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Marge pour les tribunes
        this.margin = 50;

        // Dimensions de la patinoire (zone de jeu)
        this.rinkLeft = this.margin;
        this.rinkTop = this.margin;
        this.rinkWidth = this.canvas.width - this.margin * 2;  // 1000
        this.rinkHeight = this.canvas.height - this.margin * 2; // 500

        // Pour compatibilité avec le reste du code
        this.width = this.rinkWidth;
        this.height = this.rinkHeight;

        // Générer les spectateurs une seule fois
        this.spectators = this.generateSpectators();

        // Timer d'excitation des spectateurs (0 = pas d'excitation)
        this.spectatorExcitementTimer = 0;
        this.excitedTeamColor = null;  // 'red' ou 'blue'
    }

    generateSpectators() {
        const spectators = [];
        const spectatorSize = 8;
        const spacing = 12;
        const colors = ['#cc0000', '#0033cc'];  // Rouge et bleu uniquement

        // Fonction pseudo-aléatoire avec seed
        const pseudoRandom = (seed) => {
            const x = Math.sin(seed * 9999) * 10000;
            return x - Math.floor(x);
        };

        let seed = 42;

        // Zone haute (au-dessus de la patinoire)
        for (let y = 5; y < this.margin - 5; y += spacing) {
            for (let x = 5; x < this.canvas.width - 5; x += spacing) {
                const color = colors[Math.floor(pseudoRandom(seed++) * 2)];
                spectators.push({ x, y, baseX: x, baseY: y, size: spectatorSize, color });
            }
        }

        // Zone basse (en-dessous de la patinoire)
        for (let y = this.canvas.height - this.margin + 5; y < this.canvas.height - 5; y += spacing) {
            for (let x = 5; x < this.canvas.width - 5; x += spacing) {
                const color = colors[Math.floor(pseudoRandom(seed++) * 2)];
                spectators.push({ x, y, baseX: x, baseY: y, size: spectatorSize, color });
            }
        }

        // Zone gauche (à gauche de la patinoire)
        for (let y = this.margin; y < this.canvas.height - this.margin; y += spacing) {
            for (let x = 5; x < this.margin - 5; x += spacing) {
                const color = colors[Math.floor(pseudoRandom(seed++) * 2)];
                spectators.push({ x, y, baseX: x, baseY: y, size: spectatorSize, color });
            }
        }

        // Zone droite (à droite de la patinoire)
        for (let y = this.margin; y < this.canvas.height - this.margin; y += spacing) {
            for (let x = this.canvas.width - this.margin + 5; x < this.canvas.width - 5; x += spacing) {
                const color = colors[Math.floor(pseudoRandom(seed++) * 2)];
                spectators.push({ x, y, baseX: x, baseY: y, size: spectatorSize, color });
            }
        }

        return spectators;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dessiner les spectateurs (dans les tribunes)
        this.drawSpectators();

        // Dessiner la patinoire (glace blanche avec coins arrondis)
        this.drawIce();

        // Dessiner les bandes (bordure rouge)
        this.drawBoards();

        // Sauvegarder le contexte et translater pour dessiner les éléments de la patinoire
        this.ctx.save();
        this.ctx.translate(this.margin, this.margin);

        // Ligne centrale (Rouge)
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.strokeStyle = "#cc0000";
        this.ctx.lineWidth = 5;
        this.ctx.stroke();

        // Cercle central (Bleu)
        this.ctx.beginPath();
        this.ctx.arc(this.width / 2, this.height / 2, 60, 0, Math.PI * 2);
        this.ctx.strokeStyle = "#0033cc";
        this.ctx.stroke();

        // Lignes de but (Rouge)
        const goalLineOffset = 60;
        this.ctx.beginPath();
        this.ctx.moveTo(goalLineOffset, 0);
        this.ctx.lineTo(goalLineOffset, this.height);
        this.ctx.moveTo(this.width - goalLineOffset, 0);
        this.ctx.lineTo(this.width - goalLineOffset, this.height);
        this.ctx.strokeStyle = "#cc0000";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Cages (Rectangles)
        const goalWidth = 80;
        const goalDepth = 20;
        this.ctx.strokeStyle = "#444";
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(goalLineOffset - goalDepth, (this.height - goalWidth) / 2, goalDepth, goalWidth);
        this.ctx.strokeRect(this.width - goalLineOffset, (this.height - goalWidth) / 2, goalDepth, goalWidth);

        this.ctx.restore();
    }

    drawSpectators() {
        // Décrémenter le timer d'excitation
        if (this.spectatorExcitementTimer > 0) {
            this.spectatorExcitementTimer--;
        }

        for (const spec of this.spectators) {
            let drawX = spec.baseX;
            let drawY = spec.baseY;

            // Animer les spectateurs de l'équipe qui a marqué
            if (this.spectatorExcitementTimer > 0) {
                const isExcited = (this.excitedTeamColor === 'red' && spec.color === '#cc0000') ||
                    (this.excitedTeamColor === 'blue' && spec.color === '#0033cc');

                if (isExcited) {
                    // Animation de sautillement avec offset basé sur la position pour un effet de vague
                    const phase = (spec.baseX + spec.baseY) * 0.1 + this.spectatorExcitementTimer * 0.5;
                    const jumpHeight = 4 * Math.sin(phase);
                    drawY = spec.baseY + jumpHeight;

                    // Légère oscillation horizontale aussi
                    const sway = 2 * Math.sin(phase * 0.7);
                    drawX = spec.baseX + sway;
                }
            }

            // Mettre à jour les positions actuelles
            spec.x = drawX;
            spec.y = drawY;

            this.ctx.fillStyle = spec.color;
            this.ctx.fillRect(drawX, drawY, spec.size, spec.size);
        }
    }

    // Déclencher l'excitation des spectateurs d'une équipe
    triggerSpectatorExcitement(teamColor) {
        this.spectatorExcitementTimer = 180;  // 3 secondes (même durée que la lumière de but)
        this.excitedTeamColor = teamColor;  // 'red' ou 'blue'
    }

    reset() {
        this.spectatorExcitementTimer = 0;
        this.excitedTeamColor = null;
    }

    drawIce() {
        const radius = 30; // Coins arrondis
        const x = this.rinkLeft;
        const y = this.rinkTop;
        const w = this.rinkWidth;
        const h = this.rinkHeight;

        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + w - radius, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        this.ctx.lineTo(x + w, y + h - radius);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        this.ctx.lineTo(x + radius, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();

        this.ctx.fillStyle = "#ffffff";
        this.ctx.fill();
    }

    drawBoards() {
        const radius = 30;
        const x = this.rinkLeft;
        const y = this.rinkTop;
        const w = this.rinkWidth;
        const h = this.rinkHeight;

        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + w - radius, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        this.ctx.lineTo(x + w, y + h - radius);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        this.ctx.lineTo(x + radius, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();

        this.ctx.strokeStyle = "#b00";
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }
}

class Puck {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.99;
        this.controlledBy = null; // Joueur qui contrôle le palet
    }

    attachTo(player) {
        this.controlledBy = player;
        this.vx = 0;
        this.vy = 0;
    }

    release() {
        this.controlledBy = null;
    }

    shoot(targetX, targetY, power) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Variance légère de la puissance (+/- 15%) pour plus de réalisme
            const variance = 1 + (Math.random() - 0.5) * 0.3;
            const actualPower = power * variance;
            this.vx = (dx / distance) * actualPower;
            this.vy = (dy / distance) * actualPower;
        }
        this.controlledBy = null;
    }

    update(boundsWidth, boundsHeight) {
        // Si contrôlé par un joueur, suivre le joueur
        if (this.controlledBy) {
            const player = this.controlledBy;
            // Position du palet devant le joueur (direction du but adverse)
            const offsetX = player.team === 'home' ? 18 : -18;
            this.x = player.x + offsetX;
            this.y = player.y;
            return;
        }

        // Mouvement libre
        this.x += this.vx;
        this.y += this.vy;

        // Frottement
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Arrêt si très lent
        if (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1) {
            this.vx = 0;
            this.vy = 0;
        }

        // Rebond sur les bandes
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -1;
        } else if (this.x + this.radius > boundsWidth) {
            this.x = boundsWidth - this.radius;
            this.vx *= -1;
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= -1;
        } else if (this.y + this.radius > boundsHeight) {
            this.y = boundsHeight - this.radius;
            this.vy *= -1;
        }

        // === COLLISION AVEC LES CAGES ===
        // Dimensions des cages (doivent correspondre à celles du Rink)
        const goalLineOffset = 60;
        const goalWidth = 80;
        const goalDepth = 20;
        const goalTop = boundsHeight / 2 - goalWidth / 2;
        const goalBottom = boundsHeight / 2 + goalWidth / 2;

        // Cage gauche (équipe home défend)
        // Rectangle : x de (goalLineOffset - goalDepth) à goalLineOffset, y de goalTop à goalBottom
        const leftGoalLeft = goalLineOffset - goalDepth;   // 40
        const leftGoalRight = goalLineOffset;               // 60

        // Cage droite (équipe away défend)
        const rightGoalLeft = boundsWidth - goalLineOffset; // width - 60
        const rightGoalRight = boundsWidth - goalLineOffset + goalDepth; // width - 40

        // Vérifier collision avec cage gauche
        this.handleGoalCollision(leftGoalLeft, leftGoalRight, goalTop, goalBottom, 'left');

        // Vérifier collision avec cage droite
        this.handleGoalCollision(rightGoalLeft, rightGoalRight, goalTop, goalBottom, 'right');
    }

    handleGoalCollision(goalLeft, goalRight, goalTop, goalBottom, side) {
        // Le palet peut entrer SEULEMENT par l'ouverture (côté terrain)
        // - Cage gauche : ouverture à droite (x = goalRight)
        // - Cage droite : ouverture à gauche (x = goalLeft)

        const r = this.radius;

        // Vérifier si le palet est dans ou proche de la zone de la cage
        const inGoalX = this.x + r > goalLeft && this.x - r < goalRight;
        const inGoalY = this.y + r > goalTop && this.y - r < goalBottom;

        if (!inGoalX || !inGoalY) return; // Pas de collision possible

        // Déterminer d'où vient le palet
        if (side === 'left') {
            // Cage gauche - ouverture à droite (x = goalRight = 60)
            // Le palet peut entrer si il vient de la droite (vx < 0) et est proche de l'ouverture

            // Collision avec le fond (côté gauche de la cage, mur du fond)
            if (this.x - r < goalLeft && this.vx < 0) {
                this.x = goalLeft + r;
                this.vx *= -0.5; // Rebond amorti
            }

            // Collision avec le haut de la cage (barre horizontale haute)
            if (this.y - r < goalTop && this.y + r > goalTop && this.x > goalLeft && this.x < goalRight) {
                if (this.vy < 0) {
                    this.y = goalTop + r;
                    this.vy *= -0.5;
                }
            }

            // Collision avec le bas de la cage (barre horizontale basse)
            if (this.y + r > goalBottom && this.y - r < goalBottom && this.x > goalLeft && this.x < goalRight) {
                if (this.vy > 0) {
                    this.y = goalBottom - r;
                    this.vy *= -0.5;
                }
            }

            // Empêcher l'entrée par-derrière (le palet vient de la gauche, càd derrière la cage)
            if (this.x + r > goalLeft && this.x < goalLeft + r && this.vx > 0) {
                // Vérifie si le palet est dans la zone de hauteur de la cage
                if (this.y > goalTop && this.y < goalBottom) {
                    this.x = goalLeft - r;
                    this.vx *= -0.5;
                }
            }
        } else {
            // Cage droite - ouverture à gauche (x = goalLeft)

            // Collision avec le fond (côté droit de la cage, mur du fond)
            if (this.x + r > goalRight && this.vx > 0) {
                this.x = goalRight - r;
                this.vx *= -0.5;
            }

            // Collision avec le haut de la cage
            if (this.y - r < goalTop && this.y + r > goalTop && this.x > goalLeft && this.x < goalRight) {
                if (this.vy < 0) {
                    this.y = goalTop + r;
                    this.vy *= -0.5;
                }
            }

            // Collision avec le bas de la cage
            if (this.y + r > goalBottom && this.y - r < goalBottom && this.x > goalLeft && this.x < goalRight) {
                if (this.vy > 0) {
                    this.y = goalBottom - r;
                    this.vy *= -0.5;
                }
            }

            // Empêcher l'entrée par-derrière (le palet vient de la droite)
            if (this.x - r < goalRight && this.x > goalRight - r && this.vx < 0) {
                if (this.y > goalTop && this.y < goalBottom) {
                    this.x = goalRight + r;
                    this.vx *= -0.5;
                }
            }
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
    }
}

class Player {
    constructor(x, y, team, number, role) {
        this.x = x;
        this.y = y;
        this.homeX = x; // Position de base
        this.homeY = y;
        this.team = team;
        this.number = number;
        this.role = role;
        this.radius = 15;
        this.speed = 2.5;
        this.hasPuck = false;
        this.passCooldown = 0; // Empêche les passes trop rapides
        this.contestedFrames = 0; // Compteur de frames sous pression intense
        this.possessionTime = 0; // Temps de possession du palet
        this.forwardPosition = null; // 'LW', 'C', 'RW' pour les attaquants
    }

    // Distance vers un point
    distanceTo(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Distance de séparation adaptative selon la zone
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

    // Direction du but adverse
    getTargetGoalX(rinkWidth) {
        return this.team === 'home' ? rinkWidth - 60 : 60;
    }

    update(puck, allPlayers, rinkWidth, rinkHeight, game) {
        if (this.passCooldown > 0) this.passCooldown--;

        let targetX, targetY;

        if (this.role === 'goalie') {
            // Comportement gardien
            targetX = this.team === 'home' ? 60 : rinkWidth - 60;
            const goalWidth = 80;
            const goalTop = rinkHeight / 2 - goalWidth / 2;
            const goalBottom = rinkHeight / 2 + goalWidth / 2;
            const goalPadding = 20;

            // Si le gardien a le palet, il peut faire une passe
            if (this.hasPuck) {
                // Chercher un coéquipier pour faire une passe (probabilité de 3% par frame)
                if (Math.random() < 0.03) {
                    const passTarget = this.findBestPassTarget(allPlayers, rinkWidth);
                    if (passTarget) {
                        this.hasPuck = false;
                        puck.shoot(passTarget.x, passTarget.y, PASS_POWER);
                        game.passTarget = passTarget;
                        game.passPriorityTimer = PASS_PRIORITY_FRAMES;
                        game.passingTeam = this.team;
                        game.goalieHoldTimer = 0;
                        game.goalieWithPuck = null;
                        this.passCooldown = PASS_COOLDOWN;
                        return; // Action effectuée
                    }
                }
                // Sinon rester en position (le timer de remise au centre est géré dans Game)
                targetY = rinkHeight / 2;
            } else {
                const puckInMyZone = this.team === 'home'
                    ? puck.x < rinkWidth / 2
                    : puck.x > rinkWidth / 2;

                if (puckInMyZone) {
                    targetY = Math.max(goalTop - goalPadding, Math.min(puck.y, goalBottom + goalPadding));
                } else {
                    targetY = rinkHeight / 2;
                }
            }
        } else if (this.hasPuck) {
            // === COMPORTEMENT AVEC LE PALET ===
            const result = this.updateWithPuck(puck, allPlayers, rinkWidth, rinkHeight, game);
            if (result.action) return; // Action effectuée (tir/passe)
            targetX = result.targetX;
            targetY = result.targetY;
        } else if (game.teamWithPuck === null) {
            // === PALET LIBRE - Système de chasseur unique ===
            const myDistToPuck = this.distanceTo(puck.x, puck.y);
            const teammates = allPlayers.filter(p =>
                p.team === this.team && p !== this && p.role !== 'goalie'
            );

            // Suis-je le plus proche du palet dans mon équipe ?
            const isClosestToPuck = !teammates.some(mate =>
                mate.distanceTo(puck.x, puck.y) < myDistToPuck - 5
            );

            if (isClosestToPuck) {
                // JE suis le chasseur désigné - je fonce sur le palet
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
            const spreadDist = this.getSpreadDistance(rinkWidth);
            for (const mate of teammates) {
                const distToMate = this.distanceTo(mate.x, mate.y);
                if (distToMate < spreadDist && distToMate > 0) {
                    targetX += (this.x - mate.x) * REPULSION_FORCE_FREE_PUCK;
                    targetY += (this.y - mate.y) * REPULSION_FORCE_FREE_PUCK;
                }
            }
        } else if (game.teamWithPuck === this.team) {
            // === ÉQUIPE EN POSSESSION (mais pas moi) ===
            const result = this.updateTeamHasPuck(puck, allPlayers, rinkWidth, rinkHeight);
            targetX = result.targetX;
            targetY = result.targetY;
        } else {
            // === ÉQUIPE ADVERSE EN POSSESSION ===
            const result = this.updateDefending(puck, allPlayers, rinkWidth, rinkHeight, game);
            targetX = result.targetX;
            targetY = result.targetY;
        }

        // Déplacement vers la cible
        this.moveTowards(targetX, targetY);
    }

    updateWithPuck(puck, allPlayers, rinkWidth, rinkHeight, game) {
        const goalX = this.getTargetGoalX(rinkWidth);
        const goalY = rinkHeight / 2;

        // Incrémenter le temps de possession
        this.possessionTime++;

        // === TIRS DE DÉFENSEURS (Slapshot) ===
        if (this.role === 'defenseman') {
            const inSlapshotZone = this.team === 'home'
                ? (this.x > rinkWidth * (1 - SLAPSHOT_ZONE_RATIO) && this.x < rinkWidth * (1 - SHOT_ZONE_RATIO))
                : (this.x < rinkWidth * SLAPSHOT_ZONE_RATIO && this.x > rinkWidth * SHOT_ZONE_RATIO);

            if (inSlapshotZone) {
                // REVIEW: Amélioration critique - Vérification de ligne de tir "tunnel" plutôt que radiale
                // On vérifie un rectangle devant le joueur vers le but : Longueur 150px, Largeur 30px
                const laneLength = 150;
                const laneWidth = 30;

                const hasClearShot = !allPlayers.some(p => {
                    if (p.team === this.team || p.role === 'goalie') return false;

                    const dx = p.x - this.x;
                    const dy = Math.abs(p.y - this.y);

                    // Vérifier si dans la direction du but
                    const isTowardsGoal = this.team === 'home' ? dx > 0 : dx < 0;

                    if (!isTowardsGoal) return false;

                    // Vérifier si dans le "tunnel" de tir
                    return Math.abs(dx) < laneLength && dy < laneWidth;
                });

                // 40% de chance de tirer si la voie est libre
                if (hasClearShot && Math.random() < 0.40) {
                    // Tir puissant moins précis
                    // Variance doublée par rapport à la constante pour couvrir une zone plus large -> [-90, +90]
                    const shotY = goalY + (Math.random() - 0.5) * SLAPSHOT_ACCURACY_VARIANCE * 2;
                    this.hasPuck = false;
                    puck.shoot(goalX, shotY, SLAPSHOT_POWER);
                    game.lastShooter = this;
                    this.possessionTime = 0;
                    this.contestedFrames = 0;
                    return { action: true };
                }
            }
        }

        // Zone de tir ?
        const inShotZone = this.team === 'home'
            ? this.x > rinkWidth * (1 - SHOT_ZONE_RATIO)
            : this.x < rinkWidth * SHOT_ZONE_RATIO;

        // Compter les adversaires proches
        const nearbyOpponents = this.countNearbyOpponents(allPlayers, PRESSURE_DISTANCE);
        const veryCloseOpponents = this.countNearbyOpponents(allPlayers, CLOSE_PRESSURE_DISTANCE);

        // Gestion de la contestation (duel)
        if (veryCloseOpponents >= 1) {
            this.contestedFrames++;
        } else {
            this.contestedFrames = Math.max(0, this.contestedFrames - 2);
        }

        // PASSE FORCÉE si possession trop longue OU contesté trop longtemps
        if (this.possessionTime >= MAX_POSSESSION_TIME || this.contestedFrames >= CONTESTED_THRESHOLD) {
            return this.forcePass(puck, allPlayers, rinkWidth, rinkHeight, game);
        }

        // Tirer si en zone de tir - 77% de chances de tirer
        if (inShotZone && nearbyOpponents <= 1 && Math.random() < 0.77) {
            const shotY = goalY + (Math.random() - 0.5) * 60;
            this.hasPuck = false;  // IMPORTANT: marquer comme n'ayant plus le palet AVANT le tir
            puck.shoot(goalX, shotY, SHOT_POWER);
            game.lastShooter = this;  // Enregistrer le tireur
            this.possessionTime = 0;
            this.contestedFrames = 0;
            return { action: true };
        }

        // Tir sous pression (2 adversaires proches) - 57% de chances
        if (inShotZone && nearbyOpponents <= 2 && Math.random() < 0.57) {
            const shotY = goalY + (Math.random() - 0.5) * 80;
            this.hasPuck = false;
            puck.shoot(goalX, shotY, SHOT_POWER * 0.9);  // Tir légèrement moins puissant car sous pression
            game.lastShooter = this;  // Enregistrer le tireur
            this.possessionTime = 0;
            this.contestedFrames = 0;
            return { action: true };
        }

        // Passe sous pression proche - réduit en zone offensive (préférer tirer)
        const passProbUnderPressure = inShotZone ? 0.30 : 0.60;
        if (veryCloseOpponents >= 1 && this.passCooldown === 0 && Math.random() < passProbUnderPressure) {
            return this.forcePass(puck, allPlayers, rinkWidth, rinkHeight, game);
        }

        // Passe proactive - très réduite en zone offensive
        const proactivePassProb = inShotZone ? 0.05 : 0.12;
        if (this.passCooldown === 0 && Math.random() < proactivePassProb) {
            const passTarget = this.findBestPassTarget(allPlayers, rinkWidth);
            if (passTarget) {
                this.hasPuck = false;  // IMPORTANT: marquer comme n'ayant plus le palet AVANT la passe
                puck.shoot(passTarget.x, passTarget.y, PASS_POWER);
                // Enregistrer le destinataire pour lui donner la priorité
                game.passTarget = passTarget;
                game.passPriorityTimer = PASS_PRIORITY_FRAMES;
                game.passingTeam = this.team; // Bloquer les interceptions adverses
                this.possessionTime = 0;
                this.contestedFrames = 0;
                this.passCooldown = PASS_COOLDOWN;
                return { action: true };
            }
        }

        // Sinon avancer vers le but
        return {
            action: false,
            targetX: goalX,
            targetY: goalY + (this.homeY - rinkHeight / 2) * 0.3
        };
    }

    forcePass(puck, allPlayers, rinkWidth, rinkHeight, game) {
        // IMPORTANT: marquer comme n'ayant plus le palet AVANT la passe
        this.hasPuck = false;

        const passTarget = this.findBestPassTarget(allPlayers, rinkWidth);
        if (passTarget) {
            // Passe vers le coéquipier le mieux placé
            puck.shoot(passTarget.x, passTarget.y, PASS_POWER);
            // Enregistrer le destinataire pour lui donner la priorité
            game.passTarget = passTarget;
            game.passPriorityTimer = PASS_PRIORITY_FRAMES;
            game.passingTeam = this.team; // Bloquer les interceptions adverses
        } else {
            // Dégagement varié
            const rand = Math.random();
            const direction = this.team === 'home' ? 1 : -1;

            if (rand < 0.5) {
                // Dégagement vers l'avant
                const clearX = this.team === 'home' ? rinkWidth - 50 : 50;
                const clearY = rinkHeight / 2 + (Math.random() - 0.5) * 200;
                puck.shoot(clearX, clearY, CLEAR_POWER);
            } else if (rand < 0.75) {
                // Dégagement latéral
                const clearX = this.x + direction * 100;
                const clearY = this.y + (Math.random() > 0.5 ? 1 : -1) * 150;
                puck.shoot(clearX, clearY, CLEAR_POWER * 0.9);
            } else {
                // Passe en arrière vers le défenseur
                const defender = allPlayers.find(p =>
                    p.team === this.team &&
                    p.role === 'defenseman'
                );
                if (defender) {
                    puck.shoot(defender.x, defender.y, PASS_POWER * 0.8);
                    game.passTarget = defender;
                    game.passPriorityTimer = PASS_PRIORITY_FRAMES;
                    game.passingTeam = this.team; // Bloquer les interceptions adverses
                } else {
                    // Sinon dégagement arrière
                    const clearX = this.x - direction * 100;
                    const clearY = rinkHeight / 2 + (Math.random() - 0.5) * 100;
                    puck.shoot(clearX, clearY, CLEAR_POWER * 0.8);
                }
            }
        }
        this.possessionTime = 0;
        this.contestedFrames = 0;
        this.passCooldown = PASS_COOLDOWN;
        return { action: true };
    }

    updateTeamHasPuck(puck, allPlayers, rinkWidth, rinkHeight) {
        const carrier = allPlayers.find(p => p.hasPuck);
        if (!carrier) {
            return { targetX: this.homeX, targetY: this.homeY };
        }

        let targetX, targetY;
        const goalX = this.getTargetGoalX(rinkWidth);

        if (this.role === 'forward') {
            const depthOffset = this.team === 'home' ? 120 : -120;
            targetX = this.team === 'home'
                ? Math.min(carrier.x + depthOffset, rinkWidth - 80)
                : Math.max(carrier.x + depthOffset, 80);

            // Positionnement vertical basé sur le rôle (formation triangulaire)
            switch (this.forwardPosition) {
                case 'LW':
                    // Ailier gauche : haut de la patinoire
                    targetY = rinkHeight * WINGER_HIGH_POSITION;
                    break;
                case 'RW':
                    // Ailier droit : bas de la patinoire
                    targetY = rinkHeight * WINGER_LOW_POSITION;
                    break;
                case 'C':
                default:
                    // Centre : proche du porteur, légèrement décalé
                    targetY = carrier.y + (Math.random() - 0.5) * 60;
                    break;
            }

            // Éviter l'agglutinement avec les coéquipiers
            const teammates = allPlayers.filter(p => p.team === this.team && p !== this && p.role !== 'goalie');
            const spreadDist = this.getSpreadDistance(rinkWidth);
            for (const mate of teammates) {
                const dist = this.distanceTo(mate.x, mate.y);
                if (dist < spreadDist && dist > 0) {
                    targetY += (this.y - mate.y) * REPULSION_FORCE_ATTACKING;
                }
            }
        } else {
            // Défenseurs : PARTICIPATION OFFENSIVE ACTIVE
            // Stratégie "TOTAL HOCKEY" : Les défenseurs montent en zone offensive pour tirer et passer
            const redLine = rinkWidth / 2;
            const offensiveLine = rinkWidth * DEFENDER_OFFENSIVE_PUSH; // ~40% du terrain
            const carrierInOffensiveZone = this.team === 'home'
                ? carrier.x > redLine
                : carrier.x < redLine;

            // Les défenseurs avancent ACTIVEMENT en zone offensive
            if (this.team === 'home') {
                // ÉQUIPE ROUGE (Attaque vers la droite >)
                if (carrierInOffensiveZone) {
                    // En zone offensive : monter jusqu'à la ligne offensive (pas juste la ligne rouge)
                    // Position = 60% du terrain (entre ligne rouge et ligne bleue adverse)
                    targetX = rinkWidth - offensiveLine; // ~60% du terrain (milieu zone offensive)
                } else {
                    // Transition : avancer avec le porteur mais rester en soutien
                    targetX = Math.max(redLine - 50, carrier.x - 100);
                }
            } else {
                // ÉQUIPE BLEUE (Attaque vers la gauche <)
                if (carrierInOffensiveZone) {
                    // En zone offensive : monter jusqu'à la ligne offensive
                    targetX = offensiveLine; // ~40% du terrain
                } else {
                    // Transition
                    targetX = Math.min(redLine + 50, carrier.x + 100);
                }
            }

            // Positionnement vertical : haut/bas selon homeY initial
            const isTopDefender = this.homeY < rinkHeight / 2;
            const defensiveSpread = rinkHeight * DEFENDER_OFFENSIVE_SPREAD;
            targetY = rinkHeight / 2 + (isTopDefender ? -defensiveSpread : defensiveSpread);

            // Éviter l'agglutinement avec les coéquipiers
            const teammates = allPlayers.filter(p => p.team === this.team && p !== this && p.role !== 'goalie');
            const spreadDist = this.getSpreadDistance(rinkWidth);
            for (const mate of teammates) {
                const dist = this.distanceTo(mate.x, mate.y);
                if (dist < spreadDist && dist > 0) {
                    targetY += (this.y - mate.y) * 0.6;
                }
            }

            // BOOST DE VITESSE (SPRINT)
            // Si on est loin de la cible (> 100px), on fonce !
            // NOTE: Exécuté APRÈS le calcul de targetY pour éviter les valeurs NaN
            if (Math.abs(this.x - targetX) > 100) {
                const dx = targetX - this.x;
                const dy = targetY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    // Vitesse très élevée pour se replacer (4.0 = très rapide)
                    const sprintBonus = 4.0;
                    this.x += (dx / dist) * sprintBonus;
                    this.y += (dy / dist) * sprintBonus;
                }
            }
        }

        targetY = Math.max(50, Math.min(rinkHeight - 50, targetY));

        return { targetX, targetY };
    }

    updateDefending(puck, allPlayers, rinkWidth, rinkHeight, game) {
        const carrier = game.puckCarrier;
        let targetX, targetY;

        // Calculer les coéquipiers une seule fois
        const teammates = allPlayers.filter(p => p.team === this.team && p !== this && p.role !== 'goalie');

        // === SYSTÈME DE CHASSEUR DÉFENSIF UNIQUE ===
        // Seul le joueur le plus proche du porteur presse, les autres couvrent
        let isClosestToCarrier = false;
        if (carrier) {
            const myDistToCarrier = this.distanceTo(carrier.x, carrier.y);
            isClosestToCarrier = !teammates.some(mate =>
                mate.distanceTo(carrier.x, carrier.y) < myDistToCarrier - 10
            );
        }

        if (this.role === 'forward') {
            if (carrier && isClosestToCarrier) {
                // JE suis le chasseur défensif - presser le porteur
                targetX = carrier.x;
                targetY = carrier.y;
            } else {
                // Bloquer les lignes de passe vers ma zone
                const blockOffset = this.team === 'home' ? -50 : 50;
                targetX = puck.x + blockOffset;
                // Utiliser forwardPosition pour couvrir différentes zones
                switch (this.forwardPosition) {
                    case 'LW':
                        targetY = rinkHeight * 0.25;
                        break;
                    case 'RW':
                        targetY = rinkHeight * 0.75;
                        break;
                    case 'C':
                    default:
                        targetY = rinkHeight / 2;
                        break;
                }
            }
        } else {
            // === DÉFENSEURS : ACTIVE ZONE DEFENSE ===
            const myGoalX = this.team === 'home' ? 0 : rinkWidth;
            const isTopSide = this.homeY < rinkHeight / 2;

            // 1. Définir ma Zone de Responsabilité (Haut/Bas)
            // Le palet est-il dans ma "moitié" verticale ?
            const puckInMyZone = isTopSide
                ? puck.y < rinkHeight / 2 + 20 // Marge de recouvrement
                : puck.y > rinkHeight / 2 - 20;

            const distToPuck = this.distanceTo(puck.x, puck.y);
            const distToMyGoal = Math.abs(this.x - myGoalX);
            const noRetreatLine = rinkWidth * NO_RETREAT_LINE_RATIO;

            // 2. Décision (State Machine)
            const isDeepInZone = this.team === 'home'
                ? puck.x < noRetreatLine
                : puck.x > rinkWidth - noRetreatLine;

            if (puckInMyZone && (distToPuck < DEFENSIVE_ENGAGEMENT_DIST || isDeepInZone)) {
                // CAS A : ENGAGEMENT (Palet dans ma zone ET (proche OU ligne franchie))
                // On fonce sur le porteur !
                targetX = puck.x;
                targetY = puck.y;
            } else if (!puckInMyZone) {
                // CAS B : COUVERTURE DU SLOT (Palet de l'autre côté)
                // Position X : Entre le palet et le but
                const midX = (myGoalX + puck.x) / 2;

                // Ne pas reculer dans le gardien (marge 60px), mais IGNORER la noRetreatLine
                // car on doit couvrir le slot même si le jeu est profond.
                const minCoverX = 60;
                targetX = this.team === 'home'
                    ? Math.max(midX, minCoverX)
                    : Math.min(midX, rinkWidth - minCoverX);

                // Position Y : Centre de la patinoire (Slot)
                targetY = rinkHeight / 2;
                targetY += (isTopSide ? -20 : 20);
            } else {
                // CAS C : GAP CONTROL (Palet loin ou Zone Neutre)
                // Reculer en gardant l'écart, mais s'arrêter à la ligne de non-recul
                const defenseOffset = this.team === 'home' ? -80 : 80;
                let idealX = puck.x + defenseOffset;

                // Ici on applique la limitation "No Retreat" pour forcer le duel à la ligne
                if (this.team === 'home') {
                    targetX = Math.max(idealX, noRetreatLine);
                } else {
                    targetX = Math.min(idealX, rinkWidth - noRetreatLine);
                }

                // S'aligner avec le palet verticalement mais rester dans sa zone
                targetY = puck.y;
                if (isTopSide) {
                    targetY = Math.min(targetY, rinkHeight / 2 - 10);
                } else {
                    targetY = Math.max(targetY, rinkHeight / 2 + 10);
                }
            }
        }

        // Éviter l'agglutinement avec les coéquipiers
        const spreadDist = this.getSpreadDistance(rinkWidth);
        for (const mate of teammates) {
            const dist = this.distanceTo(mate.x, mate.y);
            if (dist < spreadDist && dist > 0) {
                targetX += (this.x - mate.x) * 0.4;
                targetY += (this.y - mate.y) * 0.4;
            }
        }

        return { targetX, targetY };
    }

    countNearbyOpponents(allPlayers, distance) {
        return allPlayers.filter(p =>
            p.team !== this.team &&
            p.role !== 'goalie' &&
            this.distanceTo(p.x, p.y) < distance
        ).length;
    }

    findBestPassTarget(allPlayers, rinkWidth) {
        const teammates = allPlayers.filter(p =>
            p.team === this.team &&
            p !== this &&
            p.role !== 'goalie'
        );

        if (teammates.length === 0) return null;

        let bestTarget = null;
        let bestScore = -Infinity;

        for (const mate of teammates) {
            // Distance du coéquipier au but adverse (plus petit = meilleur)
            const distToGoal = this.team === 'home'
                ? rinkWidth - mate.x
                : mate.x;

            const nearbyOpps = mate.countNearbyOpponents(allPlayers, PRESSURE_DISTANCE);
            const distFromMe = this.distanceTo(mate.x, mate.y);

            // Score corrigé :
            // - Favoriser les joueurs PROCHES du but adverse (petit distToGoal = bonus)
            // - Pénaliser les joueurs marqués
            // - Favoriser les passes moyennes (ni trop courtes, ni trop longues)
            // - Pénaliser les passes trop courtes (moins de 60 pixels)
            const advancementBonus = (rinkWidth - distToGoal) * 1.5; // Plus proche du but = mieux
            const pressurePenalty = nearbyOpps * 80;
            const distancePenalty = distFromMe < 60 ? 150 : (distFromMe > 300 ? 50 : 0);
            const optimalDistBonus = (distFromMe > 80 && distFromMe < 200) ? 30 : 0;

            // BONUS DÉFENSEUR EN POSITION DE TIR
            // Si le défenseur est en zone offensive et libre, c'est une excellente option de passe
            let defenderSlapshotBonus = 0;
            if (mate.role === 'defenseman') {
                const inOffensiveZone = this.team === 'home'
                    ? mate.x > rinkWidth * 0.5  // Défenseur après la ligne rouge
                    : mate.x < rinkWidth * 0.5;
                const inSlapshotZone = this.team === 'home'
                    ? mate.x > rinkWidth * (1 - SLAPSHOT_ZONE_RATIO)
                    : mate.x < rinkWidth * SLAPSHOT_ZONE_RATIO;

                if (inOffensiveZone && nearbyOpps === 0) {
                    defenderSlapshotBonus = DEFENDER_PASS_BONUS; // Défenseur libre en zone = bonne option
                }
                if (inSlapshotZone && nearbyOpps === 0) {
                    defenderSlapshotBonus += 50; // Bonus supplémentaire si en position de slapshot
                }
            }

            const score = advancementBonus - pressurePenalty - distancePenalty + optimalDistBonus + defenderSlapshotBonus;

            if (score > bestScore) {
                bestScore = score;
                bestTarget = mate;
            }
        }

        return bestTarget;
    }

    moveTowards(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.speed) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = (this.team === 'home') ? '#cc0000' : '#0033cc';
        ctx.fill();

        // Bordure (dorée si a le palet)
        ctx.strokeStyle = this.hasPuck ? "#ffd700" : "white";
        ctx.lineWidth = this.hasPuck ? 3 : 2;
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.number, this.x, this.y);
    }
}

class Game {
    constructor() {
        this.rink = new Rink('ice-rink');
        this.puck = new Puck(this.rink.width / 2, this.rink.height / 2);

        this.players = [];
        this.initTeams();

        this.puckCarrier = null;
        this.teamWithPuck = null;

        // Système de passe en cours
        this.passTarget = null;      // Joueur destinataire de la passe
        this.passPriorityTimer = 0;  // Timer de priorité pour le receveur
        this.passingTeam = null;     // Équipe qui a fait la passe (pour bloquer les interceptions)

        // Système d'arrêt du gardien
        this.goalieHoldTimer = 0;    // Timer pour le gardien tenant le palet
        this.goalieWithPuck = null;  // Gardien qui a le palet

        // Système de score
        this.scoreHome = 0;
        this.scoreAway = 0;
        this.goalCooldown = 0;  // Empêche les buts multiples
        this.lastShooter = null;  // Dernier joueur ayant tiré au but

        // Système de lumières de but
        this.goalLightLeft = 0;   // Timer pour la lumière gauche (cage des bleus)
        this.goalLightRight = 0;  // Timer pour la lumière droite (cage des rouges)

        // Message de but
        this.goalMessage = null;      // Texte du message ("Équipe rouge marque !" etc.)
        this.goalMessageTimer = 0;    // Timer pour l'affichage du message

        // Liste des buteurs pour chaque équipe
        this.scorersHome = [];  // Numéros des joueurs de l'équipe rouge ayant marqué
        this.scorersAway = [];  // Numéros des joueurs de l'équipe bleue ayant marqué

        // Système de chronomètre
        this.gameTime = 30;  // 30 secondes
        this.timerInterval = null;
        this.gameEnded = false;
        // Flag pour la prolongation (mort subite)
        this.isOvertime = false;
        this.overtimeMessageTimer = 0; // Timer pour le message "Prolongation"

        // Étoile du match
        this.starOfTheMatch = null;  // Objet {number, team, role, reason}
        this.starOfTheMatchTimer = 0;  // Timer pour l'animation

        // Tour du chapeau (hat trick)
        this.hatTrickMessage = null;   // Message à afficher
        this.hatTrickTimer = 0;        // Timer pour l'affichage (120 frames = 2 secondes)
        this.hatTrickPlayer = null;    // Joueur ayant réalisé le tour du chapeau

        this.running = false;

        document.getElementById('start-btn').addEventListener('click', () => {
            // Si le match est terminé, ne rien faire
            if (this.gameEnded) return;

            this.running = !this.running;

            if (this.running) {
                // Démarrer le chronomètre
                this.startTimer();

                if (!this.puckCarrier && Math.abs(this.puck.vx) < 0.1) {
                    this.puck.vx = (Math.random() - 0.5) * 15;
                    this.puck.vy = (Math.random() - 0.5) * 15;
                }
            } else {
                // Mettre en pause le chronomètre
                this.stopTimer();
            }
        });

        // Bouton "Nouveau match"
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.newGame();
        });

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initTeams() {
        const w = this.rink.width;
        const h = this.rink.height;

        // Équipe Domicile (Rouge)
        this.players.push(new Player(100, h / 2, 'home', 39, 'goalie'));
        this.players.push(new Player(200, h / 2 - 50, 'home', 8, 'defenseman'));
        this.players.push(new Player(200, h / 2 + 50, 'home', 7, 'defenseman'));

        // Attaquants Home avec rôles spécifiques
        const homeLW = new Player(350, h / 2 - 100, 'home', 62, 'forward');
        homeLW.forwardPosition = 'LW';
        this.players.push(homeLW);

        const homeC = new Player(350, h / 2, 'home', 29, 'forward');
        homeC.forwardPosition = 'C';
        this.players.push(homeC);

        const homeRW = new Player(350, h / 2 + 100, 'home', 88, 'forward');
        homeRW.forwardPosition = 'RW';
        this.players.push(homeRW);

        // Équipe Extérieur (Bleu)
        this.players.push(new Player(w - 100, h / 2, 'away', 35, 'goalie'));
        this.players.push(new Player(w - 200, h / 2 - 50, 'away', 2, 'defenseman'));
        this.players.push(new Player(w - 200, h / 2 + 50, 'away', 99, 'defenseman'));

        // Attaquants Away avec rôles spécifiques
        const awayLW = new Player(w - 350, h / 2 - 100, 'away', 29, 'forward');
        awayLW.forwardPosition = 'LW';
        this.players.push(awayLW);

        const awayC = new Player(w - 350, h / 2, 'away', 97, 'forward');
        awayC.forwardPosition = 'C';
        this.players.push(awayC);

        const awayRW = new Player(w - 350, h / 2 + 100, 'away', 93, 'forward');
        awayRW.forwardPosition = 'RW';
        this.players.push(awayRW);
    }

    animate() {
        // Gérer le délai du message de prolongation
        if (this.overtimeMessageTimer > 0) {
            this.overtimeMessageTimer--;

            // Si le message est fini, lancer la prolongation
            if (this.overtimeMessageTimer === 0) {
                this.running = true;
                this.startTimer();
                // Lancer le palet pour reprendre
                this.puck.vx = (Math.random() - 0.5) * 15;
                this.puck.vy = (Math.random() - 0.5) * 15;
            }
        }

        // Gérer le délai du message de tour du chapeau
        if (this.hatTrickTimer > 0) {
            this.hatTrickTimer--;

            // Si le message est fini, relancer le chronomètre
            if (this.hatTrickTimer === 0) {
                this.hatTrickMessage = null;
                this.hatTrickPlayer = null;
                this.startTimer();  // Relancer le chronomètre
            }
        }

        // Si le jeu tourne ET qu'il n'y a pas de message affiché (but, prolongation, tour du chapeau)
        if (this.running && this.goalMessageTimer <= 0 && this.overtimeMessageTimer <= 0 && this.hatTrickTimer <= 0) {
            // Décrémenter le cooldown de but
            if (this.goalCooldown > 0) this.goalCooldown--;

            // 1. Mettre à jour le palet (mouvement si libre)
            this.puck.update(this.rink.width, this.rink.height);

            // 2. Mettre à jour les joueurs (décisions, mouvements, passes)
            this.players.forEach(player =>
                player.update(this.puck, this.players, this.rink.width, this.rink.height, this)
            );

            // 3. Gérer les collisions
            this.checkCollisions();

            // 4. Mettre à jour le contrôle du palet (en dernier pour permettre les passes)
            this.checkPuckControl();

            // 5. Gérer le timer du gardien tenant le palet
            this.checkGoalieHoldTimer();

            // 6. Vérifier si un but est marqué
            this.checkGoal();
        }

        this.rink.draw();
        this.drawGoalLights();  // Dessiner les lumières de but
        this.drawScore();

        // Dessiner les joueurs et le palet avec le décalage des tribunes
        const ctx = this.rink.ctx;
        ctx.save();
        ctx.translate(this.rink.margin, this.rink.margin);
        this.players.forEach(player => player.draw(ctx));
        this.puck.draw(ctx);
        ctx.restore();

        this.drawGoalMessage(); // Dessiner le message de but
        this.drawScorers();      // Dessiner les numéros des buteurs
        this.drawStarOfTheMatch();  // Dessiner l'étoile du match
        this.drawOvertimeMessage(); // Dessiner le message de prolongation
        this.drawHatTrickMessage(); // Dessiner le message de tour du chapeau

        requestAnimationFrame(this.animate);
    }

    checkGoal() {
        if (this.goalCooldown > 0) return;  // Éviter les buts multiples

        const goalLineOffset = 60;
        const goalWidth = 80;
        const goalTop = this.rink.height / 2 - goalWidth / 2;
        const goalBottom = this.rink.height / 2 + goalWidth / 2;

        // Vitesse du palet pour déterminer si c'est un tir
        const puckSpeed = Math.sqrt(this.puck.vx * this.puck.vx + this.puck.vy * this.puck.vy);
        if (puckSpeed < 3) return;  // Pas assez rapide pour être un tir

        // Vérifier si le palet est dans une cage
        let scoringTeam = null;

        // But dans la cage de gauche (home défend) -> away marque
        if (this.puck.x <= goalLineOffset &&
            this.puck.y >= goalTop &&
            this.puck.y <= goalBottom) {
            scoringTeam = 'away';
        }
        // But dans la cage de droite (away défend) -> home marque
        else if (this.puck.x >= this.rink.width - goalLineOffset &&
            this.puck.y >= goalTop &&
            this.puck.y <= goalBottom) {
            scoringTeam = 'home';
        }

        if (scoringTeam) {
            // Calculer si le tir venait du centre ou des côtés
            const centerY = this.rink.height / 2;
            const distFromCenter = Math.abs(this.puck.y - centerY);
            const centerZone = this.rink.height * 0.25;  // Zone centrale = 50% du milieu

            // Probabilité de but selon le tireur :
            // - #29 équipe rouge (home) : 75%
            // - #88 équipe rouge (home) : 60%
            // - #97 équipe bleue (away) : 65%
            // - Autres joueurs : 55%
            let goalProbability = 0.55;
            if (this.lastShooter) {
                if (this.lastShooter.number === 29 && this.lastShooter.team === 'home') {
                    goalProbability = this.isOvertime ? 0.87 : 0.75;
                } else if (this.lastShooter.number === 88 && this.lastShooter.team === 'home') {
                    goalProbability = 0.60;
                } else if (this.lastShooter.number === 97 && this.lastShooter.team === 'away') {
                    goalProbability = 0.65;
                }
            }

            if (Math.random() < goalProbability) {
                // BUT !
                if (scoringTeam === 'home') {
                    this.scoreHome++;
                    // Enregistrer le buteur
                    if (this.lastShooter && this.lastShooter.team === 'home') {
                        this.scorersHome.push(this.lastShooter.number);
                    }
                    // Allumer la lumière de la cage droite (cage des bleus où home a marqué)
                    this.goalLightRight = 180;  // 3 secondes de clignotement
                    // Exciter les supporters rouges (équipe home)
                    this.rink.triggerSpectatorExcitement('red');
                    // Afficher le message
                    this.goalMessage = "Équipe rouge marque !";
                    this.goalMessageTimer = 180;
                } else {
                    this.scoreAway++;
                    // Enregistrer le buteur
                    if (this.lastShooter && this.lastShooter.team === 'away') {
                        this.scorersAway.push(this.lastShooter.number);
                    }
                    // Allumer la lumière de la cage gauche (cage des rouges où away a marqué)
                    this.goalLightLeft = 180;  // 3 secondes de clignotement
                    // Exciter les supporters bleus (équipe away)
                    this.rink.triggerSpectatorExcitement('blue');
                    // Afficher le message
                    this.goalMessage = "Équipe bleue marque !";
                    this.goalMessageTimer = 180;
                }
                console.log(`⚽ BUT ! Score: Home ${this.scoreHome} - ${this.scoreAway} Away`);

                // Vérifier si c'est un tour du chapeau (3 buts par le même joueur)
                if (this.lastShooter) {
                    const scorerList = scoringTeam === 'home' ? this.scorersHome : this.scorersAway;
                    const goalsCount = scorerList.filter(n => n === this.lastShooter.number).length;
                    if (goalsCount === 3) {
                        console.log(`🎩 TOUR DU CHAPEAU ! #${this.lastShooter.number}`);
                        this.hatTrickMessage = `Tour du chapeau ! #${this.lastShooter.number}`;
                        this.hatTrickPlayer = this.lastShooter;
                        this.hatTrickTimer = 120;  // 2 secondes
                        this.stopTimer();  // Arrêter le chronomètre
                    }
                }

                // En prolongation, le but met fin au match immédiatement (mort subite)
                if (this.isOvertime) {
                    console.log(`🚨 BUT EN PROLONGATION ! Fin du match !`);
                    this.endGameFinal(scoringTeam);
                } else {
                    this.resetAfterGoal();
                }
            }
            this.goalCooldown = 30;  // Cooldown pour éviter les détections multiples
        }
    }

    resetAfterGoal() {
        // Remettre le palet au centre
        this.puck.x = this.rink.width / 2;
        this.puck.y = this.rink.height / 2;
        this.puck.vx = 0;
        this.puck.vy = 0;
        this.puck.release();

        // Libérer le porteur du palet
        if (this.puckCarrier) {
            this.puckCarrier.hasPuck = false;
        }
        this.puckCarrier = null;
        this.teamWithPuck = null;
        this.passTarget = null;
        this.passPriorityTimer = 0;
        this.passingTeam = null;

        // Remettre les joueurs à leurs positions de départ
        this.players.forEach(player => {
            player.x = player.homeX;
            player.y = player.homeY;
            player.hasPuck = false;
            player.passCooldown = 0;
            player.possessionTime = 0;
            player.contestedFrames = 0;
        });

        // Petite pause puis relancer
        this.goalCooldown = 60;  // ~1 seconde de pause
    }

    drawScore() {
        const ctx = this.rink.ctx;

        // Position X centrée sur le canvas complet (pas la patinoire)
        const centerX = this.rink.canvas.width / 2;

        // Rectangle blanc de fond pour la lisibilité
        const bgWidth = 120;
        const bgHeight = 36;
        const bgX = centerX - bgWidth / 2;
        const bgY = 8;
        const borderRadius = 8;

        ctx.beginPath();
        ctx.roundRect(bgX, bgY, bgWidth, bgHeight, borderRadius);
        // Fond gris si le match est terminé, sinon blanc
        ctx.fillStyle = this.gameEnded ? 'rgba(150, 150, 150, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';

        // Score équipe Home (rouge)
        ctx.fillStyle = '#cc0000';
        ctx.fillText(this.scoreHome.toString(), centerX - 40, 35);

        // Tiret
        ctx.fillStyle = '#333';
        ctx.fillText('-', centerX, 35);

        // Score équipe Away (bleu)
        ctx.fillStyle = '#0033cc';
        ctx.fillText(this.scoreAway.toString(), centerX + 40, 35);
    }

    drawGoalLights() {
        const ctx = this.rink.ctx;
        const lightRadius = 12;
        // Centrer verticalement par rapport à la patinoire pour être au niveau des cages
        const lightY = this.rink.margin + this.rink.height / 2;

        // Décrémenter les timers de lumières
        if (this.goalLightLeft > 0) this.goalLightLeft--;
        if (this.goalLightRight > 0) this.goalLightRight--;

        // Fonction pour déterminer si la lumière est en phase "allumée" (clignotement binaire)
        // Alterne toutes les 10 frames (~6 clignotements par seconde)
        const isBlinkOn = (timer) => Math.floor(timer / 10) % 2 === 0;

        // Lumière gauche : dans la zone des spectateurs (hors de la glace)
        // On la place à -20px du bord gauche de la glace
        const leftLightX = this.rink.margin - 20;

        ctx.beginPath();
        ctx.arc(leftLightX, lightY, lightRadius, 0, Math.PI * 2);
        if (this.goalLightLeft > 0 && isBlinkOn(this.goalLightLeft)) {
            // Lumière rouge clair (allumée)
            ctx.fillStyle = '#ff3300';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 25;
        } else {
            // Lumière rouge foncé (éteinte ou phase "off" du clignotement)
            ctx.fillStyle = '#4a0000';
            ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Contour métallique
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Lumière droite : dans la zone des spectateurs (hors de la glace)
        // On la place à +20px du bord droit de la glace
        const rightLightX = this.rink.margin + this.rink.width + 20;

        ctx.beginPath();
        ctx.arc(rightLightX, lightY, lightRadius, 0, Math.PI * 2);
        if (this.goalLightRight > 0 && isBlinkOn(this.goalLightRight)) {
            // Lumière rouge clair (allumée)
            ctx.fillStyle = '#ff3300';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 25;
        } else {
            // Lumière rouge foncé (éteinte ou phase "off" du clignotement)
            ctx.fillStyle = '#4a0000';
            ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Contour métallique
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawGoalMessage() {
        if (this.goalMessageTimer <= 0) return;

        // Décrémenter le timer
        this.goalMessageTimer--;

        const ctx = this.rink.ctx;
        ctx.save();  // Sauvegarder l'état du contexte

        const centerX = this.rink.canvas.width / 2;
        const centerY = this.rink.canvas.height / 2;

        // Déterminer la couleur du message selon l'équipe
        const isRedTeam = this.goalMessage.includes('rouge');
        const teamColor = isRedTeam ? '#cc0000' : '#0033cc';

        // Fond semi-transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const bgWidth = 350;
        const bgHeight = 60;
        ctx.beginPath();
        ctx.roundRect(centerX - bgWidth / 2, centerY - bgHeight / 2, bgWidth, bgHeight, 10);
        ctx.fill();

        // Texte du message avec effet de pulsation
        const pulse = 1 + 0.05 * Math.sin(this.goalMessageTimer * 0.3);
        ctx.font = `bold ${Math.floor(32 * pulse)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Ombre du texte
        ctx.fillStyle = '#000';
        ctx.fillText(this.goalMessage, centerX + 2, centerY + 2);

        // Texte principal
        ctx.fillStyle = teamColor;
        ctx.fillText(this.goalMessage, centerX, centerY);

        ctx.restore();  // Restaurer l'état du contexte
    }

    drawScorers() {
        const ctx = this.rink.ctx;
        ctx.save();

        // Position Y : dans la zone des spectateurs, sous la patinoire (au niveau du bouton)
        const baseY = this.rink.margin + this.rink.height + 25;
        const lineHeight = 18;

        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Buteurs de l'équipe rouge (home) - affichés sous leur cage (côté gauche)
        // La cage gauche est à goalLineOffset = 60, donc X = margin + 60
        const redX = this.rink.margin + 60;
        this.scorersHome.forEach((number, index) => {
            const y = baseY + index * lineHeight;
            // Fond semi-transparent pour lisibilité
            ctx.fillStyle = 'rgba(204, 0, 0, 0.8)';
            const text = `#${number}`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(redX - textWidth / 2 - 4, y - 9, textWidth + 8, 18);
            // Texte
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, redX, y);
        });

        // Buteurs de l'équipe bleue (away) - affichés sous leur cage (côté droit)
        // La cage droite est à width - goalLineOffset = width - 60
        const blueX = this.rink.margin + this.rink.width - 60;
        this.scorersAway.forEach((number, index) => {
            const y = baseY + index * lineHeight;
            // Fond semi-transparent pour lisibilité
            ctx.fillStyle = 'rgba(0, 51, 204, 0.8)';
            const text = `#${number}`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(blueX - textWidth / 2 - 4, y - 9, textWidth + 8, 18);
            // Texte
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, blueX, y);
        });

        ctx.restore();
    }

    drawStarOfTheMatch() {
        // Afficher seulement si le match est terminé et qu'il y a une étoile
        if (!this.gameEnded || !this.starOfTheMatch) return;

        const ctx = this.rink.ctx;
        ctx.save();

        // Position : centre de l'écran, juste au-dessus du centre de la patinoire
        const centerX = this.rink.canvas.width / 2;
        const centerY = this.rink.margin + this.rink.height / 2 - 50;

        // Animation de pulsation légère
        if (this.starOfTheMatchTimer > 0) {
            this.starOfTheMatchTimer--;
        }
        const pulse = 1 + Math.sin(this.starOfTheMatchTimer * 0.1) * 0.05;

        // Dimensions du cadre (adapté au texte "★ ÉTOILE DU MATCH ★")
        const boxWidth = 240 * pulse;
        const boxHeight = 80 * pulse;

        // Fond doré avec dégradé
        const gradient = ctx.createLinearGradient(
            centerX - boxWidth / 2,
            centerY - boxHeight / 2,
            centerX + boxWidth / 2,
            centerY + boxHeight / 2
        );
        gradient.addColorStop(0, '#FFD700');  // Or
        gradient.addColorStop(0.5, '#FFF8DC');  // Or clair
        gradient.addColorStop(1, '#DAA520');  // Or foncé

        // Dessiner le cadre avec coins arrondis
        ctx.beginPath();
        ctx.roundRect(
            centerX - boxWidth / 2,
            centerY - boxHeight / 2,
            boxWidth,
            boxHeight,
            12
        );
        ctx.fillStyle = gradient;
        ctx.fill();

        // Bordure dorée brillante
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Effet d'ombre
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 20;

        // Étoile icône au-dessus
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#B8860B';
        ctx.fillText('★ ÉTOILE DU MATCH ★', centerX, centerY - 20);

        // Reset shadow pour le texte principal
        ctx.shadowBlur = 0;

        // Numéro du joueur en blanc avec contour
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        const numberText = `#${this.starOfTheMatch.number}`;
        ctx.strokeText(numberText, centerX, centerY + 15);
        ctx.fillText(numberText, centerX, centerY + 15);

        ctx.restore();
    }

    drawOvertimeMessage() {
        if (this.overtimeMessageTimer <= 0) return;

        const ctx = this.rink.ctx;
        ctx.save();

        const centerX = this.rink.canvas.width / 2;
        const centerY = this.rink.canvas.height / 2;

        // Fond semi-transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        const bgWidth = 400;
        const bgHeight = 80;
        ctx.beginPath();
        ctx.roundRect(centerX - bgWidth / 2, centerY - bgHeight / 2, bgWidth, bgHeight, 15);
        ctx.fill();

        // Texte "PROLONGATION !"
        const pulse = 1 + 0.08 * Math.sin(this.overtimeMessageTimer * 0.2);
        ctx.font = `bold ${Math.floor(40 * pulse)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Ombre du texte
        ctx.fillStyle = '#000';
        ctx.fillText('PROLONGATION !', centerX + 3, centerY - 10 + 3);

        // Texte principal
        ctx.fillStyle = '#FFD700'; // Or
        ctx.fillText('PROLONGATION !', centerX, centerY - 10);

        // Sous-texte "Mort Subite"
        ctx.font = `bold ${Math.floor(20 * pulse)}px Arial`;
        ctx.fillStyle = '#FFF';
        ctx.fillText('Mort Subite', centerX, centerY + 25);

        ctx.restore();
    }

    drawHatTrickMessage() {
        if (this.hatTrickTimer <= 0 || !this.hatTrickMessage) return;

        const ctx = this.rink.ctx;
        ctx.save();

        // Position : centre de l'écran (même position que l'étoile du match)
        const centerX = this.rink.canvas.width / 2;
        const centerY = this.rink.margin + this.rink.height / 2;

        // Animation de pulsation légère
        const pulse = 1 + Math.sin(this.hatTrickTimer * 0.15) * 0.05;

        // Dimensions du cadre
        const boxWidth = 300 * pulse;
        const boxHeight = 70 * pulse;

        // Fond doré avec dégradé (similaire à l'étoile du match)
        const gradient = ctx.createLinearGradient(
            centerX - boxWidth / 2,
            centerY - boxHeight / 2,
            centerX + boxWidth / 2,
            centerY + boxHeight / 2
        );
        gradient.addColorStop(0, '#FFD700');  // Or
        gradient.addColorStop(0.5, '#FFF8DC');  // Or clair
        gradient.addColorStop(1, '#DAA520');  // Or foncé

        // Dessiner le cadre avec coins arrondis
        ctx.beginPath();
        ctx.roundRect(
            centerX - boxWidth / 2,
            centerY - boxHeight / 2,
            boxWidth,
            boxHeight,
            12
        );
        ctx.fillStyle = gradient;
        ctx.fill();

        // Bordure dorée brillante
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Effet d'ombre
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 20;

        // Texte principal "Tour du chapeau !" en blanc
        ctx.font = `bold ${Math.floor(28 * pulse)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Contour noir pour lisibilité
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.strokeText('🎩 Tour du chapeau !', centerX, centerY - 8);

        // Texte blanc
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('🎩 Tour du chapeau !', centerX, centerY - 8);

        // Reset shadow pour le numéro
        ctx.shadowBlur = 0;

        // Numéro du joueur en dessous
        if (this.hatTrickPlayer) {
            ctx.font = `bold ${Math.floor(22 * pulse)}px Arial`;
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            const playerText = `#${this.hatTrickPlayer.number}`;
            ctx.strokeText(playerText, centerX, centerY + 18);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(playerText, centerX, centerY + 18);
        }

        ctx.restore();
    }

    checkPuckControl() {
        // Décrémenter le timer de priorité de passe
        if (this.passPriorityTimer > 0) {
            this.passPriorityTimer--;
        } else {
            this.passTarget = null; // Plus de priorité
        }

        // Si le palet est déjà contrôlé, vérifier si le joueur veut toujours le garder
        if (this.puckCarrier) {
            if (!this.puckCarrier.hasPuck) {
                // Le joueur a volontairement relâché le palet (passe/tir)
                this.puckCarrier = null;
                this.teamWithPuck = null;
            }
            return; // Palet contrôlé, pas besoin de chercher un nouveau contrôleur
        }

        // Calculer la vitesse du palet
        const puckSpeed = Math.sqrt(this.puck.vx * this.puck.vx + this.puck.vy * this.puck.vy);

        // Si le palet bouge vite ET qu'il y a un destinataire de passe
        if (puckSpeed > PUCK_MIN_SPEED_FOR_PASS && this.passTarget && this.passPriorityTimer > 0) {
            // Seul le receveur désigné peut capter le palet (avec distance élargie)
            const dist = this.passTarget.distanceTo(this.puck.x, this.puck.y);
            if (dist < PASS_RECEIVE_DISTANCE) {
                this.passTarget.hasPuck = true;
                this.passTarget.passCooldown = RECEIVE_PASS_COOLDOWN; // Cooldown après réception
                this.puckCarrier = this.passTarget;
                this.teamWithPuck = this.passTarget.team;
                this.puck.attachTo(this.passTarget);
                this.passTarget = null;
                this.passPriorityTimer = 0;
                this.passingTeam = null; // Réinitialiser
            }
            // Sinon attendre que le palet arrive
            return;
        }

        // Palet libre (lent ou plus de priorité)
        // Pendant le cooldown, seuls les coéquipiers peuvent récupérer
        if (!this.puck.controlledBy) {
            let closestPlayer = null;

            // Distance de contrôle réduite pour les tirs rapides (sans destinataire de passe)
            const isShot = puckSpeed > SHOT_SPEED_THRESHOLD && !this.passTarget;
            const controlDistance = isShot ? SHOT_CONTROL_DISTANCE : PUCK_CONTROL_DISTANCE;
            let closestDist = controlDistance;

            for (const player of this.players) {
                // Pendant le cooldown d'interception, bloquer les adversaires
                if (this.passingTeam && this.passPriorityTimer > 0 && player.team !== this.passingTeam) {
                    continue; // Ignorer les adversaires pendant le cooldown
                }

                // Les gardiens ont une distance de contrôle plus grande pour les tirs
                const playerControlDist = (player.role === 'goalie' && isShot)
                    ? PUCK_CONTROL_DISTANCE  // Gardien peut arrêter les tirs normalement
                    : controlDistance;

                const dist = player.distanceTo(this.puck.x, this.puck.y);
                if (dist < playerControlDist && dist < closestDist) {
                    closestDist = dist;
                    closestPlayer = player;
                }
            }

            if (closestPlayer) {
                // Vérifier si c'est une interception (changement d'équipe)
                const isInterception = this.teamWithPuck && closestPlayer.team !== this.teamWithPuck;

                closestPlayer.hasPuck = true;
                // Cooldown plus long pour les interceptions
                if (isInterception) {
                    closestPlayer.passCooldown = INTERCEPTION_PASS_COOLDOWN;
                }
                this.puckCarrier = closestPlayer;
                this.teamWithPuck = closestPlayer.team;
                this.puck.attachTo(closestPlayer);
                this.passTarget = null;
                this.passPriorityTimer = 0;
                this.passingTeam = null;

                // Si c'est un gardien qui attrape le palet, démarrer le timer
                if (closestPlayer.role === 'goalie') {
                    this.goalieWithPuck = closestPlayer;
                    this.goalieHoldTimer = GOALIE_HOLD_TIMEOUT;
                    console.log(`🧤 Arrêt du gardien ! Passe possible pendant 2 secondes...`);
                }
            }
        }
    }

    checkGoalieHoldTimer() {
        // Si un gardien tient le palet
        if (this.goalieWithPuck && this.goalieHoldTimer > 0) {
            this.goalieHoldTimer--;

            // Si le timer atteint 0, remettre au centre
            if (this.goalieHoldTimer === 0) {
                console.log(`⏱️ Temps écoulé ! Remise au centre.`);
                this.resetToCenter();
            }
        }
    }

    resetToCenter() {
        // Remettre le palet au centre
        this.puck.x = this.rink.width / 2;
        this.puck.y = this.rink.height / 2;
        this.puck.vx = 0;
        this.puck.vy = 0;
        this.puck.release();

        // Libérer le porteur du palet
        if (this.puckCarrier) {
            this.puckCarrier.hasPuck = false;
        }
        this.puckCarrier = null;
        this.teamWithPuck = null;
        this.passTarget = null;
        this.passPriorityTimer = 0;
        this.passingTeam = null;
        this.goalieWithPuck = null;
        this.goalieHoldTimer = 0;

        // Remettre les joueurs à leurs positions de départ
        this.players.forEach(player => {
            player.x = player.homeX;
            player.y = player.homeY;
            player.hasPuck = false;
            player.passCooldown = 0;
            player.possessionTime = 0;
            player.contestedFrames = 0;
        });

        // Lancer le palet dans une direction aléatoire pour relancer le jeu
        this.puck.vx = (Math.random() - 0.5) * 10;
        this.puck.vy = (Math.random() - 0.5) * 10;
    }

    checkCollisions() {
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                const p1 = this.players[i];
                const p2 = this.players[j];

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = p1.radius + p2.radius;

                if (distance < minDistance) {
                    const overlap = minDistance - distance;
                    let nx = 0, ny = 0;

                    if (distance === 0) {
                        nx = 1;
                    } else {
                        nx = dx / distance;
                        ny = dy / distance;
                    }

                    const moveX = nx * overlap * 0.5;
                    const moveY = ny * overlap * 0.5;

                    p1.x -= moveX;
                    p1.y -= moveY;
                    p2.x += moveX;
                    p2.y += moveY;

                    // Si collision entre équipes adverses et l'un a le palet, possible perte
                    if (p1.team !== p2.team) {
                        if (p1.hasPuck && Math.random() < 0.1) {
                            p1.hasPuck = false;
                            this.puckCarrier = null;
                            this.teamWithPuck = null;
                            this.puck.release();
                            this.puck.vx = (Math.random() - 0.5) * 5;
                            this.puck.vy = (Math.random() - 0.5) * 5;
                        } else if (p2.hasPuck && Math.random() < 0.1) {
                            p2.hasPuck = false;
                            this.puckCarrier = null;
                            this.teamWithPuck = null;
                            this.puck.release();
                            this.puck.vx = (Math.random() - 0.5) * 5;
                            this.puck.vy = (Math.random() - 0.5) * 5;
                        }
                    }
                }
            }
        }
    }

    startTimer() {
        // Éviter de démarrer plusieurs intervalles
        if (this.timerInterval) return;

        this.timerInterval = setInterval(() => {
            if (this.gameTime > 0) {
                this.gameTime--;
                this.updateTimerDisplay();

                if (this.gameTime === 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = display;
    }

    endGame() {
        this.stopTimer();

        // Vérifier si le score est nul -> prolongation
        if (this.scoreHome === this.scoreAway) {
            console.log(`⏱️ Score nul ! Prolongation de 20 secondes...`);

            // Activer le mode prolongation (mort subite)
            this.isOvertime = true;

            // Ajouter 20 secondes
            this.gameTime = 20;
            this.updateTimerDisplay();

            // Remettre les joueurs au centre
            this.players.forEach(player => {
                player.x = player.homeX;
                player.y = player.homeY;
                player.hasPuck = false;
                player.passCooldown = 0;
                player.possessionTime = 0;
                player.contestedFrames = 0;
            });

            // Remettre le palet au centre
            this.puck.x = this.rink.width / 2;
            this.puck.y = this.rink.height / 2;
            this.puck.vx = 0;
            this.puck.vy = 0;
            this.puck.release();
            this.puckCarrier = null;
            this.teamWithPuck = null;
            this.passTarget = null;
            this.passPriorityTimer = 0;
            this.passingTeam = null;

            // Mettre le jeu en pause et afficher le message de prolongation
            this.running = false;
            this.overtimeMessageTimer = 120; // Afficher le message pendant 2 secondes (120 frames)

            return;
        }

        // Si pas de match nul, terminer le match normalement
        this.endGameFinal(this.scoreHome > this.scoreAway ? 'home' : 'away');
    }

    endGameFinal(winningTeam) {
        this.stopTimer();
        this.running = false;
        this.gameEnded = true;

        // Afficher le bouton "Nouveau match"
        document.getElementById('new-game-btn').style.display = 'inline-block';

        // Remettre les joueurs au centre
        this.players.forEach(player => {
            player.x = player.homeX;
            player.y = player.homeY;
            player.hasPuck = false;
            player.passCooldown = 0;
            player.possessionTime = 0;
            player.contestedFrames = 0;
        });

        // Remettre le palet au centre
        this.puck.x = this.rink.width / 2;
        this.puck.y = this.rink.height / 2;
        this.puck.vx = 0;
        this.puck.vy = 0;
        this.puck.release();
        this.puckCarrier = null;
        this.teamWithPuck = null;

        // Afficher le résultat dans la console
        let result;
        if (this.scoreHome > this.scoreAway) {
            result = '🏆 Équipe Rouge gagne !';
        } else if (this.scoreAway > this.scoreHome) {
            result = '🏆 Équipe Bleue gagne !';
        } else {
            result = '🤝 Match nul !';
        }
        console.log(`⏱️ FIN DU MATCH ! Score final: Rouge ${this.scoreHome} - ${this.scoreAway} Bleu. ${result}`);

        // Déterminer l'étoile du match
        this.determineStarOfTheMatch();
    }

    determineStarOfTheMatch() {
        // 1. Vérifier si un gardien n'a pas encaissé de but (50% de chance d'être l'étoile)
        const homeGoalie = this.players.find(p => p.team === 'home' && p.role === 'goalie');
        const awayGoalie = this.players.find(p => p.team === 'away' && p.role === 'goalie');

        // Gardien avec blanchissage (s'il y en a un)
        let shutoutGoalie = null;
        if (this.scoreAway === 0 && homeGoalie) {
            shutoutGoalie = { player: homeGoalie, team: 'home' };
        } else if (this.scoreHome === 0 && awayGoalie) {
            shutoutGoalie = { player: awayGoalie, team: 'away' };
        }

        // 2. Trouver le meilleur buteur
        const goalCounts = {};

        this.scorersHome.forEach(num => {
            const key = `home-${num}`;
            goalCounts[key] = (goalCounts[key] || 0) + 1;
        });

        this.scorersAway.forEach(num => {
            const key = `away-${num}`;
            goalCounts[key] = (goalCounts[key] || 0) + 1;
        });

        // Trouver le maximum de buts
        let maxGoals = 0;
        for (const key in goalCounts) {
            if (goalCounts[key] > maxGoals) {
                maxGoals = goalCounts[key];
            }
        }

        // Trouver tous les joueurs avec le maximum de buts
        const topScorers = [];
        for (const key in goalCounts) {
            if (goalCounts[key] === maxGoals) {
                const [team, number] = key.split('-');
                topScorers.push({ team, number: parseInt(number), goals: maxGoals });
            }
        }

        // 3. Décision finale
        // Si un gardien a fait un blanchissage, 50% de chance que ce soit lui
        if (shutoutGoalie && Math.random() < 0.5) {
            this.starOfTheMatch = {
                number: shutoutGoalie.player.number,
                team: shutoutGoalie.team,
                role: 'goalie',
                reason: 'blanchissage'
            };
            this.starOfTheMatchTimer = 300;
            console.log(`⭐ Étoile du match : #${shutoutGoalie.player.number} (gardien ${shutoutGoalie.team === 'home' ? 'rouge' : 'bleu'}) - Blanchissage !`);
            return;
        }

        // Sinon, c'est le meilleur buteur
        if (maxGoals === 0) {
            // Pas de buts marqués - le gardien gagne par défaut s'il y en a un
            if (shutoutGoalie) {
                this.starOfTheMatch = {
                    number: shutoutGoalie.player.number,
                    team: shutoutGoalie.team,
                    role: 'goalie',
                    reason: 'blanchissage'
                };
                this.starOfTheMatchTimer = 300;
                console.log(`⭐ Étoile du match : #${shutoutGoalie.player.number} (gardien ${shutoutGoalie.team === 'home' ? 'rouge' : 'bleu'}) - Blanchissage !`);
            }
            return;
        }

        // En cas d'égalité entre buteurs, tirer au sort
        const winner = topScorers[Math.floor(Math.random() * topScorers.length)];

        this.starOfTheMatch = {
            number: winner.number,
            team: winner.team,
            role: 'forward',
            reason: `${winner.goals} but${winner.goals > 1 ? 's' : ''}`
        };
        this.starOfTheMatchTimer = 300;
        console.log(`⭐ Étoile du match : #${winner.number} (${winner.team === 'home' ? 'rouge' : 'bleu'}) - ${winner.goals} but(s) !`);
    }

    newGame() {
        // Masquer le bouton "Nouveau match"
        document.getElementById('new-game-btn').style.display = 'none';

        // Réinitialiser le score
        this.scoreHome = 0;
        this.scoreAway = 0;

        // Réinitialiser le chronomètre à 30 secondes
        this.gameTime = 30;
        this.updateTimerDisplay();

        // Réinitialiser les flags de jeu
        this.gameEnded = false;
        this.isOvertime = false;
        this.running = false;

        // Remettre le palet au centre
        this.puck.x = this.rink.width / 2;
        this.puck.y = this.rink.height / 2;
        this.puck.vx = 0;
        this.puck.vy = 0;
        this.puck.release();
        this.puckCarrier = null;
        this.teamWithPuck = null;
        this.passTarget = null;
        this.passPriorityTimer = 0;
        this.passingTeam = null;
        this.goalieWithPuck = null;
        this.goalieHoldTimer = 0;

        // Remettre les joueurs à leurs positions de départ
        this.players.forEach(player => {
            player.x = player.homeX;
            player.y = player.homeY;
            player.hasPuck = false;
            player.passCooldown = 0;
            player.possessionTime = 0;
            player.contestedFrames = 0;
        });

        // Réinitialiser les lumières de but
        this.goalLightLeft = 0;
        this.goalLightRight = 0;

        // Réinitialiser les listes de buteurs
        this.scorersHome = [];
        this.scorersAway = [];

        // Réinitialiser l'étoile du match
        this.starOfTheMatch = null;
        this.starOfTheMatchTimer = 0;

        // Réinitialiser le tour du chapeau
        this.hatTrickMessage = null;
        this.hatTrickTimer = 0;
        this.hatTrickPlayer = null;

        // Réinitialiser les autres états de jeu (Correction de bugs)
        this.goalCooldown = 0;
        this.lastShooter = null;
        this.goalMessage = null;
        this.goalMessageTimer = 0;
        this.overtimeMessageTimer = 0;

        // Réinitialiser la patinoire (spectateurs)
        this.rink.reset();

        console.log(`🏒 Nouveau match ! Les scores sont remis à zéro.`);
    }
}

// Démarrage du jeu
window.onload = () => {
    const game = new Game();
};