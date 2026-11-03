
// ================================================
// WILDLIFE RESCUE - THE GREAT ESCAPE
// HTML5 CANVAS GAME ENGINE
// ================================================

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const $ = id => document.getElementById(id);

const screens = {
    menu: $("main-menu"),
    game: $("game-screen"),
    pause: $("pause-screen"),
    complete: $("level-complete-screen"),
    over: $("game-over-screen")
};

const ui = {
    score: $("score"),
    lives: $("lives"),
    rescued: $("rescued-count"),
    timer: $("timer"),
    mission: $("mission-text"),
    progress: $("progress-text"),
    progressFill: $("progress-fill"),
    levelScore: $("level-score"),
    levelRescued: $("level-rescued"),
    finalScore: $("final-score"),
    finalRescued: $("final-rescued")
};

// ---------------- GAME SETTINGS ----------------

let W = 900;
let H = 550;

const TARGET_RESCUES = 5;
const MISSION_TIME = 180;

let gameState = "menu";
let score = 0;
let lives = 3;
let rescued = 0;
let timeLeft = MISSION_TIME;
let level = 1;
let gameTime = 0;
let lastTime = 0;
let damageCooldown = 0;
let soundEnabled = true;

let player;
let animals = [];
let supplies = [];
let hazards = [];
let butterflies = [];
let leaves = [];
let flowers = [];
let trees = [];
let rocks = [];
let particles = [];

const keys = {};
const mobile = {};

let audioContext = null;

// ---------------- PLAYER ----------------

function createPlayer() {
    return {
        x: 100,
        y: H * 0.5,
        w: 34,
        h: 48,
        speed: 210,
        direction: 1,
        moving: false,
        walk: 0,
        invincible: 0
    };
}

// ---------------- HELPERS ----------------

function random(min, max) {
    return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
    return Math.hypot(
        (a.x + (a.w || 0) / 2) - b.x,
        (a.y + (a.h || 0) / 2) - b.y
    );
}

function roundedRect(x, y, w, h, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
}

// ---------------- CANVAS ----------------

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    W = rect.width;
    H = rect.height;

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (player) {
        player.x = clamp(player.x, 25, W - 55);
        player.y = clamp(player.y, 95, H - 55);
    }

    createScenery();
}

window.addEventListener("resize", resizeCanvas);

// ---------------- SCENERY ----------------

function createScenery() {
    trees = [];
    rocks = [];
    flowers = [];
    butterflies = [];
    leaves = [];

    for (let i = 0; i < 19; i++) {
        trees.push({
            x: random(-20, W + 20),
            y: i % 2 === 0 ? random(65, 145) : random(H - 130, H - 55),
            size: random(35, 75),
            shade: Math.floor(random(0, 3))
        });
    }

    for (let i = 0; i < 28; i++) {
        rocks.push({
            x: random(15, W - 15),
            y: random(100, H - 55),
            size: random(4, 12)
        });
    }

    for (let i = 0; i < 55; i++) {
        flowers.push({
            x: random(10, W - 10),
            y: random(85, H - 45),
            size: random(2, 5),
            color: ["#ffe18b", "#f6a4c9", "#e7efff", "#c8a4f5"][i % 4]
        });
    }

    for (let i = 0; i < 8; i++) {
        butterflies.push({
            x: random(30, W - 30),
            y: random(100, H - 100),
            speed: random(12, 28),
            phase: random(0, 7),
            color: ["#ffe38c", "#ff9fd4", "#a7e9ff", "#d8b2ff"][i % 4]
        });
    }

    for (let i = 0; i < 18; i++) {
        leaves.push({
            x: random(0, W),
            y: random(0, H),
            speed: random(8, 22),
            size: random(3, 6),
            rotation: random(0, 6)
        });
    }
}

// ---------------- ANIMATED JUNGLE BACKGROUND ----------------

