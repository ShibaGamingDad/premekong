// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Adjust canvas for mobile and Telegram Web App (landscape setup, 672x500)
canvas.width = 672; // Width (landscape, matching platforms)
canvas.height = 500; // Unchanged height
ctx.scale(1, 1); // Ensure no unintended scaling

// Game state (restored original positions, with direct canvas dimensions for landscape, 672x500, adjusted positions)
let mario = {
    x: 50, 
    y: 318, // 1 platform level up (from y: 450 to y: 350 - 32 for height 32, on bottom platform at y: 400)
    width: 32, 
    height: 32, 
    dx: 0, 
    dy: 0, 
    speed: 3, 
    gravity: 0.5, 
    jumping: false, 
    onLadder: false, 
    hasHammer: false, 
    hammerTime: 0
}; // Moved up 1 platform level to bottom platform
let premekong = {
    x: 50, 
    y: 18, // 2 platform levels up (from y: 218 to y: 50 - 32 for height 64, above top platform at y: 100)
    width: 64, 
    height: 64, 
    bounceDir: 1
}; // Top platform, left side, moved up 2 levels
let pauline = {
    x: canvas.width - 100, 
    y: 93, // 1.25 platform levels up (from y: 218 to y: 125 - 32 for height 32, between second and third platforms)
    width: 32, 
    height: 32
}; // Top platform, right side, moved up 1.25 levels
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

// Initialize level (with direct canvas dimensions for landscape, 672x500, platforms 672x10, adjusted positions)
function initLevel() {
    barrels = [];
    conveyors = [];
    elevators = [];
    springs = [];
    hammers = [];
    rivets = [];
    ladders = [];
    
    // Use canvas dimensions directly, no additional scaling, adjusted positions
    mario.x = 50;
    mario.y = 318; // 1 platform level up (from y: 450 to y: 350 - 32 for height 32, on bottom platform at y: 400)
    mario.hasHammer = false; mario.hammerTime = 0;
    premekong.x = 50;
    premekong.y = 18; // 2 platform levels up (from y: 218 to y: 50 - 32 for height 64, above top platform at y: 100)
    pauline.x = canvas.width - 100;
    pauline.y = 93; // 1.25 platform levels up (from y: 218 to y: 125 - 32 for height 32, between second and third platforms)

    const platformY = [
        400, // Bottom platform (near base, adjusted for clarity, 672x10)
        300, // Second platform
        200, // Third platform
        100  // Top platform (now middle at y: 250, adjusted for height, 672x10)
    ];

    if (level === 1) { // 25m - Girders
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 });
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 });
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
        hammers.push({ x: 250, y: platformY[1] - 32, width: 32, height: 32, taken: false });
    } else if (level === 2) { // 50m - Conveyors (moved up to top platform at y: 100)
        conveyors.push({ x: 0, y: platformY[3], width: canvas.width, height: 10, speed: 1 }); // Top platform at y: 100, 672x10
        conveyors.push({ x: 0, y: platformY[2], width: canvas.width, height: 10, speed: -1 }); // Third platform at y: 200, 672x10
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
        ladders.push({ x: 350, y: platformY[3] - 100, width: 20, height: 100 });
        hammers.push({ x: 200, y: platformY[3] - 32, width: 32, height: 32, taken: false });
    } else if (level === 3) { // 75m - Elevators
        elevators.push({ x: 150, y: 300, width: 40, height: 20, dy: 2, minY: 100, maxY: 400 }); // Adjusted for new platform heights, 672x10 platforms
        elevators.push({ x: 450, y: 200, width: 40, height: 20, dy: -2, minY: 100, maxY: 400 }); // Adjusted for new platform heights
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
    } else if (level === 4) { // 100m - Rivets
        for (let i = 0; i < 4; i++) {
            rivets.push({ x: 100 + i * 150, y: platformY[i] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 150 + i * 150, y: platformY[i] - 10, width: 20, height: 20, hit: false });
        }
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 });
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 });
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
    }
    updateScore();
    console.log('Canvas size after scaling:', canvas.width, canvas.height); // Verify rendered dimensions
}

