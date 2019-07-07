class Camera {
    constructor() {}
    getPosition() {}
    update() {}
    nextCamera() {return this;}
}

class StaticCamera extends Camera {
    constructor(x,y) {
        super();
        this.x = x;
        this.y = y;
    }
    
    getPosition() {
        return new Vector(this.x, this.y);
    }
}

class RoomCenterCamera extends StaticCamera {
    constructor() {
        super(ROOM_WIDTH * 8, ROOM_HEIGHT * 8);
    }
}

class RoomTransitionCamera extends Camera {
    constructor(dx,dy) {
        super();
        this.dx = dx;
        this.dy = dy;
        this.x = 0;
        this.y = 0;
        this.timer = 30;
        this.moving = false;
    }
    
    update() {
        if (this.moving) {
            this.x += 3 * this.dx;
            this.y += 3 * this.dy;
            if (Math.abs(this.x) > ROOM_WIDTH * 16 || Math.abs(this.y) > ROOM_HEIGHT * 16) {
                this.x = ROOM_WIDTH * 16 * this.dx;
                this.y = ROOM_HEIGHT * 16 * this.dy;
                this.moving = false;
                this.timer = 30;
            }
        } else if (--this.timer < 0) {
            if (this.x == 0 && this.y == 0) {
                this.moving = true;
            } else {
                stopRoomTransition();
            }
        } else {
            if (this.x == 0 && this.y == 0) {
                roomTransition.newRoomOpacity = (30-this.timer)/30;
                roomTransition.fadedRoom = "new";
            } else {
                roomTransition.newRoomOpacity = this.timer/30;
                roomTransition.fadedRoom = "old";
            }
        }
    }
    
    getPosition() {
        return new Vector(this.x + ROOM_WIDTH * 8 - this.dx * ROOM_PIXEL_WIDTH, this.y + ROOM_HEIGHT * 8 - this.dy * ROOM_PIXEL_HEIGHT);
    }
    
    nextCamera() {
        if (this.timer < 0 && !this.moving) {
            return new RoomCenterCamera();
        } else {
            return this;
        }
    }
}