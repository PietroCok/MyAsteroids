class PowerUp {
    static images = {
        'fire-rate': {
            'path': './assets/bullets.svg',
            'img': null
        },
        'hp-up': {
            'path': './assets/heart.svg',
            'img': null
        },
        'shield': {
            'path': './assets/shield.svg',
            'img': null
        },
        'nuke': {
            'path': './assets/nuke.svg',
            'img': null
        },
        'slow': {
            'path': './assets/clock.svg',
            'img': null
        },
    }

    constructor(game, forceType = null) {
        this.game = game;

        this.size = 25;
        this.x = Math.random() * (this.game.canvas.width - this.size * 2) + this.size;
        this.y = Math.random() * (this.game.canvas.height - this.size * 2) + this.size;

        this.types = [
            {
                id: 'fire-rate',
                message: 'Firerate +20%',
                color: 'lime'
            },
            {
                id: 'hp-up',
                message: 'Hp up',
                color: 'red'
            },
            {
                id: 'shield',
                message: 'Shield',
                color: 'cyan'
            },
            {
                id: 'nuke',
                message: 'Nuke',
                color: 'orange'
            },
            {
                id: 'slow',
                message: 'Slowdown',
                color: 'purple'
            }
        ]

        if (forceType && this.types.find(t => t.id == forceType)) {
            this.type = this.types.find(t => t.id == forceType);
        } else {
            let availableTypes = this.types;
            // remove hp up from pool when player has max hp
            if (this.game.player?.hp >= this.game.player?.maxHp) {
                availableTypes = availableTypes.filter(t => t.id != 'hp-up')
            }
            // remove firerate up from pool when player has reached max firerate
            if (this.game.player?.fireRate >= this.game.player?.maxFireRate) {
                availableTypes = availableTypes.filter(t => t.id != 'fire-rate')
            }
            if (availableTypes.length == 0) {
                return;
            }
            this.type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        }
        
        this.deltaT = 0;
        this.TTL_start = Math.round(Math.random() * 5 + 30);
        this.TTL = this.TTL_start;

        this.on = true;
    }

    static loadImages() {
        for (const image of Object.values(PowerUp.images)) {
            this.loadImage(image);
        }
    }

    static loadImage(image) {
        const img = new Image();
        img.src = image.path;
        img.onload = () => {
            //console.log(`Image ${img.src} loaded`);
            image.img = img;
        }

        img.onerror = (error) => {
            //console.log(`Failed to load image ${image.path}: ${error.message}`);
        }
    }

    update() {
        this.deltaT++;
        if (this.deltaT >= 60) {
            this.deltaT = 0;
            this.TTL--;
        }

        if (this.TTL <= 0) {
            delete this;
        }
    }

    draw(ctx) {
        let blinkTime = 6 - this.TTL; // state change/second
        if (this.TTL < 5 && this.deltaT % (60 / blinkTime) == 0) {
            this.on = !this.on;
        }
        if (this.on) {

            const img = PowerUp.images[this.type.id].img;
            
            if (img) {
                ctx.drawImage(img, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);

                // draw arc to show time left
                const percLeft = this.TTL / this.TTL_start;

                ctx.lineWidth = 1;
                ctx.strokeStyle = this.type.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 15, 0, 2 * Math.PI * percLeft);
                ctx.stroke();
            }
        }
    }
}