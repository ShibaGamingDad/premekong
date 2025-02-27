const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let mario = { x: 50, y: canvas.height - 50, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false };
let premekong = { x: canvas.width - 100, y: 50, width: 64, height: 64, dropping: true };
let barrels = [];
let fireballs = [];
let hammers = [];
let pauline = { x: canvas.width - 50, y: canvas.height - 450, width: 32, height: 32, captured: false };
let score = 0;
let level = 1;
let rivets = [];
let ladders = [];
let platforms = [];
let gameActive = true;

const Telegram = window.Telegram;
if (Telegram && Telegram.WebApp) {
    console.log('Telegram WebApp initialized');
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

// Load all images with detailed error handling
function loadImages() {
    const images = {
        mario: new Image(),
        premekong: new Image(),
        barrel: new Image(),
        fireball: new Image(),
        hammer: new Image(),
        pauline: new Image(),
        ladder: new Image(),
        platform: new Image(),
        rivet: new Image()
    };

    images.mario.src = 'mario.png';
    images.mario.onerror = () => { console.error('Mario image failed'); mario.image = null; };
    images.mario.onload = () => console.log('Mario loaded');

    images.premekong.src = 'premekong.png';
    images.premekong.onerror = () => { console.error('Preme Kong image failed'); premekong.image = null; };
    images.premekong.onload = () => console.log('Preme Kong loaded');

    images.barrel.src = 'barrel.png';
    images.barrel.onerror = () => { console.error('Barrel image failed'); barrels.forEach(b => b.image = null); };
    images.barrel.onload = () => { barrels.forEach(b => b.image = images.barrel); console.log('Barrel loaded'); };

    images.fireball.src = 'fireball.png';
    images.fireball.onerror = () => { console.error('Fireball image failed'); fireballs.forEach(f => f.image = null); };
    images.fireball.onload = () => { fireballs.forEach(f => f.image = images.fireball); console.log('Fireball loaded'); };

    images.hammer.src = 'hammer.png';
    images.hammer.onerror = () => { console.error('Hammer image failed'); hammers.forEach(h => h.image = null); };
    images.hammer.onload = () => { hammers.forEach(h => h.image = images.hammer); console.log('Hammer loaded'); };

    images.pauline.src = 'pauline.png';
    images.pauline.onerror = () => { console.error('Pauline image failed'); pauline.image = null; };
    images.pauline.onload = () => console.log('Pauline loaded');

    images.ladder.src = 'ladder.png';
    images.ladder.onerror = () => { console.error('Ladder image failed'); ladders.forEach(l => l.image = null); };
    images.ladder.onload = () => { ladders.forEach(l => l.image = images.ladder); console.log('Ladder loaded'); };

    images.platform.src = 'platform.png';
    images.platform.onerror = () => { console.error('Platform image failed'); platforms.forEach(p => p.image = null); };
    images.platform.onload = () => { platforms.forEach(p => p.image = images.platform); console.log('Platform loaded'); };

    images.rivet.src = 'rivet.png';
    images.rivet.onerror = () => { console.error('Rivet image failed'); rivets.forEach(r => r.image = null); };
    images.rivet.onload = () => { rivets.forEach(r => r.image = images.rivet); console.log('Rivet loaded'); };

    mario.image = images.mario;
    premekong.image = images.premekong;
    pauline.image = images.pauline;
}

// Initialize levels with all elements
function initLevel() {
    ladders = [];
    rivets = [];
    platforms = [];
    const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];
    for (let i = 0; i < 4; i++) {
        platforms.push({ x: 0, y: platformY[i], width: canvas.width, height: 10, image: null });
        ladders.push({ x: 300, y: platformY[i] - 50, width: 50, height: 100, image: null });
        for (let j = 0; j < 5; j++) {
            rivets.push({ x: 100 + j * 100, y: platformY[i] + 10, width: 20, height: 10, hit: false, image: null });
        }
    }
    mario.y = canvas.height - 50;
    premekong.y = 50;
    barrels = [];
    fireballs = [];
    hammers = [];
    score = 0;
    updateScore();
    console.log('Level initialized with all elements');
}

