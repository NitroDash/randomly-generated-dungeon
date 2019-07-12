function keyboard(keyCode) {
  var key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
    key.onPress=null;
  //The `downHandler`
  key.downHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
        key.isPressed=true;
      key.isUp = false;
        if (key.onPress!=null) {
            key.onPress();
        }
        event.preventDefault();
    }
  };

  //The `upHandler`
  key.upHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
        event.preventDefault();
    }
  };
    
    key.resetPress=function() {
        this.isPressed=false;
    }

  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );
  return key;
}

function keyGroup(key1,key2) {
    var key={};
    key.one=keyboard(key1);
    key.two=keyboard(key2);
    key.isDown=function() {
        return (this.one.isDown||this.two.isDown);
    }
    key.isPressed=function() {
        return (this.one.isPressed||this.two.isPressed);
    }
    key.isUp=function() {
        return !this.isDown();
    }
    key.resetPress=function() {
        this.one.resetPress();
        this.two.resetPress();
    }
    return key;
}

function mouse() {
    var m = {};
    m.x = 0;
    m.y = 0;
    m.down = [];
    m.clicked = [];
    m.updatePosition = function(evt) {
        this.x = evt.clientX;
        this.y = evt.clientY;
        evt.preventDefault();
    }
    m.click = function(evt) {
        this.down[evt.button] = true;
        this.clicked[evt.button] = true;
        evt.preventDefault();
        return false;
    }
    m.up = function(evt) {
        this.down[evt.button] = false;
        evt.preventDefault();
        return false;
    }
    m.resetClicked = function() {
        this.clicked = [];
    }
    window.addEventListener("mousemove", m.updatePosition.bind(m), false);
    window.addEventListener("mousedown", m.click.bind(m), false);
    window.addEventListener("mouseup", m.up.bind(m), false);
    window.addEventListener("contextmenu", event => event.preventDefault(), false);
    return m;
}

function touch(canvas) {
    var t = {};
    t.touches = [];
    
    t.touch = function(evt) {
        evt.preventDefault();
        touchMode = true;
        for (let i = 0; i < evt.changedTouches.length; i++) {
            let newTouch = evt.changedTouches.item(i);
            this.touches.push({id: newTouch.identifier, x: newTouch.clientX, y: newTouch.clientY, isNew: true});
        }
    }
    
    t.move = function(evt) {
        evt.preventDefault();
        for (let j = 0; j < evt.changedTouches.length; j++) {
            let newTouch = evt.changedTouches.item(j);
            for (let i = 0; i < this.touches.length; i++) {
                if (this.touches[i].id == newTouch.identifier) {
                    this.touches[i].x = newTouch.clientX;
                    this.touches[i].y = newTouch.clientY;
                    break;
                }
            }
        }
    }
    
    t.end = function(evt) {
        evt.preventDefault();
        for (let j = 0; j < evt.changedTouches.length; j++) {
            let endTouch = evt.changedTouches.item(j);
            for (let i = 0; i < this.touches.length; i++) {
                if (this.touches[i].id == endTouch.identifier) {
                    this.touches.splice(i,1);
                    break;
                }
            }
        }
    }
    
    canvas.addEventListener("touchstart", t.touch.bind(t), false);
    canvas.addEventListener("touchmove", t.move.bind(t), false);
    canvas.addEventListener("touchend", t.end.bind(t), false);
    canvas.addEventListener("touchcancel", t.end.bind(t), false);
    
    return t;
}

var newClicks = [];
var movementDir = null;
var touchMode = false;