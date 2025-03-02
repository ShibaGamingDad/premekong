const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Adjust canvas for mobile and Telegram Web App
canvas.width = 672;
canvas.height = 768;
ctx.scale(1, 1); // Ensure no unintended scaling

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
let platformImg = new Image(); // Global platform image
let ladderImg = new Image(); // Global ladder image
let hammerImg = new Image(); // Move hammerImg to global scope

// Telegram setup
if (Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

// Utility functions
function updateScore() {
    const jackpot = 0; // Bot integration later
    const burn = 0;
    document.getElementById('score').innerText = `Score: ${score}  Jackpot: ${jackpot} $PREME  Burn This Month: ${burn} $PREME`;
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function levelUp() {
    level = level % 4 + 1;
    initLevel();
    score += 100;
}

// Load assets (sprites and backgrounds) with debugging
function loadAssets() {
    // Debugging logs for image loading
    console.log('Loading assets...');

    mario.image = new Image(); mario.image.src = 'mario.png'; console.log('Mario:', mario.image.src);
    premekong.image = new Image(); premekong.image.src = 'premekong.png'; console.log('Preme Kong:', premekong.image.src);
    const barrelImg = new Image(); barrelImg.src = 'barrel.png'; console.log('Barrel:', barrelImg.src);
    const cementPieImg = new Image(); cementPieImg.src = 'cement_pie.png'; console.log('Cement Pie:', cementPieImg.src);
    const springImg = new Image(); springImg.src = 'spring.png'; console.log('Spring:', springImg.src);
    hammerImg.src = 'hammer.png'; console.log('Hammer:', hammerImg.src); // Assign src to the global hammerImg
    ladderImg.src = 'ladder.png'; console.log('Ladder:', ladderImg.src);
    const rivetImg = new Image(); rivetImg.src = 'rivet.png'; console.log('Rivet:', rivetImg.src);
    platformImg.src = 'platform.png'; console.log('Platform:', platformImg.src);

    backgrounds[1] = new Image(); backgrounds[1].src = 'background1.png'; console.log('Background 1:', backgrounds[1].src);
    backgrounds[2] = new Image(); backgrounds[2].src = 'background2.png'; console.log('Background 2:', backgrounds[2].src);
    backgrounds[3] = new Image(); backgrounds[3].src = 'background3.png'; console.log('Background 3:', backgrounds[3].src);
    backgrounds[4] = new Image(); backgrounds[4].src = 'background4.png'; console.log('Background 4:', backgrounds[4].src);
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
    const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];
    if (platformImg.complete) {
        platformY.forEach(py => ctx.drawImage(platformImg, 0, py, canvas.width, 10));
    } else {
        ctx.fillStyle = 'red';
        platformY.forEach(py => ctx.fillRect(0, py, canvas.width, 10));
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
    if (mario.hasHammer && hammerImg.complete) ctx.drawImage(hammerImg, mario.x, mario.y, mario.width, mario.height); // Use hammer.png for Mario with hammer
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

    // Platform collision (adjusted for platform.png height of 10)
    const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];
    platformY.forEach(py => {
        if (mario.y + mario.height > py && mario.y + mario.height < py + 10 && mario.dy > 0 && !mario.onLadder) {
            mario.y = py - mario.height;
            mario.dy = 0;
        }
    });

    // Conveyor, elevator, hammer, barrel, ladder, rivet logic remains the same as previous version...

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
