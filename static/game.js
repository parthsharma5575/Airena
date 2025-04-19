// Space Shooter Game - main game script
// Game configuration
const CONFIG = {
    gameWidth: 800,
    gameHeight: 600,
    playerSpeed: 5,
    bulletSpeed: 10,
    shootCooldown: 200,
    asteroidSpeed: 2,
    asteroidSpawnRate: 1000, // ms
    colors: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3'],
    defaultUsername: 'Player'
};

// Game state
let gameState = {
    players: {},
    bullets: [],
    asteroids: [],
    explosions: [],
    gameOver: false,
    timeRemaining: 60,
    gameActive: false
};

// Player information
let playerId = null;
let username = '';
let lastShootTime = 0;
let keysPressed = {};
let score = 0;

// DOM elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const loginScreen = document.getElementById('login-screen');
const usernameInput = document.getElementById('username');
const startButton = document.getElementById('start-button');
const gameOverScreen = document.getElementById('game-over');
const finalScoresDiv = document.getElementById('final-scores');
const restartButton = document.getElementById('restart-button');
const scoreboardDiv = document.getElementById('scoreboard');
const statusDiv = document.getElementById('status');

// Sounds using Tone.js
const sounds = {
    shoot: null,
    explosion: null,
    powerup: null,
    gameStart: null,
    gameOver: null
};

// Game sprites
const sprites = {
    player: null,
    enemy: null,
    asteroid: null,
    bullet: null,
    explosion: []
};

// Animation frame ID
let animationFrameId = null;

// Game timers
let asteroidSpawnTimer = null;
let gameTimer = null;

// ----- GAME INITIALIZATION -----
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Tone.js sounds
    initSounds();
    
    // Set up event listeners
    setupEventListeners();
    
    // Pre-render game sprites
    createSprites();
});

// Initialize Tone.js sounds
function initSounds() {
    try {
        // Create a limiter for all sounds
        const limiter = new Tone.Limiter(-6).toDestination();
        
        // Shoot sound
        sounds.shoot = new Tone.Player({
            url: 'https://tonejs.github.io/audio/berklee/gong_1.mp3',
            volume: -15
        }).connect(limiter);
        
        // Explosion sound
        sounds.explosion = new Tone.Player({
            url: 'https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3',
            volume: -10
        }).connect(limiter);
        
        // Powerup sound
        sounds.powerup = new Tone.Player({
            url: 'https://tonejs.github.io/audio/berklee/guitar_harmonics_a4.mp3',
            volume: -10
        }).connect(limiter);
        
        // Game start sound
        sounds.gameStart = new Tone.Player({
            url: 'https://tonejs.github.io/audio/berklee/gong_1.mp3',
            volume: -5
        }).connect(limiter);
        
        // Game over sound
        sounds.gameOver = new Tone.Player({
            url: 'https://tonejs.github.io/audio/berklee/trombone_choir_d3.mp3',
            volume: -10
        }).connect(limiter);
    } catch (error) {
        console.error('Failed to initialize sounds:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Game selection handlers
    document.getElementById('start-space-game').addEventListener('click', () => {
        document.getElementById('username-form').style.display = 'block';
    });
    
    // Start button click
    startButton.addEventListener('click', () => {
        username = usernameInput.value.trim() || CONFIG.defaultUsername;
        createGame();
    });
    
    // Username input enter key
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            username = usernameInput.value.trim() || CONFIG.defaultUsername;
            createGame();
        }
    });
    
    // Restart button click
    restartButton.addEventListener('click', () => {
        gameOverScreen.style.display = 'none';
        createGame();
    });
    
    // Keyboard input for game controls
    window.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
        
        // Space key for shooting
        if (e.key === ' ' && gameState.gameActive && Date.now() - lastShootTime > CONFIG.shootCooldown) {
            shootBullet();
            lastShootTime = Date.now();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        delete keysPressed[e.key];
    });
}

// Create game sprites
function createSprites() {
    // Create a player ship sprite
    sprites.player = createShipSprite('#3357FF');
    
    // Create an enemy ship sprite
    sprites.enemy = createShipSprite('#FF5733');
    
    // Create asteroid sprite
    sprites.asteroid = createAsteroidSprite();
    
    // Create bullet sprite
    sprites.bullet = createBulletSprite();
    
    // Create explosion sprites
    for (let i = 0; i < 5; i++) {
        sprites.explosion.push(createExplosionSprite(i));
    }
}

