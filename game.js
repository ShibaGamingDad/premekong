const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let mario = { x: 50, y: canvas.height - 50, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false, speed: 3, gravity: 0.5, jumpHeight: 0 };
let premekong = { x: canvas.width - 100, y: 50, width: 64, height: 64, throwing: true };
let barrels = [];
let conveyors = []; // New: Conveyor belts
let score = 0;
let level = 1;
let rivets = [];
let ladders = [];
let gameActive = true;

// Telegram initialization
if (Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

// Load images
function loadImages() {
    mario.image = new Image();
    mario.image.src = 'mario.png';
    premekong.image = new Image();
    premekong.image.src = 'premekong.png';
    const barrelImg = new Image();
    barrelImg.src = 'barrel.png';
    barrels.forEach(barrel => barrel.image = barrelImg);
}

// Initialize level with platforms, ladders, rivets, and conveyors
function initLevel() {
    ladders = [];
    rivets = [];
    conveyors = [];
    const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];

    if (level === 1) { // Girders (like Donkey Kong 25m)
        ladders.push({ x: 300, y: platformY[0] - 100, width: 20, height: 100 });
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 });
        for (let i = 0; i < 4; i++) {
            rivets.push({ x: 100 + i * 150, y: platformY[i] - 10, width: 20, height: 10, hit: false });
        }
    } else if (level === 2) { // Conveyors (like Donkey Kong 50m)
        conveyors.push({ x: 0, y: platformY[1], width: canvas.width, height: 10, speed: 2 });
        conveyors.push({ x: 0, y: platformY[2], width: canvas.width, height: 10, speed: -2 });
        ladders.push({ x: 300, y: platformY[1] - 100, width: 20, height: 100 });
        ladders.push({ x: 350, y: platformY[2] - 100, width: 20, height: 100 });
        for (let i = 0; i < 4; i++) {
            rivets.push({ x: 100 + i * 150, y: platformY[i] - 10, width: 20, height: 10, hit: false });
        }
    } // Add more levels (e.g., elevators, rivet stage) as desired

    mario.x = 50;
    mario.y = canvas.height - 50;
    premekong.x = canvas.width - 100;
    premekong.y = 50;
    barrels = [];
    updateScore();
}

// Draw game elements
function draw() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    ctx.fillStyle = 'red';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(0, canvas.height - (i + 1) * 100, canvas.width, 10);
    }

    // Draw conveyors
    ctx.fillStyle = 'yellow';
    conveyors.forEach(conveyor => ctx.fillRect(conveyor.x, conveyor.y, conveyor.width, conveyor.height));

    // Draw ladders
    ctx.fillStyle = 'brown';
    ladders.forEach(ladder => ctx.fillRect(ladder.x, ladder.y, ladder.width, ladder.height));

    // Draw rivets
    ctx.fillStyle = 'gray';
    rivets.forEach(rivet => {
        if (!rivet.hit) ctx.fillRect(rivet.x, rivet.y, rivet.width, rivet.height);
    });

    // Draw Mario
    if (mario.image.complete) ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
    else ctx.fillRect(mario.x, mario.y, mario.width, mario.height);

    // Draw Preme Kong
    if (premekong.image.complete) ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);

    // Draw barrels
    barrels.forEach(barrel => {
        if (barrel.image && barrel.image.complete) ctx.drawImage(barrel.image, barrel.x, barrel.y, 32, 32);
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
            mario.dy = -10; // Jump velocity
            mario.jumping = false;
        }
    } else {
        mario.dy = 0; // No gravity on ladder
    }
    mario.x += mario.dx * mario.speed;
    if (mario.onLadder) mario.y += mario.dy * mario.speed;

    // Conveyor effect
    conveyors.forEach(conveyor => {
        if (checkCollision(mario, conveyor)) {
            mario.x += conveyor.speed;
        }
    });

    // Platform collision
    const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];
    platformY.forEach(py => {
        if (mario.y + mario.height > py && mario.y + mario.height < py + 10 && mario.dy > 0 && !mario.onLadder) {
            mario.y = py - mario.height;
            mario.dy = 0;
        }
    });

    // Bounds
    mario.x = Math.max(0, Math.min(mario.x, canvas.width - mario.width));
    mario.y = Math.max(0, Math.min(mario.y, canvas.height - mario.height));

    // Preme Kong barrel throwing
    if (premekong.throwing && Math.random() < 0.02) {
        barrels.push({ x: premekong.x, y: premekong.y + premekong.height, dx: -2, image: new Image() });
        barrels[barrels.length - 1].image.src = 'barrel.png';
    }

    // Barrel movement and collision
    barrels.forEach((barrel, i) => {
        barrel.x += barrel.dx;
        barrel.y += 2; // Gravity for barrels
        platformY.forEach(py => {
            if (barrel.y + 32 > py && barrel.y + 32 < py + 10) barrel.y = py - 32;
        });
        if (barrel.x < -32 || barrel.y > canvas.height) barrels.splice(i, 1);
        if (checkCollision(mario, barrel)) {
            score -= 10;
            barrels.splice(i, 1);
            if (score < 0) score = 0;
        }
    });

    // Ladder and rivet interaction
    mario.onLadder = ladders.some(ladder => checkCollision(mario, ladder));
    rivets.forEach(rivet => {
        if (!rivet.hit && checkCollision(mario, rivet)) {
            rivet.hit = true;
            score += 50;
            if (rivets.every(r => r.hit)) levelUp();
        }
    });

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
    level = (level % 4) + 1;
    initLevel();
    score += 100;
}

// Update score display
function updateScore() {
    const jackpot = 0; // Placeholder for bot update
    const burn = 0; // Placeholder for bot update
    document.getElementById('score').innerText = `Score: ${score}  Jackpot: ${jackpot} $PREME  Burn This Month: ${burn} $PREME`;
}

// Controls
function moveLeft() { if (gameActive) mario.dx = -1; }
function moveRight() { if (gameActive) mario.dx = 1; }
function jump() { if (gameActive && !mario.jumping && !mario.onLadder) mario.jumping = true; }
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
loadImages();
initLevel();
setInterval(update, 1000 / 60);
draw();
handleTelegramData();