// Draw game (with direct canvas dimensions for landscape, 672x500, platforms 672x10, adjusted positions)
function draw() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (backgrounds[level] && backgrounds[level].complete) {
        ctx.drawImage(backgrounds[level], 0, 0, canvas.width, canvas.height);
    }

    // Draw platforms (672x10, moved up, top at y: 100)
    const platformY = [400, 300, 200, 100]; // Adjusted to move platforms up, top at middle (y: 250 not possible, using y: 100 as top, 672x10 each)
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

    // Draw Mario (with fallback if image fails to load)
    if (mario.image.complete) {
        ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
    } else {
        ctx.fillStyle = 'blue'; // Fallback color for debugging
        ctx.fillRect(mario.x, mario.y, mario.width, mario.height);
        console.log('Mario image not loaded, using fallback:', mario.image.src);
    }

    // Draw Preme Kong (bouncing left/right on top platform and throwing barrels)
    if (premekong.image.complete) {
        ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);
    }
    premekong.x += premekong.bounceDir * 2; // Adjust bounce speed for new width
    if (premekong.x <= 0 || premekong.x >= canvas.width - premekong.width) premekong.bounceDir *= -1;

    // Draw Pauline
    if (pauline.image.complete) ctx.drawImage(pauline.image, pauline.x, pauline.y, pauline.width, pauline.height);
    else ctx.fillRect(pauline.x, pauline.y, pauline.width, pauline.height);

    // Draw barrels, cement pies, springs
    barrels.forEach(barrel => {
        if (barrel.type === 'cement_pie' && cementPieImg.complete) ctx.drawImage(cementPieImg, barrel.x, barrel.y, 32, 32);
        else if (barrel.type === 'spring' && springImg.complete) ctx.drawImage(springImg, barrel.x, barrel.y, 32, 32);
        else if (barrelImg.complete) ctx.drawImage(barrelImg, barrel.x, barrel.y, 32, 32);
        else ctx.fillRect(barrel.x, barrel.y, 32, 32);
    });

    requestAnimationFrame(draw);
}

// Update game logic (with direct canvas dimensions for landscape, 672x500, platforms 672x10, adjusted positions)
function update() {
    if (!gameActive) return;

    // Mario physics (restored to original settings)
    if (!mario.onLadder) {
        mario.dy += mario.gravity; // Original gravity
        mario.y += mario.dy;
        if (mario.jumping) {
            mario.dy = -10; // Original jump strength
            mario.jumping = false;
        }
    } else {
        mario.dy = 0;
    }
    mario.x += mario.dx * mario.speed; // Original speed
    if (mario.onLadder) mario.y += mario.dy * mario.speed;

    // Platform collision (adjusted for platform.png height of 10, considering landscape, 672x500, platforms 672x10)
    const platformY = [400, 300, 200, 100]; // Adjusted platforms, top at y: 100 (middle of screen)
    platformY.forEach(py => {
        if (mario.y + mario.height > py && mario.y + mario.height < py + 10 && mario.dy > 0 && !mario.onLadder) {
            mario.y = py - mario.height; // Ensure Mario stays on the platform
            mario.dy = 0;
        }
        // Prevent Mario from falling below the bottom platform
        if (mario.y > canvas.height - mario.height) {
            mario.y = canvas.height - mario.height; // Keep Mario at the bottom (y: 468)
            mario.dy = 0;
        }
    });

    // Preme Kong barrel throwing (bouncing and throwing barrels, scaled for landscape, 672x500, platforms 672x10)
    if (Math.random() < 0.03) { // Slightly increased chance for visibility
        if (level === 1) barrels.push({
            x: premekong.x + premekong.width / 2, 
            y: premekong.y + premekong.height, 
            dx: -2, 
            dy: 0, 
            type: 'barrel'
        });
        else if (level === 2) barrels.push({
            x: premekong.x + premekong.width / 2, 
            y: premekong.y + premekong.height, 
            dx: -2, 
            dy: 0, 
            type: 'cement_pie'
        });
        else if (level === 3) barrels.push({
            x: premekong.x + premekong.width / 2, 
            y: premekong.y + premekong.height, 
            dx: -4, 
            dy: 0, 
            type: 'spring'
        });
    }

    // Barrel/spring/cement pie movement (scaled for landscape, 672x500, platforms 672x10)
    barrels.forEach((barrel, i) => {
        barrel.x += barrel.dx;
        barrel.y += barrel.dy || 2; // Apply gravity for barrels
        platformY.forEach(py => {
            if (barrel.y + 32 > py && barrel.y + 32 < py + 10 && barrel.dy >= 0) {
                barrel.y = py - 32; // Keep barrel on top of platform (672x10)
                barrel.dy = 0; // Stop falling
                // Apply conveyor speed if on conveyor
                conveyors.forEach(conveyor => {
                    if (barrel.y === conveyor.y && barrel.x >= conveyor.x && barrel.x + 32 <= conveyor.x + conveyor.width) {
                        barrel.x += conveyor.speed; // Move with conveyor
                    }
                });
            }
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

    // Conveyor movement (updated for stability)
    conveyors.forEach(conveyor => {
        // No need to move conveyors themselves, just their effect on barrels
    });

    // Elevator movement (simplified for clarity, can be expanded if needed)
    elevators.forEach(elevator => {
        elevator.y += elevator.dy;
        if (elevator.y <= elevator.minY || elevator.y >= elevator.maxY) elevator.dy *= -1;
    });

    // Hammer, ladder, rivet logic remains the same, but ensure adjustments for new positions...

    // Level completion (reach Pauline except Level 4), considering landscape, 672x500, platforms 672x10, adjusted positions
    if (level !== 4 && mario.y < 250 + 50 && Math.abs(mario.x - pauline.x) < 100) levelUp(); // Adjusted for top platform at y: 250

    // Hammer logic
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
