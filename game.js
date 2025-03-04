// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Adjust canvas for mobile and Telegram Web App (landscape setup, 672x500)
canvas.width = 672;
canvas.height = 500;
ctx.scale(1, 1);

// Persistent P2E state (moved outside reset scope per Issue #5)
let perfectRunsToday = 0; // Resets daily, max 5
let lastPerfectRunTime = 0; // Track daily reset
let premeEarned = 0; // Persistent across sessions
let premeBurn = 0; // Persistent until monthly reset by Replit
let jackpot = 0; // Placeholder for shop/ticket system (Issue #6)

// Game state (original with lives and timer added)
let mario = {
    x: 50,
    y: 318,
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
};
let premekong = {
    x: 50,
    y: 36,
    width: 64,
    height: 64,
    bounceDir: 1,
    bounceRange: 20
};
let pauline = {
    x: 124,
    y: 68,
    width: 16,
    height: 32
};
let barrels = [];
let conveyors = [];
let elevators = [];
let springs = [];
let hammers = [];
let rivets = [];
let fireballs = [];
let ladders = [];
let score = 0;
let level = 1;
let gameActive = true;
let lives = 3; // Added per your request
let bonusTimer = 5000; // Added per your request
let backgrounds = [];
let platformImg = new Image();
let ladderImg = new Image();
let hammerImg = new Image();
let barrelImg = new Image();
let rivetImg = new Image();
let fireballImg = new Image();
let cementPieImg = new Image();

