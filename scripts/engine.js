const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const maskCanvas = document.getElementById("mask-canvas");
const maskCtx = maskCanvas.getContext("2d");
const tilesetImage = new Image();
tilesetImage.src = "tilesets/tiles.png";

const renderer = new Renderer(canvas, ctx);
const maskRenderer = new Renderer(maskCanvas, maskCtx);

const fpsCounter = document.getElementById("fps");

let map = new Level();
const player = new Player({
	map: map,
	width: 12,
	height: 12
});
const SPEED = 0.6 * 1.6;
const SPRINT_SPEED = 1 * 1.6;

const LINE_PADDING = 10;
const LINE_MIN_LENGTH = 20;

let FPS = 60;
let FPS_INTERVAL = 1000 / FPS;

function setFPS(fps) {
	FPS = fps;
	FPS_INTERVAL = 1000 / FPS;
}

const FPS_TOLERANCE = 5;
const FPS_NUM_AVERAGED = 10;
let currFPS;
let prevFPS = [];
const GLOBAL_LIGHTING = "10";

let pointQueue = [];
let flashlightDistance = 150;

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
	map.load("large_map").then((data) => {
		map.data = data;
		camera = new Camera({
			level: map,
			zoom: 2
		});
		renderer.setCamera(camera);
		maskRenderer.setCamera(camera);
		raycaster = new Raycaster(map);
		player.x = 32;
		player.y = 32;

		onResize();

		lastFrame = window.performance.now();
		frameUpdate();
		//flickerLight();
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
			setFPS(FPS - 5);
		}
	}


	if (delta >= FPS_INTERVAL - FPS_TOLERANCE) {
		lastFrame = now;

		if (prevFPS.length >= FPS_NUM_AVERAGED)
			prevFPS.shift();
		
		prevFPS.push(1000 / delta);
		currFPS = prevFPS.reduce((a, b) => a + b) / prevFPS.length;
		fpsCounter.innerHTML = Math.round(currFPS);

		update(delta / (1000 / 60));
		render();
	}
}

function update(delta) {
	let h = -Keys.isPressed("a") + Keys.isPressed("d");
	let v = -Keys.isPressed("w") + Keys.isPressed("s");

	let spd = Keys.isPressed('shift') ? SPRINT_SPEED : SPEED;

	player.move(h * spd, v * spd, delta);
	//player.update(delta);

	camera.x -= (camera.x - player.x) * camera.speed;
	camera.y -= (camera.y - player.y) * camera.speed;

	player.faceMouse(Mouse.getPos(), renderer.canvas, delta);
}

function render() {
	renderer.clear("black");


	// DRAW SCREEN CONTENTS
	ctx.globalCompositeOperation = "source-over";

	drawMap();

	renderer.rect(player.x, player.y, player.width, player.height, {
		color: "#222222",
		centered: true
	});
	renderMask();

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
	
	// Draw line in direction of flashlight
	// renderer.vector(player.x, player.y, player.dir, Keys.isPressed('shift') ? 20 : 10, {
	// 	color: 'white'
	// });
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

	let rays = [];
	let lighting = {};
	let angle = player.dir - (FOV / 2);
	for (let i = 0; i < NUM_RAYS; i++) {
		angle += FOV / NUM_RAYS;
		let ray = raycaster.cast(player.x, player.y, angle, {
			maxDistance: flashlightDistance
		});
		rays.push(ray);
		if(!!ray.hitCell) {
			if (!!lighting[ray.hitCell.toString()])
				lighting[ray.hitCell.toString()] += ray.strength * 0.3;
			else
				lighting[ray.hitCell.toString()] = ray.strength * 0.4;
		}
	}

	rays.forEach(ray => {
		maskRenderer.line(player.x, player.y, ray.hit[0], ray.hit[1], '#ffffff10', 4)
	})

	// Light cells depending on raycast and proximity
	if (!!map.data) {
		//console.log(map.data)
		for (let col = 0; col < map.numCols; col++) {
			for (let row = 0; row < map.numRows; row++) {
				let value = map.getFromXY(row, col);
				if (value != undefined) {
					let dist = Math.hypot((row * map.tileSize) - player.x, (col * map.tileSize) - player.y) * 3;

					dist = 255 - Math.min(dist, 255)
					dist += lighting[[row, col].toString()] ?? 0;
					if(dist == undefined) continue;
					let val = Math.min(dist, 255);
					val = parseInt(val).toString(16).padStart(2, '0');
					
					maskRenderer.rect(row * map.tileSize, col * map.tileSize, map.tileSize, map.tileSize, {c: '#ffffff' + val});
				}
			}
		}
	}

	// Always show player
	maskRenderer.rect(player.x, player.y, player.width, player.height, {
		color: '#ffffff80',
		centered: true
	})

	// Disable lighting, show everything
	// maskRenderer.rect(0, 0, canvas.width, canvas.height, {
	// 	color: 'white',
	// 	screenSpace: true
	// })
}

let NUM_FLICKERS = 4;
let flickerInterval = 10000;
let flickerNum = 0;
function flickerLight() {
	if (flickerNum < NUM_FLICKERS) {
		flashlightDistance = flashlightDistance == 0 ? 150 : 0;
		flickerInterval = (Math.random() * 30) + 20;
		flickerNum++;
	} else {
		flashlightDistance = 150;
		flickerInterval = (Math.random() * 10000) + 5000;
		flickerNum = 0;
		NUM_FLICKERS = parseInt((Math.random() * 3) + 2)
	}

	setTimeout(flickerLight, flickerInterval);
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