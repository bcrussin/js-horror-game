const tilesetContainer = document.getElementById('tileset');
const tilesetImage = new Image();
const mapContainer = document.getElementById('map-container');
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');
const renderer = new Renderer(canvas, ctx, {
    screenSpace: true
});

let tileSize = 16;
let tilesetWidth;
let tilesetHeight;
let zoom = 4;

let map = {
    width: 10,
    height: 10,
    cellWidth: 0,
    cellHeight: 0,
    data: []
}

let isPanning = false;
let isDrawing = false;
let placedTile = null;

let selectedTileset = 0;
let selectedTile = null;

let mapData;

window.onload = function() {
    initMap();
}

tilesetImage.onload = function() {
    getTiles();
}
tilesetImage.src = "../tilesets/tiles.png"

function getTiles() {
    tilesetWidth = Math.floor(tilesetImage.width / tileSize);
    tilesetHeight = Math.floor(tilesetImage.height / tileSize);

    for (let i = 0; i < tilesetWidth; i++) {
        for (let j = 0; j < tilesetHeight; j++) {
            let tileImage = document.createElement('canvas');
            tileImage.classList.add('tile');
            tileImage.id = (i * tilesetHeight) + j;
            tileImage.onpointerdown = (e) => selectTile(e);
            let tileCtx = tileImage.getContext('2d');

            tilesetContainer.appendChild(tileImage);
    
            tileCtx.drawImage(tilesetImage, i * tileSize, j * tileSize, tileSize, tileSize, 0, 0, tileImage.width, tileImage.height);
            tileCtx.fillStyle = 'white';
            tileCtx.font = '40pt sans-serif';
            tileCtx.fillText(tileImage.id, 5, 145);
        }
    }
}

function selectTile(event) {
    if (selectedTile != null) {
        // Remove border from previously selected tile
        let oldSelected = document.getElementById(selectedTile);
        oldSelected.classList.remove('selected');
    }
    if (selectedTile === parseInt(event.target.id)) {
        // Deselect tile if clicked again
        selectedTile = null;
    } else {
        // Select tile if not currently selected
        selectedTile = parseInt(event.target.id);
        event.target.classList.add('selected');
    }
}

function initMap () {
    renderer.clear();
    map.data = Array.from({length: map.height}, e => Array(map.width).fill(null));

    mapContainer.oncontextmenu = (e) => {
        e.preventDefault();
    }

    mapContainer.onpointerdown = (e) => {
        if (e.button === 2 || e.shiftKey) {
            isPanning = true;
        } else {
            isDrawing = true;
            xy = eventToXY(e)
            placedTile = getCellFromXY(xy[0], xy[1]) === selectedTile ? null : selectedTile;
            placeTile(e);
        }
    }

    mapContainer.onpointerup = (e) => {
        isPanning = false;
        isDrawing = false;
    }

    mapContainer.onkeyup = (e) => {
        if (!e.shiftKey) {
            isPanning = false;
        }
    }

    mapContainer.onmouseout = (e) => {
        isPanning = false;
        placedTile = null;
    }

    mapContainer.onpointermove = (e) => {
        if (isPanning) {
            mapContainer.scrollLeft -= e.movementX;
            mapContainer.scrollTop -= e.movementY;
        } else if (isDrawing) {
            let xy = eventToXY(e);
            if (getCellFromXY(xy[0], xy[1]) !== placedTile) placeTile(e);
        }
    }

    updateMap();
}

function updateMap() {
    canvas.width = tileSize * zoom * map.width;
    canvas.height = tileSize * zoom * map.height;
    canvas.style.width = (tileSize * zoom * map.width) + 'px';
    canvas.style.height = (tileSize * zoom * map.height) + 'px';

    map.cellWidth = canvas.width / map.width;
    map.cellHeight = canvas.height / map.height;

    renderer.clear();
    let cellSize = tileSize * zoom;

    if (!!map.data) {
        //console.log(map.data)
        for (let col = 0; col < map.height; col++) {
            for (let row = 0; row < map.width; row++) {
                let value = getCellFromXY(row, col);
                if (value != undefined) {
                    drawTile(value, row, col);
                }
            }
        }
    }

    for (let i = 0; i <= map.width; i++) {
        renderer.line(i * cellSize, 0, i * cellSize, canvas.height, '#ffffff80', 1);
    }
    for (let i = 0; i <= map.height; i++) {
        renderer.line(0, i * cellSize, canvas.width, i * cellSize, '#ffffff80', 1);
    }
}

function changeWidth(e) {
    map.width = prompt("Enter map width:");
    initMap();
}

function changeHeight(e) {
    map.height = prompt("Enter map Height:");
    initMap();
}

function placeTile(e) {
    let xy = eventToXY(e);
    let x = xy[0];
    let y = xy[1];
    
    map.data[y][x] = getCellFromXY(x, y) === placedTile ? null : placedTile;
    //console.log(map.data)
    updateMap();
}

function drawTile(id, x, y) {
    let sx = Math.floor(id / tilesetHeight);
    let sy = id % tilesetHeight;
    ctx.drawImage(
        tilesetImage, 
        sx * tileSize, 
        sy * tileSize, 
        tileSize, 
        tileSize, 
        x * map.cellWidth, y * map.cellHeight, 
        map.cellWidth, 
        map.cellHeight
    );
}

function getCellFromXY(x, y) {
    if (map.data == undefined) return null;
    return map.data[y][x];
}

function eventToXY(e) {
    let rect = e.target.getBoundingClientRect();
    return [
        Math.floor((e.clientX - rect.left) / map.cellWidth),
        Math.floor((e.clientY - rect.top) / map.cellHeight)
    ];
}

function xyToPos(x, y) {
    return (y * map.height) + x;
}

function posToXY(pos) {
    return [Math.floor(pos / map.height), pos % map.height];
}

function zoomOut() {
    zoom--;
    updateMap();
}

function zoomIn() {
    zoom++;
    updateMap();
}

function saveMap() {
    let data = new Blob([JSON.stringify(map.data)], {type: 'text/json'});
    let elem = document.createElement('a');
    elem.setAttribute('href', window.URL.createObjectURL(data));
    elem.setAttribute('download', 'map.json');
    elem.click();
    elem.remove();
}

function loadMap() {
    let elem = document.createElement('input');
    elem.type = 'file';
    elem.accept = 'application/JSON';

    elem.addEventListener('change', (e) => {
        let fr = new FileReader();
        fr.onload = function(e) { 
          map.data = JSON.parse(e.target.result);
          updateMap();
        }
      
        fr.readAsText(e.target.files[0]);
    })

    elem.click();
}