// Telegram setup
if (Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

// Utility functions
function updateScore() {
    const burn = 0; // Placeholder for bot integration (monthly reset)
    document.getElementById('score').innerText = `Score: ${score} Lives: ${lives} Timer: ${Math.floor(bonusTimer / 60)} Jackpot: ${jackpot} $PREME  Burn This Month: ${premeBurn} $PREME  Perfect: ${perfectRunsToday}/5  $PREME Earned: ${premeEarned}`;
    console.log('Current score:', score, 'Lives:', lives, 'Timer:', bonusTimer, 'Perfect Runs:', perfectRunsToday, '$PREME Earned:', premeEarned, 'PREME Burn:', premeBurn, 'Jackpot:', jackpot);
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function levelUp() {
    level = level % 4 + 1;
    if (level === 1) {
        resetGame();
    } else {
        initLevel();
        score += 300;
    }
    checkPerfectRun();
}

function resetGame() {
    score = 0;
    level = 1;
    lives = 3; // Reset lives
    bonusTimer = 5000; // Reset timer
    mario.x = 50;
    mario.y = 318;
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
    initLevel();
    // perfectRunsToday, premeEarned, premeBurn, jackpot persist per Issue #5
}

function checkPerfectRun() {
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    // Daily reset for perfectRunsToday (Issue #5)
    if (currentTime - lastPerfectRunTime > twentyFourHours) {
        perfectRunsToday = 0;
        lastPerfectRunTime = currentTime;
    }

    // Original perfect run logic with updated burn and persistence (Issue #5)
    const remainingRivets = rivets.length;
    const damageTaken = score < 0 || (score % 10 !== 0 && score > 0);
    if (remainingRivets === 0 && !damageTaken && perfectRunsToday < 5) {
        perfectRunsToday++;
        premeEarned += 50;
        const burnAmount = 50 * 0.01; // 1% of 50 $PREME
        premeBurn += burnAmount;
        console.log('Perfect run achieved! Earned 50 $PREME Tokens. Perfect runs today:', perfectRunsToday, '$PREME Earned:', premeEarned, 'PREME Burn:', premeBurn);
        alert('Perfect run! You earned 50 $PREME Tokens. You have ' + (5 - perfectRunsToday) + ' perfect runs left today. 1% ($0.50) added to PREME Burn.');
    }
}

// Placeholder for jackpot ticket purchase (Issue #6)
function buyJackpotTicket() {
    if (premeEarned >= 10) {
        premeEarned -= 10;
        jackpot += 10;
        premeBurn += 0.1; // 1% of 10 $PREME
        updateScore();
        console.log('Jackpot ticket purchased! Jackpot:', jackpot, 'PREME Burn:', premeBurn);
    }
}

// Load assets (original)
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

// Initialize level (original)
function initLevel() {
    barrels = [];
    conveyors = [];
    elevators = [];
    springs = [];
    hammers = [];
    rivets = [];
    fireballs = [];
    ladders = [];
    
    mario.x = 50;
    mario.y = 318;
    mario.hasHammer = false; mario.hammerTime = 0;
    mario.onLadder = false;
    mario.dy = 0;
    premekong.x = 50;
    premekong.y = 36;
    premekong.bounceDir = 1;
    pauline.x = 124;
    pauline.y = 68;

    const platformY = [400, 300, 200, 100];

    if (level === 1) {
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 });
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 });
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
        hammers.push({ x: 250, y: platformY[1] - 32, width: 32, height: 32, taken: false });
        for (let i = 0; i < 4; i++) {
            rivets.push({ x: 50 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 250 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 250 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 250 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false });
            if (i !== 1 || (i === 1 && (50 + i * 75 !== 124 && 250 + i * 75 !== 124))) {
                rivets.push({ x: 50 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false });
                rivets.push({ x: 250 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false });
            }
        }
    } else if (level === 2) {
        conveyors.push({ x: 0, y: platformY[3], width: canvas.width, height: 10, speed: 1 });
        conveyors.push({ x: 0, y: platformY[2], width: canvas.width, height: 10, speed: -1 });
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 });
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 });
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
        ladders.push({ x: 350, y: platformY[3] - 100, width: 20, height: 100 });
        hammers.push({ x: 200, y: platformY[3] - 32, width: 32, height: 32, taken: false });
        for (let i = 0; i < 4; i++) {
            rivets.push({ x: 50 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 250 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 250 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 250 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false });
            if (i !== 1 || (i === 1 && (50 + i * 75 !== 124 && 250 + i * 75 !== 124))) {
                rivets.push({ x: 50 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false });
                rivets.push({ x: 250 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false });
            }
        }
    } else if (level === 3) {
        elevators.push({ x: 150, y: 300, width: 40, height: 20, dy: 2, minY: 100, maxY: 400 });
        elevators.push({ x: 450, y: 200, width: 40, height: 20, dy: -2, minY: 100, maxY: 400 });
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 });
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 });
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
        for (let i = 0; i < 4; i++) {
            rivets.push({ x: 50 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 250 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 250 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 250 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false });
            if (i !== 1 || (i === 1 && (50 + i * 75 !== 124 && 250 + i * 75 !== 124))) {
                rivets.push({ x: 50 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false });
                rivets.push({ x: 250 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false });
            }
        }
    } else if (level === 4) {
        conveyors.push({ x: 0, y: platformY[3], width: canvas.width, height: 10, speed: 2 });
        conveyors.push({ x: 0, y: platformY[2], width: canvas.width, height: 10, speed: -2 });
        conveyors.push({ x: 0, y: platformY[1], width: canvas.width, height: 10, speed: 2 });
        conveyors.push({ x: 0, y: platformY[0], width: canvas.width, height: 10, speed: -2 });
        ladders.push({ x: 200, y: platformY[0] - 100, width: 20, height: 100 });
        ladders.push({ x: 400, y: platformY[1] - 100, width: 20, height: 100 });
        ladders.push({ x: 300, y: platformY[2] - 100, width: 20, height: 100 });
        hammers.push({ x: 200, y: platformY[3] - 32, width: 32, height: 32, taken: false });
        for (let i = 0; i < 4; i++) {
            rivets.push({ x: 50 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 250 + i * 75, y: platformY[0] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 250 + i * 75, y: platformY[1] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 50 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false });
            rivets.push({ x: 250 + i * 75, y: platformY[2] - 10, width: 20, height: 20, hit: false });
            if (i !== 1 || (i === 1 && (50 + i * 75 !== 124 && 250 + i * 75 !== 124))) {
                rivets.push({ x: 50 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false });
                rivets.push({ x: 250 + i * 75, y: platformY[3] - 10, width: 20, height: 20, hit: false });
            }
        }
    }
    updateScore();
    console.log('Canvas size after scaling:', canvas.width, canvas.height, 'Rivets in level:', rivets.length);
}