// Create a colored ship sprite
function createShipSprite(color) {
    const shipCanvas = document.createElement('canvas');
    shipCanvas.width = 40;
    shipCanvas.height = 40;
    const shipCtx = shipCanvas.getContext('2d');
    
    // Draw ship shape
    shipCtx.fillStyle = color;
    shipCtx.beginPath();
    shipCtx.moveTo(20, 0);
    shipCtx.lineTo(40, 40);
    shipCtx.lineTo(20, 30);
    shipCtx.lineTo(0, 40);
    shipCtx.closePath();
    shipCtx.fill();
    
    // Add some details
    shipCtx.fillStyle = '#FFFFFF';
    shipCtx.beginPath();
    shipCtx.arc(20, 15, 5, 0, Math.PI * 2);
    shipCtx.fill();
    
    return shipCanvas;
}

// Create asteroid sprite
function createAsteroidSprite() {
    const asteroidCanvas = document.createElement('canvas');
    asteroidCanvas.width = 40;
    asteroidCanvas.height = 40;
    const asteroidCtx = asteroidCanvas.getContext('2d');
    
    // Draw asteroid
    asteroidCtx.fillStyle = '#888888';
    asteroidCtx.beginPath();
    asteroidCtx.arc(20, 20, 15, 0, Math.PI * 2);
    asteroidCtx.fill();
    
    // Add some details (craters)
    asteroidCtx.fillStyle = '#666666';
    asteroidCtx.beginPath();
    asteroidCtx.arc(15, 15, 5, 0, Math.PI * 2);
    asteroidCtx.arc(25, 25, 4, 0, Math.PI * 2);
    asteroidCtx.arc(10, 25, 3, 0, Math.PI * 2);
    asteroidCtx.fill();
    
    return asteroidCanvas;
}

// Create bullet sprite
function createBulletSprite() {
    const bulletCanvas = document.createElement('canvas');
    bulletCanvas.width = 8;
    bulletCanvas.height = 8;
    const bulletCtx = bulletCanvas.getContext('2d');
    
    // Draw bullet
    bulletCtx.fillStyle = '#FFFF00';
    bulletCtx.beginPath();
    bulletCtx.arc(4, 4, 4, 0, Math.PI * 2);
    bulletCtx.fill();
    
    return bulletCanvas;
}

// Create explosion sprite (frame)
function createExplosionSprite(frame) {
    const explosionCanvas = document.createElement('canvas');
    explosionCanvas.width = 60;
    explosionCanvas.height = 60;
    const explosionCtx = explosionCanvas.getContext('2d');
    
    // Draw explosion (different size based on frame)
    const radius = 10 + frame * 10;
    const alpha = 1 - frame * 0.2;
    
    explosionCtx.globalAlpha = alpha;
    explosionCtx.fillStyle = '#FFA500';
    explosionCtx.beginPath();
    explosionCtx.arc(30, 30, radius, 0, Math.PI * 2);
    explosionCtx.fill();
    
    // Add some yellow center
    explosionCtx.fillStyle = '#FFFF00';
    explosionCtx.beginPath();
    explosionCtx.arc(30, 30, radius * 0.7, 0, Math.PI * 2);
    explosionCtx.fill();
    
    return explosionCanvas;
}

// ----- GAME CREATION & INITIALIZATION -----
function createGame() {
    // Reset game state
    resetGameState();
    
    // Hide login screen, show game
    loginScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    // Update status
    statusDiv.textContent = 'Starting game...';
    
    // Create game via API
    fetch('/api/game/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store player ID
            playerId = data.player_id;
            
            // Add player to game state
            gameState.players[playerId] = {
                id: playerId,
                name: username,
                x: CONFIG.gameWidth / 2,
                y: CONFIG.gameHeight - 100,
                color: CONFIG.colors[0],
                score: 0,
                lives: 3
            };
            
            // Add AI player
            const aiPlayerId = 'ai-player';
            gameState.players[aiPlayerId] = {
                id: aiPlayerId,
                name: 'AI Opponent',
                x: CONFIG.gameWidth / 2,
                y: CONFIG.gameHeight - 100, // Same y position as player (bottom of screen)
                color: CONFIG.colors[1],
                score: 0,
                lives: 3,
                isAI: true
            };
            
            // Update status
            statusDiv.textContent = 'Game started!';
            
            // Update scoreboard
            updateScoreboard();
            
            // Start game timers
            startGameTimers();
            
            // Start game loop
            gameState.gameActive = true;
            gameLoop();
            
            // Play game start sound
            if (sounds.gameStart) {
                sounds.gameStart.start();
            }
        } else {
            // Show error
            statusDiv.textContent = 'Error starting game: ' + (data.message || 'Unknown error');
            setTimeout(() => {
                loginScreen.style.display = 'flex';
            }, 2000);
        }
    })
    .catch(error => {
        console.error('Error creating game:', error);
        statusDiv.textContent = 'Error starting game: ' + error.message;
        setTimeout(() => {
            loginScreen.style.display = 'flex';
        }, 2000);
    });
}

