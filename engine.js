/*
 * TetroHash engine: pure, deterministic gameplay logic.
 *
 * No DOM, no canvas, no Math.random, no Date.now. Storage and hashing are
 * injected so everything here can be unit-tested under Node:
 *   node scripts/test_engine.js
 *
 * Browser: exposed as window.TetroHashEngine. Node: module.exports.
 *
 * NOTE: mining in this game is an educational SIMULATION. It uses real SHA-256
 * but with a tiny leading-zero target; it is unrelated to the Bitcoin network,
 * which hashes an 80-byte header twice (double SHA-256) against a ~2^76+
 * difficulty target.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TetroHashEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const HIGH_SCORE_KEY = "tetrohash_highscores_v1";
  const HIGH_SCORE_LIMIT = 10;
  const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

  /* ---------- board ---------- */

  function createGrid(rows, cols) {
    return Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  function rotateShape(shape) {
    return shape[0].map((_, index) => shape.map((row) => row[index]).reverse());
  }

  // Same semantics as the original game.js collides(): rows above the board
  // (y < 0) never collide with the stack, walls and floor always do.
  function collides(grid, piece, offsetX = 0, offsetY = 0, nextShape = null) {
    const shape = nextShape || piece.shape;
    const rows = grid.length;
    const cols = grid[0].length;

    for (let y = 0; y < shape.length; y += 1) {
      for (let x = 0; x < shape[y].length; x += 1) {
        if (!shape[y][x]) continue;
        const nx = piece.x + x + offsetX;
        const ny = piece.y + y + offsetY;
        if (nx < 0 || nx >= cols || ny >= rows) return true;
        if (ny >= 0 && grid[ny][nx]) return true;
      }
    }
    return false;
  }

  // Returns { grid, cleared }. Does not mutate the input grid.
  function clearFullRows(grid) {
    const cols = grid[0].length;
    const kept = grid.filter((row) => !row.every(Boolean));
    const cleared = grid.length - kept.length;
    const padding = Array.from({ length: cleared }, () => Array(cols).fill(null));
    return { grid: padding.concat(kept), cleared };
  }

  /* ---------- scoring ---------- */

  // Original formula, unchanged: cleared^2 * 140 + level * 25.
  function lineClearPoints(cleared, level) {
    if (!(cleared > 0)) return 0;
    return cleared * cleared * 140 + level * 25;
  }

  // chain = number of consecutive piece locks (including this one) that cleared
  // rows. First clear of a chain earns nothing extra; each follow-up adds 50.
  function chainBonus(chain) {
    return chain > 1 ? (chain - 1) * 50 : 0;
  }

  // Original formula, unchanged: reward + speed + boss + combo.
  function blockReward({ baseReward = 0, attempts = 0, boss = false, combo = 0 }) {
    const speedBonus = Math.max(0, 320 - attempts);
    const bossBonus = boss ? 500 : 0;
    const comboBonus = combo * 120;
    return {
      total: baseReward + speedBonus + bossBonus + comboBonus,
      speedBonus,
      bossBonus,
      comboBonus,
    };
  }

  function comboLabel(combo) {
    if (combo >= 5) return `Block streak x${combo}!`;
    if (combo >= 3) return `Streak x${combo}`;
    if (combo === 2) return "Double block";
    return "";
  }

  function chainLabel(chain) {
    return chain > 1 ? `Chain x${chain} +${chainBonus(chain)}` : "";
  }

  /* ---------- mining (educational simulation) ---------- */

  function buildHashInput(blockData, nonce) {
    return `${blockData}|nonce:${nonce}`;
  }

  function hashMeetsTarget(hashHex, zeros) {
    return typeof hashHex === "string" && hashHex.startsWith("0".repeat(zeros));
  }

  // sha256Hex: async (string) => lowercase hex. Returns { nonce, hash, attempts }
  // or null if maxAttempts is exhausted. Deterministic for a given hash function.
  async function findNonce({ blockData, zeros, sha256Hex, startNonce = 0, maxAttempts = 100000 }) {
    for (let i = 1; i <= maxAttempts; i += 1) {
      const nonce = startNonce + i;
      const hash = await sha256Hex(buildHashInput(blockData, nonce));
      if (hashMeetsTarget(hash, zeros)) return { nonce, hash, attempts: i };
    }
    return null;
  }

  // Expected attempts for N leading hex zeros is 16^N (educational display).
  function expectedAttempts(zeros) {
    return Math.pow(16, zeros);
  }

  /* ---------- persistence ---------- */

  function defaultProfile() {
    return {
      satsBalance: 0,
      wins: 0,
      bestScore: 0,
      bestLevel: 1,
      achievements: [],
      rewardHistory: [],
      lastDailyKey: "",
    };
  }

  function nonNegInt(value, fallback) {
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
  }

  // Coerces untrusted stored JSON into a valid profile; unknown keys are kept
  // so older/newer builds do not erase each other's data.
  function normalizeProfile(raw) {
    const base = defaultProfile();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
    const extras = {};
    for (const key of Object.keys(raw)) {
      if (!UNSAFE_KEYS.has(key)) extras[key] = raw[key];
    }
    return {
      ...extras,
      satsBalance: nonNegInt(raw.satsBalance, base.satsBalance),
      wins: nonNegInt(raw.wins, base.wins),
      bestScore: nonNegInt(raw.bestScore, base.bestScore),
      bestLevel: Math.max(1, nonNegInt(raw.bestLevel, base.bestLevel)),
      achievements: Array.isArray(raw.achievements)
        ? raw.achievements.filter((a) => typeof a === "string")
        : [],
      rewardHistory: Array.isArray(raw.rewardHistory) ? raw.rewardHistory.slice(0, 10) : [],
      lastDailyKey: typeof raw.lastDailyKey === "string" ? raw.lastDailyKey : "",
    };
  }

  function sanitizeEntry(entry) {
    if (!entry || typeof entry !== "object") return null;
    const score = nonNegInt(entry.score, -1);
    if (score < 0) return null;
    return {
      score,
      blocks: nonNegInt(entry.blocks, 0),
      level: Math.max(1, nonNegInt(entry.level, 1)),
      bestCombo: nonNegInt(entry.bestCombo, 0),
      won: entry.won === true,
      date: typeof entry.date === "string" ? entry.date : "",
    };
  }

  function normalizeHighScores(raw, limit = HIGH_SCORE_LIMIT) {
    if (!Array.isArray(raw)) return [];
    return raw
      .map(sanitizeEntry)
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Pure. Returns { list, rank } where rank is 1-based, or 0 if not placed.
  // Zero scores are never recorded. Ties rank below existing equal scores.
  function addHighScore(list, entry, limit = HIGH_SCORE_LIMIT) {
    const clean = sanitizeEntry(entry);
    const current = normalizeHighScores(list, limit);
    if (!clean || clean.score <= 0) return { list: current, rank: 0 };

    let index = current.findIndex((e) => clean.score > e.score);
    if (index === -1) index = current.length;
    const next = current.slice();
    next.splice(index, 0, clean);
    const trimmed = next.slice(0, limit);
    return { list: trimmed, rank: index < limit ? index + 1 : 0 };
  }

  function loadHighScores(storage, key = HIGH_SCORE_KEY) {
    try {
      const text = storage.getItem(key);
      return text ? normalizeHighScores(JSON.parse(text)) : [];
    } catch {
      return [];
    }
  }

  // Returns true on success; false when storage is full/blocked (private mode).
  function saveHighScores(storage, list, key = HIGH_SCORE_KEY) {
    try {
      storage.setItem(key, JSON.stringify(normalizeHighScores(list)));
      return true;
    } catch {
      return false;
    }
  }

  return {
    HIGH_SCORE_KEY,
    HIGH_SCORE_LIMIT,
    createGrid,
    rotateShape,
    collides,
    clearFullRows,
    lineClearPoints,
    chainBonus,
    blockReward,
    comboLabel,
    chainLabel,
    buildHashInput,
    hashMeetsTarget,
    findNonce,
    expectedAttempts,
    defaultProfile,
    normalizeProfile,
    normalizeHighScores,
    addHighScore,
    loadHighScores,
    saveHighScores,
  };
});
