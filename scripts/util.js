class Shape {
    constructor(game, obj, points, color, size) {
        this.game = game;
        this.shape = points;
        this.color = color;
        this.aSpeed = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.size = size || 20;
        this.obj = obj;

        this.centerX = 0;
        for (let point of this.shape) {
            this.centerX += point.x;
        }
        this.centerX /= this.shape.length;

        this.centerY = 0;
        for (let point of this.shape) {
            this.centerY += point.y;
        }
        this.centerY /= this.shape.length;
    }
    // torna un array di vettori (definiti da due punti) perpendicolari ai lati della figura
    getAxis() {
        let axis = [];
        for (let i = 0; i < this.shape.length; i++) {
            // get consecutive points
            let p1 = this.shape[i];
            let p2 = this.shape[i + 1 == this.shape.length ? 0 : i + 1];

            // get edge vector
            let edge = {
                x: p2.x - p1.x,
                y: p2.y - p1.y
            };

            // get normal vector
            let perp = {
                x: edge.x,
                y: -edge.y
            };

            let norm = Math.sqrt(perp.x * perp.x + perp.y * perp.y);
            let normal = {
                x: perp.x / norm,
                y: perp.y / norm
            }

            axis.push(normal);
        }
        return axis;
    }
    // proietta la figura su un asse definito dal due punti
    project(axis) {
        // edge this.shape[i].x + this.shape[i+1==this.shape.length?0:i+1].x
        //let min = axis.x * this.shape[0].x + axis.y * this.shape[0].y;
        let min = axis.x * this.shape[0].x + axis.y * this.shape[0].y;
        let max = min;

        // iterate on shape points
        // get coords in the new axis
        // save min and max accordingly
        for (let i = 1; i < this.shape.length; i++) {
            let p = axis.x * this.shape[i].x + axis.y * this.shape[i].y;

            if (p < min) {
                min = p;
            } else if (p > max) {
                max = p;
            }
        }

        // return the points of the projection on the desired axis
        // assume it's used with calculations on same axis
        let projection = {
            min: min,
            max: max
        };

        return projection;
    }
    // translate 
    move(deltaX, deltaY) {
        for (let point of this.shape) {
            point.x += deltaX;
            point.y += deltaY;
        }
    }

    update(aSpeed, speedX, speedY) {
        this.aSpeed = aSpeed;
        this.speedX = speedX;
        this.speedY = speedY;


        this.rotatedShape = structuredClone(this.shape);
        // center of geometry
        this.centerX = 0;
        for (let point of this.rotatedShape) {
            this.centerX += point.x;
        }
        this.centerX /= this.rotatedShape.length;

        this.centerY = 0;
        for (let point of this.rotatedShape) {
            this.centerY += point.y;
        }
        this.centerY /= this.rotatedShape.length;

        for (let i = 0; i < this.rotatedShape.length; i++) {
            let newPoint = this.rotatedShape[i];
            let oldPoint = this.shape[i];


            // shift center from origin
            let shiftedOldX = oldPoint.x - this.centerX;
            let shiftedOldY = oldPoint.y - this.centerY;

            // rotation
            let shiftedNewX = shiftedOldX * Math.cos(this.aSpeed) - shiftedOldY * Math.sin(this.aSpeed);
            let shiftedNewY = shiftedOldX * Math.sin(this.aSpeed) + shiftedOldY * Math.cos(this.aSpeed);

            // shift center to origin
            newPoint.x = shiftedNewX + this.centerX;
            newPoint.y = shiftedNewY + this.centerY;

            // movement
            newPoint.x += this.speedX;
            newPoint.y += this.speedY;
        }

        // update shape to draw and for next iteration
        this.shape = JSON.parse(JSON.stringify(this.rotatedShape));


        // out of map
        if (this.centerX - this.size > this.game.canvas.width) {
            this.move(-this.game.canvas.width - this.size, 0);
        }
        if (this.centerX + this.size < 0) {
            this.move(this.game.canvas.width + this.size, 0);
        }

        if (this.centerY - this.size > this.game.canvas.height) {
            this.move(0, -this.game.canvas.height - this.size);
        }
        if (this.centerY + this.size < 0) {
            this.move(0, this.game.canvas.height + this.size);
        }

    }

    draw(ctx, {lineWidth, fill, fillStyle} = {}) {
        ctx.beginPath();
        ctx.moveTo(this.shape[0].x, this.shape[0].y)
        for (let i = 1; i < this.shape.length; i++) {
            ctx.lineTo(this.shape[i].x, this.shape[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = lineWidth || 2;
        ctx.stroke();
        if(fill){
            ctx.fillStyle = fillStyle || this.color;
            ctx.fill();
        }

        if (DEBUG) {
            // obj center point
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, 2, 0, Math.PI * 2);
            ctx.fill();

            // obj bullet collision
            ctx.strokeStyle = 'orange';
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.size / 2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

function scaleShape(points, scale) {
    // shape center coords
    let centerX = 0;
    for (let point of points) {
        centerX += point.x;
    }
    centerX /= points.length;

    let centerY = 0;
    for (let point of points) {
        centerY += point.y;
    }
    centerY /= points.length;

    for (let i = 0; i < points.length; i++) {
        let x = points[i].x;
        let y = points[i].y;

        // move reltive to axis origin
        let xc = x - centerX;
        let yc = y - centerY;

        let len = Math.sqrt(xc * xc + yc * yc)

        // angle relative to axis
        let a = Math.atan2(yc, xc);
        a = a < 0 ? a + Math.PI * 2 : a;
        // scale vector
        let scx = len * scale * Math.cos(a);
        let scy = len * scale * Math.sin(a);
        // move again relative to its center
        points[i].x = scx + centerX;
        points[i].y = scy + centerY;
    }

    return points;
}

// check collision with SAT
function collisionCheckSAT(shapeA, shapeB) {
    // find axis for test
    let shape1 = shapeA;
    let shape2 = shapeB;
    let axis1 = shape1.getAxis();
    let axis2 = shape2.getAxis();

    //axis 1 loop
    for (let i = 0; i < axis1.length; i++) {
        let p1 = shape1.project(axis1[i]);
        let p2 = shape2.project(axis1[i]);

        // check overlap
        if (!(p1.min < p2.max && p2.min < p1.max)) {
            return false;
        }
    }

    //axis 1 loop
    for (let i = 0; i < axis2.length; i++) {
        let p1 = shape1.project(axis2[i]);
        let p2 = shape2.project(axis2[i]);

        // check overlap
        if (!(p1.min < p2.max && p2.min < p1.max)) {
            return false;
        }
    }

    // collision found
    return true;
}

function isMobileDevice() {
    return window.matchMedia("(pointer: coarse)").matches;
}