// Reset game state
function resetGameState() {
    gameState = {
        players: {},
        bullets: [],
        asteroids: [],
        explosions: [],
        gameOver: false,
        timeRemaining: 60,
        gameActive: false
    };
    
    score = 0;
    lastShootTime = 0;
    keysPressed = {};
    
    // Clear any existing animation/timers
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    if (asteroidSpawnTimer) {
        clearInterval(asteroidSpawnTimer);
        asteroidSpawnTimer = null;
    }
    
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

// Start game timers
function startGameTimers() {
    // Asteroid spawn timer
    asteroidSpawnTimer = setInterval(() => {
        if (gameState.gameActive) {
            spawnAsteroid();
        }
    }, CONFIG.asteroidSpawnRate);
    
    // Game timer (countdown)
    gameTimer = setInterval(() => {
        if (gameState.gameActive) {
            gameState.timeRemaining--;
            
            // Update status with time remaining
            statusDiv.textContent = `Time remaining: ${gameState.timeRemaining}s`;
            
            // Check if time's up
            if (gameState.timeRemaining <= 0) {
                endGame();
            }
        }
    }, 1000);
}

// ----- GAME LOOP & RENDERING -----
function gameLoop() {
    if (!gameState.gameActive) return;
    
    // Update game state
    updateGame();
    
    // Render game
    renderGame();
    
    // Continue loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Update game state
function updateGame() {
    // Move player based on keys
    movePlayer();
    
    // Move AI player
    moveAIPlayer();
    
    // Update bullets
    updateBullets();
    
    // Update asteroids
    updateAsteroids();
    
    // Update explosions
    updateExplosions();
    
    // Check collisions
    checkCollisions();
}

// Move player based on key input
function movePlayer() {
    if (!gameState.players[playerId]) return;
    
    const player = gameState.players[playerId];
    const speed = CONFIG.playerSpeed;
    
    // Up/Down movement
    if (keysPressed['ArrowUp'] || keysPressed['w']) {
        player.y = Math.max(20, player.y - speed);
    }
    if (keysPressed['ArrowDown'] || keysPressed['s']) {
        player.y = Math.min(CONFIG.gameHeight - 20, player.y + speed);
    }
    
    // Left/Right movement
    if (keysPressed['ArrowLeft'] || keysPressed['a']) {
        player.x = Math.max(20, player.x - speed);
    }
    if (keysPressed['ArrowRight'] || keysPressed['d']) {
        player.x = Math.min(CONFIG.gameWidth - 20, player.x + speed);
    }
}

// Move AI player with simple AI behavior
function moveAIPlayer() {
    const aiPlayer = Object.values(gameState.players).find(p => p.isAI);
    if (!aiPlayer) return;
    
    // Find closest asteroid to avoid
    let closestAsteroid = null;
    let closestDistance = Infinity;
    
    for (const asteroid of gameState.asteroids) {
        const distance = Math.sqrt(
            Math.pow(asteroid.x - aiPlayer.x, 2) + 
            Math.pow(asteroid.y - aiPlayer.y, 2)
        );
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestAsteroid = asteroid;
        }
    }
    
    // Basic AI movement
    if (closestAsteroid && closestDistance < 150) {
        // Avoid asteroid
        if (closestAsteroid.x < aiPlayer.x) {
            aiPlayer.x = Math.min(CONFIG.gameWidth - 20, aiPlayer.x + CONFIG.playerSpeed);
        } else {
            aiPlayer.x = Math.max(20, aiPlayer.x - CONFIG.playerSpeed);
        }
    } else {
        // Random movement when no immediate threats
        if (Math.random() < 0.05) {
            aiPlayer.x += (Math.random() - 0.5) * CONFIG.playerSpeed * 2;
        }
    }
    
    // Keep AI within boundaries
    aiPlayer.x = Math.max(20, Math.min(CONFIG.gameWidth - 20, aiPlayer.x));
    
    // Occasionally shoot
    if (Math.random() < 0.02) {
        aiShoot(aiPlayer);
    }
}

// AI shooting
function aiShoot(aiPlayer) {
    gameState.bullets.push({
        x: aiPlayer.x,
        y: aiPlayer.y - 20, // Bullet comes from top of ship (shooting upward)
        speed: CONFIG.bulletSpeed,
        owner: aiPlayer.id,
        direction: -1  // Upward (same as player)
    });
    
    if (sounds.shoot) {
        sounds.shoot.start();
    }
}

// Player shooting
function shootBullet() {
    const player = gameState.players[playerId];
    if (!player) return;
    
    gameState.bullets.push({
        x: player.x,
        y: player.y - 20,
        speed: CONFIG.bulletSpeed,
        owner: playerId,
        direction: -1  // Upward for player
    });
    
    if (sounds.shoot) {
        sounds.shoot.start();
    }
}

// Update bullets
function updateBullets() {
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        
        // Move bullet
        bullet.y += bullet.speed * bullet.direction;
        
        // Remove if out of bounds
        if (bullet.y < 0 || bullet.y > CONFIG.gameHeight) {
            gameState.bullets.splice(i, 1);
        }
    }
}

