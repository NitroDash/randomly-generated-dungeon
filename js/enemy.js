function attackEnemies(hitbox, damage) {
    entities.forEach(entity => {
        if (entity.isEnemy() && entity.isTangible() && entity.hitboxIntersects(hitbox)) {
            entity.takeKnockbackHit(hitbox.knockbackVector(), damage);
        }
    })
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
        this.damageTimer = 3;
        if (this.health <= 0) this.die();
    }
    
    die() {
        this.dead = true;
        spawnSmokeClouds(this.pos.x,this.pos.y,8);
    }
    
    drawHealthBar(y, ctx) {
        if (image.heart) {
            let left = this.pos.x - 2 * this.maxHealth + 0.5;
            let renderHealth = this.health;
            for (let i = 0; i < this.maxHealth; i+=2) {
                let img = (renderHealth <= 0) ? 2 : (renderHealth == 1 ? 1 : 0);
                renderHealth -= 2;
                ctx.drawImage(image.heart, img * 7, 0, 7, 6, left + 4 * i, y + this.pos.y, 7, 6);
            }
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