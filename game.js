const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const pressureEl = document.getElementById("pressure");
const modelStateEl = document.getElementById("modelState");
const gameMessageEl = document.getElementById("gameMessage");

const levelNameEl = document.getElementById("levelName");
const satsBalanceEl = document.getElementById("satsBalance");
const runSatsEl = document.getElementById("runSats");
const blocksMinedEl = document.getElementById("blocksMined");
const levelProgressEl = document.getElementById("levelProgress");
const levelProgressTextEl = document.getElementById("levelProgressText");
const missionTitleEl = document.getElementById("missionTitle");
const missionLessonEl = document.getElementById("missionLesson");
const missionGoalEl = document.getElementById("missionGoal");
const achievementListEl = document.getElementById("achievementList");
const blockHeightEl = document.getElementById("blockHeight");
const transactionCountEl = document.getElementById("transactionCount");
const feeRateEl = document.getElementById("feeRate");
const hashPreviewEl = document.getElementById("hashPreview");
const runReportEl = document.getElementById("runReport");
const aiModeStateEl = document.getElementById("aiModeState");
const aiTutorMessageEl = document.getElementById("aiTutorMessage");
const learningPathEl = document.getElementById("learningPath");
const claimStatusEl = document.getElementById("claimStatus");

const signalSpeedEl = document.getElementById("signalSpeed");
const signalMistakesEl = document.getElementById("signalMistakes");
const signalSurvivalEl = document.getElementById("signalSurvival");
const signalAdaptEl = document.getElementById("signalAdapt");

const startButton = document.getElementById("startGame");
const resetButton = document.getElementById("resetGame");
const pauseButton = document.getElementById("pauseGame");
const learningModeButton = document.getElementById("learningModeToggle");

const learning = new window.TetroHashLearningEngine();
const sound = new window.TetroHashSoundEngine();

const COLS = 10;
const ROWS = 16;
const CELL = 32;
const WIN_SATS_REWARD = 5;
const REWARD_STORAGE_KEY = "tetrohash_deep_rewards_v1";
const GENESIS_PREVIOUS_HASH = "00000000000000000001a7f4b9d2c5e8";

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

