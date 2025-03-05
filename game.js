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
let stars = localStorage.getItem('stars') ? parseInt(localStorage.getItem('stars')) : 0; // New: Track stars
let hasFirstBuyDoubleStars = localStorage.getItem('hasFirstBuyDoubleStars') ? JSON.parse(localStorage.getItem('hasFirstBuyDoubleStars')) : true; // New: Track first buy promotion
let dailyDealItem = null; // New: Track daily deal (randomized daily)
let jackpotTickets = localStorage.getItem('jackpotTickets') ? parseInt(localStorage.getItem('jackpotTickets')) : 0; // New: Track jackpot tickets

// Leaderboard state
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let telegramId = null;
let leaderboard = [];
const SERVER_URL = 'https://premekong.yourusername.repl.co'; // Replace with your actual Replit URL

// Game state
let mario = { x: 50, y: 318, width: 32, height: 32, dx: 0, dy: 0, speed: 3, gravity: 0.5, jumping: false, onLadder: false, hasHammer: false, hammerTime: 0, hasDoubleJump: false, hasBarrelShield: false, hasSpeedBoost: false }; // Updated for shop items
let premekong = { x: 50, y: 36, width: 64, height: 64, bounceDir: 1, bounceRange: 20 };
let pauline = { x: 124, y: 68, width: 16, height: 32 };
let barrels = [], conveyors = [], elevators = [], springs = [], hammers = [], rivets = [], fireballs = [], ladders = [];
let score = 0, level = 1, gameActive = true, lives = 3, bonusTimer = 5000, message = null, messageTimer = 0, damageTakenThisLevel = false;
let backgrounds = [], platformImg = new Image(), ladderImg = new Image(), hammerImg = new Image(), barrelImg = new Image(), rivetImg = new Image(), fireballImg = new Image(), cementPieImg = new Image(), marioSkinImg = null; // New for Mario skin

if (Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
    telegramId = Telegram.WebApp.initDataUnsafe.user?.id || 'unknown';
}

// Shop items and pricing (1 $PREME = $0.01, so multiply original $PREME by 100; stars = $0.05 each)
const shopItems = {
    doubleJump: { stars: 12, preme: 60 }, // 0.6 $PREME * 100 = 60 $PREME
    extraLife: { stars: 20, preme: 100 }, // 1 $PREME * 100 = 100 $PREME
    marioSkin: { stars: 40, preme: 200 }, // 2 $PREME * 100 = 200 $PREME
    barrelShield: { stars: 20, preme: 100 }, // 1 $PREME * 100 = 100 $PREME
    speedBoost: { stars: 16, preme: 80 }, // 0.8 $PREME * 100 = 80 $PREME
    bonusPoints: { stars: 30, preme: 150 }, // 1.5 $PREME * 100 = 150 $PREME
    paulineGift: { stars: 24, preme: 120 }, // 1.2 $PREME * 100 = 120 $PREME
    superHammer: { stars: 40, preme: 200 }, // 2 $PREME * 100 = 200 $PREME
    levelSkip: { stars: 50, preme: 250 }, // 2.5 $PREME * 100 = 250 $PREME
    vipBasic: { stars: 50, preme: 250 }, // 2.5 $PREME * 100 = 250 $PREME
    vipPremium: { stars: 100, preme: 500 }, // 5 $PREME * 100 = 500 $PREME
    jackpotTicket: { stars: 0, preme: 10 }, // 10 $PREME per ticket
    jackpotBundle: { stars: 0, preme: 100 } // 100 $PREME for 12 tickets
};

const dailyDeals = Object.keys(shopItems).filter(item => item !== 'jackpotTicket' && item !== 'jackpotBundle'); // Exclude jackpot items from daily deals

