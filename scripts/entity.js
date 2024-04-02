class Entity {
	static entities = [];

	constructor() {
		this.x = 0;
		this.y = 0;

		Entity.entities.push(this);
		console.log(Entity.entities);
	}

	static updateAll = () => {
		this.entities.forEach((entity) => {
			entity.update();
		});
	};

	static drawAll = () => {
		this.entities.forEach((entity) => {
			entity.draw();
		});
	};

	update = () => {};
}

class Dummy extends Entity {
    MOVE_THRESHOLD = Level.tileSize * 6;
	THRESHOLD = Level.tileSize / 4;
    counter = 0;
    speedCounter = 0;
	SPEED = 0.4;

	constructor(x, y) {
		console.log(1);
		super();

		this.x = x ?? 0;
		this.y = y ?? 0;

        this.speedCounter = 100;

		console.log(Level.tilesGraph.grid);

		this.setPath(player.x, player.y);
	}

	setPath = (targetX, targetY) => {
		let start = Level.tilesGraph.grid[Level.posToX(this.x)][Level.posToY(this.y)];
		let end = Level.tilesGraph.grid[Level.posToX(targetX)][Level.posToY(targetY)];
		this.path = astar.search(Level.tilesGraph, start, end);

        if (this.path == undefined || this.path.length == 0) {
            return;
        }

		this.path = this.path.reverse();
		this.currTile = this.path.pop();

		this.endTarget = {
			x: player.x,
			y: player.y,
		};

		this.target = {
			x: (this.currTile.x * Level.tileSize) + Level.tileSize / 2,
			y: (this.currTile.y * Level.tileSize) + Level.tileSize / 2,
		};
	};

	update = () => {
        if (Math.hypot(player.y - this.y, player.x - this.x) < Level.tileSize / 2) {
            gameOver();
        }

		if (this.target == undefined) {
            this.setPath(player.x, player.y);
		}

		if (Math.hypot(this.target.y - this.y, this.target.x - this.x) < this.THRESHOLD) {
			if (this.currTile == undefined) {
				this.target = null;
				return;
			}

			/*this.currTile = this.path.pop();
			if (!!this.currTile) {
				this.target = {
					x: (this.currTile.x * Level.tileSize) + Level.tileSize / 2,
					y: (this.currTile.y * Level.tileSize) + Level.tileSize / 2,
				};
			} else {
				this.target = {
					x: this.endTarget.x,
					y: this.endTarget.y,
				};
			}*/

            this.setPath(player.x, player.y)
		}

		this.x += Math.sign(this.target.x - this.x) * this.SPEED;
		this.y += Math.sign(this.target.y - this.y) * this.SPEED;

        this.counter--;
        if(this.counter < 1) {
            this.setPath(player.x, player.y);
        }
        this.speedCounter--;
        if(this.speedCounter < 1) {
            this.SPEED = Math.min(this.SPEED * 1.55, 4);
            this.speedCounter = 300;
            console.log(this.SPEED)
        }
	};

	draw = () => {
		// renderer.rect(this.x, this.y, 6, 6, {
		// 	color: "pink",
		// 	centered: true,
		// });
        renderer.tile(tilesetImage, 59, this.x, this.y, {
            width: player.width + 4 + (Math.random() * 8 - 4),
            height: player.height + 4 + (Math.random() * 8 - 4),
            convertToGrid: false,
            centered: true
        })

		if (true || this.target == undefined) return;

		renderer.rect(this.target.x, this.target.y, 2, 2, {
			color: "green",
			centered: true,
		});

		this.path.forEach((tile) => {
			renderer.rect(tile.x * Level.tileSize, tile.y * Level.tileSize, 2, 2, {
				color: "red",
				centered: true,
			});
		});

		if (this.path.length == 0) return;

		renderer.rect(this.endTarget.x, this.endTarget.y, 2, 2, {
			color: "blue",
			centered: true,
		});
	};
}
