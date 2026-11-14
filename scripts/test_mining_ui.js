#!/usr/bin/env node
// Mining Lab UI tests: runs the real mining-lab.js against a stub DOM using the
// main-thread (inline) miner. A real Web Worker is covered by the browser check.
//   node scripts/test_mining_ui.js
const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeDoc(html) {
  const els = {};
  const make = (id) => {
    const listeners = {};
    return {
      id, textContent: "", className: "", value: "", disabled: false, children: [],
      addEventListener(t, fn) { (listeners[t] ||= []).push(fn); },
      appendChild(c) { this.children.push(c); return c; },
      fire(t) { return Promise.all((listeners[t] || []).map((fn) => fn({}))); },
      listeners,
    };
  };
  for (const m of html.matchAll(/id="([A-Za-z]+)"/g)) els[m[1]] = make(m[1]);
  els.shaInput.value = "abc";
  els.genesisHead.value = "1000000";
  els.practiceBits.value = "22";
  els.genesisProgress.value = 0;
  els.practiceProgress.value = 0;
  return {
    els,
    getElementById: (id) => els[id] || null,
    createElement: () => make("x"),
  };
}

function boot() {
  const doc = makeDoc(read("index.html"));
  const scope = {
    crypto: crypto.webcrypto, TextEncoder, console, setTimeout, clearTimeout, performance,
    addEventListener() {},
  };
  scope.self = scope;
  const ctx = vm.createContext(scope);
  for (const f of ["sha256.js", "bitcoin.js", "miner-controller.js", "mining-lab.js"]) {
    vm.runInContext(read(f), ctx, { filename: f });
  }
  const lab = scope.TetroHashMiningLab.init(doc, scope);
  return { doc, scope, lab, e: doc.els };
}

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed += 1; console.log(`PASS ${name}`); }
  catch (e) { failed += 1; console.log(`FAIL ${name}\n     ${(e.stack || e.message).split("\n").slice(0, 4).join("\n     ")}`); }
}
async function until(fn, ms = 20000) {
  const t0 = Date.now();
  while (!fn()) {
    if (Date.now() - t0 > ms) throw new Error("timed out waiting for UI state");
    await sleep(5);
  }
}

(async () => {
  await test("init populates snapshot note, Genesis fields, and runs the SHA cross-check", async () => {
    const { e } = boot();
    assert.ok(/Static snapshot, not live data/.test(e.labSnapshotNote.textContent));
    assert.ok(/2026-11-13/.test(e.labSnapshotNote.textContent));
    assert.ok(/harder than Genesis/.test(e.labNetworkTarget.textContent));
    assert.ok(e.genesisFields.children.length >= 12);
    await until(() => e.shaMatch.className.includes("ok"));
    assert.strictEqual(e.shaOwn.textContent, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    assert.strictEqual(e.shaWeb.textContent, e.shaOwn.textContent);
    assert.ok(/agree/.test(e.shaMatch.textContent));
  });

  await test("rapid SHA input changes always end showing the latest value, cross-checked", async () => {
    const { e } = boot();
    await until(() => e.shaMatch.className.includes("ok"));
    e.shaInput.value = "";
    const a = e.shaInput.fire("input");
    e.shaInput.value = "hello";
    const b = e.shaInput.fire("input");
    await Promise.all([a, b]);
    await sleep(20);
    assert.strictEqual(e.shaOwn.textContent, crypto.createHash("sha256").update("hello").digest("hex"));
    assert.strictEqual(e.shaWeb.textContent, e.shaOwn.textContent);
  });

  await test("self-test lists only passing checks", async () => {
    const { e } = boot();
    await e.shaSelfTest.fire("click");
    const items = e.selfTestList.children;
    assert.ok(items.length === 8, String(items.length));
    assert.ok(items.every((li) => li.className === "pass"), items.map((i) => i.className + ":" + i.textContent).join("\n"));
  });

  await test("Genesis run finds the real nonce, verifies with WebCrypto, and restores buttons", async () => {
    const { e } = boot();
    e.genesisHead.value = "100000";
    const done = e.genesisStart.fire("click");
    assert.strictEqual(e.genesisStart.disabled, true);
    assert.strictEqual(e.practiceStart.disabled, true);
    assert.strictEqual(e.genesisCancel.disabled, false);
    await done;
    assert.ok(/✓ Found nonce 2,083,236,893/.test(e.genesisResult.textContent), e.genesisResult.textContent);
    assert.ok(e.genesisResult.textContent.includes("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"));
    assert.ok(/Independently verified with WebCrypto/.test(e.genesisResult.textContent));
    assert.ok(/real Genesis nonce/.test(e.genesisResult.textContent));
    assert.strictEqual(e.genesisResult.className, "lab-status ok");
    assert.strictEqual(e.genesisProgress.value, 100);
    assert.deepStrictEqual([e.genesisStart.disabled, e.practiceStart.disabled, e.genesisCancel.disabled], [false, false, true]);
  });

  await test("Cancel stops a long Genesis run quickly and the UI recovers for another run", async () => {
    const { e } = boot();
    e.genesisHead.value = "50000000";
    const done = e.genesisStart.fire("click");
    await until(() => /hashes/.test(e.genesisStats.textContent));
    const t0 = Date.now();
    e.genesisCancel.fire("click");
    await done;
    assert.ok(Date.now() - t0 < 1500, `cancel took ${Date.now() - t0}ms`);
    assert.ok(/^Cancelled after/.test(e.genesisResult.textContent), e.genesisResult.textContent);
    assert.strictEqual(e.genesisStart.disabled, false);
    e.genesisHead.value = "20000";
    await e.genesisStart.fire("click");
    assert.ok(/✓ Found/.test(e.genesisResult.textContent));
  });

  await test("Practice: validates input, then finds a hash that really meets the target", async () => {
    const { e } = boot();
    for (const bad of ["", "0", "41", "abc", "3.5", "-2", "1e1"]) {
      e.practiceBits.value = bad;
      await e.practiceBits.fire("input");
      await e.practiceStart.fire("click");
      assert.ok(/Enter a whole number/.test(e.practiceResult.textContent), `input ${JSON.stringify(bad)}`);
      assert.strictEqual(e.practiceStart.disabled, false);
    }
    e.practiceBits.value = "12";
    await e.practiceBits.fire("input");
    assert.ok(/4,096 hashes/.test(e.practiceExpect.textContent));
    await e.practiceStart.fire("click");
    assert.ok(/✓ Found/.test(e.practiceResult.textContent), e.practiceResult.textContent);
    const hash = e.practiceResult.textContent.match(/Hash ([0-9a-f]{64})/)[1];
    assert.ok(parseInt(hash.slice(0, 3), 16) < 16, "12 zero bits means the first 3 hex digits are <= 0x00f");
    assert.ok(hash.startsWith("00"));
  });

  await test("page text written only through textContent (no HTML injection path)", () => {
    const src = read("mining-lab.js");
    assert.ok(!/innerHTML|insertAdjacentHTML|outerHTML/.test(src));
    assert.ok(/textContent/.test(src));
  });

  console.log(`\nResults\nPassed: ${passed}/${passed + failed}`);
  process.exit(failed ? 1 : 0);
})();
