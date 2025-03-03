// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Adjust canvas for mobile and Telegram Web App (landscape setup, unchanged canvas size)
canvas.width = 921; // Unchanged width
canvas.height = 500; // Unchanged height
ctx.scale(1, 1); // Ensure no unintended scaling

// Game world scaling (15% increase for play area, not canvas)
const scaleFactor = 1.15;
const gameWidth = canvas.width * scaleFactor;  // Scaled game world width (921 * 1.15 = 1059.15)
const gameHeight = canvas.height * scaleFactor; // Scaled game world height (500 * 1.15 = 575)

// Game state (restored original positions, with dynamic scaling for landscape, increased width and height by 15%, compacted content at 65%)
let mario = {
    x: 50 * scaleFactor, 
    y: canvas.height - 50 * scaleFactor, 
    width: 32 * scaleFactor, 
    height: 32 * scaleFactor, 
    dx: 0, 
    dy: 0, 
    speed: 3 * scaleFactor, 
    gravity: 0.5 * scaleFactor, 
    jumping: false, 
    onLadder: false, 
    hasHammer: false, 
    hammerTime: 0
}; // Bottom-left starting position, scaled
let premekong = {
    x: 50 * scaleFactor, 
    y: 50 * scaleFactor, 
    width: 64 * scaleFactor, 
    height: 64 * scaleFactor, 
    bounceDir: 1
}; // Top platform, left side, scaled
let pauline = {
    x: canvas.width - 100 * scaleFactor, 
    y: 50 * scaleFactor, 
    width: 32 * scaleFactor, 
    height: 32 * scaleFactor
}; // Top platform, right side, scaled
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
let hammerImg = new Image(); // Global hammer image
let barrelImg = new Image(); // Global barrel image

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

// Load assets (sprites and backgrounds) with detailed debugging
function loadAssets() {
    console.log('Loading assets...');

    mario.image = new Image();
    mario.image.onload = () => console.log('Mario image loaded successfully:', mario.image.src);
    mario.image.onerror = () => console.error('Failed to load Mario image:', mario.image.src);
    mario.image.src = 'mario.png';
    console.log('Mario:', mario.image.src);

    premekong.image = new Image();
    premekong.image.onload = () => console.log('Preme Kong image loaded successfully:', premekong.image.src);
    premekong.image.onerror = () => console.error('Failed to load Preme Kong image:', premekong.image.src);
    premekong.image.src = 'premekong.png';
    console.log('Preme Kong:', premekong.image.src);

    pauline.image = new Image();
    pauline.image.onload = () => console.log('Pauline image loaded successfully:', pauline.image.src);
    pauline.image.onerror = () => console.error('Failed to load Pauline image:', pauline.image.src);
    pauline.image.src = 'pauline.png';
    console.log('Pauline:', pauline.image.src);

    barrelImg.src = 'barrel.png'; console.log('Barrel:', barrelImg.src);
    const cementPieImg = new Image(); cementPieImg.src = 'cement_pie.png'; console.log('Cement Pie:', cementPieImg.src);
    const springImg = new Image(); springImg.src = 'spring.png'; console.log('Spring:', springImg.src);
    hammerImg.src = 'hammer.png'; console.log('Hammer:', hammerImg.src);
    ladderImg.src = 'ladder.png'; console.log('Ladder:', ladderImg.src);
    const rivetImg = new Image(); rivetImg.src = 'rivet.png'; console.log('Rivet:', rivetImg.src);
    platformImg.src = 'platform.png'; console.log('Platform:', platformImg.src);

    backgrounds[1] = new Image(); backgrounds[1].src = 'background1.png'; console.log('Background 1:', backgrounds[1].src);
    backgrounds[2] = new Image(); backgrounds[2].src = 'background2.png'; console.log('Background 2:', backgrounds[2].src);
    backgrounds[3] = new Image(); backgrounds[3].src = 'background3.png'; console.log('Background 3:', backgrounds[3].src);
    backgrounds[4] = new Image(); backgrounds[4].src = 'background4.png'; console.log('Background 4:', backgrounds[4].src);
}

