const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let mario = { x: 50, y: canvas.height - 50, width: 32, height: 32, dx: 0, dy: 0, speed: 3, gravity: 0.5, jumping: false, onLadder: false, hasHammer: false, hammerTime: 0 };
let premekong = { x: canvas.width - 100, y: 50, width: 64, height: 64 };
let barrels = [];
let conveyors = [];
let elevators = [];
let springs = [];
let hammers = [];
let rivets = [];
let ladders = [];
let score = 0;
let level = 1;
let gameActive = true;
let backgrounds = [];

// Telegram setup
if (Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

// Load assets (sprites and backgrounds)
function loadAssets() {
    mario.image = new Image(); mario.image.src = 'mario.png';
    mario.hammerImage = new Image(); mario.hammerImage.src = 'mario_hammer.png';
    premekong.image = new Image(); premekong.image.src = 'premekong.png';
    const barrelImg = new Image(); barrelImg.src = 'barrel.png';
    const cementPieImg = new Image(); cementPieImg.src = 'cement_pie.png';
    const springImg = new Image(); springImg.src = 'spring.png';
    const hammerImg = new Image(); hammerImg.src = 'hammer.png';
    const ladderImg = new Image(); ladderImg.src = 'ladder.png';
    const rivetImg = new Image(); rivetImg.src = 'rivet.png';

    backgrounds[1] = new Image(); backgrounds[1].src = 'background1.png'; // Girders
    backgrounds[2] = new Image(); backgrounds[2].src = 'background2.png'; // Conveyors
    backgrounds[3] = new Image(); backgrounds[3].src = 'background3.png'; // Elevators
    backgrounds[4] = new Image(); backgrounds[4].src = 'background4.png'; // Rivets
}

// Initialize level
function initLevel() {
    barrels = [];
    conveyors = [];
    elevators = [];
    springs = [];
    hammers = [];
    rivets = [];
    ladders = [];
    mario.x = 50; mario.y = canvas.height - 50;
    mario.hasHammer = false; mario.hammerTime = 0;
    premekong.x = canvas.width - 100; premekong.y = 50;

    const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];

    if (level === 1) { // 25m - Girders
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 });
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 });
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
        hammers.push({ x: 250, y: platformY[1] - 32, width: 32, height: 32, taken: false });
    } else if (level === 2) { // 50m - Conveyors
        conveyors.push({ x: 0, y: platformY[1], width: canvas.width, height: 10, speed: 2 });
        conveyors.push({ x: 0, y: platformY[2], width: canvas.width, height: 10, speed: -2 });
        ladders.push({ x: 300, y: platformY[1] - 100, width: 20, height: 100 });
        ladders.push({ x: 350, y: platformY[2] - 100, width: 20, height: 100 });
        hammers.push({ x: 200, y: platformY[2] - 32, width: 32, height: 32, taken: false });
    } else if (level === 3) { // 75m - Elevators
        elevators.push({ x: 150, y: canvas.height - 200, width: 40, height: 20, dy: 2, minY: 100, maxY: canvas.height - 200 });
        elevators.push({ x: 450, y: 300, width: 40, height: 20, dy: -2, minY: 100, maxY: canvas.height - 200 });
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
    } else if (level === 4) { // 100m - Rivets
        for (let i = 0; i < 4; i++) {
            rivets.push({ x: 100 + i * 150, y: platformY[i] - 10, width: 20, height: 10, hit: false });
            rivets.push({ x: 150 + i * 150, y: platformY[i] - 10, width: 20, height: 10, hit: false });
        }
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 });
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 });
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
    }
    updateScore();
}

// Draw game
function draw() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (backgrounds[level] && backgrounds[level].complete) {
        ctx.drawImage(backgrounds[level], 0, 0, canvas.width, canvas.height);
    }

    // Draw platforms
    ctx.fillStyle = 'red';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(0, canvas.height - (i + 1) * 100, canvas.width, 10);
    }

    // Draw conveyors
    ctx.fillStyle = 'yellow';
    conveyors.forEach(conveyor => ctx.fillRect(conveyor.x, conveyor.y, conveyor.width, conveyor.height));

    // Draw elevators
    ctx.fillStyle = 'orange';
    elevators.forEach(elevator => ctx.fillRect(elevator.x, elevator.y, elevator.width, elevator.height));

    // Draw ladders
    ladders.forEach(ladder => {
        if (ladderImg.complete) ctx.drawImage(ladderImg, ladder.x, ladder.y, ladder.width, ladder.height);
        else ctx.fillRect(ladder.x, ladder.y, ladder.width, ladder.height);
    });

    // Draw hammers
    hammers.forEach(hammer => {
        if (!hammer.taken && hammerImg.complete) ctx.drawImage(hammerImg, hammer.x, hammer.y, hammer.width, hammer.height);
    });

    // Draw rivets
    rivets.forEach(rivet => {
        if (!rivet.hit && rivetImg.complete) ctx.drawImage(rivetImg, rivet.x, rivet.y, rivet.width, rivet.height);
    });

    // Draw Mario
    if (mario.hasHammer && mario.hammerImage.complete) ctx.drawImage(mario.hammerImage, mario.x, mario.y, mario.width, mario.height);
    else if (mario.image.complete) ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
    else ctx.fillRect(mario.x, mario.y, mario.width, mario.height);

    // Draw Preme Kong
    if (premekong.image.complete) ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);

    // Draw barrels, cement pies, springs
    barrels.forEach(barrel => {
        if (barrel.type === 'cement_pie' && cementPieImg.complete) ctx.drawImage(cementPieImg, barrel.x, barrel.y, 32, 32);
        else if (barrel.type === 'spring' && springImg.complete) ctx.drawImage(springImg, barrel.x, barrel.y, 32, 32);
        else if (barrelImg.complete) ctx.drawImage(barrelImg, barrel.x, barrel.y, 32, 32);
        else ctx.fillRect(barrel.x, barrel.y, 32, 32);
    });

    requestAnimationFrame(draw);
}

