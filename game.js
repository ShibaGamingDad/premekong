// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas setup for Telegram (landscape, 672x500)
canvas.width = 672;
canvas.height = 500;

// Game state
let mario = {
    x: 50,
    y: 318,
    width: 32,
    height: 32,
    dx: 0,
    dy: 0,
    speed: 3,
    gravity: 0.5,
    jumping: false,
    onLadder: false,
    hasHammer: false,
    hammerTime: 0,
    frame: 0
};
let premekong = {
    x: 50,
    y: 36,
    width: 64,
    height: 64,
    bounceDir: 1,
    bounceRange: 20
};
let pauline = {
    x: 124,
    y: 68,
    width: 16,
    height: 32
};
let barrels = [], conveyors = [], elevators = [], springs = [], hammers = [], rivets = [], fireballs = [], ladders = [];
let score = 0, level = 1, gameActive = true, lives = 3, bonusTimer = 5000;
let perfectRunsToday = 0, lastPerfectRunTime = 0, premeEarned = 0, premeBurn = 0, jackpot = 0;
let backgrounds = [], platformImg = new Image(), ladderImg = new Image(), hammerImg = new Image(), barrelImg = new Image(),
    rivetImg = new Image(), fireballImg = new Image(), cementPieImg = new Image();

// Telegram setup
if (Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

// Utility functions
function updateScore() {
    document.getElementById('score').innerText = `Score: ${score} Lives: ${lives} Timer: ${Math.floor(bonusTimer / 60)} Jackpot: ${jackpot} $PREME Burn: ${premeBurn} Perfect: ${perfectRunsToday}/5 $PREME Earned: ${premeEarned}`;
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function levelUp() {
    level = level % 4 + 1;
    if (level === 1) resetGame();
    else {
        initLevel();
        score += 300;
        checkPerfectRun();
    }
}

function resetGame() {
    score = 0;
    level = 1;
    lives = 3;
    bonusTimer = 5000;
    mario.x = 50;
    mario.y = 318;
    mario.hasHammer = false;
    mario.hammerTime = 0;
    mario.onLadder = false;
    mario.dy = 0;
    premekong.x = 50;
    premekong.y = 36;
    pauline.x = 124;
    pauline.y = 68;
    barrels = [];
    conveyors = [];
    elevators = [];
    springs = [];
    hammers = [];
    rivets = [];
    fireballs = [];
    ladders = [];
    initLevel();
}

function checkPerfectRun() {
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (currentTime - lastPerfectRunTime > twentyFourHours) {
        perfectRunsToday = 0;
        lastPerfectRunTime = currentTime;
    }
    const noDamage = score >= (level === 4 ? 800 : 300);
    if ((level !== 4 && checkCollision(mario, pauline)) || (level === 4 && rivets.length === 0 && noDamage && perfectRunsToday < 5)) {
        perfectRunsToday++;
        premeEarned += 50;
        premeBurn += 0.5;
        jackpot += 10;
        alert(`Perfect Run! +50 $PREME, Jackpot: ${jackpot}`);
    }
}

// Load assets
function loadAssets() {
    mario.image = new Image();
    mario.image.src = 'mario.png';
    premekong.image = new Image();
    premekong.image.src = 'premekong.png';
    pauline.image = new Image();
    pauline.image.src = 'pauline.png';
    barrelImg.src = 'barrel.png';
    cementPieImg.src = 'cement_pie.png';
    let springImg = new Image(); springImg.src = 'spring.png';
    hammerImg.src = 'hammer.png';
    ladderImg.src = 'ladder.png';
    rivetImg.src = 'rivet.png';
    fireballImg.src = 'fireball.png';
    platformImg.src = 'platform.png';
    backgrounds[1] = new Image(); backgrounds[1].src = 'background1.png';
    backgrounds[2] = new Image(); backgrounds[2].src = 'background2.png';
    backgrounds[3] = new Image(); backgrounds[3].src = 'background3.png';
    backgrounds[4] = new Image(); backgrounds[4].src = 'background4.png';
}

// Initialize level
function initLevel() {
    barrels = [];
    conveyors = [];
    elevators = [];
    springs = [];
    hammers = [];
    rivets = [];
    fireballs = [];
    ladders = [];
    mario.x = 50;
    mario.y = 318;
    mario.hasHammer = false;
    mario.hammerTime = 0;
    mario.onLadder = false;
    mario.dy = 0;
    premekong.x = 50;
    premekong.y = 36;
    pauline.x = 124;
    pauline.y = 68;

    const platformY = [400, 300, 200, 100];
    if (level === 1) {
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 });
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 });
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
        hammers.push({ x: 250, y: platformY[1] - 32, width: 32, height: 32, taken: false });
    } else if (level === 2) {
        conveyors.push({ x: 0, y: platformY[3], width: canvas.width, height: 10, speed: 1 });
        conveyors.push({ x: 0, y: platformY[2], width: canvas.width, height: 10, speed: -1 });
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100, retractable: true });
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 });
        hammers.push({ x: 200, y: platformY[3] - 32, width: 32, height: 32, taken: false });
    } else if (level === 3) {
        elevators.push({ x: 150, y: 300, width: 40, height: 20, dy: 2, minY: 100, maxY: 400 });
        elevators.push({ x: 450, y: 200, width: 40, height: 20, dy: -2, minY: 100, maxY: 400 });
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 });
    } else if (level === 4) {
        conveyors.push({ x: 0, y: platformY[3], width: canvas.width, height: 10, speed: 2 });
        conveyors.push({ x: 0, y: platformY[2], width: canvas.width, height: 10, speed: -2 });
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 });
        hammers.push({ x: 200, y: platformY[3] - 32, width: 32, height: 32, taken: false });
        for (let i = 0; i < 16; i++) {
            rivets.push({ x: 50 + (i % 8) * 75, y: platformY[Math.floor(i / 4)] - 10, width: 20, height: 20, hit: false });
        }
    }
    updateScore();
}

