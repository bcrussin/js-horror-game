const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const maskCanvas = document.getElementById("mask-canvas");
const maskCtx = maskCanvas.getContext("2d");
const tilesetImage = new Image();
tilesetImage.src = "tilesets/tiles.png";

const renderer = new Renderer(canvas, ctx);
const maskRenderer = new Renderer(maskCanvas, maskCtx);

let map = new Level();
const player = new Player({
	map: map
});
const SPEED = 0.6;
const SPRINT_SPEED = 1;

const LINE_PADDING = 10;
const LINE_MIN_LENGTH = 20;

const FPS = 60;
const FPS_INTERVAL = 1000 / FPS;
const FPS_TOLERANCE = 1;
let currFPS;
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
let NUM_RAYS = 200;
const FOV = Math.PI * 0.6;

let leftClicked = false;
let rightClicked = false;

let loop;
let lastFrame;
let camera;
let raycaster;

let helpModal = document.getElementById('help-modal');
let helpText = document.getElementById('help-text');
helpText.classList.add('centered');
setTimeout(() => {
	helpText.classList.remove('centered');
}, 1500);

tilesetImage.onload = () => {
	console.log(map);
	map.load("chamber").then((data) => {
		map.data = data;
		camera = new Camera(map);
		renderer.setCamera(camera);
		maskRenderer.setCamera(camera);
		raycaster = new Raycaster(map);
		player.x = 82;
		player.y = 76;

		onResize();

		lastFrame = window.performance.now();
		frameUpdate();
		/*loop = setInterval(() => {

			window.requestAnimationFrame(update);
		}, 1000 / FPS);*/
	});
};

addEventListener("resize", () => {
	onResize();
});

window.onkeydown = (e) => {
	Keys.press(e.key);
	switch (e.key) {
		case "ArrowLeft":
			camera.changeZoom(-0.1);
			break;
		case "ArrowRight":
			camera.changeZoom(0.1);
			break;
		case "ArrowUp":
			camera.setZoom(2);
			break;
		case "ArrowDown":
			camera.setZoom(1);
			break;
	}
};

window.onkeyup = (e) => {
	Keys.release(e.key);
	if (e.key == 'h') {
		if (helpModal.classList.contains('show')) {
			helpModal.classList.remove('show');
		} else {
			helpModal.classList.add('show');
		}
	}
}

window.onmousemove = (e) => {
	e.preventDefault();
	Mouse.update(e);
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

function hideHelpModal() {
	helpModal.classList.remove('show');
}

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

	if (!!map.data) {
		//console.log(map.data)
		for (let col = 0; col < map.numCols; col++) {
			for (let row = 0; row < map.numRows; row++) {
				let value = map.getFromXY(row, col);
				if (value != undefined) {
					renderer.tile(tilesetImage, value, row, col);
				} else {
					// TEMPORARY - RANDOMLY COLORED FLOOR TILES
					let c;

					if ((row + (col % 2)) % 2 == 0) {
						c = col > (map.numCols / 2) ? 'orange' : 'blue';
					} else {
						c = col > (map.numCols / 2) ? 'purple' : 'green';
					}
					
					renderer.rect(row * map.tileSize, col * map.tileSize, map.tileSize, map.tileSize, {
						color: c
					})
				}
			}
		}
	}
}

let droppedFrames = 0;
function frameUpdate(now) {
	requestAnimationFrame(frameUpdate);
	
	let delta = now - lastFrame;

	if (delta > FPS_INTERVAL * 1.5) {
		droppedFrames++;

		if (droppedFrames > 30) {
			droppedFrames = 0;
			NUM_RAYS = Math.round(NUM_RAYS * 0.5);
		}
		// console.log("FRAME DROPPED")
		// console.log(droppedFrames, NUM_RAYS)
	}

	if (delta >= FPS_INTERVAL - FPS_TOLERANCE) {
		lastFrame = now;
		currFPS = 1000 / delta//Math.round(1000 / (l / ++frameCount) * 100) / 100;
		//console.log(currFPS);
		update(delta / (1000 / 60));
	} else {
		/*droppedFrames++;

		if (droppedFrames > 100) {
			droppedFrames = 0;
			NUM_RAYS = Math.round(NUM_RAYS * 0.8);
		}
		console.log(droppedFrames, NUM_RAYS)*/
	}
}

