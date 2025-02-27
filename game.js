const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Debug canvas setup
if (!canvas) {
    console.error('Canvas not found! Check index.html for <canvas id="gameCanvas">');
} else {
    console.log('Canvas found, setting size:', 672, 'x', 768);
    canvas.width = 672;
    canvas.height = 768;
}

let mario = { x: 50, y: 700, width: 32, height: 32 }; // Start near bottom
let gameActive = true;

// Draw a simple white box (Mario) and debug
function draw() {
    if (!gameActive) return;
    console.log('Drawing frame, Mario at:', mario.x, mario.y);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(mario.x, mario.y, mario.width, mario.height);
    requestAnimationFrame(draw);
}

// Touch controls for mobile
function setupTouchControls() {
    const buttons = {
        left: document.querySelector('#left'),
        right: document.querySelector('#right'),
        jump: document.querySelector('#jump')
    };

    buttons.left.addEventListener('touchstart', () => mario.x -= 5);
    buttons.right.addEventListener('touchstart', () => mario.x += 5);
    buttons.jump.addEventListener('touchstart', () => mario.y -= 50); // Simple jump

    buttons.left.addEventListener('touchend', () => {});
    buttons.right.addEventListener('touchend', () => {});
    buttons.jump.addEventListener('touchend', () => {});
}

// Game loop
function gameLoop() {
    if (!gameActive) return;
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize and start game
setupTouchControls();
gameLoop();
