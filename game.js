const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const hubScreen = document.getElementById('hub-screen');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const levelUpScreen = document.getElementById('level-up-screen');
const cardsContainer = document.getElementById('cards-container');
const hud = document.getElementById('hud');

const scoreDisplay = document.getElementById('score');
const gemsDisplay = document.getElementById('gems-display');
const finalScoreDisplay = document.getElementById('final-score');
const timerDisplay = document.getElementById('timer');

const xpBarContainer = document.getElementById('xp-bar-container');
const xpBarFill = document.getElementById('xp-bar-fill');
const levelNumDisplay = document.getElementById('level-num');

const btnDayAtShop = document.getElementById('select-day-at-shop');
const btnNormal = document.getElementById('start-normal-btn');
const btnAllen = document.getElementById('start-allen-btn');
const restartBtn = document.getElementById('restart-btn');
const restartTimerDisplay = document.getElementById('restart-timer');
const menuBtn = document.getElementById('menu-btn');
const reviveBtn = document.getElementById('revive-btn');
const finalGemsDisplay = document.getElementById('final-gems');
const pbScoreDisplay = document.getElementById('pb-score');
const pbGemsDisplay = document.getElementById('pb-gems');

// Images
const imgPlayer = document.getElementById('img-player');
const imgEnemy = document.getElementById('img-enemy');
const imgEnemyCharger = document.getElementById('img-enemy-charger');
const imgEnemyTank = document.getElementById('img-enemy-tank');
const imgEnemyGhost = document.getElementById('img-enemy-ghost');
const imgItem = document.getElementById('img-item');
const imgBg = document.getElementById('img-bg');
const imgPowerNuke = document.getElementById('img-power-nuke');
const imgPowerStar = document.getElementById('img-power-star');
const imgPowerSlow = document.getElementById('img-power-slow');

// Game State
let gameState = 'START'; 
let globalDifficulty = 'normal'; 
let score = 0;
let animationId;
let lastFrameTime = 0;

// RPG Mechanics
let gameTimeSeconds = 0;
let frameDeltaAccumulator = 0;
let totalXp = 0;
let level = 1;
let xpToNextLevel = 5;

// Special Wave State
let specialWaveActive = false;
let specialWaveCompleted = false;
let ghostsUnlocked = false;

// Upgrades State
const playerUpgrades = {
    blaster: 0,
    fireRate: 0,
    nova: 0,
    magnet: 0,
    speed: 0,
    bulletSpeed: 0,
    pierce: 0,
    orbit: 0,
    hawk: 0,
    nuke: 0,
    tims: 0,
    aura: 0,
    laser: 0
};

let blasterCooldown = 0;
let nukeCooldown = 0;
let timsCooldown = 0;
let postLevelUpGrace = 0; 
let laserCooldown = 0;
let novaCooldown = 0;

// Shield Mechanic
let shieldCharges = 0;
let shieldCooldown = 0;

// Rare Power Ups State
let invincibleTimer = 0;
let timeFreezeTimer = 0; // Acts as a "slow" now
let canRevive = true;

// Map & Camera
const MAP_WIDTH = 6000;
const MAP_HEIGHT = 6000;
const camera = { x: 0, y: 0 };
let cameraZoom = 1.0;
let autoZoom = 1.0;
let userZoom = 1.0;
let targetUserZoom = 1.0;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;

// Inputs
const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (window.innerWidth < 800) {
        autoZoom = window.innerWidth / 800;
    } else {
        autoZoom = 1.0;
    }
    cameraZoom = autoZoom * userZoom;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Scroll wheel zoom
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    targetUserZoom += e.deltaY * -0.0012;
    targetUserZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetUserZoom));
}, { passive: false });

// Pinch zoom state
let lastPinchDist = 0;

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 2) {
        // Pinch zoom
        const d = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastPinchDist > 0) {
            targetUserZoom *= d / lastPinchDist;
            targetUserZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetUserZoom));
        }
        lastPinchDist = d;
    } else if (e.touches.length === 1) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
}, { passive: false });

window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        lastPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    } else if (e.touches.length === 1) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
}, { passive: false });

window.addEventListener('touchend', () => { lastPinchDist = 0; });

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            pauseScreen.classList.remove('hidden');
            pauseScreen.classList.add('active');
        } else if (gameState === 'PAUSED') {
            gameState = 'PLAYING';
            pauseScreen.classList.remove('active');
            setTimeout(() => pauseScreen.classList.add('hidden'), 300);
        }
    }
});

// Math Helpers
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function lerp(start, end, amt) { return (1 - amt) * start + amt * end; }

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Apply text strings from content.js
// Apply text strings from content.js
function applyGameText() {
    // Safety check if GAME_TEXT failed to load
    if (typeof GAME_TEXT === 'undefined') {
        console.error("AL67X Error: GAME_TEXT not found in content.js!");
        return;
    }
    const t = GAME_TEXT;
    const s = (id, txt) => { const el = document.getElementById(id); if (el && txt !== undefined) el.textContent = txt; };
    const h = (id, txt) => { const el = document.getElementById(id); if (el && txt !== undefined) el.innerHTML = txt; };
    
    // Hub
    s('hub-title', t.hub.title);
    s('hub-subtitle', t.hub.subtitle);
    s('hub-card1-title', t.hub.modeCard1Title);
    s('hub-card1-desc', t.hub.modeCard1Desc);
    s('hub-card2-title', t.hub.modeCard2Title);
    s('hub-card2-desc', t.hub.modeCard2Desc);
    
    // Start Screen
    s('start-title', t.startScreen.title);
    h('start-desc', t.startScreen.desc);
    s('start-normal-btn', t.startScreen.normalBtn);
    s('start-allen-btn', t.startScreen.allenBtn);
    
    // Game Over
    s('gameover-title', t.gameOver.title);
    s('gameover-desc', t.gameOver.desc);
    s('gameover-score-label', t.gameOver.scoreLabel);
    s('gameover-gems-label', t.gameOver.gemsLabel);
    s('revive-btn-text', t.gameOver.reviveBtn);
    const pbLabels = document.querySelectorAll('.pb-label');
    pbLabels.forEach(el => {
        const span = el.querySelector('span');
        el.innerHTML = `${t.gameOver.pbLabel} ${span ? span.outerHTML : '<span>0</span>'}`;
    });
    s('restart-btn-text', t.gameOver.playAgainBtn);
    s('menu-btn', t.gameOver.menuBtn);
    
    // HUD
    s('hud-score-label', t.hud.scoreLabel);
    s('hud-gems-label', t.hud.gemsLabel);
    s('hud-level-prefix', t.hud.levelPrefix);
    
    // Misc
    s('pause-title', t.pause.title);
    s('pause-desc', t.pause.desc);
    s('levelup-title', t.levelUp.title);
    s('levelup-subtitle', t.levelUp.subtitle);
}

