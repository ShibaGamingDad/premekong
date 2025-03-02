const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let mario = { x: 50, y: canvas.height - 50, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false };
let premekong = { x: canvas.width - 100, y: 50, width: 64, height: 64, dropping: true };
let barrels = [];
let score = 0;
let level = 1;
let rivets = [];
let ladders = [];
let gameActive = true;

const Telegram = window.Telegram;
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
    // Ensure all images are lowercase, in GitHub Pages root
}

// Initialize levels (4 levels, each with ladders and rivets)
function initLevel() {
    ladders = [];
    rivets = [];
    const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];
    for (let i = 0; i < 4; i++) {
        // Ladders (e.g., at x=300, width=50, on each platform)
        ladders.push({ x: 300, y: platformY[i] - 50, width: 50, height: 100 });
        // Rivets (e.g., 5 per level, spaced across platform)
        for (let j = 0; j < 5; j++) {
            rivets.push({ x: 100 + j * 100, y: platformY[i] + 10, width: 20, height: 10, hit: false });
        }
    }
    mario.y = canvas.height - 50; // Reset Mario
    premekong.y = 50; // Reset Preme Kong
    barrels = []; // Clear barrels
    score = 0;
    updateScore();
}

// Draw game elements
function draw() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw levels (platforms)
    ctx.fillStyle = 'red';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(0, canvas.height - (i + 1) * 100, canvas.width, 10);
    }
    
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
    
    // Draw Preme Kong
    if (premekong.image.complete) ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);
    
    // Draw barrels
    ctx.fillStyle = 'brown';
    barrels.forEach(barrel => {
        if (barrel.image && barrel.image.complete) ctx.drawImage(barrel.image, barrel.x, barrel.y, 32, 32);
        else ctx.fillRect(barrel.x, barrel.y, 32, 32);
    });
    
    updateScore();
    requestAnimationFrame(draw);
}

// Update game logic
function update() {
    if (!gameActive) return;
    
    // Mario movement
    if (mario.dx) mario.x += mario.dx * 5;
    if (mario.dy && mario.onLadder) mario.y += mario.dy * 5;
    if (mario.jumping) {
        mario.y -= 10;
        if (mario.y <= canvas.height - 150) mario.jumping = false; // Stop jumping at platform height
    }
    
    // Keep Mario in bounds
    mario.x = Math.max(0, Math.min(mario.x, canvas.width - mario.width));
    mario.y = Math.max(0, Math.min(mario.y, canvas.height - mario.height));
    
    // Preme Kong dropping and barrel throwing
    if (premekong.dropping) {
        premekong.y += 2;
        if (premekong.y > canvas.height - 100) premekong.y = 50; // Reset to top
        if (Math.random() < 0.01) {
            barrels.push({ x: premekong.x, y: premekong.y, dx: -2, image: new Image() });
            barrels[barrels.length - 1].image.src = 'barrel.png';
        }
    }
    
    // Barrels movement and collision
    barrels.forEach((barrel, i) => {
        barrel.x += barrel.dx;
        if (barrel.x < -32) barrels.splice(i, 1);
        if (checkCollision(mario, barrel)) {
            score -= 10;
            barrels.splice(i, 1);
            if (score < 0) score = 0;
        }
    });
    
    // Ladder and rivet interaction
    mario.onLadder = ladders.some(ladder => mario.x < ladder.x + ladder.width && mario.x + mario.width > ladder.x && mario.y < ladder.y + ladder.height && mario.y + mario.height > ladder.y);
    rivets.forEach(rivet => {
        if (!rivet.hit && checkCollision(mario, rivet)) {
            rivet.hit = true;
            score += 50;
            if (rivets.every(r => r.hit)) levelUp();
        }
    });
}

// Check collision
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Level up (simple example, cycle through 4 levels)
function levelUp() {
    level = (level % 4) + 1;
    initLevel();
    score += 100;
}

// Update score display
function updateScore() {
    const jackpot = 0; // Update via bot later
    const burn = 0; // Update via bot later
    document.getElementById('score').innerText = `Score: ${score}  Jackpot: ${jackpot} $PREME  Burn This Month: ${burn} $PREME`;
}

// Control functions
function moveLeft() { if (gameActive) mario.dx = -1; }
function moveRight() { if (gameActive) mario.dx = 1; }
function jump() { if (gameActive && !mario.jumping && !mario.onLadder) mario.jumping = true; }
function climbUp() { if (gameActive && mario.onLadder) mario.dy = -1; }
function climbDown() { if (gameActive && mario.onLadder) mario.dy = 1; }
function stopMove() { mario.dx = 0; }
function stopClimb() { mario.dy = 0; }

// Handle Telegram Web App data (for bot integration)
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

// Initialize game
loadImages();
initLevel();
setInterval(update, 1000/60);
draw();
handleTelegramData();
