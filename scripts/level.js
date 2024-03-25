class Level {
	constructor(options = {}) {
		this.width = 0;
        this.height = 0;
		this.cellWidth = 0;
		this.cellHeight = 0;
        this.tileSize = 16;
		this.tiles = [];

        this.numRows = null;
        this.numCols = null;
	}

	load = (levelName) => {
		return new Promise((resolve) => {
			fetch("levels/" + levelName + ".json")
				.then((res) => res.json())
				.then((data) => {
                    console.log(data)
					this.tiles = data.tiles;

                    this.numRows = data.height ?? data.tiles.walls[0].length;
                    this.numCols = data.width ?? data.tiles.walls.length;

                    this.width = this.numCols * this.tileSize;
                    this.height = this.numRows * this.tileSize;


					resolve(data);
				});
		});
	};

	getFromXY = (x, y, layer) => {
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

    getWallFromXY = (x, y) => {
        return this.getFromXY(x, y, 'walls');
    }

	xyToPos = (x, y) => {
		return [x * this.tileSize, y * this.tileSize];
	};

	cellToXY = (cell) => {
		return [Math.floor(cell / this.numCols), cell % this.numRows];
	};

    posToXY = (x, y) => {
        if (Array.isArray(x)) {
            y = x[1];
            x = x[0];
        }

        return [Math.floor(x / this.cellWidth), Math.floor(y / this.cellHeight)]
    }

    posToX = (x) => {
        return Math.floor(x / this.cellWidth);
    }

    posToY = (y) => {
        return Math.floor(y / this.cellHeight);
    }

    normalizeXY = (x, y) => {
        return [
            this.normalizeX(x),
            this.normalizeY(y)
        ]
    }

    normalizeX = (x) => {
        return x / this.width;
    }

    normalizeY = (y) => {
        return y / this.height;
    }

    posIsSolid = (x, y) => {
        return !!this.getFromXY(this.posToXY(x, y));
    }
}