// Initial call on load
window.addEventListener('DOMContentLoaded', applyGameText);
applyGameText(); // Direct call as a backup if DOM is already ready

// ── GEM CLASS ───────────────────────────────────────────────
class Gem {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 60;
        this.y = y + (Math.random() - 0.5) * 60;
        this.radius = 10;
        this.vx = (Math.random() - 0.5) * 220;
        this.vy = (Math.random() - 0.5) * 220 - 80;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.dead = false;
    }
    update(dt) {
        this.vx *= Math.pow(0.15, dt);
        this.vy *= Math.pow(0.15, dt);
        this.vy += 60 * dt;

        const magnetRange = 500 + (playerUpgrades.magnet * 400);
        const d = dist(mainPlayer.x, mainPlayer.y, this.x, this.y);
        if (d < magnetRange) {
            const angle = Math.atan2(mainPlayer.y - this.y, mainPlayer.x - this.x);
            const pull = 900 * dt * (1 - (d / magnetRange) * 0.5);
            this.x += Math.cos(angle) * pull;
            this.y += Math.sin(angle) * pull;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (dist(this.x, this.y, mainPlayer.x, mainPlayer.y) < mainPlayer.radius + this.radius + 10) {
            this.dead = true;
            gemsCount++;
            gemsDisplay.innerText = gemsCount;
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const pulse = Math.sin(performance.now() * 0.006 + this.floatOffset) * 2;
        const r = this.radius + pulse;
        ctx.shadowBlur = 14 + pulse;
        ctx.shadowColor = '#00ff88';
        // Diamond shape
        ctx.fillStyle = '#00e87a';
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.65, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.65, 0);
        ctx.closePath();
        ctx.fill();
        // Highlight facet
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.65);
        ctx.lineTo(r * 0.28, -r * 0.1);
        ctx.lineTo(0, r * 0.12);
        ctx.lineTo(-r * 0.28, -r * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class Bomb {
    constructor(x, y, maxRadius) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = maxRadius;
        this.timer = 1.0; 
        this.exploded = false;
        this.dead = false;
        this.enemiesHit = [];
    }
    update(dt) {
        if (this.exploded) {
            this.radius += 1000 * dt; 
            if (this.radius >= this.maxRadius) {
                this.dead = true;
            } else {
                for (let enemy of enemies) {
                    if (!enemy.dead && !this.enemiesHit.includes(enemy) && dist(this.x, this.y, enemy.x, enemy.y) < this.radius + enemy.radius) {
                        enemy.takeDamage();
                        this.enemiesHit.push(enemy); 
                    }
                }
            }
        } else {
            this.timer -= dt;
            if (this.timer <= 0) this.exploded = true;
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (!this.exploded) {
            ctx.fillStyle = '#ffae00';
            const pulse = this.radius + Math.sin(performance.now() / 50) * 8;
            ctx.beginPath(); ctx.arc(0, 0, pulse, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.strokeStyle = `rgba(255, 174, 0, ${1 - (this.radius / this.maxRadius)})`;
            ctx.lineWidth = 20;
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.stroke();
            
            ctx.fillStyle = `rgba(255, 50, 50, ${0.4 - (this.radius / this.maxRadius) * 0.4})`;
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    }
}

class LaserBeam {
    constructor(yPos) {
        this.y = yPos;
        this.height = 100 + (playerUpgrades.laser * 50);
        this.life = 0.5;
        this.dead = false;
        this.enemiesHit = [];
    }
    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.dead = true;
            return;
        }
        for (let enemy of enemies) {
            if (!enemy.dead && !this.enemiesHit.includes(enemy)) {
                if (enemy.y > this.y - this.height/2 && enemy.y < this.y + this.height/2) {
                    enemy.takeDamage();
                    this.enemiesHit.push(enemy);
                }
            }
        }
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / 0.5);
        ctx.fillStyle = '#00ffcc';
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#00ffcc';
        ctx.fillRect(0, this.y - this.height/2, MAP_WIDTH, this.height);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.fillRect(0, this.y - this.height/4, MAP_WIDTH, this.height/2);
        ctx.restore();
    }
}

class Player {
    constructor() {
        this.x = MAP_WIDTH / 2;
        this.y = MAP_HEIGHT / 2;
        this.radius = 50;
        this.baseSpeed = 600; 
        this.facingLeft = false;
    }

    update(dt) {
        const targetX = (mouse.x / cameraZoom) + camera.x;
        const targetY = (mouse.y / cameraZoom) + camera.y;

        let currentSpeed = this.baseSpeed * (1 + (playerUpgrades.speed * 0.25));
        if (invincibleTimer > 0) {
            currentSpeed *= 1.5; 
        }

        const moveDist = currentSpeed * dt;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        
        if (dx < -5) this.facingLeft = true;
        else if (dx > 5) this.facingLeft = false;

        const distanceToMouse = Math.hypot(dx, dy);

        if (distanceToMouse > moveDist) {
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * moveDist;
            this.y += Math.sin(angle) * moveDist;
        } else {
            this.x = targetX;
            this.y = targetY;
        }
        
        if (this.x < this.radius) this.x = this.radius;
        if (this.x > MAP_WIDTH - this.radius) this.x = MAP_WIDTH - this.radius;
        if (this.y < this.radius) this.y = this.radius;
        if (this.y > MAP_HEIGHT - this.radius) this.y = MAP_HEIGHT - this.radius;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.facingLeft) ctx.scale(-1, 1);
        
        // Aura Shield render
        if (playerUpgrades.aura > 0 && shieldCharges > 0) {
            ctx.strokeStyle = `rgba(0, 255, 136, ${0.5 + Math.sin(performance.now()/100)*0.3})`;
            ctx.lineWidth = 15;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ff88';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 40, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#00ff88';
            for(let i=0; i<shieldCharges; i++) {
                const angle = (Math.PI*2 / shieldCharges) * i + (performance.now()/500);
                const ox = Math.cos(angle) * (this.radius + 40);
                const oy = Math.sin(angle) * (this.radius + 40);
                ctx.beginPath();
                ctx.arc(ox, oy, 10, 0, Math.PI*2);
                ctx.fill();
            }
        }

        // Spotlight Glow 
        const grad = ctx.createRadialGradient(0, 0, this.radius, 0, 0, this.radius * 4);
        
        if (invincibleTimer > 0) {
            const hue = (performance.now()/5) % 360;
            grad.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.8)`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
            grad.addColorStop(0.5, 'rgba(0, 243, 255, 0.2)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 30;

        if (imgPlayer.complete && imgPlayer.naturalHeight !== 0) {
            ctx.drawImage(imgPlayer, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else {
            ctx.fillStyle = '#00f3ff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class Follower {
    constructor(index) {
        this.index = index;
        this.x = mainPlayer.x;
        this.y = mainPlayer.y;
        this.radius = 30;
        this.speed = 0.05 + Math.random() * 0.05;
        this.facingLeft = false;
        this.recalculateOffset(index);
    }

    recalculateOffset(newIndex) {
        this.index = newIndex;
        const maxSpread = 80 + (newIndex * 4);
        const angle = Math.random() * Math.PI * 2;
        const distOffset = Math.random() * maxSpread;
        this.offsetX = Math.cos(angle) * distOffset;
        this.offsetY = Math.sin(angle) * distOffset;
    }

    update() {
        const targetX = mainPlayer.x + this.offsetX;
        const targetY = mainPlayer.y + this.offsetY;
        
        const dx = targetX - this.x;
        if (dx < -1) this.facingLeft = true;
        else if (dx > 1) this.facingLeft = false;
        
        this.x = lerp(this.x, targetX, this.speed);
        this.y = lerp(this.y, targetY, this.speed);
    }

    draw() {
        ctx.save();
        if (postLevelUpGrace > 0 && Math.floor(performance.now() / 150) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        ctx.translate(this.x, this.y);
        
        if (this.facingLeft) ctx.scale(-1, 1);
        
        if (invincibleTimer > 0) {
            const hue = ((performance.now() + this.index*50)/5) % 360;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
            ctx.fill();
        }

        if (imgPlayer.complete && imgPlayer.naturalHeight !== 0) {
            ctx.drawImage(imgPlayer, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else {
            ctx.fillStyle = '#80f9ff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class EnemyBase {
    constructor(radius, speedBase, imgRef) {
        this.radius = radius;
        // Spawn at a safe radial distance from the player
        const spawnAngle = Math.random() * Math.PI * 2;
        const spawnDist = 1200 + Math.random() * 600;
        this.x = mainPlayer.x + Math.cos(spawnAngle) * spawnDist;
        this.y = mainPlayer.y + Math.sin(spawnAngle) * spawnDist;
        this.x = Math.max(this.radius + 10, Math.min(MAP_WIDTH - this.radius - 10, this.x));
        this.y = Math.max(this.radius + 10, Math.min(MAP_HEIGHT - this.radius - 10, this.y));
        
        let diffMultiplier = 1.0;
        if (globalDifficulty === 'allen') diffMultiplier = 1.2;
        
        this.baseSpeed = speedBase * diffMultiplier;
        
        this.vx = 0;
        this.vy = 0;
        this.eatCooldown = 0;
        this.hp = 1;
        this.img = imgRef;
        this.dead = false;
        this.type = 'base';
        this.facingLeft = false;
        this.glowColor = '255, 31, 90'; // rgb red
    }
    
    getSpeed() {
        // Slow effect from time freeze powerup
        const slowFactor = timeFreezeTimer > 0 ? 0.3 : 1.0;
        return this.baseSpeed * slowFactor;
    }

    takeDamage() {
        this.hp--;
        if (this.hp <= 0) this.dead = true;
    }

    update(dt) { }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.facingLeft) ctx.scale(-1, 1);
        
        // Spotlight glow for visibility
        const grad = ctx.createRadialGradient(0, 0, this.radius, 0, 0, this.radius * 3);
        grad.addColorStop(0, `rgba(${this.glowColor}, 0.5)`);
        grad.addColorStop(1, `rgba(${this.glowColor}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowColor = `rgb(${this.glowColor})`;
        ctx.shadowBlur = 20;

        if (this.img && this.img.complete && this.img.naturalHeight !== 0) {
            ctx.drawImage(this.img, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else {
            ctx.fillStyle = `rgb(${this.glowColor})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        ctx.restore();
    }
}

class EnemyNormal extends EnemyBase {
    constructor() {
        super(60, 150 + (gameTimeSeconds * 0.5), imgEnemy);
    }
    update(dt) {
        const dx = mainPlayer.x - this.x;
        const dy = mainPlayer.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        let currentSpeed = this.getSpeed();
        this.vx = Math.cos(angle) * currentSpeed;
        this.vy = Math.sin(angle) * currentSpeed;
        
        if (this.vx < -0.1) this.facingLeft = true;
        else if (this.vx > 0.1) this.facingLeft = false;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.eatCooldown > 0) this.eatCooldown -= dt;
    }
}

class EnemyCharger extends EnemyBase {
    constructor() {
        super(40, 600, imgEnemyCharger);
        this.type = 'charger';
        this.glowColor = '162, 0, 255'; // rgb purple
        this.chargeTimer = 2.0;
        this.isCharging = false;
        this.chargeDirX = 0;
        this.chargeDirY = 0;
    }
    update(dt) {
        if (this.eatCooldown > 0) this.eatCooldown -= dt;
        
        let currentSpeed = this.getSpeed();

        if (this.isCharging) {
            this.x += this.chargeDirX * currentSpeed * dt;
            this.y += this.chargeDirY * currentSpeed * dt;
            this.chargeTimer -= dt;
            if (this.chargeTimer <= 0) {
                this.isCharging = false;
                this.chargeTimer = 2.0;
            }
        } else {
            const dx = mainPlayer.x - this.x;
            const dy = mainPlayer.y - this.y;
            const angle = Math.atan2(dy, dx);
            
            this.vx = Math.cos(angle) * (currentSpeed * 0.3);
            this.vy = Math.sin(angle) * (currentSpeed * 0.3);
            
            if (this.vx < -0.1) this.facingLeft = true;
            else if (this.vx > 0.1) this.facingLeft = false;
            
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            
            this.chargeTimer -= dt;
            if (this.chargeTimer <= 0) {
                this.isCharging = true;
                this.chargeTimer = 0.5;
                this.chargeDirX = Math.cos(angle);
                this.chargeDirY = Math.sin(angle);
                this.vx = this.chargeDirX * currentSpeed;
                this.vy = this.chargeDirY * currentSpeed;
                
                if (this.vx < -0.1) this.facingLeft = true;
                else if (this.vx > 0.1) this.facingLeft = false;
            }
        }
    }
}

class EnemyTank extends EnemyBase {
    constructor() {
        super(100, 75 + (gameTimeSeconds * 0.35), imgEnemyTank);
        this.hp = 6;
        this.type = 'tank';
        this.glowColor = '0, 255, 85'; // rgb green
    }
    update(dt) {
        let currentSpeed = this.getSpeed();
        const dx = mainPlayer.x - this.x;
        const dy = mainPlayer.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        this.vx = Math.cos(angle) * currentSpeed;
        this.vy = Math.sin(angle) * currentSpeed;
        
        if (this.vx < -0.1) this.facingLeft = true;
        else if (this.vx > 0.1) this.facingLeft = false;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.eatCooldown > 0) this.eatCooldown -= dt;
    }
}

class EnemyGhost extends EnemyBase {
    constructor() {
        super(35, 300 + (gameTimeSeconds * 0.1), imgEnemyGhost);
        this.hp = 1;
        this.type = 'ghost';
        this.glowColor = '0, 243, 255'; // rgb blue
    }
    update(dt) {
        let currentSpeed = this.getSpeed();
        const dx = mainPlayer.x - this.x;
        const dy = mainPlayer.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        this.vx = Math.cos(angle) * currentSpeed;
        this.vy = Math.sin(angle) * currentSpeed;
        
        if (this.vx < -0.1) this.facingLeft = true;
        else if (this.vx > 0.1) this.facingLeft = false;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.eatCooldown > 0) this.eatCooldown -= dt;
    }
    draw() {
        ctx.globalAlpha = 0.6; // Spooky!
        super.draw();
        ctx.globalAlpha = 1.0;
    }
}

class Item {
    constructor() {
        this.radius = 24;
        this.x = Math.random() * (MAP_WIDTH - this.radius * 2) + this.radius;
        this.y = Math.random() * (MAP_HEIGHT - this.radius * 2) + this.radius;
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    draw(time) {
        ctx.save();
        const ty = this.y + Math.sin(time * 0.003 + this.floatOffset) * 5;
        ctx.translate(this.x, ty);
        
        if (imgItem.complete && imgItem.naturalHeight !== 0) {
            ctx.drawImage(imgItem, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else {
            ctx.fillStyle = '#fff433';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#fff433';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class PowerUp {
    constructor() {
        this.radius = 35;
        this.x = Math.random() * (MAP_WIDTH - this.radius * 2) + this.radius;
        this.y = Math.random() * (MAP_HEIGHT - this.radius * 2) + this.radius;
        this.floatOffset = Math.random() * Math.PI * 2;
        
        const types = ['nuke', 'star', 'slow'];
        this.type = types[Math.floor(Math.random() * types.length)];
    }

    draw(time) {
        ctx.save();
        const ty = this.y + Math.sin(time * 0.005 + this.floatOffset) * 10;
        ctx.translate(this.x, ty);
        
        ctx.shadowBlur = 40;
        let pImg = null;
        
        if (this.type === 'nuke') {
            ctx.shadowColor = '#ff0000';
            ctx.fillStyle = '#ff3366';
            pImg = imgPowerNuke;
        } else if (this.type === 'star') {
            const h = (performance.now()/5) % 360;
            ctx.shadowColor = `hsl(${h}, 100%, 50%)`;
            ctx.fillStyle = '#ffffff';
            pImg = imgPowerStar;
        } else if (this.type === 'slow') {
            ctx.shadowColor = '#00f3ff';
            ctx.fillStyle = '#e0faff';
            pImg = imgPowerSlow;
        }
        
        if (pImg && pImg.complete && pImg.naturalHeight !== 0) {
            ctx.drawImage(pImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else {
            // Background glow fallback
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class Projectile {
    constructor(startX, startY, angle, isHeart = false) {
        this.x = startX;
        this.y = startY;
        this.isHeart = isHeart;
        this.baseSpeed = isHeart ? 400 : 800;
        this.radius = isHeart ? 20 : 10;
        this.dead = false;
        
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
        
        this.pierceHits = [];
    }

    update(dt) {
        const currentSpeed = this.baseSpeed * (1 + (playerUpgrades.bulletSpeed * 0.4));
        this.x += this.vx * currentSpeed * dt;
        this.y += this.vy * currentSpeed * dt;
        
        if (this.x < 0 || this.x > MAP_WIDTH || this.y < 0 || this.y > MAP_HEIGHT) {
            this.dead = true;
            return;
        }

        for (let enemy of enemies) {
            if (!enemy.dead && !this.pierceHits.includes(enemy)) {
                if (dist(this.x, this.y, enemy.x, enemy.y) < this.radius + enemy.radius) {
                    enemy.takeDamage();
                    this.pierceHits.push(enemy);
                    
                    if (this.isHeart) {
                        let bomb = new Bomb(this.x, this.y, 300);
                        bomb.timer = 0; 
                        bomb.exploded = true;
                        bombs.push(bomb);
                        
                        this.dead = true;
                        return;
                    }
                    
                    if (playerUpgrades.pierce <= 0) {
                        this.dead = true;
                        return;
                    }
                }
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const angle = Math.atan2(this.vy, this.vx);
        ctx.rotate(angle);
        
        if (this.isHeart) {
            ctx.font = '50px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.rotate(-angle);
            if (this.vx < 0) ctx.scale(-1, 1);
            ctx.fillText('❤️', 0, 0);
        } else {
            ctx.fillStyle = playerUpgrades.pierce > 0 ? '#ffae00' : '#00f3ff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class OrbitalSaw {
    constructor(index) {
        this.index = index;
        this.radius = 20;
        this.angle = (index / Math.max(1, playerUpgrades.orbit)) * Math.PI * 2;
        this.distance = 180;
        this.x = 0;
        this.y = 0;
    }
    update(dt) {
        this.angle += 3.0 * dt; 
        this.x = mainPlayer.x + Math.cos(this.angle) * this.distance;
        this.y = mainPlayer.y + Math.sin(this.angle) * this.distance;

        for (let enemy of enemies) {
            if (!enemy.dead && enemy.eatCooldown <= 0) {
                if (dist(this.x, this.y, enemy.x, enemy.y) < this.radius + enemy.radius) {
                    enemy.takeDamage();
                    enemy.eatCooldown = 0.5;
                }
            }
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#ff00ff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class DeathEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.alpha = 1;
    }
    update(dt) {
        this.radius += 100 * dt;
        this.alpha -= 2.5 * dt;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = `rgba(255, 31, 90, ${Math.max(0, this.alpha)})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let mainPlayer;
let followers = [];
let enemies = [];
let items = [];
let powerups = [];
let projectiles = [];
let bombs = [];
let lasers = [];
let deathEffects = [];
let orbitalSaws = [];
let gems = [];
let gemsCount = 0;

// Upgrade pool sourced from content.js — edit card names/descriptions there!
const UPGRADE_POOL = GAME_TEXT.cards;

function triggerLevelUp() {
    gameState = 'LEVEL_UP';
    level++;
    xpToNextLevel = Math.floor(xpToNextLevel * 1.4);
    xpBarFill.style.width = '0%';
    if (levelNumDisplay) levelNumDisplay.innerText = level;

    cardsContainer.innerHTML = '';

    let shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random());
    let picks = shuffled.slice(0, 3);

    for (let i = 0; i < 3; i++) {
        const upgrade = picks[i];
        const rankStr = upgrade.id !== 'swarm'
            ? `Rank: ${playerUpgrades[upgrade.id] || 0}`
            : 'Instant Effect';
        const rarity = upgrade.rarity || 'common';

        const card = document.createElement('div');
        card.className = `upgrade-card rarity-${rarity}`;
        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${upgrade.name}</div>
            </div>
            <div class="card-art">${upgrade.icon}</div>
            <div class="card-text-box">
                <div class="card-desc">${upgrade.desc}</div>
                <div class="card-footer">
                    <div class="card-rank">${rankStr}</div>
                    <div class="card-rarity-badge rarity-badge-${rarity}">${rarity}</div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => selectUpgrade(upgrade.id));
        cardsContainer.appendChild(card);
    }

    levelUpScreen.classList.remove('hidden');
    setTimeout(() => levelUpScreen.classList.add('active'), 10);
}

function syncOrbitalSaws() {
    orbitalSaws = [];
    for(let i=0; i<playerUpgrades.orbit; i++) {
        orbitalSaws.push(new OrbitalSaw(i));
    }
}

function selectUpgrade(id) {
    if (id === 'swarm') {
        for(let i=0; i<5; i++) {
            followers.push(new Follower(followers.length));
        }
        score += 5;
        scoreDisplay.innerText = Math.max(0, score);
    } else {
        playerUpgrades[id]++;
        if (id === 'orbit') {
            syncOrbitalSaws();
        }
        if (id === 'aura') {
            shieldCharges += 2;
        }
    }
    
    levelUpScreen.classList.remove('active');
    setTimeout(() => {
        levelUpScreen.classList.add('hidden');
        gameState = 'PLAYING';
        postLevelUpGrace = 2.0; 
    }, 300);
}

function addXp(amount = 1) {
    totalXp += amount;
    if (totalXp >= xpToNextLevel) {
        totalXp = 0;
        xpBarFill.style.width = '100%';
        setTimeout(triggerLevelUp, 50);
        return;
    }
    xpBarFill.style.width = `${(totalXp / xpToNextLevel) * 100}%`;
}


function initGame(diffMode) {
    if (diffMode) globalDifficulty = diffMode;
    
    applyGameText(); // Re-sync text on game start
    resizeCanvas();
    score = 0;
    gameTimeSeconds = 0;
    frameDeltaAccumulator = 0;
    totalXp = 0;
    level = 1;
    xpToNextLevel = 5;
    
    specialWaveActive = false;
    specialWaveCompleted = false;
    ghostsUnlocked = false;
    
    for (let key in playerUpgrades) {
        playerUpgrades[key] = 0;
    }
    
    blasterCooldown = 0;
    nukeCooldown = 0;
    timsCooldown = 0;
    laserCooldown = 0;
    novaCooldown = 0;
    postLevelUpGrace = 0;
    invincibleTimer = 0;
    timeFreezeTimer = 0;
    shieldCharges = 0;
    shieldCooldown = 0;
    canRevive = true; // Reset revive each full game start
    
    // Load PB from localStorage
    const savedPBScore = localStorage.getItem('pbScore') || 0;
    const savedPBGems = localStorage.getItem('pbGems') || 0;
    if (pbScoreDisplay) pbScoreDisplay.innerText = savedPBScore;
    if (pbGemsDisplay) pbGemsDisplay.innerText = savedPBGems;
    
    scoreDisplay.innerText = score;
    gemsDisplay.innerText = 0;
    userZoom = 1.0;
    targetUserZoom = 1.0;
    cameraZoom = autoZoom;
    timerDisplay.innerText = "00:00";
    if (levelNumDisplay) levelNumDisplay.innerText = level;
    xpBarFill.style.width = '0%';
    xpBarContainer.style.display = 'block';

    mainPlayer = new Player();
    followers = [];
    enemies = [];
    items = [];
    powerups = [];
    projectiles = [];
    bombs = [];
    lasers = [];
    deathEffects = [];
    orbitalSaws = [];
    gems = [];
    gemsCount = 0;
    mouse.x = canvas.width / 2;
    mouse.y = canvas.height / 2;

    for (let i = 0; i < 150; i++) items.push(new Item());
    for (let i = 0; i < 5; i++) spawnEnemy();
    
    gameState = 'PLAYING';
    
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.remove('active');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.remove('active');
    pauseScreen.classList.add('hidden');
    
    hud.classList.remove('hidden');
    
    lastFrameTime = performance.now();
    cancelAnimationFrame(animationId);
    gameLoop(lastFrameTime);
}

function spawnEnemy() {
    const roll = Math.random();
    const isAllen = globalDifficulty === 'allen';
    const tankThreshold = isAllen ? 30 : 45;
    
    // Tank probability scales from 10% to 30% over 5 minutes
    const tankProb = 0.1 + Math.min(0.2, gameTimeSeconds / 300);

    // If ghosts unlocked, 30% chance to spawn ghost
    if (ghostsUnlocked && roll < 0.3) {
        enemies.push(new EnemyGhost());
    } else if (gameTimeSeconds > tankThreshold && roll < tankProb) {
        enemies.push(new EnemyTank());
    } else if (gameTimeSeconds > 10 && roll < 0.5) {
        enemies.push(new EnemyCharger());
    } else {
        enemies.push(new EnemyNormal());
    }
}

function endGame() {
    gameState = 'GAMEOVER';
    hud.classList.add('hidden');
    xpBarContainer.style.display = 'none';
    
    // Check and save PBs
    const currentPBScore = parseInt(localStorage.getItem('pbScore') || 0);
    const currentPBGems = parseInt(localStorage.getItem('pbGems') || 0);
    
    if (score > currentPBScore) localStorage.setItem('pbScore', score);
    if (gemsCount > currentPBGems) localStorage.setItem('pbGems', gemsCount);
    
    // Update labels
    if (finalScoreDisplay) finalScoreDisplay.innerText = score;
    if (finalGemsDisplay) finalGemsDisplay.innerText = gemsCount;
    if (pbScoreDisplay) pbScoreDisplay.innerText = localStorage.getItem('pbScore');
    if (pbGemsDisplay) pbGemsDisplay.innerText = localStorage.getItem('pbGems');

    // Show/Hide Revive Button
    const reviveContainer = document.querySelector('.revive-container');
    if (reviveContainer) reviveContainer.style.display = canRevive ? 'block' : 'none';

    // Delay the restart button
    if (restartBtn) {
        restartBtn.disabled = true;
        let countdown = 3;
        if (restartTimerDisplay) restartTimerDisplay.innerText = `(${countdown}s)`;
        
        const timerInt = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                clearInterval(timerInt);
                restartBtn.disabled = false;
                if (restartTimerDisplay) restartTimerDisplay.innerText = "";
            } else {
                if (restartTimerDisplay) restartTimerDisplay.innerText = `(${countdown}s)`;
            }
        }, 1000);
    }

    gameOverScreen.classList.remove('hidden');
    setTimeout(() => {
        gameOverScreen.classList.add('active');
    }, 10);
}

function revivePlayer() {
    if (!canRevive) return;
    canRevive = false;
    
    // Open monetization link in a windowed tab (popup)
    window.open('https://omg10.com/4/10860929', '_blank', 'width=1000,height=800');
    
    // Clear area around player
    const clearRadius = 600;
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (dist(mainPlayer.x, mainPlayer.y, e.x, e.y) < clearRadius) {
            deathEffects.push(new DeathEffect(e.x, e.y));
            enemies.splice(i, 1);
        }
    }
    
    // Reset state to playing
    invincibleTimer = 3.0; // 3 seconds of safety
    gameState = 'PLAYING';
    
    gameOverScreen.classList.remove('active');
    setTimeout(() => {
        gameOverScreen.classList.add('hidden');
        hud.classList.remove('hidden');
        xpBarContainer.style.display = 'block';
    }, 300);
}

