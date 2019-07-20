const ROOM_WIDTH = 19;
const ROOM_HEIGHT = 11;
const TILE_SIZE = 16;
const ROOM_PIXEL_WIDTH = ROOM_WIDTH * TILE_SIZE;
const ROOM_PIXEL_HEIGHT = ROOM_HEIGHT * TILE_SIZE;
const HALF_ROOM_PIXEL_WIDTH = ROOM_PIXEL_WIDTH / 2;
const HALF_ROOM_PIXEL_HEIGHT = ROOM_PIXEL_HEIGHT / 2;


var templates;

var tilemap;

var roomBox = new RectHitbox(0,0,ROOM_PIXEL_WIDTH, ROOM_PIXEL_HEIGHT);

class Room {
    constructor(template) {
        this.array = makeRoomArray(template);
        this.entered = false;
        this.entityList = template.entities ? template.entities.map(entry => {return {"template": entry, alive: true}}) : [];
    }
    
    openTopDoor() {
        let centerX = Math.floor(ROOM_WIDTH/2);
        this.array[centerX][0] = "ground";
        this.array[centerX - 1][0] = "wall_out_dr";
        this.array[centerX + 1][0] = "wall_out_dl";
    }
    
    openBottomDoor() {
        let centerX = Math.floor(ROOM_WIDTH/2);
        this.array[centerX][ROOM_HEIGHT-1] = "ground";
        this.array[centerX - 1][ROOM_HEIGHT - 1] = "wall_out_ur";
        this.array[centerX + 1][ROOM_HEIGHT - 1] = "wall_out_ul";
    }
    
    openLeftDoor() {
        let centerY = Math.floor(ROOM_HEIGHT/2);
        this.array[0][centerY] = "ground";
        this.array[0][centerY - 1] = "wall_out_dr";
        this.array[0][centerY + 1] = "wall_out_ur";
    }
    
    openRightDoor() {
        let centerY = Math.floor(ROOM_HEIGHT/2);
        this.array[ROOM_WIDTH-1][centerY] = "ground";
        this.array[ROOM_WIDTH-1][centerY - 1] = "wall_out_dl";
        this.array[ROOM_WIDTH-1][centerY + 1] = "wall_out_ul";
    }
    
    makeTiles() {
        if (this.tiles) return;
        this.tiles = makeEmptyArray(ROOM_WIDTH,ROOM_HEIGHT,0);
        for (let x = 0; x < ROOM_WIDTH; x++) {
            for (let y = 0; y < ROOM_HEIGHT; y++) {
                if (!tilemap[this.array[x][y]]) {
                    this.array[x][y] = "water";
                }
                this.tiles[x][y] = randInt(0,tilemap[this.array[x][y]].length);
            }
        }
        this.collision = new RoomCollision(this.array);
    }
    
    render(ctx) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
            for (let y = 0; y < ROOM_HEIGHT; y++) {
                ctx.drawImage(image.tiles,tilemap[this.array[x][y]][this.tiles[x][y]].x,tilemap[this.array[x][y]][this.tiles[x][y]].y,16,16,x*TILE_SIZE,y*TILE_SIZE,TILE_SIZE,TILE_SIZE);
            }
        }
    }
    
    addEntity(template) {
        this.entityList.push(template);
    }
    
    adopt(entity) {
        this.entityList.push({template: {type: "thing"}, alive: !entity.isDead(), thing: entity});
    }
    
    addChest(contents) {
        this.addEntity({template: {type: "chest", x: ROOM_PIXEL_WIDTH/2, y: ROOM_PIXEL_HEIGHT/2, "contents": contents}, alive: true});
    }
    
    load(ctx) {
        this.makeTiles();
        entities.push(this.collision);
        if (this.entityList) {
            this.entityList.forEach(entry => {
                if (entry.alive) {
                    switch(entry.template.type) {
                        case "springpanel":
                            entry.thing = new SpringPanel(entry.template.x,entry.template.y,entry.template.destX,entry.template.destY);
                            break;
                        case "spider":
                            entry.thing = new Spider(entry.template.x,entry.template.y);
                            break;
                        case "bossdoor":
                            entry.thing = new BossDoor();
                            break;
                        case "chest":
                            entry.thing = new Chest(entry.template.x, entry.template.y, entry.template.contents);
                            break;
                        case "snake":
                            entry.thing = new Snake(entry.template.x, entry.template.y);
                            break;
                    }
                    if (entry.thing) {
                        entities.push(entry.thing);
                    } else {
                        entry.alive = false;
                    }
                }
            })
        }
        this.render(ctx);
    }
    
    unload() {
        this.entityList.forEach(entry => {
            if (entry.thing && entry.thing.isDead()) {
                entry.alive = false;
            }
            if (entry.template.type != "thing") entry.thing = null;
        })
    }
}

