class Level {
    static width = 0;
    static height = 0;
    static cellWidth = 0;
    static cellHeight = 0;
    static tileSize = 16;

    static tiles = [];
    static lights = [];

    static numRows = null;
    static numCols = null;

	constructor(options = {}) {
		this.width = 0;
        this.height = 0;
		this.cellWidth = 0;
		this.cellHeight = 0;
        this.tileSize = 16;
		this.tiles = [];
        this.lights = {};

        this.numRows = null;
        this.numCols = null;
	}

	static load = (levelName) => {
		return new Promise((resolve) => {
			fetch("levels/" + levelName + ".json")
				.then((res) => res.json())
				.then((data) => {
                    console.log(data)
					this.tiles = data.tiles;

                    let walls = this.tiles.walls;
                    
                    let graphArray = Object.keys(walls[0]).map(function(c) {
                        return walls.map(function(r) { return !!r[c] ? 0 : 1; });
                    });

                    this.tilesGraph = new Graph(graphArray, {
                        diagonal: false
                    });
                    console.log(this.tilesGraph)
                    this.entities = data.entities;

                    this.numRows = data.height ?? data.tiles.walls[0].length;
                    this.numCols = data.width ?? data.tiles.walls.length;

                    this.width = this.numCols * this.tileSize;
                    this.height = this.numRows * this.tileSize;


					resolve(data);
				});
		});
	};

	static getFromXY = (x, y, layer) => {
        if (Array.isArray(x)) {
            y = x[1];
            x = x[0];
        }

		if (this.tiles == undefined || x == undefined || y == undefined)
            return null;
		
        if (x < 0 || x >= this.numCols || y < 0 || y >= this.numRows)
            return null;
        
        if (layer != undefined)
            return this.tiles[layer][y][x];

        return this.tiles.walls[y][x] ?? this.tiles.background[y][x];
	};

    static getWallFromXY = (x, y) => {
        return this.getFromXY(x, y, 'walls');
    }

    static getLightFromXY = (x, y) => {
        if (Array.isArray(x)) {
            y = x[1];
            x = x[0];
        }

		if (this.tiles == undefined || x == undefined || y == undefined)
            return null;
		
        if (x < 0 || x >= this.numCols || y < 0 || y >= this.numRows)
            return null;
        
        let key = x + ',' + y;
        return this.entities.lights[key];
    }

	static xyToPos = (x, y) => {
		return [x * this.tileSize, y * this.tileSize];
	};

	static cellToXY = (cell) => {
		return [Math.floor(cell / this.numCols), cell % this.numRows];
	};

    static posToXY = (x, y) => {
        if (Array.isArray(x)) {
            y = x[1];
            x = x[0];
        }

        return [Math.floor(x / this.cellWidth), Math.floor(y / this.cellHeight)]
    }

    static posToX = (x) => {
        return Math.floor(x / this.cellWidth);
    }

    static posToY = (y) => {
        return Math.floor(y / this.cellHeight);
    }

    static normalizeXY = (x, y) => {
        return [
            this.normalizeX(x),
            this.normalizeY(y)
        ]
    }

    static normalizeX = (x) => {
        return x / this.width;
    }

    static normalizeY = (y) => {
        return y / this.height;
    }

    static posIsSolid = (x, y) => {
        return !!this.getFromXY(this.posToXY(x, y));
    }
}
