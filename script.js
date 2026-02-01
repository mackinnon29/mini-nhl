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
        
        // On pourra ajouter les lignes bleues et les buts ici plus tard
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

class Game {
    constructor() {
        this.rink = new Rink('ice-rink');
        this.puck = new Puck(this.rink.width / 2, this.rink.height / 2);
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

    animate() {
        if (this.running) {
            this.puck.update(this.rink.width, this.rink.height);
        }

        this.rink.draw();
        this.puck.draw(this.rink.ctx);
        requestAnimationFrame(this.animate);
    }
}

// Démarrage du jeu quand la page est chargée
window.onload = () => {
    const game = new Game();
};