function makeEmptyArray(width,height,value) {
    let result = [];
    for (let x = 0; x < width; x++) {
        result.push([]);
        for (let y = 0; y < height; y++) {
            result[x].push(value);
        }
    }
    return result;
}

function fillWithEmptyObjects(array) {
    for (let x = 0; x < array.length; x++) {
        for (let y = 0; y < array[x].length; y++) {
            if (!array[x][y]) array[x][y] = {};
        }
    }
}

function arrayContains(array,x,y) {
    if (x < 0 || x >= array.length) return false;
    if (y < 0 || y >= array[x].length) return false;
    return true;
}

function getArrayEntry(array,x,y,obValue) {
    return arrayContains(array,x,y) ? array[x][y] : obValue;
}

function getTemplateTileCoordinate(coord, size) {
    return (coord<0) ? coord+size : coord;
}

const tileCodes = {"Q":"wall_in_ul","W":"wall_in_ur","A":"wall_in_dl","S":"wall_in_dr","E":"wall_out_ul","R":"wall_out_ur","D":"wall_out_dl","F":"wall_out_dr","w":"wall_u","a":"wall_l","s":"wall_d","d":"wall_r","i":"wall_u_smooth","j":"wall_l_smooth","k":"wall_d_smooth","l":"wall_r_smooth","g":"ground","=":"stairs","~":"water"};

function makeRoomArray(template) {
    let array = makeEmptyArray(ROOM_WIDTH,ROOM_HEIGHT,null);
    for (let x = 0; x < ROOM_WIDTH; x++) {
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            if (y < template.ul.length) {
                if (x < template.ul[0].length) {
                    array[x][y] = tileCodes[template.ul[y].charAt(x)];
                } else if (x >= ROOM_WIDTH - template.ur[0].length) {
                    array[x][y] = tileCodes[template.ur[y].charAt(x + template.ur[0].length - ROOM_WIDTH)];
                } else {
                    array[x][y] = tileCodes[template.ur[y].charAt(0)];
                }
            } else if (y >= ROOM_HEIGHT - template.dl.length) {
                if (x < template.ul[0].length) {
                    array[x][y] = tileCodes[template.dl[y + template.dl.length - ROOM_HEIGHT].charAt(x)];
                } else if (x >= ROOM_WIDTH - template.ur[0].length) {
                    array[x][y] = tileCodes[template.dr[y + template.dl.length - ROOM_HEIGHT].charAt(x + template.ur[0].length - ROOM_WIDTH)];
                } else {
                    array[x][y] = tileCodes[template.dr[y + template.dl.length - ROOM_HEIGHT].charAt(0)];
                }
            } else {
                if (x < template.ul[0].length) {
                    array[x][y] = tileCodes[template.dl[0].charAt(x)];
                } else if (x >= ROOM_WIDTH - template.ur[0].length) {
                    array[x][y] = tileCodes[template.dr[0].charAt(x + template.ur[0].length - ROOM_WIDTH)];
                } else {
                    array[x][y] = tileCodes[template.dr[0].charAt(0)];
                }
            }
        }
    }
    return array;
}

function generateFloor(level, callback) {
    if (!templates) {
        loadFiles([{"type":"img","filename":`img/tiles${level}.png`},{"type":"json","filename":`img/tiles${level}.json`},{"type":"json","filename":"rooms/rooms.json"}],function(res) {_generateFloor(level,res,callback)});
    } else {
        loadFiles([{"type":"img","filename":`img/tiles${level}.png`},{"type":"json","filename":`img/tiles${level}.json`}],function(res) {_generateFloor(level,res,callback)});
    }
}