function drawBackground() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#246d43");
    bg.addColorStop(0.5, "#438c4d");
    bg.addColorStop(1, "#1b5935");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Distant sunlight
    const sunlight = ctx.createRadialGradient(
        W * 0.52, H * 0.25, 10,
        W * 0.52, H * 0.25, W * 0.6
    );

    sunlight.addColorStop(0, "rgba(255,239,158,0.24)");
    sunlight.addColorStop(1, "rgba(255,239,158,0)");

    ctx.fillStyle = sunlight;
    ctx.fillRect(0, 0, W, H);

    // Distant vegetation
    drawDistantTrees();

    // River
    drawRiver();

    // Forest floor
    ctx.fillStyle = "rgba(16,65,35,0.18)";
    ctx.fillRect(0, 0, W, H);

    // Ground rocks
    rocks.forEach(r => {
        ctx.fillStyle = "rgba(25,65,42,0.55)";
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.size * 1.3, r.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // Trees
    trees.forEach(drawTree);

    // Flowers
    flowers.forEach(f => {
        const sway = Math.sin(gameTime * 2 + f.x) * 1.5;

        ctx.fillStyle = "#276b3c";
        ctx.fillRect(f.x, f.y, 1.5, 8);

        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x + sway, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Floating leaves
    leaves.forEach(l => {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rotation);

        ctx.fillStyle = "rgba(181,230,116,0.65)";
        ctx.beginPath();
        ctx.ellipse(0, 0, l.size * 1.5, l.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    // Butterflies
    butterflies.forEach(drawButterfly);

    // Decorative foreground foliage
    drawForeground();
}

function drawDistantTrees() {
    for (let i = 0; i < 14; i++) {
        const x = i * W / 13;

        ctx.fillStyle = i % 2 ? "#205c39" : "#286c3f";
        ctx.beginPath();
        ctx.arc(x, 90 + Math.sin(i * 3) * 12, 55, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawTree(tree) {
    const { x, y, size, shade } = tree;

    const colors = ["#174c30", "#22643a", "#2d7440"];

    ctx.save();

    // Trunk
    ctx.fillStyle = "#65472c";
    roundedRect(x - size * 0.13, y + size * 0.1, size * 0.26, size * 0.85, 5);
    ctx.fill();

    // Main canopy
    const gradient = ctx.createRadialGradient(
        x - size * 0.2, y - size * 0.2, 3,
        x, y, size
    );

    gradient.addColorStop(0, "#65a94d");
    gradient.addColorStop(1, colors[shade]);

    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.arc(x, y, size * 0.65, 0, Math.PI * 2);
    ctx.arc(x - size * 0.4, y + size * 0.12, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.1, size * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = "rgba(174,228,105,0.19)";
    ctx.beginPath();
    ctx.arc(x - size * 0.22, y - size * 0.22, size * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawRiver() {
    const riverX = W * 0.72;
    const riverWidth = W * 0.13;

    ctx.fillStyle = "#246a66";
    ctx.beginPath();
    ctx.moveTo(riverX - riverWidth, 60);

    for (let y = 60; y <= H; y += 20) {
        ctx.lineTo(
            riverX - riverWidth + Math.sin(y * 0.02) * 20,
            y
        );
    }

    for (let y = H; y >= 60; y -= 20) {
        ctx.lineTo(
            riverX + riverWidth + Math.cos(y * 0.018) * 18,
            y
        );
    }

    ctx.closePath();
    ctx.fill();

    // Water surface
    ctx.save();
    ctx.strokeStyle = "rgba(150,239,219,0.4)";
    ctx.lineWidth = 2;

    for (let i = 0; i < 12; i++) {
        const y = (i * 48 + gameTime * 14) % H;
        const x = riverX + Math.sin(gameTime + i) * 25;

        ctx.beginPath();
        ctx.moveTo(x - 15, y);
        ctx.quadraticCurveTo(x, y - 4, x + 17, y);
        ctx.stroke();
    }

    ctx.restore();
}

function drawForeground() {
    // Bushes along the bottom
    for (let i = 0; i < 12; i++) {
        const x = i * W / 11;

        ctx.fillStyle = i % 2 ? "#17492e" : "#1d5835";
        ctx.beginPath();
        ctx.arc(x, H + 18, 34, Math.PI, Math.PI * 2);
        ctx.fill();
    }
}

function drawButterfly(b) {
    const x = b.x + Math.sin(gameTime * 1.2 + b.phase) * 18;
    const y = b.y + Math.cos(gameTime * 1.8 + b.phase) * 10;
    const wing = 2 + Math.abs(Math.sin(gameTime * 12 + b.phase)) * 5;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = b.color;

    ctx.beginPath();
    ctx.ellipse(-wing, 0, wing, 4, -0.4, 0, Math.PI * 2);
    ctx.ellipse(wing, 0, wing, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#293e2b";
    ctx.fillRect(-1, -3, 2, 6);

    ctx.restore();
}

// ---------------- PLAYER CHARACTER ----------------

function drawPlayer() {
    if (player.invincible > 0 && Math.floor(gameTime * 12) % 2 === 0) {
        return;
    }

    const x = player.x;
    const y = player.y;
    const bob = player.moving ? Math.sin(player.walk) * 3 : Math.sin(gameTime * 2) * 1.5;

    ctx.save();
    ctx.translate(x + player.w / 2, y + player.h / 2 + bob);
    ctx.scale(player.direction, 1);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 22, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Backpack
    ctx.fillStyle = "#ad7040";
    roundedRect(-17, -8, 11, 23, 4);
    ctx.fill();

    ctx.fillStyle = "#e5b36b";
    roundedRect(-16, -6, 8, 5, 2);
    ctx.fill();

    // Legs
    const legSwing = player.moving ? Math.sin(player.walk) * 5 : 0;

    ctx.fillStyle = "#344d37";

    roundedRect(-8, 12 + legSwing, 7, 10, 3);
    ctx.fill();

    roundedRect(3, 12 - legSwing, 7, 10, 3);
    ctx.fill();

    // Boots
    ctx.fillStyle = "#493725";
    roundedRect(-10, 19 + legSwing, 10, 5, 2);
    ctx.fill();
    roundedRect(2, 19 - legSwing, 10, 5, 2);
    ctx.fill();

    // Body
    const shirt = ctx.createLinearGradient(-10, -10, 10, 15);
    shirt.addColorStop(0, "#f1d58b");
    shirt.addColorStop(1, "#b58a48");

    ctx.fillStyle = shirt;
    roundedRect(-11, -10, 22, 25, 6);
    ctx.fill();

    // Shirt details
    ctx.strokeStyle = "#80643c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 12);
    ctx.stroke();

    // Arms
    ctx.fillStyle = "#d99d6b";

    const armSwing = player.moving ? Math.sin(player.walk) * 4 : 0;

    roundedRect(-15, -7 + armSwing, 6, 15, 3);
    ctx.fill();

    roundedRect(9, -7 - armSwing, 6, 15, 3);
    ctx.fill();

    // Neck
    ctx.fillStyle = "#dca778";
    ctx.fillRect(-4, -15, 8, 7);

    // Face
    ctx.fillStyle = "#e8b78b";
    ctx.beginPath();
    ctx.arc(0, -18, 10, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#29241d";
    ctx.beginPath();
    ctx.arc(4, -19, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    ctx.fillStyle = "#c58c42";
    ctx.beginPath();
    ctx.arc(0, -23, 10, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#8e5e2b";
    roundedRect(-14, -24, 28, 4, 2);
    ctx.fill();

    // Hat band
    ctx.fillStyle = "#49643c";
    ctx.fillRect(-8, -24, 16, 2);

    ctx.restore();
}

// ---------------- ANIMAL CHARACTERS ----------------

function createAnimals() {
    const types = ["panda", "rabbit", "fox", "deer", "koala"];

    const positions = [
        [W * 0.25, H * 0.28],
        [W * 0.42, H * 0.73],
        [W * 0.56, H * 0.36],
        [W * 0.82, H * 0.65],
        [W * 0.35, H * 0.48]
    ];

    animals = types.map((type, i) => ({
        type,
        x: positions[i][0],
        y: positions[i][1],
        w: 38,
        h: 34,
        phase: random(0, 7),
        speed: random(9, 20),
        direction: Math.random() > 0.5 ? 1 : -1,
        rescued: false
    }));
}

function drawAnimal(a) {
    if (a.rescued) return;

    const bob = Math.sin(gameTime * 4 + a.phase) * 2;
    const x = a.x;
    const y = a.y + bob;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(a.direction, 1);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (a.type === "panda") {
        drawPanda();
    } else if (a.type === "rabbit") {
        drawRabbit();
    } else if (a.type === "fox") {
        drawFox();
    } else if (a.type === "deer") {
        drawDeer();
    } else if (a.type === "koala") {
        drawKoala();
    }

    ctx.restore();
}

function drawPanda() {
    ctx.fillStyle = "#f4f2e9";
    ctx.beginPath();
    ctx.ellipse(0, 2, 17, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#242b2b";
    ctx.beginPath();
    ctx.arc(-10, -12, 6, 0, Math.PI * 2);
    ctx.arc(10, -12, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f4f2e9";
    ctx.beginPath();
    ctx.arc(0, -9, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#252525";
    ctx.beginPath();
    ctx.ellipse(-6, -9, 4, 6, -0.5, 0, Math.PI * 2);
    ctx.ellipse(6, -9, 4, 6, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(-6, -10, 1.7, 0, Math.PI * 2);
    ctx.arc(6, -10, 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#292929";
    ctx.beginPath();
    ctx.arc(0, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawRabbit() {
    ctx.fillStyle = "#e8e1d3";
    roundedRect(-10, -29, 7, 19, 4);
    ctx.fill();
    roundedRect(3, -30, 7, 20, 4);
    ctx.fill();

    ctx.fillStyle = "#f4a9b9";
    ctx.fillRect(-8, -26, 3, 12);
    ctx.fillRect(5, -27, 3, 13);

    ctx.fillStyle = "#f4eee1";
    ctx.beginPath();
    ctx.ellipse(0, 3, 16, 12, 0, 0, Math.PI * 2);
    ctx.arc(0, -10, 12, 0, Math.PI * 2);
    ctx.fill();

    drawAnimalFace();
}

function drawFox() {
    ctx.fillStyle = "#e58c3c";
    ctx.beginPath();
    ctx.ellipse(0, 3, 17, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-8, -13);
    ctx.lineTo(-13, -28);
    ctx.lineTo(-2, -20);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(8, -13);
    ctx.lineTo(13, -28);
    ctx.lineTo(2, -20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fff0d5";
    ctx.beginPath();
    ctx.arc(0, -11, 12, 0, Math.PI * 2);
    ctx.fill();

    drawAnimalFace();
}

function drawDeer() {
    ctx.strokeStyle = "#9b713e";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-5, -18);
    ctx.lineTo(-10, -29);
    ctx.lineTo(-15, -31);
    ctx.moveTo(-10, -29);
    ctx.lineTo(-8, -34);

    ctx.moveTo(5, -18);
    ctx.lineTo(10, -29);
    ctx.lineTo(15, -31);
    ctx.moveTo(10, -29);
    ctx.lineTo(8, -34);
    ctx.stroke();

    ctx.fillStyle = "#b98249";
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 12, 0, 0, Math.PI * 2);
    ctx.arc(0, -13, 10, 0, Math.PI * 2);
    ctx.fill();

    drawAnimalFace();
}

function drawKoala() {
    ctx.fillStyle = "#9ba8aa";
    ctx.beginPath();
    ctx.arc(-11, -14, 8, 0, Math.PI * 2);
    ctx.arc(11, -14, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d7e0df";
    ctx.beginPath();
    ctx.arc(0, -10, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#9ba8aa";
    ctx.beginPath();
    ctx.ellipse(0, 1, 17, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#343d3d";
    ctx.beginPath();
    ctx.ellipse(0, -8, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#202929";
    ctx.beginPath();
    ctx.arc(-6, -12, 1.5, 0, Math.PI * 2);
    ctx.arc(6, -12, 1.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawAnimalFace() {
    ctx.fillStyle = "#292525";
    ctx.beginPath();
    ctx.arc(-5, -12, 1.5, 0, Math.PI * 2);
    ctx.arc(5, -12, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -6, 2, 0, Math.PI * 2);
    ctx.fill();
}

// ---------------- ANIMAL MOVEMENT ----------------

function updateAnimals(dt) {
    animals.forEach(a => {
        if (a.rescued) return;

        a.phase += dt * 3;

        a.x += Math.sin(a.phase) * a.speed * dt;

        if (a.x < 45) a.x = 45;
        if (a.x > W - 45) a.x = W - 45;

        if (Math.sin(a.phase) > 0.1) a.direction = 1;
        if (Math.sin(a.phase) < -0.1) a.direction = -1;

        // Rescue when the player approaches
        if (distance(player, a) < 30) {
            rescueAnimal(a);
        }
    });
}

function rescueAnimal(a) {
    if (a.rescued) return;

    a.rescued = true;
    rescued++;
    score += 100;

    addParticles(a.x, a.y, "#d9ff9b", 22);
    playSound("rescue");

    updateHUD();

    if (rescued >= TARGET_RESCUES) {
        completeLevel();
    }
}

// ---------------- COLLECTIBLES ----------------

function createSupplies() {
    supplies = [];

    for (let i = 0; i < 8; i++) {
        supplies.push({
            x: random(50, W - 50),
            y: random(115, H - 65),
            type: i % 3 === 0 ? "kit" : "food",
            phase: random(0, 7),
            collected: false
        });
    }
}

function drawSupplies() {
    supplies.forEach(s => {
        if (s.collected) return;

        const y = s.y + Math.sin(gameTime * 3 + s.phase) * 4;

        ctx.save();
        ctx.shadowColor = "#ffe18b";
        ctx.shadowBlur = 12;

        ctx.font = "22px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(s.type === "kit" ? "🧺" : "🍎", s.x, y);

        ctx.restore();
    });
}

function updateSupplies() {
    supplies.forEach(s => {
        if (s.collected) return;

        if (distance(player, s) < 27) {
            s.collected = true;
            score += s.type === "kit" ? 30 : 15;

            if (s.type === "kit") {
                lives = Math.min(3, lives + 1);
            }

            addParticles(s.x, s.y, "#ffdc80", 12);
            playSound("collect");
            updateHUD();
        }
    });
}

// ---------------- HAZARDS ----------------

function createHazards() {
    hazards = [];

    for (let i = 0; i < Math.min(3 + level, 7); i++) {
        hazards.push({
            x: random(100, W - 100),
            y: random(120, H - 70),
            phase: random(0, 7),
            speed: random(15, 32),
            direction: Math.random() > 0.5 ? 1 : -1,
            type: i % 2 === 0 ? "snake" : "thorn"
        });
    }
}

function drawHazards() {
    hazards.forEach(h => {
        if (h.type === "snake") {
            const x = h.x + Math.sin(h.phase) * 12;

            ctx.save();
            ctx.strokeStyle = "#c6a34b";
            ctx.lineWidth = 7;
            ctx.lineCap = "round";

            ctx.beginPath();
            ctx.moveTo(x - 12, h.y);
            ctx.quadraticCurveTo(x, h.y - 9, x + 12, h.y);
            ctx.stroke();

            ctx.fillStyle = "#bd9e45";
            ctx.beginPath();
            ctx.arc(x + 15, h.y - 2, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#25251b";
            ctx.fillRect(x + 17, h.y - 4, 2, 2);

            ctx.restore();
        } else {
            ctx.fillStyle = "#315d32";
            ctx.beginPath();

            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                const r = i % 2 === 0 ? 17 : 9;

                const x = h.x + Math.cos(angle) * r;
                const y = h.y + Math.sin(angle) * r;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "#8ac85c";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

function updateHazards(dt) {
    hazards.forEach(h => {
        h.phase += dt * h.speed * 0.1;

        if (h.type === "snake") {
            h.x += h.direction * h.speed * dt;

            if (h.x < 35 || h.x > W - 35) {
                h.direction *= -1;
            }
        }

        const dx = player.x + 17 - h.x;
        const dy = player.y + 24 - h.y;

        if (Math.hypot(dx, dy) < 23 && damageCooldown <= 0) {
            loseLife();
        }
    });
}

function loseLife() {
    if (gameState !== "playing" || damageCooldown > 0) return;

    lives--;
    damageCooldown = 1.5;
    player.invincible = 1.5;

    addParticles(player.x + 17, player.y + 20, "#ff967d", 18);
    playSound("hit");

    updateHUD();

    if (lives <= 0) {
        gameOver();
    }
}

// ---------------- PARTICLES ----------------

function addParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,
            vx: random(-65, 65),
            vy: random(-65, 65),
            size: random(2, 5),
            life: random(0.5, 1.2),
            maxLife: 1.2,
            color
        });
    }
}

function updateParticles(dt) {
    particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
    });

    particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalAlpha = 1;
}

// ---------------- ENVIRONMENT ANIMATION ----------------

function updateEnvironment(dt) {
    butterflies.forEach(b => {
        b.x += Math.sin(gameTime + b.phase) * 10 * dt;

        if (b.x < 0) b.x = W;
        if (b.x > W) b.x = 0;
    });

    leaves.forEach(l => {
        l.y += l.speed * dt;
        l.x += Math.sin(gameTime + l.rotation) * 8 * dt;
        l.rotation += dt;

        if (l.y > H) {
            l.y = -10;
            l.x = random(0, W);
        }
    });
}

// ---------------- MOVEMENT ----------------

function updatePlayer(dt) {
    let dx = 0;
    let dy = 0;

    if (keys.ArrowLeft || keys.a || mobile.left) dx--;
    if (keys.ArrowRight || keys.d || mobile.right) dx++;
    if (keys.ArrowUp || keys.w || mobile.up) dy--;
    if (keys.ArrowDown || keys.s || mobile.down) dy++;

    if (dx && dy) {
        dx *= 0.707;
        dy *= 0.707;
    }

    player.moving = dx !== 0 || dy !== 0;

    if (player.moving) {
        player.walk += dt * 12;
    }

    if (dx < 0) player.direction = -1;
    if (dx > 0) player.direction = 1;

    player.x += dx * player.speed * dt;
    player.y += dy * player.speed * dt;

    player.x = clamp(player.x, 22, W - player.w - 22);
    player.y = clamp(player.y, 95, H - player.h - 45);

    player.invincible = Math.max(0, player.invincible - dt);
    damageCooldown = Math.max(0, damageCooldown - dt);
}

// ---------------- HUD ----------------

function updateHUD() {
    ui.score.textContent = score.toString().padStart(5, "0");
    ui.lives.textContent = lives;
    ui.rescued.textContent = rescued + " / " + TARGET_RESCUES;

    const percent = Math.round(rescued / TARGET_RESCUES * 100);

    ui.progress.textContent = percent + "%";
    ui.progressFill.style.width = percent + "%";

    ui.mission.textContent = `Rescue ${TARGET_RESCUES} animals`;

    const seconds = Math.max(0, Math.ceil(timeLeft));

    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    ui.timer.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(remaining).padStart(2, "0");
}

// ---------------- SOUND ----------------

function playSound(type) {
    if (!soundEnabled) return;

    try {
        if (!audioContext) {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) return;

            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        const settings = {
            rescue: [660, 880],
            collect: [520, 760],
            hit: [180, 100]
        };

        const values = settings[type] || [440, 660];

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(values[0], audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            values[1],
            audioContext.currentTime + 0.12
        );

        gain.gain.setValueAtTime(0.08, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.2
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        console.warn("Audio unavailable:", error);
    }
}

$("sound-btn").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    $("sound-btn").textContent = soundEnabled ? "♫" : "♪";

    if (!soundEnabled && audioContext) {
        audioContext.suspend();
    } else if (soundEnabled && audioContext) {
        audioContext.resume();
    }
});

// ---------------- GAME RENDERING ----------------

function drawGame() {
    if (!W || !H) return;

    ctx.clearRect(0, 0, W, H);

    drawBackground();
    drawHazards();
    drawSupplies();

    animals.forEach(drawAnimal);

    drawPlayer();
    drawParticles();

    // Low-time visual warning
    if (timeLeft < 20) {
        ctx.fillStyle = "rgba(255,70,50,0.07)";
        ctx.fillRect(0, 0, W, H);
    }
}

// ---------------- GAME UPDATE ----------------

function update(dt) {
    gameTime += dt;

    timeLeft -= dt;

    updatePlayer(dt);
    updateAnimals(dt);
    updateSupplies();
    updateHazards(dt);
    updateParticles(dt);
    updateEnvironment(dt);

    updateHUD();

    if (timeLeft <= 0) {
        gameOver();
    }
}

// ---------------- GAME LOOP ----------------

function gameLoop(timestamp) {
    if (gameState !== "playing") return;

    const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.04);

    lastTime = timestamp;

    update(dt);

    if (gameState === "playing") {
        drawGame();
        requestAnimationFrame(gameLoop);
    }
}

// ---------------- LEVEL INITIALIZATION ----------------

function resetLevel() {
    score = 0;
    lives = 3;
    rescued = 0;
    timeLeft = MISSION_TIME;

    gameTime = 0;
    damageCooldown = 0;
    particles = [];

    player = createPlayer();

    createScenery();
    createAnimals();
    createSupplies();
    createHazards();

    updateHUD();
}

function startGame() {
    resizeCanvas();
    resetLevel();

    gameState = "playing";
    showScreen("game");

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function nextLevel() {
    level++;

    resetLevel();

    gameState = "playing";
    showScreen("game");

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// ---------------- SCREEN MANAGEMENT ----------------

function showScreen(name) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove("active");
    });

    screens[name].classList.add("active");

    if (name === "game") {
        requestAnimationFrame(() => {
            resizeCanvas();
            drawGame();
        });
    }
}

function pauseGame() {
    if (gameState !== "playing") return;

    gameState = "paused";
    showScreen("pause");
}

function resumeGame() {
    if (gameState !== "paused") return;

    gameState = "playing";
    showScreen("game");

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function returnToMenu() {
    gameState = "menu";
    showScreen("menu");
}

function completeLevel() {
    if (gameState !== "playing") return;

    gameState = "complete";

    ui.levelScore.textContent = score;
    ui.levelRescued.textContent = rescued;

    showScreen("complete");
}

function gameOver() {
    if (gameState !== "playing") return;

    gameState = "over";

    ui.finalScore.textContent = score;
    ui.finalRescued.textContent = rescued;

    showScreen("over");
}

// ---------------- BUTTON EVENTS ----------------

$("start-btn").addEventListener("click", () => {
    level = 1;
    startGame();
});

$("restart-btn").addEventListener("click", () => {
    level = 1;
    startGame();
});

$("pause-restart-btn").addEventListener("click", startGame);

$("resume-btn").addEventListener("click", resumeGame);

$("pause-menu-btn").addEventListener("click", returnToMenu);

$("gameover-menu-btn").addEventListener("click", returnToMenu);

$("level-menu-btn").addEventListener("click", returnToMenu);

$("next-level-btn").addEventListener("click", nextLevel);

$("pause-btn").addEventListener("click", pauseGame);

// ---------------- KEYBOARD CONTROLS ----------------

window.addEventListener("keydown", event => {
    const key = event.key.length === 1
        ? event.key.toLowerCase()
        : event.key;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
        event.preventDefault();
    }

    keys[key] = true;

    if (event.key === "Escape" || event.key === "p" || event.key === "P") {
        if (gameState === "playing") pauseGame();
        else if (gameState === "paused") resumeGame();
    }
});

window.addEventListener("keyup", event => {
    const key = event.key.length === 1
        ? event.key.toLowerCase()
        : event.key;

    keys[key] = false;
});

window.addEventListener("blur", () => {
    Object.keys(keys).forEach(key => keys[key] = false);
    Object.keys(mobile).forEach(key => mobile[key] = false);

    if (gameState === "playing") pauseGame();
});

// ---------------- MOBILE CONTROLS ----------------

function setupMobileButton(id, direction) {
    const button = $(id);

    button.addEventListener("pointerdown", event => {
        event.preventDefault();

        mobile[direction] = true;
        button.setPointerCapture(event.pointerId);
    });

    const release = event => {
        event.preventDefault();
        mobile[direction] = false;
    };

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
}

setupMobileButton("up-btn", "up");
setupMobileButton("down-btn", "down");
setupMobileButton("left-btn", "left");
setupMobileButton("right-btn", "right");

// ---------------- INITIALIZATION ----------------

player = createPlayer();

createScenery();
updateHUD();
showScreen("menu");

console.log("🌿 Wildlife Rescue initialized successfully!");