if (reviveBtn) {
    reviveBtn.addEventListener('click', revivePlayer);
}

function backToStartMenu() {
    gameState = 'START';
    gameOverScreen.classList.remove('active');
    gameOverScreen.classList.add('hidden');
    
    hubScreen.classList.remove('hidden');
    setTimeout(() => {
        hubScreen.classList.add('active');
    }, 10);
}

function updateCamera() {
    const viewW = canvas.width / cameraZoom;
    const viewH = canvas.height / cameraZoom;
    camera.x = mainPlayer.x - viewW / 2;
    camera.y = mainPlayer.y - viewH / 2;

    if (camera.x < -200) camera.x = -200;
    if (camera.y < -200) camera.y = -200;
    if (camera.x > MAP_WIDTH - viewW + 200) camera.x = MAP_WIDTH - viewW + 200;
    if (camera.y > MAP_HEIGHT - viewH + 200) camera.y = MAP_HEIGHT - viewH + 200;
}

function autoBlaster() {
    if (playerUpgrades.blaster > 0) {
        const targetsNeeded = playerUpgrades.blaster;
        const sortedEnemies = enemies
            .filter(e => !e.dead)
            .map(e => ({ enemy: e, d: dist(mainPlayer.x, mainPlayer.y, e.x, e.y) }))
            .sort((a, b) => a.d - b.d);
            
        for(let i=0; i < Math.min(targetsNeeded, sortedEnemies.length); i++) {
            const e = sortedEnemies[i].enemy;
            const angle = Math.atan2(e.y - mainPlayer.y, e.x - mainPlayer.x);
            projectiles.push(new Projectile(mainPlayer.x, mainPlayer.y, angle));
        }
    }
    
    if (playerUpgrades.hawk > 0) {
        const sortedEnemies = enemies
            .filter(e => !e.dead)
            .map(e => ({ enemy: e, d: dist(mainPlayer.x, mainPlayer.y, e.x, e.y) }))
            .sort((a, b) => a.d - b.d);
            
        let angleToFire = 0;
        if (sortedEnemies.length > 0) {
            angleToFire = Math.atan2(sortedEnemies[0].enemy.y - mainPlayer.y, sortedEnemies[0].enemy.x - mainPlayer.x);
        } else {
            angleToFire = Math.atan2(camera.y + mouse.y - mainPlayer.y, camera.x + mouse.x - mainPlayer.x);
        }
        
        const pellets = 3 + (playerUpgrades.hawk * 2);
        for(let i=0; i<pellets; i++) {
            let spread = (Math.random() - 0.5) * 0.8;
            let proj = new Projectile(mainPlayer.x, mainPlayer.y, angleToFire + spread);
            proj.baseSpeed = 1400; 
            projectiles.push(proj);
        }
    }
}

