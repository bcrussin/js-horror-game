class Renderer {
	constructor(canvas, context, options = {}) {
		this.canvas = canvas;
		this.ctx = context;
		this.screenSpace = options.screenSpace ?? false;
	}

	setCanvasAndContext = (canvas, context) => {
		this.canvas = canvas;
		this.ctx = context;
	}

	setCamera = (camera) => {
		this.camera = camera;
		//this.canvas.width = Level.width;
		//this.canvas.height = this.camera.height;
	};

	toScreenXY = (x, y) => {
		if (!this.camera) return null;
		let normalized = this.camera.toCameraXY(x, y);
		return [normalized[0] * this.canvas.width, normalized[1] * this.canvas.height];
	};

	toScreenX = (x) => {
		if (!this.camera) return null;
		return Math.floor(this.camera.toCameraX(x) * this.canvas.width);
	};

	toScreenY = (y) => {
		if (!this.camera) return null;
		return Math.floor(this.camera.toCameraY(y) * this.canvas.height);
	};

	toScreenW = (w) => {
		if (!this.camera) return null;
		return Math.ceil(this.camera.toCameraW(w) * this.canvas.width);
	};

	toScreenH = (h) => {
		if (!this.camera) return null;
		return Math.ceil(this.camera.toCameraH(h) * this.canvas.height);
	};

	toScreenLX = (l, rot) => {
		if (!this.camera) return null;
		return this.camera.toCameraLX(l, rot) * this.canvas.width;
	};

	toScreenLY = (l, rot) => {
		if (!this.camera) return null;
		return this.camera.toCameraLY(l, rot) * this.canvas.height;
	};

	clear = (c) => {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.clientHeight);
		if (!!c) this.rect(0, 0, this.canvas.width, this.canvas.height, { color: c, screenSpace: true });
	};

	rect = (x, y, w, h, options = {}) => {
		if (!this.isScreenSpace(options.screenSpace)) {
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

		if (options.hasBorder) {
			this.ctx.strokeStyle = options.border.color;
			this.ctx.lineWidth = options.border.weight;
			this.ctx.stroke();
		}
	};

	line = (x1, y1, x2, y2, c, thickness, options = {}) => {
		if (!this.isScreenSpace(options.screenSpace)) {
			x1 = this.toScreenX(x1);
			x2 = this.toScreenX(x2);
			y1 = this.toScreenY(y1);
			y2 = this.toScreenY(y2);
		}

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

	circle = (x, y, r, options = {}) => {
		options = this.parseOptions(options);

		let rx = r / 2;
		let ry = r / 2;

		if (!!options.offset) {
			x += rx / 4;
			y += ry / 4;
		}

		if (!this.isScreenSpace(options.screenSpace)) {
			x = this.toScreenX(x);
			y = this.toScreenY(y);
			rx = this.toScreenW(rx);
			ry = this.toScreenW(ry);
		}
		
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.fillStyle = options.color;
		this.ctx.beginPath();
		this.ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
		this.ctx.fill();

		if (options.hasBorder) {
			this.ctx.strokeStyle = options.border.color;
			this.ctx.lineWidth = options.border.weight;
			this.ctx.stroke();
		}
	};

	text = (string, x, y, options = {}) => {
		if (!this.isScreenSpace(options.screenSpace)) {
			x = this.toScreenX(x);
			y = this.toScreenY(y);
		}

		let fontSize = options.fontSize ?? 12;
		let fontStyle = options.fontStyle ?? "serif";

		this.ctx.font = `${fontSize}px ${fontStyle}`;
		this.ctx.fillStyle = options.color ?? "white";
		this.ctx.fillText(string, x, y);
	};

	getTileWidth = () => {
		return Math.ceil((this.canvas.width / this.camera.width) * Level.tileSize) + 2; //this.camera.getTileWidth();
	};

	getTileHeight = () => {
		return Math.ceil((this.canvas.height / this.camera.height) * Level.tileSize) + 2; //this.camera.getTileHeight();
	};

	tile(image, id, x, y, options = {}) {
		options = this.parseOptions(options);

		let tileSize = Level.tileSize;

		let cellWidth = this.camera.getTileWidth();
		let cellHeight = this.camera.getTileHeight();

		let sizeModifier = 1;
		if (!!(options.convertToGrid ?? true)) {
			sizeModifier *= tileSize;
		}

		let tileWidth = options.width ? this.toScreenW(options.width) : this.getTileWidth();
		let tileHeight = options.height ? this.toScreenH(options.height) : this.getTileHeight();

		let tilesetHeight = Math.floor(image.height / tileSize);
		let sx = Math.floor(id / tilesetHeight);
		let sy = id % tilesetHeight;



		x *= sizeModifier;
		y *= sizeModifier;
		if (!options.isScreenSpace) {
			x = this.toScreenX(x);
			y = this.toScreenY(y);
		}
		if (!!options.centered) {
			x -= tileWidth / 2;
			y -= tileHeight / 2;
		}

		this.ctx.drawImage(
			image,
			sx * tileSize,
			sy * tileSize,
			tileSize,
			tileSize,
			x,
			y,
			tileWidth,
			tileHeight
		);

		this.cleanup();
	}

	parseOptions = (options = {}) => {
		let opacity = options.opacity ?? 1;
		this.ctx.globalAlpha = opacity;

		let isScreenSpace = this.isScreenSpace(options.screenSpace);

		options.hasBorder = false;
		if (!!options.border) {
			options.hasBorder = true;
			options.border = {
				weight: options.border.weight ?? 1,
				color: options.border.color ?? 'white'
			}
		}

		let output = options;
		output.opacity = opacity;
		output.isScreenSpace = isScreenSpace;
		output.color = options.color ?? options.c ?? 'white';

		return output;
	}

	cleanup = () => {
		this.ctx.globalAlpha = 1;
	}

	isScreenSpace = (option) => {
		if (option != undefined) return !!option;

		return this.screenSpace ?? true;
	}
}