const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const maskCanvas = document.getElementById("mask-canvas");
const maskCtx = maskCanvas.getContext("2d");
const tilesetImage = new Image();
tilesetImage.src = "../tilesets/tiles.png";

const renderer = new Renderer(canvas, ctx);
const maskRenderer = new Renderer(maskCanvas, maskCtx);

let map = new Level();
const player = new Player({
	map: map
});
const SPEED = 0.8;

const LINE_PADDING = 10;
const LINE_MIN_LENGTH = 20;

const FPS = 60;
const GLOBAL_LIGHTING = "10";

let pointQueue = [];

let rects = [];
const NUM_RECTS = 4;
for (let i = 0; i < NUM_RECTS; i++) {
	let r = {
		x: (Math.random() * canvas.width) / 2 + canvas.width / 4,
		y: (Math.random() * canvas.height) / 2,
		w: Math.max((Math.random() * canvas.width) / 3 + 15, 100),
		h: Math.max((Math.random() * canvas.height) / 3 + 15, 100),
		c: "red",
	};
	rects.push(r);
}

let rays = [];
/*const NUM_RAYS = 100;
for (let i = 0; i < NUM_RAYS; i++) {
	let ray = {};
	ray.rot = (i * (2 * Math.PI)) / NUM_RAYS;
	ray.len = Math.random() * 50 + 75;
	rays.push(ray);
}*/
const NUM_RAYS = 80;
const START_ANGLE = -0.2 * Math.PI; //Math.random() * 2 * Math.PI;
const FOV = 0.4 * Math.PI;
for (let i = 0; i < NUM_RAYS; i++) {
	let ray = {};
	ray.rot = START_ANGLE + (i * FOV) / NUM_RAYS;
	//ray.len = Math.random() * 20 + 400;
	ray.len = 500;
	rays.push(ray);
}

let mouseX = 0;
let mouseY = 0;
let leftClicked = false;
let rightClicked = false;

let loop;
let camera;

tilesetImage.onload = () => {
	console.log(map);
	map.load("chamber").then((data) => {
		map.data = data;
		camera = new Camera(map);
		renderer.setCamera(camera);
		player.x = camera.width / 2;
		player.y = camera.height / 2;

		onResize();
		loop = setInterval(() => {
			if (leftClicked || rightClicked) {
				for (let ray of rays) {
					let d = ((2 * Math.PI) / 180) * 2;
					ray.rot += d * (rightClicked ? -1 : 1);
					ray.rot = ray.rot % (2 * Math.PI);
				}
			}

			window.requestAnimationFrame(update);
		}, 1000 / FPS);
	});
};

addEventListener("resize", () => {
	onResize();
});

window.onkeydown = (e) => {
	switch (e.key) {
		case "w":
			Key.press("w");
			break;
		case "a":
			Key.press("a");
			break;
		case "s":
			Key.press("s");
			break;
		case "d":
			Key.press("d");
			break;
		case "ArrowLeft":
			//camera.setZoom(camera.zoom - 0.1);
			camera.x--;
			break;
		case "ArrowRight":
			//camera.setZoom(camera.zoom + 0.1);
			camera.x++;
			break;
		case "ArrowUp":
			//camera.setZoom(2);
			camera.y++;
			break;
		case "ArrowDown":
			//camera.setZoom(1);
			camera.y--;
			break;
	}
};

window.onkeyup = (e) => {
	switch(e.key) {
		case "w":
			Key.release("w");
			break;
		case "a":
			Key.release("a");
			break;
		case "s":
			Key.release("s");
			break;
		case "d":
			Key.release("d");
			break;
	}
}

window.onmousemove = (e) => {
	e.preventDefault();
	mouseX = e.clientX;
	mouseY = e.clientY;
	mouseDown = e.mouseDown;
};

window.onmousedown = (e) => {
	e.preventDefault();
	switch (e.button) {
		case 0:
			leftClicked = true;
			break;
		case 2:
			rightClicked = true;
			break;
	}
};

window.onmouseup = (e) => {
	e.preventDefault();
	switch (e.button) {
		case 0:
			leftClicked = false;
			break;
		case 2:
			rightClicked = false;
			break;
	}
};

window.oncontextmenu = (e) => {
	e.preventDefault();
};

function onResize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	maskCanvas.width = canvas.width;
	maskCanvas.height = canvas.height;

	// REMOVE LATER
	camera.setLevel(camera.level);
}

function drawMap() {
	map.cellWidth = 16; //canvas.width / map.width;
	map.cellHeight = 16; //canvas.height / map.height;
	let zoom = 1;

	let cellSize = 16 * zoom;

	if (!!map.data) {
		//console.log(map.data)
		for (let col = 0; col < map.numCols; col++) {
			for (let row = 0; row < map.numRows; row++) {
				let value = map.getCellFromXY(row, col);
				if (value != undefined) {
					renderer.drawTile(tilesetImage, value, row, col);
				}
			}
		}
	}
}

function update() {
	let h = -Key.isPressed("a") + Key.isPressed("d");
	let v = -Key.isPressed("w") + Key.isPressed("s");

	player.moveHorizontally(h * SPEED);
	player.moveVertically(v * SPEED);

	camera.setCenter(Math.floor(player.x), Math.floor(player.y));
	//console.log(Math.floor(player.x), Math.floor(player.y))
	render();
}

