const serverIp = window.location.hostname;
const ws = new WebSocket(`ws://${serverIp}:6567/ws`);
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let allPlayers = {};
let imprints = []; //only visual
let thisId = null;
const textS = 32;
const FPS = 120;
const controls = ["w", "a", "s", "d"];
const pressingKeys = {};
const canvasX = (canvas.getBoundingClientRect().left).toFixed(5);
const canvasY = (canvas.getBoundingClientRect().top).toFixed(5);
let cursorX = 0;
let cursorY = 0;
let UNIT = 50;
let globalBulletImprintC = 0;
const globalBulletImprintM = 3;
let allMap = [];

let mapWidth = 20;
let mapHeight = 10;


class Imprint {
    constructor(parent, lifetimeMinus) {
        this.x = parent.x;
        this.y = parent.y;
        this.size = parent.size;
        this.color = parent.color;
        this.alpha = 1;
        this.maxlifetime = 60;
        this.lifetime = this.maxlifetime - lifetimeMinus;
    }
}

function joinClick() {
    ws.send(JSON.stringify({
        type: "playerJoin",
        name: document.getElementById("playerName").value
    }));
}

function quitClick() {
    ws.send(JSON.stringify({
        type: "playerQuit"
    }));
}

function playerPush({players}) {
    allPlayers = players;
}

function wallPush({walls}) {
    
}

function playerAdded({id, player}) {
    allPlayers[id] = player;
}

function playerDel({id}) {
    delete allPlayers[id];
}
function IdSend({id}) {
    thisId = id;
}

function mapUpdate({width, height, map, serverUnit}) {
    UNIT = serverUnit;
    allMap = map;
    console.log(allMap);
    mapWidth = width;
    mapHeight = height;
    canvas.width = mapWidth * UNIT;
    canvas.height = mapHeight * UNIT;
}

function updatePlayerLoc({id, x, y}) {
    allPlayers[id].x = x;
    allPlayers[id].y = y;
}

function addedBullet({bullet, id}) {
    allPlayers[id].activeBullets.push(bullet);
}

function updatePlayerBullets({id, bullets}) {
    allPlayers[id].activeBullets = bullets;
}

function damagePlayer({id, amount}) {
    allPlayers[id].hp -= amount;
}

function damageWall({x, y, amount}) {
    allMap[y][x] -= amount;
}

function clientAlert({message}) {
    alert(message);
}

ws.onmessage = (message) => {
    let rawData = JSON.parse(message.data)
    window[rawData.type](rawData);
}
ws.close = () => {
    alert("Disconnected from server.")
}

function renderWalls() {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    for(let i = 0; i < allMap.length; i++) {
        for(let i2 = 0; i2 < allMap[i].length; i2++) {
            if(allMap[i][i2] == 0) continue;
            ctx.lineWidth = 3;
            ctx.fillStyle = "white";
            ctx.strokeRect(i2 * UNIT, i * UNIT, UNIT, UNIT);
            ctx.strokeRect(i2 * UNIT + 5, i * UNIT + 5, UNIT - 10, UNIT - 10);
            ctx.font = (textS - 5) + "px Arial";
            ctx.fillText(allMap[i][i2], i2 * UNIT + UNIT / 4, i * UNIT + UNIT  * 0.6);
        }
    }
}

function renderPlayers() {
    for(i in allPlayers) {
        ctx.strokeStyle = allPlayers[i].color;
        ctx.lineWidth = 8;
        ctx.strokeRect(allPlayers[i].x, allPlayers[i].y, allPlayers[i].size, allPlayers[i].size);
        ctx.font = textS + "px Arial";
        ctx.fillStyle = "lightgrey";
        ctx.fillText(allPlayers[i].hp, allPlayers[i].x, allPlayers[i].y + allPlayers[i].size);
        ctx.fillText(allPlayers[i].name, allPlayers[i].x, allPlayers[i].y);
    }
}

function generateImprints() {
    //players
    for(let i in allPlayers) {
        allPlayers[i].imprintCounter++;
        if(allPlayers[i].imprintCounter >= allPlayers[i].maxImprintCounter) {
            allPlayers[i].imprintCounter = 0;
            imprints.push(new Imprint(allPlayers[i], 0));
        }
    }
    //bullets
    globalBulletImprintC++;
    if(globalBulletImprintC >= globalBulletImprintM) {
        globalBulletImprintC = 0;
        for(let i in allPlayers) {
            for(let i2 = 0; i2 < allPlayers[i].activeBullets.length; i2++) {
               imprints.push(new Imprint(allPlayers[i].activeBullets[i2], 10)); 
            }
        }
    }
}

function renderBullets() {
    for(let i in allPlayers) {
        for(let i2 = 0; i2 < allPlayers[i].activeBullets.length; i2++) {
            let thisBullet = allPlayers[i].activeBullets[i2];
            ctx.strokeStyle = "white";
            ctx.lineWidth = 4;
            ctx.strokeRect(thisBullet.x, thisBullet.y,thisBullet.size, thisBullet.size);
        }
    }
}

function renderImprints() {
    for(let i = 0; i < imprints.length; i++) {
        imprints[i].lifetime--;
        imprints[i].alpha = imprints[i].lifetime / imprints[i].maxlifetime;
        if (imprints[i].lifetime <= 0) {
            imprints.splice(i, 1);
            i--;
            continue;
        }
        ctx.globalAlpha = imprints[i].alpha;
        ctx.fillStyle = imprints[i].color;
        ctx.strokeStyle = imprints[i].color;
        ctx.lineJoin = "bevel";
        ctx.lineWidth = 10;
        ctx.strokeRect(imprints[i].x, imprints[i].y, imprints[i].size, imprints[i].size);
        ctx.globalAlpha = 1;
    }
}

function reqBullet() {
    if(allPlayers[thisId] === undefined) return;
    ws.send(JSON.stringify({
        type: "updateMyBullets"
    }))
}

function handleInput() {
    if(allPlayers[thisId] === undefined) return;
    let direction = "";
    if(pressingKeys.w) {
        direction += "0";
    }
    if(pressingKeys.d) {
        direction += "1";
    }
    if(pressingKeys.s) {
        direction += "2";
    }
    if(pressingKeys.a) {
        direction += "3";
    }
    if(direction !== "") {
        ws.send(JSON.stringify({
            type: "playerMove",
            direction: direction
        }));
    }
}

window.onmousemove = function (e) {
    cursorX = (e.clientX - canvasX) / (canvas.getBoundingClientRect().right - canvasX) * parseFloat(canvas.width);
    cursorY = (e.clientY - canvasY) / (canvas.getBoundingClientRect().bottom - canvasY) * parseFloat(canvas.height);
}
canvas.onclick = function () {
    if (allPlayers[thisId] === undefined) return;
    let playerX = allPlayers[thisId].x + allPlayers[thisId].size / 2;
    let playerY = allPlayers[thisId].y + allPlayers[thisId].size / 2;
    const angle = Math.atan2(cursorY - playerY, cursorX - playerX) * 180 / Math.PI;
    ws.send(JSON.stringify({
        type: "spawnBullet",
        angle: angle
    }));
}

function tick() {
    handleInput();
    reqBullet();
    generateImprints();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderWalls();
    renderImprints();
    renderPlayers();
    renderBullets();
}

window.addEventListener("keydown", (e) => pressingKeys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => delete pressingKeys[e.key.toLowerCase()]);
window.setInterval("tick()", 1000 / FPS);