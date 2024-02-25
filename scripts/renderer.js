class Renderer {
	constructor(canvas, context) {
		this.canvas = canvas;
		this.ctx = context;
	}

	clear = (c) => {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.clientHeight);
		if (!!c) this.rect(0, 0, this.canvas.width, this.canvas.height, c);
	};

	rect = (x, y, w, h, c) => {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.fillStyle = c;
		this.ctx.fillRect(x, y, w, h);
	};

	line = (x1, y1, x2, y2, c, thickness) => {
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
		this.ctx.moveTo(x, y);
		this.ctx.lineTo(x + len * Math.cos(rot), y + len * Math.sin(rot));
		this.ctx.stroke();
	};

	circle = (x, y, r, c) => {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.fillStyle = c;
		this.ctx.beginPath();
		this.ctx.arc(x, y, r, 0, 2 * Math.PI);
		this.ctx.fill();
	};
}
