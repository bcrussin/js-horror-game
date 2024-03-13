class Level {
	constructor() {
		this.width = 0;
        this.height = 0;
        this.numRows = 10;
        this.numCols = 10;
		this.cellWidth = 0;
		this.cellHeight = 0;
        this.tileSize = 16;
		this.data = [];
	}

	load = (levelName) => {
		return new Promise((resolve) => {
			fetch("../levels/" + levelName + ".json")
				.then((res) => res.json())
				.then((data) => {
					this.data = data;
                    this.width = this.numCols * this.tileSize;
                    this.height = this.numRows * this.tileSize;
					resolve(data);
				});
		});
	};

	getCellFromXY = (x, y) => {
		if (this.data == undefined) return null;
		return this.data[y][x];
	};

	xyToPos = (x, y) => {
		return y * this.numRows + x;
	};

	posToXY = (pos) => {
		return [Math.floor(pos / this.numCols), pos % this.numRows];
	};

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
}