// Update game logic
function update() {
    if (!gameActive) return;

    // Mario physics
    if (!mario.onLadder) {
        mario.dy += mario.gravity;
        mario.y += mario.dy;
        if (mario.jumping) {
            mario.dy = -10;
            mario.jumping = false;
        }
    } else {
        mario.dy = 0;
    }
    mario.x += mario.dx * mario.speed;
    if (mario.onLadder) mario.y += mario.dy * mario.speed;

    // Platform collision
    const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];
    platformY.forEach(py => {
        if (mario.y + mario.height > py && mario.y + mario.height < py + 10 && mario.dy > 0 && !mario.onLadder) {
            mario.y = py - mario.height;
            mario.dy = 0;
        }
    });

    // Conveyor effect
    conveyors.forEach(conveyor => {
        if (checkCollision(mario, conveyor)) mario.x += conveyor.speed;
        barrels.forEach(barrel => {
            if (checkCollision(barrel, conveyor)) barrel.x += conveyor.speed;
        });
    });

    // Elevator movement and collision
    elevators.forEach(elevator => {
        elevator.y += elevator.dy;
        if (elevator.y <= elevator.minY || elevator.y >= elevator.maxY) elevator.dy *= -1;
        if (checkCollision(mario, elevator) && mario.dy >= 0) {
            mario.y = elevator.y - mario.height;
            mario.dy = elevator.dy;
        }
    });

    // Bounds
    mario.x = Math.max(0, Math.min(mario.x, canvas.width - mario.width));
    mario.y = Math.max(0, Math.min(mario.y, canvas.height - mario.height));

    // Hammer logic
    if (mario.hasHammer) {
        mario.hammerTime--;
        if (mario.hammerTime <= 0) mario.hasHammer = false;
    }
    hammers.forEach(hammer => {
        if (!hammer.taken && checkCollision(mario, hammer)) {
            hammer.taken = true;
            mario.hasHammer = true;
            mario.hammerTime = 300; // ~5 seconds at 60 FPS
        }
    });

    // Preme Kong throwing
    if (Math.random() < 0.02) {
        if (level === 1) barrels.push({ x: premekong.x, y: premekong.y + 64, dx: -2, dy: 0, type: 'barrel' });
        else if (level === 2) barrels.push({ x: premekong.x, y: premekong.y + 64, dx: -2, dy: 0, type: 'cement_pie' });
        else if (level === 3) barrels.push({ x: premekong.x, y: premekong.y + 64, dx: -4, dy: 0, type: 'spring' });
    }

    // Barrel/spring/cement pie movement
    barrels.forEach((barrel, i) => {
        barrel.x += barrel.dx;
        barrel.y += barrel.dy || 2;
        platformY.forEach(py => {
            if (barrel.y + 32 > py && barrel.y + 32 < py + 10) barrel.y = py - 32;
        });
        if (barrel.type === 'spring' && barrel.x < canvas.width - 100 && Math.random() < 0.1) barrel.dy = -10; // Spring bounce
        if (barrel.x < -32 || barrel.y > canvas.height) barrels.splice(i, 1);
        if (checkCollision(mario, barrel)) {
            if (mario.hasHammer) {
                barrels.splice(i, 1);
                score += 100;
            } else {
                score -= 10;
                barrels.splice(i, 1);
                if (score < 0) score = 0;
            }
        }
    });

    // Ladder and rivet interaction
    mario.onLadder = ladders.some(ladder => checkCollision(mario, ladder));
    rivets.forEach(rivet => {
        if (!rivet.hit && checkCollision(mario, rivet)) {
            rivet.hit = true;
            score += 50;
            if (level === 4 && rivets.every(r => r.hit)) {
                gameActive = false; // Win condition
                setTimeout(() => { level = 1; gameActive = true; initLevel(); }, 2000); // Restart after win
            }
        }
    });

    // Level completion (reach top except Level 4)
    if (level !== 4 && mario.y < 100 && Math.abs(mario.x - premekong.x) < 100) levelUp();

    updateScore();
}

// Collision detection
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Level progression
function levelUp() {
    level = level % 4 + 1;
    initLevel();
    score += 100;
}

// Update score
function updateScore() {
    const jackpot = 0; // Bot integration later
    const burn = 0;
    document.getElementById('score').innerText = `Score: ${score}  Jackpot: ${jackpot} $PREME  Burn This Month: ${burn} $PREME`;
}

// Controls
function moveLeft() { if (gameActive && !mario.hasHammer) mario.dx = -1; }
function moveRight() { if (gameActive && !mario.hasHammer) mario.dx = 1; }
function jump() { if (gameActive && !mario.jumping && !mario.onLadder && !mario.hasHammer) mario.jumping = true; }
function climbUp() { if (gameActive && mario.onLadder) mario.dy = -1; }
function climbDown() { if (gameActive && mario.onLadder) mario.dy = 1; }
function stopMove() { mario.dx = 0; }
function stopClimb() { mario.dy = 0; }

// Telegram data handler
function handleTelegramData() {
    if (Telegram && Telegram.WebApp) {
        Telegram.WebApp.onEvent('web_app_data', (data) => {
            if (data.data) {
                const gameData = JSON.parse(data.data);
                score = gameData.score || score;
                updateScore();
            }
        });
    }
}

// Start game
loadAssets();
initLevel();
setInterval(update, 1000 / 60);
draw();
handleTelegramData();
