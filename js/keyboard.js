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