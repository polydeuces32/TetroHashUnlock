#!/usr/bin/env node
// Deterministic unit tests for engine.js. No dependencies: node scripts/test_engine.js
const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const E = require("../engine.js");
const ROOT = path.join(__dirname, "..");

let passed = 0;
let failed = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed += 1; console.log(`PASS ${name}`); })
    .catch((err) => { failed += 1; console.log(`FAIL ${name}\n     ${err.message}`); });
}

const sha = async (s) => crypto.createHash("sha256").update(s).digest("hex");
const memStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    data,
  };
};
const fullRow = (cols, c = "x") => Array(cols).fill(c);

(async () => {
  console.log("Board");
  await test("collides: walls, floor, stack, above-board", () => {
    const g = E.createGrid(4, 4);
    const p = { shape: [[1, 1]], x: 1, y: 0 };
    assert.strictEqual(E.collides(g, p), false);
    assert.strictEqual(E.collides(g, p, -2, 0), true);   // left wall
    assert.strictEqual(E.collides(g, p, 2, 0), true);    // right wall
    assert.strictEqual(E.collides(g, p, 0, 4), true);    // floor
    assert.strictEqual(E.collides(g, p, 0, -3), false);  // above board is free
    g[1][1] = "x";
    assert.strictEqual(E.collides(g, p, 0, 1), true);    // stack
  });

  await test("rotateShape: 4 rotations return original, I-piece goes vertical", () => {
    const t = [[0, 1, 0], [1, 1, 1]];
    let s = t;
    for (let i = 0; i < 4; i += 1) s = E.rotateShape(s);
    assert.deepStrictEqual(s, t);
    assert.deepStrictEqual(E.rotateShape([[1, 1, 1, 1]]), [[1], [1], [1], [1]]);
  });

  await test("clearFullRows: clears, pads top, preserves order, no mutation", () => {
    const g = E.createGrid(4, 3);
    g[3] = fullRow(3, "a");
    g[2] = ["b", null, "b"];
    g[1] = fullRow(3, "c");
    const snapshot = JSON.stringify(g);
    const r = E.clearFullRows(g);
    assert.strictEqual(r.cleared, 2);
    assert.strictEqual(r.grid.length, 4);
    assert.deepStrictEqual(r.grid[3], ["b", null, "b"]);
    assert.deepStrictEqual(r.grid[0], [null, null, null]);
    assert.strictEqual(JSON.stringify(g), snapshot);
  });

  await test("clearFullRows: nothing to clear returns same shape", () => {
    const g = E.createGrid(3, 3);
    const r = E.clearFullRows(g);
    assert.strictEqual(r.cleared, 0);
    assert.deepStrictEqual(r.grid, g);
  });

  console.log("\nScoring");
  await test("lineClearPoints keeps original formula", () => {
    assert.strictEqual(E.lineClearPoints(0, 5), 0);
    assert.strictEqual(E.lineClearPoints(1, 1), 165);
    assert.strictEqual(E.lineClearPoints(4, 3), 4 * 4 * 140 + 75);
  });

  await test("chainBonus: none for first clear, +50 per follow-up", () => {
    assert.deepStrictEqual([0, 1, 2, 3, 5].map(E.chainBonus), [0, 0, 50, 100, 200]);
  });

  await test("blockReward keeps original formula and exposes parts", () => {
    const r = E.blockReward({ baseReward: 100, attempts: 20, boss: true, combo: 2 });
    assert.deepStrictEqual(r, { total: 100 + 300 + 500 + 240, speedBonus: 300, bossBonus: 500, comboBonus: 240 });
    assert.strictEqual(E.blockReward({ baseReward: 10, attempts: 9999 }).speedBonus, 0);
  });

  await test("combo/chain labels", () => {
    assert.strictEqual(E.comboLabel(1), "");
    assert.strictEqual(E.comboLabel(2), "Double block");
    assert.strictEqual(E.comboLabel(3), "Streak x3");
    assert.strictEqual(E.comboLabel(6), "Block streak x6!");
    assert.strictEqual(E.chainLabel(1), "");
    assert.strictEqual(E.chainLabel(3), "Chain x3 +100");
  });

  console.log("\nMining (educational simulation, real SHA-256)");
  await test("SHA-256 known vectors via node crypto sanity", async () => {
    assert.strictEqual(await sha(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    assert.strictEqual(await sha("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  await test("findNonce is deterministic and the result verifies", async () => {
    const args = { blockData: "block:test|prev:0000", zeros: 2, sha256Hex: sha };
    const a = await E.findNonce(args);
    const b = await E.findNonce(args);
    assert.deepStrictEqual(a, b);
    assert.ok(a.hash.startsWith("00"));
    assert.strictEqual(await sha(E.buildHashInput(args.blockData, a.nonce)), a.hash);
    assert.strictEqual(a.attempts, a.nonce);
  });

  await test("findNonce honors startNonce and maxAttempts", async () => {
    const r = await E.findNonce({ blockData: "d", zeros: 64, sha256Hex: sha, maxAttempts: 50 });
    assert.strictEqual(r, null);
    const s = await E.findNonce({ blockData: "d", zeros: 1, sha256Hex: sha, startNonce: 1000 });
    assert.ok(s.nonce > 1000);
  });

  await test("hashMeetsTarget / expectedAttempts", () => {
    assert.strictEqual(E.hashMeetsTarget("000abc", 3), true);
    assert.strictEqual(E.hashMeetsTarget("00abc", 3), false);
    assert.strictEqual(E.hashMeetsTarget(undefined, 1), false);
    assert.strictEqual(E.expectedAttempts(3), 4096);
  });

  console.log("\nPersistence");
  await test("addHighScore: sorts, ranks, caps at limit, ignores zero", () => {
    let list = [];
    let r;
    for (const s of [500, 900, 100]) list = E.addHighScore(list, { score: s }).list;
    assert.deepStrictEqual(list.map((e) => e.score), [900, 500, 100]);
    r = E.addHighScore(list, { score: 700 });
    assert.strictEqual(r.rank, 2);
    r = E.addHighScore(list, { score: 0 });
    assert.strictEqual(r.rank, 0);
    assert.strictEqual(r.list.length, 3);
    let big = [];
    for (let i = 1; i <= 15; i += 1) big = E.addHighScore(big, { score: i * 10 }).list;
    assert.strictEqual(big.length, E.HIGH_SCORE_LIMIT);
    assert.strictEqual(big[0].score, 150);
    assert.strictEqual(E.addHighScore(big, { score: 5 }).rank, 0);
  });

  await test("addHighScore: ties rank below existing; input not mutated", () => {
    const list = [{ score: 100 }].map((e) => ({ ...e }));
    const frozen = JSON.stringify(list);
    const r = E.addHighScore(list, { score: 100, blocks: 3 });
    assert.strictEqual(r.rank, 2);
    assert.strictEqual(JSON.stringify(list), frozen);
  });

  await test("save/load round-trip through storage", () => {
    const st = memStorage();
    const list = E.addHighScore([], { score: 1234, blocks: 4, level: 5, bestCombo: 2, won: false, date: "2026-01-01" }).list;
    assert.strictEqual(E.saveHighScores(st, list), true);
    assert.deepStrictEqual(E.loadHighScores(st), list);
  });

  await test("loadHighScores survives corrupt / hostile data", () => {
    assert.deepStrictEqual(E.loadHighScores(memStorage({ [E.HIGH_SCORE_KEY]: "{not json" })), []);
    assert.deepStrictEqual(E.loadHighScores(memStorage({ [E.HIGH_SCORE_KEY]: '{"a":1}' })), []);
    const mixed = JSON.stringify([{ score: -5 }, { score: "9" }, null, { score: 50 }, { score: NaN }, 7]);
    assert.deepStrictEqual(E.loadHighScores(memStorage({ [E.HIGH_SCORE_KEY]: mixed })).map((e) => e.score), [50]);
    assert.deepStrictEqual(E.loadHighScores({ getItem() { throw new Error("blocked"); } }), []);
  });

  await test("saveHighScores returns false when storage throws", () => {
    const st = { setItem() { throw new Error("quota"); } };
    assert.strictEqual(E.saveHighScores(st, [{ score: 1 }]), false);
  });

  await test("normalizeProfile: defaults, coercion, unknown keys preserved", () => {
    assert.deepStrictEqual(E.normalizeProfile(null), E.defaultProfile());
    assert.deepStrictEqual(E.normalizeProfile([1, 2]), E.defaultProfile());
    const p = E.normalizeProfile({ satsBalance: "x", wins: -3, bestScore: 77.9, bestLevel: 0, achievements: ["a", 5], extra: true });
    assert.strictEqual(p.satsBalance, 0);
    assert.strictEqual(p.wins, 0);
    assert.strictEqual(p.bestScore, 77);
    assert.strictEqual(p.bestLevel, 1);
    assert.deepStrictEqual(p.achievements, ["a"]);
    assert.strictEqual(p.extra, true);
  });

  await test("normalizeProfile/highscores: prototype pollution payloads are inert", () => {
    const evil = JSON.parse('{"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":2}},"wins":2}');
    const p = E.normalizeProfile(evil);
    assert.strictEqual(({}).polluted, undefined);
    assert.strictEqual(p.polluted, undefined);
    assert.strictEqual(Object.getPrototypeOf(p), Object.prototype);
    assert.ok(!Object.keys(p).includes("__proto__") && !Object.keys(p).includes("constructor"));
    assert.strictEqual(p.wins, 2);
    const hs = E.normalizeHighScores(JSON.parse('[{"score":5,"__proto__":{"polluted":1}}]'));
    assert.strictEqual(hs.length, 1);
    assert.strictEqual(({}).polluted, undefined);
    assert.deepStrictEqual(Object.keys(hs[0]).sort(), ["bestCombo", "blocks", "date", "level", "score", "won"]);
  });

  await test("high scores: Infinity/huge/non-integer values are sanitized", () => {
    const list = E.normalizeHighScores([{ score: Infinity }, { score: 12.9 }, { score: 1e308 }]);
    assert.deepStrictEqual(list.map((e) => e.score), [Math.floor(1e308), 12]);
  });

  console.log("\nWiring");
  await test("index.html loads engine.js before game.js", () => {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const e = html.indexOf('src="./engine.js');
    const g = html.indexOf('src="./game.js');
    assert.ok(e > -1 && g > -1 && e < g);
  });

  await test("game.js uses the engine (no duplicate rules)", () => {
    const js = fs.readFileSync(path.join(ROOT, "game.js"), "utf8");
    for (const s of ["TetroHashEngine", "Engine.clearFullRows", "Engine.collides", "Engine.addHighScore", "Engine.blockReward"]) {
      assert.ok(js.includes(s), `missing ${s}`);
    }
  });

  console.log(`\nResults\nPassed: ${passed}/${passed + failed}`);
  process.exit(failed ? 1 : 0);
})();