function autoHeart() {
    if (playerUpgrades.tims <= 0) return;
    const targetsNeeded = playerUpgrades.tims;
    const sortedEnemies = enemies
        .filter(e => !e.dead)
        .map(e => ({ enemy: e, d: dist(mainPlayer.x, mainPlayer.y, e.x, e.y) }))
        .sort((a, b) => a.d - b.d);
        
    for(let i=0; i < Math.min(targetsNeeded, sortedEnemies.length); i++) {
        const e = sortedEnemies[i].enemy;
        const angle = Math.atan2(e.y - mainPlayer.y, e.x - mainPlayer.x);
        projectiles.push(new Projectile(mainPlayer.x, mainPlayer.y, angle, true)); 
    }
}

function update(dt) {
    if (gameState !== 'PLAYING') return;

    // Smooth Zoom Interpolation
    userZoom = lerp(userZoom, targetUserZoom, 1 - Math.pow(0.001, dt)); // Decoupled from framerate
    cameraZoom = autoZoom * userZoom;

    if (invincibleTimer > 0) invincibleTimer -= dt;
    if (timeFreezeTimer > 0) timeFreezeTimer -= dt;

    // Special Round Monitor
    if (level === 5 && !specialWaveCompleted && !specialWaveActive) {
        specialWaveActive = true;
        // Spawn 8 phantoms around map
        for (let i = 0; i < 8; i++) {
            let ghost = new EnemyGhost();
            ghost.x = mainPlayer.x + (Math.random() < 0.5 ? -1200 : 1200);
            ghost.y = mainPlayer.y + (Math.random() < 0.5 ? -1200 : 1200);
            enemies.push(ghost);
        }
    }
    
    if (specialWaveActive) {
        const ghostCount = enemies.filter(e => e.type === 'ghost').length;
        if (ghostCount === 0) {
            specialWaveActive = false;
            specialWaveCompleted = true;
            ghostsUnlocked = true;
        }
    }

    frameDeltaAccumulator += dt;
    if (frameDeltaAccumulator >= 1.0) {
        gameTimeSeconds++;
        frameDeltaAccumulator -= 1.0;
        timerDisplay.innerText = formatTime(gameTimeSeconds);
        
        if (blasterCooldown > 0) blasterCooldown--;
        if (nukeCooldown > 0) nukeCooldown--;
        if (timsCooldown > 0) timsCooldown--;
        if (laserCooldown > 0) laserCooldown--;
        if (novaCooldown > 0) novaCooldown--;
        
        if (blasterCooldown <= 0 && (playerUpgrades.blaster > 0 || playerUpgrades.hawk > 0)) {
            autoBlaster();
            blasterCooldown = 2.0 / (1 + (playerUpgrades.fireRate * 0.5));
        }

        if (timsCooldown <= 0 && playerUpgrades.tims > 0) {
            autoHeart();
            timsCooldown = 4.0 / (1 + (playerUpgrades.fireRate * 0.5));
        }
        
        if (nukeCooldown <= 0 && playerUpgrades.nuke > 0) {
            let nukeRadius = 300 + (playerUpgrades.nuke * 150);
            bombs.push(new Bomb(mainPlayer.x, mainPlayer.y, nukeRadius));
            nukeCooldown = 4;
        }
        
        if (laserCooldown <= 0 && playerUpgrades.laser > 0) {
            lasers.push(new LaserBeam(mainPlayer.y));
            laserCooldown = 8;
        }
        
        if (novaCooldown <= 0 && playerUpgrades.nova > 0) {
            for(let i=0; i<12; i++) {
                let angle = (Math.PI * 2 / 12) * i;
                projectiles.push(new Projectile(mainPlayer.x, mainPlayer.y, angle));
            }
            novaCooldown = 6;
        }
    }
    
    if (playerUpgrades.aura > 0 && shieldCharges < playerUpgrades.aura * 2) {
        shieldCooldown -= dt;
        if (shieldCooldown <= 0) {
            shieldCharges++;
            shieldCooldown = 4.0;
        }
    }

    mainPlayer.update(dt);
    updateCamera();

    for (let i = 0; i < followers.length; i++) followers[i].update();
    for (let saw of orbitalSaws) saw.update(dt);

    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(dt);
        if (projectiles[i].dead) projectiles.splice(i, 1);
    }
    for (let i = bombs.length - 1; i >= 0; i--) {
        bombs[i].update(dt);
        if (bombs[i].dead) bombs.splice(i, 1);
    }
    for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].update(dt);
        if (lasers[i].dead) lasers.splice(i, 1);
    }
    for (let i = deathEffects.length - 1; i >= 0; i--) {
        deathEffects[i].update(dt);
        if (deathEffects[i].alpha <= 0) deathEffects.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        if (enemy.dead) {
            deathEffects.push(new DeathEffect(enemy.x, enemy.y));
            // Drop 1–3 gems
            const dropCount = 1 + Math.floor(Math.random() * 3);
            for (let g = 0; g < dropCount; g++) gems.push(new Gem(enemy.x, enemy.y));
            // Award XP scaled by enemy type
            let xpReward = 2;
            if (enemy.type === 'tank')    xpReward = 5;
            else if (enemy.type === 'charger') xpReward = 3;
            else if (enemy.type === 'ghost')   xpReward = 3;
            addXp(xpReward);
            enemies.splice(i, 1);
            continue;
        }

        enemy.update(dt);

        const distToPlayer = dist(mainPlayer.x, mainPlayer.y, enemy.x, enemy.y);
        
        if (shieldCharges > 0 && distToPlayer < mainPlayer.radius + enemy.radius + 40) {
            enemy.takeDamage();
            shieldCharges--;
            continue;
        }
        
        if (invincibleTimer > 0 && distToPlayer < mainPlayer.radius + enemy.radius) {
            enemy.takeDamage();
            continue;
        }

        if (postLevelUpGrace <= 0 && invincibleTimer <= 0) {
            if (distToPlayer < mainPlayer.radius + enemy.radius - 20) {
                endGame();
                return;
            }
            
            if (enemy.eatCooldown <= 0) {
                for(let j = followers.length - 1; j >= 0; j--) {
                    const follower = followers[j];
                    if (dist(follower.x, follower.y, enemy.x, enemy.y) < follower.radius + enemy.radius) {
                        deathEffects.push(new DeathEffect(follower.x, follower.y));
                        followers.splice(j, 1);
                        score--;
                        scoreDisplay.innerText = Math.max(0, score);
                        followers.forEach((f, idx) => f.recalculateOffset(idx));
                        enemy.eatCooldown = 1.0; 
                        break; 
                    }
                }
            }
        }
    }
    
    if (postLevelUpGrace > 0) postLevelUpGrace -= dt;

    if (!specialWaveActive) {
        let targetEnemyCount;
        if (globalDifficulty === 'normal') {
            targetEnemyCount = 5 + Math.floor(gameTimeSeconds * 0.5);
        } else {
            targetEnemyCount = 8 + Math.floor(gameTimeSeconds * 0.8);
        }
        
        if (enemies.length < targetEnemyCount && Math.random() < Math.max(0.1, dt)) {
            spawnEnemy();
        }
    }

    if (items.length < 200 && Math.random() < Math.max(0.1, dt)) {
        items.push(new Item());
    }
    
    if (powerups.length < 3 && Math.random() < 0.005) {
        powerups.push(new PowerUp());
    }

    const magnetGravityZone = 100 + (playerUpgrades.magnet * 300); 
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const d = dist(mainPlayer.x, mainPlayer.y, item.x, item.y);
        
        if (d < magnetGravityZone && d > mainPlayer.radius + item.radius) {
            const angle = Math.atan2(mainPlayer.y - item.y, mainPlayer.x - item.x);
            const pullSpeed = 800 * dt; 
            item.x += Math.cos(angle) * pullSpeed;
            item.y += Math.sin(angle) * pullSpeed;
        }
        
        if (dist(mainPlayer.x, mainPlayer.y, item.x, item.y) < mainPlayer.radius + item.radius + 15) {
            items.splice(i, 1);
            addXp();
            score++;
            scoreDisplay.innerText = Math.max(0, score);
            followers.push(new Follower(followers.length));
        }
    }
    
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        if (dist(mainPlayer.x, mainPlayer.y, p.x, p.y) < mainPlayer.radius + p.radius) {
            if (p.type === 'nuke') {
                let bomb = new Bomb(mainPlayer.x, mainPlayer.y, 3500);
                bomb.timer = 0;
                bomb.exploded = true;
                bombs.push(bomb);
            } else if (p.type === 'star') {
                invincibleTimer = 10.0;
            } else if (p.type === 'slow') {
                timeFreezeTimer = 5.0;
            }
            powerups.splice(i, 1);
        }
    }

    // Update gems
    for (let i = gems.length - 1; i >= 0; i--) {
        gems[i].update(dt);
        if (gems[i].dead) gems.splice(i, 1);
    }
}

