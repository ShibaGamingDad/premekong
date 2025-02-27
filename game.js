const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Debug canvas setup
if (!canvas) {
    console.error('Canvas not found! Check index.html for <canvas id="gameCanvas">');
} else {
    console.log('Canvas found, setting size:', 672, 'x', 768);
    canvas.width = 672; // Match your HTML's width
    canvas.height = 768; // Match your HTML's height
}

let mario = { x: 50, y: canvas.height - 50, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false };
let premekong = { x: canvas.width - 100, y: 50, width: 64, height: 64, dropping: true }; // Ensure Preme Kong is on the right
let barrels = [];
let score = 0;
let level = 1;
let rivets = [];
let ladders = [];
let platforms = [];
let gameActive = true;

// Load images with fallbacks and debug
function loadImages() {
    console.log('Loading images...');
    mario.image = new Image();
    mario.image.src = 'mario.png';
    mario.image.onload = () => console.log('Mario image loaded at:', mario.image.src);
    mario.image.onerror = () => { console.error('Mario image failed to load at:', mario.image.src); mario.image = null; };

    premekong.image = new Image();
    premekong.image.src = 'premekong.png';
    premekong.image.onload = () => console.log('Preme Kong image loaded at:', premekong.image.src);
    premekong.image.onerror = () => { console.error('Preme Kong image failed to load at:', premekong.image.src); premekong.image = null; };

    const barrelImg = new Image();
    barrelImg.src = 'barrel.png';
    barrelImg.onload = () => console.log('Barrel image loaded at:', barrelImg.src);
    barrelImg.onerror = () => console.error('Barrel image failed to load at:', barrelImg.src);

    const ladderImg = new Image();
    ladderImg.src = 'ladder.png';
    ladderImg.onload = () => console.log('Ladder image loaded at:', ladderImg.src);
    ladderImg.onerror = () => console.error('Ladder image failed to load at:', ladderImg.src);

    const platformImg = new Image();
    platformImg.src = 'platform.png';
    platformImg.onload = () => console.log('Platform image loaded at:', platformImg.src);
    platformImg.onerror = () => console.error('Platform image failed to load at:', platformImg.src);

    const rivetImg = new Image();
    rivetImg.src = 'rivet.png';
    rivetImg.onload = () => console.log('Rivet image loaded at:', rivetImg.src);
    rivetImg.onerror = () => console.error('Rivet image failed to load at:', rivetImg.src);

    platforms.forEach(platform => platform.image = platformImg || null);
    ladders.forEach(ladder => ladder.image = ladderImg || null);
    rivets.forEach(rivet => rivet.image = rivetImg || null);
    barrels.forEach(barrel => barrel.image = barrelImg || null);
}

// Initialize levels with all elements, adjusted for better platform alignment
function initLevel() {
    console.log('Initializing level with canvas size:', canvas.width, 'x', canvas.height);
    platforms = [];
    ladders = [];
    rivets = [];
    const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];
    for (let i = 0; i < 4; i++) {
        platforms.push({ x: 0, y: platformY[i], width: canvas.width, height: 20, image: null });
        ladders.push({ x: 300, y: platformY[i] - 50, width: 50, height: 100, image: null });
        for (let j = 0; j < 5; j++) {
            rivets.push({ x: 100 + j * 100, y: platformY[i] + 10, width: 20, height: 10, hit: false, image: null });
        }
    }
    mario.y = canvas.height - 50; // Ensure Mario starts on the bottom platform
    premekong.y = 50;
    premekong.x = canvas.width - 100; // Ensure Preme Kong is on the right
    console.log('Preme Kong position:', premekong.x, premekong.y);
    barrels = [];
    score = 0;
    updateScore();
}