// Spawn asteroid
function spawnAsteroid() {
    const x = Math.random() * CONFIG.gameWidth;
    const speed = CONFIG.asteroidSpeed * (0.5 + Math.random());
    
    gameState.asteroids.push({
        x: x,
        y: -20,
        speed: speed,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 4,
        size: 30 + Math.random() * 20
    });
}

// Update asteroids
function updateAsteroids() {
    for (let i = gameState.asteroids.length - 1; i >= 0; i--) {
        const asteroid = gameState.asteroids[i];
        
        // Move asteroid
        asteroid.y += asteroid.speed;
        asteroid.rotation += asteroid.rotationSpeed;
        
        // Remove if out of bounds
        if (asteroid.y > CONFIG.gameHeight + 20) {
            gameState.asteroids.splice(i, 1);
        }
    }
}

// Update explosions
function updateExplosions() {
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        const explosion = gameState.explosions[i];
        
        // Update frame
        explosion.frame++;
        
        // Remove if animation complete
        if (explosion.frame >= sprites.explosion.length) {
            gameState.explosions.splice(i, 1);
        }
    }
}

// Check collisions between game objects
function checkCollisions() {
    // Check bullet-asteroid collisions
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        
        for (let j = gameState.asteroids.length - 1; j >= 0; j--) {
            const asteroid = gameState.asteroids[j];
            
            // Simple circle collision
            const distance = Math.sqrt(
                Math.pow(bullet.x - asteroid.x, 2) + 
                Math.pow(bullet.y - asteroid.y, 2)
            );
            
            if (distance < asteroid.size / 2) {
                // Collision detected
                gameState.bullets.splice(i, 1);
                gameState.asteroids.splice(j, 1);
                
                // Add explosion
                gameState.explosions.push({
                    x: asteroid.x,
                    y: asteroid.y,
                    frame: 0
                });
                
                // Add score to bullet owner
                if (gameState.players[bullet.owner]) {
                    gameState.players[bullet.owner].score += 10;
                    
                    // Update score for the player
                    if (bullet.owner === playerId) {
                        score += 10;
                    }
                    
                    // Update scoreboard
                    updateScoreboard();
                }
                
                // Play explosion sound
                if (sounds.explosion) {
                    sounds.explosion.start();
                }
                
                break;
            }
        }
    }
    
    // Check player-asteroid collisions
    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        
        for (let i = gameState.asteroids.length - 1; i >= 0; i--) {
            const asteroid = gameState.asteroids[i];
            
            // Simple circle collision
            const distance = Math.sqrt(
                Math.pow(player.x - asteroid.x, 2) + 
                Math.pow(player.y - asteroid.y, 2)
            );
            
            if (distance < (asteroid.size / 2) + 15) {
                // Collision detected
                gameState.asteroids.splice(i, 1);
                
                // Add explosion
                gameState.explosions.push({
                    x: asteroid.x,
                    y: asteroid.y,
                    frame: 0
                });
                
                // Reduce player lives
                player.lives--;
                
                // Update scoreboard
                updateScoreboard();
                
                // Play explosion sound
                if (sounds.explosion) {
                    sounds.explosion.start();
                }
                
                // Check if player is out of lives
                if (player.lives <= 0) {
                    // If human player is out of lives, end the game
                    if (playerId === playerId && !player.isAI) {
                        endGame();
                    }
                    // If AI player is out of lives, just remove them
                    else if (player.isAI) {
                        delete gameState.players[playerId];
                        updateScoreboard();
                    }
                }
                
                break;
            }
        }
    }
}