// Draw game
function draw() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgrounds[level] && backgrounds[level].complete) ctx.drawImage(backgrounds[level], 0, 0, canvas.width, canvas.height);
    const platformY = [400, 300, 200, 100];
    if (platformImg.complete) platformY.forEach(py => ctx.drawImage(platformImg, 0, py, canvas.width, 10));
    else { ctx.fillStyle = 'red'; platformY.forEach(py => ctx.fillRect(0, py, canvas.width, 10)); }

    ctx.fillStyle = 'yellow';
    conveyors.forEach(c => ctx.fillRect(c.x, c.y, c.width, c.height));
    ctx.fillStyle = 'orange';
    elevators.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
    ladders.forEach(l => {
        if (!l.retractable || Math.sin(Date.now() / 1000) > 0) {
            if (ladderImg.complete) ctx.drawImage(ladderImg, l.x, l.y, l.width, l.height);
            else ctx.fillRect(l.x, l.y, l.width, l.height);
        }
    });
    hammers.forEach(h => { if (!h.taken && hammerImg.complete) ctx.drawImage(hammerImg, h.x, h.y, h.width, h.height); });
    rivets.forEach(r => { if (!r.hit && rivetImg.complete) ctx.drawImage(rivetImg, r.x, r.y, r.width, r.height); });
    fireballs.forEach(f => { if (fireballImg.complete) ctx.drawImage(fireballImg, f.x, f.y, 32, 32); });
    barrels.forEach(b => {
        if (b.type === 'cement_pie' && cementPieImg.complete) ctx.drawImage(cementPieImg, b.x, b.y, 32, 32);
        else if (b.type === 'spring' && b.springImg?.complete) ctx.drawImage(b.springImg, b.x, b.y, 32, 32);
        else if (barrelImg.complete) ctx.drawImage(barrelImg, b.x, b.y, 32, 32);
    });

    if (mario.image.complete) ctx.drawImage(mario.image, mario.frame * 32, 0, 32, 32, mario.x, mario.y, 32, 32);
    else { ctx.fillStyle = 'blue'; ctx.fillRect(mario.x, mario.y, mario.width, mario.height); }
    if (premekong.image.complete) ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);
    if (pauline.image.complete) ctx.drawImage(pauline.image, pauline.x, pauline.y, 32, pauline.height);
    else ctx.fillRect(pauline.x, pauline.y, 32, pauline.height);

    premekong.y += premekong.bounceDir * 0.125;
    if (premekong.y <= 36 - premekong.bounceRange || premekong.y >= 36 + premekong.bounceRange) premekong.bounceDir *= -1;

    requestAnimationFrame(draw);
}

