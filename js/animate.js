class Track {
    constructor() {}
    update() {}
    getPosition() {return new Vector(0,0);}
    isDone() {return true;}
}

class LineTrack extends Track {
    constructor(start, end, speed, time) {
        super();
        this.start = start;
        this.along = end.minus(start);
        this.length = time ? time : speed/this.along.mag();
        this.time = 0;
    }
    
    update() {
        this.time++;
    }
    
    getPosition() {
        if (this.time >= this.length) {
            return this.start.plus(this.along);
        } else {
            return this.start.plus(this.along.times(this.time/this.length));
        }
    }
    
    isDone() {
        return (this.time >= this.length);
    }
}

class JumpTrack extends Track {
    constructor(start, end, time, gravity) {
        super();
        this.start = start;
        this.end = end;
        this.line = new LineTrack(start,end,0,time);
        this.hShift = -time/2;
        this.a = gravity/2;
        this.vShift = -this.a * this.hShift * this.hShift;
        this.time = 0;
    }
    
    update() {
        this.time++;
        this.line.update();
    }
    
    getPosition() {
        let v = this.line.getPosition();
        v.y += this.a * (this.time + this.hShift) * (this.time + this.hShift) + this.vShift;
        return v;
    }
    
    isDone() {
        return this.line.isDone();
    }
}

class StandWalkAnimation {
    constructor(stepLength, numSteps) {
        this.stepLength = stepLength;
        this.numSteps = numSteps;
        this.timer = 0;
        this.step = 0;
    }
    
    getStep() {
        return this.step;
    }
    
    reset() {
        this.timer = 0;
        this.step = 0;
    }
    
    increment() {
        if (this.timer-- <= 0) {
            this.step++;
            if (this.step > this.numSteps) this.step = 1;
            this.timer = this.stepLength;
        }
    }
}