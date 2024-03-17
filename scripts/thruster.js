// random ball on ship position that shrinks
class Thruster {
    constructor(game, obj, color, intensity) {
        this.game = game;
        this.obj = obj;
        this.color = color;
        this.intensity = intensity == undefined ? 1 : intensity; // how intense is the effect

        this.particles = [];
    }
    activate() {
        this.particles.push(new Smoke(this.game, this.obj, this.color, this.intensity));
    }
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].size <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    draw(ctx) {
        for (let particle of this.particles) {
            particle.draw(ctx);
        }
    }
}

class Smoke {
    constructor(game, source, color, intensity) {
        this.game = game;
        this.source = source;
        this.angle = this.source.angle + Math.random() / 10 * (Math.random() > 0.5 ? 1 : -1);
        this.x = source.shapeObj.centerX - 15 * Math.cos(this.angle);
        this.y = source.shapeObj.centerY - 15 * Math.sin(this.angle);
        this.size = Math.random() * 5;
        this.deltaT = 0;
        this.speed = Math.random() * 2;
        this.color = color || [255, 0, 0];
        this.intensity = intensity;
    }
    update() {
        this.deltaT++;
        if (this.deltaT >= 20) {
            this.deltaT = 0;
            // shrink
            this.size -= (1 / this.intensity);
            this.size = this.size - 1 / this.intensity < 0 ? 0 : this.size - 1 / this.intensity;
        }

        // movement
        this.x += -this.speed * Math.cos(this.angle);
        this.y += -this.speed * Math.sin(this.angle);

        for (let i = 0; i < this.color.length; i++) {
            if (this.color[i] < 255) {
                this.color[i] += 10;
            }
        }
    }
    draw(ctx) {
        ctx.fillStyle = 'rgb(' + this.color.join() + ')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
    }
}