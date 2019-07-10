var canvas, ctx;
var bgCanvas, bgCtx;
var newRoomCanvas, newRoomCtx;
var keys=[keyboard(87),keyboard(83),keyboard(65),keyboard(68)];
var m = mouse();
var camera;
var floor;
var roomPos = {"x":0,"y":0};
var roomTransition = {"dx":0,"dy":0,"active":false,"newRoomOpacity":0,"fadedRoom":"new"};
var normalGameLogic = true;

const ASPECT_RATIO = ROOM_WIDTH/ROOM_HEIGHT;

const DEBUG_SHOW_HITBOX = false;

var image = {};

const fontLoc = "abcdefghijklmnopqrstuvwxyz0123456789.,!?;:-'() ";

var player;
var entities = [];

var menu;

function loadJSON(filename,callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', filename, true);
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
          }
    };
    xobj.send(null);
 }

function loadImage(filename, callback) {
    let img = document.createElement("img");
    img.onload = function() {callback(img)}
    img.src = filename;
}

function startImageLoad(name) {
    if (!image[name]) loadImage(`img/${name}.png`,function(img) {image[name] = img});
}

function loadFiles(loads, callback) {
    var result = [];
    var toLoad = loads.length;
    loads.forEach(function(load,i) {
        switch (load.type) {
            case "json":
                loadJSON(load.filename,function(res) {
                    result[i] = res;
                    if (--toLoad <= 0) {
                        callback(result);
                    }
                });
                break;
            case "img":
                loadImage(load.filename,function(res) {
                    result[i] = res;
                    if (--toLoad <= 0) {
                        callback(result);
                    }
                });
                break;
            default:
                console.log(`Load of file ${load.filename} failed: no type`);
                toLoad--;
                break;
        }
    });
}

function init() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    
    bgCanvas = document.createElement("canvas");
    bgCanvas.width = ROOM_PIXEL_WIDTH;
    bgCanvas.height = ROOM_PIXEL_HEIGHT;
    bgCtx = bgCanvas.getContext("2d");
    bgCtx.imageSmoothingEnabled = false;
    
    newRoomCanvas = document.createElement("canvas");
    newRoomCanvas.width = ROOM_PIXEL_WIDTH;
    newRoomCanvas.height = ROOM_PIXEL_HEIGHT;
    newRoomCtx = newRoomCanvas.getContext("2d");
    newRoomCtx.imageSmoothingEnabled = false;
    
    startImageLoad("font");
    setupNewGame();
    
    generateFloor(0,initFloorAndStartGame);
}

function setupNewGame() {
    menu = null;
    camera = new RoomCenterCamera();
    entities = [];
    player = new Player(HALF_ROOM_PIXEL_WIDTH,HALF_ROOM_PIXEL_HEIGHT);
    entities.push(player);
}

function initFloor() {
    floor[roomPos.x][roomPos.y].load(bgCtx);
}

function initFloorAndStartGame() {
    initFloor();
    updateAndRender();
}

function checkRoomTransition() {
    if (player.isTangible() && !player.hitboxIntersects(roomBox)) {
        startRoomTransition(Math.round(player.pos.x/HALF_ROOM_PIXEL_WIDTH)-1,Math.round(player.pos.y/HALF_ROOM_PIXEL_HEIGHT)-1);
    }
}

function openMenu(menuID) {
    menu = makeMenu(menuID);
}

function startCutscene(allowedUpdates) {
    canMoveFunction = allowedUpdates;
    normalGameLogic = false;
}

function stopCutscene() {
    normalGameLogic = true;
}

function startRoomTransition(dx,dy) {
    renderEntities(bgCtx);
    floor[roomPos.x][roomPos.y].unload();
    roomPos.x += dx;
    roomPos.y += dy;
    clearEntityList();
    floor[roomPos.x][roomPos.y].load(newRoomCtx);
    roomTransition.dx = dx;
    roomTransition.dy = dy;
    roomTransition.active = true;
    startCutscene(entity => {return false});
    player.translate(-roomTransition.dx * ROOM_PIXEL_WIDTH, -roomTransition.dy * ROOM_PIXEL_HEIGHT);
    camera = new RoomTransitionCamera(dx,dy);
}

