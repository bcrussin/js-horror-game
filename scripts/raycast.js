class Raycaster {
    constructor(level) {
        this.level = level;
    }

    setLevel(level) {
        this.level = level;
    }

    castRay(startX, startY, rot) {
        let dirX = Math.sign(Math.cos(rot));
        let dirY = Math.sign(Math.sin(rot));

        let cellDX = dirX > 0 ? 1 : 0;
        let cellDY = dirY > 0 ? 1 : 0;

        let rotX = Math.cos(rot);
        let rotY = Math.sin(rot);

        let cellX = Math.floor(startX / this.level.tileSize);
        let cellY = Math.floor(startY / this.level.tileSize);

        let xDist = [
            (cellX + cellDX) * this.level.tileSize,
            null
        ]
        xDist[1] = startY + ((xDist[0] - startX) * Math.tan(rot))

        let yDist = [
            null,
            (cellY + cellDY) * this.level.tileSize
        ]
        yDist[0] = startX + ((yDist[1] - startY) / Math.tan(rot))
        
        //((startX * rotX) * ((cellX + 1) % startX)) + startX;

        let dy = ((startY * rotY) * ((cellY + dirX) % startY)) + startY;
        //console.log(dx)
        return {
            x: [xDist[0], xDist[1]],
            y: [yDist[0], yDist[1]]
        }
    }
}