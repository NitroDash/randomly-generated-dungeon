function clearEntityList() {
    entities = [];
    entities.push(player);
}

class Entity {
    constructor(wallbox,hitbox,x,y) {
        this.wallbox = wallbox;
        this.hitbox = hitbox;
        this.pos = new Vector(x,y);
    }
    
    update() {}
    render(ctx) {}
    getRenderDepth() {return this.pos.y;}
    
    translate(x,y) {
        this.pos.add(new Vector(x,y));
    }
    
    positionHitbox() {
        this.hitbox.translate(this.pos.x,this.pos.y);
    }
    
    resetHitbox() {
        this.hitbox.translate(-this.pos.x,-this.pos.y);
    }
    
    hitboxIntersects(other) {
        this.positionHitbox();
        let result = this.hitbox.intersects(other);
        this.resetHitbox();
        return result;
    }
    
    positionWallbox() {
        this.wallbox.translate(this.pos.x,this.pos.y);
    }
    
    resetWallbox() {
        this.wallbox.translate(-this.pos.x,-this.pos.y);
    }
    
    getCollisionList() {
        this.positionWallbox();
        let segments = [];
        for (let i = 0; i < entities.length; i++) {
            if (entities[i] != this) {
                segments = segments.concat(entities[i].getCollidingSegments(this.wallbox));
            }
        }
        this.resetWallbox();
        return segments;
    }
    
    ejectFromCollision() {
        let walls = this.getCollisionList();
        while (walls.length > 0) {
            this.positionWallbox();
            let shortest = new Vector(Infinity, 0);
            let foundVector = false;
            let foundIndex = 0;
            for (let i = 0; i < walls.length; i++) {
                let v = this.wallbox.getEjected(walls[i].hitbox);
                if (!v || v.magSquared() == 0) {
                    walls.splice(i,1);
                    i--;
                } else {
                    if (v.magSquared() < shortest.magSquared()) {
                        shortest = v;
                        foundVector = true;
                        foundIndex = i;
                    }
                }
            }
            this.resetWallbox();
            if (foundVector) {
                if (this.handleSegment(walls[foundIndex], shortest)) {
                    walls.splice(foundIndex,1);
                }
            }
        }
    }
    
    handleSegment(seg,ejectVector) {return true;}
    
    getCollidingSegments(other) {return [];}
    
    takeKnockbackHit(knockback, damage) {}
    
    isTangible() {return this.tangible;}
    
    canTransition() {return true;}
    
    isEnemy() {return false;}
    
    isHurtByEnemy() {return false;}
    
    isMoving() {return false;}
    
    isDead() {return this.dead;}
    
    renderHUD(ctx, width, scale) {}
    
    canCollect(drop) {return false;}
    
    collect(drop) {}
}

class RoomCollision extends Entity {
    constructor(array) {
        super(null,null,0,0);
        this.tiles = makeEmptyArray(array.length,array[0].length,null);
        for (let x = 0; x < array.length; x++) {
            for (let y = 0; y < array[0].length; y++) {
                this.tiles[x][y] = new TileCollision(x * TILE_SIZE, y * TILE_SIZE, array[x][y]);
            }
        }
    }
    
    getCollidingSegments(other) {
        let segments = [];
        for (let x = 0; x < this.tiles.length; x++) {
            for (let y = 0; y < this.tiles[x].length; y++) {
                segments = segments.concat(this.tiles[x][y].getCollidingSegments(other));
            }
        }
        return segments;
    }
}

class TileCollision {
    constructor(x,y,type) {
        this.segments = [];
        this.x = x;
        this.y = y;
        switch (type) {
            case "wall_u":
                this.segments.push(this.makeTopSegment("wall"));
                this.segments.push(this.makeBottomSegment("slope"));
                break;
            case "wall_d":
                this.segments.push(this.makeBottomSegment("wall"));
                this.segments.push(this.makeTopSegment("slope"));
                break;
            case "wall_l":
                this.segments.push(this.makeLeftSegment("wall"));
                this.segments.push(this.makeRightSegment("slope"));
                break;
            case "wall_r":
                this.segments.push(this.makeRightSegment("wall"));
                this.segments.push(this.makeLeftSegment("slope"));
                break;
            case "wall_out_ul":
            case "wall_in_ul":
                this.segments.push(this.makeTopSegment("wall"));
                this.segments.push(this.makeLeftSegment("wall"));
                break;
            case "wall_out_ur":
            case "wall_in_ur":
                this.segments.push(this.makeTopSegment("wall"));
                this.segments.push(this.makeRightSegment("wall"));
                break;
            case "wall_out_dr":
            case "wall_in_dr":
                this.segments.push(this.makeBottomSegment("wall"));
                this.segments.push(this.makeRightSegment("wall"));
                break;
            case "wall_out_dl":
            case "wall_in_dl":
                this.segments.push(this.makeBottomSegment("wall"));
                this.segments.push(this.makeLeftSegment("wall"));
                break;
            case "stairs":
                this.segments.push({"hitbox":new VerticalLineHitbox(this.x,this.y,this.y+TILE_SIZE,false),"type":"wall"});
                this.segments.push({"hitbox":new VerticalLineHitbox(this.x+TILE_SIZE,this.y,this.y+TILE_SIZE,true),"type":"wall"});
                this.segments.push(this.makeTopSegment("stairEdge"));
                this.segments.push(this.makeBottomSegment("stairEdge"));
                break;
        }
    }
    
