// ==================== CONSTANTES DE JEU ====================
const PUCK_CONTROL_DISTANCE = 25;  // Distance pour contrôler le palet
const SHOT_POWER = 12;             // Puissance des tirs
const PASS_POWER = 10;             // Puissance des passes (augmentée)
const PRESSURE_DISTANCE = 60;      // Distance considérée comme "sous pression"
const CLOSE_PRESSURE_DISTANCE = 35; // Distance très proche (duel)
const SHOT_ZONE_RATIO = 0.35;      // Zone de tir (35% depuis le but adverse)
const PASS_COOLDOWN = 15;          // Frames avant de pouvoir repasser (très court)
const SPREAD_DISTANCE = 80;        // Distance minimale entre coéquipiers
const CONTESTED_THRESHOLD = 40;    // Frames sous pression avant dégagement forcé (réduit)
const CLEAR_POWER = 10;            // Puissance du dégagement
const MAX_POSSESSION_TIME = 60;    // Frames max avec le palet avant passe forcée (~1s)

class Rink {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

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
            this.vx = (dx / distance) * power;
            this.vy = (dy / distance) * power;
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
    }

    // Distance vers un point
    distanceTo(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Direction du but adverse
    getTargetGoalX(rinkWidth) {
        return this.team === 'home' ? rinkWidth - 60 : 60;
    }

    update(puck, allPlayers, rinkWidth, rinkHeight, game) {
        if (this.passCooldown > 0) this.passCooldown--;

        let targetX, targetY;

        if (this.role === 'goalie') {
            // Comportement gardien (inchangé)
            targetX = this.team === 'home' ? 60 : rinkWidth - 60;
            const goalWidth = 80;
            const goalTop = rinkHeight / 2 - goalWidth / 2;
            const goalBottom = rinkHeight / 2 + goalWidth / 2;
            const goalPadding = 20;

            const puckInMyZone = this.team === 'home'
                ? puck.x < rinkWidth / 2
                : puck.x > rinkWidth / 2;

            if (puckInMyZone) {
                targetY = Math.max(goalTop - goalPadding, Math.min(puck.y, goalBottom + goalPadding));
            } else {
                targetY = rinkHeight / 2;
            }
        } else if (this.hasPuck) {
            // === COMPORTEMENT AVEC LE PALET ===
            const result = this.updateWithPuck(puck, allPlayers, rinkWidth, rinkHeight, game);
            if (result.action) return; // Action effectuée (tir/passe)
            targetX = result.targetX;
            targetY = result.targetY;
        } else if (game.teamWithPuck === null) {
            // === PALET LIBRE - Chasser le palet ===
            if (this.role === 'forward') {
                // Attaquants : chasser le palet
                targetX = puck.x;
                targetY = puck.y;
            } else {
                // Défenseurs : rester en position mais suivre un peu le palet
                targetX = this.homeX;
                targetY = puck.y * 0.3 + this.homeY * 0.7;
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
            return this.forcePass(puck, allPlayers, rinkWidth, rinkHeight);
        }

        // Tirer si en zone de tir et relativement démarqué
        if (inShotZone && nearbyOpponents <= 1 && Math.random() < 0.1) {
            const shotY = goalY + (Math.random() - 0.5) * 60;
            puck.shoot(goalX, shotY, SHOT_POWER);
            this.hasPuck = false;
            this.possessionTime = 0;
            this.contestedFrames = 0;
            return { action: true };
        }

        // Passe très fréquente sous pression proche
        if (veryCloseOpponents >= 1 && this.passCooldown === 0 && Math.random() < 0.5) {
            return this.forcePass(puck, allPlayers, rinkWidth, rinkHeight);
        }

        // Passe proactive même sans pression (2% par frame ~= 1 passe par seconde en moyenne)
        if (this.passCooldown === 0 && Math.random() < 0.03) {
            const passTarget = this.findBestPassTarget(allPlayers, rinkWidth);
            if (passTarget) {
                puck.shoot(passTarget.x, passTarget.y, PASS_POWER);
                this.hasPuck = false;
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

    forcePass(puck, allPlayers, rinkWidth, rinkHeight) {
        const passTarget = this.findBestPassTarget(allPlayers, rinkWidth);
        if (passTarget) {
            puck.shoot(passTarget.x, passTarget.y, PASS_POWER);
        } else {
            // Dégagement aléatoire vers l'avant
            const clearX = this.team === 'home' ? rinkWidth - 50 : 50;
            const clearY = rinkHeight / 2 + (Math.random() - 0.5) * 200;
            puck.shoot(clearX, clearY, CLEAR_POWER);
        }
        this.hasPuck = false;
        this.possessionTime = 0;
        this.contestedFrames = 0;
        this.passCooldown = PASS_COOLDOWN;
        return { action: true };
    }

    updateTeamHasPuck(puck, allPlayers, rinkWidth, rinkHeight) {
        // Se positionner pour offrir une ligne de passe
        const carrier = allPlayers.find(p => p.hasPuck);
        if (!carrier) {
            return { targetX: this.homeX, targetY: this.homeY };
        }

        // Calculer une position décalée pour offrir une passe
        let targetX, targetY;
        const goalX = this.getTargetGoalX(rinkWidth);

        if (this.role === 'forward') {
            // Attaquants : avancer vers le but mais rester écartés
            targetX = this.team === 'home'
                ? Math.min(carrier.x + 100, rinkWidth - 100)
                : Math.max(carrier.x - 100, 100);

            // Position Y basée sur la position de base pour l'écartement
            targetY = this.homeY;

            // S'écarter des coéquipiers
            const teammates = allPlayers.filter(p => p.team === this.team && p !== this && p.role !== 'goalie');
            for (const mate of teammates) {
                const dist = this.distanceTo(mate.x, mate.y);
                if (dist < SPREAD_DISTANCE && dist > 0) {
                    targetY += (this.y - mate.y) * 0.3;
                }
            }
        } else {
            // Défenseurs : rester en retrait pour la couverture
            targetX = this.team === 'home'
                ? Math.min(carrier.x - 50, rinkWidth * 0.5)
                : Math.max(carrier.x + 50, rinkWidth * 0.5);
            targetY = this.homeY;
        }

        // Contraindre dans les limites
        targetY = Math.max(50, Math.min(rinkHeight - 50, targetY));

        return { targetX, targetY };
    }

    updateDefending(puck, allPlayers, rinkWidth, rinkHeight, game) {
        const carrier = game.puckCarrier;
        let targetX, targetY;

        if (this.role === 'forward') {
            // Attaquants : presser le porteur ou bloquer les passes
            if (carrier && Math.random() < 0.7) {
                // Presser le porteur
                targetX = carrier.x;
                targetY = carrier.y;
            } else {
                // Bloquer une ligne de passe
                targetX = puck.x + (this.team === 'home' ? -30 : 30);
                targetY = this.homeY;
            }
        } else {
            // Défenseurs : retourner en position défensive
            targetX = this.homeX;
            targetY = puck.y * 0.5 + this.homeY * 0.5; // Entre palet et position de base
        }

        // Limiter la zone des défenseurs
        if (this.role === 'defenseman') {
            if (this.team === 'home') {
                targetX = Math.min(targetX, rinkWidth * 0.6);
            } else {
                targetX = Math.max(targetX, rinkWidth * 0.4);
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
        // Trouver TOUS les coéquipiers (sauf gardien)
        const teammates = allPlayers.filter(p =>
            p.team === this.team &&
            p !== this &&
            p.role !== 'goalie'
        );

        if (teammates.length === 0) return null;

        // Trouver le coéquipier le plus avancé et démarqué
        let bestTarget = null;
        let bestScore = -Infinity;

        for (const mate of teammates) {
            const distToGoal = this.team === 'home'
                ? rinkWidth - mate.x
                : mate.x;

            const nearbyOpps = mate.countNearbyOpponents(allPlayers, PRESSURE_DISTANCE);
            const distFromMe = this.distanceTo(mate.x, mate.y);

            // Score : avancé vers le but + démarqué + pas trop proche
            const score = (rinkWidth - distToGoal) - (nearbyOpps * 50) + (distFromMe * 0.5);

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

        this.running = false;

        document.getElementById('start-btn').addEventListener('click', () => {
            this.running = !this.running;

            if (this.running && !this.puckCarrier && Math.abs(this.puck.vx) < 0.1) {
                this.puck.vx = (Math.random() - 0.5) * 15;
                this.puck.vy = (Math.random() - 0.5) * 15;
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
        this.players.push(new Player(200, h / 2, 'home', 8, 'defenseman'));
        this.players.push(new Player(350, h / 2 - 80, 'home', 29, 'forward'));
        this.players.push(new Player(350, h / 2 + 80, 'home', 88, 'forward'));

        // Équipe Extérieur (Bleu)
        this.players.push(new Player(w - 100, h / 2, 'away', 35, 'goalie'));
        this.players.push(new Player(w - 200, h / 2, 'away', 2, 'defenseman'));
        this.players.push(new Player(w - 350, h / 2 - 80, 'away', 29, 'forward'));
        this.players.push(new Player(w - 350, h / 2 + 80, 'away', 97, 'forward'));
    }

    animate() {
        if (this.running) {
            this.checkPuckControl();
            this.puck.update(this.rink.width, this.rink.height);
            this.players.forEach(player =>
                player.update(this.puck, this.players, this.rink.width, this.rink.height, this)
            );
            this.checkCollisions();
        }

        this.rink.draw();
        this.players.forEach(player => player.draw(this.rink.ctx));
        this.puck.draw(this.rink.ctx);
        requestAnimationFrame(this.animate);
    }

    checkPuckControl() {
        // Si le palet est déjà contrôlé et le joueur est proche, garder le contrôle
        if (this.puckCarrier) {
            const dist = this.puckCarrier.distanceTo(this.puck.x, this.puck.y);
            if (dist > PUCK_CONTROL_DISTANCE * 1.5 || !this.puckCarrier.hasPuck) {
                // Perd le contrôle
                this.puckCarrier.hasPuck = false;
                this.puckCarrier = null;
                this.teamWithPuck = null;
                this.puck.release();
            }
        }

        // Chercher un nouveau contrôleur
        if (!this.puckCarrier) {
            let closestPlayer = null;
            let closestDist = PUCK_CONTROL_DISTANCE;

            for (const player of this.players) {
                const dist = player.distanceTo(this.puck.x, this.puck.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPlayer = player;
                }
            }

            if (closestPlayer) {
                closestPlayer.hasPuck = true;
                this.puckCarrier = closestPlayer;
                this.teamWithPuck = closestPlayer.team;
                this.puck.attachTo(closestPlayer);
            }
        }
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
}

// Démarrage du jeu
window.onload = () => {
    const game = new Game();
};