function _generateFloor(level, res, callback) {
    if (!templates) templates = res[2];
    image.tiles = res[0];
    tilemap = res[1];
    let DUNGEON_WIDTH = 4;
    let DUNGEON_HEIGHT = 5;
    roomPos.x = randInt(0,DUNGEON_WIDTH);
    roomPos.y = DUNGEON_HEIGHT-1;
    let graph = new DungeonGraph(DUNGEON_WIDTH,DUNGEON_HEIGHT);
    graph.noOverlapRouteTo(roomPos.x,roomPos.y,function(x,y) {return y==0});
    graph.fillAccessibleRegion(function(x,y) {return y!=0});
    for (let i = 0; i < DUNGEON_WIDTH*DUNGEON_HEIGHT/2; i++) {
        graph.addRandomEdge(function(x,y) {return y!=0});
    }
    graph.cleanDuplicateEdges();
    graph.makeBidirectional();
    let height = graph.makeHeights(roomPos.x,roomPos.y);
    let bossPos = {x: 0, y: 0};
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
        if (graph.containsRoomExit(graph.graph[x][1],x,0)) {
            bossPos.x = x;
            break;
        }
    }
    floor = makeEmptyArray(DUNGEON_WIDTH,DUNGEON_HEIGHT,null);
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
        for (let y = 0; y < DUNGEON_HEIGHT; y++ ){
            let templateString = makeTemplateString(height[x][y]);
            if (!templates[templateString]) {
                height[x][y].stairs = 1;
                templateString = makeTemplateString(height[x][y]);
            }
            floor[x][y] = new Room(templates[templateString][0]);
        }
    }
    floor[bossPos.x][bossPos.y+1].addEntity({template: {type: "bossdoor"}, alive: true});
    let numChests = 1;
    let chestPos = graph.findChestPositions(numChests, function(x,y) {return y > 0 && (x != roomPos.x || y != roomPos.y)});
    let chestContents = ["key"];
    chestPos.forEach(pos => {
        floor[pos.x][pos.y].addChest(chestContents.shift());
    })
    for (let x = 0; x < graph.graph.length; x++) {
        for (let y = 0; y < graph.graph[x].length; y++) {
            for (let i = 0; i < graph.graph[x][y].length; i++) {
                switch(graph.graph[x][y][i].dir) {
                    case "up":
                        floor[x][y].openTopDoor();
                        floor[graph.graph[x][y][i].x][graph.graph[x][y][i].y].openBottomDoor();
                        break;
                    case "down":
                        floor[x][y].openBottomDoor();
                        floor[graph.graph[x][y][i].x][graph.graph[x][y][i].y].openTopDoor();
                        break;
                    case "left":
                        floor[x][y].openLeftDoor();
                        floor[graph.graph[x][y][i].x][graph.graph[x][y][i].y].openRightDoor();
                        break;
                    case "right":
                        floor[x][y].openRightDoor();
                        floor[graph.graph[x][y][i].x][graph.graph[x][y][i].y].openLeftDoor();
                        break;
                }
            }
        }
    }
    callback();
}

function makeTemplateString(heightData) {
    let result = heightData.up ? "1":"0";
    result += heightData.down ? "1":"0";
    result += heightData.left ? "1":"0";
    result += heightData.right ? "1":"0";
    result += heightData.stairs ? "1":"0";
    return result;
}

var oppositeDirections = {"left":"right","right":"left","up":"down","down":"up"};

