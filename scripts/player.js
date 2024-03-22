class Player {
	constructor(data) {
		this.map = data.map;
		this.x = 0;
		this.y = 0;
		this.width = data.width ?? 0;
		this.height = data.height ?? 0;
		this.xVel = 0;
		this.yVel = 0;
		this.dir = 0;
	}

	move = (dx, dy, delta) => {
		dx *= delta;
		dy *= delta;

		let halfWidth = this.width / 2;
		let halfHeight = this.height / 2;

		let dirX = Math.sign(dx);
		let dirY = Math.sign(dy);

		let isGoingLeft = dirX < 0;
		let isGoingUp = dirY < 0;

        // Cell positions of left and right player bounds
		let cellLeft = this.map.posToX(this.x - halfWidth);
		let cellRight = this.map.posToX(this.x + halfWidth);

        // Cell positions of top and bottom player bounds
		let cellTop = this.map.posToY(this.y - halfHeight);
		let cellBottom = this.map.posToY(this.y + halfHeight);

        // Make list of all cells hit by player's horizontal bound
		let cellStartY = [];
		let cellEndY = [];
		let iPrev = null;
		for (let i = cellLeft; i < cellRight + 1; i++) {
			if (iPrev == undefined || iPrev !== i) {
				cellStartY.push([i, this.map.posToY(this.y + halfHeight * dirY)]);
				cellEndY.push([i, this.map.posToY(this.y + dy + halfHeight * dirY)]);
			}
			iPrev = i;
		}

        // Make list of all cells hit by player's vertical bound
		let cellStartX = [];
		let cellEndX = [];
		iPrev = null;
		for (let i = cellTop; i < cellBottom + 1; i++) {
			if (iPrev == undefined || iPrev !== i) {
				cellStartX.push([this.map.posToX(this.x + halfWidth * dirX), i]);
				cellEndX.push([this.map.posToX(this.x + dx + halfWidth * dirX), i]);
			}
			iPrev = i;
		}


		// Calculate the number of cells traveled on horizontal axis, then check each one in the direction of movement
		let collidedX = null;
		let collidedY = null;

		for (let cell = 0; cell < cellStartX.length; cell++) {
			let currStart = cellStartX[cell];
			let currEnd = cellEndX[cell];

			for (let i = 0; i <= Math.abs(currEnd[0] - currStart[0]); i++) {
				let currCell = currStart[0] + i * dirX;
				if (this.map.getFromXY(currCell, currStart[1]) != undefined) {
					if (collidedX == undefined || collidedX.distance < i) {
						collidedX = {
							distance: i,
							cell: currCell,
						};
					}
					break;
				}
			}
		}

		// Calculate the number of cells traveled on vertical axis, then check each one in the direction of movement
		for (let cell = 0; cell < cellStartY.length; cell++) {
			let currStart = cellStartY[cell];
			let currEnd = cellEndY[cell];

			for (let i = 0; i <= Math.abs(currEnd[1] - currStart[1]); i++) {
				let currCell = currStart[1] + i * dirY;
				if (this.map.getFromXY(currStart[0], currCell) != undefined) {
					if (collidedY == undefined || collidedY.distance < i) {
						collidedY = {
							distance: i,
							cell: currCell,
						};
					}
					break;
				}
			}
		}

        // Update x and y positions
		if (!!collidedX) {
			let cellX = isGoingLeft ? collidedX.cell + 1 : collidedX.cell;
			this.x = cellX * this.map.tileSize - (isGoingLeft ? 0 : 0.01) - halfWidth * dirX;
		} else {
			this.x += dx;
		}

		if (!!collidedY) {
			let cellY = isGoingUp ? collidedY.cell + 1 : collidedY.cell;
			this.y = cellY * this.map.tileSize - (isGoingUp ? 0 : 0.01) - halfHeight * dirY;
		} else {
			this.y += dy;
		}
	};

	faceMouse = (pos, canvas, delta = 1) => {
		let target = Math.atan2(pos[1] - canvas.height / 2, pos[0] - canvas.width / 2);

		if (target == undefined || isNaN(target)) return;

		if (this.dir - target >= Math.PI && target < this.dir) target += Math.PI * 2;

		if (target - this.dir >= Math.PI) target -= Math.PI * 2;

		this.dir += (target - this.dir) * Math.min(delta * 0.3, 1);
		this.dir = this.dir % (Math.PI * 2);
	};

	update = (delta) => {
		this.x += this.xVel * delta;
		this.y += this.yVel * delta;
	};
}
