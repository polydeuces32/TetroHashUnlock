#!/usr/bin/env node
// Progression tests: events, achievements, validation, migration, corruption
// recovery, quota failures. No dependencies: node scripts/test_progress.js
const assert = require("assert");
const P = require("../progress.js");

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log(`PASS ${name}`); }
  catch (e) { failed += 1; console.log(`FAIL ${name}\n     ${(e.stack || e.message).split("\n").slice(0, 4).join("\n     ")}`); }
}
const mem = (init = {}) => {
  const d = { ...init };
  return {
    d,
    getItem: (k) => (Object.hasOwn(d, k) ? d[k] : null),
    setItem: (k, v) => { d[k] = String(v); },
    removeItem: (k) => { delete d[k]; },
  };
};
const run = (p, ev, now = "2026-01-01T00:00:00.000Z") => P.applyEvent(p, ev, now);
const fresh = () => P.defaultProgress();

console.log("Defaults and validation");
test("default progress has 15 level slots and no achievements", () => {
  const p = fresh();
  assert.strictEqual(p.levels.length, 15);
  assert.deepStrictEqual(p.achievements, {});
  assert.deepStrictEqual(P.normalizeProgress(JSON.parse(JSON.stringify(p))), p);
});
test("achievement table: unique ids, all 9 legacy ids preserved", () => {
  const ids = P.ACHIEVEMENTS.map((a) => a.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  assert.deepStrictEqual(P.ACHIEVEMENTS.filter((a) => a.legacy).map((a) => a.id),
    ["firstClear", "firstBlock", "feeMarket", "bossWin", "levelFive", "levelTen", "comboThree", "daily", "champion"]);
  assert.ok(P.ACHIEVEMENTS.every((a) => a.name && a.desc));
});
test("normalizeProgress rejects non-v2 input", () => {
  for (const bad of [null, undefined, 5, "x", [], {}, { version: 1 }, { version: "2" }]) assert.strictEqual(P.normalizeProgress(bad), null);
});
test("normalizeProgress clamps and coerces hostile values", () => {
  const p = P.normalizeProgress({
    version: 2,
    stats: { runs: -5, wins: "9", blocksMined: 1e99, bestScore: NaN, playMs: Infinity, extra: 1 },
    levels: [{ entered: 3.9, completions: -1, bestAttempts: 0, fastestMs: "5", bestCombo: 2 }, "bad", null],
    achievements: { firstClear: { at: "2026-01-01" }, nope: {}, toString: {}, champion: { at: 12 } },
  });
  assert.strictEqual(p.stats.runs, 0);
  assert.strictEqual(p.stats.wins, 0);
  assert.strictEqual(p.stats.blocksMined, 1e12);
  assert.strictEqual(p.stats.bestScore, 0);
  assert.strictEqual(p.stats.playMs, 0);
  assert.ok(!("extra" in p.stats));
  assert.strictEqual(p.levels.length, 15);
  assert.deepStrictEqual(p.levels[0], { entered: 3, completions: 0, rows: 0, bestAttempts: null, fastestMs: null, bestCombo: 2 });
  assert.deepStrictEqual(Object.keys(p.achievements).sort(), ["champion", "firstClear"]);
  assert.strictEqual(p.achievements.champion.at, null);
});
test("prototype pollution payload is inert", () => {
  const evil = JSON.parse('{"version":2,"__proto__":{"polluted":1},"stats":{"__proto__":{"polluted":2}},"achievements":{"__proto__":{"at":"x"},"constructor":{}}}');
  const p = P.normalizeProgress(evil);
  assert.strictEqual(({}).polluted, undefined);
  assert.strictEqual(p.polluted, undefined);
  assert.deepStrictEqual(p.achievements, {});
  assert.strictEqual(Object.getPrototypeOf(p.stats), Object.prototype);
});

console.log("\nEvents and achievements");
test("applyEvent never mutates its input", () => {
  const p = fresh();
  const snap = JSON.stringify(p);
  run(p, { type: "rows", level: 1, cleared: 4, chain: 3 });
  run(p, { type: "block", level: 1, attempts: 5, combo: 5, runBlocks: 10, boss: true, score: 20000 });
  assert.strictEqual(JSON.stringify(p), snap);
});
test("rows: stats, per-level rows, firstClear, feeMarket (4 rows), chainThree", () => {
  let r = run(fresh(), { type: "rows", level: 3, cleared: 1, chain: 1 });
  assert.deepStrictEqual(r.unlocked, ["firstClear"]);
  assert.strictEqual(r.progress.levels[2].rows, 1);
  r = run(r.progress, { type: "rows", level: 3, cleared: 4, chain: 3 });
  assert.deepStrictEqual(r.unlocked.sort(), ["chainThree", "feeMarket"]);
  assert.strictEqual(r.progress.stats.rowsCleared, 5);
  assert.strictEqual(r.progress.stats.maxRowsAtOnce, 4);
  assert.strictEqual(r.progress.stats.bestChain, 3);
  assert.strictEqual(r.progress.levels[2].rows, 5);
});
test("rows with 0 cleared change nothing; invalid level touches no level slot", () => {
  const r = run(fresh(), { type: "rows", level: 99, cleared: 0 });
  assert.deepStrictEqual(r.unlocked, []);
  assert.deepStrictEqual(r.progress, fresh());
  const r2 = run(fresh(), { type: "rows", level: 99, cleared: 1, chain: 1 });
  assert.strictEqual(r2.progress.stats.rowsCleared, 1);
  assert.ok(r2.progress.levels.every((l) => l.rows === 0));
});
test("block: per-level best attempts/fastest time are minimums; completions accumulate", () => {
  let p = fresh();
  p = run(p, { type: "block", level: 2, attempts: 120, levelMs: 40000, combo: 1, runBlocks: 2, score: 900 }).progress;
  p = run(p, { type: "block", level: 2, attempts: 300, levelMs: 90000, combo: 0, runBlocks: 2, score: 800 }).progress;
  p = run(p, { type: "block", level: 2, attempts: 80, levelMs: 70000, combo: 2, runBlocks: 2, score: 1200 }).progress;
  const l = p.levels[1];
  assert.deepStrictEqual([l.completions, l.bestAttempts, l.fastestMs, l.bestCombo], [3, 80, 40000, 2]);
  assert.strictEqual(p.stats.hashAttempts, 500);
  assert.strictEqual(p.stats.blocksMined, 3);
  assert.strictEqual(p.stats.bestScore, 1200);
});
test("block achievements fire at exact thresholds", () => {
  const ev = (o) => run(fresh(), { type: "block", level: 1, attempts: 100, combo: 0, runBlocks: 1, score: 0, ...o }).unlocked;
  assert.deepStrictEqual(ev({}), ["firstBlock"]);
  assert.ok(ev({ boss: true }).includes("bossWin"));
  assert.ok(!ev({ runBlocks: 4 }).includes("levelFive"));
  assert.ok(ev({ runBlocks: 5 }).includes("levelFive"));
  assert.ok(!ev({ runBlocks: 9 }).includes("levelTen") && ev({ runBlocks: 10 }).includes("levelTen"));
  assert.ok(!ev({ combo: 2 }).includes("comboThree") && ev({ combo: 3 }).includes("comboThree"));
  assert.ok(!ev({ combo: 4 }).includes("streakFive") && ev({ combo: 5 }).includes("streakFive"));
  assert.ok(ev({ attempts: 10 }).includes("luckyNonce") && !ev({ attempts: 11 }).includes("luckyNonce"));
  assert.ok(!ev({ attempts: 0 }).includes("luckyNonce"));
  assert.ok(!ev({ attempts: 399 }).includes("hashGrinder") && ev({ attempts: 400 }).includes("hashGrinder"));
  assert.ok(!ev({ score: 9999 }).includes("highRoller") && ev({ score: 10000 }).includes("highRoller"));
});
test("achievements unlock once only, with timestamp of first unlock", () => {
  let r = run(fresh(), { type: "block", level: 1, attempts: 5, combo: 0, runBlocks: 1 }, "T1");
  assert.deepStrictEqual(r.unlocked, ["firstBlock", "luckyNonce"]);
  r = run(r.progress, { type: "block", level: 1, attempts: 5, combo: 0, runBlocks: 1 }, "T2");
  assert.deepStrictEqual(r.unlocked, []);
  assert.strictEqual(r.progress.achievements.firstBlock.at, "T1");
});
test("runEnd: win unlocks champion, runs/regular at 10, playMs accumulates", () => {
  let p = fresh();
  let r;
  for (let i = 0; i < 9; i += 1) { r = run(p, { type: "runEnd", won: false, score: 100, playMs: 1000 }); p = r.progress; assert.deepStrictEqual(r.unlocked, []); }
  r = run(p, { type: "runEnd", won: true, score: 12000, bestCombo: 4, playMs: 5000 });
  assert.deepStrictEqual(r.unlocked.sort(), ["champion", "highRoller", "regular"]);
  assert.deepStrictEqual([r.progress.stats.runs, r.progress.stats.wins, r.progress.stats.playMs, r.progress.stats.bestScore], [10, 1, 14000, 12000]);
});
test("daily and labGenesis events unlock their badge; unknown events are ignored", () => {
  assert.deepStrictEqual(run(fresh(), { type: "daily" }).unlocked, ["daily"]);
  assert.deepStrictEqual(run(fresh(), { type: "labGenesis" }).unlocked, ["labGenesis"]);
  assert.deepStrictEqual(run(fresh(), { type: "unlock", id: "champion" }).unlocked, []);
  assert.deepStrictEqual(run(fresh(), null).progress, fresh());
  assert.deepStrictEqual(run(fresh(), { type: "levelEnter", level: 4 }).progress.levels[3].entered, 1);
});
test("applyEvent is deterministic", () => {
  const evs = [{ type: "rows", level: 1, cleared: 2, chain: 1 }, { type: "block", level: 1, attempts: 200, combo: 1, runBlocks: 1, levelMs: 30000, score: 700 }, { type: "runEnd", won: false, score: 700, playMs: 31000 }];
  const play = () => evs.reduce((p, e) => run(p, e, "T").progress, fresh());
  assert.deepStrictEqual(play(), play());
});
test("summary and formatMs", () => {
  const p = run(fresh(), { type: "block", level: 1, attempts: 50, runBlocks: 1, combo: 0 }).progress;
  assert.deepStrictEqual(P.summary(p), { levelsCleared: 1, levelCount: 15, achievementsUnlocked: 1, achievementCount: 16 });
  assert.strictEqual(P.formatMs(null), "–");
  assert.strictEqual(P.formatMs(65400), "1:05");
});

console.log("\nStorage, migration, recovery");
test("empty storage → new default; save then load round-trips", () => {
  const st = mem();
  const l = P.loadProgress(st);
  assert.strictEqual(l.status, "new");
  const p = run(l.progress, { type: "rows", level: 1, cleared: 1, chain: 1 }).progress;
  assert.strictEqual(P.saveProgress(st, p), true);
  const l2 = P.loadProgress(st);
  assert.strictEqual(l2.status, "ok");
  assert.deepStrictEqual(l2.progress, p);
});
test("legacy reward profile migrates achievements, wins, best score; invents nothing", () => {
  const legacy = { wins: 2, bestScore: 4321, bestLevel: 7, achievements: ["firstClear", "bogus", 5, "champion"], satsBalance: 10 };
  const l = P.loadProgress(mem(), { legacy });
  assert.strictEqual(l.status, "migrated");
  assert.deepStrictEqual(Object.keys(l.progress.achievements).sort(), ["champion", "firstClear"]);
  assert.strictEqual(l.progress.stats.wins, 2);
  assert.strictEqual(l.progress.stats.bestScore, 4321);
  assert.strictEqual(l.progress.stats.runs, 0);
  assert.ok(l.progress.levels.every((x) => x.completions === 0));
});
test("empty/default legacy profile is not reported as a migration", () => {
  assert.strictEqual(P.loadProgress(mem(), { legacy: { wins: 0, bestScore: 0, achievements: [] } }).status, "new");
  assert.strictEqual(P.loadProgress(mem(), { legacy: "junk" }).status, "new");
});
test("v2 data wins over legacy data", () => {
  const st = mem();
  P.saveProgress(st, run(fresh(), { type: "daily" }).progress);
  const l = P.loadProgress(st, { legacy: { wins: 9, bestScore: 9, achievements: ["champion"] } });
  assert.strictEqual(l.status, "ok");
  assert.deepStrictEqual(Object.keys(l.progress.achievements), ["daily"]);
});
test("corrupt main record is quarantined and restored from the previous good save", () => {
  const st = mem();
  const a = run(fresh(), { type: "rows", level: 1, cleared: 1, chain: 1 }).progress;
  const b = run(a, { type: "daily" }).progress;
  P.saveProgress(st, a);
  P.saveProgress(st, b);
  st.d[P.KEY] = "{broken json";
  const l = P.loadProgress(st);
  assert.strictEqual(l.status, "restored");
  assert.deepStrictEqual(l.progress, a);
  assert.strictEqual(st.d[P.KEY_CORRUPT], "{broken json");
});
test("corrupt main and no backup → status reset; rebuilt from legacy profile when one exists, else defaults", () => {
  const st = mem({ [P.KEY]: "}{" });
  const l = P.loadProgress(st, { legacy: { wins: 5, bestScore: 77, achievements: ["daily"] } });
  assert.strictEqual(l.status, "reset");
  assert.strictEqual(l.progress.stats.wins, 5);
  assert.deepStrictEqual(Object.keys(l.progress.achievements), ["daily"]);
  assert.strictEqual(st.d[P.KEY_CORRUPT], "}{");
  const st2 = mem({ [P.KEY]: "}{" });
  const l2 = P.loadProgress(st2);
  assert.strictEqual(l2.status, "reset");
  assert.deepStrictEqual(l2.progress, fresh());
});
test("unsupported version is treated as damaged, original text preserved for inspection", () => {
  const st = mem({ [P.KEY]: JSON.stringify({ version: 99, stats: {} }) });
  const l = P.loadProgress(st);
  assert.strictEqual(l.status, "reset");
  assert.ok(st.d[P.KEY_CORRUPT].includes('"version":99'));
});
test("a bad main record cannot clobber the good backup on the next save", () => {
  const st = mem();
  const a = run(fresh(), { type: "daily" }).progress;
  P.saveProgress(st, a);
  P.saveProgress(st, a);
  st.d[P.KEY] = "garbage";
  P.saveProgress(st, run(a, { type: "labGenesis" }).progress);
  assert.deepStrictEqual(P.normalizeProgress(JSON.parse(st.d[P.KEY_PREV])), a);
});
test("storage that throws never crashes load/save/reset", () => {
  const boom = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("quota"); }, removeItem() { throw new Error("x"); } };
  assert.strictEqual(P.loadProgress(boom).status, "new");
  assert.strictEqual(P.saveProgress(boom, fresh()), false);
  assert.strictEqual(P.resetProgress(boom), false);
  assert.strictEqual(P.saveProgress(mem(), { version: 7 }), false);
});
test("resetProgress clears main, backup and quarantine", () => {
  const st = mem();
  P.saveProgress(st, fresh()); P.saveProgress(st, fresh()); st.d[P.KEY_CORRUPT] = "x";
  assert.strictEqual(P.resetProgress(st), true);
  assert.deepStrictEqual(Object.keys(st.d), []);
});

console.log(`\nResults\nPassed: ${passed}/${passed + failed}`);
process.exit(failed ? 1 : 0);
