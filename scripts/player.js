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

        let halfWidth = this.width / 2;
        let halfHeight = this.height / 2;

        //console.log(this.x)
        let rot = Math.atan2(dy, dx);
        let dirX = Math.sign(dx);
        let dirY = Math.sign(dy);

        let isGoingLeft = dirX < 0;
        let isGoingUp = dirY < 0;

        let startX = this.x// + (halfWidth * dirX);
        let startY = this.y// + (halfHeight * dirY);

        let ex = startX + dx;
        let ey = startY + dy;
        let posEnd = [];
        posEnd.push([ex - halfWidth, ey - halfHeight]);
        posEnd.push([ex + halfWidth, ey - halfHeight]);
        posEnd.push([ex - halfWidth, ey + halfHeight]);
        posEnd.push([ex + halfWidth, ey + halfHeight]);
        
        let cellStart = [];
        cellStart.push(this.map.posToXY(this.x - halfWidth, this.y - halfHeight));
        cellStart.push(this.map.posToXY(this.x + halfWidth, this.y - halfHeight));
        cellStart.push(this.map.posToXY(this.x - halfWidth, this.y + halfHeight));
        cellStart.push(this.map.posToXY(this.x + halfWidth, this.y + halfHeight));

        let cellEnd = [];
        posEnd.forEach(pos => cellEnd.push(this.map.posToXY(pos)));


        let collidedX = null;
        let collidedY = null;

        // Calculate the number of cells travelled, then check each one in the direction of movement
        for (let cell = 0; cell < cellStart.length; cell++) {
            let currStart = cellStart[cell];
            let currEnd = cellEnd[cell];

            for (let i = 0; i <= Math.abs(currEnd[0] - currStart[0]); i++) {
                let currCell = currStart[0] + (i * dirX)
                if (this.map.getFromXY(currCell, currStart[1]) != undefined) {
                    if (collidedX == undefined || collidedX.distance < i) {
                        collidedX = {
                            distance: i,
                            cell: currCell
                        };
                    }
                    break;
                }
            }
        }

        // Calculate the number of cells travelled, then check each one in the direction of movement
        for (let cell = 0; cell < cellStart.length; cell++) {
            let currStart = cellStart[cell];
            let currEnd = cellEnd[cell];

            for (let i = 0; i <= Math.abs(currEnd[1] - currStart[1]); i++) {
                let currCell = currStart[1] + (i * dirY)
                if (this.map.getFromXY(currStart[0], currCell) != undefined) {
                    if (collidedY == undefined || collidedY.distance < i) {
                        collidedY = {
                            distance: i,
                            cell: currCell
                        };
                    }
                    break;
                }
            }
        }

        if (!!collidedX) {
            let cellX = (isGoingLeft ? collidedX.cell + 1 : collidedX.cell)
            this.x = (cellX * this.map.tileSize) - (isGoingLeft ? 0 : 0.1) - (halfWidth * dirX);
        } else {
            this.x += dx;
        }

        if (!!collidedY) {
            let cellY = (isGoingUp ? collidedY.cell + 1 : collidedY.cell)
            this.y = (cellY * this.map.tileSize) - (isGoingUp ? 0 : 0.1) - (halfHeight * dirY);
        } else {
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

        this.dir += (target - this.dir) * Math.min(delta * 0.3, 1);
        this.dir = this.dir % (Math.PI * 2);
    }

    update = (delta) => {
        this.x += this.xVel * delta;
        this.y += this.yVel * delta;
    }
}