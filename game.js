const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

if (!canvas) console.error('Canvas not found!');
else {
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
    mario.image = new Image(); mario.image.src = 'mario.png'; mario.image.onerror = () => mario.image = null;
    premekong.image = new Image(); premekong.image.src = 'premekong.png'; premekong.image.onerror = () => premekong.image = null;
    pauline.image = new Image(); pauline.image.src = 'pauline.png'; pauline.image.onerror = () => pauline.image = null;
    hammer.image = new Image(); hammer.image.src = 'hammer.png'; hammer.image.onerror = () => hammer.image = null;
    const barrelImg = new Image(); barrelImg.src = 'barrel.png'; barrelImg.onerror = () => console.error('Barrel image failed');
    const ladderImg = new Image(); ladderImg.src = 'ladder.png'; ladderImg.onerror = () => { ladderImg.width = 50; ladderImg.height = 100; };
    const platformImg = new Image(); platformImg.src = 'platform.png'; platformImg.onerror = () => { platformImg.width = canvas.width; platformImg.height = 20; };
    const rivetImg = new Image(); rivetImg.src = 'rivet.png'; rivetImg.onerror = () => console.error('Rivet image failed');
    platforms.forEach(p => p.image = platformImg || null);
    ladders.forEach(l => l.image = ladderImg || null);
    rivets.forEach(r => r.image = rivetImg || null);
    barrels.forEach(b => b.image = barrelImg || null);
}

function initLevel() {
    console.log('Initializing level:', level);
    platforms = [];
    ladders = [];
    rivets = [];
    const baseY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400]; // Platform y-positions
    for (let i = 0; i < 4; i++) {
        platforms.push({ x: 0, y: baseY[i], width: canvas.width, height: 20, slope: -20, image: null });
        for (let j = 0; j < 5; j++) {
            rivets.push({ x: 100 + j * 100, y: baseY[i] - 10 + (j * -5), width: 10, height: 10, hit: false, image: null });
        }
    }
    // Ladders positioned to start at the top of each platform and extend downward 100px
    // First ladder (top of first platform, y: 668, extends to y: 768)
    ladders.push({ x: 506, y: baseY[0] - 100, width: 50, height: 100, image: null }); // y: 568 (extends down to 668)
    // Second ladder (top of second platform, y: 568, extends to y: 668)
    ladders.push({ x: 94, y: baseY[1] - 100, width: 50, height: 100, image: null }); // y: 468 (extends down to 568)
    // Third ladder (top of third platform, y: 468, extends to y: 568)
    ladders.push({ x: 506, y: baseY[2] - 100, width: 50, height: 100, image: null }); // y: 368 (extends down to 468)

    mario = { x: 50, y: canvas.height - 68, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false, hammer: false, hammerTime: 0, image: mario.image };
    premekong.y = canvas.height - 400 - premekong.height;
    premekong.x = 50;
    pauline.y = canvas.height - 400 - pauline.height;
    pauline.x = 150;
    hammer = { x: 300, y: canvas.height - 200 - 32, width: 32, height: 32, active: true, image: hammer.image };
    barrels = [];
    score = 0;
    preme = 0;
    gameOver = false;
    updateScore();
}

function draw() {
    if (!gameActive || gameOver) return;
    console.log('Drawing frame...');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sloped platforms
    ctx.fillStyle = 'red';
    platforms.forEach(p => {
        if (p.image && p.image.complete) {
            ctx.drawImage(p.image, p.x, p.y, p.width, p.height);
        } else {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.width, p.y + p.slope);
            ctx.lineTo(p.x + p.width, p.y + p.slope + p.height);
            ctx.lineTo(p.x, p.y + p.height);
            ctx.closePath();
            ctx.fill();
        }
    });

    // Draw ladders
    console.log('Drawing ladders, count:', ladders.length);
    ctx.fillStyle = 'brown';
    ladders.forEach(l => {
        if (l.image && l.image.complete) {
            console.log('Drawing ladder at:', l.x, l.y, 'Dimensions:', l.image.width, 'x', l.image.height);
            ctx.drawImage(l.image, l.x, l.y, l.width, l.height);
        } else {
            console.log('Drawing ladder fallback at:', l.x, l.y);
            ctx.fillRect(l.x, l.y, l.width, l.height);
        }
    });

    // Draw rivets, Mario, Preme Kong, Pauline, barrels, hammer (unchanged logic, just reordered)
    ctx.fillStyle = 'gray';
    rivets.forEach(r => !r.hit && (r.image && r.image.complete ? ctx.drawImage(r.image, r.x, r.y, r.width, r.height) : ctx.fillRect(r.x, r.y, r.width, r.height)));
    if (mario.image && mario.image.complete) ctx.drawImage(mario.image, mario.x, mario.y, mario.width, mario.height);
    else { ctx.fillStyle = 'white'; ctx.fillRect(mario.x, mario.y, mario.width, mario.height); }
    if (premekong.image && premekong.image.complete) ctx.drawImage(premekong.image, premekong.x, premekong.y, premekong.width, premekong.height);
    else { ctx.fillStyle = 'blue'; ctx.fillRect(premekong.x, premekong.y, premekong.width, premekong.height); }
    if (pauline.image && pauline.image.complete) ctx.drawImage(pauline.image, pauline.x, pauline.y, pauline.width, pauline.height);
    else { ctx.fillStyle = 'pink'; ctx.fillRect(pauline.x, pauline.y, pauline.width, pauline.height); }
    ctx.fillStyle = 'brown';
    barrels.forEach(b => b.image && b.image.complete ? ctx.drawImage(b.image, b.x, b.y, 32, 32) : ctx.fillRect(b.x, b.y, 32, 32));

    // Draw hammer
    if (hammer.active) {
        if (hammer.image && hammer.image.complete) ctx.drawImage(hammer.image, hammer.x, hammer.y, hammer.width, hammer.height);
        else { ctx.fillStyle = 'yellow'; ctx.fillRect(hammer.x, hammer.y, hammer.width, hammer.height); }
    }
}

function update() {
    if (!gameActive || gameOver) return;
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
    let onPlatform = false;
    platforms.forEach(p => {
        const platformY = p.y + (mario.x / canvas.width) * p.slope; // Adjust for slope
        if (checkCollision(mario, p) && mario.y + mario.height <= platformY + 5) {
            mario.y = platformY - mario.height;
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
        mario.hammerTime = 5000
