// Preme Kong Game - Donkey Kong-Inspired Overhaul, March 01, 2025

let gameActive = true;
let gameOver = false;
let level = 1;
let score = 0;
let preme = 0.0;
let jackpot = 0;
let burnThisMonth = 0;

// Initialize game canvas and context
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

    // Adjust canvas for mobile, desktop, and Telegram, prioritizing full visibility
    const maxWidth = 672;
    const maxHeight = 768; // Using classic Donkey Kong-like aspect ratio for better fit
    const aspectRatio = maxWidth / maxHeight;
    let newWidth, newHeight;

    const isTelegram = window.Telegram?.WebApp;
    if (isTelegram) {
        Telegram.WebApp.expand();
        // Use 90% of viewport for Telegram, cap at max size, maintain aspect ratio
        newWidth = Math.min(window.innerWidth * 0.9, maxWidth);
        newHeight = Math.min(window.innerHeight * 0.9, maxHeight);
        if (newHeight / aspectRatio > newWidth) {
            newHeight = newWidth * aspectRatio;
        } else if (newWidth / aspectRatio > newHeight) {
            newWidth = newHeight / aspectRatio;
        }
        // Minimum size for readability on small screens
        if (newWidth < 300) {
            newWidth = 300;
            newHeight = newWidth * aspectRatio;
        }
        if (newHeight < 344) { // Adjusted for 672x768 aspect ratio
            newHeight = 344;
            newWidth = newHeight / aspectRatio;
        }
    } else {
        // For non-Telegram (mobile or desktop), use 80% of viewport, cap at max size
        newWidth = Math.min(window.innerWidth * 0.8, maxWidth);
        newHeight = Math.min(window.innerHeight * 0.8, maxHeight);
        if (newHeight / aspectRatio > newWidth) {
            newHeight = newWidth * aspectRatio;
        } else if (newWidth / aspectRatio > newHeight) {
            newWidth = newHeight / aspectRatio;
        }
        // Minimum size for readability
        if (newWidth < 300) {
            newWidth = 300;
            newHeight = newWidth * aspectRatio;
        }
        if (newHeight < 344) {
            newHeight = 344;
            newWidth = newHeight / aspectRatio;
        }
    }

    canvas.width = Math.floor(newWidth);
    canvas.height = Math.floor(newHeight);
    console.log('Canvas size:', canvas.width, 'x', canvas.height);

    // Center and scale canvas to fit viewport
    canvas.style.position = 'relative';
    canvas.style.left = '50%';
    canvas.style.transform = 'translateX(-50%)';
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.objectFit = 'contain';

    return { canvas, ctx };
}

