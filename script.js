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
const SPREAD_DISTANCE = 80;        // Distance minimale entre coéquipiers
const CONTESTED_THRESHOLD = 25;    // Frames sous pression avant dégagement forcé
const CLEAR_POWER = 10;            // Puissance du dégagement
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
            return this.forcePass(puck, allPlayers, rinkWidth, rinkHeight, game);
        }

        // Tirer si en zone de tir - probabilité augmentée pour plus de tirs
        if (inShotZone && nearbyOpponents <= 1 && Math.random() < 0.40) {
            const shotY = goalY + (Math.random() - 0.5) * 60;
            this.hasPuck = false;  // IMPORTANT: marquer comme n'ayant plus le palet AVANT le tir
            puck.shoot(goalX, shotY, SHOT_POWER);
            this.possessionTime = 0;
            this.contestedFrames = 0;
            return { action: true };
        }

        // Tir moins fréquent même avec 2 adversaires proches en zone offensive
        if (inShotZone && nearbyOpponents <= 2 && Math.random() < 0.15) {
            const shotY = goalY + (Math.random() - 0.5) * 80;
            this.hasPuck = false;
            puck.shoot(goalX, shotY, SHOT_POWER * 0.9);  // Tir légèrement moins puissant car sous pression
            this.possessionTime = 0;
            this.contestedFrames = 0;
            return { action: true };
        }

        // Passe sous pression proche - réduit en zone offensive car on préfère tirer
        const passProbUnderPressure = inShotZone ? 0.45 : 0.70;
        if (veryCloseOpponents >= 1 && this.passCooldown === 0 && Math.random() < passProbUnderPressure) {
            return this.forcePass(puck, allPlayers, rinkWidth, rinkHeight, game);
        }

        // Passe proactive - réduite en zone offensive pour favoriser les tirs
        const proactivePassProb = inShotZone ? 0.08 : 0.15;
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
            targetX = this.team === 'home'
                ? Math.min(carrier.x + 120, rinkWidth - 80)
                : Math.max(carrier.x - 120, 80);

            targetY = this.homeY;

            // S'écarter plus agressivement des coéquipiers
            const teammates = allPlayers.filter(p => p.team === this.team && p !== this && p.role !== 'goalie');
            for (const mate of teammates) {
                const dist = this.distanceTo(mate.x, mate.y);
                if (dist < SPREAD_DISTANCE && dist > 0) {
                    targetY += (this.y - mate.y) * 0.5;
                }
            }

            // Mouvement aléatoire latéral pour se démarquer
            if (Math.random() < 0.05) {
                targetY += (Math.random() - 0.5) * 60;
            }
        } else {
            targetX = this.team === 'home'
                ? Math.min(carrier.x - 50, rinkWidth * 0.45)
                : Math.max(carrier.x + 50, rinkWidth * 0.55);
            targetY = this.homeY;

            // Léger mouvement pour garder les options ouvertes
            if (Math.random() < 0.03) {
                targetY += (Math.random() - 0.5) * 40;
            }
        }

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

        // Système de score
        this.scoreHome = 0;
        this.scoreAway = 0;
        this.goalCooldown = 0;  // Empêche les buts multiples

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
        this.players.push(new Player(200, h / 2 - 50, 'home', 8, 'defenseman'));
        this.players.push(new Player(200, h / 2 + 50, 'home', 7, 'defenseman'));
        this.players.push(new Player(350, h / 2 - 100, 'home', 29, 'forward'));
        this.players.push(new Player(350, h / 2, 'home', 62, 'forward'));
        this.players.push(new Player(350, h / 2 + 100, 'home', 88, 'forward'));


        // Équipe Extérieur (Bleu)
        this.players.push(new Player(w - 100, h / 2, 'away', 35, 'goalie'));
        this.players.push(new Player(w - 200, h / 2 - 50, 'away', 2, 'defenseman'));
        this.players.push(new Player(w - 200, h / 2 + 50, 'away', 99, 'defenseman'));
        this.players.push(new Player(w - 350, h / 2 - 100, 'away', 29, 'forward'));
        this.players.push(new Player(w - 350, h / 2, 'away', 93, 'forward'));
        this.players.push(new Player(w - 350, h / 2 + 100, 'away', 97, 'forward'));
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

            // 5. Vérifier si un but est marqué
            this.checkGoal();
        }

        this.rink.draw();
        this.drawScore();
        this.players.forEach(player => player.draw(this.rink.ctx));
        this.puck.draw(this.rink.ctx);
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

            // Probabilité de but : 20% du centre, 10% des côtés
            const goalProbability = distFromCenter < centerZone ? 0.20 : 0.10;

            if (Math.random() < goalProbability) {
                // BUT !
                if (scoringTeam === 'home') {
                    this.scoreHome++;
                } else {
                    this.scoreAway++;
                }
                console.log(`⚽ BUT ! Score: Home ${this.scoreHome} - ${this.scoreAway} Away`);
                this.resetAfterGoal();
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
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';

        // Score équipe Home (rouge)
        ctx.fillStyle = '#cc0000';
        ctx.fillText(this.scoreHome.toString(), this.rink.width / 2 - 40, 35);

        // Tiret
        ctx.fillStyle = '#333';
        ctx.fillText('-', this.rink.width / 2, 35);

        // Score équipe Away (bleu)
        ctx.fillStyle = '#0033cc';
        ctx.fillText(this.scoreAway.toString(), this.rink.width / 2 + 40, 35);
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