// Initialize level (with dynamic scaling for landscape, increased width and height by 15%, compacted content at 65%)
function initLevel() {
    barrels = [];
    conveyors = [];
    elevators = [];
    springs = [];
    hammers = [];
    rivets = [];
    ladders = [];
    
    // Dynamically adjust positions based on rendered canvas size, accounting for landscape, increased width and height by 15%, and compacted content at 65%
    const scaleFactorWidth = (canvas.width * 0.65) / 921; // Scale factor based on effective width (65% of 921px)
    const scaleFactorHeight = (canvas.height * 0.65) / 500; // Scale factor based on effective height (65% of 500px)
    mario.x = 50 * scaleFactor * scaleFactorWidth;
    mario.y = (canvas.height - 50 * scaleFactor) * scaleFactorHeight; // Bottom-left starting position
    mario.hasHammer = false; mario.hammerTime = 0;
    premekong.x = 50 * scaleFactor * scaleFactorWidth;
    premekong.y = 50 * scaleFactor * scaleFactorHeight; // Top platform, left side
    pauline.x = (canvas.width - 100 * scaleFactor) * scaleFactorWidth;
    pauline.y = 50 * scaleFactor * scaleFactorHeight; // Top platform, right side

    const platformY = [
        canvas.height - 100 * scaleFactor * scaleFactorHeight, // Bottom platform
        canvas.height - 200 * scaleFactor * scaleFactorHeight,
        canvas.height - 300 * scaleFactor * scaleFactorHeight,
        canvas.height - 400 * scaleFactor * scaleFactorHeight // Top platform
    ];

    if (level === 1) { // 25m - Girders
        ladders.push({
            x: 200 * scaleFactor * scaleFactorWidth, 
            y: platformY[0] - 100 * scaleFactor * scaleFactorHeight, 
            width: 20 * scaleFactor * scaleFactorWidth, 
            height: 100 * scaleFactor * scaleFactorHeight
        });
        ladders.push({
            x: 400 * scaleFactor * scaleFactorWidth, 
            y: platformY[1] - 100 * scaleFactor * scaleFactorHeight, 
            width: 20 * scaleFactor * scaleFactorWidth, 
            height: 100 * scaleFactor * scaleFactorHeight
        });
        ladders.push({
            x: 300 * scaleFactor * scaleFactorWidth, 
            y: platformY[2] - 100 * scaleFactor * scaleFactorHeight, 
            width: 20 * scaleFactor * scaleFactorWidth, 
            height: 100 * scaleFactor * scaleFactorHeight
        });
        hammers.push({
            x: 250 * scaleFactor * scaleFactorWidth, 
            y: platformY[1] - 32 * scaleFactor * scaleFactorHeight, 
            width: 32 * scaleFactor * scaleFactorWidth, 
            height: 32 * scaleFactor * scaleFactorHeight, 
            taken: false
        });
    } else if (level === 2) { // 50m - Conveyors
        conveyors.push({
            x: 0, 
            y: platformY[1], 
            width: canvas.width * scaleFactor, 
            height: 10 * scaleFactor * scaleFactorHeight, 
            speed: 2 * scaleFactor
        });
        conveyors.push({
            x: 0, 
            y: platformY[2], 
            width: canvas.width * scaleFactor, 
            height: 10 * scaleFactor * scaleFactorHeight, 
            speed: -2 * scaleFactor
        });
        ladders.push({
            x: 300 * scaleFactor * scaleFactorWidth, 
            y: platformY[1] - 100 * scaleFactor * scaleFactorHeight, 
            width: 20 * scaleFactor * scaleFactorWidth, 
            height: 100 * scaleFactor * scaleFactorHeight
        });
        ladders.push({
            x: 350 * scaleFactor * scaleFactorWidth, 
            y: platformY[2] - 100 * scaleFactor * scaleFactorHeight, 
            width: 20 * scaleFactor * scaleFactorWidth, 
            height: 100 * scaleFactor * scaleFactorHeight
        });
        hammers.push({
            x: 200 * scaleFactor * scaleFactorWidth, 
            y: platformY[2] - 32 * scaleFactor * scaleFactorHeight, 
            width: 32 * scaleFactor * scaleFactorWidth, 
            height: 32 * scaleFactor * scaleFactorHeight, 
            taken: false
        });
    } else if (level === 3) { // 75m - Elevators
        elevators.push({
            x: 150 * scaleFactor * scaleFactorWidth, 
            y: canvas.height - 200 * scaleFactor * scaleFactorHeight, 
            width: 40 * scaleFactor * scaleFactorWidth, 
            height: 20 * scaleFactor * scaleFactorHeight, 
            dy: 2 * scaleFactor, 
            minY: 100 * scaleFactor * scaleFactorHeight, 
            maxY: canvas.height - 200 * scaleFactor * scaleFactorHeight
        });
        elevators.push({
            x: 450 * scaleFactor * scaleFactorWidth, 
            y: 300 * scaleFactor * scaleFactorHeight, 
            width: 40 * scaleFactor * scaleFactorWidth, 
            height: 20 * scaleFactor * scaleFactorHeight, 
            dy: -2 * scaleFactor, 
            minY: 100 * scaleFactor * scaleFactorHeight, 
            maxY: canvas.height - 200 * scaleFactor * scaleFactorHeight
        });
        ladders.push({
            x: 300 * scaleFactor * scaleFactorWidth, 
            y: platformY[2] - 100 * scaleFactor * scaleFactorHeight, 
            width: 20 * scaleFactor * scaleFactorWidth, 
            height: 100 * scaleFactor * scaleFactorHeight
        });
    } else if (level === 4) { // 100m - Rivets
        for (let i = 0; i < 4; i++) {
            rivets.push({
                x: 100 * scaleFactor * scaleFactorWidth + i * 150 * scaleFactor * scaleFactorWidth, 
                y: platformY[i] - 10 * scaleFactor * scaleFactorHeight, 
                width: 20 * scaleFactor * scaleFactorWidth, 
                height: 20 * scaleFactor * scaleFactorHeight, 
                hit: false
            });
            rivets.push({
                x: 150 * scaleFactor * scaleFactorWidth + i * 150 * scaleFactor * scaleFactorWidth, 
                y: platformY[i] - 10 * scaleFactor * scaleFactorHeight, 
                width: 20 * scaleFactor * scaleFactorWidth, 
                height: 20 * scaleFactor * scaleFactorHeight, 
                hit: false
            });
        }
        ladders.push({
            x: 200 * scaleFactor * scaleFactorWidth, 
            y: platformY[0] - 100 * scaleFactor * scaleFactorHeight, 
            width: 20 * scaleFactor * scaleFactorWidth, 
            height: 100 * scaleFactor * scaleFactorHeight
        });
        ladders.push({
            x: 400 * scaleFactor * scaleFactorWidth, 
            y: platformY[1] - 100 * scaleFactor * scaleFactorHeight, 
            width: 20 * scaleFactor * scaleFactorWidth, 
            height: 100 * scaleFactor * scaleFactorHeight
        });
        ladders.push({
            x: 300 * scaleFactor * scaleFactorWidth, 
            y: platformY[2] - 100 * scaleFactor * scaleFactorHeight, 
            width: 20 * scaleFactor * scaleFactorWidth, 
            height: 100 * scaleFactor * scaleFactorHeight
        });
    }
    updateScore();
    console.log('Canvas size after scaling:', canvas.width, canvas.height); // Verify rendered dimensions
}

