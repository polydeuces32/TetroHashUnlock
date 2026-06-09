const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const pressureEl = document.getElementById("pressure");
const modelStateEl = document.getElementById("modelState");
const gameMessageEl = document.getElementById("gameMessage");

const signalSpeedEl = document.getElementById("signalSpeed");
const signalMistakesEl = document.getElementById("signalMistakes");
const signalSurvivalEl = document.getElementById("signalSurvival");
const signalAdaptEl = document.getElementById("signalAdapt");

const startButton = document.getElementById("startGame");
const resetButton = document.getElementById("resetGame");

const learning = new window.TetroHashLearningEngine();
const sound = new window.TetroHashSoundEngine();

const COLS = 10;
const ROWS = 16;
const CELL = 32;

const COLORS = ["#6ff7ff", "#ff75eb", "#f7ff28", "#a6ff6f", "#7a9cff"];

const SHAPES = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
];

const state = {
  running: false,
  mode: "tetris",
  grid: [],
  piece: null,
  score: 0,
  level: 1,
  lines: 0,
  previousHash: "00000000000000000001a7f4b9d2c5e8",
  nonce: 0,
  attempts: 0,
  targetZeros: 2,
  targetPrefix: "00",
  currentHash: "",
  blockData: "",
  recentHashes: [],
  lastTime: 0,
  dropCounter: 0,
  fallInterval: 720,
  animationId: null,
};

function createGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  return {
    shape,
    color,
    x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
    y: 0,
  };
}

function shortHash(hash) {
  if (!hash) return "waiting";
  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}

function buildBlockData() {
  return [
    "mode:bitcoin-tetris",
    `lines:${state.lines}`,
    `score:${state.score}`,
    `transactions:${4 + Math.floor(Math.random() * 8)}`,
    `reward:3.125`,
    `fees_btc:${(Math.random() * 0.05 + 0.003).toFixed(5)}`,
    `previous_hash:${state.previousHash}`,
  ].join("|");
}

async function sha256Hex(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function updateDifficulty() {
  const profile = learning.getDifficultyProfile(state.score);
  state.level = profile.difficulty;

  state.fallInterval = Math.max(130, 760 - state.level * 55);

  if (state.score >= 2500) {
    state.targetZeros = 4;
  } else if (state.score >= 900) {
    state.targetZeros = 3;
  } else {
    state.targetZeros = 2;
  }

  state.targetPrefix = "0".repeat(state.targetZeros);

  scoreEl.textContent = state.score;
  levelEl.textContent = state.level;

  pressureEl.textContent =
    state.targetZeros === 2 ? "Low" :
    state.targetZeros === 3 ? "Medium" :
    "High";

  modelStateEl.textContent = profile.adaptation;

  signalSpeedEl.textContent = `Speed: ${learning.getMovesPerMinute()} actions/min`;
  signalMistakesEl.textContent = `Mistakes: ${learning.session.mistakes}`;
  signalSurvivalEl.textContent = `Survival: ${learning.getSurvivalSeconds()}s`;
  signalAdaptEl.textContent =
    state.mode === "mining"
      ? `Mining target: ${state.targetPrefix}`
      : `AI pressure: ${profile.adaptation}`;
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#020b14");
  gradient.addColorStop(1, "#031d2e");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(111, 247, 255, 0.08)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += CELL) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += CELL) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawCell(x, y, color, glow = true) {
  const px = x * CELL;
  const py = y * CELL;

  ctx.fillStyle = color;
  ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(px + 7, py + 7, CELL - 14, 4);

  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = color;
    ctx.strokeRect(px + 3, py + 3, CELL - 6, CELL - 6);
    ctx.shadowBlur = 0;
  }
}

function drawText(text, x, y, size = 12, color = "#f7fbff", weight = "800") {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  ctx.fillText(text, x, y);
}

function drawPiece(piece) {
  piece.shape.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (!value) return;
      drawCell(piece.x + colIndex, piece.y + rowIndex, piece.color);
    });
  });
}

function drawTetris() {
  drawBackground();

  drawText("BITCOIN TETRIS", 18, 28, 16, "#6ff7ff", "900");
  drawText("CLEAR ROWS TO BUILD BLOCK DATA", 18, 48, 10, "#b8cedd", "900");

  state.grid.forEach((row, y) => {
    row.forEach((color, x) => {
      if (color) drawCell(x, y, color, false);
    });
  });

  if (state.piece) drawPiece(state.piece);

  drawText(`lines: ${state.lines}`, 18, 502, 11, "#f7ff28", "900");
  drawText(`next mine target: ${state.targetPrefix}`, 138, 502, 11, "#a6ff6f", "900");
}