// Load images
function loadImages() {
    const images = {
        mario: new Image(), premekong: new Image(), pauline: new Image(), barrel: new Image(),
        ladder: new Image(), platform: new Image(), rivet: new Image(), hammer: new Image(),
        bg1: new Image(), bg2: new Image(), bg3: new Image(), bg4: new Image()
    };
    images.mario.src = 'mario.png';
    images.premekong.src = 'premekong.png';
    images.pauline.src = 'pauline.png';
    images.barrel.src = 'barrel.png';
    images.ladder.src = 'ladder.png';
    images.platform.src = 'platform.png';
    images.rivet.src = 'rivet.png';
    images.hammer.src = 'hammer.png';
    images.bg1.src = 'background1.png';
    images.bg2.src = 'background2.png';
    images.bg3.src = 'background3.png';
    images.bg4.src = 'background4.png';

    return Promise.all(
        Object.entries(images).map(([key, img]) =>
            new Promise((resolve) => {
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.error(`${key} failed to load. Check file path or format.`);
                    resolve({ width: key === 'mario' ? 32 : key === 'premekong' ? 64 : key === 'pauline' ? 32 : key === 'barrel' ? 32 : key === 'ladder' ? 50 : key === 'platform' ? 672 : key === 'rivet' ? 20 : key === 'hammer' ? 32 : 672, height: key === 'mario' ? 32 : key === 'premekong' ? 64 : key === 'pauline' ? 32 : key === 'barrel' ? 32 : key === 'ladder' ? 180 : key === 'platform' ? 20 : key === 'rivet' ? 20 : key === 'hammer' ? 32 : 768 }); // Fallback for 672x768
                };
            })
        )
    ).then(loaded => ({
        mario: loaded[0], premekong: loaded[1], pauline: loaded[2], barrel: loaded[3],
        ladder: loaded[4], platform: loaded[5], rivet: loaded[6], hammer: loaded[7],
        backgrounds: [loaded[8], loaded[9], loaded[10], loaded[11]]
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

    // Define level-specific layouts for 4 Donkey Kong-like levels
    switch (level) {
        case 1:
            platforms = [
                { x: 0, y: canvas.height - 20, width: canvas.width, height: 20, image: images.platform },
                { x: 0, y: canvas.height - 200, width: canvas.width, height: 20, image: images.platform }
            ];
            ladders = [
                { x: canvas.width / 2 - 25, y: canvas.height - 220, width: 50, height: 180, image: images.ladder }
            ];
            rivets = [
                { x: canvas.width / 2 - 10, y: canvas.height - 40, width: 20, height: 20, hit: false, image: images.rivet }
            ];
            mario = { x: 50, y: canvas.height - 52, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false, image: images.mario };
            premekong = { x: canvas.width - 114, y: canvas.height - 220, width: 64, height: 64, bounce: 0, image: images.premekong };
            pauline = { x: canvas.width - 82, y: canvas.height - 232, width: 32, height: 32, image: images.pauline };
            hammer = { x: canvas.width / 2, y: canvas.height - 232, width: 32, height: 32, active: true, image: images.hammer };
            break;
        case 2:
            platforms = [
                { x: 0, y: canvas.height - 20, width: canvas.width, height: 20, image: images.platform },
                { x: 0, y: canvas.height - 200, width: canvas.width, height: 20, image: images.platform },
                { x: 0, y: canvas.height - 400, width: canvas.width, height: 20, image: images.platform }
            ];
            ladders = [
                { x: canvas.width / 2 - 25, y: canvas.height - 220, width: 50, height: 180, image: images.ladder },
                { x: canvas.width / 4, y: canvas.height - 420, width: 50, height: 180, image: images.ladder }
            ];
            rivets = [
                { x: canvas.width / 2 - 10, y: canvas.height - 40, width: 20, height: 20, hit: false, image: images.rivet },
                { x: canvas.width / 4 + 10, y: canvas.height - 220, width: 20, height: 20, hit: false, image: images.rivet }
            ];
            mario = { x: 50, y: canvas.height - 52, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false, image: images.mario };
            premekong = { x: canvas.width - 114, y: canvas.height - 220, width: 64, height: 64, bounce: 0, image: images.premekong };
            pauline = { x: canvas.width - 82, y: canvas.height - 420, width: 32, height: 32, image: images.pauline };
            hammer = { x: canvas.width / 2, y: canvas.height - 420, width: 32, height: 32, active: true, image: images.hammer };
            break;
        case 3:
            platforms = [
                { x: 0, y: canvas.height - 20, width: canvas.width, height: 20, image: images.platform },
                { x: 0, y: canvas.height - 200, width: canvas.width, height: 20, image: images.platform },
                { x: 0, y: canvas.height - 400, width: canvas.width, height: 20, image: images.platform },
                { x: 0, y: canvas.height - 600, width: canvas.width, height: 20, image: images.platform }
            ];
            ladders = [
                { x: canvas.width / 2 - 25, y: canvas.height - 220, width: 50, height: 180, image: images.ladder },
                { x: canvas.width / 4, y: canvas.height - 420, width: 50, height: 180, image: images.ladder },
                { x: 3 * canvas.width / 4, y: canvas.height - 620, width: 50, height: 180, image: images.ladder }
            ];
            rivets = [
                { x: canvas.width / 2 - 10, y: canvas.height - 40, width: 20, height: 20, hit: false, image: images.rivet },
                { x: canvas.width / 4 + 10, y: canvas.height - 220, width: 20, height: 20, hit: false, image: images.rivet },
                { x: 3 * canvas.width / 4 - 10, y: canvas.height - 420, width: 20, height: 20, hit: false, image: images.rivet }
            ];
            mario = { x: 50, y: canvas.height - 52, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false, image: images.mario };
            premekong = { x: canvas.width - 114, y: canvas.height - 220, width: 64, height: 64, bounce: 0, image: images.premekong };
            pauline = { x: canvas.width - 82, y: canvas.height - 620, width: 32, height: 32, image: images.pauline };
            hammer = { x: canvas.width / 2, y: canvas.height - 620, width: 32, height: 32, active: true, image: images.hammer };
            break;
        case 4:
            platforms = [
                { x: 0, y: canvas.height - 20, width: canvas.width, height: 20, image: images.platform },
                { x: 0, y: canvas.height - 200, width: canvas.width, height: 20, image: images.platform },
                { x: 0, y: canvas.height - 400, width: canvas.width, height: 20, image: images.platform },
                { x: 0, y: canvas.height - 600, width: canvas.width, height: 20, image: images.platform }
            ];
            ladders = [
                { x: canvas.width / 2 - 25, y: canvas.height - 220, width: 50, height: 180, image: images.ladder },
                { x: canvas.width / 4, y: canvas.height - 420, width: 50, height: 180, image: images.ladder },
                { x: 3 * canvas.width / 4, y: canvas.height - 620, width: 50, height: 180, image: images.ladder }
            ];
            rivets = [
                { x: canvas.width / 2 - 10, y: canvas.height - 40, width: 20, height: 20, hit: false, image: images.rivet },
                { x: canvas.width / 4 + 10, y: canvas.height - 220, width: 20, height: 20, hit: false, image: images.rivet },
                { x: 3 * canvas.width / 4 - 10, y: canvas.height - 420, width: 20, height: 20, hit: false, image: images.rivet },
                { x: canvas.width / 2 + 10, y: canvas.height - 620, width: 20, height: 20, hit: false, image: images.rivet }
            ];
            mario = { x: 50, y: canvas.height - 52, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false, image: images.mario };
            premekong = { x: canvas.width - 114, y: canvas.height - 220, width: 64, height: 64, bounce: 0, image: images.premekong };
            pauline = { x: canvas.width - 82, y: canvas.height - 632, width: 32, height: 32, image: images.pauline }; // Top platform for final rescue
            hammer = { x: canvas.width / 2, y: canvas.height - 632, width: 32, height: 32, active: true, image: images.hammer };
            break;
    }

    barrels = [];
    score = level === 1 ? 0 : score; // Reset score only on Level 1
    preme = level === 1 ? 0.0 : preme; // Reset $PREME only on Level 1
    jackpot = 0;
    burnThisMonth = 0;
    gameOver = false;
    updateScore();
}

function draw(ctx, canvas) {
    if (!gameActive || gameOver || !ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background for the current level
    const bg = images.backgrounds[(level - 1) % 4];
    if (bg && bg.complete) {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Fallback black background
        console.error('Background image failed to load for level', level, '. Check file path or format.');
    }

    // Draw platforms
    platforms.forEach(p => {
        if (p.image && p.image.complete) {
            ctx.drawImage(p.image, p.x, p.y, p.width, p.height);
        } else {
            ctx.fillStyle = 'gray';
            ctx.fillRect(p.x, p.y, p.width, p.height);
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
    else { ctx.fillStyle = 'red'; ctx.fillRect(mario.x, mario.y, mario.width, mario.height); }
    if (premekong.image && premekong.image.complete) ctx.drawImage(premekong.image, premekong.x, premekong.y + premekong.bounce, premekong.width, premekong.height);
    else { ctx.fillStyle = 'blue'; ctx.fillRect(premekong.x, premekong.y, premekong.width, premekong.height); }
    if (pauline.image && pauline.image.complete) ctx.drawImage(pauline.image, pauline.x, pauline.y, pauline.width, pauline.height);
    else { ctx.fillStyle = 'pink'; ctx.fillRect(pauline.x, pauline.y, pauline.width, pauline.height); }
    barrels.forEach(b => {
        if (b.image && b.image.complete) ctx.drawImage(b.image, b.x, b.y, b.width, b.height);
        else { ctx.fillStyle = 'brown'; ctx.fillRect(b.x, b.y, b.width, b.height); }
    });
    if (hammer.active && hammer.image && hammer.image.complete) ctx.drawImage(hammer.image, hammer.x, hammer.y, hammer.width, hammer.height);
    else if (hammer.active) { ctx.fillStyle = 'yellow'; ctx.fillRect(hammer.x, hammer.y, hammer.width, hammer.height); }
}

function update(canvas) {
    if (!gameActive || gameOver || !canvas) return;

    // Mario movement (Donkey Kong-style physics: gravity, jumping, ladder climbing)
    mario.x += mario.dx * 3;
    if (mario.onLadder) mario.y += mario.dy * 3;
    if (mario.jumping) {
        mario.y += mario.dy;
        mario.dy += 0.5; // Stronger gravity for classic feel
        if (mario.y >= mario.groundY) {
            mario.y = mario.groundY;
            mario.jumping = false;
            mario.dy = 0;
        }
    } else if (!mario.onLadder) {
        mario.dy += 0.5; // Gravity
        mario.y += mario.dy;
    }
    mario.x = Math.max(0, Math.min(mario.x, canvas.width - mario.width));
    mario.y = Math.max(0, Math.min(mario.y, canvas.height - mario.height));

    // Check collisions with platforms and ladders (Donkey Kong-style)
    let onPlatform = false;
    let onLadder = false;
    platforms.forEach(p => {
        if (checkCollision(mario, p) && mario.y + mario.height <= p.y + p.height / 2) {
            mario.y = p.y - mario.height;
            mario.dy = 0;
            mario.jumping = false;
            mario.groundY = mario.y;
            onPlatform = true;
        }
    });
    ladders.forEach(l => {
        if (checkCollision(mario, l)) {
            mario.onLadder = true;
            onLadder = true;
            // Allow jumping off ladder
            if (mario.jumping) mario.onLadder = false;
        }
    });
    if (!onPlatform && !onLadder && mario.y >= canvas.height - mario.height) {
        mario.y = canvas.height - mario.height;
        mario.dy = 0;
        mario.groundY = mario.y;
    }
    mario.onLadder = onLadder && (mario.dy !== 0 || onPlatform);

    // Hammer logic (Donkey Kong-style: temporary invincibility against barrels)
    if (hammer.active && checkCollision(mario, hammer)) {
        hammer.active = false;
        mario.hasHammer = true;
        setTimeout(() => mario.hasHammer = false, 5000); // 5 seconds of hammer power
        score += 200; // Bonus for grabbing hammer
    }

    // Preme Kong (Donkey Kong) bouncing and throwing barrels
    premekong.bounce = Math.sin(Date.now() / 200) * 10;
    if (Math.random() < 0.03 * level) { // Increased frequency for challenge
        barrels.push({ x: premekong.x + premekong.width / 2, y: premekong.y, dx: 2, dy: 0, width: 32, height: 32, image: images.barrel });
    }

    // Barrel movement (Donkey Kong-style: fall, roll on platforms, fall down ladders)
    barrels.forEach((b, i) => {
        b.x += b.dx;
        b.y += b.dy;
        b.dy += 0.5; // Stronger gravity for classic feel

        // Check collision with platforms
        let onPlatform = false;
        platforms.forEach(p => {
            if (checkCollision(b, p) && b.y + b.height <= p.y + p.height / 2) {
                b.y = p.y - b.height;
                b.dy = 0;
                b.dx = 2; // Roll right on platform
                onPlatform = true;
            }
        });

        // Fall down ladders or gaps
        if (!onPlatform) {
            ladders.forEach(l => {
                if (checkCollision(b, l) && b.dy >= 0) {
                    b.dy = 1; // Faster fall down ladder
                    b.dx = 0; // Stop horizontal movement
                }
            });
        }

        if (b.x < -b.width || b.x > canvas.width || b.y > canvas.height) barrels.splice(i, 1);
        else if (checkCollision(mario, b)) {
            if (mario.hasHammer) {
                score += 300; // Bonus for smashing barrel with hammer
                barrels.splice(i, 1);
            } else {
                gameOver = true;
                restartGame();
            }
        }
    });

    // Rivet and win condition (rescue Pauline, Donkey Kong-style)
    rivets.forEach(r => {
        if (!r.hit && checkCollision(mario, r)) {
            r.hit = true;
            score += 100; // More points for rivets, Donkey Kong-style
            if (rivets.every(r => r.hit)) {
                if (level < 4) {
                    levelUp();
                    score += 500; // Level completion bonus
                } else {
                    score += 2000; // Big bonus for rescuing Pauline in Level 4
                    preme += 200; // Large $PREME reward for completing all levels
                    gameOver = true;
                    alert('Congratulations! You rescued Pauline and beat Preme Kong!');
                    restartGame();
                }
            }
        }
    });

    // Check for rescuing Pauline (win condition for each level)
    if (checkCollision(mario, pauline) && rivets.every(r => r.hit)) {
        if (level < 4) {
            levelUp();
            score += 500; // Bonus for rescuing Pauline
        } else {
            score += 2000;
            preme += 200;
            gameOver = true;
            alert('Congratulations! You rescued Pauline and beat Preme Kong!');
            restartGame();
        }
    }

    updateScore();
}

function checkCollision(obj1, obj2) {
    if (!obj1 || !obj2) return false;
    return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y;
}

function levelUp() {
    level++;
    initLevel();
}

function updateScore() {
    document.getElementById('score').innerText = `Score: ${score}  $PREME: ${preme.toFixed(1)}  Jackpot: ${jackpot} $PREME  Burn This Month: ${burnThisMonth} $PREME`;
}

function setupControls() {
    const btns = { left: '#left', right: '#right', jump: '#jump', up: '#up', down: '#down', restart: '#restart' };
    Object.entries(btns).forEach(([key, id]) => {
        const btn = document.querySelector(id);
        btn.addEventListener('touchstart', (e) => {
            if (!e.cancelable || e.defaultPrevented) return;
            e.preventDefault();
            if (key === 'left') mario.dx = -1;
            else if (key === 'right') mario.dx = 1;
            else if (key === 'jump' && !mario.jumping && !mario.onLadder) {
                mario.jumping = true;
                mario.dy = -10; // Higher jump for Donkey Kong feel
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
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (key === 'left') mario.dx = -1;
            else if (key === 'right') mario.dx = 1;
            else if (key === 'jump' && !mario.jumping && !mario.onLadder) {
                mario.jumping = true;
                mario.dy = -10;
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
    level = 1;
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

// Telegram integration
const Telegram = window.Telegram;
if (Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
                 }
