const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const maskCanvas = document.getElementById("mask-canvas");
const maskCtx = maskCanvas.getContext("2d");
const lightingCanvas = document.getElementById("lighting-canvas");
const lightingCtx = lightingCanvas.getContext("2d");
const tilesetImage = new Image();
tilesetImage.src = "tilesets/tiles.png";

const renderer = new Renderer(canvas, ctx);
const maskRenderer = new Renderer(maskCanvas, maskCtx);
const lightingRenderer = new Renderer(lightingCanvas, lightingCtx);

const fpsCounter = document.getElementById("fps");

const changelogContent = document.getElementById("changelog-content");
let isChangelogLoaded = false;
const modals = {
	pause: document.getElementById("pause-modal"),
	help: document.getElementById("help-modal"),
	changelog: document.getElementById("changelog-modal"),
	surprise: document.getElementById("surprise-modal")
};

const player = new Player({
	width: 12,
	height: 12,
});
const SPEED = 0.6 * 1.6;
const SPRINT_SPEED = 1 * 1.6;

const LINE_PADDING = 10;
const LINE_MIN_LENGTH = 20;

let isPaused = false;

// TEMP FOR FUN
let TEMP_ALERT_VISITED = false;
let TEMP_HORROR_SOUND = null;
let newZoom = 0;
let isGameOver = false;

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
let maskMode = 0;

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
const DEFAULT_NUM_RAYS = 500;
let NUM_RAYS = DEFAULT_NUM_RAYS;
const FOV = Math.PI * 0.4;

let leftClicked = false;
let rightClicked = false;

let loop;
let lastFrame;
let camera;
let raycaster;

let helpText = document.getElementById("help-text");
helpText.classList.add("centered");
setTimeout(() => {
	helpText.classList.remove("centered");
}, 1500);

tilesetImage.onload = () => {
	Level.load("horror_map").then((data) => {
		camera = new Camera({
			zoom: data?.zoom ?? 2,
		});
		renderer.setCamera(camera);
		maskRenderer.setCamera(camera);
		lightingRenderer.setCamera(camera);
		raycaster = new Raycaster();
		player.x = 32;
		player.y = 32;
		if (!!data.player) {
			player.width = data.player?.width ?? player.width;
			player.height = data.player?.height ?? player.height;
		}

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
	switch (e.key.toString()) {
		case "h":
			toggleModal("help");
			break;
		case "Escape":
		case "p":
			toggleModal("pause");
			break;
		case "_":
			player.x = 230;
			player.y = 75;
			break;
		case "+":
			new Dummy(32, 32);
			break;
		case "/":
			toggleMaskView();
			break;
	}
};

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

function onResize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	maskCanvas.width = canvas.width;
	maskCanvas.height = canvas.height;

	lightingCanvas.width = canvas.width;
	lightingCanvas.height = canvas.height;

	// REMOVE LATER
	camera.resize();
}

function drawMap() {
	Level.cellWidth = 16; //canvas.width / level.width;
	Level.cellHeight = 16; //canvas.height / level.height;

	if (!!Level.tiles) {
		for (let col = 0; col < Level.numCols; col++) {
			for (let row = 0; row < Level.numRows; row++) {
				let value = Level.getFromXY(row, col);
				if (value != undefined) {
					renderer.tile(tilesetImage, value, row, col);
				} else {
					// TEMPORARY - RANDOMLY COLORED FLOOR TILES
					let c;

					if ((row + (col % 2)) % 2 == 0) {
						c = col > Level.numCols / 2 ? "orange" : "blue";
					} else {
						c = col > Level.numCols / 2 ? "purple" : "green";
					}

					renderer.rect(row * Level.tileSize, col * Level.tileSize, Level.tileSize, Level.tileSize, {
						color: c,
					});
				}
			}
		}
	}
}

let droppedFrames = 0;
function frameUpdate(now) {
	if (!isGameOver)
		requestAnimationFrame(frameUpdate);

	window.scrollTo(0, 0)

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

		if (prevFPS.length >= FPS_NUM_AVERAGED) prevFPS.shift();

		prevFPS.push(1000 / delta);
		currFPS = prevFPS.reduce((a, b) => a + b) / prevFPS.length;
		fpsCounter.innerHTML = Math.round(currFPS);

		if (!isPaused) {
			update(delta / (1000 / 60));
			render();
		}
	}
}

