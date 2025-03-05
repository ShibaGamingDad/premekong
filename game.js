// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 672;
canvas.height = 500;
ctx.scale(1, 1);

// Persistent P2E state
let perfectRunsToday = localStorage.getItem('perfectRunsToday') ? parseInt(localStorage.getItem('perfectRunsToday')) : 0;
let lastPerfectRunTime = localStorage.getItem('lastPerfectRunTime') ? parseInt(localStorage.getItem('lastPerfectRunTime')) : Date.now();
let premeEarned = localStorage.getItem('premeEarned') ? parseFloat(localStorage.getItem('premeEarned')) : 0;
let premeBurn = localStorage.getItem('premeBurn') ? parseFloat(localStorage.getItem('premeBurn')) : 0;
let jackpot = localStorage.getItem('jackpot') ? parseFloat(localStorage.getItem('jackpot')) : 0;

// Leaderboard state (local fallback, synced with server)
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let telegramId = null; // Will fetch from Telegram API
let leaderboard = []; // { telegramId, score, isLastWinner }
let lastResetTime = localStorage.getItem('lastResetTime') ? parseInt(localStorage.getItem('lastResetTime')) : Date.now();
const WEEK_MS = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds

// Game state
let mario = { x: 50, y: 318, width: 32, height: 32, dx: 0, dy: 0, speed: 3, gravity: 0.5, jumping: false, onLadder: false, hasHammer: false, hammerTime: 0 };
let premekong = { x: 50, y: 36, width: 64, height: 64, bounceDir: 1, bounceRange: 20 };
let pauline = { x: 124, y: 68, width: 16, height: 32 };
let barrels = [], conveyors = [], elevators = [], springs = [], hammers = [], rivets = [], fireballs = [], ladders = [];
let score = 0, level = 1, gameActive = true, lives = 3, bonusTimer = 5000, message = null, messageTimer = 0, damageTakenThisLevel = false;
let backgrounds = [], platformImg = new Image(), ladderImg = new Image(), hammerImg = new Image(), barrelImg = new Image(), rivetImg = new Image(), fireballImg = new Image(), cementPieImg = new Image();

if (Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
    telegramId = Telegram.WebApp.initDataUnsafe.user?.id || 'unknown'; // Fetch Telegram ID
}

// Utility functions
function updateScore() {
    document.getElementById('score').innerText = `Score: ${score} Lives: ${lives} Timer: ${Math.floor(bonusTimer / 60)} Jackpot: ${jackpot} $PREME  Burn: ${premeBurn} $PREME  Perfect: ${perfectRunsToday}/5  $PREME Earned: ${premeEarned}`;
    highScore = Math.max(highScore, score);
    localStorage.setItem('highScore', highScore);
    syncLeaderboard();
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y;
}

function showMessage(text, duration = 120) {
    message = text;
    messageTimer = duration;
}

function levelUp() {
    const timerBonus = Math.floor(bonusTimer / 60) * 10;
    score += timerBonus;
    console.log('Level completed! Timer bonus:', timerBonus);

    level = level % 4 + 1;
    if (level === 1) resetGame();
    else {
        initLevel();
        score += 300;
        bonusTimer = 5000;
        damageTakenThisLevel = false;
        checkPerfectRun();
    }
}

function resetGame() {
    score = 0;
    level = 1;
    lives = 3;
    bonusTimer = 5000;
    mario = { x: 50, y: 318, width: 32, height: 32, dx: 0, dy: 0, speed: 3, gravity: 0.5, jumping: false, onLadder: false, hasHammer: false, hammerTime: 0 };
    premekong = { x: 50, y: 36, width: 64, height: 64, bounceDir: 1, bounceRange: 20 };
    pauline = { x: 124, y: 68, width: 16, height: 32 };
    barrels = []; conveyors = []; elevators = []; springs = []; hammers = []; rivets = []; fireballs = []; ladders = [];
    damageTakenThisLevel = false;
    initLevel();
}

