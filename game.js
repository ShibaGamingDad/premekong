const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

if (!canvas) {
    console.error('Canvas not found! Check index.html for <canvas id="gameCanvas">');
    return;
} else {
    console.log('Canvas initialized:', canvas.width, 'x', canvas.height);
}

let mario = { x: 50, y: canvas.height - 68, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false, hammer: false, hammerTime: 0 };
let premekong = { x: 50, y: canvas.height - 400 - 64, width: 64, height: 64, dropping: true };
let pauline = { x: 150, y: canvas.height - 400 - 32, width: 32, height: 32, image: null };
let barrels = [];
let hammer = { x: 300, y: canvas.height - 200 - 32, width: 32, height: 32, active: true, image: null };
let score = 0;
let preme = 0; // $PREME currency
let level = 1;
let rivets = [];
let ladders = [];
let platforms = [];
let gameActive = true;
let gameOver = false;

function loadImages() {
    console.log('Loading images...');
    try {
        mario.image = new Image(); mario.image.src = 'mario.png'; mario.image.onerror = () => { console.error('Mario image failed to load'); mario.image = null; };
        premekong.image = new Image(); premekong.image.src = 'premekong.png'; premekong.image.onerror = () => { console.error('Preme Kong image failed to load'); premekong.image = null; };
        pauline.image = new Image(); pauline.image.src = 'pauline.png'; pauline.image.onerror = () => { console.error('Pauline image failed to load'); pauline.image = null; };
        hammer.image = new Image(); hammer.image.src = 'hammer.png'; hammer.image.onerror = () => { console.error('Hammer image failed to load'); hammer.image = null; };
        const barrelImg = new Image(); barrelImg.src = 'barrel.png'; barrelImg.onerror = () => { console.error('Barrel image failed to load'); barrelImg.width = 32; barrelImg.height = 32; };
        const ladderImg = new Image(); ladderImg.src = 'ladder.png'; ladderImg.onerror = () => { console.error('Ladder image failed to load'); ladderImg.width = 50; ladderImg.height = 100; };
        const platformImg = new Image(); platformImg.src = 'platform.png'; platformImg.onerror = () => { console.error('Platform image failed to load'); platformImg.width = canvas.width; platformImg.height = 20; };
        const rivetImg = new Image(); rivetImg.src = 'rivet.png'; rivetImg.onerror = () => { console.error('Rivet image failed to load'); rivetImg.width = 10; rivetImg.height = 10; };
        platforms.forEach(p => p.image = platformImg || { width: canvas.width, height: 20 });
        ladders.forEach(l => l.image = ladderImg || { width: 50, height: 100 });
        rivets.forEach(r => r.image = rivetImg || { width: 10, height: 10 });
        barrels.forEach(b => b.image = barrelImg || { width: 32, height: 32 });
    } catch (error) {
        console.error('Error in loadImages:', error);
    }
}

function initLevel() {
    console.log('Initializing level:', level);
    try {
        platforms = [];
        ladders = [];
        rivets = [];
        const baseY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400]; // Platform y-positions (668, 568, 468, 368)
        for (let i = 0; i < 4; i++) {
            // Level (horizontal) platforms
            platforms.push({ x: 0, y: baseY[i], width: canvas.width, height: 20, image: null });
            for (let j = 0; j < 5; j++) {
                rivets.push({ x: 100 + j * 100, y: baseY[i] - 10, width: 10, height: 10, hit: false, image: null });
            }
        }
        // Ladders positioned to start at the top of each platform and extend downward 100px (like Donkey Kong’s vertical connectivity)
        // First ladder (top of first platform, y: 668, extends down to y: 768)
        ladders.push({ x: 506, y: baseY[0] - 100, width: 50, height: 100, image: null }); // y: 568 (extends from 668 to 768)
        // Second ladder (top of second platform, y: 568, extends down to y: 668)
        ladders.push({ x: 94, y: baseY[1] - 100, width: 50, height: 100, image: null }); // y: 468 (extends from 568 to 668)
        // Third ladder (top of third platform, y: 468, extends down to y: 568)
        ladders.push({ x: 506, y: baseY[2] - 100, width: 50, height: 100, image: null }); // y: 368 (extends from 468 to 568)

        mario = { x: 50, y: canvas.height - 68, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false, hammer: false, hammerTime: 0, image: mario.image || null };
        premekong.y = Math.max(0, Math.min(canvas.height - 400 - premekong.height, canvas.height - premekong.height));
        premekong.x = 50;
        pauline.y = Math.max(0, Math.min(canvas.height - 400 - pauline.height, canvas.height - pauline.height));
        pauline.x = 150;
        hammer = { x: 300, y: canvas.height - 200 - 32, width: 32, height: 32, active: true, image: hammer.image || null };
        barrels = [];
        score = 0;
        preme = 0;
        gameOver = false;
        updateScore();
        console.log('Platforms initialized:', platforms.map(p => `x: ${p.x}, y: ${p.y}`));
        console.log('Ladders initialized:', ladders.map(l => `x: ${l.x}, y: ${l.y}`));
    } catch (error) {
        console.error('Error in initLevel:', error);
    }
}

