// Preme Kong Game - Updated March 01, 2025

let gameActive = true;
let gameOver = false;
let level = 1;
let score = 0;
let preme = 0;
let perfectRunsToday = 0;

// Check if Box2D is defined
if (typeof Box2D === 'undefined') {
    console.error('Box2D is not defined. Please ensure the Box2D.js library is loaded.');
    gameActive = false;
    alert('Error: Physics engine (Box2D) is not loaded. Check your internet connection or local files.');
} else {
    // Box2D setup
    const b2Vec2 = Box2D.Common.Math.b2Vec2;
    const b2BodyDef = Box2D.Dynamics.b2BodyDef;
    const b2Body = Box2D.Dynamics.b2Body;
    const b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
    const b2World = Box2D.Dynamics.b2World;
    const b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
    const b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
    const b2ContactListener = Box2D.Dynamics.b2ContactListener;

    // Create physics world with gravity (downward, 9.8 m/s² scaled to pixels)
    const world = new b2World(new b2Vec2(0, 9.8), true);

    // Scale factor for Box2D (pixels to meters)
    const SCALE = 30; // 30 pixels = 1 meter

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

        const maxWidth = 672;
        const maxHeight = 768;
        const aspectRatio = maxWidth / maxHeight;
        let newWidth, newHeight;

        const isTelegram = window.Telegram?.WebApp;
        if (isTelegram) {
            Telegram.WebApp.expand();
            newWidth = Math.min(window.innerWidth * 0.98, maxWidth);
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

    let marioBody, premekongBody, paulineBody, hammerBody, barrels = [], platforms = [], ladders = [], rivets = [];
    let images;

    function createBody(x, y, type, width, height, isSensor = false) {
        const bodyDef = new b2BodyDef();
        bodyDef.type = type;
        bodyDef.position.Set(x / SCALE, y / SCALE);
        const body = world.CreateBody(bodyDef);

        const fixtureDef = new b2FixtureDef();
        fixtureDef.shape = new b2PolygonShape();
        fixtureDef.shape.SetAsBox((width / 2) / SCALE, (height / 2) / SCALE);
        fixtureDef.isSensor = isSensor; // For ladders and triggers
        body.CreateFixture(fixtureDef);

        return body;
    }

    function initLevel() {
        const { canvas } = initializeGame();
        if (!canvas || !images) {
            console.error('Canvas or images not initialized!');
            return;
        }

        const h = canvas.height;
        const w = canvas.width;

        // Clear existing bodies
        world.ClearForces();
        if (marioBody) world.DestroyBody(marioBody);
        if (premekongBody) world.DestroyBody(premekongBody);
        if (paulineBody) world.DestroyBody(paulineBody);
        if (hammerBody) world.DestroyBody(hammerBody);
        barrels.forEach(b => world.DestroyBody(b.body));
        barrels = [];
        platforms.forEach(p => world.DestroyBody(p.body));
        platforms = [];
        ladders.forEach(l => world.DestroyBody(l.body));
        ladders = [];
        rivets.forEach(r => world.DestroyBody(r.body));
        rivets = [];

        if (level === 1) {
            platforms = [
                { x: 0, y: h - 80, width: w * 0.3, height: 60, image: images.platform, body: createBody(w * 0.15, h - 50, b2Body.b2_staticBody, w * 0.3, 60) },
                { x: w * 0.7, y: h - 80, width: w * 0.3, height: 60, image: images.platform, body: createBody(w * 0.85, h - 50, b2Body.b2_staticBody, w * 0.3, 60) },
                { x: 0, y: h - 250, width: w * 0.5, height: 60, image: images.platform, body: createBody(w * 0.25, h - 220, b2Body.b2_staticBody, w * 0.5, 60) },
                { x: w * 0.5, y: h - 250, width: w * 0.5, height: 60, image: images.platform, body: createBody(w * 0.75, h - 220, b2Body.b2_staticBody, w * 0.5, 60) },
                { x: 0, startY: h - 600, width: w, height: 60, slope: 0.1, image: images.platform, body: createBody(w * 0.5, h - 570, b2Body.b2_staticBody, w, 60) }
            ];
            ladders = [
                { x: w * 0.27 - 15, y: h - 260, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.27 - 15 + 40, h - 150, b2Body.b2_staticBody, 80, 220, true) },
                { x: w * 0.67 - 15, y: h - 260, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.67 - 15 + 40, h - 150, b2Body.b2_staticBody, 80, 220, true) },
                { x: w * 0.47 - 15, y: h - 580, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.47 - 15 + 40, h - 470, b2Body.b2_staticBody, 80, 220, true) }
            ];
            rivets = [
                { x: w * 0.07, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.07 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.22, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.22 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.77, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.77 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.92, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.92 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.07, y: h - 290, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.07 + 10, h - 280, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.22, y: h - 290, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.22 + 10, h - 280, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.87, y: h - 290, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.87 + 10, h - 280, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.97, y: h - 290, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.97 + 10, h - 280, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.07, y: getPlatformY(platforms[4], w * 0.07) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.07 + 10, getPlatformY(platforms[4], w * 0.07) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.22, y: getPlatformY(platforms[4], w * 0.22) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.22 + 10, getPlatformY(platforms[4], w * 0.22) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.77, y: getPlatformY(platforms[4], w * 0.77) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.77 + 10, getPlatformY(platforms[4], w * 0.77) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.92, y: getPlatformY(platforms[4], w * 0.92) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.92 + 10, getPlatformY(platforms[4], w * 0.92) - 10, b2Body.b2_staticBody, 20, 20) }
            ];
        } else if (level === 2) {
            platforms = [
                { x: 0, y: h - 80, width: w * 0.45, height: 60, image: images.platform, body: createBody(w * 0.225, h - 50, b2Body.b2_staticBody, w * 0.45, 60) },
                { x: w * 0.55, y: h - 80, width: w * 0.45, height: 60, image: images.platform, body: createBody(w * 0.775, h - 50, b2Body.b2_staticBody, w * 0.45, 60) },
                { x: 0, y: h - 300, width: w * 0.3, height: 60, image: images.platform, body: createBody(w * 0.15, h - 270, b2Body.b2_staticBody, w * 0.3, 60) },
                { x: w * 0.7, y: h - 300, width: w * 0.3, height: 60, image: images.platform, body: createBody(w * 0.85, h - 270, b2Body.b2_staticBody, w * 0.3, 60) },
                { x: 0, startY: h - 600, width: w, height: 60, slope: 0.1, image: images.platform, body: createBody(w * 0.5, h - 570, b2Body.b2_staticBody, w, 60) }
            ];
            ladders = [
                { x: w * 0.39 - 15, y: h - 70, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.39 - 15 + 40, h - 60, b2Body.b2_staticBody, 80, 220, true) },
                { x: w * 0.94 - 15, y: h - 280, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.94 - 15 + 40, h - 170, b2Body.b2_staticBody, 80, 220, true) },
                { x: w * 0.07 - 15, y: h - 580, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.07 - 15 + 40, h - 470, b2Body.b2_staticBody, 80, 220, true) },
                { x: w * 0.92 - 15, y: h - 580, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.92 - 15 + 40, h - 470, b2Body.b2_staticBody, 80, 220, true) }
            ];
            rivets = [
                { x: w * 0.07, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.07 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.22, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.22 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.63, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.63 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.77, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.77 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.07, y: h - 320, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.07 + 10, h - 310, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.22, y: h - 320, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.22 + 10, h - 310, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.77, y: h - 320, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.77 + 10, h - 310, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.92, y: h - 320, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.92 + 10, h - 310, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.07, y: getPlatformY(platforms[4], w * 0.07) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.07 + 10, getPlatformY(platforms[4], w * 0.07) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.22, y: getPlatformY(platforms[4], w * 0.22) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.22 + 10, getPlatformY(platforms[4], w * 0.22) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.77, y: getPlatformY(platforms[4], w * 0.77) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.77 + 10, getPlatformY(platforms[4], w * 0.77) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.92, y: getPlatformY(platforms[4], w * 0.92) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.92 + 10, getPlatformY(platforms[4], w * 0.92) - 10, b2Body.b2_staticBody, 20, 20) }
            ];
        } else if (level === 3) {
            platforms = [
                { x: 0, y: h - 80, width: w * 0.37, height: 60, image: images.platform, body: createBody(w * 0.185, h - 50, b2Body.b2_staticBody, w * 0.37, 60) },
                { x: w * 0.63, y: h - 80, width: w * 0.37, height: 60, image: images.platform, body: createBody(w * 0.815, h - 50, b2Body.b2_staticBody, w * 0.37, 60) },
                { x: 0, startY: h - 300, width: w * 0.5, height: 60, slope: 0.1, image: images.platform, body: createBody(w * 0.25, h - 270, b2Body.b2_staticBody, w * 0.5, 60) },
                { x: w * 0.5, y: h - 300, width: w * 0.5, height: 60, image: images.platform, body: createBody(w * 0.75, h - 270, b2Body.b2_staticBody, w * 0.5, 60) },
                { x: 0, startY: h - 600, width: w, height: 60, slope: 0.1, image: images.platform, body: createBody(w * 0.5, h - 570, b2Body.b2_staticBody, w, 60) }
            ];
            ladders = [
                { x: w * 0.33 - 15, y: h - 70, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.33 - 15 + 40, h - 60, b2Body.b2_staticBody, 80, 220, true) },
                { x: w * 0.9 - 15, y: h - 280, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.9 - 15 + 40, h - 170, b2Body.b2_staticBody, 80, 220, true) },
                { x: w * 0.47 - 15, y: h - 580, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.47 - 15 + 40, h - 470, b2Body.b2_staticBody, 80, 220, true) }
            ];
            rivets = [
                { x: w * 0.07, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.07 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.22, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.22 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.7, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.7 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.85, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.85 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.07, y: getPlatformY(platforms[2], w * 0.07) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.07 + 10, getPlatformY(platforms[2], w * 0.07) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.22, y: getPlatformY(platforms[2], w * 0.22) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.22 + 10, getPlatformY(platforms[2], w * 0.22) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.87, y: h - 340, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.87 + 10, h - 330, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.97, y: h - 340, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.97 + 10, h - 330, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.07, y: getPlatformY(platforms[4], w * 0.07) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.07 + 10, getPlatformY(platforms[4], w * 0.07) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.22, y: getPlatformY(platforms[4], w * 0.22) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.22 + 10, getPlatformY(platforms[4], w * 0.22) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.77, y: getPlatformY(platforms[4], w * 0.77) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.77 + 10, getPlatformY(platforms[4], w * 0.77) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.92, y: getPlatformY(platforms[4], w * 0.92) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.92 + 10, getPlatformY(platforms[4], w * 0.92) - 10, b2Body.b2_staticBody, 20, 20) }
            ];
        } else if (level === 4) {
            platforms = [
                { x: 0, y: h - 80, width: w * 0.3, height: 60, image: images.platform, body: createBody(w * 0.15, h - 50, b2Body.b2_staticBody, w * 0.3, 60) },
                { x: w * 0.7, y: h - 80, width: w * 0.3, height: 60, image: images.platform, body: createBody(w * 0.85, h - 50, b2Body.b2_staticBody, w * 0.3, 60) },
                { x: 0, startY: h - 300, width: w * 0.5, height: 60, slope: 0.1, image: images.platform, body: createBody(w * 0.25, h - 270, b2Body.b2_staticBody, w * 0.5, 60) },
                { x: w * 0.5, startY: h - 300, width: w * 0.5, height: 60, slope: -0.1, image: images.platform, body: createBody(w * 0.75, h - 270, b2Body.b2_staticBody, w * 0.5, 60) },
                { x: 0, startY: h - 600, width: w, height: 60, slope: 0.1, image: images.platform, body: createBody(w * 0.5, h - 570, b2Body.b2_staticBody, w, 60) }
            ];
            ladders = [
                { x: w * 0.27 - 15, y: h - 70, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.27 - 15 + 40, h - 60, b2Body.b2_staticBody, 80, 220, true) },
                { x: w * 0.97 - 15, y: h - 280, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.97 - 15 + 40, h - 170, b2Body.b2_staticBody, 80, 220, true) },
                { x: w * 0.47 - 15, y: h - 580, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.47 - 15 + 40, h - 470, b2Body.b2_staticBody, 80, 220, true) },
                { x: w * 0.07 - 15, y: h - 580, width: 80, height: 220, image: images.ladder, body: createBody(w * 0.07 - 15 + 40, h - 470, b2Body.b2_staticBody, 80, 220, true) }
            ];
            rivets = [
                { x: w * 0.07, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.07 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.22, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.22 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.77, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.77 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.92, y: h - 100, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.92 + 10, h - 90, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.07, y: getPlatformY(platforms[2], w * 0.07) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.07 + 10, getPlatformY(platforms[2], w * 0.07) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.22, y: getPlatformY(platforms[2], w * 0.22) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.22 + 10, getPlatformY(platforms[2], w * 0.22) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.87, y: getPlatformY(platforms[3], w * 0.87) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.87 + 10, getPlatformY(platforms[3], w * 0.87) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.97, y: getPlatformY(platforms[3], w * 0.97) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.97 + 10, getPlatformY(platforms[3], w * 0.97) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.07, y: getPlatformY(platforms[4], w * 0.07) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.07 + 10, getPlatformY(platforms[4], w * 0.07) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.22, y: getPlatformY(platforms[4], w * 0.22) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.22 + 10, getPlatformY(platforms[4], w * 0.22) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.77, y: getPlatformY(platforms[4], w * 0.77) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.77 + 10, getPlatformY(platforms[4], w * 0.77) - 10, b2Body.b2_staticBody, 20, 20) },
                { x: w * 0.92, y: getPlatformY(platforms[4], w * 0.92) - 20, width: 20, height: 20, hit: false, image: images.rivet, body: createBody(w * 0.92 + 10, getPlatformY(platforms[4], w * 0.92) - 10, b2Body.b2_staticBody, 20, 20) }
            ];
        }

        marioBody = createBody(w * 0.07 + 16, platforms[0].y - 16, b2Body.b2_dynamicBody, 32, 32);
        marioBody.SetFixedRotation(true); // Prevent rotation
        marioBody.SetUserData({ type: 'mario', dx: 0, dy: 0, jumping: false, onLadder: false, hammer: false, hammerTime: 0, jump: false });

        premekongBody = createBody(w * 0.07 + 32, getPlatformY(platforms[platforms.length - 1], w * 0.07) - 32, b2Body.b2_staticBody, 64, 64);
        premekongBody.SetUserData({ type: 'premekong' });

        paulineBody = createBody(w * 0.88 + 16, getPlatformY(platforms[platforms.length - 1], w * 0.88) - 16, b2Body.b2_staticBody, 32, 32);
        paulineBody.SetUserData({ type: 'pauline' });

        hammerBody = createBody(w * 0.5 + 16, platforms[1].y - 16, b2Body.b2_staticBody, 32, 32);
        hammerBody.SetUserData({ type: 'hammer', active: true });

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
        }

        platforms.forEach(p => {
            if (p.image && p.image.complete) {
                ctx.drawImage(p.image, p.x, p.hasOwnProperty('slope') ? p.startY : p.y, p.width, p.height);
            } else {
                ctx.fillStyle = 'red';
                ctx.fillRect(p.x, p.hasOwnProperty('slope') ? p.startY : p.y, p.width, p.height);
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

        const marioPos = marioBody.GetPosition();
        if (images.mario && images.mario.complete) {
            ctx.drawImage(images.mario, marioPos.x * SCALE - 16, marioPos.y * SCALE - 16, 32, 32);
        } else {
            ctx.fillStyle = 'white';
            ctx.fillRect(marioPos.x * SCALE - 16, marioPos.y * SCALE - 16, 32, 32);
        }

        const premekongPos = premekongBody.GetPosition();
        if (images.premekong && images.premekong.complete) {
            ctx.drawImage(images.premekong, premekongPos.x * SCALE - 32, premekongPos.y * SCALE - 32 + Math.sin(Date.now() / 200) * 10, 64, 64);
        } else {
            ctx.fillStyle = 'blue';
            ctx.fillRect(premekongPos.x * SCALE - 32, premekongPos.y * SCALE - 32, 64, 64);
        }

        const paulinePos = paulineBody.GetPosition();
        if (images.pauline && images.pauline.complete) {
            ctx.drawImage(images.pauline, paulinePos.x * SCALE - 16, paulinePos.y * SCALE - 16, 32, 32);
        } else {
            ctx.fillStyle = 'pink';
            ctx.fillRect(paulinePos.x * SCALE - 16, paulinePos.y * SCALE - 16, 32, 32);
        }

        barrels.forEach(b => {
            const barrelPos = b.body.GetPosition();
            if (b.image && b.image.complete) {
                ctx.drawImage(b.image, barrelPos.x * SCALE - 16, barrelPos.y * SCALE - 16, 32, 32);
            } else {
                ctx.fillStyle = 'brown';
                ctx.fillRect(barrelPos.x * SCALE - 16, barrelPos.y * SCALE - 16, 32, 32);
            }
        });

        if (hammerBody) {
            const hammerPos = hammerBody.GetPosition();
            if (hammerBody.GetUserData().active && images.hammer && images.hammer.complete) {
                ctx.drawImage(images.hammer, hammerPos.x * SCALE - 16, hammerPos.y * SCALE - 16, 32, 32);
            } else if (hammerBody.GetUserData().active) {
                ctx.fillStyle = 'yellow';
                ctx.fillRect(hammerPos.x * SCALE - 16, hammerPos.y * SCALE - 16, 32, 32);
            }
        }
    }

    function update(canvas) {
        if (!gameActive || gameOver || !canvas) return;

        // Step the physics world
        world.Step(1 / 60, 10, 10);
        world.ClearForces();

        // Mario movement
        const marioPos = marioBody.GetPosition();
        console.log('Mario position:', marioPos.x * SCALE, marioPos.y * SCALE, 'Velocity:', marioBody.GetLinearVelocity().x, marioBody.GetLinearVelocity().y);

        if (marioBody.GetUserData().dx) {
            marioBody.ApplyForce(new b2Vec2(marioBody.GetUserData().dx * 50, 0), marioBody.GetWorldCenter());
        }

        // Jumping
        if (marioBody.GetUserData().jump && !marioBody.GetUserData().jumping) {
            marioBody.ApplyImpulse(new b2Vec2(0, -300), marioBody.GetWorldCenter());
            marioBody.GetUserData().jumping = true;
            console.log('Mario jumping');
        }

        // Check if Mario is on a platform (grounded)
        let onPlatform = false;
        platforms.forEach(p => {
            const platformPos = p.body.GetPosition();
            const marioBox = marioBody.GetFixtureList().GetShape();
            const platformBox = p.body.GetFixtureList().GetShape();
            if (Box2D.Collision.b2TestOverlap(marioBox, 0, platformBox, 0, marioBody.GetTransform(), p.body.GetTransform())) {
                if (marioPos.y * SCALE < p.y + p.height / 2) {
                    marioBody.SetPosition(new b2Vec2(marioPos.x, (p.y - 16) / SCALE));
                    marioBody.SetLinearVelocity(new b2Vec2(marioBody.GetLinearVelocity().x, 0));
                    marioBody.GetUserData().jumping = false;
                    onPlatform = true;
                    console.log('Mario on platform at', p.x, p.y);
                }
            }
        });

        // Check if Mario is on a ladder
        let onLadder = false;
        ladders.forEach(l => {
            const ladderPos = l.body.GetPosition();
            const marioBox = marioBody.GetFixtureList().GetShape();
            const ladderBox = l.body.GetFixtureList().GetShape();
            if (Box2D.Collision.b2TestOverlap(marioBox, 0, ladderBox, 0, marioBody.GetTransform(), l.body.GetTransform())) {
                onLadder = true;
                marioBody.GetUserData().onLadder = true;
                console.log('Mario on ladder at', l.x, l.y);
                if (marioBody.GetUserData().dy) {
                    marioBody.SetLinearVelocity(new b2Vec2(0, marioBody.GetUserData().dy * 3));
                }
            }
        });
        if (!onLadder) marioBody.GetUserData().onLadder = false;

        // Reset velocities if not moving
        if (!marioBody.GetUserData().dx && !marioBody.GetUserData().dy) {
            marioBody.SetLinearVelocity(new b2Vec2(0, marioBody.GetLinearVelocity().y));
        }

        // Hammer logic
        if (hammerBody && checkCollision(marioBody, hammerBody)) {
            marioBody.GetUserData().hammer = true;
            marioBody.GetUserData().hammerTime = 5000;
            hammerBody.GetUserData().active = false;
            console.log('Mario picked up hammer');
        }
        if (marioBody.GetUserData().hammer) {
            marioBody.GetUserData().hammerTime -= 16;
            if (marioBody.GetUserData().hammerTime <= 0) marioBody.GetUserData().hammer = false;
        }

        // Preme Kong bouncing
        const premekongPos = premekongBody.GetPosition();
        premekongBody.SetPosition(new b2Vec2(premekongPos.x, (getPlatformY(platforms[platforms.length - 1], premekongPos.x * SCALE) - 32) / SCALE + Math.sin(Date.now() / 200) * 0.3));

        // Spawn barrels
        if (Math.random() < 0.02 * level) {
            const premekongPos = premekongBody.GetPosition();
            barrels.push({
                body: createBody(premekongPos.x * SCALE + 64, premekongPos.y * SCALE, b2Body.b2_dynamicBody, 32, 32),
                image: images.barrel,
                type: 'thrown'
            });
            barrels[barrels.length - 1].body.SetLinearVelocity(new b2Vec2(2, 0));
        }
        if (Math.random() < 0.01 * level) {
            const topPlatform = platforms[platforms.length - 1];
            const topY = topPlatform.hasOwnProperty('slope') ? getPlatformY(topPlatform, premekongBody.GetPosition().x * SCALE) : topPlatform.startY;
            barrels.push({
                body: createBody(premekongBody.GetPosition().x * SCALE, (topY - 32) / SCALE, b2Body.b2_dynamicBody, 32, 32),
                image: images.barrel,
                type: 'rolling'
            });
            barrels[barrels.length - 1].body.SetLinearVelocity(new b2Vec2(2, 0));
        }

        // Update barrels
        barrels.forEach((b, i) => {
            const barrelPos = b.body.GetPosition();
            console.log('Barrel position:', barrelPos.x * SCALE, barrelPos.y * SCALE);
            if (b.type === 'thrown') {
                b.body.ApplyForce(new b2Vec2(0, 30), b.body.GetWorldCenter());
            } else if (b.type === 'rolling') {
                let onPlatform = false;
                platforms.forEach(p => {
                    const platformPos = p.body.GetPosition();
                    const barrelBox = b.body.GetFixtureList().GetShape();
                    const platformBox = p.body.GetFixtureList().GetShape();
                    if (Box2D.Collision.b2TestOverlap(barrelBox, 0, platformBox, 0, b.body.GetTransform(), p.body.GetTransform())) {
                        if (barrelPos.y * SCALE < p.y + p.height / 2) {
                            b.body.SetPosition(new b2Vec2(barrelPos.x, (p.y - 16) / SCALE));
                            b.body.SetLinearVelocity(new b2Vec2(2, 0));
                            onPlatform = true;
                        }
                    }
                });
                if (!onPlatform) {
                    b.body.ApplyForce(new b2Vec2(0, 30), b.body.GetWorldCenter());
                }
            }

            if (barrelPos.x * SCALE < -32 || barrelPos.x * SCALE > canvas.width || barrelPos.y * SCALE > canvas.height) {
                world.DestroyBody(b.body);
                barrels.splice(i, 1);
            } else if (checkCollision(marioBody, b.body)) {
                if (marioBody.GetUserData().hammer) {
                    score += 300;
                    world.DestroyBody(b.body);
                    barrels.splice(i, 1);
                } else {
                    gameOver = true;
                    restartGame();
                }
            } else if (!marioBody.GetUserData().onLadder && !marioBody.GetUserData().jumping && marioPos.y * SCALE + 32 < barrelPos.y * SCALE - 35 && Math.abs((marioPos.x * SCALE + 16) - (barrelPos.x * SCALE + 16)) < 16) {
                score += 100;
                world.DestroyBody(b.body);
                barrels.splice(i, 1);
            }
        });

        // Rivet and win condition
        rivets.forEach(r => {
            if (!r.hit && checkCollision(marioBody, r.body)) {
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
        if (checkCollision(marioBody, paulineBody)) {
            levelUp();
            marioBody.SetPosition(new b2Vec2((canvas.width * 0.07 + 16) / SCALE, (platforms[0].y - 16) / SCALE));
            premekongBody.SetPosition(new b2Vec2((canvas.width * 0.07 + 32) / SCALE, (getPlatformY(platforms[platforms.length - 1], canvas.width * 0.07) - 32) / SCALE));
            paulineBody.SetPosition(new b2Vec2((canvas.width * 0.88 + 16) / SCALE, (getPlatformY(platforms[platforms.length - 1], canvas.width * 0.88) - 16) / SCALE));
            rivets.forEach(r => r.hit = false);
            barrels.forEach(b => world.DestroyBody(b.body));
            barrels = [];
            updateScore();
        }

        updateScore();
    }

    function checkCollision(body1, body2) {
        const fixture1 = body1.GetFixtureList();
        const fixture2 = body2.GetFixtureList();
        if (!fixture1 || !fixture2) return false;
        return Box2D.Collision.b2TestOverlap(fixture1.GetShape(), 0, fixture2.GetShape(), 0, body1.GetTransform(), body2.GetTransform());
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
                if (key === 'left') marioBody.GetUserData().dx = -1;
                else if (key === 'right') marioBody.GetUserData().dx = 1;
                else if (key === 'jump' && !marioBody.GetUserData().jumping) {
                    marioBody.GetUserData().jump = true;
                } else if (key === 'up' && marioBody.GetUserData().onLadder) marioBody.GetUserData().dy = -1;
                else if (key === 'down' && marioBody.GetUserData().onLadder) marioBody.GetUserData().dy = 1;
                else if (key === 'restart' && gameOver) restartGame();
            });
            btn.addEventListener('touchend', (e) => {
                if (!e.cancelable || e.defaultPrevented) return;
                e.preventDefault();
                if (key === 'left' || key === 'right') marioBody.GetUserData().dx = 0;
                else if (key === 'jump') marioBody.GetUserData().jump = false;
                else if (key === 'up' || key === 'down') marioBody.GetUserData().dy = 0;
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (key === 'left') marioBody.GetUserData().dx = -1;
                else if (key === 'right') marioBody.GetUserData().dx = 1;
                else if (key === 'jump' && !marioBody.GetUserData().jumping) {
                    marioBody.GetUserData().jump = true;
                } else if (key === 'up' && marioBody.GetUserData().onLadder) marioBody.GetUserData().dy = -1;
                else if (key === 'down' && marioBody.GetUserData().onLadder) marioBody.GetUserData().dy = 1;
                else if (key === 'restart' && gameOver) restartGame();
                setTimeout(() => {
                    if (key === 'left' || key === 'right') marioBody.GetUserData().dx = 0;
                    else if (key === 'jump') marioBody.GetUserData().jump = false;
                    else if (key === 'up' || key === 'down') marioBody.GetUserData().dy = 0;
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

    // Contact listener for collisions
    const listener = new b2ContactListener();
    listener.BeginContact = function(contact) {
        const fixtureA = contact.GetFixtureA();
        const fixtureB = contact.GetFixtureB();
        const bodyA = fixtureA.GetBody();
        const bodyB = fixtureB.GetBody();
        const userDataA = bodyA.GetUserData();
        const userDataB = bodyB.GetUserData();

        if ((userDataA.type === 'mario' && userDataB.type === 'platform') || (userDataB.type === 'mario' && userDataA.type === 'platform')) {
            if (userDataA.type === 'mario') userDataA.jumping = false;
            else if (userDataB.type === 'mario') userDataB.jumping = false;
            console.log('Mario landed on platform');
        }
        if ((userDataA.type === 'mario' && userDataB.type === 'ladder') || (userDataB.type === 'mario' && userDataA.type === 'ladder')) {
            if (userDataA.type === 'mario') userDataA.onLadder = true;
            else if (userDataB.type === 'mario') userDataB.onLadder = true;
            console.log('Mario on ladder');
        }
        if ((userDataA.type === 'mario' && userDataB.type === 'barrel') || (userDataB.type === 'mario' && userDataA.type === 'barrel')) {
            const marioData = userDataA.type === 'mario' ? userDataA : userDataB;
            if (marioData.hammer) {
                if (userDataA.type === 'barrel') world.DestroyBody(bodyA);
                else world.DestroyBody(bodyB);
                score += 300;
            } else {
                gameOver = true;
                restartGame();
            }
        }
    };
    world.SetContactListener(listener);

    // Initialize user data for bodies
    marioBody.GetUserData = () => ({ type: 'mario', dx: 0, dy: 0, jumping: false, onLadder: false, hammer: false, hammerTime: 0, jump: false });
    premekongBody.GetUserData = () => ({ type: 'premekong' });
    paulineBody.GetUserData = () => ({ type: 'pauline' });
    hammerBody.GetUserData = () => ({ type: 'hammer', active: true });

    loadImages().then(loadedImages => {
        images = loadedImages;
        initLevel();
        setupControls();
        gameLoop();
    }).catch(error => console.error('Image loading failed:', error));
                             }