// Draw game elements with debug
function draw() {
    if (!gameActive) return;
    console.log('Drawing frame, Mario at:', mario.x, mario.y, 'Preme Kong at:', premekong.x, premekong.y);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw platforms
    console.log('Drawing platforms, count:', platforms.length);
    ctx.fillStyle = 'red';
    platforms.forEach(platform => {
        if (platform.image && platform.image.complete) {
            console.log('Drawing platform image at:', platform.x, platform.y);
            ctx.drawImage(platform.image, platform.x, platform.y, platform.width, platform.height);
        } else {
            console.log('Drawing platform fallback at:', platform.x, platform.y);
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
    });
    
    // Draw ladders
    console.log('Drawing ladders, count:', ladders.length);
    ctx.fillStyle = 'brown';
    ladders.forEach(ladder => {
        if (ladder.image && ladder.image.complete) {
            console.log('Drawing ladder image at:', ladder.x, ladder.y);
            ctx.drawImage(ladder.image, ladder.x, ladder.y, ladder.width, ladder.height);
        } else {
            console.log('Drawing ladder fallback at:', ladder.x, ladder.y);
            ctx.fillRect(ladder.x, ladder.y, ladder.width, ladder.height);
        }
    });
    
    // Draw rivets
    console.log('Drawing rivets, count:', rivets.length);
    ctx.fillStyle = 'gray';
    rivets.forEach(rivet => {
        if (!rivet.hit && rivet.image && rivet.image.complete) {
            console.log('Drawing rivet image at:', rivet.x, rivet.y);
            ctx.drawImage(rivet.image, rivet.x, rivet.y, rivet.width, rivet.height);
        } else if (!rivet.hit) {
            console.log('Drawing rivet fallback at:', rivet.x, rivet.y);
            ctx.fillRect(rivet.x, rivet.y, rivet.width, rivet.height);
        }
    });
    
    // Draw Mario
    console.log('Drawing Mario at:', mario.x, mario.y);
    if (mario.image && mario.image.complete) {
        console.log('Drawing Mario image at:', mario.x, mario.y);
        ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
    } else {
        console.log('Drawing Mario fallback at:', mario.x, mario.y);
        ctx.fillStyle = 'white';
        ctx.fillRect(mario.x, mario.y, mario.width, mario.height); // Fallback
    }
    
    // Draw Preme Kong
    console.log('Drawing Preme Kong at:', premekong.x, premekong.y);
    if (premekong.image && premekong.image.complete) {
        console.log('Drawing Preme Kong image at:', premekong.x, premekong.y);
        ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);
    } else {
        console.log('Drawing Preme Kong fallback at:', premekong.x, premekong.y);
        ctx.fillStyle = 'blue';
        ctx.fillRect(premekong.x, premekong.y, premekong.width, premekong.height); // Fallback
    }
    
    // Draw barrels
    console.log('Drawing barrels, count:', barrels.length);
    ctx.fillStyle = 'brown';
    barrels.forEach(barrel => {
        if (barrel.image && barrel.image.complete) {
            console.log('Drawing barrel image at:', barrel.x, barrel.y);
            ctx.drawImage(barrel.image, barrel.x, barrel.y, 32, 32);
        } else {
            console.log('Drawing barrel fallback at:', barrel.x, barrel.y);
            ctx.fillRect(barrel.x, barrel.y, 32, 32);
        }
    });
    
    updateScore();
}

// Update game logic with improved platform collision and barrel direction
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
    if (!mario.onLadder && !mario.jumping) {
        mario.y += 5; // Gravity
        let onPlatform = false;
        platforms.forEach(platform => {
            if (checkCollision(mario, platform) && mario.y + mario.height <= platform.y + 5) {
                mario.y = platform.y - mario.height; // Land on platform
                mario.jumping = false; // Ensure jumping stops
                onPlatform = true;
            }
        });
        if (!onPlatform && mario.y < canvas.height - mario.height) {
            mario.y = canvas.height - mario.height; // Reset to bottom if no platform
        }
    }
    
    // Preme Kong dropping and barrel throwing (leftward movement)
    if (premekong.dropping) {
        premekong.y += 2;
        if (premekong.y > canvas.height - 100) premekong.y = 50; // Reset to top
        if (Math.random() < 0.01) {
            barrels.push({ x: premekong.x, y: premekong.y, dx: -2, dy: 0, image: new Image() });
            barrels[barrels.length - 1].image.src = 'barrel.png';
            console.log('New barrel created at:', premekong.x, premekong.y);
        }
    }
    
    // Barrels movement and collision (horizontal only)
    barrels.forEach((barrel, i) => {
        barrel.x += barrel.dx;
        barrel.y += barrel.dy; // Keep vertical position stable
        console.log('Barrel position:', barrel.x, barrel.y);
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

// Level up (cycle through 4 levels)
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

// Touch controls for mobile, matching your reference (yellow buttons, all controls)
function setupTouchControls() {
    const buttons = {
        left: document.querySelector('#left'),
        right: document.querySelector('#right'),
        jump: document.querySelector('#jump'),
        up: document.querySelector('#up'),
        down: document.querySelector('#down')
    };

    buttons.left.addEventListener('touchstart', () => mario.dx = -1);
    buttons.right.addEventListener('touchstart', () => mario.dx = 1);
    buttons.jump.addEventListener('touchstart', () => { if (!mario.jumping && !mario.onLadder) mario.jumping = true; });
    buttons.up.addEventListener('touchstart', () => { if (mario.onLadder) mario.dy = -1; });
    buttons.down.addEventListener('touchstart', () => { if (mario.onLadder) mario.dy = 1; });

    buttons.left.addEventListener('touchend', () => mario.dx = 0);
    buttons.right.addEventListener('touchend', () => mario.dx = 0);
    buttons.up.addEventListener('touchend', () => mario.dy = 0);
    buttons.down.addEventListener('touchend', () => mario.dy = 0);
}

// Handle Telegram WebApp data (for bot integration)
function handleTelegramData() {
    const Telegram = window.Telegram;
    if (Telegram && Telegram.WebApp) {
        console.log('Telegram WebApp initialized');
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
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

// Game loop
function gameLoop() {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize and start game
loadImages();
initLevel();
setupTouchControls();
handleTelegramData();
gameLoop();
