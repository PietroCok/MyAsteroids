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

class HomingMissile extends Bullet {
    constructor(game, player) {
        super(game, player);

        this.target = this.getTarget(); // shape to target

        let points = scaleShape(JSON.parse(JSON.stringify(this.player.shapeObj.shape)), .5)
        this.shapeObj = new Shape(this.game, this, points, 'red', 10);

        this.thruster = new Thruster(this.game, this, [0, 0, 255], 0.2);

        this.speedX = this.player.speedX;
        this.speedY = this.player.speedY;
        this.baseAcc = 0 //0.5;
        this.maxSpeed = 5;
        this.angle = this.player.angle;
        this.maxASpeed = 0.02;
        this.aSpeed = 0;
        this.accX = this.baseAcc * Math.cos(this.angle);
        this.accY = this.baseAcc * Math.sin(this.angle);

        this.TTL = 4; // how long before explosion if no collision
        this.fuel = 3; // how long to sprint forward
        this.igniteBoostAfter = 1; // let it rotate a bit before ignite booster
        this.timeToIgnite = 0;
        this.explosionDist = 30;

        this.deltaT = 0;
    }

    getTarget() {
        let biggest;
        for (let asteroid of this.game.asteroids) {
            if (asteroid.biggest) {
                biggest = asteroid;
            }
        }
        return biggest;
    }

    explode() {
        this.TTL = 0;
        new HomingMissileExplosion(this.game, this.shapeObj.centerX, this.shapeObj.centerY);
    }

    update() {
        if (this.TTL <= 0) {
            return;
        }

        this.deltaT++;
        if (this.deltaT >= 60) {
            this.deltaT = 0;
            this.TTL--;
            this.fuel--;

            if (this.TTL <= 0) {
                this.explode();
                return;
            }

        }
        // wait before ingnite booster
        this.timeToIgnite++;
        if (this.timeToIgnite / 60 >= this.igniteBoostAfter) {
            this.baseAcc = 0.3;
        }

        this.aSpeed = 0;
        if (this.target) {
            // need to aim for where the object will be
            let timeInFuture = 1;
            let futureTargetX = this.target.shapeObj.centerX + (this.target.shapeObj.obj.speedX * timeInFuture * 60);
            let futureTargetY = this.target.shapeObj.centerY + (this.target.shapeObj.obj.speedY * timeInFuture * 60);

            //this.targetX = this.target.shapeObj.centerX;
            //this.targetY = this.target.shapeObj.centerY;

            this.targetX = futureTargetX;
            this.targetY = futureTargetY;

            // rotazione verso l'obiettivo
            // calcolo segmento che unisce con l'obiettivo
            let distX = this.targetX - this.shapeObj.centerX;
            let distY = this.targetY - this.shapeObj.centerY;
            //let a = Math.atan2(this.targetY, this.targetX);
            let a = Math.atan2(distY, distX); // angle relative to 0
            let aShift = a - this.angle;  // angle relative to obj angle
            if (aShift < 0) {
                aShift += Math.PI * 2;
            }

            // aggiornamento componenti velocità
            if (this.fuel > 0) {

                // rotation
                if (aShift < Math.PI) {
                    // rotate right
                    this.aSpeed = 0.05;
                } else {
                    // rotate left
                    this.aSpeed = -0.05;
                }

                this.thruster.activate();

                this.accX = this.baseAcc * Math.cos(this.angle);
                this.accY = this.baseAcc * Math.sin(this.angle);
                // speed update
                this.speedX += this.accX;
                if (this.speedX > this.maxSpeed) {
                    this.speedX = this.maxSpeed;
                }
                if (this.speedX < -this.maxSpeed) {
                    this.speedX = -this.maxSpeed
                }
                this.speedY += this.accY;
                if (this.speedY > this.maxSpeed) {
                    this.speedY = this.maxSpeed;
                }
                if (this.speedY < -this.maxSpeed) {
                    this.speedY = -this.maxSpeed
                }

                this.angle += this.aSpeed;

                // move into fuel check
                //this.angle += this.aSpeed;
                if (this.angle >= Math.PI * 2) {
                    this.angle -= Math.PI * 2;
                } else if (this.angle < -Math.PI * 2) {
                    this.angle += Math.PI * 2;
                }
            }

            // check for collisions
            for (let i = 0; i < this.game.asteroids.length; i++) {
                let asteroid = this.game.asteroids[i];


                let distX = asteroid.shapeObj.centerX - this.shapeObj.centerX;
                let distY = asteroid.shapeObj.centerY - this.shapeObj.centerY;
                let distR = asteroid.shapeObj.size / 2 + this.explosionDist;
                if (distX * distX + distY * distY < distR * distR) {
                    new SimpleExplosion(this.game, asteroid.shapeObj.centerX, asteroid.shapeObj.centerY);

                    this.game.asteroids.splice(i, 1);
                    this.game.updateBiggestAsteroid();

                    // new level
                    if (this.game.asteroids.length <= 0) {
                        this.game.increaseDifficulty();
                    }

                    this.explode();
                    return;
                }
            }
        }



        this.thruster.update();

        //this.speedX = 0;
        //this.speedY = 0;
        this.shapeObj.update(this.aSpeed, this.speedX, this.speedY);
    }

    draw(ctx) {
        if (this.TTL <= 0) {
            return;
        }
        this.thruster.draw(ctx);
        this.shapeObj.draw(ctx);

        if (DEBUG) {
            // draw aim point
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(this.targetX, this.targetY, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}