// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Adjust canvas for high DPI
const dpr = window.devicePixelRatio || 1;
canvas.width = 1000 * dpr;
canvas.height = 600 * dpr;
ctx.scale(dpr, dpr);

// Game variables
const gameWidth = 1000;
const gameHeight = 600;
let gameRunning = true;
let score = 0;
let wave = 1;
let combo = 0;

// Player object
const player = {
    x: gameWidth / 2,
    y: gameHeight / 2,
    width: 24,
    height: 28,
    speed: 5,
    health: 100,
    maxHealth: 100,
    vx: 0,
    vy: 0,
    attacking: false,
    attackCooldown: 0,
    dodgeRolling: false,
    dodgeCooldown: 0,
    invulnerable: 0
};

// Enemies array
let enemies = [];

// Blood projectiles
let bloodProjectiles = [];

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if (e.key === ' ') {
        e.preventDefault();
        playerAttack();
    }
    if (e.key.toLowerCase() === 'q') {
        e.preventDefault();
        playerDodge();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Player movement
function updatePlayer() {
    player.vx = 0;
    player.vy = 0;
    
    if (keys['arrowup'] || keys['w']) player.vy = -player.speed;
    if (keys['arrowdown'] || keys['s']) player.vy = player.speed;
    if (keys['arrowleft'] || keys['a']) player.vx = -player.speed;
    if (keys['arrowright'] || keys['d']) player.vx = player.speed;
    
    player.x += player.vx;
    player.y += player.vy;
    
    // Boundary checking
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > gameWidth) player.x = gameWidth - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > gameHeight) player.y = gameHeight - player.height;
    
    // Update cooldowns
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.dodgeCooldown > 0) player.dodgeCooldown--;
    if (player.invulnerable > 0) player.invulnerable--;
}

// Player attack
function playerAttack() {
    if (player.attackCooldown <= 0) {
        // Create blood spike projectile
        bloodProjectiles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            vx: 8,
            vy: 0,
            width: 10,
            height: 5,
            damage: 20,
            life: 100
        });
        
        player.attackCooldown = 15;
        player.attacking = true;
        setTimeout(() => { player.attacking = false; }, 100);
    }
}

// Player dodge roll
function playerDodge() {
    if (player.dodgeCooldown <= 0) {
        player.dodgeRolling = true;
        player.invulnerable = 30;
        player.dodgeCooldown = 60;
        
        // Quick dash forward
        player.x += player.vx * 15;
        player.y += player.vy * 15;
        
        setTimeout(() => { player.dodgeRolling = false; }, 300);
    }
}

// Enemy spawning
function spawnEnemies() {
    const enemyCount = 2 + wave;
    for (let i = 0; i < enemyCount; i++) {
        let x, y;
        const side = Math.random();
        
        if (side < 0.25) { x = Math.random() * gameWidth; y = -30; }
        else if (side < 0.5) { x = Math.random() * gameWidth; y = gameHeight + 30; }
        else if (side < 0.75) { x = -30; y = Math.random() * gameHeight; }
        else { x = gameWidth + 30; y = Math.random() * gameHeight; }
        
        enemies.push({
            x: x,
            y: y,
            width: 18,
            height: 22,
            speed: 2 + wave * 0.5,
            health: 30 + wave * 10,
            maxHealth: 30 + wave * 10,
            damage: 10 + wave * 2,
            attackCooldown: 0
        });
    }
}

// Update enemies
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        // Move towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }
        
        // Enemy attack
        if (dist < 80) {
            if (enemy.attackCooldown <= 0) {
                if (player.invulnerable <= 0) {
                    player.health -= enemy.damage;
                    player.invulnerable = 15;
                }
                enemy.attackCooldown = 60;
            }
        }
        
        if (enemy.attackCooldown > 0) enemy.attackCooldown--;
        
        // Remove dead enemies
        if (enemy.health <= 0) {
            enemies.splice(index, 1);
            score += 100 * wave;
            combo++;
        }
    });
    
    // Spawn new wave when all enemies defeated
    if (enemies.length === 0) {
        wave++;
        combo = 0;
        spawnEnemies();
    }
}

// Update blood projectiles
function updateProjectiles() {
    bloodProjectiles.forEach((proj, index) => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.life--;
        
        // Check collision with enemies
        enemies.forEach((enemy, eIndex) => {
            if (isColliding(proj, enemy)) {
                enemy.health -= proj.damage;
                bloodProjectiles.splice(index, 1);
            }
        });
        
        // Remove if off screen
        if (proj.x > gameWidth || proj.y < 0 || proj.y > gameHeight || proj.life <= 0) {
            bloodProjectiles.splice(index, 1);
        }
    });
}