function render() {
	renderer.clear("black");
	ctx.globalCompositeOperation = "source-over";

	for (let rect of rects) {
		renderer.rect(rect.x, rect.y, rect.w, rect.h, rect.c);
	}
	//renderer.circle(e.clientX, e.clientY, 100, "#ffffff10");

	// Draw layer mask for objects

	pointQueue = [];
	ctx.globalCompositeOperation = "destination-in";
	//ctx.filter = "blur(10px)";
	renderMask();
	ctx.drawImage(maskCanvas, 0, 0);
	ctx.filter = "none";

	ctx.globalCompositeOperation = "source-over";

	ctx.filter = "blur(5px)";
	/*for (let ray of rays) {
		let line = vectorToLine(e.clientX, e.clientY, ray.rot, ray.len);
		let length = lineIntersectsAnyRect(line.x1, line.y1, line.x2, line.y2);
		renderer.vector(e.clientX, e.clientY, ray.rot, length ?? ray.len, {
			gradientStart: "#ffffff40",
			gradientStop: length == null ? "transparent" : "#ffffff20",
		});
	}*/
	//renderMask(false);
	ctx.drawImage(maskCanvas, 0, 0);
	ctx.filter = "none";

	ctx.globalCompositeOperation = "destination-over";
	renderer.rect(0, 0, canvas.width, canvas.height, "black");

	// DRAW OVER EVERYTHING
	ctx.globalCompositeOperation = "source-over";
	for (let point of pointQueue) {
		//renderer.circle(point[0], point[1], 5, point[2]);
	}

	drawMap();

	renderer.rect(player.x, player.y, 8, 8, "blue");
}

function renderMask(isMask = true) {
	maskRenderer.clear();
	if (isMask) maskRenderer.rect(0, 0, canvas.width, canvas.height, `#ffffff${GLOBAL_LIGHTING}`);
	maskRenderer.circle(mouseX, mouseY, 30, "#ff888840");
	for (ray of rays) {
		let line = vectorToLine(mouseX, mouseY, ray.rot, ray.len);
		let length = lineIntersectsAnyRect(line.x1, line.y1, line.x2, line.y2);
		maskRenderer.vector(mouseX, mouseY, ray.rot, length ?? ray.len, {
			gradientStart: isMask ? "#ffffff20" : "#ffffff20",
			gradientStop: "transparent",
			thickness: 4,
		});
	}
}

function vectorToLine(x, y, rot, len) {
	let line = {
		x1: x,
		y1: y,
		x2: x + len * Math.cos(rot),
		y2: y + len * Math.sin(rot),
	};

	return line;
}

function lineIntersectsAnyRect(x1, y1, x2, y2) {
	let minDist;
	for (let object of rects) {
		let dist = checkLineIntersect(x1, y1, x2, y2, object.x, object.y, object.w, object.h);
		if (dist != null && (minDist == null || dist < minDist)) minDist = dist;
	}

	return minDist;
}

function checkLineIntersect(lineX1, lineY1, lineX2, lineY2, rectX, rectY, rectW, rectH) {
	let line = {
		x1: lineX1,
		y1: lineY1,
		x2: lineX2,
		y2: lineY2,
	};

	let rect = {
		x1: rectX,
		y1: rectY,
		x2: rectX + rectW,
		y2: rectY + rectH,
	};

	let slope = (line.y2 - line.y1) / (line.x2 - line.x1);

	// Completely outside.
	if (
		(line.x1 <= rect.x1 && line.x2 <= rect.x1) ||
		(line.y1 <= rect.y1 && line.y2 <= rect.y1) ||
		(line.x1 >= rect.x2 && line.x2 >= rect.x2) ||
		(line.y1 >= rect.y2 && line.y2 >= rect.y2)
	) {
		return null;
	}
	pointQueue.push([line.x2, line.y2, "white"]);

	let minDist = null;

	let y = slope * (rect.x1 - line.x1) + line.y1;
	if (y > rect.y1 && y < rect.y2) {
		let len = getLineLength(line.x1, line.y1, rect.x1, y);
		pointQueue.push([rect.x1, y, "blue"]);
		if (minDist == null) {
			minDist = len;
		}
	}

	y = slope * (rect.x2 - line.x1) + line.y1;
	if (y > rect.y1 && y < rect.y2) {
		let len = getLineLength(line.x1, line.y1, rect.x2, y);
		pointQueue.push([rect.x2, y, "red"]);
		if (minDist == null || len < minDist) {
			minDist = len;
		}
	}

	let x = (rect.y1 - line.y1) / slope + line.x1; //slope * (rect.y1 - line.y1) + line.x1; //
	if (x > rect.x1 && x < rect.x2) {
		let len = getLineLength(line.x1, line.y1, x, rect.y1);
		pointQueue.push([x, rect.y1, "pink"]);
		if (minDist == null || len < minDist) {
			minDist = len;
		}
	}

	x = (rect.y2 - line.y1) / slope + line.x1; //slope * (rect.y2 - line.y1) + line.x1; //
	if (x > rect.x1 && x < rect.x2) {
		let len = getLineLength(line.x1, line.y1, x, rect.y2);
		if (minDist == null || len < minDist) {
			minDist = len;
			pointQueue.push([x, rect.y2, "limegreen"]);
		}
	}

	return minDist;
}

function getLineLength(x1, y1, x2, y2) {
	return Math.hypot(x2 - x1, y2 - y1);
}