// Draw game (with scaling for landscape, increased width and height by 15%, compacted content at 65%)
function draw() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (backgrounds[level] && backgrounds[level].complete) {
        ctx.drawImage(backgrounds[level], 0, 0, canvas.width, canvas.height);
    }

    // Draw platforms (scaled for landscape, increased width and height by 15%, compacted content at 65%)
    const platformY = [
        canvas.height - 100 * scaleFactor * ((canvas.height * 0.65) / 500),
        canvas.height - 200 * scaleFactor * ((canvas.height * 0.65) / 500),
        canvas.height - 300 * scaleFactor * ((canvas.height * 0.65) / 500),
        canvas.height - 400 * scaleFactor * ((canvas.height * 0.65) / 500)
    ];
    if (platformImg.complete) {
        platformY.forEach(py => ctx.drawImage(platformImg, 0, py / scaleFactor, canvas.width, 10 * ((canvas.height * 0.65) / 500)));
    } else {
        ctx.fillStyle = 'red';
        platformY.forEach(py => ctx.fillRect(0, py / scaleFactor, canvas.width, 10 * ((canvas.height * 0.65) / 500)));
    }

    // Draw conveyors
    ctx.fillStyle = 'yellow';
    conveyors.forEach(conveyor => ctx.fillRect(conveyor.x / scaleFactor, conveyor.y / scaleFactor, conveyor.width / scaleFactor, conveyor.height * ((canvas.height * 0.65) / 500)));

    // Draw elevators
    ctx.fillStyle = 'orange';
    elevators.forEach(elevator => ctx.fillRect(elevator.x / scaleFactor, elevator.y / scaleFactor, elevator.width / scaleFactor, elevator.height * ((canvas.height * 0.65) / 500)));

    // Draw ladders
    ladders.forEach(ladder => {
        if (ladderImg.complete) ctx.drawImage(ladderImg, ladder.x / scaleFactor, ladder.y / scaleFactor, ladder.width / scaleFactor, ladder.height * ((canvas.height * 0.65) / 500));
        else ctx.fillRect(ladder.x / scaleFactor, ladder.y / scaleFactor, ladder.width / scaleFactor, ladder.height * ((canvas.height * 0.65) / 500));
    });

    // Draw hammers
    hammers.forEach(hammer => {
        if (!hammer.taken && hammerImg.complete) ctx.drawImage(hammerImg, hammer.x / scaleFactor, hammer.y / scaleFactor, hammer.width / scaleFactor * (canvas.width * 0.65 / 921), hammer.height * ((canvas.height * 0.65) / 500));
    });

    // Draw rivets
    rivets.forEach(rivet => {
        if (!rivet.hit && rivetImg.complete) ctx.drawImage(rivetImg, rivet.x / scaleFactor, rivet.y / scaleFactor, rivet.width / scaleFactor * (canvas.width * 0.65 / 921), rivet.height * ((canvas.height * 0.65) / 500));
    });

    // Draw Mario (with fallback if image fails to load)
    if (mario.image.complete) {
        ctx.drawImage(mario.image, mario.x / scaleFactor, mario.y / scaleFactor, mario.width / scaleFactor * (canvas.width * 0.65 / 921), mario.height * ((canvas.height * 0.65) / 500));
    } else {
        ctx.fillStyle = 'blue'; // Fallback color for debugging
        ctx.fillRect(mario.x / scaleFactor, mario.y / scaleFactor, mario.width / scaleFactor * (canvas.width * 0.65 / 921), mario.height * ((canvas.height * 0.65) / 500));
        console.log('Mario image not loaded, using fallback:', mario.image.src);
    }

    // Draw Preme Kong (bouncing left/right on top platform and throwing barrels)
    if (premekong.image.complete) {
        ctx.drawImage(premekong.image, premekong.x / scaleFactor, premekong.y / scaleFactor, premekong.width / scaleFactor * (canvas.width * 0.65 / 921), premekong.height * ((canvas.height * 0.65) / 500));
    }
    premekong.x += premekong.bounceDir * 2 * (canvas.width * 0.65 / 921); // Adjust bounce speed for increased width, landscape scaling
    if (premekong.x <= 0 || premekong.x >= canvas.width - premekong.width * (canvas.width * 0.65 / 921)) premekong.bounceDir *= -1;

    // Draw Pauline
    if (pauline.image.complete) ctx.drawImage(pauline.image, pauline.x / scaleFactor, pauline.y / scaleFactor, pauline.width / scaleFactor * (canvas.width * 0.65 / 921), pauline.height * ((canvas.height * 0.65) / 500));
    else ctx.fillRect(pauline.x / scaleFactor, pauline.y / scaleFactor, pauline.width / scaleFactor * (canvas.width * 0.65 / 921), pauline.height * ((canvas.height * 0.65) / 500));

    // Draw barrels, cement pies, springs
    barrels.forEach(barrel => {
        if (barrel.type === 'cement_pie' && cementPieImg.complete) ctx.drawImage(cementPieImg, barrel.x / scaleFactor, barrel.y / scaleFactor, 32 * (canvas.width * 0.65 / 921), 32 * ((canvas.height * 0.65) / 500));
        else if (barrel.type === 'spring' && springImg.complete) ctx.drawImage(springImg, barrel.x / scaleFactor, barrel.y / scaleFactor, 32 * (canvas.width * 0.65 / 921), 32 * ((canvas.height * 0.65) / 500));
        else if (barrelImg.complete) ctx.drawImage(barrelImg, barrel.x / scaleFactor, barrel.y / scaleFactor, 32 * (canvas.width * 0.65 / 921), 32 * ((canvas.height * 0.65) / 500));
        else ctx.fillRect(barrel.x / scaleFactor, barrel.y / scaleFactor, 32 * (canvas.width * 0.65 / 921), 32 * ((canvas.height * 0.65) / 500));
    });

    requestAnimationFrame(draw);
}

