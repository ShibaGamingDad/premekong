const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Debug canvas setup
if (!canvas) {
    console.error('Canvas not found! Check index.html for <canvas id="gameCanvas">');
} else {
    console.log('Canvas found, setting size:', 672, 'x', 768);
    canvas.width = 672; // Match your HTML's width
    canvas.height = 768; // Match your HTML's height
    console.log('Actual canvas size after setting:', canvas.width, 'x', canvas.height);
    if (canvas.width !== 672 || canvas.height !== 768) {
        console.warn('Canvas size mismatch! Expected 672x768, got', canvas.width, 'x', canvas.height);
    }
}

let mario = { x: 50, y: canvas.height - 100 - 32, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false };
let premekong = { x: 50, y: canvas.height - 400 - 64, width: 64, height: 64, dropping: true }; // Enable dropping to throw barrels
let pauline = { x: 150, y: canvas.height - 400 - 32, width: 32, height: 32, image: null }; // Pauline stays on top platform, slightly right
let barrels = [];
let score = 0;
let level = 1;
let rivets = [];
let ladders = [];
let platforms = [];
let gameActive = true;
let gameOver = false; // New state for ending turns

// Load images with fallbacks and debug
function loadImages() {
    console.log('Loading images...');
    try {
        mario.image = new Image();
        mario.image.src = 'mario.png';
        mario.image.onload = () => console.log('Mario image loaded at:', mario.image.src, 'Dimensions:', mario.image.width, 'x', mario.image.height);
        mario.image.onerror = () => { console.error('Mario image failed to load at:', mario.image.src); mario.image = null; };

        premekong.image = new Image();
        premekong.image.src = 'premekong.png';
        premekong.image.onload = () => console.log('Preme Kong image loaded at:', premekong.image.src, 'Dimensions:', premekong.image.width, 'x', premekong.image.height);
        premekong.image.onerror = () => { console.error('Preme Kong image failed to load at:', premekong.image.src); premekong.image = null; };

        pauline.image = new Image();
        pauline.image.src = 'pauline.png'; // Assume you have a Pauline image; use fallback if not
        pauline.image.onload = () => console.log('Pauline image loaded at:', pauline.image.src, 'Dimensions:', pauline.image.width, 'x', pauline.image.height);
        pauline.image.onerror = () => { console.error('Pauline image failed to load at:', pauline.image.src); pauline.image = null; };

        const barrelImg = new Image();
        barrelImg.src = 'barrel.png';
        barrelImg.onload = () => console.log('Barrel image loaded at:', barrelImg.src, 'Dimensions:', barrelImg.width, 'x', barrelImg.height);
        barrelImg.onerror = () => console.error('Barrel image failed to load at:', barrelImg.src);

        const ladderImg = new Image();
        ladderImg.src = 'ladder.png';
        ladderImg.onload = () => console.log('Ladder image loaded at:', ladderImg.src, 'Dimensions:', ladderImg.width, 'x', ladderImg.height);
        ladderImg.onerror = () => { console.error('Ladder image failed to load at:', ladderImg.src); ladderImg.width = 50; ladderImg.height = 100; }; // Fallback size

        const platformImg = new Image();
        platformImg.src = 'platform.png';
        platformImg.onload = () => console.log('Platform image loaded at:', platformImg.src, 'Dimensions:', platformImg.width, 'x', platformImg.height);
        platformImg.onerror = () => { console.error('Platform image failed to load at:', platformImg.src); platformImg.width = canvas.width; platformImg.height = 20; }; // Fallback size

        const rivetImg = new Image();
        rivetImg.src = 'rivet.png';
        rivetImg.onload = () => console.log('Rivet image loaded at:', rivetImg.src, 'Dimensions:', rivetImg.width, 'x', rivetImg.height);
        rivetImg.onerror = () => console.error('Rivet image failed to load at:', rivetImg.src);

        platforms.forEach(platform => platform.image = platformImg || null);
        ladders.forEach(ladder => ladder.image = ladderImg || null);
        rivets.forEach(rivet => rivet.image = rivetImg || null);
        barrels.forEach(barrel => barrel.image = barrelImg || null);
    } catch (error) {
        console.error('Error in loadImages:', error);
    }
}

