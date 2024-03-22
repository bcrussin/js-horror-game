class Level {
	constructor(options = {}) {
		this.width = 0;
        this.height = 0;
		this.cellWidth = 0;
		this.cellHeight = 0;
        this.tileSize = 16;
		this.data = [];

        this.numRows = null;
        this.numCols = null;
	}

	load = (levelName) => {
		return new Promise((resolve) => {
			fetch("levels/" + levelName + ".json")
				.then((res) => res.json())
				.then((data) => {
					this.data = data;

                    this.width = data[0].length * this.tileSize;
                    this.height = data.length * this.tileSize;

                    this.numRows = data[0].length;
                    this.numCols = data.length;

					resolve(data);
				});
		});
	};

	getFromXY = (x, y) => {
        if (Array.isArray(x)) {
            y = x[1];
            x = x[0];
        }

		if (this.data == undefined || x == undefined || y == undefined || this.data[y] == undefined)
            return null;
		return this.data[y][x];
	};

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