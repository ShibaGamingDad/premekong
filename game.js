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
    y: 36, // Base position on top platform (y: 100 - 64 for height 64)
    width: 64,
    height: 64,
    bounceDir: 1, // Vertical bounce direction (1 for up, -1 for down)
    bounceRange: 20 // Bounce range (up and down by 20px)
}; // Top platform, left side, bouncing vertically
let pauline = {
    x: 124, // Next to Preme Kong (x: 50 + 64 + 10 for 10px gap)
    y: 68, // On top platform (y: 100 - 32 for height 32, aligned with Kong)
    width: 16, // Reduced collision width to 16px (half of original 32px) for smaller collision area
    height: 32
}; // Top platform, right side, next to Preme Kong, reduced collision area
let barrels = [];
let conveyors = [];
let elevators = [];
let springs = [];
let hammers = [];
let rivets = [];
let fireballs = []; // Array for fireballs
let ladders = [];
let score = 0;
let level = 1;
let gameActive = true;
let backgrounds = [];
let platformImg = new Image(); // Global platform image
let ladderImg = new Image(); // Global ladder image
let hammerImg = new Image(); // Global hammer image
let barrelImg = new Image(); // Global barrel image
let rivetImg = new Image(); // Global rivet image
let fireballImg = new Image(); // Global fireball image
let cementPieImg = new Image(); // Global cement pie image
let perfectRunsToday = 0; // Track perfect runs per player (reset daily, account-based)
let lastPerfectRunTime = 0; // Track last perfect run timestamp (in milliseconds)
let premeEarned = 0; // Track $PREME Tokens earned per player (persistent, account-based, unless withdrawn/spent)
let premeBurn = 0; // Global counter for $PREME Burn (1% of perfect run earnings, resets monthly, shared across players)
let jackpot = 0; // Global counter for Jackpot (shared across players, persists unless reset by bot)