class DungeonGraph {
    constructor(width,height) {
        this.graph = makeEmptyArray(width,height,null);
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                this.graph[x][y] = [];
            }
        }
        this.visited = makeEmptyArray(width,height,false);
    }
    
    noOverlapRouteTo(x, y, isFinished) {
        return this.rNORT(x,y,isFinished);
    }
    
    rNORT(x,y,isFinished) {
        if (getArrayEntry(this.visited,x,y,true)) return false;
        this.visited[x][y] = true;
        if (isFinished(x,y)) return true;
        let directions = [{"dx":0,"dy":-1,"name":"up"},{"dx":0,"dy":1,"name":"down"},{"dx":1,"dy":0,"name":"right"},{"dx":-1,"dy":0,"name":"left"}];
        permute(directions);
        while (directions.length > 0) {
            let dir = directions.pop();
            this.graph[x][y].push({"x":x+dir.dx,"y":y+dir.dy,"dir":dir.name});
            if (this.rNORT(x+dir.dx,y+dir.dy,isFinished)) return true;
            this.graph[x][y].pop();
        }
        this.visited[x][y] = false;
        return false;
    }
    
    fillAccessibleRegion(isInRegion) {
        let visitedRooms = [];
        for (let x = 0; x < this.graph.length; x++) {
            for (let y = 0; y < this.graph[x].length; y++) {
                if (this.visited[x][y]) visitedRooms.push({"x":x,"y":y});
            }
        }
        while (visitedRooms.length > 0) {
            let room = sampleNoReplace(visitedRooms);
            let directions = [{"dx":0,"dy":-1,"name":"up"},{"dx":0,"dy":1,"name":"down"},{"dx":1,"dy":0,"name":"right"},{"dx":-1,"dy":0,"name":"left"}];
            while (directions.length > 0) {
                let dir = sampleNoReplace(directions);
                if (!getArrayEntry(this.visited,room.x+dir.dx,room.y+dir.dy,true) && isInRegion(room.x+dir.dx,room.y+dir.dy)) {
                    let newRoom = {"x":room.x+dir.dx,"y":room.y+dir.dy};
                    visitedRooms.push(newRoom);
                    this.visited[newRoom.x][newRoom.y] = true;
                    visitedRooms.push(room);
                    this.graph[room.x][room.y].push({"x":newRoom.x,"y":newRoom.y,"dir":dir.name});
                    break;
                }
            }
        }
    }
    
    addRandomEdge(isInRegion) {
        let directions = [{"dx":0,"dy":-1,"name":"up"},{"dx":0,"dy":1,"name":"down"},{"dx":1,"dy":0,"name":"right"},{"dx":-1,"dy":0,"name":"left"}];
        for (let i = 0; i < 20; i++) {
            let x = randInt(0,this.graph.length);
            let y = randInt(0,this.graph[x].length);
            if (!isInRegion(x,y)) continue;
            let dir = directions[randInt(0,4)];
            let newX = x + dir.dx;
            let newY = y + dir.dy;
            if (arrayContains(this.graph,newX,newY) && isInRegion(newX,newY)) {
                this.graph[x][y].push({"x":newX,"y":newY,"dir":dir.name});
                return;
            }
        }
    }
    
    containsRoomExit(edgeList,x,y) {
        for (let i = 0; i < edgeList.length; i++) {
            if (edgeList[i].x == x && edgeList[i].y == y) {
                return true;
            }
        }
        return false;
    }
    
    getExitInDirection(edgeList,dir) {
        for (let i = 0; i < edgeList.length; i++) {
            if (edgeList[i].dir == dir) return edgeList[i];
        }
        return null;
    }
    
    cleanDuplicateEdges() {
        for (let x = 0; x < this.graph.length; x++) {
            for (let y = 0; y < this.graph[x].length; y++) {
                let edgesSeen = [];
                for (let i = 0; i < this.graph[x][y].length; i++) {
                    if (this.containsRoomExit(edgesSeen,this.graph[x][y][i].x,this.graph[x][y][i].y)) {
                        this.graph[x][y].splice(i,1);
                        i--;
                    } else {
                        edgesSeen.push(this.graph[x][y][i]);
                    }
                }
            }
        }
    }
    
    makeBidirectional() {
        for (let x = 0; x < this.graph.length; x++) {
            for (let y = 0; y < this.graph[x].length; y++) {
                for (let i = 0; i < this.graph[x][y].length; i++) {
                    if (!this.containsRoomExit(this.graph[this.graph[x][y][i].x][this.graph[x][y][i].y],x,y)) {
                        this.graph[this.graph[x][y][i].x][this.graph[x][y][i].y].push({"x":x,"y":y,"dir":oppositeDirections[this.graph[x][y][i].dir]});
                    }
                }
            }
        }
    }
    
    makeHeights(testX,testY) {
        let height = makeEmptyArray(this.graph.length,this.graph[0].length,null);
        fillWithEmptyObjects(height);
        for (let x = 0; x < this.graph.length; x++) {
            for (let y = 0; y < this.graph[x].length; y++) {
                for (let i = 0; i < this.graph[x][y].length; i++) {
                    let h = randInt(0,2);
                    if (this.graph[x][y][i].dir == "right") {
                        height[x][y].right = h;
                        height[x+1][y].left = h;
                    } else if (this.graph[x][y][i].dir == "down") {
                        height[x][y].down = h;
                        height[x][y+1].up = h;
                    }
                }
                let assignedHeights = 0;
                let heightScore = 0;
                this.graph[x][y].forEach(edge => {
                    heightScore += height[x][y][edge.dir];
                    assignedHeights++;
                });
                for (var dir in oppositeDirections) {
                    if (oppositeDirections.hasOwnProperty(dir) && height[x][y][dir] == undefined) {
                        height[x][y][dir] = (heightScore == assignedHeights) ? 1 : ((heightScore == 0) ? 0 : randInt(0,2));
                    }
                }
                height[x][y].stairs = randInt(0,2);
            }
        }
        let roomsInDungeon = 0;
        for (let x = 0; x < this.visited.length; x++) {
            for (let y = 0; y < this.visited[x].length; y++) {
                if (this.visited[x][y]) roomsInDungeon++;
            }
        }
        let reached = makeEmptyArray(this.graph.length,this.graph[0].length,0);
        let roomsReached = 0;
        let oldRoomsReached = 0;
        let testStack = [{"x":testX,"y":testY,"h":0}];
        let needStairRooms = [];
        while (roomsReached < roomsInDungeon) {
            let stairRoom = null;
            if (testStack.length == 0) {
                while (!stairRoom) {
                    stairRoom = needStairRooms.pop();
                    if (reached[stairRoom.x][stairRoom.y] == 2) {
                        stairRoom = null;
                    } else {
                        height[stairRoom.x][stairRoom.y].stairs = 1;
                        reached[stairRoom.x][stairRoom.y] = 0;
                        testStack.push({"x":stairRoom.x,"y":stairRoom.y,"h":0});
                    }
                }
            }
            while (testStack.length > 0) {
                let test = testStack.pop();
                if (reached[test.x][test.y] >= test.h + 1) continue;
                if (height[test.x][test.y].stairs) {
                    test.h = 1;
                } else {
                    needStairRooms.push({"x":test.x,"y":test.y});
                }
                if (reached[test.x][test.y] < 2 && test.h == 1) roomsReached++;
                reached[test.x][test.y] = test.h + 1;
                for (var dir in oppositeDirections) {
                    if (oppositeDirections.hasOwnProperty(dir)) {
                        let edge = this.getExitInDirection(this.graph[test.x][test.y],dir);
                        if (edge) {
                            if (height[test.x][test.y][dir] == 0 || height[test.x][test.y].stairs || test.h == 1) {
                                testStack.push({"x":edge.x,"y":edge.y,"h":height[test.x][test.y][dir]});
                            } else {
                                needStairRooms.push({"x":test.x,"y":test.y});
                            }
                        }
                    }
                }
            }
            if (oldRoomsReached == roomsReached && stairRoom) {
                height[stairRoom.x][stairRoom.y].stairs = 0;
            }
            oldRoomsReached = roomsReached;
        }
        roomsReached = 0;
        reached = makeEmptyArray(this.graph.length,this.graph[0].length,0);
        testStack = [{"x":testX,"y":testY,"h":0}];
        needStairRooms = [];
        while (roomsReached < roomsInDungeon) {
            let stairRoom = null;
            if (testStack.length == 0) {
                while (true) {
                    stairRoom = needStairRooms.pop();
                    if (reached[stairRoom.x][stairRoom.y] < 2) {
                        height[stairRoom.x][stairRoom.y].stairs = 1;
                        reached[stairRoom.x][stairRoom.y] = 0;
                        testStack.push({"x":stairRoom.x,"y":stairRoom.y,"h":0});
                        break;
                    }
                }
            }
            while (testStack.length > 0) {
                let test = testStack.pop();
                if (reached[test.x][test.y] >= 2 - test.h) continue;
                if (test.h == 0) roomsReached++;
                reached[test.x][test.y] = 2 - test.h;
                for (var dir in oppositeDirections) {
                    if (oppositeDirections.hasOwnProperty(dir)) {
                        let edge = this.getExitInDirection(this.graph[test.x][test.y],dir);
                        if (edge) {
                            if (height[test.x][test.y][dir] == 1 || test.h == 0) {
                                let newTest = {"x":edge.x,"y":edge.y,"h": (height[test.x][test.y][dir] == 0 || height[edge.x][edge.y].stairs) ? 0 : 1};
                                testStack.push(newTest);
                                if (newTest.h == 1) needStairRooms.push({"x":edge.x,"y":edge.y});
                            } else {
                                needStairRooms.push({"x":test.x,"y":test.y});
                            }
                        }
                    }
                }
            }
        }        
        return height;
    }
    
    findChestPositions(num, isAllowed) {
        let found = [];
        for (let x = 0; x < this.graph.length; x++) {
            for (let y = 0; y < this.graph[0].length; y++) {
                if (isAllowed(x,y)) {
                    let score = this.graph[x][y].length + random();
                    for (let i = 0; i <= found.length; i++) {
                        if (i == found.length) {
                            if (found.length < num) found.push({"x":x,"y":y,"score":score});
                        } else if (found[i].score > score) {
                            found.splice(i,0,{"x":x,"y":y,"score":score});
                            if (found.length > num) found.pop();
                        }
                    }
                }
            }
        }
        return found;
    }
}