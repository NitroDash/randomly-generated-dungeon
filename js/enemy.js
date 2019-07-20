function attackEnemies(hitbox, damage) {
    let hit = false;
    entities.forEach(entity => {
        if (entity.isEnemy() && entity.isTangible() && entity.hitboxIntersects(hitbox)) {
            entity.takeKnockbackHit(hitbox.knockbackVector(), damage);
            hit = true;
        }
    })
    return hit;
}

function attackNonEnemies(hitbox, damage) {
    let hit = false;
    entities.forEach(entity => {
        if (entity.isHurtByEnemy() && entity.isTangible() && entity.hitboxIntersects(hitbox)) {
            entity.takeKnockbackHit(hitbox.knockbackVector(), damage);
            hit = true;
        }
    })
    return hit;
}

function drawLeftAlignedHealthBar(ctx, x, y, scale, health, maxHealth) {
    if (!image.heart) return;
    for (let i = 0; i < maxHealth; i+=2) {
        let img = (health <= 0) ? 2 : (health == 1 ? 1 : 0);
        health -= 2;
        ctx.drawImage(image.heart, img * 7, 0, 7, 6, x + 4 * scale * i, y, 7 * scale, 6 * scale);
    }
}

class Enemy extends Entity {
    constructor(wallbox, hitbox, x, y, health) {
        super(wallbox, hitbox, x, y);
        this.maxHealth = health;
        this.health = health;
        this.damageTimer = 0;
        startImageLoad("smoke");
    }
    
    update() {
        if (this.damageTimer > 0) this.damageTimer--;
    }
    
    isTangible() {return this.damageTimer == 0;}
    
    isEnemy() {
        return true;
    }
    
    takeKnockbackHit(knockback, damage) {
        this.health -= damage;
        this.damageTimer = 10;
        if (this.health <= 0) this.die();
    }
    
    die() {
        this.dead = true;
        spawnSmokeClouds(this.pos.x,this.pos.y,8);
    }
    
    drawHealthBar(y, ctx) {
        if (image.heart) {
            drawLeftAlignedHealthBar(ctx, this.pos.x - 2 * this.maxHealth + 0.5, y + this.pos.y, 1, this.health, this.maxHealth);
        }
    }
}

class Spider extends Enemy {
    constructor(x,y) {
        super(new RectHitbox(-4,-11,4,-2),new RectHitbox(-4,-11,4,-2),x,y,2);
        this.origin = new Vector(x,0);
        this.stringLength = y;
        startImageLoad("spider");
        this.v = new Vector(0,0);
    }
    
    update() {
        let toProperOrigin = this.origin.minus(this.pos);
        toProperOrigin.y += this.stringLength;
        toProperOrigin.mult(0.01);
        this.v.add(toProperOrigin);
        this.v.mult(0.95);
        if (toProperOrigin.mag() < 0.04 && this.v.mag() < 0.5) this.v.mult(0);
        this.pos.add(this.v);
        if (this.isTangible()) {
            this.positionHitbox();
            attackNonEnemies(this.hitbox,1);
            this.resetHitbox();
        }
    }
    
    render(ctx) {
        if (image.spider) {
            if (this.damageTimer > 0) {
                this.damageTimer--;
                ctx.globalCompositeOperation = "difference";
            }
            ctx.drawImage(image.spider,0,0,15,9,this.pos.x-7.5,this.pos.y-11.5,15,9);
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = 0.5;
            ctx.drawImage(image.spider,4,10,7,3,this.pos.x-3.5,this.pos.y-1.5,7,3);
            ctx.strokeStyle = "#888";
            ctx.beginPath();
            ctx.moveTo(this.origin.x,this.origin.y);
            ctx.lineTo(this.pos.x,this.pos.y-11);
            ctx.stroke();
            if (DEBUG_SHOW_HITBOX) {
                this.positionHitbox();
                this.hitbox.render(ctx);
                this.resetHitbox();
            }
            ctx.globalAlpha = 1;
            if (this.health < this.maxHealth) {
                this.drawHealthBar(-18, ctx);
            }
        }
    }
    
    takeKnockbackHit(knockback, damage) {
        if (knockback) this.v = knockback.times(2);
        super.takeKnockbackHit(knockback, damage);
    }
}

class Snake extends Enemy {
    constructor(x,y) {
        super(new RectHitbox(-5,-5,5,0),new HitboxCollection([new RectHitbox(-5,-3,5,0),new RectHitbox(2,-9,6,0)]),x,y,2);
        startImageLoad("snake");
        startImageLoad("z");
        this.alert = 0;
        this.sleepTimer = 0;
        this.animation = new StandWalkAnimation(3,4);
        this.direction = true;
        this.waitTimer = 0;
    }
    
    update() {
        if (this.damageTimer > 0) this.damageTimer--;
        if (this.target) {
            if (this.waitTimer <= 0) {
                this.animation.increment();
                let v = this.target.pos.minus(this.pos);
                if (v.magSquared() > 0) {
                    v.setLength(1.2);
                    this.setDirection(v);
                    this.pos.add(v);
                    this.ejectFromCollision();
                    this.positionHitbox();
                    if (attackNonEnemies(this.hitbox, 1)) {
                        this.waitTimer = 30;
                    }
                    this.resetHitbox();
                }
            } else {
                this.waitTimer--;
            }
        } else {
            if (player.pos.minus(this.pos).mag() < 110 && (player.isMoving() || this.alert > 200)) {
                this.alert+=5;
                this.setDirection(player.pos.minus(this.pos));
                if (this.alert > 120) this.target = player;
            }
            if (this.alert > 0) {
                this.alert--;
            } else {
                this.sleepTimer--;
                if (this.sleepTimer <= 0) {
                    this.sleepTimer = 60;
                    entities.push(new SleepZ(this.pos.x + 5, this.pos.y - 5, true));
                }
            }
        }
    }
    
    setDirection(dir) {
        if (this.direction == (dir.x < 0)) this.hitbox.flipX(0);
        this.direction = dir.x >= 0;
    }
    
    takeKnockbackHit(knockback, damage) {
        this.waitTimer = 30;
        if (!this.target) {
            this.alert = 300;
        }
        super.takeKnockbackHit(knockback, damage);
    }
    
    handleSegment(seg, ejectVector) {
        if (seg.type == "wall" || seg.type == "slope" || seg.type == "stairEdge") {
            this.pos.add(ejectVector);
        }
    }
    
    render(ctx) {
        if (image.snake) {
            if (this.damageTimer > 0) {
                this.damageTimer--;
                ctx.globalCompositeOperation = "difference";
            }
            let img = this.alert <= 0 ? 0 : 1;
            if (this.target) img = this.animation.getStep() + 1;
            ctx.drawImage(image.snake, this.direction ? 0 : 12, 9 * img, 12, 9, this.pos.x - 6, this.pos.y - 9, 12,9);
            ctx.globalCompositeOperation = "source-over";
            if (DEBUG_SHOW_HITBOX) {
                this.positionHitbox();
                this.hitbox.render(ctx);
                this.resetHitbox();
            }
            if (this.health < this.maxHealth) {
                this.drawHealthBar(-10, ctx);
            }
        }
    }
}