function checkPerfectRun() {
    const currentTime = Date.now();
    if (currentTime - lastPerfectRunTime > 24 * 60 * 60 * 1000) {
        perfectRunsToday = 0;
        lastPerfectRunTime = currentTime;
    }

    if (rivets.length === 0 && !damageTakenThisLevel && perfectRunsToday < 5) {
        perfectRunsToday++;
        premeEarned += 49.5;
        premeBurn += 0.5;
        console.log('Perfect run! Earned 49.5 $PREME. Runs today:', perfectRunsToday);
        showMessage('Perfect run! +49.5 $PREME. ' + (5 - perfectRunsToday) + ' left today.');
        syncWithServer();
    }
    updateScore();
}

function syncWithServer() {
    if (Telegram && Telegram.WebApp && Telegram.WebApp.isVersionAtLeast('6.0')) {
        try {
            const data = {
                telegramId,
                highScore,
                perfectRunsToday,
                lastPerfectRunTime,
                premeEarned,
                premeBurnContribution: 0.5,
                jackpot
            };
            Telegram.WebApp.sendData(JSON.stringify(data));
        } catch (error) {
            console.error('Server sync error:', error);
        }
    }
}

function resetLeaderboardIfNeeded() {
    const currentTime = Date.now();
    if (currentTime - lastResetTime > WEEK_MS) {
        fetchLeaderboardFromServer().then(newLeaderboard => {
            const lastWinner = leaderboard.length ? leaderboard[0] : null;
            leaderboard = [];
            if (lastWinner) leaderboard.push({ ...lastWinner, isLastWinner: true });
            lastResetTime = currentTime;
            localStorage.setItem('lastResetTime', lastResetTime);
            awardWeeklyPrize(lastWinner);
        });
    }
}

function awardWeeklyPrize(winner) {
    if (winner) {
        const prize = 100;
        const burn = prize * 0.01; // 1% burn
        premeEarned += prize - burn; // 99 to winner
        premeBurn += burn; // 1 to burn
        console.log(`Weekly winner ${winner.telegramId} awarded ${prize - burn} $PREME, ${burn} burned`);
        syncWithServer();
    }
}

function fetchLeaderboardFromServer() {
    return new Promise(resolve => {
        // Stub: Replace with actual server fetch when implemented
        resolve(leaderboard);
    });
}

function updateLeaderboard() {
    resetLeaderboardIfNeeded();
    const playerEntry = leaderboard.find(entry => entry.telegramId === telegramId);
    if (playerEntry) playerEntry.score = Math.max(playerEntry.score, highScore);
    else leaderboard.push({ telegramId, score: highScore, isLastWinner: false });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10); // Top 10
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

function syncLeaderboard() {
    updateLeaderboard();
    // TODO: Sync with server when implemented
}

function showLeaderboard() {
    const lbDiv = document.getElementById('leaderboard');
    lbDiv.innerHTML = '<h3>Leaderboard</h3>';
    leaderboard.forEach((entry, i) => {
        const style = entry.isLastWinner ? 'color: gold;' : '';
        lbDiv.innerHTML += `<p style="${style}">${i + 1}. ID: ${entry.telegramId} - Score: ${entry.score}${entry.isLastWinner ? ' (Last Week\'s Winner)' : ''}</p>`;
    });
    lbDiv.style.display = 'block';
}

// Load assets (unchanged)
function loadAssets() {
    mario.image = new Image(); mario.image.src = 'mario.png';
    premekong.image = new Image(); premekong.image.src = 'premekong.png';
    pauline.image = new Image(); pauline.image.src = 'pauline.png';
    barrelImg.src = 'barrel.png'; cementPieImg.src = 'cement_pie.png'; springImg = new Image(); springImg.src = 'spring.png';
    hammerImg.src = 'hammer.png'; ladderImg.src = 'ladder.png'; rivetImg.src = 'rivet.png'; fireballImg.src = 'fireball.png';
    platformImg.src = 'platform.png';
    backgrounds[1] = new Image(); backgrounds[1].src = 'background1.png';
    backgrounds[2] = new Image(); backgrounds[2].src = 'background2.png';
    backgrounds[3] = new Image(); backgrounds[3].src = 'background3.png';
    backgrounds[4] = new Image(); backgrounds[4].src = 'background4.png';
}

