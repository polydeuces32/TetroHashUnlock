#!/usr/bin/env node
// M3 regression tests: progression wired into the real game.js (stub DOM, Node vm).
//   node scripts/test_game_progress.js
const assert = require("assert");
const { boot, mineBlock, read } = require("./game_harness.js");

const PK = "tetrohash_progress_v2";
const RW = "tetrohash_deep_rewards_v1";
const HS = "tetrohash_highscores_v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed += 1; console.log(`PASS ${name}`); }
  catch (e) { failed += 1; console.log(`FAIL ${name}\n     ${(e.stack || e.message).split("\n").slice(0, 4).join("\n     ")}`); }
}

(async () => {
  console.log("Events recorded from real gameplay");
  await test("mining a block records per-level stats, badges, and persists across reload", async () => {
    const g = boot();
    g.click("startGame");
    await mineBlock(g);
    const p = g.progressOf();
    assert.strictEqual(p.levels[0].completions, 1);
    assert.strictEqual(p.levels[0].entered, 1);
    assert.ok(p.levels[0].bestAttempts >= 1);
    assert.ok(Object.keys(p.achievements).includes("firstBlock"));
    assert.strictEqual(p.stats.blocksMined, 1);
    const g2 = boot({ storage: g.store });
    assert.strictEqual(g2.run("progress.levels[0].completions"), 1);
    assert.ok(g2.els.achievementList.children.some((c) => c.textContent === "First Block Mined"));
  });

  await test("clearing rows records rows/firstClear; consecutive clears unlock Chain Reaction", () => {
    const g = boot();
    g.click("startGame");
    const clearOne = () => g.run(`state.mode='tetris'; state.linesSinceMine=0; state.grid=createGrid(); state.grid[15]=Array(10).fill('#fff'); state.grid[15][0]=null; state.grid[15][1]=null; state.piece={shape:[[1,1]],color:'#0ff',x:0,y:15}; lockPiece();`);
    clearOne();
    assert.deepStrictEqual(Object.keys(g.progressOf().achievements), ["firstClear"]);
    clearOne(); clearOne();
    const p = g.progressOf();
    assert.ok("chainThree" in p.achievements);
    assert.strictEqual(p.stats.rowsCleared, 3);
    assert.strictEqual(p.levels[0].rows, 3);
  });

  await test("four rows at once unlocks Fee Market Builder", () => {
    const g = boot();
    g.click("startGame");
    g.run(`state.grid=createGrid(); for (let y=12;y<16;y++){ state.grid[y]=Array(10).fill('#fff'); state.grid[y][0]=null; }
           state.piece={shape:[[1],[1],[1],[1]],color:'#0ff',x:0,y:12}; lockPiece();`);
    assert.ok("feeMarket" in g.progressOf().achievements);
  });

  await test("badge unlock is announced for screen readers and shown as a toast", async () => {
    const g = boot();
    g.click("startGame");
    await mineBlock(g);
    assert.ok(/Badge unlocked: .*First Block Mined/.test(g.els.badgeAnnouncer.textContent), g.els.badgeAnnouncer.textContent);
    assert.ok(/Badge:/.test(g.run("toast.text")));
  });

  await test("Genesis re-mine event from the lab awards the badge once", () => {
    const g = boot();
    g.fireWindow("tetrohash:lab-genesis");
    g.fireWindow("tetrohash:lab-genesis");
    assert.deepStrictEqual(Object.keys(g.progressOf().achievements), ["labGenesis"]);
  });

  console.log("\nReward and transition safety");
  await test("victory pays once and counts one run, even if reached repeatedly", () => {
    const g = boot();
    g.click("startGame");
    g.run("state.score=5000; state.blocksMined=14; handleValidBlock('00a'); completeVictory(); handleValidBlock('00b'); completeVictory(); endGame();");
    assert.strictEqual(JSON.parse(g.store[RW]).satsBalance, 5);
    assert.strictEqual(JSON.parse(g.store[RW]).wins, 1);
    const p = g.progressOf();
    assert.deepStrictEqual([p.stats.runs, p.stats.wins], [1, 1]);
    assert.strictEqual(JSON.parse(g.store[HS]).length, 1);
    assert.ok("champion" in p.achievements);
  });

  await test("blocks cannot be awarded outside a running game", () => {
    const g = boot();
    g.run("handleValidBlock('00a')"); // never started
    assert.strictEqual(g.run("state.blocksMined"), 0);
    g.click("startGame");
    g.run("endGame(); handleValidBlock('00a');");
    assert.strictEqual(g.run("state.blocksMined"), 0);
    assert.strictEqual(g.progressOf().stats.blocksMined, 0);
  });

  await test("game over then restart: each run counted once", () => {
    const g = boot();
    for (let i = 0; i < 3; i += 1) {
      g.click("startGame");
      g.run("state.score = 100 + " + i + "; endGame(); endGame();");
    }
    assert.strictEqual(g.progressOf().stats.runs, 3);
    assert.strictEqual(JSON.parse(g.store[HS]).length, 3);
  });

  await test("Escape / Start mid-run records a scoring run once; zero-score restarts do not count", () => {
    const g = boot();
    g.click("startGame");
    g.run("state.score = 400");
    g.key("Escape");
    assert.strictEqual(JSON.parse(g.store[HS])[0].score, 400);
    assert.strictEqual(g.progressOf().stats.runs, 1);
    g.click("startGame");
    g.run("state.score = 250");
    g.click("startGame"); // restart while playing
    assert.strictEqual(g.progressOf().stats.runs, 2);
    g.key("Escape");      // score is 0 in the fresh run: nothing to record
    g.click("startGame"); g.key("Escape");
    assert.strictEqual(g.progressOf().stats.runs, 2);
  });

  await test("a block mined by a reset/paused run never reaches progress (stale async)", async () => {
    const g = boot();
    g.click("startGame");
    g.run("state.linesSinceMine=99; enterMiningPuzzle(); sha256Hex = async () => '00' + 'f'.repeat(62);");
    g.run("mineBatch()");
    g.key("Escape");
    await sleep(30);
    assert.strictEqual(g.progressOf().stats.blocksMined, 0);
  });

  console.log("\nTime tracking");
  await test("levelMs/runMs accumulate per frame, cap background gaps, and freeze while paused", () => {
    const g = boot();
    g.click("startGame");
    g.run("state.lastTime = 1000");
    g.run("update(1100)");
    assert.strictEqual(g.run("state.levelMs"), 100);
    g.run("update(61100)"); // a 60 s gap (hidden tab) counts as at most 250 ms
    assert.strictEqual(g.run("state.runMs"), 350);
    g.key("p");
    g.run("update(61200)");
    assert.strictEqual(g.run("state.runMs"), 350);
  });

  await test("fastest-time stat is recorded when a block is mined", async () => {
    const g = boot();
    g.click("startGame");
    g.run("state.levelMs = 4321");
    await mineBlock(g);
    assert.strictEqual(g.progressOf().levels[0].fastestMs, 4321);
  });

  console.log("\nStorage migration and recovery");
  await test("legacy profile migrates badges/best score and keeps the old key untouched", () => {
    const legacy = JSON.stringify({ wins: 1, bestScore: 900, bestLevel: 3, satsBalance: 5, achievements: ["firstClear", "champion"] });
    const g = boot({ storage: { [RW]: legacy } });
    assert.ok(/carried over/.test(g.els.progressNotice.textContent));
    const p = g.progressOf();
    assert.deepStrictEqual(Object.keys(p.achievements).sort(), ["champion", "firstClear"]);
    assert.strictEqual(p.stats.bestScore, 900);
    assert.strictEqual(g.store[RW], legacy);
  });

  await test("corrupt progress is quarantined, restored from backup, and the game still starts", async () => {
    const g = boot();
    g.click("startGame");
    await mineBlock(g);
    g.run("recordEvent({type:'daily'})"); // second save rotates the first into :prev
    const store = { ...g.store, [PK]: "{not json" };
    const g2 = boot({ storage: store });
    assert.ok(/restored/.test(g2.els.progressNotice.textContent), g2.els.progressNotice.textContent);
    assert.ok(g2.run("progress.stats.blocksMined") >= 1);
    assert.strictEqual(g2.store[PK + ":corrupt"], "{not json");
    g2.click("startGame");
    assert.strictEqual(g2.run("state.running"), true);
  });

  await test("hostile progress JSON is sanitized and cannot pollute prototypes", () => {
    const evil = '{"version":2,"__proto__":{"polluted":1},"stats":{"runs":-4,"wins":1e99},"achievements":{"__proto__":{},"champion":{"at":5}}}';
    const g = boot({ storage: { [PK]: evil } });
    assert.strictEqual(({}).polluted, undefined);
    assert.strictEqual(g.run("progress.stats.runs"), 0);
    assert.strictEqual(g.run("progress.stats.wins"), 1e12);
    assert.deepStrictEqual(Object.keys(g.run("progress.achievements")), ["champion"]);
  });

  await test("unavailable storage: game still runs and records in memory", async () => {
    const g = boot();
    g.run("window.localStorage.setItem = () => { throw new Error('quota'); }; window.localStorage.getItem = () => { throw new Error('blocked'); };");
    g.click("startGame");
    await mineBlock(g);
    assert.strictEqual(g.run("progress.stats.blocksMined"), 1);
  });

  console.log("\nReset progress");
  await test("two-step reset clears progress and badges, keeps high scores and sats, and does not re-migrate", async () => {
    const g = boot();
    g.click("startGame");
    g.run("state.score=600; endGame();");
    g.run("rewardProfile.satsBalance = 5; saveRewardProfile();");
    g.run("recordEvent({type:'daily'})");
    g.els.resetProgress.emit("click");
    assert.ok(/again/i.test(g.els.resetProgress.textContent));
    assert.ok("daily" in g.progressOf().achievements, "first click must only arm");
    g.els.resetProgress.emit("click");
    assert.deepStrictEqual(Object.keys(g.progressOf().achievements), []);
    assert.strictEqual(g.progressOf().stats.runs, 0);
    assert.strictEqual(JSON.parse(g.store[HS]).length, 1);
    assert.strictEqual(JSON.parse(g.store[RW]).satsBalance, 5);
    assert.strictEqual(JSON.parse(g.store[RW]).achievements.length, 0);
    const g2 = boot({ storage: g.store });
    assert.deepStrictEqual(Object.keys(g2.run("progress.achievements")), []);
    assert.strictEqual(g2.els.progressNotice.textContent, "");
  });

  console.log("\nProgress UI");
  await test("level table has 15 rows and badge list shows locked/unlocked states", async () => {
    const g = boot();
    g.click("startGame");
    await mineBlock(g);
    g.run("updateDifficulty()");
    const rows = g.els.levelStatsBody.children;
    assert.strictEqual(rows.length, 15);
    assert.ok(/Cleared ×1/.test(rows[0].children[2].textContent));
    assert.strictEqual(rows[0].className, "cleared");
    assert.ok(/Tried|Not played/.test(rows[2].children[2].textContent));
    const badges = g.els.achievementGrid.children;
    assert.strictEqual(badges.length, 16);
    assert.ok(badges.some((b) => b.className === "badge unlocked"));
    assert.ok(badges.some((b) => b.className === "badge locked"));
    assert.ok(g.els.progressSummary.children.length === 8);
  });

  await test("lists re-render only when data changed (no per-frame DOM rebuild)", () => {
    const g = boot();
    g.click("startGame");
    g.run("updateDifficulty()");
    const before = g.els.levelStatsBody.children;
    g.run("update(16); update(32); update(48);");
    assert.strictEqual(g.els.levelStatsBody.children, before, "tbody must not be rebuilt each frame");
  });

  console.log("\nInput quality");
  await test("typing targets and browser shortcuts are not hijacked", () => {
    const g = boot();
    g.click("startGame");
    const x = g.run("state.piece.x");
    for (const k of [" ", "p", "r", "ArrowLeft"]) {
      assert.strictEqual(g.key(k, k === " " ? "Space" : k, { target: { tagName: "INPUT" } }), false, `key ${k} in input`);
    }
    assert.strictEqual(g.run("state.piece.x"), x);
    assert.strictEqual(g.run("state.paused"), false);
    assert.strictEqual(g.key("r", "KeyR", { ctrlKey: true }), false);
    assert.strictEqual(g.key("r", "KeyR", { metaKey: true }), false);
    assert.strictEqual(g.key("ArrowLeft", "ArrowLeft", { target: { tagName: "SELECT" } }), false);
  });

  await test("page keeps normal scrolling when not playing; game claims keys while playing", () => {
    const g = boot();
    assert.strictEqual(g.key("ArrowDown"), false);
    assert.strictEqual(g.key(" ", "Space"), false);
    g.click("startGame");
    assert.strictEqual(g.key("ArrowDown"), true);
    assert.strictEqual(g.key(" ", "Space"), true);
    assert.strictEqual(g.key("ArrowLeft"), true);
    assert.strictEqual(g.key("Escape"), true);
  });

  await test("touch hold-repeat: one action on press, repeats while held, stops on release; mouse click not doubled; keyboard click works", async () => {
    const g = boot({ withPointer: true, buttons: ["left", "right", "rotate"] });
    g.run("window.calls = []; movePiece = (d) => window.calls.push(d);");
    const left = g.btnEls[0];
    left.emit("pointerdown", { button: 0, pointerId: 1 });
    assert.strictEqual(JSON.stringify(g.run("window.calls")), "[-1]");
    left.emit("click", { detail: 1 }); // the click a real pointer press also fires
    assert.strictEqual(JSON.stringify(g.run("window.calls")), "[-1]", "pointer click must not double-fire");
    await sleep(420);
    const held = g.run("window.calls.length");
    assert.ok(held >= 3, `expected repeats while held, got ${held}`);
    left.emit("pointerup", { pointerId: 1 });
    await sleep(200);
    assert.strictEqual(g.run("window.calls.length"), held, "must stop after release");
    left.emit("click", { detail: 0 }); // Enter/Space on the focused button
    assert.strictEqual(g.run("window.calls.length"), held + 1);
    g.btnEls[1].emit("pointerdown", { button: 0, pointerId: 2 });
    g.btnEls[1].emit("pointercancel", {});
    assert.strictEqual(g.run("window.calls.slice(-1)[0]"), 1);
  });

  await test("no PointerEvent support: left/right fall back to plain click", () => {
    const g = boot({ withPointer: false, buttons: ["left", "right"] });
    g.run("window.calls = []; movePiece = (d) => window.calls.push(d);");
    g.btnEls[0].emit("click", { detail: 1 });
    g.btnEls[1].emit("click", { detail: 1 });
    assert.strictEqual(JSON.stringify(g.run("window.calls")), "[-1,1]");
  });

  console.log("\nStructure and safety");
  await test("new UI code writes text only through textContent", () => {
    for (const f of ["progress.js", "progress-ui.js", "game.js"]) {
      const src = read(f);
      const bad = src.split("\n").filter((l) => /innerHTML|insertAdjacentHTML|outerHTML/.test(l));
      assert.deepStrictEqual(bad, [], f);
    }
  });
  await test("index.html loads progress scripts before game.js; progress ids exist", () => {
    const html = read("index.html");
    const g = html.indexOf('src="./game.js');
    for (const f of ["progress.js", "progress-ui.js"]) {
      const i = html.indexOf(`src="./${f}`);
      assert.ok(i > -1 && i < g, f);
    }
    for (const id of ["progressSummary", "levelStatsBody", "achievementGrid", "resetProgress", "badgeAnnouncer", "progressNotice"]) {
      assert.ok(html.includes(`id="${id}"`), id);
    }
    assert.ok(/prefers-reduced-motion/.test(read("styles.css")));
  });

  console.log(`\nResults\nPassed: ${passed}/${passed + failed}`);
  process.exit(failed ? 1 : 0);
})();