// Draw game (original)
function draw() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgrounds[level] && backgrounds[level].complete) {
        ctx.drawImage(backgrounds[level], 0, 0, canvas.width, canvas.height);
    }

    const platformY = [400, 300, 200, 100];
    if (platformImg.complete) {
        platformY.forEach(py => ctx.drawImage(platformImg, 0, py, canvas.width, 10));
    } else {
        ctx.fillStyle = 'red';
        platformY.forEach(py => ctx.fillRect(0, py, canvas.width, 10));
    }

    ctx.fillStyle = 'yellow';
    conveyors.forEach(conveyor => ctx.fillRect(conveyor.x, conveyor.y, conveyor.width, conveyor.height));

    ctx.fillStyle = 'orange';
    elevators.forEach(elevator => ctx.fillRect(elevator.x, elevator.y, elevator.width, elevator.height));

    ladders.forEach(ladder => {
        if (ladderImg.complete) ctx.drawImage(ladderImg, ladder.x, ladder.y, ladder.width, ladder.height);
        else ctx.fillRect(ladder.x, ladder.y, ladder.width, ladder.height);
    });

    hammers.forEach(hammer => {
        if (!hammer.taken && hammerImg.complete) ctx.drawImage(hammerImg, hammer.x, hammer.y, hammer.width, hammer.height);
    });

    rivets.forEach(rivet => {
        if (!rivet.hit && rivetImg.complete) ctx.drawImage(rivetImg, rivet.x, rivet.y, rivet.width, rivet.height);
        else ctx.fillRect(rivet.x, rivet.y, rivet.width, rivet.height);
    });

    fireballs.forEach(fireball => {
        if (fireballImg.complete) ctx.drawImage(fireballImg, fireball.x, fireball.y, 32, 32);
        else ctx.fillRect(fireball.x, fireball.y, 32, 32);
    });

    if (mario.image.complete) {
        ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(mario.x, mario.y, mario.width, mario.height);
        console.log('Mario image not loaded, using fallback:', mario.image.src);
    }

    if (premekong.image.complete) {
        ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);
    }
    premekong.y += premekong.bounceDir * 0.125;
    if (premekong.y <= 36 - premekong.bounceRange || premekong.y >= 36 + premekong.bounceRange) {
        premekong.bounceDir *= -1;
    }

    if (pauline.image.complete) ctx.drawImage(pauline.image, pauline.x, pauline.y, 32, pauline.height);
    else ctx.fillRect(pauline.x, pauline.y, 32, pauline.height);

    barrels.forEach(barrel => {
        if (barrel.type === 'cement_pie' && cementPieImg.complete) ctx.drawImage(cementPieImg, barrel.x, barrel.y, 32, 32);
        else if (barrel.type === 'spring' && springImg.complete) ctx.drawImage(springImg, barrel.x, barrel.y, 32, 32);
        else if (barrelImg.complete) ctx.drawImage(barrelImg, barrel.x, barrel.y, 32, 32);
        else ctx.fillRect(barrel.x, barrel.y, 32, 32);
    });

    requestAnimationFrame(draw);
}