const LEVELS = [
  {
    name: "Genesis Block",
    lesson: "Every Bitcoin chain starts with a first block.",
    goal: "Clear 1 row, then press Space to mine.",
    linesToMine: 1,
    targetZeros: 2,
    hashBatch: 10,
    fallInterval: 720,
    reward: 520,
    transactions: [4, 8],
    fees: [2, 8],
    theme: ["#020b14", "#032235", "#6ff7ff"],
  },
  {
    name: "Mempool Rush",
    lesson: "Pending transactions compete for limited block space.",
    goal: "Keep the board open while mempool pressure rises.",
    linesToMine: 1,
    targetZeros: 2,
    hashBatch: 12,
    fallInterval: 675,
    reward: 600,
    transactions: [8, 14],
    fees: [5, 16],
    theme: ["#06192e", "#102f59", "#7a9cff"],
  },
  {
    name: "Nonce Hunt",
    lesson: "Miners change the nonce and hash again until the target matches.",
    goal: "Mine two chained blocks without losing placement control.",
    linesToMine: 1,
    targetZeros: 2,
    hashBatch: 14,
    fallInterval: 635,
    reward: 700,
    transactions: [12, 20],
    fees: [8, 22],
    theme: ["#111827", "#3f2d09", "#f7ff28"],
  },
  {
    name: "Fee Market Frenzy",
    lesson: "Higher fee rates make transactions more attractive to miners.",
    goal: "Build a profitable block before the queue crowds the board.",
    linesToMine: 2,
    targetZeros: 2,
    hashBatch: 16,
    fallInterval: 595,
    reward: 820,
    transactions: [18, 28],
    fees: [14, 38],
    surgeRows: 1,
    theme: ["#190d1f", "#4b123d", "#ff75eb"],
  },
  {
    name: "First Confirmation",
    lesson: "A mined block gives transactions their first confirmation.",
    goal: "Mine the block and protect the next chain link.",
    linesToMine: 2,
    targetZeros: 2,
    hashBatch: 18,
    fallInterval: 560,
    reward: 940,
    transactions: [22, 34],
    fees: [18, 46],
    theme: ["#081b18", "#114431", "#a6ff6f"],
  },
  {
    name: "Difficulty Adjustment",
    lesson: "Bitcoin retargets difficulty so blocks remain hard to produce.",
    goal: "Boss round: clear rows and mine under a tighter target.",
    linesToMine: 2,
    targetZeros: 3,
    hashBatch: 34,
    fallInterval: 525,
    reward: 1250,
    transactions: [28, 42],
    fees: [24, 58],
    boss: true,
    surgeRows: 1,
    theme: ["#101323", "#293b73", "#6ff7ff"],
  },
  {
    name: "Orphan Block Warning",
    lesson: "Late blocks can be left behind when another chain tip wins.",
    goal: "Avoid stale rows and keep your proof-of-work run alive.",
    linesToMine: 2,
    targetZeros: 2,
    hashBatch: 22,
    fallInterval: 495,
    reward: 1120,
    transactions: [34, 50],
    fees: [28, 66],
    surgeRows: 2,
    theme: ["#1d1216", "#4f1728", "#ff5f7d"],
  },
  {
    name: "Lightning Channel Sprint",
    lesson: "Lightning moves small payments fast while Bitcoin secures final settlement.",
    goal: "Play fast, clear cleanly, and keep the channel open.",
    linesToMine: 2,
    targetZeros: 2,
    hashBatch: 24,
    fallInterval: 465,
    reward: 1240,
    transactions: [38, 58],
    fees: [18, 44],
    theme: ["#071327", "#142f6d", "#f7ff28"],
  },
  {
    name: "Mining Pool Mayhem",
    lesson: "Pools combine hashrate and split rewards across many miners.",
    goal: "Chain three clean mining wins into a bigger combo.",
    linesToMine: 3,
    targetZeros: 2,
    hashBatch: 26,
    fallInterval: 440,
    reward: 1380,
    transactions: [42, 64],
    fees: [32, 74],
    surgeRows: 1,
    theme: ["#071f22", "#16565e", "#6ff7ff"],
  },
  {
    name: "Halving Pressure",
    lesson: "The block subsidy falls over time, making fee strategy matter more.",
    goal: "Boss round: mine through reduced subsidy pressure.",
    linesToMine: 3,
    targetZeros: 3,
    hashBatch: 42,
    fallInterval: 415,
    reward: 1600,
    transactions: [50, 76],
    fees: [44, 92],
    boss: true,
    surgeRows: 2,
    theme: ["#1f1706", "#5b3b05", "#f7ff28"],
  },
  {
    name: "Node Sync Crisis",
    lesson: "Nodes verify the chain independently before trusting new blocks.",
    goal: "Keep the grid stable while validation catches up.",
    linesToMine: 3,
    targetZeros: 2,
    hashBatch: 30,
    fallInterval: 390,
    reward: 1500,
    transactions: [58, 84],
    fees: [36, 82],
    surgeRows: 2,
    theme: ["#071716", "#17453e", "#a6ff6f"],
  },
  {
    name: "Block Height Ascent",
    lesson: "Each valid block raises the chain height by one.",
    goal: "Climb toward the final confirmation set.",
    linesToMine: 3,
    targetZeros: 2,
    hashBatch: 32,
    fallInterval: 365,
    reward: 1660,
    transactions: [64, 92],
    fees: [48, 104],
    surgeRows: 2,
    theme: ["#10162a", "#1b4d78", "#7a9cff"],
  },
  {
    name: "Hash Storm",
    lesson: "Higher hashrate means more guesses racing for the same next block.",
    goal: "Survive rapid drops and mine before pressure reaches critical.",
    linesToMine: 3,
    targetZeros: 3,
    hashBatch: 48,
    fallInterval: 340,
    reward: 1900,
    transactions: [72, 108],
    fees: [58, 126],
    boss: true,
    surgeRows: 2,
    theme: ["#071420", "#053d54", "#6ff7ff"],
  },
  {
    name: "Final Confirmation",
    lesson: "Deep confirmations make rewriting history dramatically harder.",
    goal: "Mine the final pre-boss block and secure the chain.",
    linesToMine: 4,
    targetZeros: 3,
    hashBatch: 54,
    fallInterval: 320,
    reward: 2200,
    transactions: [86, 126],
    fees: [72, 144],
    surgeRows: 3,
    theme: ["#1f1021", "#551b5f", "#ff75eb"],
  },
  {
    name: "Satoshi's Final Block",
    lesson: "A complete run links gameplay, block data, nonce search, and proof-of-work.",
    goal: "Final boss: mine the last block to win 5 in-game sats.",
    linesToMine: 4,
    targetZeros: 3,
    hashBatch: 64,
    fallInterval: 300,
    reward: 2600,
    transactions: [100, 144],
    fees: [88, 180],
    boss: true,
    surgeRows: 3,
    theme: ["#120914", "#4c1028", "#ff75eb"],
  },
];

