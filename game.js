// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Adjust canvas for mobile and Telegram Web App (landscape setup, reduced width by 20%, unchanged height)
canvas.width = 737; // Reduced width by 20% (921 * 0.8)
canvas.height = 500; // Unchanged height
ctx.scale(1, 1); // Ensure no unintended scaling

// Game state (restored original positions, with direct canvas dimensions for landscape, reduced width by 20%)
let mario = {
    x: 50, 
    y: 368, // Start on bottom platform (y: 400 - 32 for Mario's height)
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
}; // Start on bottom platform
let premekong = {
    x: 50, 
    y: 218, // Top platform at middle (y: 250 - 32 for Preme Kong's height)
    width: 64, 
    height: 64, 
    bounceDir: 1
}; // Top platform, left side, moved to middle
let pauline = {
    x: canvas.width - 100, 
    y: 218, // Top platform at middle (y: 250 - 32 for Pauline's height)
    width: 32, 
    height: 32
}; // Top platform, right side, moved to middle
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

// Initialize level (with direct canvas dimensions for landscape, reduced width by 20%, moved platforms up)
function initLevel() {
    barrels = [];
    conveyors = [];
    elevators = [];
    springs = [];
    hammers = [];
    rivets = [];
    ladders = [];
    
    // Use canvas dimensions directly, no additional scaling, move platforms up to place top at middle (y: 250)
    mario.x = 50;
    mario.y = 368; // Start on bottom platform (y: 400 - 32 for Mario's height)
    mario.hasHammer = false; mario.hammerTime = 0;
    premekong.x = 50;
    premekong.y = 218; // Top platform at middle (y: 250 - 32 for Preme Kong's height)
    pauline.x = canvas.width - 100;
    pauline.y = 218; // Top platform at middle (y: 250 - 32 for Pauline's height)

    const platformY = [
        400, // Bottom platform (near base, adjusted for clarity)
        300, // Second platform
        200, // Third platform
        100  // Top platform (now middle at y: 250, adjusted for height)
    ];

    if (level === 1) { // 25m - Girders
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 });
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 });
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
        hammers.push({ x: 250, y: platformY[1] - 32, width: 32, height: 32, taken: false });
    } else if (level === 2) { // 50m - Conveyors (moved up to top platform at y: 100)
        conveyors.push({ x: 0, y: platformY[3], width: canvas.width, height: 10, speed: 1 }); // Top platform at y: 100
        conveyors.push({ x: 0, y: platformY[2], width: canvas.width, height: 10, speed: -1 }); // Third platform at y: 200
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
        ladders.push({ x: 350, y: platformY[3] - 100, width: 20, height: 100 });
        hammers.push({ x: 200, y: platformY[3] - 32, width: 32, height: 32, taken: false });
    } else if (level === 3) { // 75m - Elevators
        elevators.push({ x: 150, y: 300, width: 40, height: 20, dy: 2, minY: 100, maxY: 400 }); // Adjusted for new platform heights
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

// Draw game (with direct canvas dimensions for landscape, reduced width by 20%, moved platforms up)
function draw() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (backgrounds[level] && backgrounds[level].complete) {
        ctx.drawImage(backgrounds[level], 0, 0, canvas.width, canvas.height);
    }

    // Draw platforms (moved up, top at y: 100)
    const platformY = [400, 300, 200, 100]; // Adjusted to move platforms up, top at middle (y: 250 not possible, using y: 100 as top)
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
        if (!hammer.taken && hammerImg.complete) ctx.drawImage(hammerImg, hammer.x, hammer.y, hammer.width * (canvas.width * 0.65 / 737), hammer.height * (canvas.height * 0.65 / 500));
    });

    // Draw rivets
    rivets.forEach(rivet => {
        if (!rivet.hit && rivetImg.complete) ctx.drawImage(rivetImg, rivet.x, rivet.y, rivet.width * (canvas.width * 0.65 / 737), rivet.height * (canvas.height * 0.65 / 500));
    });

    // Draw Mario (with fallback if image fails to load)
    if (mario.image.complete) {
        ctx.drawImage(mario.image, mario.x, mario.y, mario.width * (canvas.width * 0.65 / 737), mario.height * (canvas.height * 0.65 / 500));
    } else {
        ctx.fillStyle = 'blue'; // Fallback color for debugging
        ctx.fillRect(mario.x, mario.y, mario.width * (canvas.width * 0.65 / 737), mario.height * (canvas.height * 0.65 / 500));
        console.log('Mario image not loaded, using fallback:', mario.image.src);
    }

    // Draw Preme Kong (bouncing left/right on top platform and throwing barrels)
    if (premekong.image.complete) {
        ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width * (canvas.width * 0.65 / 737), premekong.height * (canvas.height * 0.65 / 500));
    }
    premekong.x += premekong.bounceDir * 2 * (canvas.width * 0.65 / 737); // Adjust bounce speed for reduced width, landscape scaling
    if (premekong.x <= 0 || premekong.x >= canvas.width - premekong.width * (canvas.width * 0.65 / 737)) premekong.bounceDir *= -1;

    // Draw Pauline
    if (pauline.image.complete) ctx.drawImage(pauline.image, pauline.x, pauline.y, pauline.width * (canvas.width * 0.65 / 737), pauline.height * (canvas.height * 0.65 / 500));
    else ctx.fillRect(pauline.x, pauline.y, pauline.width * (canvas.width * 0.65 / 737), pauline.height * (canvas.height * 0.65 / 500));

    // Draw barrels, cement pies, springs
    barrels.forEach(barrel => {
        if (barrel.type === 'cement_pie' && cementPieImg.complete) ctx.drawImage(cementPieImg, barrel.x, barrel.y, 32 * (canvas.width * 0.65 / 737), 32 * (canvas.height * 0.65 / 500));
        else if (barrel.type === 'spring' && springImg.complete) ctx.drawImage(springImg, barrel.x, barrel.y, 32 * (canvas.width * 0.65 / 737), 32 * (canvas.height * 0.65 / 500));
        else if (barrelImg.complete) ctx.drawImage(barrelImg, barrel.x, barrel.y, 32 * (canvas.width * 0.65 / 737), 32 * (canvas.height * 0.65 / 500));
        else ctx.fillRect(barrel.x, barrel.y, 32 * (canvas.width * 0.65 / 737), 32 * (canvas.height * 0.65 / 500));
    });

    requestAnimationFrame(draw);
}

