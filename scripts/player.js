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

        // show message
        const element = document.getElementById('hp-down');
        if (element && !element.classList.contains('animate')) {
            element.classList.add('animate');
            setTimeout(() => {
                element.classList.remove('animate');
            }, 5 * 1000);
        }
    }

    immunity(time) {
        if (time) {
            this.immuneTime = time;
        }
        this.immuneTimeLeft = this.immuneTime;
        this.immune = true;
    }

    pickUp(pickup) {
        switch (pickup.text) {
            case 'fireRate':
                this.fireRate *= 1.2;
                if(this.fireRate > this.maxFireRate){
                    this.fireRate = this.maxFireRate;
                }
                break;
            case 'hp':
                this.hp = (this.hp + 1) % this.maxHp == 0 ? this.maxHp : this.hp + 1;
                this.game.updateLifePoints();
                break;
        }

        // show message
        const element = document.getElementById(pickup.id);
        if (element && !element.classList.contains('animate')) {
            element.classList.add('animate');
            setTimeout(() => {
                element.classList.remove('animate');
            }, 5 * 1000);
        }
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

                        //this.game.asteroidsNumber++;
                        //this.game.addAsteroid();
                    }
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

        // if player immune blink (faster as time left decrease)
        if (this.immune) {
            // half second on, half second off
            let blinkTime = 6 - this.immuneTimeLeft; // state change/second
            if (this.deltaT % (60 / blinkTime) == 0) {
                this.on = !this.on;
            }
            if (this.on) {
                this.shapeObj.draw(ctx);
            }

            // shield
            ctx.strokeStyle = 'lightblue';
            ctx.lineWidth = 3;
            ctx.globalAlpha = (this.immuneTimeLeft + 1) / this.immuneTime;
            ctx.beginPath();
            ctx.arc(this.shapeObj.centerX, this.shapeObj.centerY, this.shapeObj.size * 1.2, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.lineWidth = 2,
                ctx.globalAlpha = 1;

        } else {
            this.shapeObj.draw(ctx);
        }

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



class PickUp {
    constructor(game) {
        this.game = game;

        this.size = 15;
        this.x = Math.random() * (this.game.canvas.width - this.size * 2) + this.size;
        this.y = Math.random() * (this.game.canvas.height - this.size * 2) + this.size;

        this.types = [
            {
                id: 'fire-rate',
                text: 'fireRate',
                simbol: 'F',
                color: 'lime'
            },
            {
                id: 'hp-up',
                text: 'hp',
                simbol: 'H',
                color: 'red'
            }
        ]

        let availableTypes = this.types;
        // remove hp up from pool when player has max hp
        if (this.game.player?.hp >= this.game.player?.maxHp) {
            availableTypes = availableTypes.filter(t => t.id != 'hp-up')
        }
        // remove firerate up from pool when player has reached max firerate
        if (this.game.player?.fireRate >= this.game.player?.maxFireRate) {
            availableTypes = availableTypes.filter(t => t.id != 'fire-rate')
        }

        if(availableTypes.length == 0){
            return;
        }

        this.type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        this.deltaT = 0;
        this.TTL_start = Math.round(Math.random() * 5 + 20);
        this.TTL = this.TTL_start;

        this.on = true;
    }
    update() {
        this.deltaT++;
        if (this.deltaT >= 60) {
            this.deltaT = 0;
            this.TTL--;
        }

        if(this.TTL <= 0){
            delete this;
        }
    }
    draw(ctx) {
        let blinkTime = 6 - this.TTL; // state change/second
        if (this.TTL < 5 && this.deltaT % (60 / blinkTime) == 0) {
            this.on = !this.on;
        }
        if (this.on) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = this.type.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 12, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.font = '20px Arial bold';
            ctx.fillStyle = this.type.color;
            ctx.textAlign = "center";
            ctx.fillText(this.type.simbol, this.x, this.y + 6);
        }
    }
}