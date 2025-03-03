// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game world scaling
const scaleFactor = 1.15; // 15% increase
const originalWidth = 800; // Assuming canvas width from index.html
const originalHeight = 600; // Assuming canvas height from index.html
const gameWidth = originalWidth * scaleFactor; // Scaled game world width
const gameHeight = originalHeight * scaleFactor; // Scaled game world height

// Player object
const player = {
    x: 50 * scaleFactor,         // Starting position scaled
    y: (gameHeight - 50) * scaleFactor, // Near bottom, scaled
    width: 40 * scaleFactor,     // Scaled size
    height: 40 * scaleFactor,
    dx: 0,                       // Horizontal velocity
    dy: 0,                       // Vertical velocity (for jumping)
    speed: 5 * scaleFactor,      // Scaled movement speed
    jumpStrength: -15 * scaleFactor // Scaled jump height
};

// Platforms array
const platforms = [
    { x: 0, y: gameHeight - 40 * scaleFactor, width: gameWidth, height: 40 * scaleFactor }, // Ground
    { x: 200 * scaleFactor, y: 400 * scaleFactor, width: 150 * scaleFactor, height: 20 * scaleFactor }, // Platform 1
    { x: 400 * scaleFactor, y: 300 * scaleFactor, width: 150 * scaleFactor, height: 20 * scaleFactor }  // Platform 2
];

// Game constants
const gravity = 0.5 * scaleFactor;
const friction = 0.8;

// Keyboard controls
const keys = { right: false, left: false, up: false };

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowUp') keys.up = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowUp') keys.up = false;
});

// Update game state
function update() {
    // Apply gravity
    player.dy += gravity;
    player.y += player.dy;
    player.x += player.dx;

    // Horizontal movement
    if (keys.right) player.dx = player.speed;
    else if (keys.left) player.dx = -player.speed;
    else player.dx *= friction;

    // Jumping
    if (keys.up && player.dy === 0) { // Only jump when on ground
        player.dy = player.jumpStrength;
    }

    // Collision with platforms
    platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y + player.height - player.dy <= platform.y) {
            player.y = platform.y - player.height;
            player.dy = 0; // Stop falling
        }
    });

    // Keep player in bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > gameWidth) player.x = gameWidth - player.width;
    if (player.y > gameHeight - player.height) {
        player.y = gameHeight - player.height;
        player.dy = 0;
    }
}

// Render game
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player (scaled to canvas coordinates)
    ctx.fillStyle = 'red';
    ctx.fillRect(
        player.x / scaleFactor, // Scale back for rendering
        player.y / scaleFactor,
        player.width / scaleFactor,
        player.height / scaleFactor
    );

    // Draw platforms
    ctx.fillStyle = 'green';
    platforms.forEach(platform => {
        ctx.fillRect(
            platform.x / scaleFactor,
            platform.y / scaleFactor,
            platform.width / scaleFactor,
            platform.height / scaleFactor
        );
    });
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