// Update game logic (with scaling for landscape, increased width and height by 15%, compacted content at 65%)
function update() {
    if (!gameActive) return;

    // Mario physics
    if (!mario.onLadder) {
        mario.dy += mario.gravity * ((canvas.height * 0.65) / 500); // Adjust gravity for landscape, increased height by 15%, compacted content at 65%
        mario.y += mario.dy;
        if (mario.jumping) {
            mario.dy = -10 * ((canvas.height * 0.65) / 500); // Adjust jump for landscape, increased height by 15%, compacted content at 65%
            mario.jumping = false;
        }
    } else {
        mario.dy = 0;
    }
    mario.x += mario.dx * mario.speed * (canvas.width * 0.65 / 921); // Adjust speed for increased width by 15%, landscape scaling
    if (mario.onLadder) mario.y += mario.dy * mario.speed * ((canvas.height * 0.65) / 500); // Adjust climb for landscape, increased height by 15%, compacted content at 65%

    // Platform collision (adjusted for platform.png height of 10, considering landscape, increased width and height by 15%, compacted content at 65%)
    const platformY = [
        canvas.height - 100 * scaleFactor * ((canvas.height * 0.65) / 500),
        canvas.height - 200 * scaleFactor * ((canvas.height * 0.65) / 500),
        canvas.height - 300 * scaleFactor * ((canvas.height * 0.65) / 500),
        canvas.height - 400 * scaleFactor * ((canvas.height * 0.65) / 500)
    ];
    platformY.forEach(py => {
        if (mario.y + mario.height * ((canvas.height * 0.65) / 500) > py / scaleFactor && mario.y + mario.height * ((canvas.height * 0.65) / 500) < py / scaleFactor + 10 * ((canvas.height * 0.65) / 500) && mario.dy > 0 && !mario.onLadder) {
            mario.y = py / scaleFactor - mario.height * ((canvas.height * 0.65) / 500); // Ensure Mario stays on the platform, scaled
            mario.dy = 0;
        }
        // Prevent Mario from falling below the bottom platform, accounting for scaling
        if (mario.y > canvas.height - mario.height * ((canvas.height * 0.65) / 500)) {
            mario.y = canvas.height - mario.height * ((canvas.height * 0.65) / 500); // Keep Mario at the bottom, scaled
            mario.dy = 0;
        }
    });

    // Preme Kong barrel throwing (bouncing and throwing barrels, scaled for landscape, increased width and height by 15%, compacted content at 65%)
    if (Math.random() < 0.03) { // Slightly increased chance for visibility
        if (level === 1) barrels.push({
            x: premekong.x + premekong.width * (canvas.width * 0.65 / 921) / 2, 
            y: premekong.y + premekong.height * ((canvas.height * 0.65) / 500), 
            dx: -2 * (canvas.width * 0.65 / 921), 
            dy: 0, 
            type: 'barrel'
        });
        else if (level === 2) barrels.push({
            x: premekong.x + premekong.width * (canvas.width * 0.65 / 921) / 2, 
            y: premekong.y + premekong.height * ((canvas.height * 0.65) / 500), 
            dx: -2 * (canvas.width * 0.65 / 921), 
            dy: 0, 
            type: 'cement_pie'
        });
        else if (level === 3) barrels.push({
            x: premekong.x + premekong.width * (canvas.width * 0.65 / 921) / 2, 
            y: premekong.y + premekong.height * ((canvas.height * 0.65) / 500), 
            dx: -4 * (canvas.width * 0.65 / 921), 
            dy: 0, 
            type: 'spring'
        });
    }

    // Barrel/spring/cement pie movement (scaled for landscape, increased width and height by 15%, compacted content at 65%)
    barrels.forEach((barrel, i) => {
        barrel.x += barrel.dx;
        barrel.y += barrel.dy || 2 * ((canvas.height * 0.65) / 500);
        platformY.forEach(py => {
            if (barrel.y + 32 * ((canvas.height * 0.65) / 500) > py / scaleFactor && barrel.y + 32 * ((canvas.height * 0.65) / 500) < py / scaleFactor + 10 * ((canvas.height * 0.65) / 500)) barrel.y = py / scaleFactor - 32 * ((canvas.height * 0.65) / 500);
        });
        if (barrel.type === 'spring' && barrel.x < canvas.width - 100 * (canvas.width * 0.65 / 921) && Math.random() < 0.1) barrel.dy = -10 * ((canvas.height * 0.65) / 500); // Spring bounce, scaled
        if (barrel.x < -32 * (canvas.width * 0.65 / 921) || barrel.y > canvas.height) barrels.splice(i, 1);
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

    // Conveyor, elevator, hammer, ladder, rivet logic remains the same, but with scaling adjustments as needed...

    // Level completion (reach Pauline except Level 4), considering landscape, increased width and height by 15%, compacted content at 65%
    if (level !== 4 && mario.y < 50 * scaleFactor * ((canvas.height * 0.65) / 500) + 50 * ((canvas.height * 0.65) / 500) && Math.abs(mario.x - pauline.x) < 100 * scaleFactor * (canvas.width * 0.65 / 921)) levelUp(); // Adjusted for top platform at y: 50, scaled

    // Hammer logic (scaled)
    if (mario.hasHammer) {
        mario.hammerTime--;
        if (mario.hammerTime <= 0) mario.hasHammer = false;
    }
    hammers.forEach(hammer => {
        if (!hammer.taken && checkCollision(mario, hammer)) {
            hammer.taken = true;
            mario.hasHammer = true;
            mario.hammerTime = 300; // ~5 seconds at 60 FPS, no scaling needed for time
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