// Initialize level (unchanged)
function initLevel() {
    barrels = []; conveyors = []; elevators = []; springs = []; hammers = []; rivets = []; fireballs = []; ladders = [];
    mario.x = 50; mario.y = 318; mario.hasHammer = false; mario.hammerTime = 0; mario.onLadder = false; mario.dy = 0;
    premekong.x = 50; premekong.y = 36; premekong.bounceDir = 1; pauline.x = 124; pauline.y = 68;
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
}

// Draw game (unchanged except for leaderboard display handling)
function draw() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    try {
        if (backgrounds[level] && backgrounds[level].complete) ctx.drawImage(backgrounds[level], 0, 0, canvas.width, canvas.height);
        const platformY = [400, 300, 200, 100];
        if (platformImg.complete) platformY.forEach(py => ctx.drawImage(platformImg, 0, py, canvas.width, 10));
        else { ctx.fillStyle = 'red'; platformY.forEach(py => ctx.fillRect(0, py, canvas.width, 10)); }
        ctx.fillStyle = 'yellow'; conveyors.forEach(conveyor => ctx.fillRect(conveyor.x, conveyor.y, conveyor.width, conveyor.height));
        ctx.fillStyle = 'orange'; elevators.forEach(elevator => ctx.fillRect(elevator.x, elevator.y, elevator.width, elevator.height));
        ladders.forEach(ladder => ladderImg.complete ? ctx.drawImage(ladderImg, ladder.x, ladder.y, ladder.width, ladder.height) : ctx.fillRect(ladder.x, ladder.y, ladder.width, ladder.height));
        hammers.forEach(hammer => { if (!hammer.taken && hammerImg.complete) ctx.drawImage(hammerImg, hammer.x, hammer.y, hammer.width, hammer.height); });
        rivets.forEach(rivet => rivetImg.complete && !rivet.hit ? ctx.drawImage(rivetImg, rivet.x, rivet.y, rivet.width, rivet.height) : ctx.fillRect(rivet.x, rivet.y, rivet.width, rivet.height));
        fireballs.forEach(fireball => fireballImg.complete ? ctx.drawImage(fireballImg, fireball.x, fireball.y, 32, 32) : ctx.fillRect(fireball.x, fireball.y, 32, 32));
        if (mario.image.complete) ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
        else { ctx.fillStyle = 'blue'; ctx.fillRect(mario.x, mario.y, mario.width, mario.height); }
        if (premekong.image.complete) ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);
        premekong.y += premekong.bounceDir * 0.125;
        if (premekong.y <= 36 - premekong.bounceRange || premekong.y >= 36 + premekong.bounceRange) premekong.bounceDir *= -1;
        if (pauline.image.complete) ctx.drawImage(pauline.image, pauline.x, pauline.y, 32, pauline.height);
        else ctx.fillRect(pauline.x, pauline.y, 32, pauline.height);
        barrels.forEach(barrel => {
            if (barrel.type === 'cement_pie' && cementPieImg.complete) ctx.drawImage(cementPieImg, barrel.x, barrel.y, 32, 32);
            else if (barrel.type === 'spring' && springImg.complete) ctx.drawImage(springImg, barrel.x, barrel.y, 32, 32);
            else if (barrelImg.complete) ctx.drawImage(barrelImg, barrel.x, barrel.y, 32, 32);
            else ctx.fillRect(barrel.x, barrel.y, 32, 32);
        });
        if (message && messageTimer > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 30, 400, 60);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(message, canvas.width / 2, canvas.height / 2);
            messageTimer--;
            if (messageTimer <= 0) message = null;
        }
    } catch (error) {
        console.error('Draw error:', error);
    }
    requestAnimationFrame(draw);
}