function update(delta) {
	let h = -Keys.isPressed("a") + Keys.isPressed("d");
	let v = -Keys.isPressed("w") + Keys.isPressed("s");

	let spd = TEMP_ALERT_VISITED ? 1.4 : Keys.isPressed("shift") ? SPRINT_SPEED : SPEED;

	player.move(h * spd, v * spd, delta);
	if (!TEMP_ALERT_VISITED && player.x > 150 && player.x < 190 && player.y < 70) {
		TEMP_ALERT_VISITED = true;
		newZoom = camera.zoom * 1.16;
		new Dummy(104, 40);
		TEMP_HORROR_SOUND = new Audio("audio/heartbeat.mp3");
		TEMP_HORROR_SOUND.play();
		//showModal('surprise');
	}
	//player.update(delta);

	camera.x -= (camera.x - player.x) * camera.speed;
	camera.y -= (camera.y - player.y) * camera.speed;

	if (TEMP_ALERT_VISITED && newZoom - camera.zoom > 0.01) {
		camera.zoom += (newZoom - camera.zoom) * 0.02;
	} else if (TEMP_ALERT_VISITED) {
		camera.zoom = newZoom;
	}

	Entity.updateAll();

	player.faceMouse(Mouse.getPos(), renderer.canvas, delta);
}

function render() {
	renderer.clear("black");

	// DRAW SCREEN CONTENTS
	ctx.globalCompositeOperation = "source-over";

	// Render tiles and lighting masks onto their respective canvases
	drawMap();
	Entity.drawAll();

	renderer.tile(tilesetImage, 111, player.x, player.y, {
		convertToGrid: false,
		centered: true,
		width: player.width,
		height: player.height
	});

	// Draw lighting mask (flashlight + ambient lighting)
	renderMask();
	ctx.globalCompositeOperation = "destination-in";
	ctx.drawImage(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height, 0, 0, canvas.width, canvas.height);


	// DRAW MASK VISIBLY
	ctx.globalCompositeOperation = "source-over";
	// renderMask(false);
	//ctx.drawImage(maskCanvas, 0, 0);

	ctx.globalCompositeOperation = "destination-over";
	renderer.rect(0, 0, canvas.width, canvas.height, { color: "black" });

	// DRAW OVER EVERYTHING
	ctx.globalCompositeOperation = "source-over";

	// Draw line in direction of flashlight
	// renderer.vector(player.x, player.y, player.dir, Keys.isPressed('shift') ? 20 : 10, {
	// 	color: 'white'
	// });
}

function renderMask(includeTiles = true) {
	if(maskMode > 0) renderer.clear();
	maskRenderer.clear();
	lightingRenderer.clear();

	// TEMPORARY SOLUTION TO HIDE OUT-OF-BOUNDS BACKGROUND

	// Top edge
	renderer.rect(-10000, -10000, 20000, 10000 + 2, {
		c: "black",
	});
	// Left edge
	renderer.rect(-10000, -10000, 10000 + 2, 20000, {
		c: "black",
	});
	// Bottom edge
	renderer.rect(-10000, Level.height, 20000, 20000, {
		c: "black",
	});
	// Right edge
	renderer.rect(Level.width, -10000, 20000, 20000, {
		c: "black",
	});

	maskCtx.filter = "blur(20px)";
	maskRenderer.circle(player.x, player.y, player.width * 4, {
		color: '#ffffffc0',
		centered: true
	})
	maskCtx.filter = "none";

	let rays = [];
	let lighting = {};
	let angle = player.dir - FOV / 2;
	for (let i = 0; i < NUM_RAYS; i++) {
		angle += FOV / NUM_RAYS;
		let ray = raycaster.cast(player.x, player.y, angle, {
			maxDistance: flashlightDistance,
		});
		rays.push(ray);
		if (!!ray.hitCell) {
			if (!!lighting[ray.hitCell.toString()]) lighting[ray.hitCell.toString()] += ray.strength * 0.3;
			else lighting[ray.hitCell.toString()] = ray.strength * 0.4;
		}
	}

	maskCtx.filter = "blur(5px)";
	maskCtx.fillStyle = includeTiles ? "#ffffffa0" : "#FBC02D60";
	maskCtx.beginPath();
	maskCtx.moveTo(renderer.toScreenX(player.x), renderer.toScreenY(player.y));
	rays.forEach((ray) => {
		maskCtx.lineTo(renderer.toScreenX(ray.hit[0]), renderer.toScreenY(ray.hit[1]));
		//let thickness = Math.min(Math.max(400 - NUM_RAYS, 1) / 50, 6);
		//maskRenderer.line(player.x, player.y, ray.hit[0], ray.hit[1], '#ffffff10', Math.round(thickness))
	});
	maskCtx.lineTo(renderer.toScreenX(player.x), renderer.toScreenY(player.y));
	maskCtx.closePath();
	maskCtx.fill();
	maskCtx.filter = "none";

	if (!includeTiles) return;

	// Light cells depending on raycast and proximity
	if (!!Level.tiles) {
		for (let col = 0; col < Level.numCols; col++) {
			for (let row = 0; row < Level.numRows; row++) {
				let value = Level.getWallFromXY(row, col);
				if (value != undefined) {
					let dist = Math.hypot(row * Level.tileSize - player.x, col * Level.tileSize - player.y) * 3;

					dist = 255 - Math.min(dist, 255);
					dist += lighting[[row, col].toString()] ?? 0;
					if (dist == undefined) continue;
					let val = Math.min(dist, 255);
					val = parseInt(val).toString(16).padStart(2, "0");

					maskRenderer.rect(row * Level.tileSize, col * Level.tileSize, Level.tileSize, Level.tileSize, { c: "#ffffff" + val });
				}

				// Draw a light if there is one
				let lightValue = Level.getLightFromXY(row, col);
				if (lightValue != undefined) {
					renderLight(lightValue, lightValue.x, lightValue.y);
				}
			}
		}
	}

	// Always show player
	maskRenderer.tile(tilesetImage, 111, player.x, player.y, {
		opacity: 0.4,
		convertToGrid: false,
		centered: true,
		width: player.width,
		height: player.height
	});

	// Disable lighting, show everything
	// maskRenderer.rect(0, 0, canvas.width, canvas.height, {
	// 	color: 'white',
	// 	screenSpace: true
	// })

	// Draw all ambient lights with one call to minimize lag from blur
	maskCtx.filter = 'blur(20px)'
	maskCtx.drawImage(lightingCanvas, 0, 0, lightingCanvas.width, lightingCanvas.height, 0, 0, maskCanvas.width, maskCanvas.height);
	maskCtx.filter = 'none';
}

