class Asteroid {
    constructor(game, size, x, y, hp) {
        this.game = game;

        this.x = x || Math.random() * this.game.canvas.width;
        this.y = y || Math.random() * this.game.canvas.height;
        if (size && size < this.game.asteroidsMinSize) {
            size = this.game.asteroidsMinSize;
        }
        this.size = size || Math.random() * 20 + 60;
        this.sides = Math.floor(this.size / 10) + 1;
        this.speedY = (Math.random() > 0.5 ? 1 : -1) * 1 / this.size * 25 * (Math.random() + 0.5);
        this.speedX = (Math.random() > 0.5 ? 1 : -1) * 1 / this.size * 25 * (Math.random() + 0.5);
        this.aSpeed = Math.random() * 6 * 0.005;

        if(hp == undefined){
            this.maxHp = Math.min(1 + this.game.level * 0.2, 5);
        } else {
            this.maxHp = Math.min(Math.max(hp, 1), 5);
        }
        this.hp = this.maxHp;
        console.log(this.hp);

        this.points = [];
        this.generate();
        this.shapeObj = new Shape(this.game, this, this.points, 'white', this.size);
    }
    generate() {
        // takes points on a circle
        let angle = 0;
        this.points.push({ x: this.x + this.size / 2 * Math.cos(angle), y: this.y + this.size / 2 * Math.sin(angle) });
        for (let i = 0; i < this.sides - 1; i++) {
            angle += (2 * Math.PI / this.sides);
            if (angle > 2 * Math.PI) {
                break;
            }
            this.points.push({ x: this.points[i].x + this.size / 2 * Math.cos(angle), y: this.points[i].y + this.size / 2 * Math.sin(angle) });
        }
    }
    update(effects) {
        let speedModifier = 1
        for(const effect of effects){
            if(effect.type == 'slowdown'){
                speedModifier /= 3;
            }
        }

        this.shapeObj.update(this.aSpeed * speedModifier, this.speedX * speedModifier, this.speedY * speedModifier);

        // collision with ship
        if (this.game.player && !this.game.player.immune) {
            if (collisionCheckSAT(this.shapeObj, this.game.player.shapeObj)) {
                this.game.player.hit();
                return;
            }
        }
    }
    draw(ctx) {
        this.shapeObj.draw(ctx, {
            lineWidth: 2 * Math.floor(this.hp)
        });
    }
}