const ACHIEVEMENTS = {
  firstClear: "First Row Clear",
  firstBlock: "First Block Mined",
  feeMarket: "Fee Market Builder",
  bossWin: "Boss Miner",
  levelFive: "Five-Block Chain",
  levelTen: "Ten-Block Chain",
  comboThree: "Three Block Streak",
  daily: "Daily Miner",
  champion: "Satoshi Run Complete",
};

const todayKey = new Date().toISOString().slice(0, 10);
const dailyTarget = 3 + (todayKey.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4);

let rewardProfile = loadRewardProfile();

const state = {
  running: false,
  won: false,
  paused: false,
  aiLearningMode: true,
  mode: "tetris",
  grid: [],
  piece: null,
  score: 0,
  level: 1,
  lines: 0,
  linesSinceMine: 0,
  blocksMined: 0,
  blockHeight: 840000,
  transactionCount: 0,
  feeRate: 0,
  combo: 0,
  bestCombo: 0,
  runSats: 0,
  previousHash: GENESIS_PREVIOUS_HASH,
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
  miningBusy: false,
  levelIntroUntil: 0,
  report: "Press Start and clear your first row.",
};

function loadRewardProfile() {
  const fallback = {
    satsBalance: 0,
    wins: 0,
    bestScore: 0,
    bestLevel: 1,
    achievements: [],
    rewardHistory: [],
    lastDailyKey: "",
  };

  try {
    const stored = window.localStorage.getItem(REWARD_STORAGE_KEY);
    if (!stored) return fallback;

    return {
      ...fallback,
      ...JSON.parse(stored),
    };
  } catch {
    return fallback;
  }
}

function saveRewardProfile() {
  window.localStorage.setItem(REWARD_STORAGE_KEY, JSON.stringify(rewardProfile));
}

function createGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function getCurrentLevel() {
  return LEVELS[Math.min(state.level - 1, LEVELS.length - 1)];
}