let pm;
function update(delta) {
	let h = -Keys.isPressed("a") + Keys.isPressed("d");
	let v = -Keys.isPressed("w") + Keys.isPressed("s");

	let spd = Keys.isPressed('shift') ? SPRINT_SPEED : SPEED;
	//spd *= delta;

	pm = player.move(h * spd, v * spd, delta);
	// player.moveHorizontally(h * spd, raycaster, 1);
	// player.moveVertically(v * spd, raycaster, 1);

	//player.update(delta);

	camera.x -= (camera.x - player.x) * camera.speed;
	camera.y -= (camera.y - player.y) * camera.speed;

	player.faceMouse(Mouse.getPos(), renderer.canvas, delta);
	
	render();
}

function render() {
	renderer.clear("black");


	// DRAW SCREEN CONTENTS
	ctx.globalCompositeOperation = "source-over";

	drawMap();
	renderMask();

	renderer.rect(player.x, player.y, 4, 4, {
		color: "blue",
		centered: true
	});

	// Draw layer mask for objects
	ctx.globalCompositeOperation = "destination-in";
	
	ctx.drawImage(maskCanvas, 0, 0);
	ctx.filter = "none";

	// DRAW MASK VISIBLY
	ctx.globalCompositeOperation = "source-over";

	ctx.filter = "blur(5px)";
	renderMask();
	ctx.filter = "none";

	ctx.globalCompositeOperation = "destination-over";
	renderer.rect(0, 0, canvas.width, canvas.height, {color: "black"});

	// DRAW OVER EVERYTHING
	ctx.globalCompositeOperation = "source-over";
	
	renderer.vector(player.x, player.y, player.dir, Keys.isPressed('shift') ? 20 : 10, {
		color: 'white'
	});
}

function renderMask() {
	maskRenderer.clear();

	// TEMPORARY SOLUTION TO WHITE OUT-OF-BOUNDS BACKGROUND

	// Top edge
	renderer.rect(-10000, -10000, 20000, 10000 + 2, {
		c: 'black'
	})
	// Left edge
	renderer.rect(-10000, -10000, 10000 + 2, 20000, {
		c: 'black'
	})
	// Bottom edge
	renderer.rect(-10000, map.height, 20000, 20000, {
		c: 'black'
	})
	// Right edge
	renderer.rect(map.width, -10000, 20000, 20000, {
		c: 'black'
	})

	if (!!map.data) {
		//console.log(map.data)
		for (let col = 0; col < map.numCols; col++) {
			for (let row = 0; row < map.numRows; row++) {
				let value = map.getFromXY(row, col);
				if (value != undefined) {
					let dist = Math.hypot((row * map.tileSize) - player.x, (col * map.tileSize) - player.y) / 0.5;
					let val = 255 - Math.min(dist, 255);
					val = parseInt(val).toString(16).padStart(2, '0');
					
					maskRenderer.rect(row * map.tileSize, col * map.tileSize, map.tileSize, map.tileSize, {c: '#ffffff' + val});
				}
			}
		}
	}

	let rays = [];
	let angle = player.dir - (FOV / 2);
	for (let i = 0; i < NUM_RAYS; i++) {
		angle += FOV / NUM_RAYS;
		rays.push(raycaster.cast(player.x, player.y, angle, {
			maxDistance: 150
		}));
	}

	rays.forEach(ray => {
		maskRenderer.line(player.x, player.y, ray.hit[0], ray.hit[1], '#ffffff10', 3)
	})

	// maskRenderer.rect(0, 0, canvas.width, canvas.height, {
	// 	color: 'white',
	// 	screenSpace: true
	// })
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