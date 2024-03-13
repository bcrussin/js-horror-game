class Camera {
    constructor(level) {
        this.x = 0;
        this.y = 0;
        this.width = 160;
        this.height = 160;
        this._zoom = 1;
        this.setLevel(level);
    }

    get zoom() {
        return this._zoom;
    }

    set zoom(value) {
        this._zoom = value;
        this.width = this.level.width * value;
        this.height = this.level.height * value;
    }

    setZoom = (value) => {
        this.zoom = value;
    }

    setLevel = (level) => {
        if (!level) return;
        
        this.level = level;
        let aspect;
        let size = this.level.width * 2;
        this.zoom = this.level.width / window.innerWidth * 10;
        let wider = (window.innerWidth / window.innerHeight) >= 1;

        if (wider) {
            aspect =  window.innerWidth / window.innerHeight;
            this.width = level.height * aspect;
            this.height = level.height / 1;
        } else {
            aspect = window.innerHeight / window.innerWidth;
            this.width = level.width / 1;
            this.height = level.width * aspect;
        }
    }

    getTileWidth = () => {
        //console.log((this.level.width / this.width) * this.level.tileSize)
        return (this.level.width / this.width) * this.level.tileSize;
    }

    getTileHeight = () => {
        return (this.level.height / this.height) * this.level.tileSize;
    }

    toCameraXY = (x, y) => {
        return [this.toCameraX(x), this.toCameraY(y)];
    }

    toCameraX = (x) => {
        //console.log(x, this.width, (x / this.width) - this.x)
        return (x / this.width) - this.x;
    }

    toCameraY = (y) => {
        return (y / this.height) - this.y;
    }
}