function stopRoomTransition() {
    roomTransition.active = false;
    stopCutscene();
    bgCtx.drawImage(newRoomCanvas,0,0);
}

function updateAndRender() {
    update();
    render();
    requestAnimationFrame(updateAndRender);
}

function update() {
    entities.forEach(entity => {
        if (normalGameLogic || canMoveFunction(entity)) entity.update();
    });
    for (let i = 0; i < entities.length; i++) {
        if (entities[i].isDead()) {
            entities.splice(i,1);
            i--;
        }
    }
    if (normalGameLogic) checkRoomTransition();
    if (menu) menu.update();
    camera.update();
    camera = camera.nextCamera();
    for (let i = 0; i < keys.length; i++) {
        keys[i].isPressed = false;
    }
    m.resetClicked();
}

function pixelToGame(x,y) {
    let screenTileWidth = canvas.width/ROOM_WIDTH;
    if (canvas.width > canvas.height * ASPECT_RATIO) {
        screenTileWidth = canvas.height/ROOM_HEIGHT;
    }
    let zoom = screenTileWidth/TILE_SIZE;
    let pos = camera.getPosition();
    return new Vector((x-canvas.width/2)/zoom+pos.x,(y-canvas.height/2)/zoom+pos.y);
}

function render() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let screenTileWidth = canvas.width/ROOM_WIDTH;
    if (canvas.width > canvas.height * ASPECT_RATIO) {
        screenTileWidth = canvas.height/ROOM_HEIGHT;
    }
    let zoom = screenTileWidth/TILE_SIZE;
    let pos = camera.getPosition();
    ctx.translate(canvas.width/2, canvas.height/2)
    ctx.scale(zoom,zoom);
    ctx.translate(-pos.x,-pos.y);
    
    ctx.imageSmoothingEnabled = false;
    
    if (roomTransition.active) {
        ctx.globalAlpha = (roomTransition.fadedRoom == "old") ? roomTransition.newRoomOpacity : 1;
        ctx.drawImage(bgCanvas, -roomTransition.dx * ROOM_PIXEL_WIDTH, -roomTransition.dy * ROOM_PIXEL_HEIGHT);
        ctx.globalAlpha = (roomTransition.fadedRoom == "new") ? roomTransition.newRoomOpacity : 1;
        ctx.drawImage(newRoomCanvas,0,0);
        ctx.globalAlpha = 1;
    } else {
        ctx.drawImage(bgCanvas, 0, 0);
    } 
    
    renderEntities(ctx);
    
    if (menu) menu.render(ctx);
    
    ctx.setTransform(1,0,0,1,0,0);
    
    entities.forEach(entity => {
        entity.renderHUD(ctx, canvas.width, screenTileWidth);
    })
}

function renderEntities(ctx) {
    entities.sort((a,b) => {return a.getRenderDepth() - b.getRenderDepth()});
    entities.forEach(entity => {
        entity.render(ctx);
    })
}

function drawString(ctx,text,x,y,align,size,shake) {
    let drawY = y-5*size;
    for (let k = text.length-1; k >= 0; k--) {
        let drawX = x;
        switch(align) {
            case "center":
                drawX-=text[k].length*size*5/2;
                break;
            case "right":
                drawX-=text[k].length*size*5;
                break;
        }
        for (let j = 0; j < text[k].length; j++) {
            ctx.drawImage(image.font,fontLoc.indexOf(text[k].charAt(j))*5,0,4.99,5,drawX+Math.random()*shake*2-shake,drawY+Math.random()*shake*2-shake,5*size,5*size);
            drawX+=5*size;
        }
        drawY -= 6*size;
    }
}

function drawTextbox(ctx, text, x, yMin, yMax, align) {
    let scale = (yMax-yMin)/5;
    for (let i = 0; i < text.length; i++) {
        drawString(ctx,[text[i].text],x,yMin+(yMax-yMin)*text[i].y,align,text[i].size*scale,0);
    }
}

init();