// Utility functions
function updateScore() {
    document.getElementById('score').innerText = `Score: ${score} Lives: ${lives} Timer: ${Math.floor(bonusTimer / 60)} Jackpot: ${jackpot} $PREME  Burn: ${premeBurn} $PREME  Perfect: ${perfectRunsToday}/5  $PREME Earned: ${premeEarned.toFixed(2)} Stars: ${stars} Jackpot Tickets: ${jackpotTickets}`;
    highScore = Math.max(highScore, score);
    localStorage.setItem('highScore', highScore);
    localStorage.setItem('perfectRunsToday', perfectRunsToday);
    localStorage.setItem('lastPerfectRunTime', lastPerfectRunTime);
    localStorage.setItem('premeEarned', premeEarned);
    localStorage.setItem('premeBurn', premeBurn);
    localStorage.setItem('jackpot', jackpot);
    localStorage.setItem('stars', stars);
    localStorage.setItem('hasFirstBuyDoubleStars', hasFirstBuyDoubleStars);
    localStorage.setItem('jackpotTickets', jackpotTickets);
    syncWithServer();
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
    mario = { x: 50, y: 318, width: 32, height: 32, dx: 0, dy: 0, speed: 3, gravity: 0.5, jumping: false, onLadder: false, hasHammer: false, hammerTime: 0, hasDoubleJump: false, hasBarrelShield: false, hasSpeedBoost: false };
    premekong = { x: 50, y: 36, width: 64, height: 64, bounceDir: 1, bounceRange: 20 };
    pauline = { x: 124, y: 68, width: 16, height: 32 };
    barrels = []; conveyors = []; elevators = []; springs = []; hammers = []; rivets = []; fireballs = []; ladders = [];
    damageTakenThisLevel = false;
    initLevel();
    applyVIPEffects(); // Reset VIP effects
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
    if (!telegramId) return;
    fetch(`${SERVER_URL}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            telegramId,
            highScore,
            perfectRunsToday,
            lastPerfectRunTime,
            premeEarned,
            premeBurnContribution: 0.5,
            jackpot,
            stars,
            hasFirstBuyDoubleStars,
            jackpotTickets
        })
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        leaderboard = data.leaderboard || [];
        premeEarned = data.premeEarned || premeEarned;
        premeBurn = data.premeBurn || premeBurn;
        perfectRunsToday = data.perfectRunsToday || perfectRunsToday;
        lastPerfectRunTime = data.lastPerfectRunTime || lastPerfectRunTime;
        stars = data.stars || stars;
        hasFirstBuyDoubleStars = data.hasFirstBuyDoubleStars !== undefined ? data.hasFirstBuyDoubleStars : hasFirstBuyDoubleStars;
        jackpot = data.jackpot || jackpot;
        jackpotTickets = data.jackpotTickets || jackpotTickets;
        updateScore();
    })
    .catch(error => console.error('Sync error:', error));
}

function showMenu() {
    const menuDiv = document.getElementById('menu');
    if (menuDiv.style.display === 'block') {
        menuDiv.style.display = 'none'; // Close if already open
    } else {
        menuDiv.innerHTML = `
            <h3>Menu</h3>
            <button onclick="showLeaderboard()">Leaderboard</button>
            <button onclick="showShop()">Shop</button>
        `;
        menuDiv.style.display = 'block';
    }
}

function showLeaderboard() {
    const lbDiv = document.getElementById('leaderboard');
    if (lbDiv.style.display === 'block') {
        lbDiv.style.display = 'none'; // Close if already open
    } else {
        fetch(`${SERVER_URL}/leaderboard`, { cache: 'no-cache' })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            leaderboard = data.leaderboard || [];
            if (leaderboard.length === 0) {
                lbDiv.innerHTML = '<h3>Leaderboard</h3><p>No scores yet.</p>';
            } else {
                lbDiv.innerHTML = '<h3>Leaderboard</h3>';
                leaderboard.slice(0, 10).forEach((entry, i) => {
                    const style = entry.isLastWinner ? 'color: gold;' : '';
                    lbDiv.innerHTML += `<p style="${style}">${i + 1}. ID: ${entry.telegramId} - Score: ${entry.score}${entry.isLastWinner ? ' (Last Week\'s Winner)' : ''}</p>`;
                });
            }
            lbDiv.style.display = 'block';
        })
        .catch(error => {
            console.error('Leaderboard fetch error:', error);
            lbDiv.innerHTML = '<h3>Leaderboard</h3><p>Error loading leaderboard. Check server connection or ensure Replit is running.</p>';
            lbDiv.style.display = 'block';
        });
    }
}

function showShop() {
    const shopDiv = document.getElementById('shop');
    if (shopDiv.style.display === 'block') {
        shopDiv.style.display = 'none'; // Close if already open
    } else {
        const today = new Date().toDateString();
        if (!localStorage.getItem('lastDailyDealDate') || localStorage.getItem('lastDailyDealDate') !== today) {
            dailyDealItem = dailyDeals[Math.floor(Math.random() * dailyDeals.length)];
            localStorage.setItem('lastDailyDealDate', today);
        }

        shopDiv.innerHTML = `
            <h3>Shop</h3>
            <p>Stars: ${stars} | $PREME: ${premeEarned.toFixed(2)} | Jackpot Tickets: ${jackpotTickets}</p>
            ${hasFirstBuyDoubleStars ? '<p>First Buy Double Stars Available!</p>' : ''}
            ${dailyDealItem ? `<p>Daily Deal (20% off): ${dailyDealItem}</p>` : ''}
            <button onclick="buyItem('unlock', 20, 0)">Unlock (20 Stars)</button><br>
            <button onclick="buyItem('doubleJump', ${shopItems.doubleJump.stars}, ${shopItems.doubleJump.preme})">Double Jump (${shopItems.doubleJump.stars} Stars / ${shopItems.doubleJump.preme} $PREME)</button><br>
            <button onclick="buyItem('extraLife', ${shopItems.extraLife.stars}, ${shopItems.extraLife.preme})">Extra Life (${shopItems.extraLife.stars} Stars / ${shopItems.extraLife.preme} $PREME)</button><br>
            <button onclick="buyItem('marioSkin', ${shopItems.marioSkin.stars}, ${shopItems.marioSkin.preme})">Mario Skin (${shopItems.marioSkin.stars} Stars / ${shopItems.marioSkin.preme} $PREME)</button><br>
            <button onclick="buyItem('barrelShield', ${shopItems.barrelShield.stars}, ${shopItems.barrelShield.preme})">Barrel Shield (${shopItems.barrelShield.stars} Stars / ${shopItems.barrelShield.preme} $PREME)</button><br>
            <button onclick="buyItem('speedBoost', ${shopItems.speedBoost.stars}, ${shopItems.speedBoost.preme})">Speed Boost (${shopItems.speedBoost.stars} Stars / ${shopItems.speedBoost.preme} $PREME)</button><br>
            <button onclick="buyItem('bonusPoints', ${shopItems.bonusPoints.stars}, ${shopItems.bonusPoints.preme})">Bonus Points (${shopItems.bonusPoints.stars} Stars / ${shopItems.bonusPoints.preme} $PREME)</button><br>
            <button onclick="buyItem('paulineGift', ${shopItems.paulineGift.stars}, ${shopItems.paulineGift.preme})">Pauline’s Gift (${shopItems.paulineGift.stars} Stars / ${shopItems.paulineGift.preme} $PREME)</button><br>
            <button onclick="buyItem('superHammer', ${shopItems.superHammer.stars}, ${shopItems.superHammer.preme})">Super Hammer (${shopItems.superHammer.stars} Stars / ${shopItems.superHammer.preme} $PREME)</button><br>
            <button onclick="buyItem('levelSkip', ${shopItems.levelSkip.stars}, ${shopItems.levelSkip.preme})">Level Skip (${shopItems.levelSkip.stars} Stars / ${shopItems.levelSkip.preme} $PREME)</button><br>
            <button onclick="buyItem('vipBasic', ${shopItems.vipBasic.stars}, ${shopItems.vipBasic.preme})">Basic VIP (${shopItems.vipBasic.stars} Stars / ${shopItems.vipBasic.preme} $PREME)</button><br>
            <button onclick="buyItem('vipPremium', ${shopItems.vipPremium.stars}, ${shopItems.vipPremium.preme})">Premium VIP (${shopItems.vipPremium.stars} Stars / ${shopItems.vipPremium.preme} $PREME)</button><br>
            <button onclick="buyItem('jackpotTicket', ${shopItems.jackpotTicket.stars}, ${shopItems.jackpotTicket.preme})">Jackpot Ticket (${shopItems.jackpotTicket.preme} $PREME)</button><br>
            <button onclick="buyItem('jackpotBundle', ${shopItems.jackpotBundle.stars}, ${shopItems.jackpotBundle.preme})">Jackpot Bundle (12 Tickets, ${shopItems.jackpotBundle.preme} $PREME)</button>
        `;
        shopDiv.style.display = 'block';
    }
}

function buyItem(item, starCost, premeCost) {
    const effectiveStarCost = hasFirstBuyDoubleStars && starCost > 0 ? starCost / 2 : starCost; // First buy double stars
    const discount = dailyDealItem === item ? 0.8 : 1; // 20% discount for daily deal (excludes jackpot items)
    const finalStarCost = Math.ceil(effectiveStarCost * discount);
    const finalPremeCost = Math.ceil(premeCost * discount); // Round up for whole $PREME

    if (stars >= finalStarCost || premeEarned >= finalPremeCost) {
        if (stars >= finalStarCost) {
            stars -= finalStarCost;
            if (hasFirstBuyDoubleStars && starCost > 0) {
                hasFirstBuyDoubleStars = false;
                showMessage('First Buy Double Stars used! +Extra stars applied.');
            }
        } else {
            premeEarned -= finalPremeCost;
            let burnAmount = 0;
            let jackpotIncrease = 0;

            if (item === 'jackpotTicket') {
                jackpotIncrease = finalPremeCost * 0.9; // 90% to jackpot
                burnAmount = finalPremeCost * 0.1; // 10% to burn
                jackpotTickets += 1;
                showMessage(`Purchased 1 Jackpot Ticket. ${jackpotIncrease.toFixed(2)} $PREME added to jackpot, ${burnAmount.toFixed(2)} $PREME burned.`);
            } else if (item === 'jackpotBundle') {
                jackpotIncrease = finalPremeCost * 0.9; // 90% to jackpot
                burnAmount = finalPremeCost * 0.1; // 10% to burn
                jackpotTickets += 12;
                showMessage(`Purchased Jackpot Bundle (12 Tickets). ${jackpotIncrease.toFixed(2)} $PREME added to jackpot, ${burnAmount.toFixed(2)} $PREME burned.`);
            } else {
                burnAmount = finalPremeCost * 0.01; // 1% burn for other items
                showMessage(`Purchased with ${finalPremeCost} $PREME. ${burnAmount.toFixed(2)} $PREME burned.`);
            }

            premeBurn += burnAmount;
            jackpot += jackpotIncrease;
        }

        applyShopItem(item);
        updateScore();
        syncWithServer();
    } else {
        showMessage('Not enough Stars or $PREME!');
    }
}

function applyShopItem(item) {
    switch (item) {
        case 'unlock':
            // Already unlocked, no action needed (could be used for future features)
            break;
        case 'doubleJump':
            mario.hasDoubleJump = true;
            showMessage('Double Jump activated for this game!');
            break;
        case 'extraLife':
            lives++;
            showMessage('Extra life gained!');
            break;
        case 'marioSkin':
            marioSkinImg = new Image();
            marioSkinImg.src = 'mario_skin.png'; // Add your custom Mario skin image
            showMessage('Mario skin applied!');
            break;
        case 'barrelShield':
            mario.hasBarrelShield = true;
            showMessage('Barrel Shield activated for this game!');
            break;
        case 'speedBoost':
            mario.speed = 5; // Increase speed
            mario.hasSpeedBoost = true;
            showMessage('Speed Boost activated for this game!');
            setTimeout(() => { mario.speed = 3; mario.hasSpeedBoost = false; showMessage('Speed Boost expired.'); }, 30000); // 30 seconds
            break;
        case 'bonusPoints':
            score += 500;
            showMessage('Bonus 500 points added!');
            break;
        case 'paulineGift':
            score += 300;
            showMessage('Pauline’s Gift: +300 points!');
            break;
        case 'superHammer':
            mario.hasHammer = true;
            mario.hammerTime = 600; // Double duration (10 seconds)
            showMessage('Super Hammer activated for 10 seconds!');
            break;
        case 'levelSkip':
            if (level < 4) {
                level++;
                initLevel();
                showMessage(`Skipped to Level ${level}!`);
            } else {
                showMessage('Already at max level!');
            }
            break;
        case 'vipBasic':
            applyVIPEffects(3); // 3 boosts for 24 hours
            showMessage('Basic VIP activated for 24 hours!');
            break;
        case 'vipPremium':
            applyVIPEffects(24); // All boosts for 24 hours + 5000 $PREME
            premeEarned += 5000; // 50 $PREME * 100 = 5000 $PREME
            premeBurn += 50; // 1% burn of 5000 $PREME = 50 $PREME
            showMessage('Premium VIP activated for 24 hours! +5000 $PREME earned.');
            break;
        case 'jackpotTicket':
        case 'jackpotBundle':
            // No immediate gameplay effect, just tracking tickets
            showMessage(`You now have ${jackpotTickets} Jackpot Tickets!`);
            break;
    }
}

function applyVIPEffects(durationHours = 24) {
    mario.hasDoubleJump = true;
    mario.hasBarrelShield = true;
    mario.hasSpeedBoost = true;
    mario.speed = 5; // Speed boost
    showMessage('VIP effects activated for 24 hours!');
    setTimeout(() => {
        mario.hasDoubleJump = false;
        mario.hasBarrelShield = false;
        mario.hasSpeedBoost = false;
        mario.speed = 3;
        showMessage('VIP effects expired.');
    }, durationHours * 60 * 60 * 1000); // Convert hours to milliseconds
}

// Update game logic (modified for shop items)
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
            if (mario.jumping) {
                mario.dy = mario.hasDoubleJump ? -15 : -10; // Double jump height
                mario.jumping = !mario.hasDoubleJump; // Allow second jump if double jump is active
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
            barrel.x += barrel.dx;
            barrel.y += barrel.dy || 2;
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
            if (checkCollision(mario, barrel) && !mario.hasBarrelShield) {
                if (mario.hasHammer) {
                    barrels.splice(i, 1);
                    score += 100;
                    console.log('Barrel hit with hammer, +100:', score);
                } else {
                    score -= 10;
                    damageTakenThisLevel = true;
                    console.log('Barrel hit, -10:', score);
                    barrels.splice(i, 1);
                    if (score < 0) score = 0;
                }
            } else if (mario.hasBarrelShield && checkCollision(mario, barrel)) {
                barrels.splice(i, 1);
                showMessage('Barrel Shield blocked damage!');
            }
        });

        fireballs.forEach((fireball, i) => {
            fireball.x += fireball.dx;
            fireball.y += fireball.dy || 2;
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
                damageTakenThisLevel = true;
                console.log('Fireball hit, -20:', score);
                fireballs.splice(i, 1);
                if (score < 0) score = 0;
            }
        });

        conveyors.forEach(conveyor => {});
        elevators.forEach(elevator => { elevator.y += elevator.dy; if (elevator.y <= elevator.minY || elevator.y >= elevator.maxY) elevator.dy *= -1; });
        rivets.forEach((rivet, i) => {
            if (checkCollision(mario, rivet)) {
                rivet.hit = true;
                score += 50;
                console.log('Rivet collected, +50:', score);
                rivets.splice(i, 1);
                if (level === 4 && rivets.length === 0) {
                    const timerBonus = Math.floor(bonusTimer / 60) * 10;
                    score += timerBonus;
                    console.log('Level 4 done! Bonus:', timerBonus);
                    checkPerfectRun();
                    resetGame();
                }
            }
        });
        if (mario.y < pauline.y + 50 && Math.abs(mario.x - pauline.x) < pauline.width / 2 && mario.y + mario.height <= pauline.y + pauline.height) {
            if (level === 4) {
                const timerBonus = Math.floor(bonusTimer / 60) * 10;
                score += timerBonus;
                console.log('Level 4 done via Pauline! Bonus:', timerBonus);
                checkPerfectRun();
                resetGame();
            } else levelUp();
        }
        if (mario.y < pauline.y + mario.height && mario.y + mario.height > pauline.y && Math.abs(mario.x - pauline.x) > pauline.width / 2) {}
        if (mario.hasHammer) { mario.hammerTime--; if (mario.hammerTime <= 0) mario.hasHammer = false; }
        hammers.forEach(hammer => {
            if (!hammer.taken && checkCollision(mario, hammer)) {
                hammer.taken = true;
                mario.hasHammer = true;
                mario.hammerTime = 300;
                score += 75;
                console.log('Hammer collected, +75:', score);
            }
        });
        updateScore();
    } catch (error) {
        console.error('Update error:', error);
    }
}

// Controls
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
                stars = gameData.stars || stars;
                hasFirstBuyDoubleStars = gameData.hasFirstBuyDoubleStars !== undefined ? gameData.hasFirstBuyDoubleStars : hasFirstBuyDoubleStars;
                jackpotTickets = gameData.jackpotTickets || jackpotTickets;
                updateScore();
            }
        });
        setInterval(syncWithServer, 300000);
    }
}

// Draw Mario with potential skin
function drawMario() {
    if (marioSkinImg && marioSkinImg.complete) {
        ctx.drawImage(marioSkinImg, mario.x, mario.y, mario.width, mario.height);
    } else if (mario.image.complete) {
        ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(mario.x, mario.y, mario.width, mario.height);
        console.log('Mario image not loaded, using fallback:', mario.image.src);
    }
}

// Modified draw function to use custom Mario drawing
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
        drawMario(); // Use custom Mario drawing function
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

// Start game
loadAssets();
initLevel();
setInterval(update, 1000 / 60);
draw();
handleTelegramData();