    makeTopSegment(type) {
        return {"hitbox":new HorizontalLineHitbox(this.x,this.x+TILE_SIZE,this.y,true),"type":type};
    }
    
    makeBottomSegment(type) {
        return {"hitbox":new HorizontalLineHitbox(this.x,this.x+TILE_SIZE,this.y+TILE_SIZE,false),"type":type};
    }
    
    makeLeftSegment(type) {
        return {"hitbox":new VerticalLineHitbox(this.x,this.y,this.y+TILE_SIZE,true),"type":type};
    }
    
    makeRightSegment(type) {
        return {"hitbox":new VerticalLineHitbox(this.x+TILE_SIZE,this.y,this.y+TILE_SIZE,false),"type":type};
    }
    
    getCollidingSegments(other) {
        let result = [];
        for (let i = 0; i < this.segments.length; i++) {
            let v = other.getEjected(this.segments[i].hitbox);
            if (v) {
                result.push(this.segments[i]);
            }
        }
        return result;
    }
}

class SolidEntity extends Entity {
    constructor(wallbox, hitbox, x, y) {
        super(wallbox, hitbox, x, y);
        this.segments = [];
    }
    
    getCollidingSegments(other) {
        let result = [];
        for (let i = 0; i < this.segments.length; i++) {
            let v = other.getEjected(this.segments[i].hitbox);
            if (v) {
                result.push(this.segments[i]);
            }
        }
        return result;
    }
}

class SolidRectWallboxEntity extends SolidEntity {
    constructor(x,y,w,h,hitbox) {
        super(new RectHitbox(x - w/2, y - h/2, x + w/2, y + h/2), hitbox, x, y);
        this.segments.push({"hitbox": new HorizontalLineHitbox(this.wallbox.p1.x,this.wallbox.p2.x,this.wallbox.p2.y,false), type: "wall"});
        this.segments.push({"hitbox": new HorizontalLineHitbox(this.wallbox.p1.x,this.wallbox.p2.x,this.wallbox.p1.y,true), type: "wall"});
        this.segments.push({"hitbox": new VerticalLineHitbox(this.wallbox.p1.x,this.wallbox.p1.y,this.wallbox.p2.y,true), type: "wall"});
        this.segments.push({"hitbox": new VerticalLineHitbox(this.wallbox.p2.x,this.wallbox.p1.y,this.wallbox.p2.y,false), type: "wall"});
    }
}

class BossDoor extends SolidRectWallboxEntity {
    constructor() {
        super(ROOM_PIXEL_WIDTH/2, 8, 24, 16, new RectHitbox(-12,0,12,20));
        startImageLoad("bossdoor");
    }
    
    update() {
        this.positionHitbox();
        entities.forEach(entity => {
            if (entity.keys && entity.hitboxIntersects(this.hitbox)) {
                entity.keys--;
                this.dead = true;
                spawnSmokeClouds(this.pos.x - 6, this.pos.y + 8, 8);
                spawnSmokeClouds(this.pos.x + 6, this.pos.y + 8, 8);
            }
        })
        this.resetHitbox();
    }
    
    render(ctx) {
        if (image.bossdoor) {
            ctx.drawImage(image.bossdoor, this.wallbox.p1.x,this.wallbox.p1.y);
        }
    }
}

class Chest extends SolidRectWallboxEntity {
    constructor(x,y,contents) {
        super(x,y,12,12,new RectHitbox(-8, -8, 8, 8));
        startImageLoad("chest");
        this.tangible = true;
        this.contents = contents;
    }
    
