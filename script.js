class Rink {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d'); // C'est notre pinceau
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    draw() {
        // 1. On efface tout pour redessiner proprement
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 2. Ligne centrale (Rouge)
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.strokeStyle = "#cc0000";
        this.ctx.lineWidth = 5;
        this.ctx.stroke();

        // 3. Cercle central (Bleu)
        this.ctx.beginPath();
        this.ctx.arc(this.width / 2, this.height / 2, 60, 0, Math.PI * 2);
        this.ctx.strokeStyle = "#0033cc";
        this.ctx.stroke();
        
        // 4. Lignes de but (Rouge)
        const goalLineOffset = 60;
        this.ctx.beginPath();
        this.ctx.moveTo(goalLineOffset, 0);
        this.ctx.lineTo(goalLineOffset, this.height);
        this.ctx.moveTo(this.width - goalLineOffset, 0);
        this.ctx.lineTo(this.width - goalLineOffset, this.height);
        this.ctx.strokeStyle = "#cc0000";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 5. Cages (Rectangles)
        const goalWidth = 80; // Largeur de l'ouverture
        const goalDepth = 20; // Profondeur du filet
        
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
        this.vx = 0; // Vitesse horizontale
        this.vy = 0; // Vitesse verticale
        this.friction = 0.99; // Frottement : on garde 99% de la vitesse à chaque image
    }

    update(boundsWidth, boundsHeight) {
        // 1. Mouvement
        this.x += this.vx;
        this.y += this.vy;

        // 2. Frottement (ça ralentit tout seul)
        this.vx *= this.friction;
        this.vy *= this.friction;

        // 3. Rebond sur les bandes
        // Gauche ou Droite
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -1; // On inverse la vitesse horizontale
        } else if (this.x + this.radius > boundsWidth) {
            this.x = boundsWidth - this.radius;
            this.vx *= -1;
        }

        // Haut ou Bas
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= -1; // On inverse la vitesse verticale
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
        this.team = team; // 'home' ou 'away'
        this.number = number;
        this.role = role; // 'goalie' ou 'forward'
        this.radius = 15; // Un peu plus gros que le palet
        this.speed = 2.5; // Vitesse de déplacement
    }

    update(puck, rinkWidth) {
        let targetX, targetY;

        if (this.role === 'forward') {
            // Les attaquants chassent le palet
            targetX = puck.x;
            targetY = puck.y;
        } else if (this.role === 'defenseman') {
            // Les défenseurs protègent la zone mais peuvent monter un peu (support offensif)
            targetY = puck.y;
            if (this.team === 'home') {
                // Domicile : suit le palet mais ne dépasse pas ~60% du terrain (reste en couverture)
                targetX = Math.min(puck.x, rinkWidth * 0.6);
            } else {
                // Extérieur : suit le palet mais ne dépasse pas ~40% du terrain (depuis la droite)
                targetX = Math.max(puck.x, rinkWidth * 0.4);
            }
        } else {
            // Les gardiens suivent le palet mais restent devant leur cage
            targetY = puck.y;
            
            if (this.team === 'home') {
                targetX = 60; // Position X fixe pour le gardien gauche
            } else {
                targetX = rinkWidth - 60; // Position X fixe pour le gardien droit
            }
        }

        // Calcul de la distance et de la direction vers la cible
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Si on est loin de la cible, on avance vers elle
        if (distance > this.speed) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw(ctx) {
        // Cercle du joueur
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // Rouge pour domicile, Bleu pour extérieur
        ctx.fillStyle = (this.team === 'home') ? '#cc0000' : '#0033cc';
        ctx.fill();
        
        // Bordure blanche
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Numéro du joueur
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
        
        // Création des équipes
        this.players = [];
        this.initTeams();

        this.running = false;

        // Gestion du bouton Lecture
        document.getElementById('start-btn').addEventListener('click', () => {
            this.running = !this.running;
            
            // Petite impulsion au démarrage pour tester si le palet est à l'arrêt
            if (this.running && Math.abs(this.puck.vx) < 0.1) {
                this.puck.vx = (Math.random() - 0.5) * 20;
                this.puck.vy = (Math.random() - 0.5) * 20;
            }
        });
        
        // On lance la boucle d'animation
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initTeams() {
        const w = this.rink.width;
        const h = this.rink.height;

        // Équipe Domicile (Rouge) - À gauche
        this.players.push(new Player(100, h / 2, 'home', 39, 'goalie'));
        this.players.push(new Player(200, h / 2, 'home', 8, 'defenseman'));
        this.players.push(new Player(300, h / 2 - 100, 'home', 29, 'forward'));
        this.players.push(new Player(300, h / 2 + 100, 'home', 88, 'forward'));

        // Équipe Extérieur (Bleu) - À droite
        this.players.push(new Player(w - 100, h / 2, 'away', 35, 'goalie'));
        this.players.push(new Player(w - 200, h / 2, 'away', 2, 'defenseman'));
        this.players.push(new Player(w - 300, h / 2 - 100, 'away', 29, 'forward'));
        this.players.push(new Player(w - 300, h / 2 + 100, 'away', 97, 'forward'));
    }

    animate() {
        if (this.running) {
            this.puck.update(this.rink.width, this.rink.height);
            this.players.forEach(player => player.update(this.puck, this.rink.width));
            this.checkCollisions();
        }

        this.rink.draw();
        
        // Dessiner les joueurs
        this.players.forEach(player => player.draw(this.rink.ctx));
        
        this.puck.draw(this.rink.ctx);
        requestAnimationFrame(this.animate);
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
                    let nx = 0;
                    let ny = 0;

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
                }
            }
        }
    }
}

// Démarrage du jeu quand la page est chargée
window.onload = () => {
    const game = new Game();
};