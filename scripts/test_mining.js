#!/usr/bin/env node
// Mining Lab core tests: SHA-256, Bitcoin header/target math, cancellable
// session, and MinerController lifecycle. No dependencies: node scripts/test_mining.js
const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const sha = require("../sha256.js");
const B = require("../bitcoin.js");
const { MinerController, createInlineWorker } = require("../miner-controller.js");
const ROOT = path.join(__dirname, "..");

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try { await fn(); passed += 1; console.log(`PASS ${name}`); }
  catch (e) { failed += 1; console.log(`FAIL ${name}\n     ${(e.stack || e.message).split("\n").slice(0, 4).join("\n     ")}`); }
}

// Deterministic PRNG (mulberry32) so failures are reproducible.
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const randBytes = (rnd, n) => Uint8Array.from({ length: n }, () => Math.floor(rnd() * 256));
const nodeSha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const G = B.GENESIS;
const genesisHeader = () => B.serializeHeader(G);
const genesisJob = (head = 3000, extra = {}) => ({
  headerHex: sha.bytesToHex(B.serializeHeader({ ...G, nonce: 0 })),
  targetHex: sha.bytesToHex(B.bitsToTarget(G.bits)),
  startNonce: G.nonce - head,
  maxNonces: head + 1000,
  chunk: 500,
  ...extra,
});

