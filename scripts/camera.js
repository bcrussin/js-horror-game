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
    }

    setZoom = (zoom) => {
        this.zoom = zoom;
        this.width = this.level.width * zoom;
        this.height = this.level.height * zoom;
    }

    setLevel = (level) => {
        if (!level) return;
        
        this.level = level;
        let aspect = window.innerWidth / window.innerHeight;
        this.width = 300 * aspect//level.width;
        this.height = 300//level.height;
        console.log(this.width)
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