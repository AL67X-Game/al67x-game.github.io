// ============================================================
//  AL67X SIMULATOR — GAME TEXT CONFIG
//  Edit this file to change any text displayed in the game!
// ============================================================

const GAME_TEXT = {

    // ── Hub / Main Menu ──────────────────────────────────────
    hub: {
        title: 'AL67X Simulator',
        subtitle: 'Select your experience:',
        modeCard1Title: 'DAY AT THE SHOP',
        modeCard1Desc: 'Build your swarm, survive the onslaught.',
        modeCard2Title: 'COMING SOON',
        modeCard2Desc: '???',
    },

    // ── Start Screen ─────────────────────────────────────────
    startScreen: {
        title: 'AL67X Simulator',
        desc: 'Collect yellow orbs to build up your followers!<br>Avoid the spikey guys or you get completely cooked!',
        normalBtn: 'NORMAL MODE',
        allenBtn: 'ALLEN MODE',
    },

    // ── HUD ──────────────────────────────────────────────────
    hud: {
        scoreLabel: 'Rizz Points:',
        gemsLabel: 'Gems:',
        levelPrefix: 'LVL',
    },

    // ── Level Up ─────────────────────────────────────────────
    levelUp: {
        title: 'LEVEL UP!',
        subtitle: 'Pick a brand new crazy card!',
    },

    // ── Game Over ────────────────────────────────────────────
    gameOver: {
        title: 'OH SNAP!',
        desc: 'Your swarm just got completely cooked.',
        scoreLabel: 'TOTAL RIZZ:',
        playAgainBtn: 'PLAY AGAIN',
        menuBtn: 'MAIN MENU',
    },

    // ── Pause Screen ─────────────────────────────────────────
    pause: {
        title: 'PAUSED',
        desc: 'Take a breather bro...',
    },

    // ── Special Wave ─────────────────────────────────────────
    specialWave: {
        header: 'SPECIAL ROUND!',
        subtext: 'ELIMINATE THE DREAMY BULLS',
    },

    // ── Upgrade Cards ────────────────────────────────────────
    // id matches playerUpgrades keys
    cards: [
        { id: 'blaster',    name: 'Sigma Beam',           icon: '🗿', rarity: 'common',   desc: 'Shoots a projectile at the nearest ops every 2s. +1 target per rank.' },
        { id: 'fireRate',   name: 'Adrenaline Injector',  icon: '💉', rarity: 'uncommon', desc: 'Drastically increases the fire rate of all your weapons.' },
        { id: 'bulletSpeed',name: 'Ohio Express',          icon: '💀', rarity: 'common',   desc: 'Increases bullet velocity significantly so they escape.' },
        { id: 'pierce',     name: 'Gyatt Splitter',        icon: '🏹', rarity: 'uncommon', desc: 'Projectiles rip straight through multiple targets.' },
        { id: 'orbit',      name: 'Edge Lord Aura',        icon: '🤫', rarity: 'uncommon', desc: 'Mewing streak spawns an orbiting blade that cuts ops.' },
        { id: 'magnet',     name: 'Infinite Rizz',         icon: '🧲', rarity: 'common',   desc: 'Cores and gems get magnetically rizzed toward you from vast distances.' },
        { id: 'speed',      name: 'Goonspeed',             icon: '📈', rarity: 'common',   desc: 'Increases base player movement speed by 25%.' },
        { id: 'nuke',       name: 'Skibidi Nuke',          icon: '🚽', rarity: 'rare',     desc: 'Drops a massive exploding AOE bomb tracking ops every 4s.' },
        { id: 'hawk',       name: 'Hawk Tuah Spray',       icon: '💦', rarity: 'uncommon', desc: 'Spits a shotgun cone of fast projectiles auto-targeting the nearest op.' },
        { id: 'swarm',      name: 'Fanum Tax Swarm',       icon: '🍕', rarity: 'common',   desc: 'Instantly tax +5 followers safely! (Repeatable)' },
        { id: 'tims',       name: 'Guy at Tims',           icon: '❤️', rarity: 'rare',     desc: 'Shoots a slow heart that explodes ops into a massive shockwave on hit.' },
        { id: 'aura',       name: 'Aura Shield',           icon: '🛡️', rarity: 'rare',     desc: 'Gain a recharging shield ring that vapes enemies touching it. (+2 charges/rank)' },
        { id: 'laser',      name: 'Looksmaxxing Laser',    icon: '🔦', rarity: 'rare',     desc: 'Periodically blasts a screen-wide laser deleting everything in its path.' },
        { id: 'nova',       name: 'Domain Expansion',      icon: '✨', rarity: 'rare',     desc: 'Fires a full 360-degree blast ring around you. 8 sec cooldown.' },
    ],
};