// Update game logic (with direct canvas dimensions for landscape, reduced width by 20%, moved platforms up, compacted content at 65%)
function update() {
    if (!gameActive) return;

    // Mario physics
    if (!mario.onLadder) {
        mario.dy += mario.gravity * (canvas.height * 0.65 / 500); // Adjust gravity for landscape, compacted content at 65%
        mario.y += mario.dy;
        if (mario.jumping) {
            mario.dy = -10 * (canvas.height * 0.65 / 500); // Adjust jump for landscape, compacted content at 65%
            mario.jumping = false;
        }
    } else {
        mario.dy = 0;
    }
    mario.x += mario.dx * mario.speed * (canvas.width * 0.65 / 737); // Adjust speed for reduced width by 20%, landscape scaling
    if (mario.onLadder) mario.y += mario.dy * mario.speed * (canvas.height * 0.65 / 500); // Adjust climb for landscape, compacted content at 65%

    // Platform collision (adjusted for platform.png height of 10, considering landscape, reduced width by 20%, moved platforms up, compacted content at 65%)
    const platformY = [400, 300, 200, 100]; // Adjusted platforms, top at y: 100 (middle of screen)
    platformY.forEach(py => {
        if (mario.y + mario.height * (canvas.height * 0.65 / 500) > py && mario.y + mario.height * (canvas.height * 0.65 / 500) < py + 10 * (canvas.height * 0.65 / 500) && mario.dy > 0 && !mario.onLadder) {
            mario.y = py - mario.height * (canvas.height * 0.65 / 500); // Ensure Mario stays on the platform, scaled
            mario.dy = 0;
        }
        // Prevent Mario from falling below the bottom platform, accounting for scaling
        if (mario.y > canvas.height - mario.height * (canvas.height * 0.65 / 500)) {
            mario.y = canvas.height - mario.height * (canvas.height * 0.65 / 500); // Keep Mario at the bottom, scaled
            mario.dy = 0;
        }
    });

    // Preme Kong barrel throwing (bouncing and throwing barrels, scaled for landscape, reduced width by 20%, moved platforms up, compacted content at 65%)
    if (Math.random() < 0.03) { // Slightly increased chance for visibility
        if (level === 1) barrels.push({
            x: premekong.x + premekong.width * (canvas.width * 0.65 / 737) / 2, 
            y: premekong.y + premekong.height * (canvas.height * 0.65 / 500), 
            dx: -2 * (canvas.width * 0.65 / 737), 
            dy: 0, 
            type: 'barrel'
        });
        else if (level === 2) barrels.push({
            x: premekong.x + premekong.width * (canvas.width * 0.65 / 737) / 2, 
            y: premekong.y + premekong.height * (canvas.height * 0.65 / 500), 
            dx: -2 * (canvas.width * 0.65 / 737), 
            dy: 0, 
            type: 'cement_pie'
        });
        else if (level === 3) barrels.push({
            x: premekong.x + premekong.width * (canvas.width * 0.65 / 737) / 2, 
            y: premekong.y + premekong.height * (canvas.height * 0.65 / 500), 
            dx: -4 * (canvas.width * 0.65 / 737), 
            dy: 0, 
            type: 'spring'
        });
    }

    // Barrel/spring/cement pie movement (scaled for landscape, reduced width by 20%, moved platforms up, compacted content at 65%)
    barrels.forEach((barrel, i) => {
        barrel.x += barrel.dx;
        barrel.y += barrel.dy || 2 * (canvas.height * 0.65 / 500); // Apply gravity for barrels
        platformY.forEach(py => {
            if (barrel.y + 32 * (canvas.height * 0.65 / 500) > py && barrel.y + 32 * (canvas.height * 0.65 / 500) < py + 10 * (canvas.height * 0.65 / 500) && barrel.dy >= 0) {
                barrel.y = py - 32 * (canvas.height * 0.65 / 500); // Keep barrel on top of platform
                barrel.dy = 0; // Stop falling
                // Apply conveyor speed if on conveyor
                conveyors.forEach(conveyor => {
                    if (barrel.y === conveyor.y && barrel.x >= conveyor.x && barrel.x + 32 * (canvas.width * 0.65 / 737) <= conveyor.x + conveyor.width) {
                        barrel.x += conveyor.speed * (canvas.width * 0.65 / 737); // Move with conveyor
                    }
                });
            }
        });
        if (barrel.type === 'spring' && barrel.x < canvas.width - 100 * (canvas.width * 0.65 / 737) && Math.random() < 0.1) barrel.dy = -10 * (canvas.height * 0.65 / 500); // Spring bounce, scaled
        if (barrel.x < -32 * (canvas.width * 0.65 / 737) || barrel.y > canvas.height) barrels.splice(i, 1);
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

    // Hammer, ladder, rivet logic remains the same, but ensure scaling adjustments...

    // Level completion (reach Pauline except Level 4), considering landscape, reduced width by 20%, moved platforms up, compacted content at 65%
    if (level !== 4 && mario.y < 250 * (canvas.height * 0.65 / 500) + 50 * (canvas.height * 0.65 / 500) && Math.abs(mario.x - pauline.x) < 100 * (canvas.width * 0.65 / 737)) levelUp(); // Adjusted for top platform at y: 250, scaled

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
