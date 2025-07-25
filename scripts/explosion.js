class Explosion {
    constructor(game, x, y) {
        this.game = game;

        this.x = x;
        this.y = y;

        this.game.explosions.push(this);
        this.end = false;
        this.deltaT = 0;
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
        this.startTTL = 2 * 60;
        this.TTL =  this.startTTL;
        this.particles = [];

        for (let i = 0; i < this.n; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                speedX: (Math.random() * 4) * (Math.random() >= 0.5 ? 1 : -1),
                speedY: (Math.random() * 4) * (Math.random() >= 0.5 ? 1 : -1),
                color: {
                    red: Math.random() * 255,
                    green: Math.random() * 255,
                    blue: Math.random() * 255,
                    opacity: 1
                }
            });
        }
    }
    update() {
        this.TTL--;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let particle = this.particles[i];
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.color.opacity -= this.TTL / this.startTTL / 100;

            if (this.TTL <= 0) {
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
            const color = `rgba(${p.color.red}, ${p.color.green}, ${p.color.blue}, ${p.color.opacity})`
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI);
            ctx.fillStyle = color;
            ctx.closePath();
            ctx.fill();
        })
    }
}

class MissileExplosion extends Explosion {
    constructor(game, x, y) {
        super(game, x, y);

        this.radius = 0;
        this.maxRadius = 60;
        this.explosionSpeed = 50;
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

                this.game.increaseScore(10);

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