// Initialize levels with all elements, adjusted for better platform alignment, ladder/rivet positioning, and platform tilt
function initLevel() {
    console.log('Initializing level with canvas size:', canvas.width, 'x', canvas.height);
    try {
        platforms = [];
        ladders = [];
        rivets = [];
        const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];
        for (let i = 0; i < 4; i++) {
            platforms.push({ x: 0, y: platformY[i], width: canvas.width, height: 20, image: null });
            // Position rivets on top of platforms (just below the top edge)
            for (let j = 0; j < 5; j++) {
                rivets.push({ x: 100 + j * 100, y: platformY[i] - 10, width: 10, height: 10, hit: false, image: null }); // Moved to top (y - 10)
            }
        }
        // Three separate ladders, moved up slightly to connect to the next platform
        ladders.push({ x: 506, y: platformY[0] - 35, width: 50, height: 100, image: null }); // Ladder 1: between 1st and 2nd, up to y: 633 (from 628)
        ladders.push({ x: 94, y: platformY[1] - 35, width: 50, height: 100, image: null }); // Ladder 2: between 2nd and 3rd, up to y: 533 (from 528)
        ladders.push({ x: 506, y: platformY[2] - 35, width: 50, height: 100, image: null }); // Ladder 3: between 3rd and 4th, up to y: 433 (from 428)

        mario.y = canvas.height - 100 - mario.height; // Start Mario on the bottom platform
        mario.x = 50; // Ensure Mario starts on the left
        premekong.y = canvas.height - 400 - premekong.height; // Keep Preme Kong static on top left platform
        premekong.x = 50; // Keep Preme Kong on left side
        pauline.y = canvas.height - 400 - pauline.height; // Keep Pauline on top platform
        pauline.x = 150; // Pauline stays slightly to the right
        console.log('Preme Kong position before draw:', premekong.x, premekong.y);
        console.log('Pauline position before draw:', pauline.x, pauline.y);
        barrels = [];
        score = 0;
        gameOver = false; // Reset game state
        updateScore();
    } catch (error) {
        console.error('Error in initLevel:', error);
    }
}

// Draw game elements with debug, including Pauline, wrapped in try/catch
function draw() {
    if (!gameActive || gameOver) return; // Stop drawing if game is over
    console.log('Drawing frame, Mario at:', mario.x, mario.y, 'Preme Kong at:', premekong.x, premekong.y, 'Pauline at:', pauline.x, pauline.y);
    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw platforms
        console.log('Drawing platforms, count:', platforms.length);
        ctx.fillStyle = 'red';
        platforms.forEach(platform => {
            if (platform.image && platform.image.complete) {
                console.log('Drawing platform image at:', platform.x, platform.y, 'Dimensions:', platform.image.width, 'x', platform.image.height);
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
                console.log('Drawing ladder image at:', ladder.x, ladder.y, 'Dimensions:', ladder.image.width, 'x', ladder.image.height);
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
                console.log('Drawing rivet image at:', rivet.x, rivet.y, 'Dimensions:', rivet.image.width, 'x', rivet.image.height);
                ctx.drawImage(rivet.image, rivet.x, rivet.y, rivet.width, rivet.height);
            } else if (!rivet.hit) {
                console.log('Drawing rivet fallback at:', rivet.x, rivet.y);
                ctx.fillRect(rivet.x, rivet.y, rivet.width, rivet.height);
            }
        });
        
        // Draw Mario
        console.log('Drawing Mario at:', mario.x, mario.y);
        if (mario.image && mario.image.complete) {
            console.log('Drawing Mario image at:', mario.x, mario.y, 'Dimensions:', mario.image.width, 'x', mario.image.height);
            ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
        } else {
            console.log('Drawing Mario fallback at:', mario.x, mario.y);
            ctx.fillStyle = 'white';
            ctx.fillRect(mario.x, mario.y, mario.width, mario.height); // Fallback
        }
        
        // Draw Preme Kong
        console.log('Drawing Preme Kong at:', premekong.x, premekong.y);
        if (premekong.image && premekong.image.complete) {
            console.log('Drawing Preme Kong image at:', premekong.x, premekong.y, 'Dimensions:', premekong.image.width, 'x', premekong.image.height);
            ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);
        } else {
            console.log('Drawing Preme Kong fallback at:', premekong.x, premekong.y);
            ctx.fillStyle = 'blue';
            ctx.fillRect(premekong.x, premekong.y, premekong.width, premekong.height); // Fallback
        }
        
        // Draw Pauline
        console.log('Drawing Pauline at:', pauline.x, pauline.y);
        if (pauline.image && pauline.image.complete) {
            console.log('Drawing Pauline image at:', pauline.x, pauline.y, 'Dimensions:', pauline.image.width, 'x', pauline.image.height);
            ctx.drawImage(pauline.image, pauline.x, pauline.y, pauline.width, pauline.height);
        } else {
            console.log('Drawing Pauline fallback at:', pauline.x, pauline.y);
            ctx.fillStyle = 'pink'; // Fallback color for Pauline
            ctx.fillRect(pauline.x, pauline.y, pauline.width, pauline.height); // Fallback
        }
        
        // Draw barrels
        console.log('Drawing barrels, count:', barrels.length);
        ctx.fillStyle = 'brown';
        barrels.forEach(barrel => {
            if (barrel.image && barrel.image.complete) {
                console.log('Drawing barrel image at:', barrel.x, barrel.y, 'Dimensions:', barrel.image.width, 'x', barrel.image.height);
                ctx.drawImage(barrel.image, barrel.x, barrel.y, 32, 32);
            } else {
                console.log('Drawing barrel fallback at:', barrel.x, barrel.y);
                ctx.fillRect(barrel.x, barrel.y, 32, 32);
            }
        });
        
        updateScore();
    } catch (error) {
        console.error('Error in draw function:', error);
    }
}