function getLevelByBlocksMined() {
  return Math.min(LEVELS.length, state.blocksMined + 1);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPiece() {
  const level = getCurrentLevel();
  const palette = [...COLORS, level.theme[2]];
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = palette[Math.floor(Math.random() * palette.length)];

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
  const level = getCurrentLevel();
  const [minTransactions, maxTransactions] = level.transactions;
  const [minFees, maxFees] = level.fees;

  state.transactionCount = randomBetween(minTransactions, maxTransactions);
  state.feeRate = randomBetween(minFees, maxFees);

  return [
    "mode:bitcoin-tetris",
    `level:${state.level}`,
    `level_name:${level.name}`,
    `block_height:${state.blockHeight + 1}`,
    `lines:${state.lines}`,
    `score:${state.score}`,
    `transactions:${state.transactionCount}`,
    `fee_rate_sat_vb:${state.feeRate}`,
    "reward:3.125",
    `previous_hash:${state.previousHash}`,
    `daily_challenge:${todayKey}-${dailyTarget}`,
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

function calculateMempoolPressure() {
  const filledCells = state.grid.flat().filter(Boolean).length;
  const topRows = state.grid.slice(0, 4).flat().filter(Boolean).length;
  const boardPressure = (filledCells / (COLS * ROWS)) * 65;
  const dangerPressure = (topRows / (COLS * 4)) * 25;
  const levelPressure = (state.level / LEVELS.length) * 10;

  return Math.min(100, Math.round(boardPressure + dangerPressure + levelPressure));
}

function getPressureLabel(pressure) {
  if (pressure < 30) return "Calm";
  if (pressure < 55) return "Busy";
  if (pressure < 78) return "Tight";
  return "Full";
}

function friendlyPaceLabel(profile, level) {
  if (profile.fallInterval > level.fallInterval) return "Taking it easy";
  if (profile.difficulty >= 7) return "Picking up speed";
  return "Steady pace";
}

function unlockAchievement(id) {
  if (!ACHIEVEMENTS[id] || rewardProfile.achievements.includes(id)) return;

  rewardProfile.achievements.push(id);
  saveRewardProfile();
}

function updateDifficulty() {
  state.level = getLevelByBlocksMined();

  const level = getCurrentLevel();
  const profile = learning.getDifficultyProfile(state.score);

  state.targetZeros = level.targetZeros;
  state.targetPrefix = "0".repeat(state.targetZeros);
  // Campaign sets the floor; the tutor can only slow drops for struggling players.
  state.fallInterval = Math.max(245, Math.max(level.fallInterval, profile.fallInterval));

  const pressure = calculateMempoolPressure();
  const tutorMessage = learning.getTutorMessage({
    mode: state.mode,
    levelName: level.name,
    pressure,
    linesSinceMine: state.linesSinceMine,
    linesToMine: level.linesToMine,
    targetPrefix: state.targetPrefix,
    attempts: state.attempts,
    paused: state.paused,
    won: state.won,
    aiLearningMode: state.aiLearningMode,
  });

  if (scoreEl) scoreEl.textContent = state.score;
  if (levelEl) levelEl.textContent = `${state.level}/${LEVELS.length}`;
  if (pressureEl) pressureEl.textContent = getPressureLabel(pressure);
  if (modelStateEl) {
    modelStateEl.textContent = state.aiLearningMode
      ? friendlyPaceLabel(profile, level)
      : "Hints off";
  }

  if (levelNameEl) levelNameEl.textContent = level.name;
  if (satsBalanceEl) satsBalanceEl.textContent = `${rewardProfile.satsBalance} bonus`;
  if (runSatsEl) runSatsEl.textContent = `${state.runSats} this run`;
  if (blocksMinedEl) blocksMinedEl.textContent = `${state.blocksMined}/${LEVELS.length}`;

  if (levelProgressEl && levelProgressTextEl) {
    const progress = Math.min(100, Math.round((state.linesSinceMine / level.linesToMine) * 100));
    levelProgressEl.style.width = `${progress}%`;
    levelProgressTextEl.textContent =
      `${Math.min(state.linesSinceMine, level.linesToMine)}/${level.linesToMine} rows cleared`;
  }

  if (missionTitleEl) missionTitleEl.textContent = `${state.level}. ${level.name}`;
  if (missionLessonEl) missionLessonEl.textContent = level.lesson;
  if (missionGoalEl) missionGoalEl.textContent = level.goal;

  if (blockHeightEl) blockHeightEl.textContent = state.blockHeight.toLocaleString();
  if (transactionCountEl) transactionCountEl.textContent = state.transactionCount || "--";
  if (feeRateEl) feeRateEl.textContent = state.feeRate ? `${state.feeRate} sat/vB` : "--";
  if (hashPreviewEl) hashPreviewEl.textContent = shortHash(state.currentHash || state.previousHash);
  if (aiModeStateEl) aiModeStateEl.textContent = state.aiLearningMode ? "Hints on" : "Hints off";
  if (aiTutorMessageEl) aiTutorMessageEl.textContent = tutorMessage;
  if (learningPathEl) learningPathEl.textContent = learning.getLearningPath(state.blocksMined, state.won);
  if (claimStatusEl) {
    claimStatusEl.textContent = state.won
      ? `Nice work! +${WIN_SATS_REWARD} bonus sats saved on this device.`
      : `Beat all ${LEVELS.length} levels to save ${WIN_SATS_REWARD} bonus sats here.`;
  }
  if (pauseButton) pauseButton.textContent = state.paused ? "Resume" : "Pause";
  if (learningModeButton) {
    learningModeButton.textContent = state.aiLearningMode ? "Hints: On" : "Hints: Off";
  }

  if (signalSpeedEl) signalSpeedEl.textContent = `Speed: ${learning.getMovesPerMinute()} moves/min`;
  if (signalMistakesEl) signalMistakesEl.textContent = `Missed spots: ${learning.session.mistakes}`;
  if (signalSurvivalEl) signalSurvivalEl.textContent = `Time playing: ${learning.getSurvivalSeconds()}s`;
  if (signalAdaptEl) {
    signalAdaptEl.textContent =
      !state.aiLearningMode
        ? "Hints hidden"
        : state.mode === "mining"
          ? `Mining — keep pressing Space`
          : profile.fallInterval > level.fallInterval
            ? "Game slowed down to help you"
            : friendlyPaceLabel(profile, level);
  }

  renderAchievements();
  if (runReportEl) runReportEl.textContent = state.report;
}

function renderAchievements() {
  if (!achievementListEl) return;

  achievementListEl.innerHTML = "";

  const unlocked = rewardProfile.achievements.slice(-5);
  if (unlocked.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No badges yet — keep playing!";
    achievementListEl.appendChild(empty);
    return;
  }

  unlocked.forEach((id) => {
    const item = document.createElement("li");
    item.textContent = ACHIEVEMENTS[id];
    achievementListEl.appendChild(item);
  });
}

function drawBackground() {
  const level = getCurrentLevel();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, level.theme[0]);
  gradient.addColorStop(1, level.theme[1]);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
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

function drawWrappedText(text, x, y, maxWidth, lineHeight, size = 11, color = "#b8cedd") {
  ctx.fillStyle = color;
  ctx.font = `800 ${size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;

  const words = text.split(" ");
  let line = "";
  let currentY = y;

  words.forEach((word) => {
    const testLine = `${line}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY);
      line = `${word} `;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  });

  ctx.fillText(line.trim(), x, currentY);
}

