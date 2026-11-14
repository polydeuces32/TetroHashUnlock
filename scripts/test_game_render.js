#!/usr/bin/env node
// M4: rendering, full 15-level victory, board scaling, and lifecycle edge cases,
// all against the real game.js in a Node vm. node scripts/test_game_render.js
const assert = require("assert");
const { boot, mineBlock, read } = require("./game_harness.js");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed += 1; console.log(`PASS ${name}`); }
  catch (e) { failed += 1; console.log(`FAIL ${name}\n     ${(e.stack || e.message).split("\n").slice(0, 4).join("\n     ")}`); }
}
const waitIdle = async (g) => { while (g.run("state.miningBusy")) await sleep(1); };
const label = (g) => g.els.gameCanvas.getAttribute("aria-label");

(async () => {
  console.log("Rendering");
  await test("every level renders its title and mining screen without errors", () => {
    const g = boot();
    g.click("startGame");
    const n = g.run("LEVELS.length");
    assert.strictEqual(n, 15);
    for (let i = 1; i <= n; i += 1) {
      g.run(`state.level = ${i}; state.mode = "tetris"`);
      g.clearDraws();
      g.run("draw()");
      const name = g.run(`LEVELS[${i - 1}].name`).toUpperCase();
      assert.ok(g.draws.texts.includes(name), `level ${i} title ${name}`);
      g.run(`state.mode = "mining"; state.blockData = "x"; state.targetPrefix = "0".repeat(LEVELS[${i - 1}].targetZeros)`);
      g.clearDraws();
      g.run("draw()");
      const boss = g.run(`Boolean(LEVELS[${i - 1}].boss)`);
      assert.ok(g.draws.texts.includes(boss ? "BIG MINING ROUND" : "MINING TIME"), `level ${i} mining title`);
      assert.ok(g.draws.texts.some((t) => t.startsWith("need: 0")), "target prefix shown");
    }
  });

  await test("paused, game-over, victory overlays and toast draw their text", () => {
    const g = boot();
    g.click("startGame");
    g.key("p");
    g.clearDraws(); g.run("draw()");
    assert.ok(g.draws.texts.includes("PAUSED"));
    g.key("p");
    g.run("state.score = 321; endGame();");
    g.clearDraws(); g.run("draw()");
    assert.ok(g.draws.texts.includes("GAME OVER"));
    assert.ok(g.draws.texts.includes("score: 321"));
    g.run("state.won = true; state.over = false;");
    g.clearDraws(); g.run("draw()");
    assert.ok(g.draws.texts.includes("YOU WIN!"));
    assert.ok(!g.draws.texts.includes("GAME OVER"));
    const g2 = boot();
    g2.click("startGame");
    g2.run('showToast("Hello toast", 5000)');
    g2.clearDraws(); g2.run("draw()");
    assert.ok(g2.draws.texts.includes("Hello toast"));
    g2.run("toast.until = Date.now() - 1");
    g2.clearDraws(); g2.run("draw()");
    assert.ok(!g2.draws.texts.includes("Hello toast"));
  });

  await test("a full-board fill is always in logical units, whatever the pixel ratio", () => {
    for (const dpr of [undefined, 1, 2, 3]) {
      const g = boot({ dpr });
      g.clearDraws(); g.run("draw()");
      // The cached background is blitted over the full logical board (or painted directly).
      const blit = g.draws.imageArgs.some((a) => a[0] === 0 && a[1] === 0 && a[2] === 320 && a[3] === 520);
      const direct = g.draws.rects.some((r) => r[0] === 0 && r[1] === 0 && r[2] === 320 && r[3] === 520);
      assert.ok(blit || direct, `dpr ${dpr}`);
    }
  });

  await test("row-clear flash is set normally and suppressed for reduced motion", () => {
    const clear = (g) => g.run(`state.grid=createGrid(); state.grid[15]=Array(10).fill('#fff'); state.grid[15][0]=null; state.grid[15][1]=null; state.piece={shape:[[1,1]],color:'#0ff',x:0,y:15}; lockPiece(); state.flashUntil`);
    const g = boot();
    g.click("startGame");
    assert.ok(clear(g) > Date.now());
    const r = boot({ reduced: true });
    r.click("startGame");
    assert.strictEqual(clear(r), 0);
    assert.strictEqual(r.run("prefersReducedMotion()"), true);
  });

  console.log("\nCanvas scaling and board label");
  await test("bitmap scales to devicePixelRatio (cap 2) and re-fits on resize", () => {
    const g1 = boot();
    assert.deepStrictEqual([g1.els.gameCanvas.width, g1.els.gameCanvas.height], [320, 520]);
    const g2 = boot({ dpr: 2 });
    assert.deepStrictEqual([g2.els.gameCanvas.width, g2.els.gameCanvas.height], [640, 1040]);
    assert.ok(g2.draws.transforms.some((t) => t[0] === 2 && t[3] === 2));
    const g3 = boot({ dpr: 3 });
    assert.strictEqual(g3.els.gameCanvas.width, 640);
    g2.run("window.devicePixelRatio = 1");
    g2.fireWindow("resize");
    assert.deepStrictEqual([g2.els.gameCanvas.width, g2.els.gameCanvas.height], [320, 520]);
    const before = g2.draws.transforms.length;
    g2.fireWindow("resize"); // unchanged ratio: no churn
    assert.strictEqual(g2.draws.transforms.length, before);
  });

  await test("canvas CSS keeps a bounded, proportional size", () => {
    const css = read("styles.css");
    assert.ok(/#gameCanvas \{[^}]*max-width: 360px[^}]*aspect-ratio: 320 \/ 520/s.test(css));
    assert.ok(!/#gameCanvas \{\s*max-width: 100%;/.test(css), "no override that removes the 360px cap");
  });

  await test("screen-reader board label tracks state and only changes when the text does", async () => {
    const g = boot();
    g.run("updateDifficulty()");
    assert.ok(/Press Start/.test(label(g)));
    g.click("startGame");
    assert.ok(/Level 1 of 15, Genesis Block\. Stacking blocks\. Score 0\./.test(label(g)), label(g));
    g.run("state.linesSinceMine=99; enterMiningPuzzle();");
    assert.ok(/Mining a block/.test(label(g)));
    g.key("p");
    assert.ok(/Paused\./.test(label(g)));
    g.key("p");
    let sets = 0;
    const el = g.els.gameCanvas;
    const orig = el.setAttribute.bind(el);
    el.setAttribute = (k, v) => { sets += 1; orig(k, v); };
    g.run("updateDifficulty(); updateDifficulty(); updateDifficulty();");
    assert.strictEqual(sets, 0, "no DOM write when label unchanged");
    g.run("state.score = 9; endGame();");
    assert.ok(/Game over with 9 points/.test(label(g)));
  });

  console.log("\nFull victory progression");
  await test("mining all 15 levels in order: deterministic score, rewards once, progress for every level", async () => {
    const g = boot();
    g.click("startGame");
    const chain = g.run("BITCOIN_CHAIN_TIP_HEIGHT");
    let expected = 0;
    for (let i = 0; i < 15; i += 1) {
      assert.strictEqual(g.run("state.level"), i + 1, `entering level ${i + 1}`);
      assert.strictEqual(g.run("state.running"), true, `still running at level ${i + 1}`);
      g.run("state.grid = createGrid(); state.linesSinceMine = 99; enterMiningPuzzle(); sha256Hex = async () => '0'.repeat(8) + 'f'.repeat(56);");
      const lv = g.run(`({ reward: LEVELS[${i}].reward, boss: Boolean(LEVELS[${i}].boss) })`);
      expected += lv.reward + 319 + (lv.boss ? 500 : 0) + 120 * i;
      g.key(" ", "Space");
      await waitIdle(g);
      assert.strictEqual(g.run("state.blocksMined"), i + 1, `block ${i + 1}`);
    }
    assert.strictEqual(g.run("state.won"), true);
    assert.strictEqual(g.run("state.running"), false);
    assert.strictEqual(g.run("state.score"), expected, "score must equal the sum of block rewards");
    assert.strictEqual(g.run("state.blockHeight"), chain + 15);
    assert.strictEqual(g.run("state.runSats"), 5);
    const rw = JSON.parse(g.store["tetrohash_deep_rewards_v1"]);
    assert.deepStrictEqual([rw.satsBalance, rw.wins, rw.bestLevel], [5, 1, 15]);
    const p = g.progressOf();
    assert.ok(p.levels.every((l) => l.completions === 1 && l.entered >= 1), "every level cleared exactly once");
    assert.deepStrictEqual([p.stats.runs, p.stats.wins, p.stats.blocksMined, p.stats.bestCombo], [1, 1, 15, 15]);
    for (const id of ["firstBlock", "bossWin", "comboThree", "streakFive", "levelFive", "levelTen", "champion", "luckyNonce", "highRoller"]) {
      assert.ok(id in p.achievements, id);
    }
    const hs = JSON.parse(g.store["tetrohash_highscores_v1"]);
    assert.deepStrictEqual([hs.length, hs[0].won, hs[0].blocks, hs[0].score], [1, true, 15, expected]);
    g.clearDraws(); g.run("draw()");
    assert.ok(g.draws.texts.includes("YOU WIN!"));
    assert.ok(/won/i.test(label(g)));
  });

  await test("after victory: input is inert, reset starts clean, rewards and progress persist", async () => {
    const g = boot();
    g.click("startGame");
    g.run("state.score=100; state.blocksMined=14; handleValidBlock('00a');");
    assert.strictEqual(g.run("state.won"), true);
    const x = g.run("state.piece && state.piece.x");
    for (const k of ["ArrowLeft", "ArrowUp", "ArrowDown", "p"]) g.key(k);
    g.key(" ", "Space");
    assert.strictEqual(g.run("state.piece && state.piece.x"), x);
    assert.strictEqual(g.run("state.blocksMined"), 15);
    g.key("Escape");
    assert.deepStrictEqual([g.run("state.won"), g.run("state.level"), g.run("state.score"), g.run("state.blocksMined")], [false, 1, 0, 0]);
    assert.strictEqual(JSON.parse(g.store["tetrohash_deep_rewards_v1"]).satsBalance, 5);
    assert.strictEqual(g.progressOf().stats.wins, 1);
    g.click("startGame");
    assert.strictEqual(g.run("state.running"), true);
    g.run("state.score=50; state.blocksMined=14; handleValidBlock('00a');");
    assert.strictEqual(JSON.parse(g.store["tetrohash_deep_rewards_v1"]).satsBalance, 10, "a second win pays again, once");
  });

  console.log("\nLifecycle edge cases");
  await test("hiding the page auto-pauses a running game exactly once; hidden idle/paused/over is untouched", () => {
    const g = boot();
    g.setVisibility("hidden");
    assert.strictEqual(g.run("state.paused"), false, "idle game");
    g.setVisibility("visible");
    g.click("startGame");
    g.setVisibility("hidden");
    assert.strictEqual(g.run("state.paused"), true);
    assert.ok(/Paused because the page was hidden/.test(g.els.gameMessage.textContent));
    g.setVisibility("hidden"); // second hidden event must not resume
    assert.strictEqual(g.run("state.paused"), true);
    g.setVisibility("visible");
    assert.strictEqual(g.run("state.paused"), true, "coming back never auto-resumes");
    g.key("p");
    assert.strictEqual(g.run("state.paused"), false);
    g.run("state.score=5; endGame();");
    g.setVisibility("hidden");
    assert.strictEqual(g.run("state.paused"), false);
  });

  await test("hiding during in-flight hashing pauses without awarding; resuming lets mining continue", async () => {
    const g = boot();
    g.click("startGame");
    g.run("state.linesSinceMine=99; enterMiningPuzzle(); sha256Hex = async () => '00' + 'f'.repeat(62);");
    g.run("mineBatch()");
    g.setVisibility("hidden");
    await sleep(20);
    assert.strictEqual(g.run("state.blocksMined"), 0);
    assert.strictEqual(g.run("state.miningBusy"), false);
    g.setVisibility("visible");
    g.key("p");
    g.key(" ", "Space");
    await waitIdle(g);
    assert.strictEqual(g.run("state.blocksMined"), 1);
  });

  await test("Escape during mining resets cleanly; Start while running restarts without carrying state", () => {
    const g = boot();
    g.click("startGame");
    g.run("state.linesSinceMine=99; enterMiningPuzzle(); state.score = 10;");
    g.key("Escape");
    assert.deepStrictEqual([g.run("state.mode"), g.run("state.running"), g.run("state.score")], ["tetris", false, 0]);
    g.click("startGame");
    const id1 = g.run("state.runId");
    g.run("state.score = 77; state.combo = 3;");
    g.click("startGame");
    assert.ok(g.run("state.runId") > id1);
    assert.deepStrictEqual([g.run("state.score"), g.run("state.combo"), g.run("state.running")], [0, 0, true]);
  });

  await test("game over while mining stops mining; game over overlay stays until restart", async () => {
    const g = boot();
    g.click("startGame");
    g.run("state.linesSinceMine=99; enterMiningPuzzle(); state.score = 20; endGame();");
    g.key(" ", "Space");
    await waitIdle(g);
    assert.strictEqual(g.run("state.blocksMined"), 0);
    assert.strictEqual(g.run("state.over"), true);
    g.key("p");
    assert.strictEqual(g.run("state.paused"), false, "cannot pause a finished run");
    g.click("startGame");
    assert.strictEqual(g.run("state.over"), false);
  });

  await test("failed mining batch explains tries so far and expected effort; double Space is ignored while busy", async () => {
    const g = boot();
    g.click("startGame");
    g.run("window.calls = 0; state.linesSinceMine=99; enterMiningPuzzle(); sha256Hex = async () => { window.calls += 1; return 'ff'.repeat(32); };");
    g.key(" ", "Space");
    g.key(" ", "Space");
    g.key(" ", "Space");
    await waitIdle(g);
    assert.strictEqual(g.run("window.calls"), g.run("LEVELS[0].hashBatch"), "one batch only");
    const msg = g.els.gameMessage.textContent;
    assert.ok(/Not yet/.test(msg) && /10 tries so far/.test(msg) && /about 256 expected/.test(msg), msg);
    assert.strictEqual(g.run("state.combo"), 0);
  });

  await test("start with a broken canvas context fails safe without throwing", () => {
    const g = boot();
    g.run("draw = () => { throw new Error('canvas lost'); }");
    g.click("startGame"); // draw() throws inside startGame's try/catch
    assert.strictEqual(g.run("state.running"), false);
    assert.ok(/Could not start/.test(g.els.gameMessage.textContent));
  });

  await test("keyboard focus aids exist: skip link, keyboard-activatable buttons", () => {
    const html = read("index.html");
    assert.ok(/<a class="skip-link" href="#game">/.test(html));
    assert.ok(/\.skip-link:focus/.test(read("styles.css")));
    assert.ok(/<canvas[^>]*role="img"[^>]*aria-label=/.test(html));
  });

  await test("themed background is painted once per level/scale and blitted afterwards", () => {
    const g = boot();
    g.click("startGame");
    g.clearDraws(); g.run("draw()");
    assert.ok(g.draws.images >= 1, "blits the cached background");
    g.clearDraws();
    for (let i = 0; i < 20; i += 1) g.run("draw()");
    assert.strictEqual(g.draws.gradients, 0, "no gradient rebuild on cached frames");
    assert.strictEqual(g.draws.images, 20);
    g.run("state.level = 2");
    g.clearDraws(); g.run("draw(); draw();");
    assert.strictEqual(g.draws.gradients, 1, "exactly one rebuild for the new level");
    g.run("window.devicePixelRatio = 2");
    g.fireWindow("resize");
    g.clearDraws(); g.run("draw();");
    assert.strictEqual(g.draws.gradients, 0, "scale change rebuilt during fitCanvas, not per frame");
  });

  await test("falls back to direct painting if an offscreen canvas is unavailable", () => {
    const g = boot();
    g.click("startGame");
    g.run("document.createElement = () => ({})");
    g.run("bgCache.key = ''; bgCache.canvas = null;");
    g.clearDraws();
    g.run("draw()");
    assert.strictEqual(g.draws.images, 0);
    assert.ok(g.draws.gradients >= 1, "painted directly");
  });

  console.log(`\nResults\nPassed: ${passed}/${passed + failed}`);
  process.exit(failed ? 1 : 0);
})();