function drawMiningPuzzle() {
  drawBackground();

  drawText("SHA-256 MINING PUZZLE", 18, 30, 15, "#6ff7ff", "900");
  drawText("CHANGE NONCE • HASH BLOCK • CHECK TARGET", 18, 50, 10, "#b8cedd", "900");

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(18, 74, 284, 112);
  ctx.strokeStyle = "rgba(111,247,255,0.25)";
  ctx.strokeRect(18, 74, 284, 112);

  drawText("BLOCK DATA", 30, 98, 12, "#f7ff28", "900");
  drawText(`score: ${state.score}`, 30, 122);
  drawText(`lines: ${state.lines}`, 30, 144);
  drawText(`previous: ${shortHash(state.previousHash)}`, 30, 166);

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(18, 210, 284, 110);
  ctx.strokeStyle = state.currentHash.startsWith(state.targetPrefix)
    ? "rgba(166,255,111,0.95)"
    : "rgba(255,117,235,0.3)";
  ctx.strokeRect(18, 210, 284, 110);

  drawText("CURRENT SHA-256 HASH", 30, 236, 12, "#ff75eb", "900");
  drawText(shortHash(state.currentHash), 30, 264, 13, "#ffffff", "900");
  drawText(`nonce: ${state.nonce}`, 30, 292, 12, "#b8cedd", "900");
  drawText(`target: starts with ${state.targetPrefix}`, 138, 292, 12, "#a6ff6f", "900");

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(18, 344, 284, 130);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.strokeRect(18, 344, 284, 130);

  drawText("RECENT HASHES", 30, 370, 12, "#6ff7ff", "900");

  state.recentHashes.slice(0, 4).forEach((item, index) => {
    drawText(
      `#${item.nonce} ${shortHash(item.hash)}`,
      30,
      396 + index * 22,
      11,
      item.valid ? "#a6ff6f" : "#b8cedd",
      "700"
    );
  });
}

function draw() {
  if (state.mode === "mining") {
    drawMiningPuzzle();
  } else {
    drawTetris();
  }
}

function collides(piece, offsetX = 0, offsetY = 0, nextShape = null) {
  const shape = nextShape || piece.shape;

  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;

      const nextX = piece.x + x + offsetX;
      const nextY = piece.y + y + offsetY;

      if (nextX < 0 || nextX >= COLS || nextY >= ROWS) return true;
      if (nextY >= 0 && state.grid[nextY][nextX]) return true;
    }
  }

  return false;
}

function mergePiece() {
  state.piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;

      const gridY = state.piece.y + y;
      const gridX = state.piece.x + x;

      if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
        state.grid[gridY][gridX] = state.piece.color;
      }
    });
  });
}

function clearLines() {
  let cleared = 0;

  state.grid = state.grid.filter((row) => {
    const full = row.every(Boolean);
    if (full) cleared += 1;
    return !full;
  });

  while (state.grid.length < ROWS) {
    state.grid.unshift(Array(COLS).fill(null));
  }

  if (cleared > 0) {
    state.lines += cleared;
    const points = cleared * cleared * 140;
    state.score += points;

    sound.clear();
    learning.recordLineClear(cleared);

    gameMessageEl.textContent =
      `${cleared} transaction row${cleared > 1 ? "s" : ""} cleared. Block data ready for mining.`;

    enterMiningPuzzle();
  }
}

function spawnPiece() {
  state.piece = randomPiece();

  if (collides(state.piece)) {
    endGame();
  }
}

function lockPiece() {
  mergePiece();
  sound.lock();
  clearLines();

  if (state.mode !== "mining") {
    spawnPiece();
  }
}

function movePiece(dx) {
  if (!state.running || state.mode !== "tetris") return;

  if (!collides(state.piece, dx, 0)) {
    state.piece.x += dx;
    sound.move();
    learning.recordMove("move");
  } else {
    learning.recordMistake();
  }
}

function softDrop() {
  if (!state.running || state.mode !== "tetris") return;

  if (!collides(state.piece, 0, 1)) {
    state.piece.y += 1;
    state.score += 1;
    sound.drop();
    learning.recordMove("softDrop");
  } else {
    lockPiece();
  }
}

function hardDrop() {
  if (!state.running || state.mode !== "tetris") return;

  let distance = 0;

  while (!collides(state.piece, 0, 1)) {
    state.piece.y += 1;
    distance += 1;
  }

  state.score += distance * 3;
  sound.drop();
  learning.recordMove("hardDrop");
  lockPiece();
}

function rotateShape(shape) {
  return shape[0].map((_, index) => shape.map((row) => row[index]).reverse());
}

function rotatePiece() {
  if (!state.running || state.mode !== "tetris") return;

  const rotated = rotateShape(state.piece.shape);

  if (!collides(state.piece, 0, 0, rotated)) {
    state.piece.shape = rotated;
    sound.rotate();
    learning.recordMove("rotate");
  } else {
    learning.recordMistake();
    gameMessageEl.textContent = "Rotation blocked. Wall or transaction collision.";
  }
}

