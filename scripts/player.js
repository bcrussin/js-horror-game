class Player {
    constructor(data) {
        this.map = data.map;
        this.x = 0;
        this.y = 0;
        this.width = data.width ?? 0;
        this.height = data.height ?? 0;
        this.xVel = 0;
        this.yVel = 0;
        this.dir = 0;
    }

    move = (dx, dy, delta) => {
        dx *= delta;
        dy *= delta;

        //console.log(this.x)
        let rot = Math.atan2(dy, dx);
        let dirX = Math.sign(dx);
        let dirY = Math.sign(dy);

        let isGoingLeft = dirX < 0;
        let isGoingUp = dirY < 0;

        let startX = this.x + ((this.width * dirX) / 2);
        let startY = this.y + ((this.height * dirY) / 2);
        let posEnd = [startX + dx, startY + dy];
        
        let cellStart = this.map.posToXY(this.x, this.y);
        let cellEnd = this.map.posToXY(posEnd);


        let collidedX = false;
        let collidedY = false;

        // Calculate the number of cells travelled, then check each one in the direction of movement
        for (let i = 0; i <= Math.abs(cellEnd[0] - cellStart[0]); i++) {
            let currCell = cellStart[0] + (i * dirX)
            if (this.map.getFromXY(currCell, cellStart[1]) != undefined) {
                let cellX = (isGoingLeft ? currCell + 1 : currCell)
                this.x = (cellX * this.map.tileSize) - (isGoingLeft ? 0 : 0.1) - (this.width * dirX / 2);
                collidedX = true;
                break;
            }
        }

        if (!collidedX) {
            this.x += dx;
        }

        // Calculate the number of cells travelled, then check each one in the direction of movement
        for (let i = 0; i <= Math.abs(cellEnd[1] - cellStart[1]); i++) {
            let currCell = cellStart[1] + (i * dirY)
            if (this.map.getFromXY(cellStart[0], currCell) != undefined) {
                let cellY = (isGoingUp ? currCell + 1 : currCell)
                this.y = (cellY * this.map.tileSize) - (isGoingUp ? 0 : 0.1) - (this.height * dirY / 2);
                collidedY = true;
                break;
            }
        }

        if (!collidedY) {
            this.y += dy;
        }
    }

    moveHorizontally = (speed, raycaster, delta) => {
        if (this.map.posIsSolid(this.x + (speed * delta), this.y)) {
            if (speed > 0) {
                this.xVel = (Math.ceil((this.x) / this.map.cellWidth) * this.map.cellWidth - 0.1) - this.x// - 1
            } else {
                this.xVel = (Math.floor((this.x) / this.map.cellWidth) * this.map.cellWidth + 0.1) - this.x// + 1
            }
            // - (delta / Math.abs(delta));
        } else {
            this.xVel = speed;
        }
    }

    moveVertically = (speed, delta) => {
        if (this.map.posIsSolid(this.x, this.y + (speed * delta))) {
            if (speed > 0) {
                this.yVel = (Math.ceil((this.y) / this.map.cellHeight) * this.map.cellHeight - 0.1) - this.y;// - (delta / Math.abs(delta));
            } else {
                this.yVel = (Math.floor((this.y) / this.map.cellHeight) * this.map.cellHeight + 0.1) - this.y;// - (delta / Math.abs(delta));
            }
        } else {
            this.yVel = speed;
        }
    }

    faceMouse = (pos, canvas, delta = 1) => {
        let target = Math.atan2(pos[1] - (canvas.height / 2), pos[0] - (canvas.width / 2));

        if (target == undefined || isNaN(target)) return;
        
        if (this.dir - target >= Math.PI && target < this.dir)
            target += Math.PI * 2;

        if (target - this.dir >= Math.PI)
            target -= Math.PI * 2;

        this.dir += (target - this.dir) * (delta * 0.3);
        this.dir = this.dir % (Math.PI * 2);
    }

    update = (delta) => {
        this.x += this.xVel * delta;
        this.y += this.yVel * delta;
    }
}