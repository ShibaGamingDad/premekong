// Preme Kong Game - Updated March 01, 2025

let gameActive = true;
let gameOver = false;
let level = 1;
let score = 0;
let preme = 0;
let perfectRunsToday = 0;

function initializeGame() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas not found!');
        return null;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Canvas context not available!');
        return null;
    }

    // Adjust canvas for mobile and laptop screens, prioritizing maximum visible fit and Telegram compatibility
    const maxWidth = 672;
    const maxHeight = 768;
    const aspectRatio = maxWidth / maxHeight;
    let newWidth, newHeight;

    // Check if running in Telegram or mobile browser
    const isTelegram = window.Telegram?.WebApp;
    if (isTelegram) {
        Telegram.WebApp.expand();
        // Use dynamic sizing based on Telegram's actual viewport after expansion
        newWidth = Math.min(window.innerWidth * 0.98, maxWidth); // Use 98% of Telegram width for near-full visibility
        // Ensure height is at least 95% of the viewport height, but cap at maxHeight
        newHeight = Math.min(window.innerHeight * 0.95, maxHeight);
        // Adjust height to maintain aspect ratio if necessary
        if (newHeight / aspectRatio < newWidth) {
            newHeight = newWidth * aspectRatio;
        } else if (newWidth / aspectRatio < newHeight) {
            newWidth = newHeight / aspectRatio;
        }
        // Ensure minimum height for better visibility
        if (newHeight < 650) {
            newHeight = 650;
            newWidth = Math.min(newHeight / aspectRatio, maxWidth);
        }
    } else {
        newWidth = Math.min(window.innerWidth * 0.5, maxWidth); // Maintain 50% of screen width for better visibility on non-Telegram
        newHeight = newWidth / aspectRatio;
        if (newHeight > window.innerHeight * 0.45) { // Maintain 45% of screen height
            newHeight = window.innerHeight * 0.45;
            newWidth = newHeight * aspectRatio;
        }
    }

    // Ensure canvas size respects the aspect ratio and Telegram expansion, with floor for integer values
    canvas.width = Math.floor(newWidth);
    canvas.height = Math.floor(newHeight);
    console.log('Canvas size:', canvas.width, 'x', canvas.height);

    return { canvas, ctx };
}

function loadImages() {
    const images = {
        mario: new Image(), premekong: new Image(), pauline: new Image(), hammer: new Image(),
        barrel: new Image(), ladder: new Image(), platform: new Image(), rivet: new Image(),
        bg1: new Image(), bg2: new Image(), bg3: new Image()
    };
    images.mario.src = 'mario.png';
    images.premekong.src = 'premekong.png'; // Fixed typo from 'premekekong.png' to 'premekong.png'
    images.pauline.src = 'pauline.png';
    images.hammer.src = 'hammer.png';
    images.barrel.src = 'barrel.png';
    images.ladder.src = 'ladder.png';
    images.platform.src = 'platform.png';
    images.rivet.src = 'rivet.png';
    images.bg1.src = 'background1.png';
    images.bg2.src = 'background2.png';
    images.bg3.src = 'background3.png';

    return Promise.all(
        Object.entries(images).map(([key, img]) =>
            new Promise((resolve) => {
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.error(`${key} failed to load. Check file path or format.`);
                    resolve({ width: key === 'mario' ? 32 : key === 'premekong' ? 64 : key === 'pauline' ? 32 : key === 'hammer' ? 32 : key === 'barrel' ? 32 : key === 'ladder' ? 50 : key === 'platform' ? 672 : key === 'rivet' ? 20 : 672, height: key === 'mario' ? 32 : key === 'premekong' ? 64 : key === 'pauline' ? 32 : key === 'hammer' ? 32 : key === 'barrel' ? 32 : key === 'ladder' ? 180 : key === 'platform' ? 20 : key === 'rivet' ? 20 : 768 }); // Fallback dimensions
                };
            })
        )
    ).then(loaded => ({
        mario: loaded[0], premekong: loaded[1], pauline: loaded[2], hammer: loaded[3],
        barrel: loaded[4], ladder: loaded[5], platform: loaded[6], rivet: loaded[7],
        backgrounds: [loaded[8], loaded[9], loaded[10]]
    }));
}