    isEnemy() {
        return true;
    }
    
    takeKnockbackHit(knockback, damage) {
        this.dead = true;
        spawnSmokeClouds(this.pos.x,this.pos.y,8);
        let drop = null;
        switch (this.contents) {
            case "key":
                drop = new KeyDrop(this.pos.x, this.pos.y);
                break;
        }
        if (drop) {
            entities.push(drop);
            floor[roomPos.x][roomPos.y].adopt(drop);
        }
    }
    
    render(ctx) {
        if (image.chest) {
            ctx.drawImage(image.chest, this.wallbox.p1.x,this.wallbox.p1.y);
        }
    }
}

class Drop extends Entity {
    constructor(hitbox, x, y) {
        super(null, hitbox, x, y);
    }
    
    update() {
        this.positionHitbox();
        entities.forEach(en => {
            if (en.canCollect(this) && en.hitboxIntersects(this.hitbox)) {
                this.dead = true;
                en.collect(this);
            }
        })
        this.resetHitbox();
    }
}

class KeyDrop extends Drop {
    constructor(x,y) {
        super(new RectHitbox(-2, -4, 2, 4), x, y);
        startImageLoad("key");
    }
    
    render(ctx) {
        if (image.key) {
            ctx.drawImage(image.key, this.pos.x - 2.5, this.pos.y - 4.5);
        }
    }
}

var imageHandPositions = {
    5:[
        new Vector(-1.5,3.5), new Vector(0.5,2.5), new Vector(3.5,2.5), new Vector(4.5,1.5), new Vector(3.5,-0.5), new Vector(-1.5,-0.5), new Vector(-3.5,2.5), new Vector(-5.5,2.5)
    ]
}

class Player extends Entity {
    constructor(x,y) {
        super(new RectHitbox(-5,-4,5,6),new RectHitbox(-4,-2,4,7),x,y);
        this.slopeRunCounter = 0;
        this.track = null;
        this.tangible = true;
        this.direction = new Vector(0,1);
        this.standWalk = new StandWalkAnimation(9,4);
        this.weapon = new Sword(this);
        startImageLoad("player");
        startImageLoad("heart");
        this.maxHealth = 6;
        this.health = this.maxHealth;
        this.damageTimer = 0;
        this.keys = 0;
        this.moving = false;
    }
    
    update() {
        if (this.dying) {
            this.deathTheta += 0.2;
            if (this.deathTheta < 20.4) {
                this.direction = new Vector(Math.cos(this.deathTheta), Math.sin(this.deathTheta));
            } else if (this.deathTheta < 28) {
                this.direction = new Vector(0,1);
            } else {
                this.dead = true;
                spawnSmokeClouds(this.pos.x,this.pos.y,8);
                openMenu("gameOver");
            }
            return;
        }
        if (this.damageTimer > 0) {
            this.damageTimer--;
        }
        if (this.track) {
            this.track.update();
            this.pos = this.track.getPosition();
            if (this.track.isDone()) {
                this.track = null;
                this.tangible = true;
            }
            return;
        }
        let v;
        this.moving = false;
        if (this.weapon.isActive()) {
            this.weapon.update();
            v = this.weapon.getVelocity();
            if (v) this.pos.add(v);
            if (v && v.magSquared() > 0) this.moving = true;
            v = this.weapon.getDirection();
            if (v) this.direction = v.copy();
            let box = this.weapon.getHitbox();
            attackEnemies(box, this.weapon.getDamage());
        } else if (newClicks.length > 0) {
            this.weapon.activate(pixelToGame(newClicks[0].x,newClicks[0].y).minus(this.pos));
        } else if (touchMode && (v = joysticks[1].getInput()) && v.mag() > 0.3) {
            this.weapon.activate(v);
        } else {
            let speed = (DEBUG_ENABLE_NOCLIP && keys[4].isDown) ? 3 : 1;
            let d = movementDir.copy();
            if (d.magSquared() != 0) {
                d.setLength(speed);
                this.direction = d;
                this.standWalk.increment();
                this.moving = true;
            } else {
                this.standWalk.reset();
            }
            this.pos.add(d);
        }
        let oldSlopeCounter = this.slopeRunCounter;
        if (!DEBUG_ENABLE_NOCLIP || !keys[4].isDown) this.ejectFromCollision();
        if (this.slopeRunCounter == oldSlopeCounter) this.slopeRunCounter = 0;
    }
    
    jumpTo(pos,time) {
        this.track = new JumpTrack(this.pos,pos,time,0.2);
        this.tangible = false;
    }
    