function enterMiningPuzzle() {
  state.mode = "mining";
  state.nonce = 0;
  state.attempts = 0;
  state.currentHash = "";
  state.recentHashes = [];
  state.blockData = buildBlockData();

  updateDifficulty();
  draw();

  gameMessageEl.textContent =
    `Mining puzzle unlocked. Press Space to search for a hash starting with ${state.targetPrefix}.`;
}

async function mineOnce() {
  if (!state.running || state.mode !== "mining") return;

  state.nonce += 1;
  state.attempts += 1;
  sound.mine();

  const input = `${state.blockData}|nonce:${state.nonce}`;
  const hash = await sha256Hex(input);
  const valid = hash.startsWith(state.targetPrefix);

  state.currentHash = hash;
  state.recentHashes.unshift({
    nonce: state.nonce,
    hash,
    valid,
  });
  state.recentHashes = state.recentHashes.slice(0, 6);

  learning.recordMove("hashAttempt");

  if (valid) {
    const reward = state.targetZeros * 450 + Math.max(0, 250 - state.attempts);
    state.score += reward;
    state.previousHash = hash;

    sound.validBlock();
    learning.recordLineClear(1);

    gameMessageEl.textContent =
      `Valid block found. Hash starts with ${state.targetPrefix}. +${reward} points.`;

    state.mode = "tetris";
    spawnPiece();
  } else {
    if (state.attempts % 12 === 0) learning.recordMistake();

    gameMessageEl.textContent =
      `Attempt ${state.attempts}: hash misses target ${state.targetPrefix}. Keep mining.`;
  }

  updateDifficulty();
  draw();
}

function update(time = 0) {
  if (!state.running) return;

  const delta = time - state.lastTime;
  state.lastTime = time;

  if (state.mode === "tetris") {
    state.dropCounter += delta;

    if (state.dropCounter > state.fallInterval) {
      softDrop();
      state.dropCounter = 0;
    }
  }

  updateDifficulty();
  draw();

  state.animationId = requestAnimationFrame(update);
}

function startGame() {
  sound.boot();

  cancelAnimationFrame(state.animationId);

  state.running = true;
  state.mode = "tetris";
  state.grid = createGrid();
  state.piece = null;
  state.score = 0;
  state.level = 1;
  state.lines = 0;
  state.nonce = 0;
  state.attempts = 0;
  state.targetZeros = 2;
  state.targetPrefix = "00";
  state.currentHash = "";
  state.recentHashes = [];
  state.previousHash = "00000000000000000001a7f4b9d2c5e8";
  state.lastTime = 0;
  state.dropCounter = 0;

  learning.startSession();
  updateDifficulty();
  spawnPiece();

  gameMessageEl.textContent =
    "Bitcoin Tetris live. Clear transaction rows to unlock SHA-256 mining puzzles.";

  state.animationId = requestAnimationFrame(update);
}

function resetGame() {
  cancelAnimationFrame(state.animationId);

  state.running = false;
  state.mode = "tetris";
  state.grid = createGrid();
  state.piece = null;
  state.score = 0;
  state.level = 1;
  state.lines = 0;
  state.nonce = 0;
  state.attempts = 0;
  state.targetZeros = 2;
  state.targetPrefix = "00";
  state.currentHash = "";
  state.recentHashes = [];
  state.previousHash = "00000000000000000001a7f4b9d2c5e8";

  learning.resetProfile();

  scoreEl.textContent = "0";
  levelEl.textContent = "1";
  pressureEl.textContent = "Low";
  modelStateEl.textContent = "Calibrating";
  signalSpeedEl.textContent = "Speed: waiting";
  signalMistakesEl.textContent = "Mistakes: 0";
  signalSurvivalEl.textContent = "Survival: 0s";
  signalAdaptEl.textContent = "AI pressure: idle";

  gameMessageEl.textContent =
    "Press Start Game to play Bitcoin Tetris and unlock SHA-256 puzzles.";

  draw();
}

function endGame() {
  state.running = false;
  cancelAnimationFrame(state.animationId);

  const summary = learning.completeSession(state.score);
  sound.fail();

  gameMessageEl.textContent =
    `Game over. Best: ${summary.bestScore}. Learned difficulty: ${summary.learnedDifficulty}.`;
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    movePiece(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    movePiece(1);
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    softDrop();
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    rotatePiece();
  }

  if (event.key.toLowerCase() === "r") {
    event.preventDefault();
    rotatePiece();
  }

  if (event.code === "Space") {
    event.preventDefault();

    if (state.mode === "mining") {
      mineOnce();
    } else {
      hardDrop();
    }
  }

  if (event.key === "Escape") {
    event.preventDefault();
    resetGame();
  }
});

startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);

resetGame();