// Update game logic (unchanged except for Level 4 reset)
function update() {
    if (!gameActive) return;
    try {
        bonusTimer--;
        if (bonusTimer <= 0) {
            lives--;
            if (lives > 0) {
                mario.x = 50; mario.y = 318; mario.dx = 0; mario.dy = 0; mario.jumping = false; mario.onLadder = false; bonusTimer = 5000; initLevel();
            } else resetGame();
        }
        if (!mario.onLadder) {
            mario.dy += mario.gravity;
            mario.y += mario.dy;
            if (mario.jumping) { mario.dy = -10; mario.jumping = false; }
        } else {
            mario.dy = 0;
            mario.y += mario.dy * mario.speed;
        }
        mario.x += mario.dx * mario.speed;
        const platformY = [400, 300, 200, 100];
        platformY.forEach(py => {
            if (mario.y + mario.height > py && mario.y + mario.height < py + 10 && mario.dy > 0 && !mario.onLadder) {
                mario.y = py - mario.height; mario.dy = 0; mario.onLadder = false;
            }
            if (mario.y > canvas.height - mario.height) { mario.y = canvas.height - mario.height; mario.dy = 0; mario.onLadder = false; }
        });
        ladders.forEach(ladder => {
            if (checkCollision(mario, ladder) && mario.y + mario.height > ladder.y && mario.y < ladder.y + ladder.height) {
                mario.onLadder = true;
                if (mario.y < ladder.y) mario.y = ladder.y;
                if (mario.y + mario.height > ladder.y + ladder.height) mario.y = ladder.y + ladder.height - mario.height;
                if ((mario.dx !== 0 && !checkCollision(mario, ladder)) || (mario.dy === 0 && mario.onLadder)) mario.onLadder = false;
            } else if (!checkCollision(mario, ladder)) mario.onLadder = false;
        });
        if (Math.random() < 0.05) {
            if (level === 1) barrels.push({ x: premekong.x + premekong.width, y: premekong.y + premekong.height, dx: 1.5, dy: 0, type: 'barrel' });
            else if (level === 2) barrels.push({ x: premekong.x + premekong.width, y: premekong.y + premekong.height, dx: 1.5, dy: 0, type: 'cement_pie' });
            else if (level === 3) {
                barrels.push({ x: premekong.x + premekong.width, y: premekong.y + premekong.height, dx: 2.5, dy: 0, type: 'spring' });
                if (Math.random() < 0.03) fireballs.push({ x: premekong.x + premekong.width, y: premekong.y + premekong.height, dx: 3.5, dy: 0, type: 'fireball' });
            } else if (level === 4) {
                if (Math.random() < 0.07) barrels.push({ x: premekong.x + premekong.width, y: premekong.y + premekong.height, dx: 2, dy: 0, type: 'barrel' });
                if (Math.random() < 0.05) barrels.push({ x: premekong.x + premekong.width, y: premekong.y + premekong.height, dx: 2, dy: 0, type: 'cement_pie' });
                if (Math.random() < 0.04) barrels.push({ x: premekong.x + premekong.width, y: premekong.y + premekong.height, dx: 3, dy: 0, type: 'spring' });
                if (Math.random() < 0.04) fireballs.push({ x: premekong.x + premekong.width, y: premekong.y + premekong.height, dx: 4, dy: 0, type: 'fireball' });
            }
        }
        barrels.forEach((barrel, i) => {
            barrel.x += barrel.dx; barrel.y += barrel.dy || 2;
            platformY.forEach(py => {
                if (barrel.y + 32 > py && barrel.y + 32 < py + 10 && barrel.dy >= 0) {
                    barrel.y = py - 32; barrel.dy = 0;
                    ladders.forEach(ladder => { if (barrel.x >= ladder.x - 32 && barrel.x <= ladder.x + ladder.width) barrel.dy = 2; });
                    conveyors.forEach(conveyor => { if (barrel.y === conveyor.y && barrel.x >= conveyor.x && barrel.x + 32 <= conveyor.x + conveyor.width) barrel.x += conveyor.speed; });
                }
            });
            if (barrel.type === 'spring' && barrel.x < canvas.width - 100 && Math.random() < 0.1) barrel.dy = -10;
            if (barrel.x > canvas.width + 32 || barrel.y > canvas.height) barrels.splice(i, 1);
            if (checkCollision(mario, barrel)) {
                if (mario.hasHammer) { barrels.splice(i, 1); score += 100; console.log('Barrel hit with hammer, +100:', score); }
                else { score -= 10; damageTakenThisLevel = true; console.log('Barrel hit, -10:', score); barrels.splice(i, 1); if (score < 0) score = 0; }
            }
        });
        fireballs.forEach((fireball, i) => {
            fireball.x += fireball.dx; fireball.y += fireball.dy || 2;
            platformY.forEach(py => {
                if (fireball.y + 32 > py && fireball.y + 32 < py + 10 && fireball.dy >= 0) {
                    fireball.y = py - 32; fireball.dy = 0;
                    ladders.forEach(ladder => { if (fireball.x >= ladder.x - 32 && fireball.x <= ladder.x + ladder.width) fireball.dy = 2; });
                }
            });
            if (fireball.x > canvas.width + 32 || fireball.y > canvas.height) fireballs.splice(i, 1);
            if (checkCollision(mario, fireball)) {
                score -= 20; damageTakenThisLevel = true; console.log('Fireball hit, -20:', score); fireballs.splice(i, 1); if (score < 0) score = 0;
            }
        });
        conveyors.forEach(conveyor => {});
        elevators.forEach(elevator => { elevator.y += elevator.dy; if (elevator.y <= elevator.minY || elevator.y >= elevator.maxY) elevator.dy *= -1; });
        rivets.forEach((rivet, i) => {
            if (checkCollision(mario, rivet)) {
                rivet.hit = true; score += 50; console.log('Rivet collected, +50:', score); rivets.splice(i, 1);
                if (level === 4 && rivets.length === 0) {
                    const timerBonus = Math.floor(bonusTimer / 60) * 10; score += timerBonus; console.log('Level 4 done! Bonus:', timerBonus);
                    checkPerfectRun(); resetGame();
                }
            }
        });
        if (mario.y < pauline.y + 50 && Math.abs(mario.x - pauline.x) < pauline.width / 2 && mario.y + mario.height <= pauline.y + pauline.height) {
            if (level === 4) {
                const timerBonus = Math.floor(bonusTimer / 60) * 10; score += timerBonus; console.log('Level 4 done via Pauline! Bonus:', timerBonus);
                checkPerfectRun(); resetGame();
            } else levelUp();
        }
        if (mario.y < pauline.y + mario.height && mario.y + mario.height > pauline.y && Math.abs(mario.x - pauline.x) > pauline.width / 2) {}
        if (mario.hasHammer) { mario.hammerTime--; if (mario.hammerTime <= 0) mario.hasHammer = false; }
        hammers.forEach(hammer => {
            if (!hammer.taken && checkCollision(mario, hammer)) {
                hammer.taken = true; mario.hasHammer = true; mario.hammerTime = 300; score += 75; console.log('Hammer collected, +75:', score);
            }
        });
        updateScore();
    } catch (error) {
        console.error('Update error:', error);
    }
}

