const tilesetContainer = document.getElementById('tileset');
const layerSelector = document.getElementById('layer-select');
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

let selectedLayer = layerSelector.value;
let selectedCategory = 'tiles';

let map = {
    width: 10,
    height: 10,
    cellWidth: 0,
    cellHeight: 0,
    tiles: {
        walls: [],
        background: [],
    },
    entities: {
        lights: []
    }
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

const tilesets = {
    walls: new Image(),
    background: new Image()
}

tilesets.walls.onload = function() {
    getTiles();
}

Object.values(tilesets).forEach(tileset => {
    tileset.src = '../tilesets/tiles.png';
})

function getTiles() {
    tilesetWidth = Math.floor(tilesets.walls.width / tileSize);
    tilesetHeight = Math.floor(tilesets.walls.height / tileSize);

    for (let i = 0; i < tilesetWidth; i++) {
        for (let j = 0; j < tilesetHeight; j++) {
            let tileImage = document.createElement('canvas');
            tileImage.classList.add('tile');
            tileImage.id = (i * tilesetHeight) + j;
            tileImage.onpointerdown = (e) => selectTile(e);
            let tileCtx = tileImage.getContext('2d');

            tilesetContainer.appendChild(tileImage);
    
            tileCtx.drawImage(tilesets.walls, i * tileSize, j * tileSize, tileSize, tileSize, 0, 0, tileImage.width, tileImage.height);
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

    Object.keys(map.tiles).forEach(layer => {
        map.tiles[layer] = Array.from({length: map.height}, e => Array(map.width).fill(null));
    });
    Object.keys(map.entities).forEach(layer => {
        map.entities[layer] = Array.from({length: map.height}, e => Array(map.width).fill(null));
    });

    mapContainer.oncontextmenu = (e) => {
        e.preventDefault();
    }

    mapContainer.onpointerdown = (e) => {
        if (e.button === 2 || e.shiftKey) {
            isPanning = true;
        } else {
            isDrawing = true;
            xy = eventToXY(e)
            if (selectedLayer == 'lights')
                placedTile = getCellFromXY(xy[0], xy[1]) == undefined ? 1 : null;
            else
                placedTile = getCellFromXY(xy[0], xy[1]) === selectedTile ? null : selectedTile;

            placeSelected(e);
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
            if (getCellFromXY(xy[0], xy[1]) !== placedTile && selectedCategory === 'tiles') placeTile(e);
        }
    }

    updateMap();
}

function changeLayer(layer) {
    switch(layer) {
        case 'lights':
            selectedCategory = 'entities';
            break;
        case 'background':
        case 'walls':
            selectedCategory = 'tiles';
            break;
    }

    selectedLayer = layer;
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

    if (map.tiles == undefined) return;
    
    if (!!map.tiles.walls) {
        //console.log(map.tiles)
        for (let row = 0; row < map.height; row++) {
            for (let col = 0; col < map.width; col++) {
                let value = getCellFromXY(row, col, 'background');
                if (value != undefined) {
                    drawTile(value, row, col, 'background');
                }

                value = getCellFromXY(row, col, 'walls');
                if (value != undefined) {
                    drawTile(value, row, col, 'walls');
                }

                value = getEntityFromXY(row, col, 'lights');
                if (value != undefined) {
                    renderer.circle(row * map.cellWidth + (map.cellWidth / 2), col * map.cellHeight + (map.cellHeight / 2), tileSize, '#FFA50060');
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
    map.width = parseInt(prompt("Enter map width:"));
    initMap();
}

function changeHeight(e) {
    map.height = parseInt(prompt("Enter map Height:"));
    initMap();
}

function placeSelected(e) {
    if (selectedCategory === 'tiles')
        placeTile(e);
    else if (selectedCategory === 'entities')
        placeEntitity(e);
}

function placeTile(e) {
    let xy = eventToXY(e);
    let x = xy[0];
    let y = xy[1];

    map.tiles[selectedLayer][y][x] = getCellFromXY(x, y) === placedTile ? null : placedTile;
    //console.log(map.tiles)
    updateMap();
}

function placeEntitity(e) {
    let xy = eventToXY(e);
    let x = xy[0];
    let y = xy[1];

    if (selectedLayer == 'lights') {
        map.entities[selectedLayer][y][x] = !!getEntityFromXY(x, y, 'lights') ? null : {
            x: x,
            y: y,
            radius: 12
        };
    }

    console.log(getEntityFromXY(x, y, 'lights'))

    updateMap();
}

function drawTile(id, x, y, layer = selectedLayer) {
    let sx = Math.floor(id / tilesetHeight);
    let sy = id % tilesetHeight;
    
    let isOpaque = selectedLayer == 'lights' || layer == selectedLayer;

    ctx.globalAlpha = isOpaque ? 1 : 0.4;
    ctx.drawImage(
        tilesets.walls, 
        sx * tileSize, 
        sy * tileSize, 
        tileSize, 
        tileSize, 
        x * map.cellWidth, y * map.cellHeight, 
        map.cellWidth, 
        map.cellHeight
    );
    ctx.globalAlpha = 1;
}

function getCellFromXY(x, y, layer = selectedLayer) {
    if (map.tiles[layer] == undefined) return null;
    if (y >= map.tiles[layer].length || x >= map.tiles[layer][0].length) return null;

    return map.tiles[layer][y][x];
}

function getEntityFromXY(x, y, layer) {
    if (map.entities[layer] == undefined) return null;
    if (y >= map.tiles['walls'].length || x >= map.tiles['walls'][0].length) return null;

    return map.entities[layer][y][x];
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
    let output = {
        width: map.width,
        height: map.height,
        tiles: map.tiles,
        entities: {}
    }

    let lights = {};
    for (let row of map.entities.lights) {
        for (let light of row) {
            if (light == undefined)
                continue;

            let key = light.x + ',' + light.y;
            lights[key] = light;
        }
    }
    output.entities.lights = lights;

    let data = new Blob([JSON.stringify(output)], {type: 'text/json'});
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
            let data = JSON.parse(e.target.result);
            map.width = data.width;
            map.height = data.height;
            map.tiles = data.tiles;

            let lightsArray = Array.from({length: map.height}, e => Array(map.width).fill(null));
            try {
                Object.values(data.entities.lights).forEach(light => {
                    lightsArray[light.y][light.x] = light;
                });
            }
            catch {
                
            }
            map.entities.lights = lightsArray;

            updateMap();
        }
      
        fr.readAsText(e.target.files[0]);
    })

    elem.click();
}