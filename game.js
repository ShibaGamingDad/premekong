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
    console.log('Telegram WebApp initialized');
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

// Load images with detailed error handling
function loadImages() {
    const images = {
        mario: new Image(),
        premekong: new Image(),
        barrel: new Image()
    };

    images.mario.src = 'mario.png';
    images.mario.onerror = () => {
        console.error('Mario image failed to load, using fallback');
        mario.image = null; // Use fallback rectangle
    };
    images.mario.onload = () => console.log('Mario image loaded successfully');

    images.premekong.src = 'premekong.png';
    images.premekong.onerror = () => {
        console.error('Preme Kong image failed to load, using fallback');
        premekong.image = null; // Use fallback rectangle
    };
    images.premekong.onload = () => console.log('Preme Kong image loaded successfully');

    images.barrel.src = 'barrel.png';
    images.barrel.onerror = () => {
        console.error('Barrel image failed to load, using fallback');
        barrels.forEach(barrel => barrel.image = null); // Use fallback rectangle
    };
    images.barrel.onload = () => {
        console.log('Barrel image loaded successfully');
        barrels.forEach(barrel => barrel.image = images.barrel);
    };

    mario.image = images.mario;
    premekong.image = images.premekong;
}

// Initialize levels (4 levels with ladders and rivets)
function initLevel() {
    ladders = [];
    rivets = [];
    const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];
    for (let i = 0; i < 4; i++) {
        ladders.push({ x: 300, y: platformY[i] - 50, width: 50, height: 100 });
        for (let j = 0; j < 5; j++) {
            rivets.push({ x: 100 + j * 100, y: platformY[i] + 10, width: 20, height: 10, hit: false });
        }
    }
    mario.y = canvas.height - 50;
    premekong.y = 50;
    barrels = [];
    score = 0;
    updateScore();
    console.log('Level initialized');
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
    if (mario.image && mario.image.complete) ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
    else {
        ctx.fillStyle = 'white';
        ctx.fillRect(mario.x, mario.y, mario.width, mario.height); // Fallback
        console.log('Using fallback for Mario');
    }
    
    // Draw Preme Kong
    if (premekong.image && premekong.image.complete) ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);
    else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(premekong.x, premekong.y, premekong.width, premekong.height); // Fallback
        console.log('Using fallback for Preme Kong');
    }
    
    // Draw barrels
    ctx.fillStyle = 'brown';
    barrels.forEach(barrel => {
        if (barrel.image && barrel.image.complete) ctx.drawImage(barrel.image, barrel.x, barrel.y, 32, 32);
        else ctx.fillRect(barrel.x, barrel.y, 32, 32); // Fallback
        console.log('Drawing barrel:', barrel.x, barrel.y);
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
    
    // Keep Mario in bounds and apply gravity
    mario.x = Math.max(0, Math.min(mario.x, canvas.width - mario.width));
    if (!mario.onLadder && mario.y < canvas.height - mario.height) mario.y += 5; // Gravity
    
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
    console.log('Game updated, Mario at:', mario.x, mario.y);
}

// Check collision
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Level up (cycle through 4 levels)
function levelUp() {
    level = (level % 4) + 1;
    initLevel();
    score += 100;
    console.log('Level up to:', level);
}

// Update score display
function updateScore() {
    const jackpot = 0; // Update via bot later
    const burn = 0; // Update via bot later
    document.getElementById('score').innerText = `Score: ${score}  Jackpot: ${jackpot} $PREME  Burn This Month: ${burn} $PREME`;
    console.log('Score updated:', score);
}

// Control functions
function moveLeft() { if (gameActive) mario.dx = -1; console.log('Moving left'); }
function moveRight() { if (gameActive) mario.dx = 1; console.log('Moving right'); }
function jump() { if (gameActive && !mario.jumping && !mario.onLadder) mario.jumping = true; console.log('Jumping'); }
function climbUp() { if (gameActive && mario.onLadder) mario.dy = -1; console.log('Climbing up'); }
function climbDown() { if (gameActive && mario.onLadder) mario.dy = 1; console.log('Climbing down'); }
function stopMove() { mario.dx = 0; console.log('Stopped moving'); }
function stopClimb() { mario.dy = 0; console.log('Stopped climbing'); }

// Handle Telegram Web App data (for bot integration)
function handleTelegramData() {
    if (Telegram && Telegram.WebApp) {
        console.log('Handling Telegram WebApp data...');
        Telegram.WebApp.onEvent('web_app_data', (data) => {
            console.log('Received web app data:', data);
            if (data.data) {
                try {
                    const gameData = JSON.parse(data.data);
                    score = gameData.score || score;
                    updateScore();
                    Telegram.WebApp.sendData(JSON.stringify({ score, perfectRun: score >= 400 }));
                    console.log('Sent Telegram data:', { score, perfectRun: score >= 400 });
                } catch (error) {
                    console.error('Error parsing Telegram data:', error);
                }
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
console.log('Game initialized');