(async () => {
  console.log("SHA-256");
  await test("NIST/known vectors", () => {
    for (const v of sha.TEST_VECTORS) assert.strictEqual(sha.sha256Hex(v.input), v.hash, v.label);
  });
  await test("one million 'a' (NIST long message)", () => {
    assert.strictEqual(sha.sha256Hex("a".repeat(1000000)), "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0");
  });
  await test("matches node:crypto on random data at every padding boundary", () => {
    const rnd = prng(1234);
    const lengths = [0, 1, 54, 55, 56, 57, 63, 64, 65, 119, 120, 121, 127, 128, 129, 1000];
    for (const n of lengths) {
      for (let i = 0; i < 5; i += 1) {
        const data = randBytes(rnd, n);
        assert.strictEqual(sha.bytesToHex(sha.sha256(data)), nodeSha(data), `len ${n}`);
      }
    }
  });
  await test("UTF-8 strings hash like node (multi-byte)", () => {
    const s = "₿itcoin — 比特币 🧱";
    assert.strictEqual(sha.sha256Hex(s), nodeSha(Buffer.from(s, "utf8")));
  });
  await test("doubleSha256 equals sha256(sha256(x))", () => {
    const d = Buffer.from("hello");
    const once = crypto.createHash("sha256").update(d).digest();
    assert.strictEqual(sha.bytesToHex(sha.doubleSha256(new Uint8Array(d))), nodeSha(once));
  });
  await test("rejects bad input types and bad hex", () => {
    assert.throws(() => sha.sha256(123), TypeError);
    assert.throws(() => sha.hexToBytes("abc"), TypeError);
    assert.throws(() => sha.hexToBytes("zz"), TypeError);
  });

  console.log("\nBitcoin header and targets");
  await test("Genesis header serializes to the published 80 bytes", () => {
    assert.strictEqual(
      sha.bytesToHex(genesisHeader()),
      "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c",
    );
  });
  await test("Genesis double-SHA-256 equals the published block hash", () => {
    assert.strictEqual(B.blockHashHex(genesisHeader()), G.hash);
    assert.ok(G.hash.startsWith("00000000"));
  });
  await test("Genesis hash also confirmed by node:crypto (independent)", () => {
    const h = Buffer.from(genesisHeader());
    const once = crypto.createHash("sha256").update(h).digest();
    const twice = crypto.createHash("sha256").update(once).digest();
    assert.strictEqual(Buffer.from(twice).reverse().toString("hex"), G.hash);
  });
  await test("serializeHeader validates inputs", () => {
    assert.throws(() => B.serializeHeader({ ...G, nonce: -1 }), RangeError);
    assert.throws(() => B.serializeHeader({ ...G, nonce: 2 ** 32 }), RangeError);
    assert.throws(() => B.serializeHeader({ ...G, prevHash: "00" }), RangeError);
    assert.throws(() => B.serializeHeader({ ...G, merkleRoot: "zz".repeat(32) }), TypeError);
    assert.throws(() => B.blockHashHex(new Uint8Array(79)), RangeError);
  });
  await test("bitsToTarget: Genesis, a mid-history value, and invalid encodings", () => {
    assert.strictEqual(sha.bytesToHex(B.bitsToTarget(0x1d00ffff)), "00000000ffff0000000000000000000000000000000000000000000000000000");
    assert.strictEqual(sha.bytesToHex(B.bitsToTarget(0x1b0404cb)), "00000000000404cb000000000000000000000000000000000000000000000000");
    assert.throws(() => B.bitsToTarget(0x04923456), RangeError); // negative flag
    assert.throws(() => B.bitsToTarget(0x1d000000), RangeError); // zero mantissa
    assert.throws(() => B.bitsToTarget(0xff123456), RangeError); // overflow
  });
  await test("difficulty and expected hashes", () => {
    assert.strictEqual(B.difficultyFromTarget(B.bitsToTarget(0x1d00ffff)), 1);
    assert.strictEqual(B.difficultyFromTarget(B.targetFromZeroBits(33)) > 1, true);
    const e = B.expectedHashes(B.targetFromZeroBits(20));
    assert.ok(Math.abs(e - 2 ** 20) < 1, String(e));
    // Difficulty 1 needs ~2^32 hashes (slightly more because of the 0xffff mantissa).
    const g = B.expectedHashes(B.bitsToTarget(0x1d00ffff));
    assert.ok(g > 4.29e9 && g < 4.30e9, String(g));
  });
  await test("targetFromZeroBits shape", () => {
    assert.strictEqual(sha.bytesToHex(B.targetFromZeroBits(0)), "ff".repeat(32));
    assert.strictEqual(sha.bytesToHex(B.targetFromZeroBits(1)).slice(0, 4), "7fff");
    assert.strictEqual(sha.bytesToHex(B.targetFromZeroBits(9)).slice(0, 6), "007fff");
    assert.strictEqual(sha.bytesToHex(B.targetFromZeroBits(64)).slice(0, 18), "0000000000000000ff");
    assert.throws(() => B.targetFromZeroBits(65), RangeError);
    assert.throws(() => B.targetFromZeroBits(1.5), RangeError);
  });
  await test("hashMeetsTarget compares the REVERSED digest, <= inclusive", () => {
    const target = new Uint8Array(32); target[31] = 5; // target = 5
    const digest = (v) => { const d = new Uint8Array(32); d[0] = v; return d; }; // wire order: LSB first
    assert.strictEqual(B.hashMeetsTarget(digest(5), target), true);
    assert.strictEqual(B.hashMeetsTarget(digest(4), target), true);
    assert.strictEqual(B.hashMeetsTarget(digest(6), target), false);
    const high = new Uint8Array(32); high[31] = 1; // hash = 2^248 > target
    assert.strictEqual(B.hashMeetsTarget(high, target), false);
  });

  console.log("\nNonce search");
  await test("midstate searcher equals plain double-SHA on random headers/nonces", () => {
    const rnd = prng(99);
    const nonces = [0, 1, 255, 256, 65535, 65536, 0x7fffffff, 0x80000000, 0xfffffffe, 0xffffffff];
    for (let i = 0; i < 6; i += 1) {
      const header = randBytes(rnd, 80);
      const s = B.createNonceSearcher(header);
      for (const nonce of nonces.concat([Math.floor(rnd() * 2 ** 32)])) {
        const copy = Uint8Array.from(header);
        copy[76] = nonce & 255; copy[77] = (nonce >>> 8) & 255; copy[78] = (nonce >>> 16) & 255; copy[79] = (nonce >>> 24) & 255;
        assert.strictEqual(sha.bytesToHex(s.digestFor(nonce)), nodeSha(Buffer.from(nodeShaRaw(copy))), `nonce ${nonce}`);
      }
    }
    function nodeShaRaw(b) { return crypto.createHash("sha256").update(b).digest(); }
  });
  await test("scan re-discovers the real Genesis nonce", () => {
    const s = B.createNonceSearcher(B.serializeHeader({ ...G, nonce: 0 }));
    const r = s.scan(G.nonce - 5000, 10000, B.bitsToTarget(G.bits));
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.nonce, G.nonce);
    assert.strictEqual(r.tried, 5001);
    assert.strictEqual(sha.bytesToHex(rev(r.digest)), G.hash);
  });
  await test("scan: no hit reports tried; clamps at 2^32-1; validates start", () => {
    const s = B.createNonceSearcher(genesisHeader());
    const impossible = B.targetFromZeroBits(64);
    const miss = s.scan(0, 1000, impossible);
    assert.deepStrictEqual([miss.found, miss.tried, miss.nonce], [false, 1000, 999]);
    const edge = s.scan(B.MAX_NONCE - 2, 10, impossible);
    assert.deepStrictEqual([edge.found, edge.tried, edge.nonce], [false, 3, B.MAX_NONCE]);
    assert.throws(() => s.scan(-1, 5, impossible), RangeError);
    assert.throws(() => B.createNonceSearcher(new Uint8Array(10)), RangeError);
  });
  function rev(b) { return Uint8Array.from(b).reverse(); }

  console.log("\nMiner session");
  function collect() {
    const msgs = [];
    return { msgs, post: (m) => msgs.push(m) };
  }
  await test("finds the Genesis nonce, emits monotonic progress, posts exactly one terminal message", async () => {
    const c = collect();
    const s = B.createMinerSession(c.post);
    s.handle({ type: "start", jobId: 7, ...genesisJob(3000) });
    while (s.isBusy()) await sleep(1);
    const terminal = c.msgs.filter((m) => m.type !== "progress");
    assert.strictEqual(terminal.length, 1);
    assert.strictEqual(terminal[0].type, "found");
    assert.strictEqual(terminal[0].nonce, G.nonce);
    assert.strictEqual(terminal[0].hash, G.hash);
    assert.strictEqual(terminal[0].hashes, 3001);
    const prog = c.msgs.filter((m) => m.type === "progress").map((m) => m.hashes);
    assert.ok(prog.length >= 5);
    assert.deepStrictEqual(prog, [...prog].sort((a, b) => a - b));
    assert.ok(c.msgs.every((m) => m.jobId === 7));
  });
  await test("cooperative cancel stops between chunks", async () => {
    const c = collect();
    let s;
    let yields = 0;
    s = B.createMinerSession(c.post, { yieldFn: async () => { yields += 1; if (yields === 3) s.handle({ type: "cancel", jobId: 1 }); await sleep(0); } });
    s.handle({ type: "start", jobId: 1, ...genesisJob(0, { startNonce: 0, maxNonces: 1e7, targetHex: sha.bytesToHex(B.targetFromZeroBits(64)), chunk: 1000 }) });
    while (s.isBusy()) await sleep(1);
    const last = c.msgs[c.msgs.length - 1];
    assert.strictEqual(last.type, "cancelled");
    assert.strictEqual(last.hashes, 3000);
    assert.strictEqual(c.msgs.filter((m) => m.type !== "progress").length, 1);
  });
  await test("cancel for another jobId is ignored; unknown messages are harmless", async () => {
    const c = collect();
    let s;
    let n = 0;
    s = B.createMinerSession(c.post, { yieldFn: async () => { n += 1; if (n === 1) { s.handle({ type: "cancel", jobId: 999 }); s.handle(null); s.handle({ type: "bogus" }); } await sleep(0); } });
    s.handle({ type: "start", jobId: 2, ...genesisJob(2000, { chunk: 500 }) });
    while (s.isBusy()) await sleep(1);
    assert.strictEqual(c.msgs[c.msgs.length - 1].type, "found");
  });
  await test("exhausted when the range ends without a hit; range clamps at 2^32", async () => {
    const c = collect();
    const s = B.createMinerSession(c.post);
    s.handle({ type: "start", jobId: 3, ...genesisJob(0, { startNonce: 0, maxNonces: 5000, targetHex: sha.bytesToHex(B.targetFromZeroBits(64)), chunk: 2000 }) });
    while (s.isBusy()) await sleep(1);
    assert.deepStrictEqual([c.msgs.at(-1).type, c.msgs.at(-1).hashes], ["exhausted", 5000]);
    const c2 = collect();
    const s2 = B.createMinerSession(c2.post);
    s2.handle({ type: "start", jobId: 4, ...genesisJob(0, { startNonce: B.MAX_NONCE - 4, maxNonces: 1e9, targetHex: sha.bytesToHex(B.targetFromZeroBits(64)) }) });
    while (s2.isBusy()) await sleep(1);
    assert.deepStrictEqual([c2.msgs.at(-1).type, c2.msgs.at(-1).hashes], ["exhausted", 5]);
  });
  await test("bad input produces an error message, not an exception or a hang", async () => {
    for (const bad of [
      { headerHex: "00", targetHex: "00".repeat(32), startNonce: 0, maxNonces: 10 },
      { headerHex: "00".repeat(80), targetHex: "00", startNonce: 0, maxNonces: 10 },
      { headerHex: "00".repeat(80), targetHex: "ff".repeat(32), startNonce: -5, maxNonces: 10 },
      { headerHex: "00".repeat(80), targetHex: "ff".repeat(32), startNonce: 0, maxNonces: 0 },
      { headerHex: "zz", targetHex: "ff".repeat(32), startNonce: 0, maxNonces: 10 },
    ]) {
      const c = collect();
      const s = B.createMinerSession(c.post);
      s.handle({ type: "start", jobId: 1, ...bad });
      while (s.isBusy()) await sleep(1);
      assert.strictEqual(c.msgs.at(-1).type, "error", JSON.stringify(bad));
    }
  });
  await test("second start while busy is rejected; slot frees before terminal message", async () => {
    const c = collect();
    const s = B.createMinerSession(c.post, { yieldFn: () => sleep(1) });
    s.handle({ type: "start", jobId: 1, ...genesisJob(3000, { chunk: 200 }) });
    s.handle({ type: "start", jobId: 2, ...genesisJob(10) });
    const refused = c.msgs.find((m) => m.type === "error");
    assert.ok(refused && refused.jobId === 2, "second start must be refused");
    // restart from inside the terminal-message callback (what inline mode does)
    let restarted = false;
    const s2 = B.createMinerSession((m) => {
      if (m.type === "found" && !restarted) { restarted = true; s2.handle({ type: "start", jobId: 9, ...genesisJob(50) }); }
      c.msgs.push(m);
    });
    s2.handle({ type: "start", jobId: 8, ...genesisJob(50) });
    while (s2.isBusy()) await sleep(1);
    assert.ok(c.msgs.some((m) => m.type === "found" && m.jobId === 9));
    while (s.isBusy()) await sleep(1);
  });

  console.log("\nMinerController");
  const inline = () => createInlineWorker((post) => B.createMinerSession(post));
  await test("start resolves found with progress callbacks; worker is reused", async () => {
    let created = 0;
    const ctl = new MinerController({ createWorker: () => { created += 1; return inline(); } });
    const progress = [];
    const r1 = await ctl.start(genesisJob(3000), (p) => progress.push(p.hashes));
    assert.strictEqual(r1.status, "found");
    assert.strictEqual(r1.nonce, G.nonce);
    assert.strictEqual(r1.hash, G.hash);
    assert.ok(progress.length > 0);
    const r2 = await ctl.start(genesisJob(100));
    assert.strictEqual(r2.nonce, G.nonce);
    assert.strictEqual(created, 1);
    assert.strictEqual(ctl.busy, false);
    ctl.dispose();
  });
  await test("cooperative cancel resolves 'cancelled' (not forced) and allows a new job", async () => {
    const ctl = new MinerController({ createWorker: inline, cancelGraceMs: 2000 });
    const slow = genesisJob(0, { startNonce: 0, maxNonces: 2 ** 32 - 1, targetHex: sha.bytesToHex(B.targetFromZeroBits(64)), chunk: 5000 });
    let sawProgress;
    const gotProgress = new Promise((r) => { sawProgress = r; });
    const p = ctl.start(slow, () => sawProgress());
    await gotProgress;
    const t0 = Date.now();
    ctl.cancel();
    const r = await p;
    assert.strictEqual(r.status, "cancelled");
    assert.ok(!r.forced, "should not need hard terminate");
    assert.ok(Date.now() - t0 < 1000);
    assert.ok(r.hashes > 0);
    assert.strictEqual(ctl.busy, false);
    const again = await ctl.start(genesisJob(200));
    assert.strictEqual(again.status, "found");
    ctl.dispose();
  });
  await test("unresponsive worker is force-terminated after the grace period", async () => {
    const workers = [];
    const stubborn = () => {
      const w = { terminated: false, posted: [], onmessage: null, onerror: null };
      w.postMessage = (m) => w.posted.push(m); // swallows everything, never answers
      w.terminate = () => { w.terminated = true; };
      workers.push(w);
      return w;
    };
    const ctl = new MinerController({ createWorker: stubborn, cancelGraceMs: 20 });
    const p = ctl.start(genesisJob());
    ctl.cancel();
    const r = await p;
    assert.deepStrictEqual([r.status, r.forced], ["cancelled", true]);
    assert.strictEqual(workers[0].terminated, true);
    assert.ok(workers[0].posted.some((m) => m.type === "cancel"));
    // next start gets a fresh worker
    const p2 = ctl.start(genesisJob());
    assert.strictEqual(workers.length, 2);
    ctl.dispose();
    assert.strictEqual((await p2).status, "cancelled");
  });
  await test("a late reply from a terminated worker or an old job is ignored", async () => {
    const workers = [];
    const ctl = new MinerController({ createWorker: () => { const w = { postMessage() {}, terminate() {}, onmessage: null }; workers.push(w); return w; }, cancelGraceMs: 10 });
    const p1 = ctl.start(genesisJob());
    ctl.cancel();
    await p1; // forced
    const p2 = ctl.start(genesisJob());
    workers[0].onmessage({ data: { type: "found", jobId: 1, nonce: 5, hash: "ff", hashes: 1 } }); // old worker
    workers[1].onmessage({ data: { type: "found", jobId: 1, nonce: 5, hash: "ff", hashes: 1 } }); // old job id
    assert.strictEqual(ctl.busy, true);
    workers[1].onmessage({ data: { type: "found", jobId: 2, nonce: 42, hash: "00", hashes: 3 } });
    const r = await p2;
    assert.deepStrictEqual([r.status, r.nonce], ["found", 42]);
    ctl.dispose();
  });
  await test("concurrent start is refused; worker error and factory failure resolve as errors", async () => {
    const ctl = new MinerController({ createWorker: inline });
    const slow = genesisJob(0, { startNonce: 0, maxNonces: 2 ** 32 - 1, targetHex: sha.bytesToHex(B.targetFromZeroBits(64)), chunk: 5000 });
    const p = ctl.start(slow);
    const refused = await ctl.start(genesisJob());
    assert.strictEqual(refused.status, "error");
    ctl.cancel();
    assert.strictEqual((await p).status, "cancelled");
    ctl.dispose();

    let w;
    const ctl2 = new MinerController({ createWorker: () => (w = { postMessage() {}, terminate() {}, onmessage: null, onerror: null }) });
    const p2 = ctl2.start(genesisJob());
    w.onerror({ message: "boom" });
    assert.deepStrictEqual(await p2, { status: "error", message: "boom" });

    const ctl3 = new MinerController({ createWorker: () => { throw new Error("no workers"); } });
    assert.deepStrictEqual(await ctl3.start(genesisJob()), { status: "error", message: "no workers" });
    assert.throws(() => new MinerController({}), TypeError);
  });
  await test("dispose terminates a running job", async () => {
    const ctl = new MinerController({ createWorker: inline });
    const slow = genesisJob(0, { startNonce: 0, maxNonces: 2 ** 32 - 1, targetHex: sha.bytesToHex(B.targetFromZeroBits(64)), chunk: 5000 });
    const p = ctl.start(slow);
    await sleep(20);
    ctl.dispose();
    const r = await p;
    assert.deepStrictEqual([r.status, r.forced], ["cancelled", true]);
  });
  await test("inline worker mid-run terminate stops emitting messages", async () => {
    const got = [];
    const w = inline();
    w.onmessage = (e) => got.push(e.data.type);
    w.postMessage({ type: "start", jobId: 1, ...genesisJob(0, { startNonce: 0, maxNonces: 2 ** 32 - 1, targetHex: sha.bytesToHex(B.targetFromZeroBits(64)), chunk: 2000 }) });
    await sleep(30);
    w.terminate();
    const n = got.length;
    await sleep(40);
    assert.strictEqual(got.length, n);
  });

  console.log("\nWiring and safety");
  await test("index.html loads lab scripts in dependency order and provides every element id the lab uses", () => {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const order = ["sha256.js", "bitcoin.js", "miner-controller.js", "mining-lab.js"].map((f) => html.indexOf(`src="./${f}`));
    assert.ok(order.every((i) => i > -1), "missing script tag");
    assert.deepStrictEqual(order, [...order].sort((a, b) => a - b));
    const ui = fs.readFileSync(path.join(ROOT, "mining-lab.js"), "utf8");
    const ids = new Set([...ui.matchAll(/\$\("([A-Za-z]+)"\)/g)].map((m) => m[1]));
    assert.ok(ids.size > 20);
    for (const id of ids) assert.ok(html.includes(`id="${id}"`), `index.html missing id="${id}"`);
  });
  await test("worker entry imports the shared scripts and routes messages to the session", () => {
    const w = fs.readFileSync(path.join(ROOT, "mining-worker.js"), "utf8");
    assert.ok(/importScripts\("\.\/sha256\.js", "\.\/bitcoin\.js"\)/.test(w));
    assert.ok(/createMinerSession/.test(w) && /onmessage/.test(w));
  });
  await test("lab code never uses innerHTML/eval/Function and makes no network calls", () => {
    for (const f of ["sha256.js", "bitcoin.js", "miner-controller.js", "mining-lab.js", "mining-worker.js"]) {
      const src = fs.readFileSync(path.join(ROOT, f), "utf8");
      assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|\beval\(|new Function|document\.write/.test(src), `${f} unsafe API`);
      assert.ok(!/\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon/.test(src), `${f} network access`);
    }
  });
  await test("network snapshot is labelled static with a date and source", () => {
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(B.NETWORK_SNAPSHOT.asOf));
    assert.ok(B.NETWORK_SNAPSHOT.sources.every((s) => s.startsWith("https://")));
    const ui = fs.readFileSync(path.join(ROOT, "mining-lab.js"), "utf8");
    assert.ok(/Static snapshot, not live data/.test(ui));
  });

  console.log(`\nResults\nPassed: ${passed}/${passed + failed}`);
  process.exit(failed ? 1 : 0);
})();
