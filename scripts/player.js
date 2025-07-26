class Player {
    constructor(game) {
        this.game = game;

        // starting center position
        this.x = this.game.canvas.width / 2;
        this.y = this.game.canvas.height / 2;
        //this.speed = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.accX = 0;
        this.accY = 0;
        this.baseAcc = 0.05;
        this.maxSpeed = 2;

        // player pointing direction
        this.angle = 0;
        // player angular speed
        this.aSpeed = 0;
        this.friction = 0.003;
        // angular acceleration
        this.aAcc = 0.05;

        this.fireRate = 1; //projectile/sec
        this.maxFireRate = 5; //projectile/sec
        this.deltaT = 0;

        this.bullets = [];
        this.lastBullet = 0;

        this.hp = 3;
        this.maxHp = 5;
        this.immune = false;
        this.immuneTime = 3;
        this.immuneTimeLeft = 0;
        this.on = true;

        this.shape = [
            { x: this.x - 10, y: this.y - 10 },
            { x: this.x + 10, y: this.y },
            { x: this.x - 10, y: this.y + 10 }
        ];

        this.shapeObj = new Shape(this.game, this, this.shape, 'white');

        this.thruster = new Thruster(this.game, this);
    }

    hit() {
        if (this.hp <= 0) {
            new SimpleExplosion(this.game, this.shapeObj.centerX, this.shapeObj.centerY, 100);
            this.game.endGame();
            return;
        }
        this.hp--;
        this.immunity();
        this.game.updateLifePoints();

        new Notification({
            message: 'Hp down',
            displayTime: 3,
            color: 'red'
        })
    }

    immunity(time,) {
        if (time) {
            this.immuneTime = time;
        }
        this.immuneTimeLeft = this.immuneTime;
        this.immune = true;
    }

    powerUp(powerup) {
        switch (powerup.id) {
            case 'fire-rate':
                this.fireRate *= 1.2;
                if (this.fireRate > this.maxFireRate) {
                    this.fireRate = this.maxFireRate;
                }
                break;
            case 'hp-up':
                this.hp = (this.hp + 1) % this.maxHp == 0 ? this.maxHp : this.hp + 1;
                this.game.updateLifePoints();
                break;
            case 'shield':
                this.immunity(20, false);
                break;
            case 'nuke':
                new MissileExplosion(this.game, this.shapeObj.centerX, this.shapeObj.centerY, (this.game.canvas.width + this.game.canvas.height)/5, 100);
                break;
            case 'slow':
                this.game.slowDownAsteroids(10);
                break;
        }

        // show message
        new Notification({
            message: powerup.message,
            displayTime: 3,
            color: powerup.color
        })
    }

    update() {
        this.deltaT++;
        if (this.deltaT >= 60) {
            this.deltaT = 0;
            if (this.immuneTimeLeft > 0) {
                this.immuneTimeLeft--;
            } else if (this.immune) {
                this.immune = false;
            }
        }
        // manage inputs
        let inputs = this.game.inputBuffer;
        this.aSpeed = 0;
        this.accX = 0;
        this.accY = 0;
        for (let input of inputs) {
            // mouse and keyboard
            switch (input) {
                case 'w':
                    // forward
                    this.accX = this.baseAcc * Math.cos(this.angle);
                    this.accY = this.baseAcc * Math.sin(this.angle);
                    this.thruster.activate();
                    break;
                case 's':
                    // forward
                    this.accX = -(this.baseAcc * Math.cos(this.angle)) / 2;
                    this.accY = -(this.baseAcc * Math.sin(this.angle)) / 2;
                    break;
                case 'a':
                    // rotate counteclock
                    this.aSpeed -= this.aAcc;
                    if (this.aSpeed < -this.maxASpeed) {
                        this.aSpeed = -this.maxASpeed
                    }
                    break;
                case 'd':
                    // rotate clock
                    this.aSpeed += this.aAcc;
                    if (this.aSpeed > this.maxASpeed) {
                        this.aSpeed = this.maxASpeed
                    }
                    break;
                case ' ':
                    if (performance.now() - this.lastBullet > 600 / this.fireRate) {
                        new Bullet(this.game, this, this.angle)
                        this.lastBullet = performance.now();
                    }
                    break;
                case 'e':
                    break;
            }
        }
        let sign;
        sign = this.speedX > 0 ? 1 : -1;
        this.speedX += this.accX - sign * this.friction * this.speedX * this.speedX;
        sign = this.speedY > 0 ? 1 : -1;
        this.speedY += this.accY - sign * this.friction * this.speedY * this.speedY;


        this.angle += this.aSpeed;
        this.shapeObj.update(this.aSpeed, this.speedX, this.speedY);

        // update thruster
        this.thruster.update();


        // update bullets
        // destroy after set time
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let bullet = this.bullets[i];
            bullet.update();
            if (this.bullets[i].TTL <= 0) {
                this.bullets.splice(i, 1);
                return;
            }

            for (let j = this.game.asteroids.length - 1; j >= 0; j--) {
                let ast = this.game.asteroids[j];
                // collision with asteroid
                if (Math.pow(bullet.x - ast.shapeObj.centerX, 2) + Math.pow(bullet.y - ast.shapeObj.centerY, 2) < Math.pow(ast.shapeObj.size / 2, 2)) {
                    this.bullets.splice(i, 1);

                    this.game.increaseScore(10);

                    const shinkFactor = 0.6;

                    if (ast.shapeObj.size * shinkFactor > this.game.asteroidsMinSize) {
                        // split asteroid when destroyed
                        this.game.asteroids.push(new Asteroid(this.game, ast.shapeObj.size * shinkFactor, ast.shapeObj.centerX, ast.shapeObj.centerY));
                        this.game.asteroids.push(new Asteroid(this.game, ast.shapeObj.size * shinkFactor, ast.shapeObj.centerX, ast.shapeObj.centerY));
                    } else {
                        new SimpleExplosion(this.game, ast.shapeObj.centerX, ast.shapeObj.centerY);
                    }
                    // remove destroyed asteroid
                    this.game.asteroids.splice(j, 1);

                    // new level
                    if (this.game.asteroids.length <= 0) {
                        this.game.increaseDifficulty();
                    }

                    return;
                }
            }
        }
    }

    draw(ctx) {
        // draw smoke (first so it goes under)
        this.thruster.draw(ctx);

        this.shapeObj.draw(ctx);

        if (this.immune) {
            // shield
            ctx.strokeStyle = 'lightblue';
            ctx.lineWidth = 4;
            let alphaTime = Math.max((this.immuneTimeLeft) / this.immuneTime, .3);
            ctx.globalAlpha = alphaTime;
            ctx.beginPath();
            ctx.arc(this.shapeObj.centerX, this.shapeObj.centerY, this.shapeObj.size * 1.2, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.globalAlpha = 1;
        }

        this.shapeObj.draw(ctx);

        if (DEBUG) {
            ctx.strokeStyle = 'blue';
            ctx.beginPath();
            ctx.arc(this.shapeObj.centerX, this.shapeObj.centerY, this.game.safeRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // draw bullet
        for (let bullet of this.bullets) {
            bullet.draw(ctx);
        }

    }
}
