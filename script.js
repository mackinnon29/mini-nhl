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

class Game {
    constructor() {
        this.rink = new Rink('ice-rink');
        
        // On lance la boucle d'animation
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    animate() {
        this.rink.draw();
        requestAnimationFrame(this.animate);
    }
}

// Démarrage du jeu quand la page est chargée
window.onload = () => {
    const game = new Game();
};