// Update game logic
function update() {
    if (!gameActive) return;

    bonusTimer--;
    if (bonusTimer <= 0) {
        lives--;
        bonusTimer = 5000;
        if (lives <= 0) resetGame();
    }

    if (!mario.onLadder) {
        mario.dy += mario.gravity;
        mario.y += mario.dy;
        if (mario.jumping) { mario.dy = -10; mario.jumping = false; }
    }
    mario.x += mario.dx * mario.speed;
    if (mario.x < 0) mario.x = 0;
    if (mario.x + mario.width > canvas.width) mario.x = canvas.width - mario.width;

    const platformY = [400, 300, 200, 100];
    platformY.forEach(py => {
        if (mario.y + mario.height > py && mario.y + mario.height < py + 10 && mario.dy > 0 && !mario.onLadder) {
            mario.y = py - mario.height;
            mario.dy = 0;
        }
    });
    if (mario.y > canvas.height - mario.height) mario.y = canvas.height - mario.height;

    ladders.forEach(l => {
        if (checkCollision(mario, l) && (!l.retractable || Math.sin(Date.now() / 1000) > 0)) {
            mario.onLadder = true;
            mario.dy = Math.max(Math.min(mario.dy, 3), -3);
            mario.y += mario.dy;
            mario.x = l.x + (l.width - mario.width) / 2;
        } else if (!checkCollision(mario, l)) mario.onLadder = false;
    });

    // Limit barrels and fireballs to 5 each in Level 4
    if (level === 4 && barrels.length < 5 && Math.random() < 0.05) {
        let type = Math.random() < 0.33 ? 'barrel' : Math.random() < 0.66 ? 'cement_pie' : 'spring';
        barrels.push({ x: premekong.x + premekong.width, y: premekong.y + premekong.height, dx: 1.5, dy: 0, type, springImg: type === 'spring' ? new Image() : null });
        if (type === 'spring') barrels[barrels.length - 1].springImg.src = 'spring.png';
    } else if (Math.random() < 0.05) {
        let type = level === 1 ? 'barrel' : level === 2 ? 'cement_pie' : 'spring';
        barrels.push({ x: premekong.x + premekong.width, y: premekong.y + premekong.height, dx: 1.5, dy: 0, type, springImg: type === 'spring' ? new Image() : null });
        if (type === 'spring') barrels[barrels.length - 1].springImg.src = 'spring.png';
    }
    if (level === 4 && fireballs.length < 5 && Math.random() < 0.03) {
        fireballs.push({ x: premekong.x + premekong.width, y: premekong.y + premekong.height, dx: 2, dy: 0 });
    }

    barrels.forEach((b, i) => {
        b.x += b.dx;
        b.y += b.dy || mario.gravity;
        let onPlatform = false;
        platformY.forEach(py => {
            if (b.y + 32 > py && b.y + 32 < py + 10 && b.dy >= 0) {
                b.y = py - 32;
                b.dy = 0;
                onPlatform = true;
                conveyors.forEach(c => { if (b.y === c.y - 32) b.x += c.speed; });
            }
        });
        if (!onPlatform) b.dy += mario.gravity;
        if (b.type === 'spring' && Math.random() < 0.1) b.dy = Math.random() < 0.5 ? -10 : -5;
        if (b.x > canvas.width + 32 || b.y > canvas.height || b.x < -32) barrels.splice(i, 1); // Cull off-screen
        if (checkCollision(mario, b)) {
            if (mario.hasHammer) { barrels.splice(i, 1); score += 100; }
            else { score -= 10; barrels.splice(i, 1); if (score < 0) score = 0; }
        }
    });

    fireballs.forEach((f, i) => {
        f.x += f.dx;
        f.y += f.dy || mario.gravity;
        let onPlatform = false;
        platformY.forEach(py => {
            if (f.y + 32 > py && f.y + 32 < py + 10 && f.dy >= 0) {
                f.y = py - 32;
                f.dy = 0;
                onPlatform = true;
                f.dx = mario.x > f.x ? 1 : -1;
            }
        });
        if (!onPlatform) f.dy += mario.gravity;
        if (f.x > canvas.width + 32 || f.y > canvas.height || f.x < -32) fireballs.splice(i, 1); // Cull off-screen
        if (checkCollision(mario, f)) { score -= 20; fireballs.splice(i, 1); if (score < 0) score = 0; }
    });

    elevators.forEach(e => {
        e.y += e.dy;
        if (e.y <= e.minY || e.y >= e.maxY) e.dy *= -1;
        if (checkCollision(mario, e) && mario.y + mario.height <= e.y + e.height) mario.y = e.y - mario.height;
    });

    rivets.forEach((r, i) => {
        if (checkCollision(mario, r)) {
            r.hit = true;
            score += 50;
            rivets.splice(i, 1);
            if (level === 4 && rivets.length === 0) {
                console.log("All rivets collected, triggering cutscene"); // Debug log
                checkPerfectRun();
                gameActive = false;
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.fillText('Preme Kong Falls!', canvas.width / 2 - 50, canvas.height / 2);
                setTimeout(() => { resetGame(); gameActive = true; }, 3000); // Extended to 3s
            }
        }
    });

    // Only trigger level-up if not Level 4 and Mario is precisely on Pauline
    if (level !== 4 && checkCollision(mario, pauline) && mario.y + mario.height <= pauline.y + pauline.height && Math.abs(mario.x - pauline.x) < 10) {
        console.log("Level up triggered by Pauline collision"); // Debug log
        levelUp();
    }

    if (mario.hasHammer) {
        mario.hammerTime--;
        if (mario.hammerTime <= 0) mario.hasHammer = false;
    }
    hammers.forEach(h => {
        if (!h.taken && checkCollision(mario, h)) {
            h.taken = true;
            mario.hasHammer = true;
            mario.hammerTime = 300;
        }
    });

    updateScore();
}

// Controls
function moveLeft() { if (gameActive && !mario.hasHammer) mario.dx = -1; }
function moveRight() { if (gameActive && !mario.hasHammer) mario.dx = 1; }
function jump() { if (gameActive && !mario.jumping && !mario.onLadder && !mario.hasHammer) mario.jumping = true; }
function climbUp() { if (gameActive && mario.onLadder) mario.dy = -1; }
function climbDown() { if (gameActive && mario.onLadder) mario.dy = 1; }
function stopMove() { mario.dx = 0; }
function stopClimb() { mario.dy = 0; }

// Telegram sync (stub)
function syncWithTelegram() {
    if (Telegram.WebApp) {
        Telegram.WebApp.sendData(JSON.stringify({ score, perfectRunsToday, premeEarned, premeBurn, jackpot }));
    }
}
setInterval(syncWithTelegram, 60000);

// Start game
loadAssets();
initLevel();
let lastFrameTime = 0;
function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const delta = timestamp - lastFrameTime;
    if (delta > 16) { // Cap at ~60 FPS
        lastFrameTime = timestamp;
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