function drawPiece(piece) {
  piece.shape.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (!value) return;
      drawCell(piece.x + colIndex, piece.y + rowIndex, piece.color);
    });
  });
}

function drawMempoolMeter() {
  const pressure = calculateMempoolPressure();
  const level = getCurrentLevel();

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(18, 470, 284, 12);
  ctx.fillStyle = pressure >= 78 ? "#ff5f7d" : level.theme[2];
  ctx.fillRect(18, 470, Math.round(284 * (pressure / 100)), 12);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.strokeRect(18, 470, 284, 12);
  drawText(`board fill: ${pressure}%`, 18, 502, 11, "#f7ff28", "900");
}

function drawLevelIntro() {
  if (Date.now() > state.levelIntroUntil) return;

  const level = getCurrentLevel();
  ctx.fillStyle = "rgba(2, 11, 20, 0.9)";
  ctx.fillRect(18, 126, 284, 220);
  ctx.strokeStyle = level.theme[2];
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 126, 284, 220);

  drawText(`LEVEL ${state.level}`, 38, 164, 13, level.theme[2], "900");
  drawWrappedText(level.name.toUpperCase(), 38, 196, 244, 23, 20, "#ffffff");
  drawWrappedText(level.lesson, 38, 250, 244, 18, 11, "#b8cedd");
  drawText(level.boss ? "BIG MINING ROUND" : "CLEAR ROWS TO MINE", 38, 314, 11, "#f7ff28", "900");
}

function drawTetris() {
  const level = getCurrentLevel();
  drawBackground();

  drawText(level.name.toUpperCase(), 18, 28, 15, level.theme[2], "900");
  drawText(`clear ${level.linesToMine} row${level.linesToMine > 1 ? "s" : ""} to unlock mining`, 18, 48, 10, "#b8cedd", "900");

  state.grid.forEach((row, y) => {
    row.forEach((color, x) => {
      if (color) drawCell(x, y, color, false);
    });
  });

  if (state.piece) drawPiece(state.piece);

  drawText(`level: ${state.level}/${LEVELS.length}`, 18, 442, 11, "#ffffff", "900");
  drawText(`blocks: ${state.blocksMined}/${LEVELS.length}`, 138, 442, 11, "#a6ff6f", "900");
  drawText(`next hash starts with ${state.targetPrefix}`, 18, 458, 11, "#ff75eb", "900");
  drawMempoolMeter();
  drawLevelIntro();
}

function drawMiningPuzzle() {
  const level = getCurrentLevel();
  drawBackground();

  drawText(level.boss ? "BIG MINING ROUND" : "MINING TIME", 18, 30, 15, level.theme[2], "900");
  drawText(`PRESS SPACE — ${level.hashBatch} tries per press`, 18, 50, 10, "#b8cedd", "900");

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(18, 74, 284, 120);
  ctx.strokeStyle = "rgba(111,247,255,0.25)";
  ctx.strokeRect(18, 74, 284, 120);

  drawText("YOUR BLOCK", 30, 98, 12, "#f7ff28", "900");
  drawText(`block #${state.blockHeight + 1}`, 30, 122);
  drawText(`try #${state.nonce}`, 30, 144);
  drawText(`last hash: ${shortHash(state.previousHash)}`, 30, 166);

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(18, 218, 284, 116);
  ctx.strokeStyle = state.currentHash.startsWith(state.targetPrefix)
    ? "rgba(166,255,111,0.95)"
    : "rgba(255,117,235,0.3)";
  ctx.strokeRect(18, 218, 284, 116);

  drawText("CURRENT HASH", 30, 244, 12, "#ff75eb", "900");
  drawText(shortHash(state.currentHash), 30, 272, 13, "#ffffff", "900");
  drawText(`try: ${state.nonce}`, 30, 302, 12, "#b8cedd", "900");
  drawText(`need: ${state.targetPrefix}...`, 138, 302, 12, "#a6ff6f", "900");

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(18, 358, 284, 118);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.strokeRect(18, 358, 284, 118);

  drawText("RECENT TRIES", 30, 382, 12, level.theme[2], "900");

  state.recentHashes.slice(0, 4).forEach((item, index) => {
    drawText(
      `#${item.nonce} ${shortHash(item.hash)}`,
      30,
      408 + index * 20,
      11,
      item.valid ? "#a6ff6f" : "#b8cedd",
      "700"
    );
  });
}

