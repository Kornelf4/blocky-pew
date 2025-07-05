import { networkInterfaces } from 'node:os';

let players = {};
let map = [];
let dieCounter = {};
const configObj = JSON.parse(await Bun.file("gameRuleConfig.json").text());
const {newMapMode, playerHP, wallHP, bulletDamage, playerSpeed, bulletSpeed, targetFPS, maxPlayers, mapHeight, mapWidth, wallsNum, UNIT} = configObj;
console.log(newMapMode);
const randomBetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
function getMinDieCount() {
    return Object.keys(dieCounter).reduce((key, v) => dieCounter[v] < dieCounter[key] ? v : key);
}
function checkAABBCollision(obj1, obj2) {
    if(obj1 == obj2) return false;
    if (obj1 === undefined || obj2 === undefined) return false;
    if(obj1.size !== undefined) {
        return obj1.x < obj2.x + obj2.size &&
        obj1.x + obj1.size > obj2.x &&
        obj1.y < obj2.y + obj2.size &&
        obj1.y + obj1.size > obj2.y;
    }
    return obj1.x < obj2.x + obj2.xsize &&
        obj1.x + obj1.xsize > obj2.x &&
        obj1.y < obj2.y + obj2.ysize &&
        obj1.y + obj1.ysize > obj2.y;
}
function mapOverlap(obj, XChange, YChange) {
    if(obj.y <= 0 && YChange < 0) return false;
    if(obj.y >= (mapHeight - 1) * UNIT && YChange > 0) return false;
    if(obj.x <= 0 && XChange < 0) return false;
    if(obj.x >= (mapWidth - 1) * UNIT && XChange < 0) return false;
    if(obj.x % UNIT == 0 && obj.y % UNIT == 0) {
        if(XChange > 0) {
            return map[obj.y / UNIT][obj.x / UNIT + 1] > 0;
        } 
        if(XChange < 0) {
            return map[obj.y / UNIT][obj.x / UNIT - 1] > 0;
        }
        if(YChange > 0) {
            return map[obj.y / UNIT + 1][obj.x / UNIT] > 0;
        }
        if(YChange < 0) {
            return map[obj.y / UNIT - 1][obj.x / UNIT] > 0;
        }
    } else if(obj.x % UNIT == 0) {
        if(obj.y <= 0) return true;
        if(obj.y >= (mapHeight - 1) * UNIT) return true;
        if(XChange > 0) {
            return map[Math.floor(obj.y / UNIT)][obj.x / UNIT + 1] > 0 ||
                map[Math.floor(obj.y / UNIT) + 1][obj.x / UNIT + 1] > 0;
        } 
        if(XChange < 0) {
            return map[Math.floor(obj.y / UNIT)][obj.x / UNIT - 1] > 0 ||
                map[Math.floor(obj.y / UNIT) + 1][obj.x / UNIT - 1] > 0;
        }
    } else if(obj.y % UNIT == 0) {
        if(YChange > 0) {
            return map[obj.y / UNIT + 1][Math.floor(obj.x / UNIT)] > 0 ||
                map[obj.y / UNIT + 1][Math.floor(obj.x / UNIT) + 1] > 0;
        } 
        if(YChange < 0) {
            return map[obj.y / UNIT - 1][Math.floor(obj.x / UNIT)] > 0 ||
                map[obj.y / UNIT - 1][Math.floor(obj.x / UNIT) + 1] > 0;
        }
    }
    return false;
}
function pointMapOverlap(obj) {
    if(map[Math.floor((obj.y + obj.size / 2) / UNIT)][Math.floor((obj.x + obj.size / 2) / UNIT)] > 0) {
        return {x: Math.floor((obj.x + obj.size / 2) / UNIT), y: Math.floor((obj.y + obj.size / 2) / UNIT)}
    } else {
        return false;
    }
}
function getLocalIP() {
    const nets = networkInterfaces();
    const ips = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                ips.push(net.address);
            }
        }
    }
    return ips[0];
}
function generate2DArray(rows, columns) {
    const array = [];
    for (let i = 0; i < rows; i++) {
        array[i] = [];
        for (let j = 0; j < columns; j++) {
            array[i][j] = 0;
        }
    }
    return array;
}
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}
function createMap() {
    map = generate2DArray(mapHeight, mapWidth);
    let pointerX = 0;
    let pointerY = 0;
    for (let i = 0; i < wallsNum; i++) {
        let rnd = getRndInteger(0, 5);
        if (rnd == 0 && pointerX < mapWidth - 1) {
            pointerX++;
        }
        if (rnd == 1 && pointerX > 0) {
            pointerX--;
        }
        if (rnd == 2 && pointerY < mapHeight - 1) {
            pointerY++;
        }
        if (rnd == 3 && pointerY > 0) {
            pointerY--;
        }
        if (rnd == 4) {
            pointerX = getRndInteger(0, mapWidth);
            pointerY = getRndInteger(0, mapHeight);
        }
        map[pointerY][pointerX] = wallHP;
        map[mapHeight - pointerY - 1][mapWidth - pointerX - 1] = wallHP;
        map[mapHeight - pointerY - 1][pointerX] = wallHP;
        map[pointerY][mapWidth - pointerX - 1] = wallHP;
    }
}