let mario, premekong, pauline, hammer, barrels = [], platforms = [], ladders = [], rivets = [];
let images;

function initLevel() {
    const { canvas } = initializeGame();
    if (!canvas || !images) {
        console.error('Canvas or images not initialized!');
        return;
    }
    // Define platforms with a 20% slope (rise of 20 units over run of 100 units, or 11.3-degree angle)
    platforms = [
        { x: 0, startY: canvas.height - 20, width: canvas.width, height: 20, slope: 0.2, image: images.platform }, // Bottom platform, sloped downward to the right
        { x: 0, startY: canvas.height - 200, width: canvas.width, height: 20, slope: 0.2, image: images.platform }, // Second platform, sloped downward to the right
        { x: 0, startY: canvas.height - 400, width: canvas.width, height: 20, slope: 0.2, image: images.platform }, // Third platform, sloped downward to the right
        { x: 0, startY: canvas.height - 600, width: canvas.width, height: 20, slope: 0.2, image: images.platform }  // Top platform, sloped downward to the right
    ];
    ladders = [
        { x: canvas.width / 2 - 25, y: canvas.height - 200, width: 50, height: 180, image: images.ladder },
        { x: canvas.width / 4, y: canvas.height - 400, width: 50, height: 180, image: images.ladder },
        { x: 3 * canvas.width / 4, y: canvas.height - 600, width: 50, height: 180, image: images.ladder }
    ];
    rivets = [];
    for (let i = 0; i < platforms.length; i++) {
        for (let j = 0; j < 5; j++) {
            // Adjust rivet y-position to account for slope (place at the start of each platform for consistency)
            rivets.push({ x: 50 + j * 100, y: platforms[i].startY - 20, width: 20, height: 20, hit: false, image: images.rivet });
        }
    }
    mario = { x: 50, y: canvas.height - 52, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false, hammer: false, hammerTime: 0, image: images.mario };
    premekong = { x: 50, y: canvas.height - 664, width: 64, height: 64, bounce: 0, throwing: false, image: images.premekong };
    pauline = { x: canvas.width - 82, y: canvas.height - 632, width: 32, height: 32, image: images.pauline };
    hammer = { x: canvas.width / 2, y: canvas.height - 232, width: 32, height: 32, active: true, image: images.hammer };
    barrels = [];
    score = 0;
    preme = 0;
    gameOver = false;
    updateScore();
}