function drawVictory() {
  drawBackground();

  ctx.fillStyle = "rgba(2, 11, 20, 0.9)";
  ctx.fillRect(18, 94, 284, 330);
  ctx.strokeStyle = "#f7ff28";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 94, 284, 330);

  drawText("YOU WIN!", 44, 142, 26, "#f7ff28", "1000");
  drawWrappedText("All 15 levels complete. Nice run!", 44, 190, 230, 21, 13, "#ffffff");
  drawText(`score: ${state.score}`, 44, 280, 13, "#6ff7ff", "900");
  drawText(`best streak: ${state.bestCombo}`, 44, 306, 13, "#a6ff6f", "900");
  drawText(`bonus saved: +${state.runSats}`, 44, 332, 13, "#f7ff28", "900");
  drawText("Saved on this device.", 44, 382, 11, "#b8cedd", "900");
}

function drawPausedOverlay() {
  ctx.fillStyle = "rgba(2, 11, 20, 0.76)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(28, 176, 264, 154);
  ctx.strokeStyle = "#f7ff28";
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 176, 264, 154);

  drawText("PAUSED", 94, 224, 28, "#f7ff28", "1000");
  drawWrappedText(
    "Take a breath. Press Resume or P when you are ready.",
    48,
    266,
    224,
    20,
    12,
    "#ffffff"
  );
}

function draw() {
  if (!ctx) return;

  if (state.won) {
    drawVictory();
  } else if (state.mode === "mining") {
    drawMiningPuzzle();
  } else {
    drawTetris();
  }

  if (state.paused && !state.won) {
    drawPausedOverlay();
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
    const level = getCurrentLevel();
    state.lines += cleared;
    state.linesSinceMine += cleared;

    const points = cleared * cleared * 140 + state.level * 25;
    state.score += points;

    sound.clear();
    learning.recordLineClear(cleared);
    unlockAchievement("firstClear");
    if (cleared >= 4) unlockAchievement("feeMarket");

    if (state.linesSinceMine >= level.linesToMine) {
      gameMessageEl.textContent =
        `Row cleared! Press Space to mine.`;
      enterMiningPuzzle();
    } else {
      gameMessageEl.textContent =
        `${cleared} row${cleared > 1 ? "s" : ""} cleared. ${level.linesToMine - state.linesSinceMine} more to unlock mining.`;
    }
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

  if (state.mode !== "mining" && state.running) {
    spawnPiece();
  }
}

function movePiece(dx) {
  if (!state.running || state.paused || state.mode !== "tetris") return;

  if (!collides(state.piece, dx, 0)) {
    state.piece.x += dx;
    sound.move();
    learning.recordMove("move");
  } else {
    learning.recordMistake();
  }
}

function softDrop() {
  if (!state.running || state.paused || state.mode !== "tetris") return;

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
  if (!state.running || state.paused || state.mode !== "tetris") return;

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
  if (!state.running || state.paused || state.mode !== "tetris") return;

  const rotated = rotateShape(state.piece.shape);

  if (!collides(state.piece, 0, 0, rotated)) {
    state.piece.shape = rotated;
    sound.rotate();
    learning.recordMove("rotate");
  } else {
    learning.recordMistake();
    gameMessageEl.textContent = "Can't rotate there — try moving first.";
  }
}

function enterMiningPuzzle() {
  const level = getCurrentLevel();

  state.mode = "mining";
  state.nonce = 0;
  state.attempts = 0;
  state.currentHash = "";
  state.recentHashes = [];
  state.blockData = buildBlockData();

  updateDifficulty();
  draw();

  gameMessageEl.textContent =
    `${level.boss ? "Big mining round" : "Mining time"}! Press Space to search for a lucky hash.`;
}

function addMempoolSurge(rows = 0) {
  const level = getCurrentLevel();

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const row = Array(COLS).fill(level.theme[2]);
    const holes = 2 + Math.floor(Math.random() * 2);

    for (let hole = 0; hole < holes; hole += 1) {
      row[Math.floor(Math.random() * COLS)] = null;
    }

    state.grid.shift();
    state.grid.push(row);
  }
}