// Controls (unchanged)
let lastTouchTime = 0;
const debounceDelay = 100;
function moveLeft() { const now = Date.now(); if (gameActive && !mario.hasHammer && now - lastTouchTime > debounceDelay) { mario.dx = -1; lastTouchTime = now; } }
function moveRight() { const now = Date.now(); if (gameActive && !mario.hasHammer && now - lastTouchTime > debounceDelay) { mario.dx = 1; lastTouchTime = now; } }
function jump() { const now = Date.now(); if (gameActive && !mario.jumping && !mario.onLadder && !mario.hasHammer && now - lastTouchTime > debounceDelay) { mario.jumping = true; lastTouchTime = now; } }
function climbUp() { const now = Date.now(); if (gameActive && mario.onLadder && now - lastTouchTime > debounceDelay) { mario.dy = -1; lastTouchTime = now; } }
function climbDown() { const now = Date.now(); if (gameActive && mario.onLadder && now - lastTouchTime > debounceDelay) { mario.dy = 1; lastTouchTime = now; } }
function stopMove() { mario.dx = 0; }
function stopClimb() { mario.dy = 0; mario.onLadder = false; }

function handleTelegramData() {
    if (Telegram && Telegram.WebApp) {
        Telegram.WebApp.onEvent('web_app_data', (data) => {
            if (data.data) {
                const gameData = JSON.parse(data.data);
                score = gameData.score || score;
                perfectRunsToday = gameData.perfectRunsToday || perfectRunsToday;
                premeEarned = gameData.premeEarned || premeEarned;
                premeBurn = gameData.premeBurn || premeBurn;
                jackpot = gameData.jackpot || jackpot;
                leaderboard = gameData.leaderboard || leaderboard;
                updateScore();
            }
        });
        setInterval(syncWithServer, 300000);
    }
}

// Start game
loadAssets();
initLevel();
setInterval(update, 1000 / 60);
draw();
handleTelegramData();