// Update scoreboard
function updateScoreboard() {
    scoreboardDiv.innerHTML = '';
    
    for (const id in gameState.players) {
        const player = gameState.players[id];
        
        const playerElement = document.createElement('div');
        playerElement.className = 'player-score';
        playerElement.style.backgroundColor = player.color;
        playerElement.innerHTML = `
            ${player.name}: ${player.score} pts 
            <span class="lives">${'❤️'.repeat(player.lives)}</span>
        `;
        
        scoreboardDiv.appendChild(playerElement);
    }
}

// Render game graphics
function renderGame() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw space background
    drawBackground();
    
    // Draw asteroids
    drawAsteroids();
    
    // Draw bullets
    drawBullets();
    
    // Draw players
    drawPlayers();
    
    // Draw explosions
    drawExplosions();
}

// Draw space background with stars
function drawBackground() {
    // Dark background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars (static for performance)
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 100; i++) {
        const x = (i * 17) % canvas.width;
        const y = (i * 23) % canvas.height;
        const size = (i % 3) + 1;
        
        ctx.fillRect(x, y, size, size);
    }
}

// Draw asteroids
function drawAsteroids() {
    for (const asteroid of gameState.asteroids) {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation * Math.PI / 180);
        ctx.drawImage(
            sprites.asteroid, 
            -asteroid.size / 2, 
            -asteroid.size / 2, 
            asteroid.size, 
            asteroid.size
        );
        ctx.restore();
    }
}

// Draw bullets
function drawBullets() {
    for (const bullet of gameState.bullets) {
        ctx.drawImage(sprites.bullet, bullet.x - 4, bullet.y - 4);
    }
}

// Draw players
function drawPlayers() {
    for (const id in gameState.players) {
        const player = gameState.players[id];
        
        ctx.save();
        ctx.translate(player.x, player.y);
        
        // Rotate player ship based on direction
        if (player.isAI) {
            // No rotation needed - both ships face the same direction
        }
        
        ctx.drawImage(player.isAI ? sprites.enemy : sprites.player, -20, -20);
        
        ctx.restore();
        
        // Draw player name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.x, player.y + (player.isAI ? -25 : 30));
    }
}

// Draw explosions
function drawExplosions() {
    for (const explosion of gameState.explosions) {
        if (explosion.frame < sprites.explosion.length) {
            ctx.drawImage(
                sprites.explosion[explosion.frame], 
                explosion.x - 30, 
                explosion.y - 30
            );
        }
    }
}

// End the game
function endGame() {
    // Stop game activity
    gameState.gameActive = false;
    gameState.gameOver = true;
    
    // Clear timers
    if (asteroidSpawnTimer) {
        clearInterval(asteroidSpawnTimer);
        asteroidSpawnTimer = null;
    }
    
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    // Show game over screen
    showGameOverScreen();
    
    // Play game over sound
    if (sounds.gameOver) {
        sounds.gameOver.start();
    }
}

// Show game over screen
function showGameOverScreen() {
    // Update final scores
    finalScoresDiv.innerHTML = '';
    
    // Sort players by score
    const sortedPlayers = Object.values(gameState.players)
        .sort((a, b) => b.score - a.score);
    
    for (const player of sortedPlayers) {
        const playerElement = document.createElement('div');
        playerElement.className = 'mb-2';
        playerElement.innerHTML = `
            <span style="color: ${player.color}">${player.name}</span>: ${player.score} points
        `;
        
        // Highlight winner
        if (player === sortedPlayers[0]) {
            playerElement.style.fontWeight = 'bold';
            playerElement.style.fontSize = '1.2em';
        }
        
        finalScoresDiv.appendChild(playerElement);
    }
    
    // Show game over screen
    gameOverScreen.style.display = 'block';
}
