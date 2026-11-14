/*
 * Player progression: per-level stats, achievements, validated + versioned storage.
 *
 * Pure and deterministic: no DOM, no clock, no randomness (callers pass `now`).
 * Storage is injected so every path (migration, corruption, backup recovery,
 * quota errors) is unit-tested in Node:  node scripts/test_progress.js
 *
 * Browser: window.TetroHashProgress. Node: module.exports.
 *
 * Nothing here is money. "Sats" in the game are local bonus points; achievements
 * are local badges. No network, no wallet.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TetroHashProgress = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const VERSION = 2;
  const LEVEL_COUNT = 15;
  const KEY = "tetrohash_progress_v2";
  const KEY_PREV = KEY + ":prev";
  const KEY_CORRUPT = KEY + ":corrupt";
  const MAX_COUNT = 1e12;

  // Order is display order. `legacy` ids existed before M3 and keep their names.
  const ACHIEVEMENTS = [
    { id: "firstClear", name: "First Row Clear", desc: "Clear your first row.", legacy: true },
    { id: "firstBlock", name: "First Block Mined", desc: "Find a valid hash and mine a block.", legacy: true },
    { id: "feeMarket", name: "Fee Market Builder", desc: "Clear four rows with one piece.", legacy: true },
    { id: "bossWin", name: "Boss Miner", desc: "Mine a boss-level block.", legacy: true },
    { id: "levelFive", name: "Five-Block Chain", desc: "Mine 5 blocks in one run.", legacy: true },
    { id: "levelTen", name: "Ten-Block Chain", desc: "Mine 10 blocks in one run.", legacy: true },
    { id: "comboThree", name: "Three Block Streak", desc: "Mine 3 blocks in a row without a miss.", legacy: true },
    { id: "daily", name: "Daily Miner", desc: "Reach today's block goal.", legacy: true },
    { id: "champion", name: "Satoshi Run Complete", desc: "Beat all 15 levels.", legacy: true },
    { id: "chainThree", name: "Chain Reaction", desc: "Clear rows with 3 pieces in a row.", legacy: false },
    { id: "luckyNonce", name: "Lucky Nonce", desc: "Find a block in 10 hashes or fewer.", legacy: false },
    { id: "hashGrinder", name: "Hash Grinder", desc: "Spend 400 or more hashes on a single block.", legacy: false },
    { id: "streakFive", name: "Five Block Streak", desc: "Mine 5 blocks in a row without a miss.", legacy: false },
    { id: "highRoller", name: "High Roller", desc: "Reach 10,000 points in one run.", legacy: false },
    { id: "regular", name: "Regular", desc: "Finish 10 runs.", legacy: false },
    { id: "labGenesis", name: "Genesis Re-miner", desc: "Re-mine Bitcoin's Genesis block in the Mining Lab.", legacy: false },
  ];
  const KNOWN = new Set(ACHIEVEMENTS.map((a) => a.id));

  /* ---------- shape / validation ---------- */

  function count(value, fallback = 0) {
    return Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), MAX_COUNT) : fallback;
  }

  function optCount(value) {
    return Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), MAX_COUNT) : null;
  }

  function defaultLevel() {
    return { entered: 0, completions: 0, rows: 0, bestAttempts: null, fastestMs: null, bestCombo: 0 };
  }

  function defaultProgress() {
    return {
      version: VERSION,
      stats: {
        runs: 0, wins: 0, blocksMined: 0, rowsCleared: 0, hashAttempts: 0, playMs: 0,
        bestScore: 0, bestCombo: 0, bestChain: 0, maxRowsAtOnce: 0,
      },
      levels: Array.from({ length: LEVEL_COUNT }, defaultLevel),
      achievements: {},
    };
  }

  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

  // Returns a clean progress object, or null when `raw` is not a v2 progress record.
  // Unknown keys are dropped (not copied), so hostile JSON cannot reach the model.
  function normalizeProgress(raw) {
    if (!isObj(raw) || raw.version !== VERSION) return null;
    const out = defaultProgress();

    if (isObj(raw.stats)) {
      for (const key of Object.keys(out.stats)) out.stats[key] = count(raw.stats[key]);
    }
    if (Array.isArray(raw.levels)) {
      for (let i = 0; i < LEVEL_COUNT; i += 1) {
        const l = raw.levels[i];
        if (!isObj(l)) continue;
        out.levels[i] = {
          entered: count(l.entered),
          completions: count(l.completions),
          rows: count(l.rows),
          bestAttempts: optCount(l.bestAttempts),
          fastestMs: optCount(l.fastestMs),
          bestCombo: count(l.bestCombo),
        };
      }
    }
    if (isObj(raw.achievements)) {
      for (const id of Object.keys(raw.achievements)) {
        if (!KNOWN.has(id)) continue;
        const entry = raw.achievements[id];
        const at = isObj(entry) && typeof entry.at === "string" && entry.at.length <= 40 ? entry.at : null;
        out.achievements[id] = { at };
      }
    }
    return out;
  }

  /* ---------- migration from the pre-M3 reward profile ---------- */

  // legacy: object from tetrohash_deep_rewards_v1 (already normalized or raw).
  // Only facts that were actually recorded are carried over; nothing is invented.
  function migrateLegacy(legacy) {
    const out = defaultProgress();
    if (!isObj(legacy)) return out;
    out.stats.wins = count(legacy.wins);
    out.stats.bestScore = count(legacy.bestScore);
    if (Array.isArray(legacy.achievements)) {
      for (const id of legacy.achievements) {
        if (typeof id === "string" && KNOWN.has(id)) out.achievements[id] = { at: null };
      }
    }
    return out;
  }

  /* ---------- events ---------- */

  function levelIndex(level) {
    return Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT ? level - 1 : -1;
  }

  // Pure: returns { progress, unlocked } without mutating the input.
  // `now` is an ISO string supplied by the caller (kept out of the module for determinism).
  function applyEvent(progress, event, now = null) {
    const p = normalizeProgress(JSON.parse(JSON.stringify(progress))) || defaultProgress();
    const unlocked = [];
    const unlock = (id) => {
      if (KNOWN.has(id) && !Object.hasOwn(p.achievements, id)) {
        p.achievements[id] = { at: typeof now === "string" ? now : null };
        unlocked.push(id);
      }
    };
    const s = p.stats;
    const idx = levelIndex(event && event.level);
    const lv = idx >= 0 ? p.levels[idx] : null;

    switch (event && event.type) {
      case "runStart":
        break;
      case "levelEnter":
        if (lv) lv.entered += 1;
        break;
      case "rows": {
        const cleared = count(event.cleared);
        if (cleared <= 0) break;
        s.rowsCleared += cleared;
        s.maxRowsAtOnce = Math.max(s.maxRowsAtOnce, cleared);
        s.bestChain = Math.max(s.bestChain, count(event.chain));
        if (lv) lv.rows += cleared;
        unlock("firstClear");
        if (cleared >= 4) unlock("feeMarket");
        if (count(event.chain) >= 3) unlock("chainThree");
        break;
      }
      case "block": {
        const attempts = count(event.attempts);
        const combo = count(event.combo);
        s.blocksMined += 1;
        s.hashAttempts += attempts;
        s.bestCombo = Math.max(s.bestCombo, combo);
        s.bestScore = Math.max(s.bestScore, count(event.score));
        if (lv) {
          lv.completions += 1;
          if (attempts > 0) lv.bestAttempts = lv.bestAttempts === null ? attempts : Math.min(lv.bestAttempts, attempts);
          const ms = optCount(event.levelMs);
          if (ms !== null) lv.fastestMs = lv.fastestMs === null ? ms : Math.min(lv.fastestMs, ms);
          lv.bestCombo = Math.max(lv.bestCombo, combo);
        }
        unlock("firstBlock");
        if (event.boss === true) unlock("bossWin");
        if (count(event.runBlocks) >= 5) unlock("levelFive");
        if (count(event.runBlocks) >= 10) unlock("levelTen");
        if (combo >= 3) unlock("comboThree");
        if (combo >= 5) unlock("streakFive");
        if (attempts > 0 && attempts <= 10) unlock("luckyNonce");
        if (attempts >= 400) unlock("hashGrinder");
        if (count(event.score) >= 10000) unlock("highRoller");
        break;
      }
      case "daily":
        unlock("daily");
        break;
      case "labGenesis":
        unlock("labGenesis");
        break;
      case "runEnd":
        s.runs += 1;
        if (event.won === true) {
          s.wins += 1;
          unlock("champion");
        }
        s.bestScore = Math.max(s.bestScore, count(event.score));
        s.bestCombo = Math.max(s.bestCombo, count(event.bestCombo));
        s.playMs = Math.min(MAX_COUNT, s.playMs + count(event.playMs));
        if (count(event.score) >= 10000) unlock("highRoller");
        if (s.runs >= 10) unlock("regular");
        break;
      default:
        break;
    }
    return { progress: p, unlocked };
  }

  function summary(progress) {
    const cleared = progress.levels.filter((l) => l.completions > 0).length;
    return {
      levelsCleared: cleared,
      levelCount: LEVEL_COUNT,
      achievementsUnlocked: Object.keys(progress.achievements).length,
      achievementCount: ACHIEVEMENTS.length,
    };
  }

  function formatMs(ms) {
    if (ms === null || ms === undefined) return "–";
    const total = Math.round(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }

  /* ---------- storage: versioned, backed-up, recoverable ---------- */

  function readJson(storage, key) {
    let text;
    try {
      text = storage.getItem(key);
    } catch {
      return { state: "unavailable" }; // blocked storage is not corruption
    }
    if (text === null || text === undefined) return { state: "missing" };
    try {
      return { state: "present", text, value: JSON.parse(text) };
    } catch {
      return { state: "corrupt", text };
    }
  }

  // status: "new" | "ok" | "migrated" | "restored" | "reset"
  function loadProgress(storage, { legacy = null } = {}) {
    const main = readJson(storage, KEY);
    if (main.state === "unavailable") return { progress: defaultProgress(), status: "new" };

    if (main.state === "present") {
      const ok = normalizeProgress(main.value);
      if (ok) return { progress: ok, status: "ok" };
    }

    // Main missing, damaged, or from an unsupported version.
    const damaged = main.state === "corrupt" || main.state === "present";
    if (damaged) {
      try {
        if (typeof main.text === "string") storage.setItem(KEY_CORRUPT, main.text.slice(0, 10000));
      } catch {
        // best effort
      }
      const prev = readJson(storage, KEY_PREV);
      const restored = prev.state === "present" ? normalizeProgress(prev.value) : null;
      if (restored) return { progress: restored, status: "restored" };
      // Last resort: rebuild from the pre-v2 profile if one exists (it is never modified).
      return { progress: migrateOrNew(legacy).progress, status: "reset" };
    }

    return migrateOrNew(legacy);
  }

  function migrateOrNew(legacy) {
    if (isObj(legacy) && (count(legacy.wins) > 0 || count(legacy.bestScore) > 0 ||
        (Array.isArray(legacy.achievements) && legacy.achievements.length > 0))) {
      return { progress: migrateLegacy(legacy), status: "migrated" };
    }
    return { progress: defaultProgress(), status: "new" };
  }

  // Returns true when the main record was written. The previous good record is
  // rotated into KEY_PREV first so one bad write can never destroy all history.
  function saveProgress(storage, progress) {
    const clean = normalizeProgress(progress);
    if (!clean) return false;
    try {
      const current = storage.getItem(KEY);
      if (typeof current === "string" && normalizeProgress(safeParse(current))) {
        storage.setItem(KEY_PREV, current);
      }
      storage.setItem(KEY, JSON.stringify(clean));
      return true;
    } catch {
      return false;
    }
  }

  function safeParse(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function resetProgress(storage) {
    try {
      storage.removeItem(KEY);
      storage.removeItem(KEY_PREV);
      storage.removeItem(KEY_CORRUPT);
      return true;
    } catch {
      return false;
    }
  }

  return {
    VERSION, LEVEL_COUNT, KEY, KEY_PREV, KEY_CORRUPT, ACHIEVEMENTS,
    defaultProgress, normalizeProgress, migrateLegacy, applyEvent, summary, formatMs,
    loadProgress, saveProgress, resetProgress,
  };
});
