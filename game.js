import init, {
  dist as wasm_dist,
  check_circle_collisions,
  check_magnet_zone,
  calculate_swipe,
} from "./al67x_physics/pkg/al67x_physics.js";

// --------------------------------------------------------------
// 1️⃣ Initialize WASM
// --------------------------------------------------------------
init().then(() => {
  console.log("🚀 AL67X WebAssembly Physics Engine Loaded!");
});

// --------------------------------------------------------------
// 2️⃣ UI Elements (unchanged)
// --------------------------------------------------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const hubScreen = document.getElementById("hub-screen");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const pauseScreen = document.getElementById("pause-screen");
const levelUpScreen = document.getElementById("level-up-screen");
const cardsContainer = document.getElementById("cards-container");
const hud = document.getElementById("hud");
const scoreDisplay = document.getElementById("score");
const gemsDisplay = document.getElementById("gems-display");
const finalScoreDisplay = document.getElementById("final-score");
const timerDisplay = document.getElementById("timer");
const xpBarContainer = document.getElementById("xp-bar-container");
const xpBarFill = document.getElementById("xp-bar-fill");
const levelNumDisplay = document.getElementById("level-num");
const btnDayAtShop = document.getElementById("select-day-at-shop");
const btnNormal = document.getElementById("start-normal-btn");
const btnAllen = document.getElementById("start-allen-btn");
const restartBtn = document.getElementById("restart-btn");
const restartTimerDisplay = document.getElementById("restart-timer");
const menuBtn = document.getElementById("menu-btn");
const reviveBtn = document.getElementById("revive-btn");
const finalGemsDisplay = document.getElementById("final-gems");
const pbScoreDisplay = document.getElementById("pb-score");
const pbGemsDisplay = document.getElementById("pb-gems");
const imgPlayer = document.getElementById("img-player");
const imgEnemy = document.getElementById("img-enemy");
const imgEnemyCharger = document.getElementById("img-enemy-charger");
const imgEnemyTank = document.getElementById("img-enemy-tank");
const imgEnemyGhost = document.getElementById("img-enemy-ghost");
const imgItem = document.getElementById("img-item");
const imgBg = document.getElementById("img-bg");
const imgPowerNuke = document.getElementById("img-power-nuke");
const imgPowerStar = document.getElementById("img-power-star");
const imgPowerSlow = document.getElementById("img-power-slow");
const imgPlayerEat = document.getElementById("img-player-eat");
const imgPlayerCry = document.getElementById("img-player-cry");
const imgPlayerSucc = document.getElementById("img-player-succ");
const imgPlayerSad = document.getElementById("img-player-sad");

// --------------------------------------------------------------
// 3️⃣ Safe wrappers for WASM collision checks
// --------------------------------------------------------------
async function safeCheckCircleCollisions(
  cx,
  cy,
  c_radius,
  x_coords,
  y_coords,
  radii,
) {
  try {
    const result = await check_circle_collisions(
      cx,
      cy,
      c_radius,
      x_coords,
      y_coords,
      radii,
    );
    return result;
  } catch (error) {
    console.error("WASM collision check failed:", error);
    return new Uint32Array(); // empty array on error
  }
}

async function safeCheckMagnetZone(
  px,
  py,
  p_radius,
  magnet_range,
  x_coords,
  y_coords,
  radii,
) {
  try {
    const result = await check_magnet_zone(
      px,
      py,
      p_radius,
      magnet_range,
      x_coords,
      y_coords,
      radii,
    );
    return result;
  } catch (error) {
    console.error("WASM magnet zone check failed:", error);
    return new Uint32Array();
  }
}

// --------------------------------------------------------------
// 5️⃣ Swipe detection – calls the Nim/Rust swipe function
// --------------------------------------------------------------
function handleSwipe(dragX, dragY, screenWidth, is_released) {
  const result = calculate_swipe(dragX, dragY, screenWidth, released);
  if (result.action === 1.0) {
    // Swipe right → revive
    revivePlayer();
  } else if (result.action === -1.0) {
    // Swipe left → game over
    endGame();
  }
}

// --------------------------------------------------------------
// 5️⃣ Swipe event listeners on the transparent glass pane
// --------------------------------------------------------------
const swipeGlass = document.getElementById("swipe-glass-pane");
let swipeStartX = 0;
let swipeStartY = 0;

swipeGlass.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  swipeStartX = touch.clientX;
  swipeStartY = touch.clientY;
});

swipeGlass.addEventListener("touchend", (e) => {
  const touch = e.changedTouches[0];
  const dragX = touch.clientX - swipeStartX;
  const dragY = touch.clientY - swipeStartY;
  const isReleased = true; // treat touchend as release
  handleSwipe(dragX, dragY, canvas.width, isReleased);
});

// Optional: also listen to mousemove for desktop testing
swipeGlass.addEventListener("mousemove", (e) => {
  // you could add visual feedback here if desired
});

// --------------------------------------------------------------
// 5️⃣ The rest of your original game logic (update, draw, etc.) stays the same,
//    with the following adjustments:
//
//    • Replace any direct `dist()` calls that involve bulk arrays with the
//      safe wrappers above (e.g., use safeCheckCircleCollisions for bulk enemy
//      collision checks, safeCheckMagnetZone for magnet‑zone item pulls).
//    • Keep using `wasm_dist` for simple point‑to‑point distance calculations
//      (e.g., Gem movement, projectile motion) – those are fine as‑is.
//
// --------------------------------------------------------------
// Example of a bulk collision check using the safe wrapper (you can adapt
// this pattern wherever you currently call `dist` for bulk operations):
//
// function checkPlayerEnemies() {
//     const playerX = mainPlayer.x;
//     const playerY = mainPlayer.y;
//     const playerRadius = mainPlayer.radius + 50; // example radius
//
//     // Collect coordinates for all enemies
//     const enemyX = enemies.map(e => e.x);
//     const enemyY = enemies.map(e => e.y);
//     const enemyRadii = enemies.map(e => e.radius);
//
//     // Use the safe WASM wrapper
//     const collided = await safeCheckCircleCollisions(playerX, playerY, playerRadius, enemyX, enemyY, enemyRadii);
//     // `collidedIdx` is a Uint32Array – iterate over it to apply damage, etc.
// }
//
// --------------------------------------------------------------
// 6️⃣ The rest of your original game logic (update, draw, event handlers,
//    etc.) remains unchanged, except where noted above.
// --------------------------------------------------------------
