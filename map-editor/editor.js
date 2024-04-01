const tilesetContainer = document.getElementById('tileset');
const tilesetControls = document.getElementById('tile-controls');
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
let selectedAction = null;

const defaultLights = [
    {
        type: 0,
        x: null,
        y: null,
        size: 4
    },
    {
        type: 1,
        x: null,
        y: null
    }
]

let map = {
    width: 10,
    height: 10,
    cellWidth: 0,
    cellHeight: 0,
    zoom: zoom,
    player: {},
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

    tilesetContainer.innerHTML = '';

    for (let i = 0; i < tilesetWidth; i++) {
        for (let j = 0; j < tilesetHeight; j++) {
            let tileImage = document.createElement('canvas');
            tileImage.classList.add('tile', 'zoom');
            tileImage.id = (i * tilesetHeight) + j;
            tileImage.onpointerdown = (e) => selectTile(e.target.id);
            let tileCtx = tileImage.getContext('2d');

            tilesetContainer.appendChild(tileImage);
    
            tileCtx.drawImage(tilesets.walls, i * tileSize, j * tileSize, tileSize, tileSize, 0, 0, tileImage.width, tileImage.height);
            tileCtx.fillStyle = 'white';
            tileCtx.font = '40pt sans-serif';
            tileCtx.fillText(tileImage.id, 5, 145);
        }
    }
}

function getLightingTiles() {
    tilesetContainer.innerHTML = '';

    let point = addTile();

    point.ctx.setTransform(1, 0, 0, 1, 0, 0);
    point.ctx.fillStyle = 'white';
    point.ctx.beginPath();
    point.ctx.ellipse(point.canvas.width / 2, point.canvas.height / 2, point.canvas.width / 2, point.canvas.height / 2, 0, 0, 2 * Math.PI);
    point.ctx.fill();

    let cell = addTile();

    cell.ctx.fillStyle = 'white';
    cell.ctx.fillRect(0, 0, cell.canvas.width, cell.canvas.height);
}

function addTile() {
    let tileImage = document.createElement('canvas');
    tileImage.classList.add('tile');
    tileImage.id = tilesetContainer.childElementCount;
    tileImage.onpointerdown = (e) => selectTile(e.target.id);
    let tileCtx = tileImage.getContext('2d');

    tilesetContainer.appendChild(tileImage);

    return {
        canvas: tileImage,
        ctx: tileCtx
    }
}

function selectTile(id) {
    selectAction(null);
    if (selectedTile != null) {
        // Remove border from previously selected tile
        let oldSelected = document.getElementById(selectedTile);
        if (!!oldSelected) oldSelected.classList.remove('selected');
    }
    if (selectedTile === parseInt(id)) {
        // Deselect tile if clicked again
        selectedTile = null;
    } else {
        // Select tile if not currently selected
        selectedTile = parseInt(id);
        event.target.classList.add('selected');
    }
}

function selectAction(action) {
    let actionElem = document.getElementById('action-' + selectedAction);
    if (!!actionElem) {
        actionElem.classList.remove('selected');
    }

    if (action != undefined) {
        selectTile(null)
        selectedAction = action == selectedAction ? null : action;
        actionElem = document.getElementById('action-' + action);
        if (!!actionElem) {
            actionElem.classList.add('selected');
        }
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
            if (selectedCategory != 'entities') getLightingTiles();
            selectedCategory = 'entities';
            tilesetControls.classList.remove('display-none');
            break;
        case 'background':
        case 'walls':
            if (selectedCategory != 'tiles') getTiles();
            selectedCategory = 'tiles';
            tilesetControls.classList.add('display-none');
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
        // TILES
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
            }
        }

        // LIGHTING
        for (let row = 0; row < map.height; row++) {
            for (let col = 0; col < map.width; col++) {
                value = getEntityFromXY(row, col, 'lights');
                drawLight(value);
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
    console.log(selectedTile)

    if (selectedLayer == 'lights') {
        let lightObj = { ...defaultLights[selectedTile] };
        lightObj.x = x;
        lightObj.y = y;

        map.entities[selectedLayer][y][x] = !!getEntityFromXY(x, y, 'lights') ? null : lightObj;
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

function drawLight(light) {
    if (light == undefined) return;

    switch(light.type) {
        case 0:
            renderer.circle(light.x * map.cellWidth + (map.cellWidth / 2), light.y * map.cellHeight + (map.cellHeight / 2), tileSize * light.size * zoom, {
                color: '#FFA50060',
                border: {
                    color: 'black',
                    weight: 2
                }
            });
            break;
        case 1:
            renderer.rect(light.x * map.cellWidth, light.y * map.cellHeight, map.cellWidth, map.cellHeight, {
                c: '#FFA50060',
                border: {
                    color: 'black',
                    weight: 2
                }
            })
    }
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
        zoom: map.zoom,
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
            map.zoom = data.zoom;

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

function changeZoom() {
    map.zoom = parseInt(prompt("Insert a zoom multiplier to apply to this level"));
}

function changePlayerSize() {
    map.player.width = parseInt(prompt("Insert player width"));
    map.player.height = parseInt(prompt("Insert player height"));
}