// Update game logic (original with timer and lives logic)
function update() {
    if (!gameActive) return;

    // Timer and lives logic
    bonusTimer--;
    if (bonusTimer <= 0) {
        lives--;
        bonusTimer = 5000;
        if (lives <= 0) resetGame();
    }

    if (!mario.onLadder) {
        mario.dy += mario.gravity;
        mario.y += mario.dy;
        if (mario.jumping) {
            mario.dy = -10;
            mario.jumping = false;
        }
    } else {
        mario.dy = 0;
        mario.y += mario.dy * mario.speed;
    }
    mario.x += mario.dx * mario.speed;

    const platformY = [400, 300, 200, 100];
    platformY.forEach(py => {
        if (mario.y + mario.height > py && mario.y + mario.height < py + 10 && mario.dy > 0 && !mario.onLadder) {
            mario.y = py - mario.height;
            mario.dy = 0;
            mario.onLadder = false;
        }
        if (mario.y > canvas.height - mario.height) {
            mario.y = canvas.height - mario.height;
            mario.dy = 0;
            mario.onLadder = false;
        }
    });

    ladders.forEach(ladder => {
        if (checkCollision(mario, ladder) && mario.y + mario.height > ladder.y && mario.y < ladder.y + ladder.height) {
            mario.onLadder = true;
            if (mario.y < ladder.y) mario.y = ladder.y;
            if (mario.y + mario.height > ladder.y + ladder.height) mario.y = ladder.y + ladder.height - mario.height;
            if ((mario.dx !== 0 && !checkCollision(mario, ladder)) || (mario.dy === 0 && mario.onLadder)) mario.onLadder = false;
        } else if (!checkCollision(mario, ladder)) {
            mario.onLadder = false;
        }
    });

    if (Math.random() < 0.05) {
        if (level === 1) barrels.push({
            x: premekong.x + premekong.width,
            y: premekong.y + premekong.height,
            dx: 1.5,
            dy: 0,
            type: 'barrel'
        });
        else if (level === 2) barrels.push({
            x: premekong.x + premekong.width,
            y: premekong.y + premekong.height,
            dx: 1.5,
            dy: 0,
            type: 'cement_pie'
        });
        else if (level === 3) {
            barrels.push({
                x: premekong.x + premekong.width,
                y: premekong.y + premekong.height,
                dx: 2.5,
                dy: 0,
                type: 'spring'
            });
            if (Math.random() < 0.03) {
                fireballs.push({
                    x: premekong.x + premekong.width,
                    y: premekong.y + premekong.height,
                    dx: 3.5,
                    dy: 0,
                    type: 'fireball'
                });
            }
        } else if (level === 4) {
            if (Math.random() < 0.07) barrels.push({
                x: premekong.x + premekong.width,
                y: premekong.y + premekong.height,
                dx: 2,
                dy: 0,
                type: 'barrel'
            });
            if (Math.random() < 0.05) barrels.push({
                x: premekong.x + premekong.width,
                y: premekong.y + premekong.height,
                dx: 2,
                dy: 0,
                type: 'cement_pie'
            });
            if (Math.random() < 0.04) barrels.push({
                x: premekong.x + premekong.width,
                y: premekong.y + premekong.height,
                dx: 3,
                dy: 0,
                type: 'spring'
            });
            if (Math.random() < 0.04) fireballs.push({
                x: premekong.x + premekong.width,
                y: premekong.y + premekong.height,
                dx: 4,
                dy: 0,
                type: 'fireball'
            });
        }
    }

    barrels.forEach((barrel, i) => {
        barrel.x += barrel.dx;
        barrel.y += barrel.dy || 2;
        const platformY = [400, 300, 200, 100];
        platformY.forEach(py => {
            if (barrel.y + 32 > py && barrel.y + 32 < py + 10 && barrel.dy >= 0) {
                barrel.y = py - 32;
                barrel.dy = 0;
                ladders.forEach(ladder => {
                    if (barrel.x >= ladder.x - 32 && barrel.x <= ladder.x + ladder.width) {
                        barrel.dy = 2;
                    }
                });
                conveyors.forEach(conveyor => {
                    if (barrel.y === conveyor.y && barrel.x >= conveyor.x && barrel.x + 32 <= conveyor.x + conveyor.width) {
                        barrel.x += conveyor.speed;
                    }
                });
            }
        });
        if (barrel.type === 'spring' && barrel.x < canvas.width - 100 && Math.random() < 0.1) barrel.dy = -10;
        if (barrel.x > canvas.width + 32 || barrel.y > canvas.height) barrels.splice(i, 1);
        if (checkCollision(mario, barrel)) {
            if (mario.hasHammer) {
                barrels.splice(i, 1);
                score += 100;
                console.log('Barrel hit with hammer, score +100:', score);
            } else {
                score -= 10;
                console.log('Barrel hit without hammer, score -10:', score);
                barrels.splice(i, 1);
                if (score < 0) score = 0;
            }
        }
    });

    fireballs.forEach((fireball, i) => {
        fireball.x += fireball.dx;
        fireball.y += fireball.dy || 2;
        const platformY = [400, 300, 200, 100];
        platformY.forEach(py => {
            if (fireball.y + 32 > py && fireball.y + 32 < py + 10 && fireball.dy >= 0) {
                fireball.y = py - 32;
                fireball.dy = 0;
                ladders.forEach(ladder => {
                    if (fireball.x >= ladder.x - 32 && fireball.x <= ladder.x + ladder.width) {
                        fireball.dy = 2;
                    }
                });
            }
        });
        if (fireball.x > canvas.width + 32 || fireball.y > canvas.height) fireballs.splice(i, 1);
        if (checkCollision(mario, fireball)) {
            score -= 20;
            console.log('Fireball hit, score -20:', score);
            fireballs.splice(i, 1);
            if (score < 0) score = 0;
        }
    });

    conveyors.forEach(conveyor => {});

    elevators.forEach(elevator => {
        elevator.y += elevator.dy;
        if (elevator.y <= elevator.minY || elevator.y >= elevator.maxY) elevator.dy *= -1;
    });

    rivets.forEach((rivet, i) => {
        if (checkCollision(mario, rivet)) {
            rivet.hit = true;
            score += 50;
            console.log('Rivet collected, score +50:', score);
            rivets.splice(i, 1);
            if (level === 4 && rivets.length === 0) {
                resetGame();
            }
        }
    });

    if (mario.y < pauline.y + 50 && Math.abs(mario.x - pauline.x) < pauline.width / 2 && mario.y + mario.height <= pauline.y + pauline.height) {
        if (level === 4) {
            resetGame();
        } else {
            levelUp();
        }
    }

    if (mario.y < pauline.y + mario.height && mario.y + mario.height > pauline.y && Math.abs(mario.x - pauline.x) > pauline.width / 2) {}

    if (mario.hasHammer) {
        mario.hammerTime--;
        if (mario.hammerTime <= 0) mario.hasHammer = false;
    }
    hammers.forEach(hammer => {
        if (!hammer.taken && checkCollision(mario, hammer)) {
            hammer.taken = true;
            mario.hasHammer = true;
            mario.hammerTime = 300;
        }
    });

    updateScore();
}