function drawBackground() {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-color');
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-camera.x, -camera.y);

    if (imgBg && imgBg.complete && imgBg.naturalHeight !== 0) {
        const pattern = ctx.createPattern(imgBg, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 4;
    const gridSize = 100;
    ctx.beginPath();
    for(let x = 0; x <= MAP_WIDTH; x += gridSize) {
        ctx.moveTo(x, 0); ctx.lineTo(x, MAP_HEIGHT);
    }
    for(let y = 0; y <= MAP_HEIGHT; y += gridSize) {
        ctx.moveTo(0, y); ctx.lineTo(MAP_WIDTH, y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#ffd900';
    ctx.lineWidth = 20;
    ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 10;
    ctx.strokeRect(-5, -5, MAP_WIDTH + 10, MAP_HEIGHT + 10);

    ctx.restore();
}

function draw(time) {
    drawBackground();

    if (gameState === 'PLAYING' || gameState === 'GAMEOVER' || gameState === 'PAUSED' || gameState === 'LEVEL_UP') {
        ctx.save();
        ctx.scale(cameraZoom, cameraZoom);
        ctx.translate(-camera.x, -camera.y);

        items.forEach(item => item.draw(time));
        powerups.forEach(p => p.draw(time));
        gems.forEach(gem => gem.draw());
        
        deathEffects.forEach(effect => effect.draw());
        bombs.forEach(bomb => bomb.draw());
        lasers.forEach(laser => laser.draw());
        
        for (let i = followers.length - 1; i >= 0; i--) followers[i].draw();

        mainPlayer.draw();
        enemies.forEach(enemy => enemy.draw());
        projectiles.forEach(proj => proj.draw());
        orbitalSaws.forEach(saw => saw.draw());
        
        if (invincibleTimer > 0) {
            ctx.font = '30px Fredoka';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#000';
            ctx.fillText(`⭐ ${Math.ceil(invincibleTimer)}`, mainPlayer.x, mainPlayer.y - mainPlayer.radius - 20);
        }
        
        // Special UI Render tied to map
        if (specialWaveActive) {
            ctx.fillStyle = '#00f3ff';
            ctx.font = '90px Fredoka';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00f3ff';
            ctx.fillText(GAME_TEXT.specialWave.header, mainPlayer.x, mainPlayer.y - 300);
            ctx.font = '50px Fredoka';
            ctx.fillStyle = '#fff';
            ctx.fillText(GAME_TEXT.specialWave.subtext, mainPlayer.x, mainPlayer.y - 200);
        }
        
        ctx.restore();
    }
}

function gameLoop(time) {
    animationId = requestAnimationFrame(gameLoop);
    
    let dt = (time - lastFrameTime) / 1000; 
    lastFrameTime = time;
    if (dt > 0.1) dt = 0.1; 

    if (gameState === 'PLAYING') {
        update(dt);
    }
    draw(time);
}

btnDayAtShop.addEventListener('click', () => {
    hubScreen.classList.remove('active');
    hubScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    setTimeout(() => startScreen.classList.add('active'), 10);
});

btnNormal.addEventListener('click', () => initGame('normal'));
btnAllen.addEventListener('click', () => initGame('allen'));
restartBtn.addEventListener('click', () => initGame(globalDifficulty));
menuBtn.addEventListener('click', backToStartMenu);

drawBackground();