function completeVictory() {
  state.running = false;
  state.won = true;
  state.paused = false;
  state.runSats += WIN_SATS_REWARD;

  cancelAnimationFrame(state.animationId);

  rewardProfile.satsBalance += WIN_SATS_REWARD;
  rewardProfile.wins += 1;
  rewardProfile.bestScore = Math.max(rewardProfile.bestScore, state.score);
  rewardProfile.bestLevel = LEVELS.length;
  rewardProfile.rewardHistory.unshift({
    date: new Date().toISOString(),
    sats: WIN_SATS_REWARD,
    score: state.score,
  });
  rewardProfile.rewardHistory = rewardProfile.rewardHistory.slice(0, 10);

  unlockAchievement("champion");
  saveRewardProfile();
  const summary = learning.completeSession(state.score);
  sound.validBlock();

  state.report =
    `Victory: ${LEVELS.length} blocks mined, ${state.score} points, best combo ${state.bestCombo}, +${WIN_SATS_REWARD} sats. ${learning.getRunLesson(summary, state.blocksMined, true)}`;
  gameMessageEl.textContent =
    `You win! +${WIN_SATS_REWARD} bonus sats saved on this device.`;

  updateDifficulty();
  draw();
}

function handleValidBlock(hash) {
  const completedLevel = getCurrentLevel();
  const speedBonus = Math.max(0, 320 - state.attempts);
  const bossBonus = completedLevel.boss ? 500 : 0;
  const comboBonus = state.combo * 120;
  const reward = completedLevel.reward + speedBonus + bossBonus + comboBonus;

  state.score += reward;
  state.previousHash = hash;
  state.blockHeight += 1;
  state.blocksMined += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.linesSinceMine = 0;

  sound.validBlock();
  learning.recordLineClear(1);
  unlockAchievement("firstBlock");

  if (completedLevel.boss) unlockAchievement("bossWin");
  if (state.blocksMined >= 5) unlockAchievement("levelFive");
  if (state.blocksMined >= 10) unlockAchievement("levelTen");
  if (state.combo >= 3) unlockAchievement("comboThree");
  if (state.blocksMined >= dailyTarget && rewardProfile.lastDailyKey !== todayKey) {
    rewardProfile.lastDailyKey = todayKey;
    unlockAchievement("daily");
  }

  rewardProfile.bestScore = Math.max(rewardProfile.bestScore, state.score);
  rewardProfile.bestLevel = Math.max(rewardProfile.bestLevel, state.blocksMined);
  saveRewardProfile();

  gameMessageEl.textContent =
    `Block found! +${reward} points. Level ${state.blocksMined}/${LEVELS.length} done.`;

  if (state.blocksMined >= LEVELS.length) {
    completeVictory();
    return;
  }

  state.level = getLevelByBlocksMined();
  state.mode = "tetris";
  state.levelIntroUntil = Date.now() + 1200;

  const nextLevel = getCurrentLevel();
  if (nextLevel.surgeRows) addMempoolSurge(nextLevel.surgeRows);

  sound.levelUp();
  spawnPiece();
}

async function mineBatch() {
  if (!state.running || state.paused || state.mode !== "mining" || state.miningBusy) return;

  const level = getCurrentLevel();
  state.miningBusy = true;

  for (let attempt = 0; attempt < level.hashBatch; attempt += 1) {
    state.nonce += 1;
    state.attempts += 1;

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

    if (attempt % 4 === 0) sound.mine();
    learning.recordMove("hashAttempt");

    if (valid) {
      handleValidBlock(hash);
      state.miningBusy = false;
      updateDifficulty();
      draw();
      return;
    }
  }

  if (state.attempts % (level.hashBatch * 4) === 0) learning.recordMistake();

  state.miningBusy = false;
  state.combo = Math.max(0, state.combo - 1);
  gameMessageEl.textContent =
    `Not yet — keep pressing Space. You need a hash starting with ${state.targetPrefix}.`;

  updateDifficulty();
  draw();
}

