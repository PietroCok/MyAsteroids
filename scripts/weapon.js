class Bullet {
    constructor(game, player, angle) {
        this.game = game;
        this.player = player;
        this.player.bullets.push(this);

        // spawn in front of ship
        this.angle = angle;
        this.x = player.shapeObj.centerX + 15 * Math.cos(this.angle);
        this.y = player.shapeObj.centerY + 15 * Math.sin(this.angle);
        this.length = 5;
        this.speed = 10;
        this.TTL = 2;
        this.deltaT = 0;
    }
    update() {
        this.deltaT++;
        if (this.deltaT >= 60) {
            this.deltaT = 0;
            this.TTL--;
        }
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);
        this.offX = this.length * Math.cos(this.angle);
        this.offY = this.length * Math.sin(this.angle);


        // out of playable area
        if (this.x < 0) {
            this.x = this.game.canvas.width;
        }
        if (this.x > this.game.canvas.width) {
            this.x = 0;
        }
        if (this.y < 0) {
            this.y = this.game.canvas.height;
        }
        if (this.y > this.game.canvas.height) {
            this.y = 0;
        }
    }
    draw(ctx) {
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.offX, this.y + this.offY);
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
