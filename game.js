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
const finalScoreDisplay = document.getElementById('final-score');
const timerDisplay = document.getElementById('timer');

const xpBarContainer = document.getElementById('xp-bar-container');
const xpBarFill = document.getElementById('xp-bar-fill');
const levelNumDisplay = document.getElementById('level-num');

const btnDayAtShop = document.getElementById('select-day-at-shop');
const btnNormal = document.getElementById('start-normal-btn');
const btnAllen = document.getElementById('start-allen-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');

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

// Map & Camera
const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;
const camera = { x: 0, y: 0 };

// Inputs
const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('touchmove', (e) => {
    e.preventDefault(); // prevent scrolling
    if(e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
}, {passive: false});

window.addEventListener('touchstart', (e) => {
    if(e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
}, {passive: false});

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
        const targetX = mouse.x + camera.x;
        const targetY = mouse.y + camera.y;

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
        this.x = Math.random() * MAP_WIDTH;
        this.y = Math.random() * MAP_HEIGHT;
        if (dist(this.x, this.y, mainPlayer.x, mainPlayer.y) < 800) {
            this.x += 1000;
        }
        
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
        super(100, 70 + (gameTimeSeconds * 0.2), imgEnemyTank);
        this.hp = 3;
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

const UPGRADE_POOL = [
    { id: 'blaster', name: 'Sigma Beam', icon: '🗿', desc: 'Shoots a projectile at the nearest ops every 3s. +1 target per rank.' },
    { id: 'fireRate', name: 'Adrenaline Injector', icon: '💉', desc: 'Drastically increases the fire rate of all your weapons.' },
    { id: 'bulletSpeed', name: 'Ohio Express', icon: '💀', desc: 'Increases bullet velocity significantly so they escape.' },
    { id: 'pierce', name: 'Gyatt Splitter', icon: '🏹', desc: 'Projectiles rip straight through targets.' },
    { id: 'orbit', name: 'Edge Lord Aura', icon: '🤫', desc: 'Mewing streak spawns an orbiting blade that cuts ops.' },
    { id: 'magnet', name: 'Infinite Rizz', icon: '🧲', desc: 'Cores get magnetically rizzed toward you from vast distances.' },
    { id: 'speed', name: 'Goonspeed', icon: '📈', desc: 'Increases base player movement speed by 25%.' },
            { id: 'nuke', name: 'Skibidi Nuke', icon: '🚽', desc: 'Drops a massive exploding AOE bomb perfectly tracking ops every 4s.' },
    { id: 'hawk', name: 'Hawk Tuah Spray', icon: '💦', desc: 'Spits a heavy shotgun cone of fast projectiles that auto-target the nearest op.' },
    { id: 'swarm', name: 'Fanum Tax Swarm', icon: '🍕', desc: 'Instantly tax +5 followers safely! (Repeatable)' },
    { id: 'tims', name: 'Guy at Tims', icon: '❤️', desc: 'Shoots a slow heart that instantly explodes ops into a massive shockwave on hit.' },
    { id: 'aura', name: 'Aura Shield', icon: '🛡️', desc: 'You gain a recharging shield ring that instantly vapes enemies touching it. (+2 charges per rank)' },
    { id: 'laser', name: 'Looksmaxxing Laser', icon: '🔦', desc: 'Periodically blasts a screen-wide vertical laser deleting everything in its path.' },
    { id: 'nova', name: 'Domain Expansion', icon: '✨', desc: 'Fires a full 360-degree blast ring perfectly around you. 8 sec cooldown.' }
];

function triggerLevelUp() {
    gameState = 'LEVEL_UP';
    level++;
    xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
    xpBarFill.style.width = '0%';
    levelNumDisplay.innerText = level;

    cardsContainer.innerHTML = '';
    
    let shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random());
    let picks = shuffled.slice(0, 3);
    
    for(let i=0; i<3; i++) {
        const upgrade = picks[i];
        const rankStr = upgrade.id !== 'swarm' ? `Current Rank: ${playerUpgrades[upgrade.id]}` : 'Instant Effect';
        
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="card-icon">${upgrade.icon}</div>
            <div class="card-title">${upgrade.name}</div>
            <div class="card-desc">${upgrade.desc}</div>
            <div class="card-rank">${rankStr}</div>
        `;
        
        card.addEventListener('click', () => {
            selectUpgrade(upgrade.id);
        });
        
        cardsContainer.appendChild(card);
    }
    
    levelUpScreen.classList.remove('hidden');
    
    levelUpScreen.querySelector('.panel').style.animation = 'none';
    setTimeout(() => {
        levelUpScreen.querySelector('.panel').style.animation = '';
        levelUpScreen.classList.add('active');
    }, 10);
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

function addXp() {
    totalXp++;
    let progress = (totalXp / xpToNextLevel) * 100;
    
    if (totalXp >= xpToNextLevel) {
        totalXp = 0;
        progress = 100;
        setTimeout(triggerLevelUp, 50); 
    }
    
    xpBarFill.style.width = `${progress}%`;
}


function initGame(diffMode) {
    if (diffMode) globalDifficulty = diffMode;
    
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
    
    scoreDisplay.innerText = score;
    timerDisplay.innerText = "00:00";
    levelNumDisplay.innerText = level;
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
    mouse.x = canvas.width / 2;
    mouse.y = canvas.height / 2;
    
    for(let i=0; i<60; i++) items.push(new Item());
    for(let i=0; i<5; i++) spawnEnemy();
    
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
    
    // If ghosts unlocked, 30% chance to spawn ghost
    if (ghostsUnlocked && roll < 0.3) {
        enemies.push(new EnemyGhost());
    } else if (gameTimeSeconds > 30 && roll < 0.2) {
        enemies.push(new EnemyTank());
    } else if (gameTimeSeconds > 15 && roll < 0.5) {
        enemies.push(new EnemyCharger());
    } else {
        enemies.push(new EnemyNormal());
    }
}

function endGame() {
    gameState = 'GAMEOVER';
    hud.classList.add('hidden');
    xpBarContainer.style.display = 'none';
    
    gameOverScreen.classList.remove('hidden');
    setTimeout(() => {
        gameOverScreen.classList.add('active');
    }, 10);
    finalScoreDisplay.innerText = Math.max(0, score);
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
    camera.x = mainPlayer.x - canvas.width / 2;
    camera.y = mainPlayer.y - canvas.height / 2;

    if (camera.x < -200) camera.x = -200;
    if (camera.y < -200) camera.y = -200;
    if (camera.x > MAP_WIDTH - canvas.width + 200) camera.x = MAP_WIDTH - canvas.width + 200;
    if (camera.y > MAP_HEIGHT - canvas.height + 200) camera.y = MAP_HEIGHT - canvas.height + 200;
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

    if (items.length < 80 && Math.random() < Math.max(0.1, dt)) {
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
}

function drawBackground() {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-color');
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
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
        ctx.translate(-camera.x, -camera.y);

        items.forEach(item => item.draw(time));
        powerups.forEach(p => p.draw(time));
        
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
            ctx.fillText('SPECIAL ROUND!', mainPlayer.x, mainPlayer.y - 300);
            ctx.font = '50px Fredoka';
            ctx.fillStyle = '#fff';
            ctx.fillText('ELIMINATE THE DREAMY BULLS', mainPlayer.x, mainPlayer.y - 200);
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
