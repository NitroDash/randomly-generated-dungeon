class TextButton {
    constructor(x,y,w,h,text,action) {
        this.box = new RectHitbox(x - w/2, y, x + w/2, y + h);
        this.textPos = new Vector(x,y + h * 0.8);
        this.textSize = h * 0.6 / 5;
        this.text = text;
        this.onClick = action;
    }
    
    render(ctx) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(this.box.p1.x,this.box.p1.y,this.box.p2.x - this.box.p1.x, this.box.p2.y - this.box.p1.y);
        ctx.fillStyle = "#000";
        ctx.fillRect(this.box.p1.x + 1,this.box.p1.y + 1,this.box.p2.x - this.box.p1.x - 2, this.box.p2.y - this.box.p1.y - 2);
        drawString(ctx,[this.text],this.textPos.x,this.textPos.y,"center",this.textSize,0);
    }
}

class Menu {
    constructor(elements) {
        this.elements = elements;
    }
    
    update() {
        if (m.clicked[0]) {
            let loc = pixelToGame(m.x,m.y);
            let hit = new PointHitbox(loc.x, loc.y, 0);
            this.elements.forEach(el => {
                if (el.box && el.box.intersectsPoint(hit)) el.onClick();
            });
        }
    }
    
    render(ctx) {
        this.elements.forEach(el => {el.render(ctx);});
    }
}

function makeMenu(menu) {
    switch (menu) {
        case "gameOver":
            return new Menu([new TextButton(ROOM_PIXEL_WIDTH/2,ROOM_PIXEL_HEIGHT*0.1,ROOM_PIXEL_WIDTH,ROOM_PIXEL_HEIGHT*0.3,"game over",function() {}),new TextButton(ROOM_PIXEL_WIDTH/2,ROOM_PIXEL_HEIGHT*2/3,ROOM_PIXEL_WIDTH*0.4,ROOM_PIXEL_HEIGHT*0.1,"play again",function() {setupNewGame(); generateFloor(0,initFloor); stopCutscene();})]);
        default:
            return null;
    }
}