class Camera {
    constructor(options) {
        this.x = 0;
        this.y = 0;
        this.width = 160;
        this.height = 160;
        this._zoom = options.zoom ?? 1;
        this.speed = 0.2;
        if(options.level != undefined) this.setLevel(options.level);
    }

    get zoom() {
        return this._zoom;
    }

    set zoom(value) {
        this._zoom = value;
        this.resize();
    }

    setZoom = (value) => {
        this.zoom = value;
    }

    changeZoom = (delta) => {
        this.zoom += delta;
    }

    setLevel = (level) => {
        if (!level) return;
        
        this.level = level;
        this.resize();
    }

    resize = () => {
        if (this.level == undefined) return;

        let multiplier = this.zoom;
        let aspect;
        
        let wider = (window.innerWidth / window.innerHeight) >= 1;

        if (wider) {
            aspect =  window.innerWidth / window.innerHeight;
            this.width = (this.level.height / multiplier) * aspect;
            this.height = this.level.height / multiplier;
        } else {
            aspect = window.innerHeight / window.innerWidth;
            this.width = this.level.width / multiplier;
            this.height = (this.level.width / multiplier) * aspect;
        }
    }

    getTileWidth = () => {
        return (this.level.width / this.width) * this.level.tileSize;
    }

    getTileHeight = () => {
        return (this.level.height / this.height) * this.level.tileSize;
    }

    toCameraXY = (x, y) => {
        return [this.toCameraX(x), this.toCameraY(y)];
    }

    toCameraX = (x) => {
        return ((x - this.x + (this.width / 2)) / this.width);
    }

    toCameraY = (y) => {
        return ((y - this.y + (this.height / 2)) / this.height);
    }

    toCameraW = (w) => {
        return (w / this.width);
    }

    toCameraH = (h) => {
        return (h / this.height);
    }

    toCameraLX = (l, rot) => {
        return (l * Math.cos(rot)) / this.width;
    }

    toCameraLY = (l, rot) => {
        return (l * Math.sin(rot)) / this.height;
    }

    normalizeX = (x) => {
        return x / this.width;
    }

    normalizeY = (y) => {
        return y / this.height;
    }
}