function draw(ctx, canvas) {
    if (!gameActive || gameOver || !ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    const bg = images.backgrounds[(level - 1) % 3];
    if (bg && bg.complete) {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Fallback black background
        console.error('Background image failed to load for level', level, '. Check file path or format.');
    }

    // Draw platforms with slope, using platform image for natural ramp appearance
    platforms.forEach(p => {
        if (p.image && p.image.complete) {
            // Draw sloped platform using the platform image, stretched to fit the slope
            const startX = p.x;
            const endX = p.x + p.width;
            const startY = p.startY;
            const endY = startY + (p.width * p.slope); // 20% slope (rise/run = 0.2)
            ctx.drawImage(p.image, startX, startY, p.width, p.height); // Use the platform image directly, no red lines
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(p.x, p.startY, p.width, p.height);
        }
    });

    // Draw ladders
    ladders.forEach(l => {
        if (l.image && l.image.complete) {
            ctx.drawImage(l.image, l.x, l.y, l.width, l.height);
        } else {
            ctx.fillStyle = 'brown';
            ctx.fillRect(l.x, l.y, l.width, l.height);
        }
    });

    // Draw rivets, Mario, Preme Kong, Pauline, barrels, hammer
    rivets.forEach(r => {
        if (!r.hit) {
            if (r.image && r.image.complete) ctx.drawImage(r.image, r.x, r.y, r.width, r.height);
            else { ctx.fillStyle = 'gray'; ctx.fillRect(r.x, r.y, r.width, r.height); }
        }
    });
    if (mario.image && mario.image.complete) ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
    else { ctx.fillStyle = 'white'; ctx.fillRect(mario.x, mario.y, mario.width, mario.height); }
    if (premekong.image && premekong.image.complete) ctx.drawImage(premekong.image, premekong.x, premekong.y + premekong.bounce, premekong.width, premekong.height);
    else { ctx.fillStyle = 'blue'; ctx.fillRect(premekong.x, premekong.y, premekong.width, premekong.height); }
    if (pauline.image && pauline.image.complete) ctx.drawImage(pauline.image, pauline.x, pauline.y, pauline.width, pauline.height);
    else { ctx.fillStyle = 'pink'; ctx.fillRect(pauline.x, pauline.y, pauline.width, pauline.height); }
    barrels.forEach(b => {
        if (b.image && b.image.complete) ctx.drawImage(b.image, b.x, b.y, 32, 32);
        else { ctx.fillStyle = 'brown'; ctx.fillRect(b.x, b.y, 32, 32); }
    });
    if (hammer.active && hammer.image && hammer.image.complete) ctx.drawImage(hammer.image, hammer.x, hammer.y, hammer.width, hammer.height);
    else if (hammer.active) { ctx.fillStyle = 'yellow'; ctx.fillRect(hammer.x, hammer.y, hammer.width, hammer.height); }
}

function update(canvas) {
    if (!gameActive || gameOver || !canvas) return;

    // Mario movement on sloped platforms
    mario.x += mario.dx * 3;
    if (mario.onLadder) mario.y += mario.dy * 3;
    if (mario.jumping) {
        mario.y += mario.dy;
        mario.dy += 0.3; // Gravity
        if (mario.dy > 0 && mario.y >= mario.groundY) {
            mario.y = mario.groundY;
            mario.jumping = false;
            mario.dy = 0;
        }
    } else if (!mario.onLadder) {
        mario.dy += 0.3; // Gravity
        mario.y += mario.dy;
    }
    mario.x = Math.max(0, Math.min(mario.x, canvas.width - mario.width));
    mario.y = Math.max(0, Math.min(mario.y, canvas.height - mario.height));
    let onPlatform = false;
    let onLadder = ladders.some(l => checkCollision(mario, l));
    let currentPlatform = null;
    platforms.forEach(p => {
        const platformY = getPlatformY(p, mario.x + mario.width / 2);
        if (checkCollision(mario, p) && mario.y + mario.height <= platformY + p.height / 2) {
            mario.y = platformY - mario.height;
            mario.dy = 0; // Reset vertical velocity on platform
            mario.jumping = false;
            mario.groundY = mario.y;
            onPlatform = true;
            currentPlatform = p;
            // Apply slight downward movement on slope when moving right
            if (mario.dx > 0) {
                mario.y += p.slope * mario.dx * 3; // Move down slope based on 20% slope and movement speed
                mario.groundY = mario.y;
            }
        }
    });
    if (!onPlatform && !onLadder && mario.y >= canvas.height - mario.height) {
        mario.y = canvas.height - mario.height;
        mario.dy = 0;
        mario.groundY = mario.y;
    }
    // Allow Mario to stay on ladder and move up/down freely, even on platform
    mario.onLadder = onLadder && (mario.dy !== 0 || (onPlatform && (!currentPlatform || mario.y + mario.height > getPlatformY(currentPlatform, mario.x + mario.width / 2) - 5)));

    // Hammer logic
    if (hammer.active && checkCollision(mario, hammer)) {
        mario.hammer = true;
        mario.hammerTime = 5000;
        hammer.active = false;
    }
    if (mario.hammer) {
        mario.hammerTime -= 16;
        if (mario.hammerTime <= 0) mario.hammer = false;
    }

    // Preme Kong bouncing, throwing, and spawning rolling barrels on conveyor system (classic Donkey Kong style)
    premekong.bounce = Math.sin(Date.now() / 200) * 10; // Bounce effect
    if (Math.random() < 0.02 * level) {
        // Throw barrels (falling from Preme Kong)
        barrels.push({
            x: premekong.x + premekong.width, y: premekong.y, dx: 2, dy: 0, image: images.barrel, type: 'thrown' // Mark as thrown barrel
        });
    }

    // Spawn rolling barrels on the top platform (conveyor system) at regular intervals
    if (Math.random() < 0.01 * level) { // Less frequent than thrown barrels for balance
        const topPlatformY = getPlatformY(platforms[3], premekong.x); // Use sloped y-position for top platform
        barrels.push({
            x: premekong.x, y: topPlatformY, dx: 2, dy: 0, image: images.barrel, type: 'rolling', platformIndex: 3 // Mark as rolling barrel on top platform, starting from Preme Kong's left edge, track starting platform
        });
    }

    // Barrel movement (top-down for thrown, conveyor for rolling, with refined Donkey Kong behavior on sloped platforms)
    barrels.forEach((b, i) => {
        if (b.type === 'thrown') {
            // Thrown barrels fall and move right
            b.x += b.dx;
            b.y += b.dy;
            b.dy += 0.3; // Gravity
        } else if (b.type === 'rolling') {
            // Rolling barrels move right on sloped platforms (conveyor)
            b.x += b.dx;
            // Calculate y position based on slope of the current platform
            let currentPlatform = platforms[b.platformIndex || 0]; // Default to top platform if not set
            if (b.platformIndex !== undefined && b.platformIndex < platforms.length) {
                b.y = getPlatformY(currentPlatform, b.x) - 32; // Adjust y to match sloped platform, offset for barrel height
            }
            b.dx = 2; // Ensure consistent rightward roll
            b.dy = 0; // No vertical movement unless falling

            // Check collision with platforms for rolling or falling
            let onPlatform = false;
            let newPlatformIndex = -1;
            platforms.forEach((p, index) => {
                const platformY = getPlatformY(p, b.x + 16); // Center of barrel for collision
                if (b.x + 32 > p.x && b.x < p.x + p.width && b.y + 32 <= platformY + p.height / 2) {
                    b.y = platformY - 32;
                    b.dy = 0;
                    onPlatform = true;
                    newPlatformIndex = index;
                }
            });

            if (onPlatform) {
                b.platformIndex = newPlatformIndex; // Update to the current platform
            } else {
                // If not on a platform, check for falling (only fall through gaps or down ladders)
                let falling = true;
                for (let p of platforms) {
                    const platformY = getPlatformY(p, b.x + 16);
                    if (b.x + 32 > p.x && b.x < p.x + p.width && b.y + 32 < platformY) {
                        falling = false;
                        break;
                    }
                }
                if (falling) {
                    b.dy += 0.3; // Gravity
                    b.y += b.dy;
                    b.dx = 0; // Stop horizontal movement while falling
                    b.platformIndex = undefined; // Clear platform index while falling
                } else {
                    // If above a platform but not on it, adjust to land on the platform below
                    for (let p of platforms) {
                        const platformY = getPlatformY(p, b.x + 16);
                        if (b.x + 32 > p.x && b.x < p.x + p.width && b.y + 32 < platformY) {
                            b.y = platformY - 32;
                            b.dy = 0;
                            b.dx = 2; // Resume rolling right
                            b.platformIndex = platforms.indexOf(p); // Set to new platform
                            break;
                        }
                    }
                }
            }

            // Check collision with ladders to fall to lower platforms (only if on platform edge near ladder)
            ladders.forEach(l => {
                if (checkCollision(b, l) && b.dy >= 0 && Math.abs(b.x + 16 - l.x - 25) < 20) { // Check if barrel is near ladder center
                    b.dy = 0.5; // Small downward speed to fall down ladder
                    b.y += b.dy;
                    b.dx = 0; // Stop horizontal movement while falling
                    b.platformIndex = undefined; // Clear platform index while falling
                }
            });

            // Resume rolling on next platform after falling
            platforms.forEach((p, index) => {
                const platformY = getPlatformY(p, b.x + 16);
                if (checkCollision(b, p) && b.dy > 0 && b.y + 32 <= platformY + p.height / 2) {
                    b.y = platformY - 32;
                    b.dy = 0;
                    b.dx = 2; // Resume rightward roll on landing
                    b.type = 'rolling';
                    b.platformIndex = index; // Set to new platform
                }
            });
        }

        if (b.x < -32 || b.x > canvas.width || b.y > canvas.height) barrels.splice(i, 1);
        else if (checkCollision(mario, b)) {
            if (mario.hammer) { score += 300; barrels.splice(i, 1); }
            else { gameOver = true; restartGame(); }
        }
        // Only award points for jumping over barrels when Mario is not on a ladder, not jumping, and clearly above the barrel
        if (!mario.onLadder && !mario.jumping && mario.y + mario.height < b.y - 35 && Math.abs(mario.x + mario.width / 2 - b.x - 16) < 16) {
            score += 100;
            barrels.splice(i, 1); // Remove barrel after scoring
        }
    });

    // Ladder, rivet, and win condition
    rivets.forEach(r => {
        if (!r.hit && checkCollision(mario, r)) {
            r.hit = true;
            score += 50; // Only 50 points, no $PREME
            if (rivets.every(r => r.hit)) {
                levelUp();
                if (score >= 400 && perfectRunsToday < 5) {
                    preme += 50;
                    perfectRunsToday++;
                }
            }
        }
    });
    if (checkCollision(mario, pauline)) {
        // Progress to next level with characters reset to starting positions
        levelUp();
        // Reset Mario, Pauline, and Preme Kong to starting positions for Level 2
        mario.x = 50;
        mario.y = getPlatformY(platforms[0], 50) - 52; // Reset to bottom platform, adjusted for slope
        pauline.x = canvas.width - 82;
        pauline.y = getPlatformY(platforms[3], canvas.width - 82) - 32; // Adjust for top platform slope
        premekong.x = 50;
        premekong.y = getPlatformY(platforms[3], 50) - 64; // Adjust for top platform slope
        // Reset rivets for the next level
        rivets.forEach(r => r.hit = false);
        // Clear barrels for new level
        barrels = [];
        // Keep score intact
        updateScore();
    }

    updateScore();
}

// Helper function to calculate y-position on a sloped platform (20% slope)
function getPlatformY(platform, x) {
    const slope = platform.slope || 0; // Default to flat if no slope
    const relativeX = x - platform.x;
    return platform.startY + (relativeX * slope); // y = startY + (x - startX) * slope (20% = 0.2)
}

function checkCollision(obj1, obj2) {
    if (!obj1 || !obj2) return false;
    // Handle sloped platforms for barrels and Mario
    if (obj2.hasOwnProperty('slope')) {
        // For platforms with slope, calculate y at obj1's x position
        const platformY = getPlatformY(obj2, obj1.x + obj1.width / 2);
        return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x &&
               obj1.y < platformY + obj2.height / 2 && obj1.y + obj1.height > platformY - obj2.height / 2;
    }
    // For non-sloped objects (ladders, rivets, etc.)
    return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y;
}

function levelUp() {
    level++;
    // Keep score and other state intact, just update positions and reset rivets
    const { canvas } = initializeGame();
    // Define platforms with a 20% slope
    platforms = [
        { x: 0, startY: canvas.height - 20, width: canvas.width, height: 20, slope: 0.2, image: images.platform }, // Bottom platform, sloped downward to the right
        { x: 0, startY: canvas.height - 200, width: canvas.width, height: 20, slope: 0.2, image: images.platform }, // Second platform, sloped downward to the right
        { x: 0, startY: canvas.height - 400, width: canvas.width, height: 20, slope: 0.2, image: images.platform }, // Third platform, sloped downward to the right
        { x: 0, startY: canvas.height - 600, width: canvas.width, height: 20, slope: 0.2, image: images.platform }  // Top platform, sloped downward to the right
    ];
    ladders = [
        { x: canvas.width / 2 - 25, y: canvas.height - 200, width: 50, height: 180, image: images.ladder },
        { x: canvas.width / 4, y: canvas.height - 400, width: 50, height: 180, image: images.ladder },
        { x: 3 * canvas.width / 4, y: canvas.height - 600, width: 50, height: 180, image: images.ladder }
    ];
    rivets = [];
    for (let i = 0; i < platforms.length; i++) {
        for (let j = 0; j < 5; j++) {
            // Adjust rivet y-position to account for slope (place at the start of each platform for consistency)
            rivets.push({ x: 50 + j * 100, y: platforms[i].startY - 20, width: 20, height: 20, hit: false, image: images.rivet });
        }
    }
    score += 100; // Bonus for level up
    updateScore();
}

function updateScore() {
    document.getElementById('score').innerText = `Score: ${score}  $PREME: ${preme.toFixed(1)}  Jackpot: 0 $PREME  Burn This Month: 0 $PREME`;
}

function setupControls() {
    const btns = { left: '#left', right: '#right', jump: '#jump', up: '#up', down: '#down', restart: '#restart' };
    Object.entries(btns).forEach(([key, id]) => {
        const btn = document.querySelector(id);
        btn.addEventListener('touchstart', (e) => {
            // Prevent default only if cancelable and not scrolling
            if (!e.cancelable || e.defaultPrevented) return;
            e.preventDefault();
            if (key === 'left') mario.dx = -1;
            else if (key === 'right') mario.dx = 1;
            else if (key === 'jump' && !mario.jumping && !mario.onLadder) {
                mario.jumping = true;
                mario.dy = -7; // Adjusted jump height
                mario.groundY = mario.y;
            } else if (key === 'up' && mario.onLadder) mario.dy = -1;
            else if (key === 'down' && mario.onLadder) mario.dy = 1;
            else if (key === 'restart' && gameOver) restartGame();
        });
        btn.addEventListener('touchend', (e) => {
            if (!e.cancelable || e.defaultPrevented) return;
            e.preventDefault();
            if (key === 'left' || key === 'right') mario.dx = 0;
            else if (key === 'up' || key === 'down') mario.dy = 0;
        });
        // Add click handlers for non-touch devices (laptops)
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (key === 'left') mario.dx = -1;
            else if (key === 'right') mario.dx = 1;
            else if (key === 'jump' && !mario.jumping && !mario.onLadder) {
                mario.jumping = true;
                mario.dy = -7;
                mario.groundY = mario.y;
            } else if (key === 'up' && mario.onLadder) mario.dy = -1;
            else if (key === 'down' && mario.onLadder) mario.dy = 1;
            else if (key === 'restart' && gameOver) restartGame();
            setTimeout(() => {
                if (key === 'left' || key === 'right') mario.dx = 0;
                else if (key === 'up' || key === 'down') mario.dy = 0;
            }, 100);
        });
    });
}

function restartGame() {
    gameOver = false;
    initLevel();
}

function gameLoop() {
    const { canvas, ctx } = initializeGame();
    if (!canvas || !ctx || !gameActive || gameOver) return;
    update(canvas);
    draw(ctx, canvas);
    requestAnimationFrame(gameLoop);
}

loadImages().then(loadedImages => {
    images = loadedImages;
    initLevel();
    setupControls();
    gameLoop();
}).catch(error => console.error('Image loading failed:', error));
