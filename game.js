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
        newWidth = Math.min(window.innerWidth * 0.98, maxWidth); // Use 98% of Telegram width
        newHeight = Math.min(window.innerHeight * 0.95, maxHeight);
        if (newHeight / aspectRatio < newWidth) {
            newHeight = newWidth * aspectRatio;
        } else if (newWidth / aspectRatio < newHeight) {
            newWidth = newHeight / aspectRatio;
        }
        if (newHeight < 650) {
            newHeight = 650;
            newWidth = Math.min(newHeight / aspectRatio, maxWidth);
        }
    } else {
        newWidth = Math.min(window.innerWidth * 0.5, maxWidth);
        newHeight = newWidth / aspectRatio;
        if (newHeight > window.innerHeight * 0.45) {
            newHeight = window.innerHeight * 0.45;
            newWidth = newHeight * aspectRatio;
        }
    }

    canvas.width = Math.floor(newWidth);
    canvas.height = Math.floor(newHeight);
    console.log('Canvas size:', canvas.width, 'x', canvas.height);

    return { canvas, ctx };
}

function loadImages() {
    const images = {
        mario: new Image(), premekong: new Image(), pauline: new Image(), hammer: new Image(),
        barrel: new Image(), ladder: new Image(), platform: new Image(), rivet: new Image(),
        bg1: new Image(), bg2: new Image(), bg3: new Image(), bg4: new Image()
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
    images.bg4.src = 'background4.png';

    return Promise.all(
        Object.entries(images).map(([key, img]) =>
            new Promise((resolve) => {
                img.onload = () => {
                    console.log(`${key} loaded successfully`);
                    resolve(img);
                };
                img.onerror = () => {
                    console.error(`${key} failed to load. Check file path or format.`);
                    resolve({
                        width: key === 'mario' ? 32 : key === 'premekong' ? 64 : key === 'pauline' ? 32 : key === 'hammer' ? 32 : key === 'barrel' ? 32 : key === 'ladder' ? 50 : key === 'platform' ? 672 : key === 'rivet' ? 20 : 672,
                        height: key === 'mario' ? 32 : key === 'premekong' ? 64 : key === 'pauline' ? 32 : key === 'hammer' ? 32 : key === 'barrel' ? 32 : key === 'ladder' ? 180 : key === 'platform' ? 20 : key === 'rivet' ? 20 : 768
                    });
                };
            })
        )
    ).then(loaded => ({
        mario: loaded[0], premekong: loaded[1], pauline: loaded[2], hammer: loaded[3],
        barrel: loaded[4], ladder: loaded[5], platform: loaded[6], rivet: loaded[7],
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

    if (level === 1) {
        platforms = [
            { x: 0, y: canvas.height - 50, width: 200, height: 20, image: images.platform },
            { x: 472, y: canvas.height - 50, width: 200, height: 20, image: images.platform },
            { x: 0, y: canvas.height - 250, width: 336, height: 20, image: images.platform },
            { x: 336, y: canvas.height - 250, width: 336, height: 20, image: images.platform },
            { x: 0, startY: canvas.height - 600, width: canvas.width, height: 20, slope: 0.1, image: images.platform }
        ];
        ladders = [
            { x: 180, y: canvas.height - 230, width: 50, height: 180, image: images.ladder },
            { x: 452, y: canvas.height - 230, width: 50, height: 180, image: images.ladder },
            { x: 316, y: canvas.height - 580, width: 50, height: 180, image: images.ladder }
        ];
        rivets = [
            { x: 50, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 150, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 522, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 622, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 50, y: canvas.height - 270, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 150, y: canvas.height - 270, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 586, y: canvas.height - 270, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 686, y: canvas.height - 270, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 50, y: getPlatformY(platforms[4], 50) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 150, y: getPlatformY(platforms[4], 150) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 522, y: getPlatformY(platforms[4], 522) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 622, y: getPlatformY(platforms[4], 622) - 20, width: 20, height: 20, hit: false, image: images.rivet }
        ];
    } else if (level === 2) {
        platforms = [
            { x: 0, y: canvas.height - 50, width: 300, height: 20, image: images.platform },
            { x: 372, y: canvas.height - 50, width: 300, height: 20, image: images.platform },
            { x: 0, y: canvas.height - 300, width: 200, height: 20, image: images.platform },
            { x: 472, y: canvas.height - 300, width: 200, height: 20, image: images.platform },
            { x: 0, startY: canvas.height - 600, width: canvas.width, height: 20, slope: 0.1, image: images.platform }
        ];
        ladders = [
            { x: 260, y: canvas.height - 30, width: 50, height: 180, image: images.ladder },
            { x: 632, y: canvas.height - 280, width: 50, height: 180, image: images.ladder },
            { x: 50, y: canvas.height - 580, width: 50, height: 180, image: images.ladder },
            { x: 622, y: canvas.height - 580, width: 50, height: 180, image: images.ladder }
        ];
        rivets = [
            { x: 50, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 150, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 422, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 522, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 50, y: canvas.height - 320, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 150, y: canvas.height - 320, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 522, y: canvas.height - 320, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 622, y: canvas.height - 320, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 50, y: getPlatformY(platforms[4], 50) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 150, y: getPlatformY(platforms[4], 150) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 522, y: getPlatformY(platforms[4], 522) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 622, y: getPlatformY(platforms[4], 622) - 20, width: 20, height: 20, hit: false, image: images.rivet }
        ];
    } else if (level === 3) {
        platforms = [
            { x: 0, y: canvas.height - 50, width: 250, height: 20, image: images.platform },
            { x: 422, y: canvas.height - 50, width: 250, height: 20, image: images.platform },
            { x: 0, startY: canvas.height - 300, width: 336, height: 20, slope: 0.1, image: images.platform },
            { x: 336, y: canvas.height - 300, width: 336, height: 20, image: images.platform },
            { x: 0, startY: canvas.height - 600, width: canvas.width, height: 20, slope: 0.1, image: images.platform }
        ];
        ladders = [
            { x: 220, y: canvas.height - 30, width: 50, height: 180, image: images.ladder },
            { x: 602, y: canvas.height - 280, width: 50, height: 180, image: images.ladder },
            { x: 316, y: canvas.height - 580, width: 50, height: 180, image: images.ladder }
        ];
        rivets = [
            { x: 50, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 150, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 472, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 572, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 50, y: getPlatformY(platforms[2], 50) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 150, y: getPlatformY(platforms[2], 150) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 586, y: canvas.height - 320, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 686, y: canvas.height - 320, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 50, y: getPlatformY(platforms[4], 50) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 150, y: getPlatformY(platforms[4], 150) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 522, y: getPlatformY(platforms[4], 522) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 622, y: getPlatformY(platforms[4], 622) - 20, width: 20, height: 20, hit: false, image: images.rivet }
        ];
    } else if (level === 4) {
        platforms = [
            { x: 0, y: canvas.height - 50, width: 200, height: 20, image: images.platform },
            { x: 472, y: canvas.height - 50, width: 200, height: 20, image: images.platform },
            { x: 0, startY: canvas.height - 300, width: 336, height: 20, slope: 0.1, image: images.platform },
            { x: 336, startY: canvas.height - 300, width: 336, height: 20, slope: -0.1, image: images.platform },
            { x: 0, startY: canvas.height - 600, width: canvas.width, height: 20, slope: 0.1, image: images.platform }
        ];
        ladders = [
            { x: 180, y: canvas.height - 30, width: 50, height: 180, image: images.ladder },
            { x: 652, y: canvas.height - 280, width: 50, height: 180, image: images.ladder },
            { x: 316, y: canvas.height - 580, width: 50, height: 180, image: images.ladder },
            { x: 50, y: canvas.height - 580, width: 50, height: 180, image: images.ladder }
        ];
        rivets = [
            { x: 50, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 150, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 522, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 622, y: canvas.height - 70, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 50, y: getPlatformY(platforms[2], 50) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 150, y: getPlatformY(platforms[2], 150) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 586, y: getPlatformY(platforms[3], 586) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 686, y: getPlatformY(platforms[3], 686) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 50, y: getPlatformY(platforms[4], 50) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 150, y: getPlatformY(platforms[4], 150) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 522, y: getPlatformY(platforms[4], 522) - 20, width: 20, height: 20, hit: false, image: images.rivet },
            { x: 622, y: getPlatformY(platforms[4], 622) - 20, width: 20, height: 20, hit: false, image: images.rivet }
        ];
    }

    mario = { x: 50, y: platforms[0].y - 32, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false, hammer: false, hammerTime: 0, image: images.mario };
    premekong = { x: 50, y: getPlatformY(platforms[platforms.length - 1], 50) - 64, width: 64, height: 64, bounce: 0, throwing: false, image: images.premekong };
    pauline = { x: canvas.width - 82, y: getPlatformY(platforms[platforms.length - 1], canvas.width - 82) - 32, width: 32, height: 32, image: images.pauline };
    hammer = { x: canvas.width / 2, y: platforms[1].y - 32, width: 32, height: 32, active: true, image: images.hammer };
    barrels = [];
    score = 0;
    preme = 0;
    gameOver = false;
    updateScore();
}

function draw(ctx, canvas) {
    if (!gameActive || gameOver || !ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bg = images.backgrounds[(level - 1) % 4];
    if (bg && bg.complete) {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        console.error('Background image failed to load for level', level);
    }

    platforms.forEach(p => {
        if (p.image && p.image.complete) {
            if (p.hasOwnProperty('slope')) {
                ctx.drawImage(p.image, p.x, p.startY, p.width, p.height);
            } else {
                ctx.drawImage(p.image, p.x, p.y, p.width, p.height);
            }
        } else {
            ctx.fillStyle = 'red';
            if (p.hasOwnProperty('slope')) {
                ctx.fillRect(p.x, p.startY, p.width, p.height);
            } else {
                ctx.fillRect(p.x, p.y, p.width, p.height);
            }
        }
    });

    ladders.forEach(l => {
        if (l.image && l.image.complete) {
            ctx.drawImage(l.image, l.x, l.y, l.width, l.height);
        } else {
            ctx.fillStyle = 'brown';
            ctx.fillRect(l.x, l.y, l.width, l.height);
        }
    });

    rivets.forEach(r => {
        if (!r.hit) {
            if (r.image && r.image.complete) {
                ctx.drawImage(r.image, r.x, r.y, r.width, r.height);
            } else {
                ctx.fillStyle = 'gray';
                ctx.fillRect(r.x, r.y, r.width, r.height);
            }
        }
    });

    // Fixed: Changed ctx.drawImages to ctx.drawImage
    if (mario.image && mario.image.complete) {
        ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
    } else {
        ctx.fillStyle = 'white';
        ctx.fillRect(mario.x, mario.y, mario.width, mario.height);
        console.error('Mario image not loaded');
    }

    if (premekong.image && premekong.image.complete) {
        ctx.drawImage(premekong.image, premekong.x, premekong.y + premekong.bounce, premekong.width, premekong.height);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(premekong.x, premekong.y, premekong.width, premekong.height);
    }

    if (pauline.image && pauline.image.complete) {
        ctx.drawImage(pauline.image, pauline.x, pauline.y, pauline.width, pauline.height);
    } else {
        ctx.fillStyle = 'pink';
        ctx.fillRect(pauline.x, pauline.y, pauline.width, pauline.height);
    }

    barrels.forEach(b => {
        if (b.image && b.image.complete) {
            ctx.drawImage(b.image, b.x, b.y, 32, 32);
        } else {
            ctx.fillStyle = 'brown';
            ctx.fillRect(b.x, b.y, 32, 32);
        }
    });

    if (hammer.active && hammer.image && hammer.image.complete) {
        ctx.drawImage(hammer.image, hammer.x, hammer.y, hammer.width, hammer.height);
    } else if (hammer.active) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(hammer.x, hammer.y, hammer.width, hammer.height);
    }
}

function update(canvas) {
    if (!gameActive || gameOver || !canvas) return;

    mario.x += mario.dx * 3;
    if (mario.onLadder) mario.y += mario.dy * 3;
    if (mario.jumping) {
        mario.y += mario.dy;
        mario.dy += 0.3;
        if (mario.dy > 0 && mario.y >= mario.groundY) {
            mario.y = mario.groundY;
            mario.jumping = false;
            mario.dy = 0;
        }
    } else if (!mario.onLadder) {
        mario.dy += 0.3;
        mario.y += mario.dy;
    }
    mario.x = Math.max(0, Math.min(mario.x, canvas.width - mario.width));
    mario.y = Math.max(0, Math.min(mario.y, canvas.height - mario.height));
    let onPlatform = false;
    let onLadder = ladders.some(l => checkCollision(mario, l));
    let currentPlatform = null;
    platforms.forEach(p => {
        let platformY = p.y;
        if (p.hasOwnProperty('slope')) {
            platformY = getPlatformY(p, mario.x + mario.width / 2);
        }
        if (checkCollision(mario, p) && mario.y + mario.height <= platformY + p.height / 2) {
            mario.y = platformY - mario.height;
            mario.dy = 0;
            mario.jumping = false;
            mario.groundY = mario.y;
            onPlatform = true;
            currentPlatform = p;
            if (p.hasOwnProperty('slope') && mario.dx > 0) {
                mario.y += p.slope * mario.dx * 3;
                mario.groundY = mario.y;
            }
        }
    });
    if (!onPlatform && !onLadder && mario.y >= canvas.height - mario.height) {
        mario.y = canvas.height - mario.height;
        mario.dy = 0;
        mario.groundY = mario.y;
    }
    mario.onLadder = onLadder && (mario.dy !== 0 || (onPlatform && (!currentPlatform || mario.y + mario.height > (currentPlatform.hasOwnProperty('slope') ? getPlatformY(currentPlatform, mario.x + mario.width / 2) : currentPlatform.y) - 5)));

    if (hammer.active && checkCollision(mario, hammer)) {
        mario.hammer = true;
        mario.hammerTime = 5000;
        hammer.active = false;
    }
    if (mario.hammer) {
        mario.hammerTime -= 16;
        if (mario.hammerTime <= 0) mario.hammer = false;
    }

    premekong.bounce = Math.sin(Date.now() / 200) * 10;
    if (Math.random() < 0.02 * level) {
        barrels.push({
            x: premekong.x + premekong.width, y: premekong.y, dx: 2, dy: 0, image: images.barrel, type: 'thrown'
        });
    }
    if (Math.random() < 0.01 * level) {
        const topPlatform = platforms[platforms.length - 1];
        const topPlatformY = topPlatform.hasOwnProperty('slope') ? getPlatformY(topPlatform, premekong.x) : topPlatform.y;
        barrels.push({
            x: premekong.x, y: topPlatformY, dx: 2, dy: 0, image: images.barrel, type: 'rolling'
        });
    }

    barrels.forEach((b, i) => {
        if (b.type === 'thrown') {
            b.x += b.dx;
            b.y += b.dy;
            b.dy += 0.3;
        } else if (b.type === 'rolling') {
            b.x += b.dx;
            let onPlatform = false;
            platforms.forEach(p => {
                let platformY = p.y;
                if (p.hasOwnProperty('slope')) {
                    platformY = getPlatformY(p, b.x + 16);
                }
                if (b.x + 32 > p.x && b.x < p.x + p.width && b.y + 32 <= platformY + p.height / 2) {
                    b.y = platformY - 32;
                    b.dy = 0;
                    onPlatform = true;
                    if (p.hasOwnProperty('slope')) {
                        b.y += p.slope * b.dx;
                    }
                }
            });
            b.dx = 2;
            if (!onPlatform) {
                b.dy += 0.3;
                b.y += b.dy;
                b.dx = 0;
            }
            ladders.forEach(l => {
                if (checkCollision(b, l) && b.dy >= 0) {
                    b.dy = 0.5;
                    b.y += b.dy;
                    b.dx = 0;
                }
            });
            platforms.forEach(p => {
                let platformY = p.y;
                if (p.hasOwnProperty('slope')) {
                    platformY = getPlatformY(p, b.x + 16);
                }
                if (checkCollision(b, p) && b.dy > 0 && b.y + 32 <= platformY + p.height / 2) {
                    b.y = platformY - 32;
                    b.dy = 0;
                    b.dx = 2;
                    b.type = 'rolling';
                    if (p.hasOwnProperty('slope')) {
                        b.y += p.slope * b.dx;
                    }
                }
            });
        }

        if (b.x < -32 || b.x > canvas.width || b.y > canvas.height) barrels.splice(i, 1);
        else if (checkCollision(mario, b)) {
            if (mario.hammer) { score += 300; barrels.splice(i, 1); }
            else { gameOver = true; restartGame(); }
        }
        if (!mario.onLadder && !mario.jumping && mario.y + mario.height < b.y - 35 && Math.abs(mario.x + mario.width / 2 - b.x - 16) < 16) {
            score += 100;
            barrels.splice(i, 1);
        }
    });

    rivets.forEach(r => {
        if (!r.hit && checkCollision(mario, r)) {
            r.hit = true;
            score += 50;
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
        levelUp();
        mario.x = 50;
        mario.y = platforms[0].y - 32;
        premekong.x = 50;
        premekong.y = getPlatformY(platforms[platforms.length - 1], 50) - 64;
        pauline.x = canvas.width - 82;
        pauline.y = getPlatformY(platforms[platforms.length - 1], canvas.width - 82) - 32;
        rivets.forEach(r => r.hit = false);
        barrels = [];
        updateScore();
    }

    updateScore();
}

function getPlatformY(platform, x) {
    if (platform.hasOwnProperty('slope')) {
        const slope = platform.slope || 0;
        const relativeX = x - platform.x;
        return platform.startY + (relativeX * slope);
    }
    return platform.y;
}

function checkCollision(obj1, obj2) {
    if (!obj1 || !obj2) return false;
    let platformY = obj2.y;
    if (obj2.hasOwnProperty('slope')) {
        platformY = getPlatformY(obj2, obj1.x + obj1.width / 2);
    }
    return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x &&
           obj1.y < platformY + obj2.height / 2 && obj1.y + obj1.height > platformY - obj2.height / 2;
}

function levelUp() {
    level++;
    if (level > 4) level = 1;
    const { canvas } = initializeGame();
    initLevel();
    score += 100;
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
            if (!e.cancelable || e.defaultPrevented) return;
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
