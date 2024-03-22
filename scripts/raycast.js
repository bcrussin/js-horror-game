class Raycaster {
    constructor(level) {
        this.level = level;
    }

    setLevel(level) {
        this.level = level;
    }

    cast(startX, startY, rot, options = {}) {
        let maxDistance = options.maxDistance ?? 100;

        let x = startX;
        let y = startY;

        let dirX = Math.sign(Math.cos(rot));
        let dirY = Math.sign(Math.sin(rot));

        // 1 if ray is POSITIVE on the X or Y axes, 0 otherwise
        let isIncreasingX = dirX > 0;
        let isIncreasingY = dirY > 0;

        // 1 if ray is NEGATIVE on the X or Y axes, 0 otherwise
        let isDecreasingX = (dirX <= 0) * -1;
        let isDecreasingY = (dirY <= 0) * -1;

        let cellX = Math.floor(x / this.level.tileSize);
        let cellY = Math.floor(y / this.level.tileSize);

        // Initialize rays to the player's current cell
        let rayX = [cellX, cellY];
        let rayY = [cellX, cellY];
        
        // Initial ray position calculations
        rayX[0] = ((cellX + isIncreasingX) * this.level.tileSize);
        rayX[1] = y + ((rayX[0] - x) * Math.tan(rot));
        
        rayY[1] = ((cellY + isIncreasingY) * this.level.tileSize);
        rayY[0] = x + ((rayY[1] - y) / Math.tan(rot));

        while (Math.hypot(x - startX, y - startY) < maxDistance) {
            let distX = Math.hypot(rayX[0] - x, rayX[1] - y);
            let distY = Math.hypot(rayY[0] - x, rayY[1] - y);
            
            let cellXOffset = 0;
            let cellYOffset = 0;

            if(distX < distY) {
                x = rayX[0];
                y = rayX[1];

                rayX[0] = ((cellX + dirX) * this.level.tileSize);
                rayX[1] = y + ((rayX[0] - x) * Math.tan(rot));

                cellXOffset = isDecreasingX
            } else {
                x = rayY[0];
                y = rayY[1];
                
                rayY[1] = ((cellY + dirY) * this.level.tileSize);
                rayY[0] = x + ((rayY[1] - y) / Math.tan(rot));

                cellYOffset = isDecreasingY
            }

            // Cut line short if it becomes longer than max distance
            if (Math.hypot(x - startX, y - startY) >= maxDistance) {
                break;
            }

            cellX = Math.floor(x / this.level.tileSize);
            cellY = Math.floor(y / this.level.tileSize);

            if (!!this.level.getFromXY(cellX + cellXOffset, cellY + cellYOffset)) {
                return {
                    hit: [x, y],
                    hitCell: [cellX + cellXOffset, cellY + cellYOffset],
                    collision: true,
                    strength: Math.sqrt((maxDistance * maxDistance) - (Math.hypot(x - startX, y - startY) * Math.hypot(x - startX, y - startY))) * 0.5
                }
            }
        }

        x = startX + (maxDistance * Math.cos(rot));
        y = startY + (maxDistance * Math.sin(rot));
        
        return {
            hit: [x, y],
            hitCell: null,
            collision: false,
            strength: null
        }
    }
}