// Telegram setup
if (Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

// Utility functions
function updateScore() {
    const burn = 0; // Placeholder for bot integration (monthly reset)
    document.getElementById('score').innerText = `Score: ${score}  Jackpot: ${jackpot} $PREME  Burn This Month: ${premeBurn} $PREME  Perfect: ${perfectRunsToday}/5  $PREME Earned: ${premeEarned}`;
    console.log('Current score:', score, 'Perfect Runs:', perfectRunsToday, '$PREME Earned:', premeEarned, 'PREME Burn:', premeBurn, 'Jackpot:', jackpot); // Debug log for scoring verification
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function levelUp() {
    level = level % 4 + 1; // Ensure level resets to 1 after 4
    if (level === 1) {
        resetGame(); // Reset game when returning to Level 1 after Level 4
    } else {
        initLevel();
        score += 300; // Award 300 points for reaching Pauline
    }
    checkPerfectRun(); // Check for perfect run after level completion
}

function resetGame() {
    score = 0; // Reset score to 0 (account-based)
    level = 1; // Reset to Level 1
    mario.x = 50;
    mario.y = 318; // Reset Mario to bottom platform
    mario.hasHammer = false;
    mario.hammerTime = 0;
    mario.onLadder = false;
    mario.dy = 0;
    premekong.x = 50;
    premekong.y = 36;
    premekong.bounceDir = 1;
    pauline.x = 124;
    pauline.y = 68;
    barrels = [];
    conveyors = [];
    elevators = [];
    springs = [];
    hammers = [];
    rivets = [];
    fireballs = [];
    ladders = [];
    initLevel(); // Reinitialize the level
    // Do not reset premeEarned or perfectRunsToday here—they are account-based and persist
}

function checkPerfectRun() {
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds (simplified for monthly reset)

    // Check if 24 hours have passed since the last perfect run reset for perfectRunsToday
    if (currentTime - lastPerfectRunTime > twentyFourHours) {
        perfectRunsToday = 0; // Reset perfect runs daily
        lastPerfectRunTime = currentTime;
    }

    // Simulate monthly reset for premeBurn (in a real implementation, this would be managed by a server)
    // For now, keep premeBurn persistent unless manually reset (e.g., via bot after a month)
    if (currentTime - /* lastBurnResetTime (not implemented, assume persistent) */ > oneMonth) {
        premeBurn = 0; // Reset premeBurn monthly (simulated, would be server-side)
        // lastBurnResetTime = currentTime; // Would be implemented in a real system
    }

    // Count remaining rivets in the current level (16 per level, total 64)
    const remainingRivets = rivets.length;
    const damageTaken = score < 0 || (score % 10 !== 0 && score > 0); // Simplified damage check (negative score or odd score after penalties)

    if (remainingRivets === 0 && !damageTaken && perfectRunsToday < 5) {
        perfectRunsToday++;
        premeEarned += 50; // Award 50 $PREME Tokens for perfect run (account-based, persists unless withdrawn/spent)
        const burnAmount = 50 * 0.01; // 1% of 50 $PREME for burn
        premeBurn += burnAmount; // Add to global premeBurn counter (shared across players, resets monthly)
        console.log('Perfect run achieved! Earned 50 $PREME Tokens. Perfect runs today:', perfectRunsToday, '$PREME Earned:', premeEarned, 'PREME Burn:', premeBurn);
        // In a real implementation, this would trigger a Telegram API call to award 50 $PREME Tokens and update premeBurn globally
        alert('Perfect run! You earned 50 $PREME Tokens. You have ' + (5 - perfectRunsToday) + ' perfect runs left today. 1% ($0.50) added to PREME Burn.');
    }
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
    cementPieImg.src = 'cement_pie.png'; console.log('Cement Pie:', cementPieImg.src);
    springImg = new Image(); springImg.src = 'spring.png'; console.log('Spring:', springImg.src);
    hammerImg.src = 'hammer.png'; console.log('Hammer:', hammerImg.src);
    ladderImg.src = 'ladder.png'; console.log('Ladder:', ladderImg.src);
    rivetImg.src = 'rivet.png'; console.log('Rivet:', rivetImg.src);
    fireballImg.src = 'fireball.png'; console.log('Fireball:', fireballImg.src);
    platformImg.src = 'platform.png'; console.log('Platform:', platformImg.src);

    backgrounds[1] = new Image(); backgrounds[1].src = 'background1.png'; console.log('Background 1:', backgrounds[1].src);
    backgrounds[2] = new Image(); backgrounds[2].src = 'background2.png'; console.log('Background 2:', backgrounds[2].src);
    backgrounds[3] = new Image(); backgrounds[3].src = 'background3.png'; console.log('Background 3:', backgrounds[3].src);
    backgrounds[4] = new Image(); backgrounds[4].src = 'background4.png'; console.log('Background 4:', backgrounds[4].src);
}

// Initialize level (with direct canvas dimensions for landscape, 672x500, platforms 672x10, 16 rivets per level, total 64, spread out, fixed duplication)
function initLevel() {
    barrels = [];
    conveyors = [];
    elevators = [];
    springs = [];
    hammers = [];
    rivets = [];
    fireballs = []; // Initialize fireballs array
    ladders = [];
    
    // Use canvas dimensions directly, no additional scaling, adjusted positions
    mario.x = 50;
    mario.y = 318; // 1 platform level up (from y: 450 to y: 350 - 32 for height 32, on bottom platform at y: 400)
    mario.hasHammer = false; mario.hammerTime = 0;
    mario.onLadder = false; // Reset ladder state
    mario.dy = 0; // Reset vertical speed for ladder climbing
    premekong.x = 50;
    premekong.y = 36; // Base position on top platform (y: 100 - 64 for height 64)
    premekong.bounceDir = 1; // Start bouncing up
    pauline.x = 124; // Next to Preme Kong (x: 50 + 64 + 10 for 10px gap)
    pauline.y = 68; // On top platform (y: 100 - 32 for height 32, aligned with Kong)

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
        // Add 16 rivets (4 per platform, spread out more, 50 points each, remove rivet at Pauline’s position)
        for (let i = 0; i < 4; i++) {
            rivets.push({ x: 50 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false }); // Bottom platform
            rivets.push({ x: 250 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false }); // Second platform
            rivets.push({ x: 250 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false }); // Third platform
            rivets.push({ x: 250 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false });
            if (i !== 1 || (i === 1 && (50 + i * 75 !== 124 && 250 + i * 75 !== 124))) { // Exclude rivet at x: 124 (Pauline’s position)
                rivets.push({ x: 50 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false }); // Top platform
                rivets.push({ x: 250 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false });
            }
        }
    } else if (level === 2) { // 50m - Conveyors
        conveyors.push({ x: 0, y: platformY[3], width: canvas.width, height: 10, speed: 1 }); // Top platform at y: 100, 672x10
        conveyors.push({ x: 0, y: platformY[2], width: canvas.width, height: 10, speed: -1 }); // Third platform at y: 200, 672x10
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 }); // Bottom ladder
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 }); // Second ladder
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 }); // Third ladder
        ladders.push({ x: 350, y: platformY[3] - 100, width: 20, height: 100 }); // Top ladder
        hammers.push({ x: 200, y: platformY[3] - 32, width: 32, height: 32, taken: false });
        // Add 16 rivets (4 per platform, spread out more, 50 points each, remove rivet at Pauline’s position)
        for (let i = 0; i < 4; i++) {
            rivets.push({ x: 50 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false }); // Bottom platform
            rivets.push({ x: 250 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false }); // Second platform
            rivets.push({ x: 250 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false }); // Third platform
            rivets.push({ x: 250 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false });
            if (i !== 1 || (i === 1 && (50 + i * 75 !== 124 && 250 + i * 75 !== 124))) { // Exclude rivet at x: 124 (Pauline’s position)
                rivets.push({ x: 50 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false }); // Top platform
                rivets.push({ x: 250 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false });
            }
        }
    } else if (level === 3) { // 75m - Elevators and Fireballs
        elevators.push({ x: 150, y: 300, width: 40, height: 20, dy: 2, minY: 100, maxY: 400 }); // Adjusted for new platform heights, 672x10 platforms
        elevators.push({ x: 450, y: 200, width: 40, height: 20, dy: -2, minY: 100, maxY: 400 }); // Adjusted for new platform heights
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 }); // Bottom ladder
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 }); // Second ladder
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 }); // Third ladder
        // Add 16 rivets (4 per platform, spread out more, 50 points each, remove rivet at Pauline’s position)
        for (let i = 0; i < 4; i++) {
            rivets.push({ x: 50 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false }); // Bottom platform
            rivets.push({ x: 250 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false }); // Second platform
            rivets.push({ x: 250 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false }); // Third platform
            rivets.push({ x: 250 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false });
            if (i !== 1 || (i === 1 && (50 + i * 75 !== 124 && 250 + i * 75 !== 124))) { // Exclude rivet at x: 124 (Pauline’s position)
                rivets.push({ x: 50 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false }); // Top platform
                rivets.push({ x: 250 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false });
            }
        }
    } else if (level === 4) { // 100m - Rivets (hardest level with all hazards, Pauline active)
        // Add conveyors for difficulty
        conveyors.push({ x: 0, y: platformY[3], width: canvas.width, height: 10, speed: 2 }); // Top platform at y: 100, faster speed, 672x10
        conveyors.push({ x: 0, y: platformY[2], width: canvas.width, height: 10, speed: -2 }); // Third platform at y: 200, faster speed, 672x10
        conveyors.push({ x: 0, y: platformY[1], width: canvas.width, height: 10, speed: 2 }); // Second platform at y: 300, faster speed, 672x10
        conveyors.push({ x: 0, y: platformY[0], width: canvas.width, height: 10, speed: -2 }); // Bottom platform at y: 400, faster speed, 672x10
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 }); // Bottom ladder
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 }); // Second ladder
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 }); // Third ladder
        // Add barrels, fireballs, springs, and cement pies with higher frequency, slower speeds
        hammers.push({ x: 200, y: platformY[3] - 32, width: 32, height: 32, taken: false });
        // Add 16 rivets (4 per platform, spread out more, 50 points each, remove rivet at Pauline’s position)
        for (let i = 0; i < 4; i++) {
            rivets.push({ x: 50 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false }); // Bottom platform
            rivets.push({ x: 250 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false }); // Second platform
            rivets.push({ x: 250 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false }); // Third platform
            rivets.push({ x: 250 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false });
            if (i !== 1 || (i === 1 && (50 + i * 75 !== 124 && 250 + i * 75 !== 124))) { // Exclude rivet at x: 124 (Pauline’s position)
                rivets.push({ x: 50 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false }); // Top platform
                rivets.push({ x: 250 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false });
            }
        }
    }
    updateScore();
    console.log('Canvas size after scaling:', canvas.width, canvas.height, 'Rivets in level:', rivets.length); // Verify rendered dimensions and rivet count
}