createMap();
class Player {
    constructor(name) {
        this.name = name;
        this.color = `rgb(${randomBetween(0, 255)},${randomBetween(0, 255)},${randomBetween(0, 255)})`;
        while(true) {
            this.x = getRndInteger(0, mapWidth);
            this.y = getRndInteger(0, mapHeight);
            //idk
            if(map[this.y][this.x] <= 0) {
                break;
            }
        }

        this.x *= UNIT;
        this.y *= UNIT;
        this.size = UNIT;
        this.hp = playerHP;
        this.speed = playerSpeed;
        this.activeBullets = [];
        this.imprintCounter = 0;
        this.maxImprintCounter = 2;
        this.randomPos = () => {
            while(true) {
                this.x = getRndInteger(0, mapWidth);
                this.y = getRndInteger(0, mapHeight);
                //idk
                if(map[this.y][this.x] <= 0) {
                    break;
                }
            }

            this.x *= UNIT;
            this.y *= UNIT;
        }
    }
}
class Bullet {
    constructor(parentId, angle) {
        this.angle = angle;
        this.parentId = parentId;
        this.size = 6;
        this.x = players[parentId].x + (players[parentId].size / 2) - (this.size / 2);
        this.y = players[parentId].y + (players[parentId].size / 2) - (this.size / 2);
        this.color = players[parentId].color;
        this.speed = bulletSpeed;
        this.vx = this.speed * Math.cos(this.angle * Math.PI / 180);
        this.vy = this.speed * Math.sin(this.angle * Math.PI / 180);
        this.warpCounter = 0;
        this.maxWarpCount = 1;
        this.imprintCounter = 0;
        this.maxImprintCounter = 1;
    }
}

