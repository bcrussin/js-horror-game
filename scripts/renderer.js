class Renderer {
	constructor(canvas, context) {
		this.canvas = canvas;
		this.ctx = context;
	}

	setCamera = (camera) => {
		this.camera = camera;
		//this.canvas.width = this.camera.level.width;
		//this.canvas.height = this.camera.height;
	}

	toScreenXY = (x, y) => {
		if (!this.camera) return null;
		let normalized = this.camera.toCameraXY(x, y);
		return [
			normalized[0] * this.canvas.width,
			normalized[1] * this.canvas.height
		];
	}

	toScreenX = (x) => {
		if (!this.camera) return null;
		return this.camera.toCameraX(x) * this.canvas.width;
	}

	toScreenY = (y) => {
		if (!this.camera) return null;
		return this.camera.toCameraY(y) * this.canvas.height;
	}

	toScreenW = (w) => {
		if (!this.camera) return null;
		return this.camera.toCameraW(w) * this.canvas.width;
	}

	toScreenH = (h) => {
		if (!this.camera) return null;
		return this.camera.toCameraH(h) * this.canvas.height;
	}

	toScreenLX = (l, rot) => {
		if (!this.camera) return null;
		return this.camera.toCameraLX(l, rot) * this.canvas.width;
	}

	toScreenLY = (l, rot) => {
		if (!this.camera) return null;
		return this.camera.toCameraLY(l, rot) * this.canvas.height;
	}

	clear = (c) => {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.clientHeight);
		if (!!c) this.rect(0, 0, this.canvas.width, this.canvas.height, { color: c, screenSpace: true });
	};

	rect = (x, y, w, h, options = {}) => {
		if (!options.screenSpace ?? true) {
			x = this.toScreenX(x);
			y = this.toScreenY(y);
			w = this.toScreenW(w);
			h = this.toScreenH(h);
		}

		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.fillStyle = options.color ?? options.c;
		if (!!options.centered) {
			x -= w / 2;
			y -= h / 2;
		}
		this.ctx.fillRect(x, y, w, h);
	};

	line = (x1, y1, x2, y2, c, thickness) => {
		x1 = this.toScreenX(x1);
		x2 = this.toScreenX(x2);
		y1 = this.toScreenY(y1);
		y2 = this.toScreenY(y2);

		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.strokeStyle = c;
		this.ctx.lineWidth = thickness;
		this.ctx.beginPath();
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
		this.ctx.stroke();
	};

	vector = (x, y, rot, len, options = {}) => {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		if (options.gradientPercent == null) options.gradientPercent = 1;

		if (!!options.gradientStart && !!options.gradientStop) {
			let gradient = ctx.createLinearGradient(x, y, x + len * Math.cos(rot), y + len * Math.sin(rot));
			gradient.addColorStop(0, options.gradientStart);
			//gradient.addColorStop(0.6, options.gradientStart);
			gradient.addColorStop(options.gradientPercent, options.gradientStart);
			gradient.addColorStop(options.gradientPercent, options.gradientStop);
			this.ctx.strokeStyle = gradient;
		} else {
			this.ctx.strokeStyle = options.color;
		}

		this.ctx.lineWidth = options.thickness;
		this.ctx.beginPath();
		x = this.toScreenX(x);
		y = this.toScreenY(y);
		this.ctx.moveTo(x, y);
		this.ctx.lineTo(x + this.toScreenLX(len, rot), y + this.toScreenLY(len, rot));
		this.ctx.stroke();
	};

	circle = (x, y, r, c) => {
		x = this.toScreenX(x);
		y = this.toScreenY(y);

		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.fillStyle = c;
		this.ctx.beginPath();
		this.ctx.arc(x, y, r, 0, 2 * Math.PI);
		this.ctx.fill();
	};

	getTileWidth = () => {
		//console.log(this.canvas.width, this.camera.width, this.canvas.width / this.camera.width, (this.canvas.width / this.camera.width) * this.camera.getTileWidth())
		return (this.canvas.width / this.camera.width) * this.camera.level.tileSize//this.camera.getTileWidth();
	}

	getTileHeight= () => {
		return (this.canvas.height / this.camera.height) * this.camera.level.tileSize//this.camera.getTileHeight();
	}
	
	tile(image, id, x, y) {
		this.rect(this.toScreenX(this.camera.width) - 5, this.toScreenY(this.camera.height) - 5, 10, 10, 'green')
		//console.log(this.toScreenX(this.camera.width - 1), this.toScreenY(this.camera.height - 1), this.canvas.width)
		let tileSize = this.camera.level.tileSize;

		let cellWidth = this.camera.getTileWidth();
		let cellHeight = this.camera.getTileHeight();

		let tileWidth = this.getTileWidth();
		//console.log(cellWidth)
		let tileHeight = this.getTileHeight();

		let tilesetWidth = Math.floor(image.width / tileSize);
		let tilesetHeight = Math.floor(image.height / tileSize);
		let sx = Math.floor(id / tilesetHeight);
		let sy = id % tilesetHeight;
		
		this.ctx.drawImage(
			image, 
			sx * tileSize, 
			sy * tileSize, 
			tileSize, 
			tileSize, 
			this.toScreenX(x * tileSize), this.toScreenY(y * tileSize), 
			tileWidth, 
			tileHeight
		);
	}
}