// Update game logic with improved platform collision, limited jump, ladder exit, slower barrels, reduced frequency, spread out barrels, rolling/thrown barrel mechanics, and turn end on barrel hit
function update() {
    if (!gameActive || gameOver) return; // Stop updating if game is over
    console.log('Updating frame, gameActive:', gameActive, 'gameOver:', gameOver);
    
    try {
        // Mario movement
        if (mario.dx) mario.x += mario.dx * 5;
        if (mario.dy && mario.onLadder) mario.y += mario.dy * 5;
        if (mario.jumping) {
            mario.y -= 5; // Reduced jump height to just avoid barrels (maintained at 5)
            // Stop jumping just above Mario’s current platform, limited to avoid next platform
            let stopJumpY = mario.y - 15; // Reduced to ~15 pixels (enough to clear a barrel, 32 height, tighter limit)
            const currentPlatformY = findCurrentPlatformY(mario);
            platforms.forEach(platform => {
                if (mario.x < platform.x + platform.width && mario.x + mario.width > platform.x && platform.y < mario.y) {
                    if (platform.y - mario.height < stopJumpY && platform.y - mario.height > currentPlatformY - mario.height - 15) { // Limit to current platform height + small jump
                        stopJumpY = platform.y - mario.height - 15; // Stop just above current platform
                    }
                }
            });
            if (mario.y <= stopJumpY || mario.y <= 0) mario.jumping = false; // Stop at limited height or top of canvas
            console.log('Mario jumping, current y:', mario.y, 'stopJumpY:', stopJumpY, 'current platform y:', currentPlatformY);
        }
        
        // Keep Mario in bounds and apply gravity
        mario.x = Math.max(0, Math.min(mario.x, canvas.width - mario.width));
        if (!mario.onLadder && !mario.jumping) {
            mario.y += 2; // Slow gravity to keep Mario visible longer
            let onPlatform = false;
            platforms.forEach(platform => {
                if (checkCollision(mario, platform) && mario.y + mario.height <= platform.y + 5) {
                    mario.y = platform.y - mario.height; // Land on current platform
                    mario.jumping = false; // Ensure jumping stops
                    onPlatform = true;
                    console.log('Mario landed on platform at:', platform.y);
                }
            });
            if (!onPlatform) {
                // If not on a platform, find the highest platform Mario can land on
                let highestPlatformY = canvas.height - mario.height;
                platforms.forEach(platform => {
                    if (mario.x < platform.x + platform.width && mario.x + mario.width > platform.x) {
                        if (platform.y - mario.height < highestPlatformY && platform.y - mario.height > mario.y) {
                            highestPlatformY = platform.y - mario.height;
                        }
                    }
                });
                mario.y = highestPlatformY; // Set Mario to the highest valid platform or bottom
                console.log('Mario reset to highest platform or bottom:', mario.y);
            }
        }
        
        // Preme Kong static on top platform, barrel throwing (downward targeting Mario with reduced frequency, very slow speed, spread out, plus rolling barrels)
        if (premekong.dropping) {
            premekong.y = canvas.height - 400 - premekong.height; // Ensure Preme Kong stays on top platform
            if (Math.random() < 0.015) { // Reduce frequency to spread out barrels (40% less than 0.025)
                // Add random offset to spread barrels horizontally
                const horizontalOffset = Math.random() * 100 - 50; // Random offset (-50 to 50 pixels)
                const startX = Math.max(0, Math.min(premekong.x + horizontalOffset, canvas.width - 32)); // Start within bounds
                const startY = canvas.height - 400 - 32; // Start from top platform (above Preme Kong)
                const targetY = mario.y + 16; // Target Mario’s middle (32 height / 2 + offset for barrel height)
                const distanceY = targetY - startY; // Vertical distance to Mario
                const distanceX = canvas.width - startX; // Horizontal distance to right edge
                
                // Thrown barrels (targeting Mario, very slow)
                const dxThrown = Math.random() * 0.1; // Very slow horizontal speed (0–0.1)
                const dyThrown = Math.random() * 0.2 + 0.1; // Very slow downward speed (0.1–0.3)
                barrels.push({ 
                    x: startX, 
                    y: startY, 
                    dx: dxThrown, 
                    dy: dyThrown, 
                    type: 'thrown', // Mark as thrown barrel
                    image: new Image() 
                });
                barrels[barrels.length - 1].image.src = 'barrel.png';
                console.log('New thrown barrel created at:', startX, startY, 'with dx:', dxThrown, 'dy:', dyThrown, 'targeting Mario at y:', targetY);
                
                // Rolling barrels (50% chance, start on top platform, roll left, drop at ladder, roll left on third platform)
                if (Math.random() < 0.5) { // 50% chance for rolling barrel
                    const rollingStartX = canvas.width - 32; // Start at right edge of top platform
                    barrels.push({ 
                        x: rollingStartX, 
                        y: canvas.height - 400, // Top platform (y: 368)
                        dx: -0.1, // Roll leftward slowly
                        dy: 0, // No vertical movement until drop
                        type: 'rolling', // Mark as rolling barrel
                        image: new Image() 
                    });
                    barrels[barrels.length - 1].image.src = 'barrel.png';
                    console.log('New rolling barrel created at:', rollingStartX, canvas.height - 400, 'with dx:', -0.1, 'dy:', 0);
                }
            }
        }
        
        // Barrels movement and collision (thrown and rolling, very slow, spread out, with turn end on hit)
        barrels.forEach((barrel, i) => {
            if (barrel.type === 'thrown') {
                // Thrown barrels targeting Mario
                barrel.x += barrel.dx;
                barrel.y += barrel.dy; // Move very slowly downward targeting Mario
            } else if (barrel.type === 'rolling') {
                // Rolling barrels on platforms
                if (barrel.y === canvas.height - 400 && barrel.x <= 506 + 50) { // On top platform, roll left until ladder (x: 506)
                    barrel.x += barrel.dx; // Roll left (-0.1)
                    if (barrel.x <= 506) { // Drop at ladder to third platform (y: 468)
                        barrel.y = canvas.height - 300; // Third platform (y: 468)
                        barrel.dx = -0.1; // Continue rolling left on third platform
                        barrel.dy = 0; // No further vertical movement
                    }
                } else if (barrel.y === canvas.height - 300 && barrel.x >= 94 - 50) { // On third platform, roll left until next ladder (x: 94)
                    barrel.x += barrel.dx; // Roll left (-0.1)
                    if (barrel.x <= 94) { // Remove when reaching ladder (no further roll needed)
                        barrels.splice(i, 1);
                        return;
                    }
                }
            }
            
            console.log('Barrel position:', barrel.x, barrel.y, 'with dx:', barrel.dx, 'dy:', barrel.dy, 'type:', barrel.type);
            if (barrel.x < -32 || barrel.x > canvas.width + 32 || barrel.y > canvas.height + 32) barrels.splice(i, 1); // Remove when off left/right edge or below canvas
            if (checkCollision(mario, barrel)) {
                console.log('Mario hit by barrel at:', barrel.x, barrel.y);
                // End turn: reset Mario, score, and set gameOver
                mario.x = 50;
                mario.y = canvas.height - 100 - mario.height;
                mario.jumping = false;
                mario.onLadder = false;
                score = 0;
                gameOver = true; // Set game over state
                barrels.splice(i, 1); // Remove the barrel
                updateScore();
                console.log('Turn ended, Mario reset to start, score reset to:', score, 'gameOver:', gameOver);
            }
        });
        
        // Ladder and rivet interaction
        mario.onLadder = ladders.some(ladder => mario.x < ladder.x + ladder.width && mario.x + mario.width > ladder.x && mario.y < ladder.y + ladder.height && mario.y + mario.height > ladder.y);
        rivets.forEach(rivet => {
            if (!rivet.hit && checkCollision(mario, rivet)) {
                rivet.hit = true;
                score += 50;
                if (rivets.every(r => r.hit)) levelUp();
                console.log('Rivet collected, score now:', score);
            }
        });
    } catch (error) {
        console.error('Error in update function:', error);
    }
}

