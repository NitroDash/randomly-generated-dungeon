class Weapon {
    constructor(user) {
        this.user = user;
    }
    
    activate(direction) {
        
    }
    
    isActive() {
        return false;
    }
    
    update() {
        
    }
    
    getHitbox() {
        return new Hitbox();
    }
    
    getDamage() {
        return 0;
    }
    
    getDirection() {
        return null;
    }
    
    getImage() {
        return -1;
    }
    
    getVelocity() {
        return null;
    }
    
    renderUnderPlayer(ctx, handLocation) {
        if (handLocation.y <= this.user.pos.y) {
            this.render(ctx, handLocation);
        }
    }
    
    renderAbovePlayer(ctx, handLocation) {
        if (handLocation.y > this.user.pos.y) {
            this.render(ctx, handLocation);
        }
    }
    
    render(ctx, handLocation) {
        
    }
}

class Sword extends Weapon {
    constructor(user) {
        super(user);
        startImageLoad("sword");
        this.direction = null;
        this.timer = 0;
    }
    
    activate(direction) {
        if (direction.magSquared() > 0) {
            this.direction = direction;
            this.timer = 15;
        }
    }
        
    isActive() {
        return this.timer > 0;
    }
    
    getHitbox() {
        if (this.timer > 13) {
            let theta = this.direction.angleOf();
            let cos = Math.cos(theta);
            let sin = Math.sin(theta);
            let boxes = [];
            for (let i = 4; i <= 16; i++) {
                boxes.push(new PointHitbox(this.user.pos.x + cos * i, this.user.pos.y + sin * i, theta))
            }
            return new HitboxCollection(boxes);
        } else {
            return new Hitbox();
        }
    }
    
    getDamage() {
        return 1;
    }
    
    getDirection() {
        return this.direction;
    }
    
    getImage() {
        return this.isActive() ? 5 : -1;
    }
    
    update() {
        if (this.timer > 0) {
            this.timer--;
        }
    }
    
    getVelocity() {
        return this.isActive() ? new Vector(0,0) : null;
    }
    
    render(ctx, handLocation) {
        if (image.sword && this.isActive()) {
            let theta = this.direction.angleOf();
            ctx.translate(handLocation.x,handLocation.y);
            ctx.rotate(theta);
            ctx.drawImage(image.sword,-2.5, -2.5);
            ctx.rotate(-theta);
            ctx.translate(-handLocation.x,-handLocation.y);
            if (DEBUG_SHOW_HITBOX) this.getHitbox().render(ctx);
        }
    }
}