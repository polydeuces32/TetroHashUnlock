class TetroHashLearningEngine {
  constructor() {
    this.storageKey = "tetrohash_deep_profile_v1";

    this.profile = this.loadProfile();

    this.session = {
      startedAt: null,
      moves: 0,
      rotations: 0,
      softDrops: 0,
      hardDrops: 0,
      mistakes: 0,
      lineClears: 0,
      scoreEvents: 0,
      lastMoveAt: null,
    };
  }

  loadProfile() {
    const fallback = {
      sessionsPlayed: 0,
      bestScore: 0,
      avgSurvivalSeconds: 0,
      avgMovesPerMinute: 0,
      avgMistakes: 0,
      learnedDifficulty: 1,
      lastAdaptation: "New profile initialized",
    };

    try {
      const stored = window.localStorage.getItem(this.storageKey);
      if (!stored) return fallback;

      return {
        ...fallback,
        ...JSON.parse(stored),
      };
    } catch {
      return fallback;
    }
  }

  saveProfile() {
    window.localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
  }

  startSession() {
    this.session = {
      startedAt: Date.now(),
      moves: 0,
      rotations: 0,
      softDrops: 0,
      hardDrops: 0,
      mistakes: 0,
      lineClears: 0,
      scoreEvents: 0,
      lastMoveAt: Date.now(),
    };
  }

  recordMove(type = "move") {
    this.session.moves += 1;
    this.session.lastMoveAt = Date.now();

    if (type === "rotate") this.session.rotations += 1;
    if (type === "softDrop") this.session.softDrops += 1;
    if (type === "hardDrop") this.session.hardDrops += 1;
  }

  recordMistake() {
    this.session.mistakes += 1;
  }

  recordLineClear(count = 1) {
    this.session.lineClears += count;
    this.session.scoreEvents += 1;
  }

  getSurvivalSeconds() {
    if (!this.session.startedAt) return 0;
    return Math.floor((Date.now() - this.session.startedAt) / 1000);
  }

  getMovesPerMinute() {
    const seconds = Math.max(this.getSurvivalSeconds(), 1);
    return Math.round((this.session.moves / seconds) * 60);
  }

  getDifficultyProfile(score = 0) {
    const survival = this.getSurvivalSeconds();
    const movesPerMinute = this.getMovesPerMinute();

    let difficulty = this.profile.learnedDifficulty;

    if (score > 600) difficulty += 1;
    if (score > 1400) difficulty += 1;
    if (survival > 90) difficulty += 1;
    if (movesPerMinute > 75) difficulty += 1;

    if (this.session.mistakes >= 4) difficulty -= 1;
    if (this.session.mistakes >= 8) difficulty -= 1;

    difficulty = Math.max(1, Math.min(9, difficulty));

    const fallInterval = Math.max(130, 850 - difficulty * 70);
    const pressureLabel =
      difficulty <= 2 ? "Calm" :
      difficulty <= 5 ? "Steady" :
      difficulty <= 7 ? "Quick" :
      "Fast";

    return {
      difficulty,
      fallInterval,
      pressureLabel,
      effectIntensity: Math.min(1, difficulty / 9),
      adaptation:
        difficulty > this.profile.learnedDifficulty
          ? "Speeding up"
          : difficulty < this.profile.learnedDifficulty
            ? "Slowing down"
            : "Steady pace",
    };
  }

  getLearningPath(blocksMined = 0, won = false) {
    if (won) return "You finished the whole game!";
    if (blocksMined >= 12) return "Almost at the end";
    if (blocksMined >= 8) return "Over halfway";
    if (blocksMined >= 4) return "Getting the hang of it";
    return "Just getting started";
  }

  getTutorMessage(context = {}) {
    const {
      mode = "tetris",
      levelName = "Genesis Block",
      pressure = 0,
      linesSinceMine = 0,
      linesToMine = 1,
      targetPrefix = "00",
      attempts = 0,
      paused = false,
      won = false,
      aiLearningMode = true,
    } = context;

    if (!aiLearningMode) {
      return "Hints are off. Turn them back on anytime if you want help.";
    }

    if (won) {
      return "You beat all 15 levels. Great job!";
    }

    if (paused) {
      return "Paused. Read your mission, then press Resume when ready.";
    }

    if (mode === "mining") {
      if (attempts === 0) {
        return `Press Space to mine. You need a hash that starts with ${targetPrefix}.`;
      }

      if (attempts > 180) {
        return "Mining is mostly luck and patience. Keep pressing Space.";
      }

      return `Keep going — find a hash starting with ${targetPrefix}.`;
    }

    if (pressure >= 78) {
      return "Board is getting full. Clear a row near the top first.";
    }

    if (this.session.mistakes >= 6) {
      return "Slow down a little and rotate earlier. You have got this.";
    }

    if (this.getMovesPerMinute() > 85) {
      return "Nice speed! Focus on clean rows so you do not trap yourself.";
    }

    const remaining = Math.max(0, linesToMine - linesSinceMine);
    return `Clear ${remaining || linesToMine} more row${remaining === 1 ? "" : "s"}, then press Space to mine.`;
  }

  getRunLesson(summary = {}, blocksMined = 0, won = false) {
    if (won) {
      return "You finished the full run — come back anytime for another try.";
    }

    if (blocksMined === 0) {
      return "Tip: clear one full row before the board fills up.";
    }

    if ((summary.mistakes || 0) > 6) {
      return "Tip: rotate earlier and leave a gap open for long pieces.";
    }

    return "Tip: clear rows, mine the block, then keep going to the next level.";
  }

  completeSession(score = 0) {
    const survival = this.getSurvivalSeconds();
    const movesPerMinute = this.getMovesPerMinute();

    const totalSessions = this.profile.sessionsPlayed + 1;

    this.profile.bestScore = Math.max(this.profile.bestScore, score);
    this.profile.avgSurvivalSeconds = Math.round(
      (this.profile.avgSurvivalSeconds * this.profile.sessionsPlayed + survival) / totalSessions
    );
    this.profile.avgMovesPerMinute = Math.round(
      (this.profile.avgMovesPerMinute * this.profile.sessionsPlayed + movesPerMinute) / totalSessions
    );
    this.profile.avgMistakes = Number(
      ((this.profile.avgMistakes * this.profile.sessionsPlayed + this.session.mistakes) / totalSessions).toFixed(2)
    );

    const profile = this.getDifficultyProfile(score);
    this.profile.learnedDifficulty = profile.difficulty;
    this.profile.lastAdaptation = profile.adaptation;
    this.profile.sessionsPlayed = totalSessions;

    this.saveProfile();

    return {
      survival,
      movesPerMinute,
      mistakes: this.session.mistakes,
      bestScore: this.profile.bestScore,
      learnedDifficulty: this.profile.learnedDifficulty,
      adaptation: this.profile.lastAdaptation,
    };
  }

  resetProfile() {
    window.localStorage.removeItem(this.storageKey);
    this.profile = this.loadProfile();
    this.startSession();
  }
}

window.TetroHashLearningEngine = TetroHashLearningEngine;
