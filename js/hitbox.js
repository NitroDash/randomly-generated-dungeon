class Hitbox {
    constructor() {}
    
    intersects(other) {return false;}
    intersectsRect(other) {return false;}
    intersectsPoint(other) {return false;}
    ejectVector(other) {return null;}
    getEjected(other) {return null;}
    ejectVectorRect(other) {return null;}
    knockbackVector() {return null;}
    
    translate(x,y) {}
    
    render(ctx) {}
}

class RectHitbox extends Hitbox {
    constructor(x1,y1,x2,y2) {
        super();
        this.p1 = new Vector(x1,y1);
        this.p2 = new Vector(x2,y2);
    }
    
    intersects(other) {
        return other.intersectsRect(this);
    }
    
    intersectsRect(other) {
        return this.p1.x < other.p2.x && this.p2.x > other.p1.x && this.p1.y < other.p2.y && this.p2.y > other.p1.y;
    }
    
    intersectsPoint(other) {
        return this.p1.x < other.pos.x && this.p2.x > other.pos.x && this.p1.y < other.pos.y && this.p2.y > other.pos.y;
    }
    
    translate(x,y) {
        let v = new Vector(x,y);
        this.p1.add(v);
        this.p2.add(v);
    }
    
    getEjected(other) {
        return other.ejectVectorRect(this);
    }
    
    render(ctx) {
        ctx.fillStyle = "#f00";
        ctx.globalAlpha = 0.5;
        ctx.fillRect(this.p1.x,this.p1.y,this.p2.x-this.p1.x,this.p2.y-this.p1.y);
        ctx.globalAlpha = 1;
    }
}

class HitboxCollection extends Hitbox {
    constructor(boxes) {
        super();
        this.boxes = boxes;
    }
    
    intersects(other) {
        for (let i = 0; i < this.boxes.length; i++) {
            if (this.boxes[i].intersects(other)) return true;
        }
        return false;
    }
    
    intersectsRect(other) {
        for (let i = 0; i < this.boxes.length; i++) {
            if (this.boxes[i].intersectsRect(other)) return true;
        }
        return false;
    }
    
    intersectsPoint(other) {
        for (let i = 0; i < this.boxes.length; i++) {
            if (this.boxes[i].intersectsPoint(other)) return true;
        }
        return false;
    }
    
    translate(x,y) {
        for (let i = 0; i < this.boxes.length; i++) {
            this.boxes[i].translate(x,y);
        }
    }
    
    knockbackVector() {
        for (let i = 0; i < this.boxes.length; i++) {
            let v = this.boxes[i].knockbackVector();
            if (v) return v;
        }
        return null;
    }
    
    render(ctx) {
        for (let i = 0; i < this.boxes.length; i++) {
            this.boxes[i].render(ctx);
        }
    }
    
    getEjected(other) {
        for (let i = 0; i < this.boxes.length; i++) {
            let v = this.boxes[i].getEjected(other);
            if (v) return v;
        }
        return null;
    }
}

class HorizontalLineHitbox extends Hitbox {
    constructor(x1,x2,y,ejectUp) {
        super();
        this.x1 = x1;
        this.x2 = x2;
        this.y = y;
        this.ejectUp = ejectUp;
    }
    
    ejectVectorRect(other) {
        if (other.p1.x >= this.x2 || other.p2.x <= this.x1 || other.p1.y >= this.y || other.p2.y <= this.y) return null;
        if (this.ejectUp) {
            return new Vector(0, this.y - other.p2.y);
        } else {
            return new Vector(0, this.y - other.p1.y);
        }
    }
}

class VerticalLineHitbox extends Hitbox {
    constructor(x, y1, y2, ejectLeft) {
        super();
        this.x = x;
        this.y1 = y1;
        this.y2 = y2;
        this.ejectLeft = ejectLeft;
    }
    
    ejectVectorRect(other) {
        if (other.p1.x >= this.x || other.p2.x <= this.x || other.p1.y >= this.y2 || other.p2.y <= this.y1) return null;
        if (this.ejectLeft) {
            return new Vector(this.x - other.p2.x, 0);
        } else {
            return new Vector(this.x - other.p1.x, 0);
        }
    }
}

class PointHitbox extends Hitbox {
    constructor(x,y,ejectAngle) {
        super();
        this.pos = new Vector(x,y);
        if (ejectAngle) this.knockback = new Vector(Math.cos(ejectAngle), Math.sin(ejectAngle));
    }
    
    intersects(other) {
        return other.intersectsPoint(this);
    }
    
    intersectsRect(other) {
        return other.intersectsPoint(this);
    }
    
    intersectsPoint(other) {
        return this.pos.minus(other.pos).mag() < 0.1;
    }
    
    ejectVectorRect(other) {
        if (!this.intersectsRect(other)) return null;
    }
    
    knockbackVector() {
        return this.knockback ? this.knockback.copy() : null;
    }
    
    render(ctx) {
        ctx.fillStyle = "#f00";
        ctx.globalAlpha = 0.5;
        ctx.fillRect(this.pos.x-1,this.pos.y-1,2,2);
        ctx.globalAlpha = 1;
    }
}