function draw() {
    if (!gameActive || gameOver) return;
    try {
        console.log('Drawing frame...');
        if (!ctx) {
            console.error('Canvas context not available!');
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw level (horizontal) platforms
        ctx.fillStyle = 'red';
        platforms.forEach(p => {
            if (!p || isNaN(p.y) || p.y < 0 || p.y > canvas.height || p.y + p.height < 0) {
                console.warn('Invalid platform position:', p);
                return;
            }
            if (p.image && p.image.complete) {
                ctx.drawImage(p.image, p.x, p.y, p.width, p.height);
            } else {
                ctx.fillRect(p.x, p.y, p.width, p.height);
            }
        });

        // Draw ladders
        console.log('Drawing ladders, count:', ladders.length);
        ctx.fillStyle = 'brown';
        ladders.forEach(l => {
            if (!l || isNaN(l.y) || l.y < 0 || l.y + l.height > canvas.height || l.y + l.height < 0) {
                console.warn('Invalid ladder position:', l);
                return;
            }
            if (l.image && l.image.complete) {
                console.log('Drawing ladder at:', l.x, l.y, 'Dimensions:', l.image.width, 'x', l.image.height);
                ctx.drawImage(l.image, l.x, l.y, l.width, l.height);
            } else {
                console.log('Drawing ladder fallback at:', l.x, l.y);
                ctx.fillRect(l.x, l.y, l.width, l.height);
            }
        });

        // Draw rivets, Mario, Preme Kong, Pauline, barrels, hammer
        ctx.fillStyle = 'gray';
        rivets.forEach(r => {
            if (!r.hit && r && r.x >= 0 && r.x <= canvas.width && r.y >= 0 && r.y <= canvas.height) {
                if (r.image && r.image.complete) ctx.drawImage(r.image, r.x, r.y, r.width, r.height);
                else ctx.fillRect(r.x, r.y, r.width, r.height);
            }
        });
        if (mario && mario.x >= 0 && mario.x <= canvas.width && mario.y >= 0 && mario.y <= canvas.height) {
            if (mario.image && mario.image.complete) ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
            else { ctx.fillStyle = 'white'; ctx.fillRect(mario.x, mario.y, mario.width, mario.height); }
        }
        if (premekong && premekong.x >= 0 && premekong.x <= canvas.width && premekong.y >= 0 && premekong.y <= canvas.height) {
            if (premekong.image && premekong.image.complete) ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);
            else { ctx.fillStyle = 'blue'; ctx.fillRect(premekong.x, premekong.y, premekong.width, premekong.height); }
        }
        if (pauline && pauline.x >= 0 && pauline.x <= canvas.width && pauline.y >= 0 && pauline.y <= canvas.height) {
            if (pauline.image && pauline.image.complete) ctx.drawImage(pauline.image, pauline.x, pauline.y, pauline.width, pauline.height);
            else { ctx.fillStyle = 'pink'; ctx.fillRect(pauline.x, pauline.y, pauline.width, pauline.height); }
        }
        ctx.fillStyle = 'brown';
        barrels.forEach(b => {
            if (b && b.x >= -32 && b.x <= canvas.width + 32 && b.y >= -32 && b.y <= canvas.height + 32) {
                if (b.image && b.image.complete) ctx.drawImage(b.image, b.x, b.y, 32, 32);
                else ctx.fillRect(b.x, b.y, 32, 32);
            }
        });

        // Draw hammer
        if (hammer.active && hammer.x >= 0 && hammer.x <= canvas.width && hammer.y >= 0 && hammer.y <= canvas.height) {
            if (hammer.image && hammer.image.complete) ctx.drawImage(hammer.image, hammer.x, hammer.y, hammer.width, hammer.height);
            else { ctx.fillStyle = 'yellow'; ctx.fillRect(hammer.x, hammer.y, hammer.width, hammer.height); }
        }
    } catch (error) {
        console.error('Error in draw function:', error);
    }
}

