class Particle extends Entity {
    constructor(x,y) {
        super(null,null,x,y);
    }
    
    positionHitbox() {}
    resetHitbox() {}
    hitboxIntersects(other) {return false;}
    positionWallbox() {}
    resetWallbox() {}
    wallboxIntersects(other) {return false;}
}

class SmokeCloud extends Particle {
    constructor(x,y) {
        super(x,y);
        this.img = randInt(0,4);
        this.v = new Vector(randFloat(-0.2,0.2),randFloat(-0.2,0.2));
        this.timer = 0;
        this.ANIM_LENGTH = 5;
    }
    
    update() {
        this.pos.add(this.v);
        this.timer++;
        if (this.timer >= this.ANIM_LENGTH * 4) this.dead = true; 
    }
    
    render(ctx) {
        if (image.smoke) {
            ctx.drawImage(image.smoke,Math.floor(this.timer/this.ANIM_LENGTH)*8,this.img*8,8,8, this.pos.x-4,this.pos.y-4,8,8);
        }
    }
}

function spawnSmokeClouds(x,y,num) {
    let theta = Math.random() * 6;
    for (let i = 0; i < num; i++) {
        theta += Math.PI*2/num + randFloat(-0.1,0,1);
        entities.push(new SmokeCloud(x+4*Math.cos(theta),y+4*Math.sin(theta)));
    }
}

class SleepZ extends Particle {
    constructor(x,y,right) {
        super(x,y);
        this.v = new Vector(right ? 0.1 : -0.1, -0.2);
        this.timer = 0;
        startImageLoad("z");
    }
    
    update() {
        this.pos.add(this.v);
        this.timer++;
        if (this.timer > 80) {
            this.dead = true;
        }
    }
    
    render(ctx) {
        if (image.z) {
            ctx.drawImage(image.z, this.pos.x - 1.5, this.pos.y - 2.5);
        }
    }
}