function renderLight(light, row, col) {
	switch(light.type) {
		case 0:
			// Point light
			lightingRenderer.circle(row * Level.tileSize, col * Level.tileSize, light.size * Level.tileSize, {
				color: 'white',
				offset: true
			})
			break;
		case 1:
			// Tile light
			lightingRenderer.rect(row * Level.tileSize, col * Level.tileSize, Level.tileSize, Level.tileSize, {
				color: 'white',
			})
			break;
	}
}

// UNUSED FLASHLIGHT FLICKER CODE
let NUM_FLICKERS = 4;
let flickerInterval = 10000;
let flickerNum = 0;
function flickerLight() {
	if (flickerNum < NUM_FLICKERS) {
		flashlightDistance = flashlightDistance == 0 ? 150 : 0;
		flickerInterval = Math.random() * 30 + 20;
		flickerNum++;
	} else {
		flashlightDistance = 150;
		flickerInterval = Math.random() * 10000 + 5000;
		flickerNum = 0;
		NUM_FLICKERS = parseInt(Math.random() * 3 + 2);
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

function changeNumRays() {
	let num = prompt(
		"INSERT NUMBER OF RAYS TO CAST\n(Warning: Experimental)\n\nLower = better performance,\n Higher = smoother flashlight, brighter overall\n\nCurrent: " +
			NUM_RAYS +
			"\nDefault: " +
			DEFAULT_NUM_RAYS
	);
	if (num != undefined && num !== "") NUM_RAYS = num;
	hideHelpModal();
}

// MODAL FUNCTIONS

function showModal(name) {
	if (modals[name] == undefined) return;

	hideAllModals();
	modals[name].classList.add("show");
	isPaused = true;

	if (name === "changelog") loadChangelogModal();
}

function hideModal(name) {
	if (modals[name] == undefined) return;

	modals[name].classList.remove("show");

	if (name === "pause" || name == "surprise") isPaused = false;
	else if (isPaused) showModal("pause");
}

function toggleModal(name) {
	if (modals[name].classList.contains("show")) {
		hideModal(name);
	} else {
		showModal(name);
	}
}

function hideAllModals() {
	Object.values(modals).forEach((modal) => {
		modal.classList.remove("show");
	});

	isPaused = false;
}

function loadChangelogModal() {
	if (isChangelogLoaded) return;

	loadChangelog('', true).then(changelog => {
		changelogContent.innerHTML = changelog
	});
}

// DEBUG VIEWS

function toggleMaskView() {
	canvas.style.display = 'none';
	maskCanvas.style.visibility = 'hidden';

	maskMode = (maskMode + 1) % 2;

	switch(maskMode) {
		case 0:
			canvas.style.display = 'block';
			canvas.style.visibility = 'visible';
			break;
		case 1:
			//maskCanvas.style.display = 'block';
			maskCanvas.style.visibility = 'visible';
			break;
	}
}

function gameOver() {
	if (!!isGameOver) return;

	isGameOver = true;
	TEMP_HORROR_SOUND.pause();
	TEMP_HORROR_SOUND = new Audio("audio/horror.mp3");
	TEMP_HORROR_SOUND.play();
	canvas.style.display = 'none';
	document.getElementById('horror').style.display = 'block';

	setTimeout(() => {
		document.getElementById('horror').style.opacity = '0';
	}, 3000)
}