function update(time = 0) {
  if (!state.running) return;

  const delta = time - state.lastTime;
  state.lastTime = time;

  if (!state.paused && state.mode === "tetris") {
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

function togglePause() {
  if (!state.running || state.won) return;

  state.paused = !state.paused;
  state.dropCounter = 0;
  gameMessageEl.textContent = state.paused
    ? "Paused. Press Resume when ready."
    : "Back to it — clear rows and mine blocks.";

  updateDifficulty();
  draw();
}

function toggleLearningMode() {
  state.aiLearningMode = !state.aiLearningMode;
  gameMessageEl.textContent = state.aiLearningMode
    ? "Hints turned on."
    : "Hints turned off — same game, less help.";

  updateDifficulty();
  draw();
}

function startGame() {
  sound.boot();

  cancelAnimationFrame(state.animationId);

  state.running = true;
  state.won = false;
  state.paused = false;
  state.mode = "tetris";
  state.grid = createGrid();
  state.piece = null;
  state.score = 0;
  state.level = 1;
  state.lines = 0;
  state.linesSinceMine = 0;
  state.blocksMined = 0;
  state.blockHeight = 840000;
  state.transactionCount = 0;
  state.feeRate = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.runSats = 0;
  state.nonce = 0;
  state.attempts = 0;
  state.targetZeros = 2;
  state.targetPrefix = "00";
  state.currentHash = "";
  state.recentHashes = [];
  state.previousHash = GENESIS_PREVIOUS_HASH;
  state.lastTime = 0;
  state.dropCounter = 0;
  state.miningBusy = false;
  state.levelIntroUntil = Date.now() + 1200;
  state.report = `Today's goal: finish ${dailyTarget} blocks if you can. Win the full game for ${WIN_SATS_REWARD} bonus sats.`;

  learning.startSession();
  updateDifficulty();
  spawnPiece();

  gameMessageEl.textContent =
    "Go! Use arrow keys or touch buttons. Clear a row, then press Space to mine.";

  state.animationId = requestAnimationFrame(update);
}

function resetGame() {
  cancelAnimationFrame(state.animationId);

  state.running = false;
  state.won = false;
  state.paused = false;
  state.mode = "tetris";
  state.grid = createGrid();
  state.piece = null;
  state.score = 0;
  state.level = 1;
  state.lines = 0;
  state.linesSinceMine = 0;
  state.blocksMined = 0;
  state.blockHeight = 840000;
  state.transactionCount = 0;
  state.feeRate = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.runSats = 0;
  state.nonce = 0;
  state.attempts = 0;
  state.targetZeros = 2;
  state.targetPrefix = "00";
  state.currentHash = "";
  state.recentHashes = [];
  state.previousHash = GENESIS_PREVIOUS_HASH;
  state.miningBusy = false;
  state.levelIntroUntil = 0;
  state.report = `Best score: ${rewardProfile.bestScore}. Furthest level: ${rewardProfile.bestLevel}/${LEVELS.length}. Wins: ${rewardProfile.wins}.`;

  learning.startSession();

  updateDifficulty();

  gameMessageEl.textContent =
    "Press Start Game when you are ready.";

  draw();
}

function endGame() {
  state.running = false;
  state.won = false;
  state.paused = false;
  cancelAnimationFrame(state.animationId);

  const summary = learning.completeSession(state.score);

  rewardProfile.bestScore = Math.max(rewardProfile.bestScore, state.score);
  rewardProfile.bestLevel = Math.max(rewardProfile.bestLevel, state.blocksMined);
  saveRewardProfile();

  state.report =
    `Run ended: level ${state.level}, ${state.blocksMined} blocks mined, score ${state.score}, best ${summary.bestScore}. ${learning.getRunLesson(summary, state.blocksMined, false)}`;

  sound.fail();
  updateDifficulty();

  gameMessageEl.textContent =
    `Game over. Best score: ${summary.bestScore}. Try again!`;

  draw();
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

  if (event.key.toLowerCase() === "p") {
    event.preventDefault();
    togglePause();
  }

  if (event.code === "Space") {
    event.preventDefault();

    if (state.mode === "mining") {
      mineBatch();
    } else {
      hardDrop();
    }
  }

  if (event.key === "Escape") {
    event.preventDefault();
    resetGame();
  }
});

document.querySelectorAll("[data-control]").forEach((button) => {
  button.addEventListener("click", () => {
    const control = button.dataset.control;

    if (control === "left") movePiece(-1);
    if (control === "right") movePiece(1);
    if (control === "rotate") rotatePiece();
    if (control === "drop") hardDrop();
    if (control === "pause") togglePause();
    if (control === "mine") {
      if (state.mode === "mining") {
        mineBatch();
      } else {
        hardDrop();
      }
    }
  });
});

function bootGame() {
  if (!canvas || !ctx) {
    if (gameMessageEl) {
      gameMessageEl.textContent = "Game could not load. Please refresh the page.";
    }
    return;
  }

  startButton?.addEventListener("click", () => {
    startGame();
    canvas?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  resetButton?.addEventListener("click", resetGame);
  pauseButton?.addEventListener("click", togglePause);
  learningModeButton?.addEventListener("click", toggleLearningMode);

  document.getElementById("heroStart")?.addEventListener("click", () => {
    startGame();
    document.getElementById("game")?.scrollIntoView({ behavior: "smooth", block: "start" });
    canvas?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  resetGame();
}

bootGame();
