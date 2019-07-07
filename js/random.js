function randomChance(p) {
    return Math.random() < p;
}

function randInt(min, max) {
    return Math.floor((max - min) * Math.random()) + min;
}

function randFloat(min, max) {
    return (max - min) * Math.random() + min;
}

function permute(list) {
    list.sort(function(a,b) {return Math.random()-0.5});
}

function sampleNoReplace(list) {
    let i = randInt(0,list.length);
    let temp = list[i];
    list[i] = list[list.length-1];
    list.pop();
    return temp;
}