// Draw game elements
function draw() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw platforms
    ctx.fillStyle = 'red';
    platforms.forEach(platform => {
        if (platform.image && platform.image.complete) ctx.drawImage(platform.image, platform.x, platform.y, platform.width, platform.height);
        else ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
    
    // Draw ladders
    ctx.fillStyle = 'brown';
    ladders.forEach(ladder => {
        if (ladder.image && ladder.image.complete) ctx.drawImage(ladder.image, ladder.x, ladder.y, ladder.width, ladder.height);
        else ctx.fillRect(ladder.x, ladder.y, ladder.width, ladder.height);
    });
    
    // Draw rivets
    ctx.fillStyle = 'gray';
    rivets.forEach(rivet => {
        if (!rivet.hit && rivet.image && rivet.image.complete) ctx.drawImage(rivet.image, rivet.x, rivet.y, rivet.width, rivet.height);
        else if (!rivet.hit) ctx.fillRect(rivet.x, rivet.y, rivet.width, rivet.height);
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
    
    // Draw barrels, fireballs, hammers
    ctx.fillStyle = 'brown';
    barrels.forEach(barrel => {
        if (barrel.image && barrel.image.complete) ctx.drawImage(barrel.image, barrel.x, barrel.y, 32, 32);
        else ctx.fillRect(barrel.x, barrel.y, 32, 32);
        console.log('Drawing barrel:', barrel.x, barrel.y);
    });
    ctx.fillStyle = 'red';
    fireballs.forEach(fireball => {
        if (fireball.image && fireball.image.complete) ctx.drawImage(fireball.image, fireball.x, fireball.y, 32, 32);
        else ctx.fillRect(fireball.x, fireball.y, 32, 32);
    });
    ctx.fillStyle = 'gray';
    hammers.forEach(hammer => {
        if (hammer.image && hammer.image.complete) ctx.drawImage(hammer.image, hammer.x, hammer.y, 32, 32);
        else ctx.fillRect(hammer.x, hammer.y, 32, 32);
    });
    
    // Draw Pauline
    if (pauline.image && pauline.image.complete) ctx.drawImage(pauline.image, pauline.x, pauline.y, pauline.width, pauline.height);
    else {
        ctx.fillStyle = 'pink';
        ctx.fillRect(pauline.x, pauline.y, pauline.width, pauline.height); // Fallback
        console.log('Using fallback for Pauline');
    }
    
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
    
    // Preme Kong dropping and throwing barrels/fireballs
    if (premekong.dropping) {
        premekong.y += 2;
        if (premekong.y > canvas.height - 100) premekong.y = 50; // Reset to top
        if (Math.random() < 0.01) {
            barrels.push({ x: premekong.x, y: premekong.y, dx: -2, image: new Image() });
            barrels[barrels.length - 1].image.src = 'barrel.png';
        }
        if (Math.random() < 0.005) { // Less frequent fireballs
            fireballs.push({ x: premekong.x, y: premekong.y, dx: -3, image: new Image() });
            fireballs[fireballs.length - 1].image.src = 'fireball.png';
        }
    }
    
    // Hammers (spawn randomly as power-ups)
    if (Math.random() < 0.002) { // Rare hammers
        hammers.push({ x: Math.random() * (canvas.width - 32), y: Math.random() * (canvas.height - 32), dx: 0, image: new Image() });
        hammers[hammers.length - 1].image.src = 'hammer.png';
    }
    
    // Barrels, fireballs, hammers movement and collision
    [barrels, fireballs, hammers].forEach(items => {
        items.forEach((item, i) => {
            item.x += item.dx;
            if (item.x < -32 || item.x > canvas.width) items.splice(i, 1);
            if (checkCollision(mario, item)) {
                if (item === barrels[0] || item === fireballs[0]) score -= 10; // Damage
                else if (item === hammers[0]) { score += 50; items.splice(i, 1); } // Power-up
                if (score < 0) score = 0;
                if (item === barrels[0] || item === fireballs[0]) items.splice(i, 1);
            }
        });
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
    
    // Pauline interaction (optional, for level completion)
    if (checkCollision(mario, pauline) && !pauline.captured) {
        pauline.captured = true;
        score += 1000;
        levelUp();
        console.log('Pauline rescued, level up!');
    }
    
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