// Collision detection
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Draw Choso - Small-Medium pixel art (24x28)
function drawChosoPixelArt(x, y, isInvulnerable) {
    ctx.save();
    
    if (isInvulnerable && Math.floor(isInvulnerable / 5) % 2) {
        ctx.globalAlpha = 0.5;
    }
    
    const sx = x;
    const sy = y;
    
    // Black hair (top)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(sx + 4, sy, 16, 4);
    ctx.fillRect(sx + 7, sy - 2, 10, 2);
    
    // White eyes (large)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx + 5, sy + 3, 3, 3);
    ctx.fillRect(sx + 16, sy + 3, 3, 3);
    
    // Eye pupils (black)
    ctx.fillStyle = '#000000';
    ctx.fillRect(sx + 5, sy + 3, 1, 2);
    ctx.fillRect(sx + 16, sy + 3, 1, 2);
    
    // Face (light skin)
    ctx.fillStyle = '#E8D4C8';
    ctx.fillRect(sx + 4, sy + 6, 16, 3);
    
    // White jacket/shirt
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(sx + 2, sy + 9, 20, 6);
    
    // Jacket sleeves (white)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx + 1, sy + 9, 2, 4);
    ctx.fillRect(sx + 21, sy + 9, 2, 4);
    
    // Dark vest (navy)
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(sx + 7, sy + 9, 10, 5);
    
    // Dark pants (navy)
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(sx + 5, sy + 15, 14, 9);
    
    // White socks
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(sx + 6, sy + 22, 3, 3);
    ctx.fillRect(sx + 15, sy + 22, 3, 3);
    
    // Dark shoes
    ctx.fillStyle = '#3d2817';
    ctx.fillRect(sx + 6, sy + 25, 3, 3);
    ctx.fillRect(sx + 15, sy + 25, 3, 3);
    
    // Attack effect
    if (player.attacking) {
        ctx.strokeStyle = '#FF3333';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.strokeRect(sx - 1, sy - 2, 26, 30);
    }
    
    ctx.restore();
}

// Draw enemy spirit
function drawEnemySpirit(x, y) {
    ctx.save();
    
    const sx = x;
    const sy = y;
    
    // Enemy body
    ctx.fillStyle = '#6B4C9A';
    ctx.fillRect(sx + 1, sy + 1, 16, 10);
    
    // Darker center
    ctx.fillStyle = '#4B2C7A';
    ctx.fillRect(sx + 3, sy + 2, 12, 4);
    
    // Eyes (red)
    ctx.fillStyle = '#FF3333';
    ctx.fillRect(sx + 4, sy + 3, 2, 2);
    ctx.fillRect(sx + 12, sy + 3, 2, 2);
    
    // Mouth
    ctx.fillStyle = '#FF3333';
    ctx.fillRect(sx + 5, sy + 7, 8, 1);
    
    ctx.restore();
}

// Draw blood projectiles
function drawProjectiles() {
    bloodProjectiles.forEach(proj => {
        ctx.fillStyle = '#FF3333';
        ctx.fillRect(proj.x, proj.y, 4, 2);
        ctx.fillRect(proj.x + 1, proj.y - 1, 2, 4);
        ctx.fillRect(proj.x - 1, proj.y + 1, 6, 1);
    });
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(26, 0, 51, 0.2)';
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    
    // Draw grid background
    ctx.strokeStyle = 'rgba(255, 68, 68, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < gameWidth; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, gameHeight);
        ctx.stroke();
    }
    for (let i = 0; i < gameHeight; i += 32) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(gameWidth, i);
        ctx.stroke();
    }
    
    // Draw player (Choso)
    drawChosoPixelArt(player.x, player.y, player.invulnerable);
    
    // Draw enemies
    enemies.forEach(enemy => {
        drawEnemySpirit(enemy.x, enemy.y);
        
        // Health bar
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(enemy.x, enemy.y - 4, (enemy.health / enemy.maxHealth) * enemy.width, 2);
        ctx.strokeStyle = '#ff8888';
        ctx.strokeRect(enemy.x, enemy.y - 4, enemy.width, 2);
    });
    
    // Draw projectiles
    drawProjectiles();
    
    // Draw wave and combo text
    ctx.fillStyle = '#FF3333';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Wave: ${wave}`, 20, 40);
    ctx.fillText(`Combo: ${combo}`, 20, 70);
    
    // Update HUD
    updateHUD();
}

// Update HUD
function updateHUD() {
    document.getElementById('playerHealth').style.width = (player.health / player.maxHealth) * 100 + '%';
    document.getElementById('healthText').textContent = Math.max(0, Math.floor(player.health)) + '/' + player.maxHealth;
    
    if (enemies.length > 0) {
        const firstEnemy = enemies[0];
        document.getElementById('enemyHealth').style.width = (firstEnemy.health / firstEnemy.maxHealth) * 100 + '%';
        document.getElementById('enemyHealthText').textContent = Math.max(0, Math.floor(firstEnemy.health)) + '/' + firstEnemy.maxHealth;
    }
    
    document.getElementById('score').textContent = score;
    document.getElementById('wave').textContent = wave;
    document.getElementById('combo').textContent = combo;
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    updatePlayer();
    updateEnemies();
    updateProjectiles();
    draw();
    
    // Check if player is dead
    if (player.health <= 0) {
        gameRunning = false;
        endGame();
        return;
    }
    
    requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = `Final Score: ${score} | Waves Survived: ${wave}`;
}

// Start game
spawnEnemies();
gameLoop();