function update() {
    if (!gameActive || gameOver) return;
    try {
        console.log('Updating frame...');

        // Mario movement
        if (mario.dx) mario.x += mario.dx * 5;
        if (mario.dy && mario.onLadder) mario.y += mario.dy * 5;
        if (mario.jumping) {
            mario.dy -= 1; // Initial upward boost
            mario.y += mario.dy; // Apply velocity
            if (mario.dy > 0) mario.jumping = false; // End jump when falling
            if (mario.y <= 0) { mario.y = 0; mario.jumping = false; mario.dy = 0; }
        }

        // Gravity and platform collision
        if (!mario.onLadder && !mario.jumping) mario.dy += 0.5; // Gravity
        mario.y += mario.dy;
        mario.x = Math.max(0, Math.min(mario.x, canvas.width - mario.width));
        mario.y = Math.max(0, Math.min(mario.y, canvas.height - mario.height));
        let onPlatform = false;
        platforms.forEach(p => {
            if (checkCollision(mario, p) && mario.y + mario.height <= p.y + 5) {
                mario.y = p.y - mario.height;
                mario.dy = 0;
                mario.jumping = false;
                onPlatform = true;
            }
        });
        if (!onPlatform && mario.y > canvas.height - mario.height) {
            mario.y = canvas.height - mario.height;
            mario.dy = 0;
        }

        // Hammer logic
        if (hammer.active && checkCollision(mario, hammer)) {
            mario.hammer = true;
            mario.hammerTime = 5000; // 5 seconds
            hammer.active = false;
        }
        if (mario.hammer) {
            mario.hammerTime -= 16; // ~60fps
            if (mario.hammerTime <= 0) mario.hammer = false;
        }

        // Barrel throwing
        if (premekong.dropping && Math.random() < 0.025 * level) { // Scales with level
            const offset = Math.random() * 100 - 50;
            const startX = Math.max(0, Math.min(premekong.x + offset, canvas.width - 32));
            barrels.push({
                x: startX,
                y: Math.max(0, Math.min(canvas.height - 400 - 32, canvas.height - 32)),
                dx: (Math.random() - 0.5) * 0.4, // ±0.2
                dy: Math.random() * 0.3 + 0.2, // 0.2–0.5
                type: 'thrown',
                image: new Image()
            });
            barrels[barrels.length - 1].image.src = 'barrel.png';

            // Rolling barrel
            barrels.push({
                x: Math.max(0, Math.min(pauline.x + pauline.width + 32, canvas.width - 32)),
                y: Math.max(0, Math.min(canvas.height - 400, canvas.height - 64)),
                dx: 0.2 * level, // Scales with level
                dy: 0,
                type: 'rolling',
                stage: 1,
                image: new Image()
            });
            barrels[barrels.length - 1].image.src = 'barrel.png';
        }

        // Barrel movement
        barrels.forEach((b, i) => {
            if (b.type === 'thrown') {
                b.x = Math.max(-32, Math.min(b.x + b.dx, canvas.width + 32));
                b.y = Math.max(-32, Math.min(b.y + b.dy, canvas.height + 32));
            } else if (b.type === 'rolling') {
                b.x = Math.max(0, Math.min(b.x + b.dx, canvas.width - 32));
                if (b.stage === 1 && b.x >= 506) { b.y = canvas.height - 300; b.dx = -0.2 * level; b.stage = 2; }
                else if (b.stage === 2 && b.x <= 94) { b.y = canvas.height - 200; b.dx = 0.2 * level; b.stage = 3; }
                else if (b.stage === 3 && b.x >= 506) { b.y = canvas.height - 100; b.dx = -0.2 * level; b.stage = 4; }
            }
            if (b.x < -32 || b.x > canvas.width + 32 || b.y > canvas.height + 32) barrels.splice(i, 1);
            else if (checkCollision(mario, b)) {
                if (mario.hammer) { score += 300; barrels.splice(i, 1); }
                else { gameOver = true; mario.x = 50; mario.y = canvas.height - 68; score = 0; preme = 0; }
            }
            // Score for jumping barrels
            if (!mario.onLadder && Math.abs(mario.y + mario.height - b.y) < 5 && Math.abs(mario.x - b.x) < 32) score += 100;
        });

        // Ladder, rivet, and win condition
        mario.onLadder = ladders.some(l => checkCollision(mario, l));
        rivets.forEach(r => {
            if (!r.hit && checkCollision(mario, r)) {
                r.hit = true;
                score += 50;
                preme += 0.1;
                if (rivets.every(r => r.hit)) levelUp();
            }
        });
        if (checkCollision(mario, pauline)) {
            gameOver = true; // Temporary win state
            premekong.y += 100; // Basic "cutscene": Preme Kong falls
            setTimeout(restartGame, 1000); // Restart after 1s
        }
    } catch (error) {
        console.error('Error in update function:', error);
    }
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

function setupTouchControls() {
    const btns = { left: '#left', right: '#right', jump: '#jump', up: '#up', down: '#down', restart: '#restart' };
    Object.entries(btns).forEach(([key, id]) => {
        const btn = document.querySelector(id);
        btn.addEventListener('touchstart', () => {
            if (key === 'left') mario.dx = -1;
            else if (key === 'right') mario.dx = 1;
            else if (key === 'jump' && !mario.jumping && !mario.onLadder) { mario.jumping = true; mario.dy = -8; } // 32px jump
            else if (key === 'up' && mario.onLadder) mario.dy = -1;
            else if (key === 'down' && mario.onLadder) mario.dy = 1;
            else if (key === 'restart' && gameOver) restartGame();
        });
        btn.addEventListener('touchend', () => {
            if (key === 'left' || key === 'right') mario.dx = 0;
            else if (key === 'up' || key === 'down') mario.dy = 0;
        });
    });
}

function restartGame() {
    gameOver = false;
    initLevel();
    gameLoop();
}

function handleTelegramData() {
    const Telegram = window.Telegram;
    if (Telegram && Telegram.WebApp) {
        try {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            console.log('Telegram WebApp initialized and ready');
            Telegram.WebApp.onEvent('web_app_data', (event) => {
                console.log('Telegram WebApp event received:', JSON.stringify(event));
                if (event && typeof event.data === 'string' && event.data.trim() !== '') {
                    try {
                        const gameData = JSON.parse(event.data);
                        console.log('Parsed Telegram data:', gameData);
                        if (gameData && typeof gameData.restart === 'boolean' && gameData.restart) {
                            restartGame();
                            console.log('Game restarted via Telegram');
                        } else {
                            score = (gameData && typeof gameData.score === 'number') ? gameData.score : score;
                            preme = (gameData && typeof gameData.preme === 'number') ? gameData.preme : preme;
                            updateScore();
                            Telegram.WebApp.sendData(JSON.stringify({ 
                                score, 
                                preme, 
                                perfectRun: score >= 400, 
                                gameOver 
                            }));
                            console.log('Sent Telegram data:', { score, preme, perfectRun: score >= 400, gameOver });
                        }
                    } catch (parseError) {
                        console.error('Error parsing Telegram event data:', parseError, 'Raw data:', event.data);
                    }
                } else {
                    console.warn('Invalid or empty Telegram event data:', event);
                }
            });
        } catch (initError) {
            console.error('Error initializing Telegram WebApp:', initError);
        }
    } else {
        console.warn('Telegram WebApp not available');
    }
}

function gameLoop() {
    if (!gameActive || gameOver) return;
    try {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Error in gameLoop:', error);
    }
}

loadImages();
initLevel();
setupTouchControls();
handleTelegramData();
gameLoop();
