// Game State
const gameState = {
    bloodEnergy: 0,
    cursedPower: 0,
    level: 1,
    clickPower: 1,
    powerPerSecond: 0,
    
    upgrades: {
        bloodSpike: {
            level: 0,
            cost: 10,
            costMultiplier: 1.15,
            effect: (level) => level * 1
        },
        energyFlow: {
            level: 0,
            cost: 50,
            costMultiplier: 1.15,
            effect: (level) => level * 1
        },
        bloodClone: {
            level: 0,
            cost: 200,
            costMultiplier: 1.15,
            effect: (level) => level * 5
        },
        convergence: {
            level: 0,
            cost: 500,
            costMultiplier: 1.15,
            effect: (level) => (level > 0 ? 2 : 1)
        }
    }
};

// DOM Elements
const bloodEnergyEl = document.getElementById('bloodEnergy');
const cursedPowerEl = document.getElementById('cursedPower');
const levelEl = document.getElementById('level');
const clickBtn = document.getElementById('clickBtn');
const clickPowerEl = document.getElementById('clickPower');
const powerPerSecondEl = document.getElementById('powerPerSecond');
const totalPowerEl = document.getElementById('totalPower');
const floatingTextEl = document.getElementById('floatingText');
const mainGame = document.querySelector('.main-game');

// Click Handler
clickBtn.addEventListener('click', () => {
    const energyGain = gameState.clickPower;
    gameState.bloodEnergy += energyGain;
    
    // Add cursed power gain
    const powerMultiplier = gameState.upgrades.convergence.level > 0 ? 2 : 1;
    gameState.cursedPower += energyGain * powerMultiplier;
    
    // Show floating text
    showFloatingText(`+${energyGain}`, event.clientX, event.clientY);
    
    // Update level based on cursed power
    updateLevel();
    
    // Update UI
    updateDisplay();
});

// Show floating text animation
function showFloatingText(text, x, y) {
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-text';
    floatEl.textContent = text;
    floatEl.style.left = x + 'px';
    floatEl.style.top = y + 'px';
    mainGame.appendChild(floatEl);
    
    setTimeout(() => floatEl.remove(), 1000);
}

// Update level based on cursed power
function updateLevel() {
    const newLevel = Math.floor(gameState.cursedPower / 100) + 1;
    if (newLevel !== gameState.level) {
        gameState.level = newLevel;
    }
}

// Calculate current upgrade cost
function getUpgradeCost(upgradeName) {
    const upgrade = gameState.upgrades[upgradeName];
    return Math.floor(upgrade.cost * Math.pow(upgrade.costMultiplier, upgrade.level));
}

// Upgrade handler
document.querySelectorAll('.upgrade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const upgradeName = btn.dataset.upgrade;
        const upgrade = gameState.upgrades[upgradeName];
        const cost = getUpgradeCost(upgradeName);
        
        if (gameState.bloodEnergy >= cost) {
            gameState.bloodEnergy -= cost;
            upgrade.level += 1;
            
            // Apply upgrade effects
            applyUpgrade(upgradeName);
            
            updateDisplay();
            showFloatingText(`${upgradeName} Upgraded!`, window.innerWidth / 2, window.innerHeight / 2);
        }
    });
});

// Apply upgrade effects
function applyUpgrade(upgradeName) {
    const upgrade = gameState.upgrades[upgradeName];
    
    switch (upgradeName) {
        case 'bloodSpike':
            gameState.clickPower += upgrade.effect(1);
            break;
        case 'energyFlow':
            gameState.powerPerSecond += upgrade.effect(1);
            break;
        case 'bloodClone':
            gameState.clickPower += upgrade.effect(1);
            break;
        case 'convergence':
            // Passive effect applied on click
            break;
    }
}

// Update all display elements
function updateDisplay() {
    bloodEnergyEl.textContent = Math.floor(gameState.bloodEnergy);
    cursedPowerEl.textContent = Math.floor(gameState.cursedPower);
    levelEl.textContent = gameState.level;
    clickPowerEl.textContent = gameState.clickPower;
    powerPerSecondEl.textContent = gameState.powerPerSecond;
    totalPowerEl.textContent = Math.floor(gameState.cursedPower);
    
    // Update upgrade buttons and levels
    Object.keys(gameState.upgrades).forEach(upgradeName => {
        const upgrade = gameState.upgrades[upgradeName];
        const cost = getUpgradeCost(upgradeName);
        const btn = document.querySelector(`[data-upgrade="${upgradeName}"]`);
        const levelEl = document.getElementById(`${upgradeName}-level`);
        
        btn.textContent = `Upgrade (${cost})`;
        btn.disabled = gameState.bloodEnergy < cost;
        levelEl.textContent = upgrade.level;
    });
}

// Passive income loop (power per second)
setInterval(() => {
    gameState.bloodEnergy += gameState.powerPerSecond;
    
    const powerMultiplier = gameState.upgrades.convergence.level > 0 ? 2 : 1;
    gameState.cursedPower += gameState.powerPerSecond * powerMultiplier;
    
    updateLevel();
    updateDisplay();
}, 1000);

// Initial display update
updateDisplay();

// Save game to localStorage
setInterval(() => {
    localStorage.setItem('chosoGameState', JSON.stringify(gameState));
}, 5000);

// Load game from localStorage
window.addEventListener('load', () => {
    const savedState = localStorage.getItem('chosoGameState');
    if (savedState) {
        const loaded = JSON.parse(savedState);
        Object.assign(gameState, loaded);
        updateDisplay();
    }
});