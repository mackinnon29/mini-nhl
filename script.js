// ==================== CONSTANTES DE JEU ====================
const PUCK_CONTROL_DISTANCE = 25;  // Distance pour contrôler le palet
const SHOT_CONTROL_DISTANCE = 12;  // Distance réduite pour intercepter un tir rapide
const SHOT_POWER = 15;             // Puissance des tirs (augmentée pour traverser)
const PASS_POWER = 10;             // Puissance des passes
const SHOT_SPEED_THRESHOLD = 10;   // Vitesse au-dessus de laquelle c'est considéré comme un tir
const PRESSURE_DISTANCE = 60;      // Distance considérée comme "sous pression"
const CLOSE_PRESSURE_DISTANCE = 35; // Distance très proche (duel)
const SHOT_ZONE_RATIO = 0.35;      // Zone de tir (35% depuis le but adverse)
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
const WINGER_HIGH_POSITION = 0.2;           // Position haute LW (20% de la patinoire)
const WINGER_LOW_POSITION = 0.8;            // Position basse RW (80% de la patinoire)
const DEFENDER_OFFENSIVE_SPREAD = 0.45;     // Étalement défenseurs en attaque
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
                spectators.push({ x, y, size: spectatorSize, color });
            }
        }

        // Zone basse (en-dessous de la patinoire)
        for (let y = this.canvas.height - this.margin + 5; y < this.canvas.height - 5; y += spacing) {
            for (let x = 5; x < this.canvas.width - 5; x += spacing) {
                const color = colors[Math.floor(pseudoRandom(seed++) * 2)];
                spectators.push({ x, y, size: spectatorSize, color });
            }
        }

        // Zone gauche (à gauche de la patinoire)
        for (let y = this.margin; y < this.canvas.height - this.margin; y += spacing) {
            for (let x = 5; x < this.margin - 5; x += spacing) {
                const color = colors[Math.floor(pseudoRandom(seed++) * 2)];
                spectators.push({ x, y, size: spectatorSize, color });
            }
        }

        // Zone droite (à droite de la patinoire)
        for (let y = this.margin; y < this.canvas.height - this.margin; y += spacing) {
            for (let x = this.canvas.width - this.margin + 5; x < this.canvas.width - 5; x += spacing) {
                const color = colors[Math.floor(pseudoRandom(seed++) * 2)];
                spectators.push({ x, y, size: spectatorSize, color });
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
        for (const spec of this.spectators) {
            this.ctx.fillStyle = spec.color;
            this.ctx.fillRect(spec.x, spec.y, spec.size, spec.size);
        }
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

        // Tirer si en zone de tir - 55% de chances de tirer
        if (inShotZone && nearbyOpponents <= 1 && Math.random() < 0.55) {
            const shotY = goalY + (Math.random() - 0.5) * 60;
            this.hasPuck = false;  // IMPORTANT: marquer comme n'ayant plus le palet AVANT le tir
            puck.shoot(goalX, shotY, SHOT_POWER);
            game.lastShooter = this;  // Enregistrer le tireur
            this.possessionTime = 0;
            this.contestedFrames = 0;
            return { action: true };
        }

        // Tir sous pression (2 adversaires proches) - 35% de chances
        if (inShotZone && nearbyOpponents <= 2 && Math.random() < 0.35) {
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
            // Défenseurs : suivre l'attaque mais en retrait avec étalement vertical
            const supportDepth = this.team === 'home' ? 80 : -80;
            targetX = this.team === 'home'
                ? Math.min(carrier.x + supportDepth, rinkWidth - 150)
                : Math.max(carrier.x + supportDepth, 150);

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
            // Défenseurs : protection de zone, jamais de chasse
            const defenseOffset = this.team === 'home' ? -80 : 80;
            targetX = puck.x + defenseOffset;
            // Garder la distance minimale du but
            const minDefenseX = this.team === 'home' ? 120 : rinkWidth - 120;
            targetX = this.team === 'home'
                ? Math.max(targetX, minDefenseX)
                : Math.min(targetX, minDefenseX);

            // Étalement vertical selon homeY
            const isTopDefender = this.homeY < rinkHeight / 2;
            const defensiveSpread = rinkHeight * 0.35;
            targetY = rinkHeight / 2 + (isTopDefender ? -defensiveSpread : defensiveSpread);
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

            const score = advancementBonus - pressurePenalty - distancePenalty + optimalDistBonus;

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

        // Système de chronomètre
        this.gameTime = 30;  // 30 secondes
        this.timerInterval = null;
        this.gameEnded = false;
        this.isOvertime = false;  // Flag pour la prolongation (mort subite)

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

        const awayC = new Player(w - 350, h / 2, 'away', 93, 'forward');
        awayC.forwardPosition = 'C';
        this.players.push(awayC);

        const awayRW = new Player(w - 350, h / 2 + 100, 'away', 97, 'forward');
        awayRW.forwardPosition = 'RW';
        this.players.push(awayRW);
    }

    animate() {
        if (this.running) {
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
        this.drawScore();

        // Dessiner les joueurs et le palet avec le décalage des tribunes
        const ctx = this.rink.ctx;
        ctx.save();
        ctx.translate(this.rink.margin, this.rink.margin);
        this.players.forEach(player => player.draw(ctx));
        this.puck.draw(ctx);
        ctx.restore();

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
            // - #97 équipe bleue (away) : 65%
            // - Autres joueurs : 55%
            let goalProbability = 0.55;
            if (this.lastShooter) {
                if (this.lastShooter.number === 29 && this.lastShooter.team === 'home') {
                    goalProbability = 0.75;
                } else if (this.lastShooter.number === 97 && this.lastShooter.team === 'away') {
                    goalProbability = 0.65;
                }
            }

            if (Math.random() < goalProbability) {
                // BUT !
                if (scoringTeam === 'home') {
                    this.scoreHome++;
                } else {
                    this.scoreAway++;
                }
                console.log(`⚽ BUT ! Score: Home ${this.scoreHome} - ${this.scoreAway} Away`);

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

            // Relancer le jeu automatiquement
            this.running = true;
            this.startTimer();

            // Lancer le palet pour reprendre
            this.puck.vx = (Math.random() - 0.5) * 15;
            this.puck.vy = (Math.random() - 0.5) * 15;

            return;
        }

        // Si pas de match nul, terminer le match normalement
        this.endGameFinal(this.scoreHome > this.scoreAway ? 'home' : 'away');
    }

    endGameFinal(winningTeam) {
        this.stopTimer();
        this.running = false;
        this.gameEnded = true;

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
    }
}

// Démarrage du jeu
window.onload = () => {
    const game = new Game();
};