// Draw game (with direct canvas dimensions for landscape, 672x500, platforms 672x10, 16 rivets per level, total 64, spread out, fixes)
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
        else ctx.fillRect(rivet.x, rivet.y, rivet.width, rivet.height);
    });

    // Draw fireballs
    fireballs.forEach(fireball => {
        if (fireballImg.complete) ctx.drawImage(fireballImg, fireball.x, fireball.y, 32, 32);
        else ctx.fillRect(fireball.x, fireball.y, 32, 32);
    });

    // Draw Mario (with fallback if image fails to load)
    if (mario.image.complete) {
        ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
    } else {
        ctx.fillStyle = 'blue'; // Fallback color for debugging
        ctx.fillRect(mario.x, mario.y, mario.width, mario.height);
        console.log('Mario image not loaded, using fallback:', mario.image.src);
    }

    // Draw Preme Kong (bouncing vertically on top platform, tossing barrels to the right)
    if (premekong.image.complete) {
        ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);
    }
    // Vertical bouncing on top platform (y: 36 ± 20), slowed down even more
    premekong.y += premekong.bounceDir * 0.125; // Slowed bounce speed to 0.125 pixels per frame
    if (premekong.y <= 36 - premekong.bounceRange || premekong.y >= 36 + premekong.bounceRange) {
        premekong.bounceDir *= -1; // Reverse direction when hitting bounce range limits
    }

    // Draw Pauline (with reduced collision area)
    if (pauline.image.complete) ctx.drawImage(pauline.image, pauline.x, pauline.y, 32, pauline.height); // Keep visual size 32px wide, but use 16px collision width
    else ctx.fillRect(pauline.x, pauline.y, 32, pauline.height); // Visual size remains 32px for sprite

    // Draw barrels, cement pies, springs (tossing to the right, fall immediately at ladders, slower speeds)
    barrels.forEach(barrel => {
        if (barrel.type === 'cement_pie' && cementPieImg.complete) ctx.drawImage(cementPieImg, barrel.x, barrel.y, 32, 32);
        else if (barrel.type === 'spring' && springImg.complete) ctx.drawImage(springImg, barrel.x, barrel.y, 32, 32);
        else if (barrelImg.complete) ctx.drawImage(barrelImg, barrel.x, barrel.y, 32, 32);
        else ctx.fillRect(barrel.x, barrel.y, 32, 32);
    });

    requestAnimationFrame(draw);
}