    handleSegment(seg, ejectVector) {
        if (seg.type == "wall") {
            this.pos.add(ejectVector);
        } else if (seg.type == "slope") {
            this.pos.add(ejectVector);
            this.slopeRunCounter++;
            if (this.slopeRunCounter > 15) {
                this.slopeRunCounter = 0;
                ejectVector.setLength(-TILE_SIZE - 12);
                this.jumpTo(this.pos.plus(ejectVector),30);
            }
        }
        return true;
    }
    
    angleToImageIndex(theta) {
        let index = Math.round(theta * 4 / Math.PI);
        if (index < 0) index += 8;
        if (index <= 2) return 2 - index;
        return 10 - index;
    }
    
    render(ctx) {
        if (image.player) {
            let dir = this.angleToImageIndex(this.direction.angleOf());
            let img = this.dying ? (this.deathTheta > 20.4 ? 6 : 0) : this.standWalk.getStep();
            let handLocation = null;
            if (this.weapon.isActive() && !this.dying) {
                let wImg = this.weapon.getImage();
                if (wImg >= 0) img = wImg;
                handLocation = this.pos.plus(imageHandPositions[img][dir]);
                this.weapon.renderUnderPlayer(ctx, handLocation);
            }
            if (this.damageTimer % 20 < 10) ctx.drawImage(image.player,dir * 16, img * 16,16,16,this.pos.x-8,this.pos.y-8,16,16);
            if (this.weapon.isActive() && !this.dying) {
                this.weapon.renderAbovePlayer(ctx, handLocation);
            }
            if (DEBUG_SHOW_HITBOX) {
                this.positionHitbox();
                this.hitbox.render(ctx);
                this.resetHitbox();
            }
        }
    }
    
    isHurtByEnemy() {return true;}
    
    isTangible() {return this.tangible && this.damageTimer == 0;}
    
    canTransition() {return this.tangible;}
    
    isMoving() {return this.moving;}
    
    renderHUD(ctx, width, scale) {
        drawLeftAlignedHealthBar(ctx, 0, 0, Math.ceil(2*scale/TILE_SIZE), this.health, this.maxHealth);
        if (image.key) {
            let keyX = width;
            for (let i = 0; i < this.keys; i++) {
                keyX -= scale * 5/9;
                ctx.drawImage(image.key, 0, 0, 5, 9, keyX, 0, scale * 5/9, scale);
            }
        }
    }
    
    takeKnockbackHit(knockback, damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.dying = true;
            this.deathTheta = this.direction.angleOf();
            startCutscene((entity => {return (entity instanceof Particle) || (entity === this);}).bind(this));
        } else {
            this.damageTimer = 60;   
        }
    }
    
    canCollect(drop) {
        return true;
    }
    
    collect(drop) {
        if (drop instanceof KeyDrop) {
            startImageLoad("key");
            this.keys++;
        }
    }
}

class SpringPanel extends Entity {
    constructor(x,y,destX,destY) {
        super(null, new RectHitbox(-7,-7,7,7),x,y);
        startImageLoad("springpanel");
        this.dest = new Vector(destX,destY);
        this.bounceTheta = 0;
        this.dBounceTheta = 0;
    }
    
    update() {
        let bounced = false;
        entities.forEach(entity => {
            this.positionHitbox();
            if (entity.isTangible() && entity.jumpTo && entity.hitboxIntersects(this.hitbox)) {
                entity.jumpTo(this.dest,60);
                bounced = true;
            }
            this.resetHitbox();
        })
        if (bounced) {
            this.dBounceTheta = 0.5;
        }
        if (this.dBounceTheta > 0) {
            this.bounceTheta += this.dBounceTheta;
            this.dBounceTheta -= 0.01;
            if (this.dBounceTheta < 0) {
                this.bounceTheta = 0;
                this.dBounceTheta = 0;
            }
        }
    }
    
    render(ctx) {
        if (image.springpanel) {
            ctx.drawImage(image.springpanel,14,0,4,14,this.pos.x-2,this.pos.y-7,4,14);
            ctx.drawImage(image.springpanel,0,0,14,14,this.pos.x - 7, this.pos.y - 7 - ((this.bounceTheta == 0) ? 0 : (3+Math.sin(this.bounceTheta))),14,14);
            if (DEBUG_SHOW_HITBOX) {
                this.positionHitbox();
                this.hitbox.render(ctx);
                this.resetHitbox();
            }
        }
    }
    
    getRenderDepth() {return 0;}
}