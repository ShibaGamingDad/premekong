const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Debug canvas setup
if (!canvas) {
    console.error('Canvas not found! Check index.html for <canvas id="gameCanvas">');
} else {
    console.log('Canvas found, setting size:', 672, 'x', 768);
    canvas.width = 672; // Match your HTML's width
    canvas.height = 768; // Match your HTML's height
    console.log('Actual canvas size after setting:', canvas.width, 'x', canvas.height);
    if (canvas.width !== 672 || canvas.height !== 768) {
        console.warn('Canvas size mismatch! Expected 672x768, got', canvas.width, 'x', canvas.height);
    }
}

let mario = { x: 50, y: canvas.height - 100 - 32, width: 32, height: 32, dx: 0, dy: 0, jumping: false, onLadder: false };
let premekong = { x: 50, y: canvas.height - 400 - 64, width: 64, height: 64, dropping: true }; // Enable dropping to throw barrels
let pauline = { x: 150, y: canvas.height - 400 - 32, width: 32, height: 32, image: null }; // Pauline stays on top platform, slightly right
let barrels = [];
let score = 0;
let level = 1;
let rivets = [];
let ladders = [];
let platforms = [];
let gameActive = true;
let gameOver = false; // New state for ending turns

// Load images with fallbacks and debug
function loadImages() {
    console.log('Loading images...');
    try {
        mario.image = new Image();
        mario.image.src = 'mario.png';
        mario.image.onload = () => console.log('Mario image loaded at:', mario.image.src, 'Dimensions:', mario.image.width, 'x', mario.image.height);
        mario.image.onerror = () => { console.error('Mario image failed to load at:', mario.image.src); mario.image = null; };

        premekong.image = new Image();
        premekong.image.src = 'premekong.png';
        premekong.image.onload = () => console.log('Preme Kong image loaded at:', premekong.image.src, 'Dimensions:', premekong.image.width, 'x', premekong.image.height);
        premekong.image.onerror = () => { console.error('Preme Kong image failed to load at:', premekong.image.src); premekong.image = null; };

        pauline.image = new Image();
        pauline.image.src = 'pauline.png'; // Assume you have a Pauline image; use fallback if not
        pauline.image.onload = () => console.log('Pauline image loaded at:', pauline.image.src, 'Dimensions:', pauline.image.width, 'x', pauline.image.height);
        pauline.image.onerror = () => { console.error('Pauline image failed to load at:', pauline.image.src); pauline.image = null; };

        const barrelImg = new Image();
        barrelImg.src = 'barrel.png';
        barrelImg.onload = () => console.log('Barrel image loaded at:', barrelImg.src, 'Dimensions:', barrelImg.width, 'x', barrelImg.height);
        barrelImg.onerror = () => console.error('Barrel image failed to load at:', barrelImg.src);

        const ladderImg = new Image();
        ladderImg.src = 'ladder.png';
        ladderImg.onload = () => console.log('Ladder image loaded at:', ladderImg.src, 'Dimensions:', ladderImg.width, 'x', ladderImg.height);
        ladderImg.onerror = () => { console.error('Ladder image failed to load at:', ladderImg.src); ladderImg.width = 50; ladderImg.height = 100; }; // Fallback size

        const platformImg = new Image();
        platformImg.src = 'platform.png';
        platformImg.onload = () => console.log('Platform image loaded at:', platformImg.src, 'Dimensions:', platformImg.width, 'x', platformImg.height);
        platformImg.onerror = () => { console.error('Platform image failed to load at:', platformImg.src); platformImg.width = canvas.width; platformImg.height = 20; }; // Fallback size

        const rivetImg = new Image();
        rivetImg.src = 'rivet.png';
        rivetImg.onload = () => console.log('Rivet image loaded at:', rivetImg.src, 'Dimensions:', rivetImg.width, 'x', rivetImg.height);
        rivetImg.onerror = () => console.error('Rivet image failed to load at:', rivetImg.src);

        platforms.forEach(platform => platform.image = platformImg || null);
        ladders.forEach(ladder => ladder.image = ladderImg || null);
        rivets.forEach(rivet => rivet.image = rivetImg || null);
        barrels.forEach(barrel => barrel.image = barrelImg || null);
    } catch (error) {
        console.error('Error in loadImages:', error);
    }
}

// Initialize levels with all elements, adjusted for better platform alignment
function initLevel() {
    console.log('Initializing level with canvas size:', canvas.width, 'x', canvas.height);
    try {
        platforms = [];
        ladders = [];
        rivets = [];
        const platformY = [canvas.height - 100, canvas.height - 200, canvas.height - 300, canvas.height - 400];
        for (let i = 0; i < 4; i++) {
            platforms.push({ x: 0, y: platformY[i], width: canvas.width, height: 20, image: null });
            ladders.push({ x: 300, y: platformY[i] - 50, width: 50, height: 100, image: null });
            for (let j = 0; j < 5; j++) {
                rivets.push({ x: 100 + j * 100, y: platformY[i] + 10, width: 10, height: 10, hit: false, image: null }); // Adjusted rivet size
            }
        }
        mario.y = canvas.height - 100 - mario.height; // Start Mario on the bottom platform
        mario.x = 50; // Ensure Mario starts on the left
        premekong.y = canvas.height - 400 - premekong.height; // Keep Preme Kong static on top left platform
        premekong.x = 50; // Keep Preme Kong on left side
        pauline.y = canvas.height - 400 - pauline.height; // Keep Pauline on top platform
        pauline.x = 150; // Pauline stays slightly to the right
        console.log('Preme Kong position before draw:', premekong.x, premekong.y);
        console.log('Pauline position before draw:', pauline.x, pauline.y);
        barrels = [];
        score = 0;
        gameOver = false; // Reset game state
        updateScore();
    } catch (error) {
        console.error('Error in initLevel:', error);
    }
}

// Draw game elements with debug, including Pauline, wrapped in try/catch
function draw() {
    if (!gameActive || gameOver) return; // Stop drawing if game is over
    console.log('Drawing frame, Mario at:', mario.x, mario.y, 'Preme Kong at:', premekong.x, premekong.y