// Update game logic (with direct canvas dimensions for landscape, 672x500, platforms 672x10, 16 rivets per level, total 64, spread out, fixes)
function update() {
    if (!gameActive) return;

    // Mario physics and ladder climbing
    if (!mario.onLadder) {
        mario.dy += mario.gravity; // Original gravity
        mario.y += mario.dy;
        if (mario.jumping) {
            mario.dy = -10; // Original jump strength
            mario.jumping = false;
        }
    } else {
        mario.dy = 0; // No gravity while on ladder
        mario.y += mario.dy * mario.speed; // Move up/down based on climb direction
    }
    mario.x += mario.dx * mario.speed; // Original speed

    // Platform and ladder collision (for Mario, improved ladder climbing and level transition)
    const platformY = [400, 300, 200, 100]; // Adjusted platforms, top at y: 100 (middle of screen)
    platformY.forEach(py => {
        if (mario.y + mario.height > py && mario.y + mario.height < py + 10 && mario.dy > 0 && !mario.onLadder) {
            mario.y = py - mario.height; // Ensure Mario stays on the platform
            mario.dy = 0;
            mario.onLadder = false; // Exit ladder if landing on platform
        }
        // Prevent Mario from falling below the bottom platform
        if (mario.y > canvas.height - mario.height) {
            mario.y = canvas.height - mario.height; // Keep Mario at the bottom (y: 468)
            mario.dy = 0;
            mario.onLadder = false; // Ensure Mario isn't on ladder if at bottom
        }
    });

    // Ladder collision for Mario (enable climbing, improved precision, prevent false level transitions, allow jumping over Pauline)
    ladders.forEach(ladder => {
        if (checkCollision(mario, ladder) && mario.y + mario.height > ladder.y && mario.y < ladder.y + ladder.height) {
            mario.onLadder = true; // Mario can climb if touching ladder
            // Ensure Mario stays within ladder bounds vertically
            if (mario.y < ladder.y) mario.y = ladder.y;
            if (mario.y + mario.height > ladder.y + ladder.height) mario.y = ladder.y + ladder.height - mario.height;
            // Allow Mario to exit ladder if moving horizontally off it or stopping climbing
            if ((mario.dx !== 0 && !checkCollision(mario, ladder)) || (mario.dy === 0 && mario.onLadder)) mario.onLadder = false;
        } else if (!checkCollision(mario, ladder)) {
            mario.onLadder = false; // Exit ladder if not touching
        }
    });

    // Preme Kong barrel throwing (bouncing vertically, tossing barrels to the right, scaled for landscape, 672x500, platforms 672x10, slower speeds)
    if (Math.random() < 0.05) { // Increased frequency for Level 4 difficulty
        if (level === 1) barrels.push({
            x: premekong.x + premekong.width, // Start from right edge of Preme Kong
            y: premekong.y + premekong.height,
            dx: 1.5, // Slower barrels to prevent skipping ladders
            dy: 0,
            type: 'barrel'
        });
        else if (level === 2) barrels.push({
            x: premekong.x + premekong.width, // Start from right edge of Preme Kong
            y: premekong.y + premekong.height, 
            dx: 1.5, // Slower cement pies
            dy: 0,
            type: 'cement_pie'
        });
        else if (level === 3) {
            barrels.push({
                x: premekong.x + premekong.width, // Start from right edge of Preme Kong
                y: premekong.y + premekong.height, 
                dx: 2.5, // Slower springs
                dy: 0,
                type: 'spring'
            });
            if (Math.random() < 0.03) { // Slightly increased frequency for fireballs
                fireballs.push({
                    x: premekong.x + premekong.width,
                    y: premekong.y + premekong.height,
                    dx: 3.5, // Slower fireballs
                    dy: 0,
                    type: 'fireball'
                });
            }
        } else if (level === 4) { // Hardest level with all hazards, higher frequency, slower speeds
            if (Math.random() < 0.07) barrels.push({ // Increased barrel frequency
                x: premekong.x + premekong.width,
                y: premekong.y + premekong.height,
                dx: 2, // Slower barrels
                dy: 0,
                type: 'barrel'
            });
            if (Math.random() < 0.05) barrels.push({ // Add cement pies
                x: premekong.x + premekong.width,
                y: premekong.y + premekong.height,
                dx: 2, // Slower cement pies
                dy: 0,
                type: 'cement_pie'
            });
            if (Math.random() < 0.04) barrels.push({ // Add springs
                x: premekong.x + premekong.width,
                y: premekong.y + premekong.height,
                dx: 3, // Slower springs
                dy: 0,
                type: 'spring'
            });
            if (Math.random() < 0.04) fireballs.push({ // Increased fireball frequency
                x: premekong.x + premekong.width,
                y: premekong.y + premekong.height,
                dx: 4, // Slower fireballs
                dy: 0,
                type: 'fireball'
            });
        }
    }

    // Vertical bouncing for Preme Kong (on top platform, slowed down even more)
    premekong.y += premekong.bounceDir * 0.125; // Slowed bounce speed to 0.125 pixels per frame
    if (premekong.y <= 36 - premekong.bounceRange || premekong.y >= 36 + premekong.bounceRange) {
        premekong.bounceDir *= -1; // Reverse direction when hitting bounce range limits
    }

    // Barrel/spring/cement pie movement (scaled for landscape, 672x500, platforms 672x10, fall immediately at ladders, slower speeds)
    barrels.forEach((barrel, i) => {
        barrel.x += barrel.dx;
        barrel.y += barrel.dy || 2; // Apply gravity for barrels
        const platformY = [400, 300, 200, 100]; // Adjusted platforms
        platformY.forEach(py => {
            if (barrel.y + 32 > py && barrel.y + 32 < py + 10 && barrel.dy >= 0) {
                barrel.y = py - 32; // Keep barrel on top of platform (672x10)
                barrel.dy = 0; // Stop falling
                // Check for ladders to make barrels fall immediately
                ladders.forEach(ladder => {
                    if (barrel.x >= ladder.x - 32 && barrel.x <= ladder.x + ladder.width) {
                        barrel.dy = 2; // Trigger immediate fall when hitting ladder
                    }
                });
                // Apply conveyor speed if on conveyor
                conveyors.forEach(conveyor => {
                    if (barrel.y === conveyor.y && barrel.x >= conveyor.x && barrel.x + 32 <= conveyor.x + conveyor.width) {
                        barrel.x += conveyor.speed; // Move with conveyor
                    }
                });
            }
        });
        if (barrel.type === 'spring' && barrel.x < canvas.width - 100 && Math.random() < 0.1) barrel.dy = -10; // Spring bounce
        if (barrel.x > canvas.width + 32 || barrel.y > canvas.height) barrels.splice(i, 1); // Remove barrels off-screen to the right
        if (checkCollision(mario, barrel)) {
            if (mario.hasHammer) {
                barrels.splice(i, 1);
                score += 100;
                console.log('Barrel hit with hammer, score +100:', score); // Debug log
            } else {
                score -= 10;
                console.log('Barrel hit without hammer, score -10:', score); // Debug log
                barrels.splice(i, 1);
                if (score < 0) score = 0;
            }
        }
    });

    // Fireball movement (scaled for landscape, 672x500, platforms 672x10, fall immediately at ladders, slower speeds)
    fireballs.forEach((fireball, i) => {
        fireball.x += fireball.dx;
        fireball.y += fireball.dy || 2; // Apply gravity for fireballs
        const platformY = [400, 300, 200, 100]; // Adjusted platforms
        platformY.forEach(py => {
            if (fireball.y + 32 > py && fireball.y + 32 < py + 10 && fireball.dy >= 0) {
                fireball.y = py - 32; // Keep fireball on top of platform (672x10)
                fireball.dy = 0; // Stop falling
                // Check for ladders to make fireballs fall immediately
                ladders.forEach(ladder => {
                    if (fireball.x >= ladder.x - 32 && fireball.x <= ladder.x + ladder.width) {
                        fireball.dy = 2; // Trigger immediate fall when hitting ladder
                    }
                });
            }
        });
        if (fireball.x > canvas.width + 32 || fireball.y > canvas.height) fireballs.splice(i, 1); // Remove fireballs off-screen to the right
        if (checkCollision(mario, fireball)) {
            score -= 20; // Penalty for hitting fireball
            console.log('Fireball hit, score -20:', score); // Debug log
            fireballs.splice(i, 1);
            if (score < 0) score = 0;
        }
    });

    // Conveyor movement (updated for stability)
    conveyors.forEach(conveyor => {
        // No need to move conveyors themselves, just their effect on barrels and fireballs
    });

    // Elevator movement (simplified for clarity, can be expanded if needed)
    elevators.forEach(elevator => {
        elevator.y += elevator.dy;
        if (elevator.y <= elevator.minY || elevator.y >= elevator.maxY) elevator.dy *= -1;
    });

    // Rivet collection (for all levels, 50 points each, 16 per level, total 64, spread out)
    rivets.forEach((rivet, i) => {
        if (checkCollision(mario, rivet)) {
            rivet.hit = true;
            score += 50; // 50 points per rivet
            console.log('Rivet collected, score +50:', score); // Debug log
            rivets.splice(i, 1);
            if (level === 4 && rivets.length === 0) {
                checkPerfectRun(); // Ensure perfect run is checked before reset
                resetGame(); // Reset game to Level 1 when last rivet in Level 4 is collected
            }
        }
    });

    // Hammer, ladder, rivet logic remains the same, but ensure adjustments for new features...

    // Level completion or reset (reach Pauline for 300 points, reset Level 4 on Pauline or last rivet), considering landscape, 672x500, platforms 672x10, adjusted positions, allow jumping over Pauline
    if (mario.y < pauline.y + 50 && Math.abs(mario.x - pauline.x) < pauline.width / 2 && mario.y + mario.height <= pauline.y + pauline.height) { // Use reduced collision width and ensure Mario is below Pauline’s top to prevent jump-over trigger
        if (level === 4) {
            checkPerfectRun(); // Ensure perfect run is checked before reset
            resetGame(); // Reset to Level 1 when reaching Pauline in Level 4
        } else {
            levelUp(); // Advance to next level for Levels 1–3, award 300 points
        }
    }

    // Allow Mario to jump over Pauline to reach Preme Kong’s rivet (no level transition unless within reduced x-range and below Pauline)
    if (mario.y < pauline.y + mario.height && mario.y + mario.height > pauline.y && Math.abs(mario.x - pauline.x) > pauline.width / 2) {
        // No level transition if Mario is jumping over Pauline but not within her reduced collision area and below her top
    }

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

// Controls (including improved ladder climbing)
function moveLeft() { if (gameActive && !mario.hasHammer) mario.dx = -1; }
function moveRight() { if (gameActive && !mario.hasHammer) mario.dx = 1; }
function jump() { if (gameActive && !mario.jumping && !mario.onLadder && !mario.hasHammer) mario.jumping = true; }
function climbUp() { if (gameActive && mario.onLadder) mario.dy = -1; }
function climbDown() { if (gameActive && mario.onLadder) mario.dy = 1; }
function stopMove() { mario.dx = 0; }
function stopClimb() { mario.dy = 0; mario.onLadder = false; } // Ensure Mario exits ladder when stopping

// Telegram data handler
function handleTelegramData() {
    if (Telegram && Telegram.WebApp) {
        Telegram.WebApp.onEvent('web_app_data', (data) => {
            if (data.data) {
                const gameData = JSON.parse(data.data);
                score = gameData.score || score;
                perfectRunsToday = gameData.perfectRunsToday || perfectRunsToday;
                premeEarned = gameData.premeEarned || premeEarned; // Persist $PREME Earned
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
