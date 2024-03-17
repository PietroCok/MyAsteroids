class Explosion {
    constructor(game, x, y) {
        this.game = game;

        this.x = x;
        this.y = y;

        this.game.explosions.push(this);
        this.end = false;
    }
    update() {

    }
    draw(ctx) {

    }
}

class SimpleExplosion extends Explosion {
    constructor(game, x, y, n) {
        super(game, x, y);

        this.n = n || Math.random() * 5 + 5;
        this.particles = [];
        for (let i = 0; i < this.n; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                speedX: (Math.random() * 2 + 2) * (Math.random() > 0.5 ? 1 : -1),
                speedY: (Math.random() * 2 + 2) * (Math.random() > 0.5 ? 1 : -1),
                color: 'rgb(' + Math.random() * 255 + ',' + Math.random() * 255 + ',' + Math.random() * 255 + ')'
            });
        }
    }
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let particle = this.particles[i];
            particle.x += particle.speedX;
            particle.y += particle.speedY;


            if (particle.x < 0 || particle.x > this.game.canvas.width || particle.y < 0 || particle.y > this.game.canvas.height) {
                this.particles.splice(i, 1);
            }
        }
        if (this.particles.length <= 0) {
            this.end = true;
        }

        this.draw(this.game.ctx);
    }
    draw(ctx) {
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI);
            ctx.fillStyle = p.color;
            ctx.closePath();
            ctx.fill();
        })
    }
}

class HomingMissileExplosion extends Explosion {
    constructor(game, x, y) {
        super(game, x, y);

        this.radius = 0;
        this.maxRadius = 60;
        this.explosionSpeed = 50;

        this.deltaT = 0;
    }
    update() {
        this.deltaT++;
        if (this.deltaT >= this.explosionSpeed / 60) {
            this.radius++;
        }

        if (this.radius == this.maxRadius) {
            this.end = true;
        }

        // check for collisions
        for (let i = 0; i < this.game.asteroids.length; i++) {
            let asteroid = this.game.asteroids[i];

            let distX = asteroid.shapeObj.centerX - this.x;
            let distY = asteroid.shapeObj.centerY - this.y;
            let distR = asteroid.shapeObj.size / 2 + this.radius;
            if (distX * distX + distY * distY < distR * distR) {
                new SimpleExplosion(this.game, asteroid.shapeObj.centerX, asteroid.shapeObj.centerY);

                this.game.asteroids.splice(i, 1);
                this.game.updateBiggestAsteroid();

                // new level
                if (this.game.asteroids.length <= 0) {
                    this.game.increaseDifficulty();
                }
            }
        }
    }
    draw(ctx) {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'orange';
        ctx.stroke();
    }
}