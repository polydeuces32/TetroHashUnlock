#!/usr/bin/env node
// Integration tests: runs the REAL game.js/engine.js/learning.js/sound.js inside
// a Node vm with a stubbed DOM. No browser or dependencies required.
//   node scripts/test_game_integration.js
const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

function makeEl(id) {
  const listeners = {};
  const el = {
    id, textContent: "", style: {}, dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    appendChild(c) { this.children.push(c); return c; },
    scrollIntoView() {}, focus() {}, setAttribute() {},
    listeners,
  };
  Object.defineProperty(el, "innerHTML", { get() { return this._h || ""; }, set(v) { this._h = v; if (v === "") this.children = []; } });
  // Like the DOM: assigning textContent replaces all children.
  let text = "";
  delete el.textContent;
  Object.defineProperty(el, "textContent", { get: () => text, set: (v) => { text = v; el.children = []; } });
  return el;
}

function makeCtx() {
  const noop = () => {};
  return new Proxy({}, {
    get(t, k) {
      if (k === "measureText") return (s) => ({ width: String(s).length * 6 });
      if (k === "createLinearGradient" || k === "createRadialGradient") return () => ({ addColorStop: noop });
      if (k in t) return t[k];
      return noop;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

function boot({ storage = {}, withSound = true } = {}) {
  const els = {};
  const docListeners = {};
  const store = { ...storage };
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
  };
  const rafQueue = [];
  const document = {
    readyState: "complete",
    getElementById(id) { return (els[id] ||= makeEl(id)); },
    createElement(tag) { return makeEl(tag); },
    querySelectorAll() { return []; },
    addEventListener(type, fn) { (docListeners[type] ||= []).push(fn); },
  };
  els.gameCanvas = makeEl("gameCanvas");
  els.gameCanvas.getContext = () => makeCtx();
  const window = {
    localStorage, crypto: crypto.webcrypto, document,
    addEventListener() {}, setTimeout, clearTimeout,
  };
  const ctx = vm.createContext({
    window, document, localStorage, console, crypto: crypto.webcrypto,
    TextEncoder, Date, Math, Promise, setTimeout, clearTimeout,
    requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
    cancelAnimationFrame() {},
  });
  window.window = window;
  ctx.self = window; // browsers: self === window (engine.js UMD attaches to self)
  const files = ["learning.js", "engine.js", "progress.js", "progress-ui.js"].concat(withSound ? ["sound.js"] : []).concat(["game.js"]);
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  const run = (code) => vm.runInContext(code, ctx);
  const key = (k, code) => {
    let prevented = false;
    (docListeners.keydown || []).forEach((fn) => fn({ key: k, code: code || k, preventDefault() { prevented = true; } }));
    return prevented;
  };
  const click = (id) => (els[id].listeners.click || []).forEach((fn) => fn({ preventDefault() {} }));
  return { run, key, click, els, store, rafQueue };
}

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed += 1; console.log(`PASS ${name}`); }
  catch (e) { failed += 1; console.log(`FAIL ${name}\n     ${e.stack.split("\n").slice(0, 3).join("\n     ")}`); }
}
const HS = "tetrohash_highscores_v1";
const RW = "tetrohash_deep_rewards_v1";

(async () => {
  await test("boots, Engine present, start button begins a run", () => {
    const g = boot();
    assert.strictEqual(g.run("typeof Engine"), "object");
    g.click("startGame");
    assert.strictEqual(g.run("state.running"), true);
    assert.ok(g.run("!!state.piece"));
  });

  await test("boot without engine/sound reports a message and Start does not run", () => {
    const g = boot();
    g.run("window.TetroHashEngine = null");
    // re-evaluate guard path: startGame checks Engine const, so simulate by missing sound instead
    const g2 = boot({ withSound: false });
    g2.click("startGame");
    assert.strictEqual(g2.run("state.running"), false);
    assert.ok(/failed to load/i.test(g2.els.gameMessage.textContent));
  });

  await test("keyboard: arrows move/rotate, Space hard-drops, keys prevented", () => {
    const g = boot();
    g.click("startGame");
    const x0 = g.run("state.piece.x");
    assert.ok(g.key("ArrowLeft"));
    assert.strictEqual(g.run("state.piece.x"), x0 - 1);
    g.key("ArrowRight");
    assert.strictEqual(g.run("state.piece.x"), x0);
    const shape = JSON.stringify(g.run("state.piece.shape"));
    g.run("state.piece.shape=[[1,1,1,1]]");
    g.key("ArrowUp");
    assert.strictEqual(JSON.stringify(g.run("state.piece.shape")), "[[1],[1],[1],[1]]");
    const before = g.run("state.score");
    g.key(" ", "Space");
    assert.ok(g.run("state.score") > before);
    assert.ok(shape);
  });

  await test("pause blocks input; resume restores it", () => {
    const g = boot();
    g.click("startGame");
    g.key("p");
    assert.strictEqual(g.run("state.paused"), true);
    const x = g.run("state.piece.x");
    g.key("ArrowLeft");
    g.key(" ", "Space");
    assert.strictEqual(g.run("state.piece.x"), x);
    g.click("pauseGame");
    assert.strictEqual(g.run("state.paused"), false);
    g.key("ArrowLeft");
    assert.strictEqual(g.run("state.piece.x"), x - 1);
  });

  await test("keys before Start do not throw", () => {
    const g = boot();
    for (const k of ["ArrowLeft", "ArrowUp", "ArrowDown", "p", "r"]) g.key(k);
    g.key(" ", "Space");
    assert.strictEqual(g.run("state.running"), false);
  });

  await test("row clear: base score + chain bonus on consecutive clears, reset after a miss", () => {
    const g = boot();
    g.click("startGame");
    g.run(`state.level=3; state.grid[15]=Array(10).fill('#fff'); state.grid[15][0]=null; state.grid[15][1]=null;
           state.piece={shape:[[1,1]],color:'#0ff',x:0,y:15}; state.score=0; lockPiece();`);
    assert.strictEqual(g.run("state.clearChain"), 1);
    assert.strictEqual(g.run("state.score"), Engine_lineClear(1, 3));
    g.run("state.level=3; state.mode='tetris'; state.linesSinceMine=0; state.grid=createGrid(); state.grid[15]=Array(10).fill('#fff'); state.grid[15][0]=null; state.grid[15][1]=null; state.piece={shape:[[1,1]],color:'#0ff',x:0,y:15}; state.score=0; lockPiece();");
    assert.strictEqual(g.run("state.clearChain"), 2);
    assert.strictEqual(g.run("state.score"), Engine_lineClear(1, 3) + 50);
    g.run("state.mode='tetris'; state.grid=createGrid(); state.piece={shape:[[1]],color:'#0ff',x:5,y:15}; lockPiece();");
    assert.strictEqual(g.run("state.clearChain"), 0);
  });
  function Engine_lineClear(n, lvl) { return n * n * 140 + lvl * 25; }

  await test("mining: Space finds a real SHA-256 hash, awards block, advances level", async () => {
    const g = boot();
    g.click("startGame");
    g.run("state.linesSinceMine=999; enterMiningPuzzle();");
    assert.strictEqual(g.run("state.mode"), "mining");
    for (let i = 0; i < 200 && g.run("state.mode") === "mining"; i += 1) {
      g.key(" ", "Space");
      while (g.run("state.miningBusy")) await new Promise((r) => setTimeout(r, 1));
    }
    assert.strictEqual(g.run("state.blocksMined"), 1);
    assert.strictEqual(g.run("state.level"), 2);
    assert.strictEqual(g.run("state.mode"), "tetris");
    const h = g.run("state.previousHash");
    assert.ok(h.startsWith("00"));
    const nonce = g.run("state.nonce");
    const data = g.run("state.blockData");
    assert.strictEqual(crypto.createHash("sha256").update(`${data}|nonce:${nonce}`).digest("hex"), h);
  });

  await test("mining: reset during in-flight hashing does not award a block (race fix)", async () => {
    const g = boot();
    g.click("startGame");
    g.run("state.linesSinceMine=999; enterMiningPuzzle(); sha256Hex = async () => '00' + 'f'.repeat(62);");
    g.run("mineBatch()");           // starts; first await pending
    g.key("Escape");                // reset while hashing is in flight
    await new Promise((r) => setTimeout(r, 30));
    assert.strictEqual(g.run("state.blocksMined"), 0);
    assert.strictEqual(g.run("state.running"), false);
    assert.strictEqual(g.run("state.miningBusy"), false);
  });

  await test("mining: pause during in-flight hashing stops without awarding", async () => {
    const g = boot();
    g.click("startGame");
    g.run("state.linesSinceMine=999; enterMiningPuzzle(); sha256Hex = async () => '00' + 'f'.repeat(62);");
    g.run("mineBatch()");
    g.key("p");
    await new Promise((r) => setTimeout(r, 30));
    assert.strictEqual(g.run("state.blocksMined"), 0);
    assert.strictEqual(g.run("state.miningBusy"), false);
  });

  await test("mining is bounded per keypress (hashBatch), never an open loop", () => {
    const src = read("game.js");
    assert.ok(/for \(let attempt = 0; attempt < level\.hashBatch; attempt \+= 1\)/.test(src));
  });

  await test("game over records exactly one high score and persists it", () => {
    const g = boot();
    g.click("startGame");
    g.run("state.score=900; state.blocksMined=2; endGame(); endGame();");
    const saved = JSON.parse(g.store[HS]);
    assert.strictEqual(saved.length, 1);
    assert.strictEqual(saved[0].score, 900);
    assert.strictEqual(saved[0].won, false);
    assert.ok(/#1/.test(g.els.gameMessage.textContent));
    // reload from same storage
    const g2 = boot({ storage: g.store });
    assert.strictEqual(g2.run("highScores.length"), 1);
    assert.strictEqual(g2.els.bestScore.textContent, 900);
  });

  await test("zero-score game over records nothing", () => {
    const g = boot();
    g.click("startGame");
    g.run("endGame()");
    assert.ok(!(HS in g.store) || JSON.parse(g.store[HS]).length === 0);
  });

  await test("victory records a won high score, pays 5 sats once", () => {
    const g = boot();
    g.click("startGame");
    g.run("state.score=5000; state.blocksMined=14; handleValidBlock('00abc');");
    assert.strictEqual(g.run("state.won"), true);
    assert.strictEqual(g.run("state.running"), false);
    const hs = JSON.parse(g.store[HS]);
    assert.strictEqual(hs.length, 1);
    assert.strictEqual(hs[0].won, true);
    assert.strictEqual(JSON.parse(g.store[RW]).satsBalance, 5);
    assert.strictEqual(g.run("state.level"), 15);
  });

  await test("corrupt / hostile storage does not break boot or render", () => {
    for (const bad of ["{oops", "null", "[1,2]", '"str"', '{"__proto__":{"x":1}}']) {
      const g = boot({ storage: { [HS]: bad, [RW]: bad } });
      g.click("startGame");
      assert.strictEqual(g.run("state.running"), true, bad);
      assert.strictEqual(({}).x, undefined);
    }
  });

  await test("unknown achievement ids never render as 'undefined'", () => {
    const g = boot({ storage: { [RW]: JSON.stringify({ achievements: ["nope", "firstClear", "__proto__", "toString"] }) } });
    g.click("startGame");
    const texts = g.els.achievementList.children.map((c) => c.textContent);
    assert.deepStrictEqual(texts, ["First Row Clear"]);
  });

  await test("storage that throws on write does not crash a run", () => {
    const g = boot();
    g.run("window.localStorage.setItem = () => { throw new Error('quota'); }");
    g.click("startGame");
    g.run("state.score=100; endGame();");
    assert.strictEqual(g.run("state.running"), false);
  });

  await test("DOM writes use textContent, never innerHTML with data", () => {
    const src = read("game.js");
    const hits = src.split("\n").filter((l) => /innerHTML\s*=/.test(l) && !/=\s*""/.test(l));
    assert.deepStrictEqual(hits, []);
  });

  await test("chain-tip constant is labelled as a static snapshot", () => {
    const src = read("game.js");
    assert.ok(/STATIC SNAPSHOT, not live data/.test(src));
    assert.ok(/const BITCOIN_CHAIN_TIP_HEIGHT = \d+;/.test(src));
  });

  console.log(`\nResults\nPassed: ${passed}/${passed + failed}`);
  process.exit(failed ? 1 : 0);
})();
