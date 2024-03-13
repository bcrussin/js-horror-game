class Player {
    constructor(data) {
        this.map = data.map;
        this.x = 0;
        this.y = 0;
    }

    moveHorizontally = (delta) => {
        let offset = delta / Math.abs(delta);
        
        //console.log(this.map.posIsSolid(this.x + delta, this.y))
        if (this.map.posIsSolid(this.x + delta, this.y)) {
            if (delta > 0) {
                this.x = Math.ceil((this.x) / this.map.cellWidth) * this.map.cellWidth - 0.1// - 1
            } else {
                this.x = Math.floor((this.x) / this.map.cellWidth) * this.map.cellWidth// + 1
            }
            // - (delta / Math.abs(delta));
        } else {
            this.x += delta;
        }
    }

    moveVertically = (delta) => {
        if (this.map.posIsSolid(this.x, this.y + delta)) {
            if (delta > 0) {
                this.y = Math.ceil((this.y) / this.map.cellHeight) * this.map.cellHeight - 0.1// - (delta / Math.abs(delta));
            } else {
                this.y = Math.floor((this.y) / this.map.cellHeight) * this.map.cellHeight// - (delta / Math.abs(delta));
            }
        } else {
            this.y += delta;
        }
    }
}