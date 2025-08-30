const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
const PLAYER_SPEED = 5;
const JUMP_SPEED = 15;
const GRAVITY = 0.5;
const DEBRIS_SPEED = 3;
const DEBRIS_SPAWN_RATE = 60; // Frames between spawns
const TIME_LIMIT = 10000; // 10 seconds
const MAX_LIVES = 3;
const SHAKE_INTENSITY = 5;
const TABLE_WIDTH = 100;
const TABLE_HEIGHT = 50;

let canvas, ctx, player, debris, keys, backgroundImg, playerImg;
let gameState, startTime, lives, score, shakeOffsetX, shakeOffsetY, table;

// Preload images
function preloadImages() {
    backgroundImg = new Image();
    playerImg = new Image();
    backgroundImg.src = 'assets/house_bg.jpg';
    playerImg.src = 'assets/player.png';
    return Promise.all([
        new Promise(resolve => { backgroundImg.onload = resolve; backgroundImg.onerror = resolve; }),
        new Promise(resolve => { playerImg.onload = resolve; playerImg.onerror = resolve; })
    ]);
}

// Initialize game
function initGame() {
    gameState = 'playing';
    startTime = Date.now();
    lives = MAX_LIVES;
    score = 0;
    shakeOffsetX = 0;
    shakeOffsetY = 0;
    debris = [];
    keys = {};

    player = {
        x: 100,
        y: CANVAS_HEIGHT - PLAYER_HEIGHT,
        vx: 0,
        vy: 0,
        onGround: true
    };

    table = {
        x: CANVAS_WIDTH - TABLE_WIDTH - 50,
        y: CANVAS_HEIGHT - TABLE_HEIGHT,
        width: TABLE_WIDTH,
        height: TABLE_HEIGHT
    };

    window.addEventListener('keydown', (e) => { keys[e.key] = true; });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });

    document.getElementById('menu').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    document.getElementById('info').innerHTML = `Lives: ${lives} | Score: ${score} | Time: 10s`;

    gameLoop();
}

// Game loop
function gameLoop() {
    if (gameState !== 'playing') {
        showResult();
        return;
    }

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    const elapsed = Date.now() - startTime;
    const timeLeft = Math.max(0, Math.floor((TIME_LIMIT - elapsed) / 1000));

    // Player movement
    if (keys['ArrowLeft'] || keys['a']) player.x -= PLAYER_SPEED;
    if (keys['ArrowRight'] || keys['d']) player.x += PLAYER_SPEED;
    if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && player.onGround) {
        player.vy = -JUMP_SPEED; // Fixed: Complete the jump velocity assignment
        player.onGround = false;
    }

    // Apply gravity
    player.vy += GRAVITY;
    player.y += player.vy;

    // Ground collision
    if (player.y >= CANVAS_HEIGHT - PLAYER_HEIGHT) {
        player.y = CANVAS_HEIGHT - PLAYER_HEIGHT;
        player.vy = 0;
        player.onGround = true;
    }

    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x > CANVAS_WIDTH - PLAYER_WIDTH) player.x = CANVAS_WIDTH - PLAYER_WIDTH;

    // Spawn debris
    if (Math.random() * 100 < DEBRIS_SPAWN_RATE / 60) { // Adjusted for frame-rate independence
        debris.push({
            x: Math.random() * (CANVAS_WIDTH - 50),
            y: -50,
            width: 50,
            height: 50,
            speed: DEBRIS_SPEED
        });
    }

    // Update debris
    debris = debris.filter(obs => {
        obs.y += obs.speed;
        if (obs.y > CANVAS_HEIGHT) return false;

        // Collision with player
        if (
            player.x < obs.x + obs.width &&
            player.x + PLAYER_WIDTH > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + PLAYER_HEIGHT > obs.y
        ) {
            lives--;
            if (lives <= 0) gameState = 'lose';
            return false;
        }
        return true;
    });

    // Check if player reached table
    if (
        player.x < table.x + table.width &&
        player.x + PLAYER_WIDTH > table.x &&
        player.y < table.y + table.height &&
        player.y + PLAYER_HEIGHT > table.y
    ) {
        gameState = 'win';
    }

    // Check for timeout
    if (elapsed >= TIME_LIMIT) {
        gameState = 'lose';
    }

    // Update info
    document.getElementById('info').innerHTML = `Lives: ${lives} | Score: ${score} | Time: ${timeLeft}s`;

    // Shake effect
    shakeOffsetX = (Math.random() - 0.5) * SHAKE_INTENSITY;
    shakeOffsetY = (Math.random() - 0.5) * SHAKE_INTENSITY;

    // Increment score
    score++;
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply shake effect
    ctx.save();
    ctx.translate(shakeOffsetX, shakeOffsetY);

    // Draw background
    if (backgroundImg.complete && backgroundImg.naturalWidth) {
        ctx.drawImage(backgroundImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
        ctx.fillStyle = '#8B4513'; // Brown for house interior
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Draw table
    ctx.fillStyle = '#654321'; // Dark brown
    ctx.fillRect(table.x, table.y, table.width, table.height);

    // Draw player
    if (playerImg.complete && playerImg.naturalWidth) {
        ctx.drawImage(playerImg, player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT);
    }

    // Draw debris
    debris.forEach(obs => {
        ctx.fillStyle = 'red'; // Placeholder for debris
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    ctx.restore();
}

// Show result
function showResult() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = backgroundImg.complete && backgroundImg.naturalWidth ? '' : '#8B4513';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        gameState === 'win' ? 'You Survived!' : 'Game Over: You Died',
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2
    );
    ctx.font = '20px Arial';
    ctx.fillText('Click Start to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

    document.getElementById('menu').style.display = 'block';
    document.getElementById('game').style.display = 'block';
    document.getElementById('info').innerHTML = '';
}

// Setup
window.onload = () => {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');

    preloadImages().then(() => {
        document.getElementById('start').addEventListener('click', initGame);
    }).catch(err => console.error('Image loading failed:', err));
};