// Controls with mouse and touch support (Issue #3 fix + laptop mouse support)
let lastTouchTime = 0;
const debounceDelay = 100; // Debounce for touch (Issue #3)
function moveLeft() {
    const now = Date.now();
    if (gameActive && !mario.hasHammer && now - lastTouchTime > debounceDelay) {
        mario.dx = -1;
        lastTouchTime = now;
    }
}
function moveRight() {
    const now = Date.now();
    if (gameActive && !mario.hasHammer && now - lastTouchTime > debounceDelay) {
        mario.dx = 1;
        lastTouchTime = now;
    }
}
function jump() {
    const now = Date.now();
    if (gameActive && !mario.jumping && !mario.onLadder && !mario.hasHammer && now - lastTouchTime > debounceDelay) {
        mario.jumping = true;
        lastTouchTime = now;
    }
}
function climbUp() {
    const now = Date.now();
    if (gameActive && mario.onLadder && now - lastTouchTime > debounceDelay) {
        mario.dy = -1;
        lastTouchTime = now;
    }
}
function climbDown() {
    const now = Date.now();
    if (gameActive && mario.onLadder && now - lastTouchTime > debounceDelay) {
        mario.dy = 1;
        lastTouchTime = now;
    }
}
function stopMove() { mario.dx = 0; }
function stopClimb() { mario.dy = 0; mario.onLadder = false; }

// Telegram data handler (original)
function handleTelegramData() {
    if (Telegram && Telegram.WebApp) {
        Telegram.WebApp.onEvent('web_app_data', (data) => {
            if (data.data) {
                const gameData = JSON.parse(data.data);
                score = gameData.score || score;
                perfectRunsToday = gameData.perfectRunsToday || perfectRunsToday;
                premeEarned = gameData.premeEarned || premeEarned;
                updateScore();
            }
        });
    }
}

// Start game (original with timer/lives integration)
loadAssets();
initLevel();
setInterval(update, 1000 / 60);
draw();
handleTelegramData();