// Helper function to find Mario's current platform y-position
function findCurrentPlatformY(mario) {
    const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];
    for (let y of platformY) {
        if (Math.abs(mario.y + mario.height - y) < 5) { // Check if Mario is on this platform (within 5 pixels)
            return y;
        }
    }
    return canvas.height - 100; // Default to bottom platform if not found
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
    console.log('Level up to:', level, 'Score:', score);
}

// Update score display
function updateScore() {
    const jackpot = 0; // Update via bot later
    const burn = 0; // Update via bot later
    document.getElementById('score').innerText = `Score: ${score}  Jackpot: ${jackpot} $PREME  Burn This Month: ${burn} $PREME`;
    console.log('Score updated:', score);
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

    buttons.left.addEventListener('touchstart', () => { if (!gameOver) mario.dx = -1; });
    buttons.right.addEventListener('touchstart', () => { if (!gameOver) mario.dx = 1; });
    buttons.jump.addEventListener('touchstart', () => { if (!gameOver && !mario.jumping && !mario.onLadder) mario.jumping = true; });
    buttons.up.addEventListener('touchstart', () => { if (!gameOver && mario.onLadder) mario.dy = -1; });
    buttons.down.addEventListener('touchstart', () => { if (!gameOver && mario.onLadder) mario.dy = 1; });

    buttons.left.addEventListener('touchend', () => mario.dx = 0);
    buttons.right.addEventListener('touchend', () => mario.dx = 0);
    buttons.up.addEventListener('touchend', () => mario.dy = 0);
    buttons.down.addEventListener('touchend', () => mario.dy = 0);
}

// Function to restart the game (call this when you want to resume after gameOver)
function restartGame() {
    console.log('Restarting game...');
    gameOver = false;
    initLevel(); // Reset all game state
    gameLoop(); // Resume game loop
}

// Handle Telegram WebApp data (for bot integration and potential restart)
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
                    if (gameData.restart) {
                        restartGame(); // Restart game if bot sends restart signal
                    } else {
                        score = gameData.score || score;
                        updateScore();
                        Telegram.WebApp.sendData(JSON.stringify({ score, perfectRun: score >= 400, gameOver }));
                        console.log('Sent Telegram data:', { score, perfectRun: score >= 400, gameOver });
                    }
                } catch (error) {
                    console.error('Error parsing Telegram data:', error);
                }
            }
        });
    }
}

// Game loop
function gameLoop() {
    if (!gameActive || gameOver) return;
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