const server = Bun.serve({
    port: 6567,
    hostname: getLocalIP(),
    async fetch(req, server) {
        const url = new URL(req.url);
        server.upgrade(req);
        if (url.pathname === "/" || url.pathname === "public/index.html") {
            const file = Bun.file("public/index.html");
            if (await file.exists()) {
                return new Response(file);
            }
            return new Response("Not Found", { status: 404 });
        }
        const filePath = `.${url.pathname}`;
        const file = Bun.file(filePath);
        
        if (await file.exists()) {
            return new Response(file);
        }
        return new Response(Bun.file("public/index.html"));
    },
    websocket: {
        message(ws, message) {
            let rawData = JSON.parse(message);
            if(rawData.type == "playerJoin") {
                if(Object.keys(players).length >= maxPlayers) return;
                if(rawData.name == "") return;
                players[ws.id] = new Player(rawData.name);
                if(dieCounter[rawData.name] === undefined) dieCounter[rawData.name] = 0;
                server.publish("clients", JSON.stringify({
                    type: "playerAdded",
                    id: ws.id,
                    player: players[ws.id]
                }))
            }
            if(rawData.type == "playerQuit") {
                delete players[ws.id];
                server.publish("clients", JSON.stringify({
                    type: "playerDel",
                    id: ws.id
                }))
            }
            if(rawData.type == "playerMove") {
                if(players[ws.id] === undefined) return;

                if(rawData.direction.includes("0") && !mapOverlap(players[ws.id], 0, -players[ws.id].speed)) {
                    
                    players[ws.id].y -= players[ws.id].speed;
                }
                if(rawData.direction.includes("1") && !mapOverlap(players[ws.id], players[ws.id].speed, 0)) {
                    players[ws.id].x += players[ws.id].speed;
                }
                if(rawData.direction.includes("2") && !mapOverlap(players[ws.id], 0, players[ws.id].speed)) {
                    players[ws.id].y += players[ws.id].speed;
                }
                if(rawData.direction.includes("3") && !mapOverlap(players[ws.id], -players[ws.id].speed, 0)) {
                    players[ws.id].x -= players[ws.id].speed;
                }

                if(players[ws.id].x + players[ws.id].size > mapWidth * UNIT) {
                    players[ws.id].x = 0;
                }
                if(players[ws.id].x < 0) {
                    players[ws.id].x = mapWidth * UNIT - players[ws.id].size;
                }
                if(players[ws.id].y < 0) {
                    players[ws.id].y = mapHeight * UNIT - players[ws.id].size;
                }
                if(players[ws.id].y + players[ws.id].size > mapHeight * UNIT) {
                    players[ws.id].y = 0;
                }
                server.publish("clients", JSON.stringify({
                    type: "updatePlayerLoc",
                    id: ws.id,
                    x: players[ws.id].x,
                    y: players[ws.id].y
                }))
            }
            if(rawData.type == "spawnBullet") {
                if(players[ws.id] === undefined) return;
                players[ws.id].activeBullets.push(new Bullet(ws.id, rawData.angle));
                server.publish("clients", JSON.stringify({
                    type: "addedBullet",
                    bullet: new Bullet(ws.id, rawData.angle),
                    id: ws.id
                }))
            }
            if(rawData.type == "updateMyBullets") {
                if(players[ws.id] === undefined) return;
                for(let i = 0; i < players[ws.id].activeBullets.length; i++) {
                    players[ws.id].activeBullets[i].x += players[ws.id].activeBullets[i].vx;
                    players[ws.id].activeBullets[i].y += players[ws.id].activeBullets[i].vy;

                    if(players[ws.id].activeBullets[i].x + players[ws.id].activeBullets[i].size > mapWidth * UNIT) {
                        if(players[ws.id].activeBullets[i].warpCounter == players[ws.id].activeBullets[i].maxWarpCount) {
                            players[ws.id].activeBullets.splice(i, 1);
                            i--;
                            continue;
                        } else {
                            players[ws.id].activeBullets[i].warpCounter++;
                            players[ws.id].activeBullets[i].x = 0;
                        }
                    }
                    if(players[ws.id].activeBullets[i].x < 0) {
                        if(players[ws.id].activeBullets[i].warpCounter == players[ws.id].activeBullets[i].maxWarpCount) {
                            players[ws.id].activeBullets.splice(i, 1);
                            i--;
                            continue;
                        } else {
                            players[ws.id].activeBullets[i].warpCounter++;
                            players[ws.id].activeBullets[i].x = mapWidth * UNIT - players[ws.id].activeBullets[i].size;
                        }
                    }
                    if(players[ws.id].activeBullets[i].y < 0) {
                        if(players[ws.id].activeBullets[i].warpCounter == players[ws.id].activeBullets[i].maxWarpCount) {
                            players[ws.id].activeBullets.splice(i, 1);
                            i--;
                            continue;
                        } else {
                            players[ws.id].activeBullets[i].warpCounter++;
                            players[ws.id].activeBullets[i].y = mapHeight * UNIT - players[ws.id].activeBullets[i].size;
                        }
                    }
                    if(players[ws.id].activeBullets[i].y + players[ws.id].activeBullets[i].size > mapHeight * UNIT) {
                        if(players[ws.id].activeBullets[i].warpCounter == players[ws.id].activeBullets[i].maxWarpCount) {
                            players[ws.id].activeBullets.splice(i, 1);
                            i--;
                            continue;
                        } else {
                            players[ws.id].activeBullets[i].warpCounter++;
                            players[ws.id].activeBullets[i].y = 0;
                        }
                    }
                    for(let i2 in players) {
                        if(i2 == ws.id) continue;
                        if(checkAABBCollision(players[ws.id].activeBullets[i], players[i2])) {
                            players[i2].hp--;
                            if(players[i2].hp <= 0) {
                                dieCounter[players[i2].name]++;
                                console.log(dieCounter);
                                server.publish("clients", JSON.stringify({
                                    type: "playerDel",
                                    id: i2
                                }));
                            } else {
                                server.publish("clients", JSON.stringify({
                                    type: "damagePlayer",
                                    amount: bulletDamage,
                                    id: i2
                                }));
                            }
                            players[ws.id].activeBullets.splice(i, 1);
                            i--;
                        }
                    }
                    let newBuf = {};
                    let del = false;
                    for(let i2 in players) {
                        if(players[i2].hp > 0) {
                            newBuf[i2] = players[i2];
                        } else {
                            del = true;
                        }
                    }
                    if(del && Object.keys(newBuf).length == 1 && newMapMode == "eliminate") {
                        server.publish("clients", JSON.stringify({
                            type: "clientAlert",
                            message: `${newBuf[Object.keys(newBuf)[0]].name} won. Everyone else died. New round.`
                        }))
                        createMap();
                        server.publish("clients", JSON.stringify({
                            type: "mapUpdate",
                            width: mapWidth,
                            height: mapHeight,
                            serverUnit: UNIT,
                            map: map
                        }));
                        newBuf[Object.keys(newBuf)[0]].randomPos();
                        newBuf[Object.keys(newBuf)[0]].hp = playerHP;
                        dieCounter = {};
                    }
                    players = newBuf;
                }
                for(let i = 0; i < players[ws.id].activeBullets.length; i++) {
                    let checkRes = pointMapOverlap(players[ws.id].activeBullets[i]);
                    if(checkRes !== false) {
                        map[checkRes.y][checkRes.x]--;
                        server.publish("clients", JSON.stringify({
                            type: "damageWall",
                            x: checkRes.x,
                            y: checkRes.y,
                            amount: 1
                        }));
                        players[ws.id].activeBullets.splice(i, 1);
                        i--;
                        if(newMapMode == "mapclear" && JSON.stringify(map) == JSON.stringify(generate2DArray(mapHeight, mapWidth))) {
                            server.publish("clients", JSON.stringify({
                                type: "clientAlert",
                                message: `${getMinDieCount()} won, died the least number of times. New round.`
                            }));
                            dieCounter = {};
                            createMap();
                            server.publish("clients", JSON.stringify({
                                type: "mapUpdate",
                                width: mapWidth,
                                height: mapHeight,
                                serverUnit: UNIT,
                                map: map
                            }));
                            for(i in players) {
                                players[i].randomPos();
                                players[i].hp = playerHP;
                                dieCounter[players[i].name] = 0;
                            }
                        }
                    }
                }
                server.publish("clients", JSON.stringify({
                    type: "updatePlayerBullets",
                    id: ws.id,
                    bullets: players[ws.id].activeBullets
                }))
            }
        },
        open(ws) {
            ws.subscribe("clients");
            ws.id = crypto.randomUUID();
            ws.send(JSON.stringify({
                type: "IdSend",
                id: ws.id
            }));
            ws.send(JSON.stringify({
                type: "playerPush",
                players: players
            }));
            ws.send(JSON.stringify({
                type: "mapUpdate",
                width: mapWidth,
                height: mapHeight,
                serverUnit: UNIT,
                map: map
            }));
        },
        close(ws, code, message) {
            if(players[ws.id] !== undefined) {
                server.publish("clients", JSON.stringify({
                    type: "playerDel",
                    id: ws.id
                }))
                delete players[ws.id];
            }
        },
        drain(ws) {},
    },
});
console.log(`Server is running on: http://${getLocalIP()}:6567`);