class Player {
    constructor(data) {
        this.map = data.map;
        this.x = 0;
        this.y = 0;
        this.xVel = 0;
        this.yVel = 0;
        this.dir = 0;
    }

    moveHorizontally = (delta) => {
        let offset = delta / Math.abs(delta);
        
        //console.log(this.map.posIsSolid(this.x + delta, this.y))
        if (this.map.posIsSolid(this.x + delta, this.y)) {
            if (delta > 0) {
                this.xVel = (Math.ceil((this.x) / this.map.cellWidth) * this.map.cellWidth - 0.1) - this.x// - 1
            } else {
                this.xVel = (Math.floor((this.x) / this.map.cellWidth) * this.map.cellWidth) - this.x// + 1
            }
            // - (delta / Math.abs(delta));
        } else {
            this.xVel = delta;
        }
    }

    moveVertically = (delta) => {
        if (this.map.posIsSolid(this.x, this.y + delta)) {
            if (delta > 0) {
                this.yVel = (Math.ceil((this.y) / this.map.cellHeight) * this.map.cellHeight - 0.1) - this.y;// - (delta / Math.abs(delta));
            } else {
                this.yVel = (Math.floor((this.y) / this.map.cellHeight) * this.map.cellHeight) - this.y;// - (delta / Math.abs(delta));
            }
        } else {
            this.yVel = delta;
        }
    }

    faceMouse = (e, canvas) => {
        this.dir = Math.atan2(e.clientY - (canvas.height / 2), e.clientX - (canvas.width / 2))
    }

    update = () => {
        this.x += this.xVel;
        this.y += this.yVel;
    }
}