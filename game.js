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

    // Adjust canvas for mobile and laptop screens, prioritizing tighter fit and Telegram compatibility
    const maxWidth = 672;
    const maxHeight = 768;
    const aspectRatio = maxWidth / maxHeight;
    let newWidth, newHeight;

    // Check if running in Telegram or mobile browser
    const isTelegram = window.Telegram?.WebApp;
    if (isTelegram) {
        Telegram.WebApp.expand();
        newWidth = Math.min(window.innerWidth, maxWidth);
        newHeight = Math.min(window.innerHeight * 0.6, maxHeight); // Use 60% of Telegram height
    } else {
        newWidth = Math.min(window.innerWidth * 0.45, maxWidth); // Reduced to 45% of screen width for general use
        newHeight = newWidth / aspectRatio;
        if (newHeight > window.innerHeight * 0.4) { // Reduced to 40% of screen height
            newHeight = window.innerHeight * 0.4;
            newWidth = newHeight * aspectRatio;
        }
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
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
    images.premekong.src = 'premekong.png';
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
                    console.error(`${key} failed to load`);
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
    platforms = [
        { x: 0, y: canvas.height - 20, width: canvas.width, height: 20, image: images.platform },
        { x: 0, y: canvas.height - 200, width: canvas.width, height: 20, image: images.platform },
        { x: 0, y: canvas.height - 400, width: canvas.width, height: 20, image: images.platform },
        { x: 0, y: canvas.height - 600, width: canvas.width, height: 20, image: images.platform }
    ];
    ladders = [
        { x: canvas.width / 2 - 25, y: canvas.height - 200, width: 50, height: 180, image: images.ladder },
        { x: canvas.width / 4, y: canvas.height - 400, width: 50, height: 180, image: images.ladder },
        { x: 3 * canvas.width / 4, y: canvas.height - 600, width: 50, height: 180, image: images.ladder }
    ];
    rivets = [];
    for (let i = 0; i < platforms.length; i++) {
        for (let j = 0; j < 5; j++) {
            rivets.push({ x: 50 + j * 100, y: platforms[i].y - 20, width: 20, height: 20, hit: false, image: images.rivet });
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
    if (bg && bg.complete) ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    else ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); // Fallback black background

    // Draw platforms
    platforms.forEach(p => {
        if (p.image && p.image.complete) {
            ctx.drawImage(p.image, p.x, p.y, p.width, p.height);
        } else {
            ctx.fillStyle = 'red';
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

    // Mario movement
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
    platforms.forEach(p => {
        if (checkCollision(mario, p) && mario.y + mario.height <= p.y + p.height / 2) {
            mario.y = p.y - mario.height;
            mario.dy = 0;
            mario.jumping = false;
            mario.groundY = mario.y;
            onPlatform = true;
        }
    });
    if (!onPlatform && !onLadder && mario.y >= canvas.height - mario.height) {
        mario.y = canvas.height - mario.height;
        mario.dy = 0;
        mario.groundY = mario.y;
    }
    // Allow Mario to stay on ladder and move up/down freely, even on platform
    mario.onLadder = onLadder && (mario.dy !== 0 || (onPlatform && mario.y + mario.height > p.y - 5)); // Allow going down if near ladder top

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

    // Preme Kong bouncing and throwing
    premekong.bounce = Math.sin(Date.now() / 200) * 10; // Bounce effect
    if (Math.random() < 0.02 * level) {
        barrels.push({
            x: premekong.x + premekong.width, y: premekong.y, dx: 2, dy: 0, image: images.barrel
        });
    }

    // Barrel movement (top-down)
    barrels.forEach((b, i) => {
        b.x += b.dx;
        b.y += b.dy;
        b.dy += 0.3; // Gravity
        platforms.forEach(p => {
            if (checkCollision(b, p) && b.y + 32 <= p.y + p.height / 2) {
                b.y = p.y - 32;
                b.dy = 0;
                b.dx = Math.random() < 0.5 ? 2 : -2;
            }
        });
        if (b.x < -32 || b.x > canvas.width || b.y > canvas.height) barrels.splice(i, 1);
        else if (checkCollision(mario, b)) {
            if (mario.hammer) { score += 300; barrels.splice(i, 1); }
            else { gameOver = true; restartGame(); }
        }
        // Only award points for jumping over barrels when Mario is not on a ladder, not jumping, and above the barrel
        if (!mario.onLadder && !mario.jumping && mario.y + mario.height < b.y - 5 && Math.abs(mario.x + mario.width / 2 - b.x - 16) < 16) {
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
        gameOver = true;
        premekong.y += 100;
        setTimeout(restartGame, 1000);
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
    score += 100;
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
