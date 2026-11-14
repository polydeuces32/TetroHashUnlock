/*
 * Mining Lab UI. All dynamic text is written with textContent only.
 * Depends on sha256.js, bitcoin.js, miner-controller.js (loaded before this file).
 * Exposes TetroHashMiningLab.init(doc, scope) so tests can drive it with a stub DOM.
 */
(function (root) {
  "use strict";

  function init(doc, scope) {
    const sha = scope.TetroHashSha256;
    const btc = scope.TetroHashBitcoin;
    const Ctl = scope.TetroHashMinerController;
    if (!sha || !btc || !Ctl || !doc.getElementById("lab")) return null;

    const $ = (id) => doc.getElementById(id);
    const fmt = (n) => Number(n).toLocaleString("en-US");
    const rev = (bytes) => Uint8Array.from(bytes).reverse();

    /* ---------- independent verification via WebCrypto ---------- */

    async function webSha256(bytes) {
      const subtle = scope.crypto && scope.crypto.subtle;
      if (!subtle) return null;
      return new Uint8Array(await subtle.digest("SHA-256", bytes));
    }

    async function webBlockHash(header) {
      const once = await webSha256(header);
      if (!once) return null;
      return sha.bytesToHex(rev(await webSha256(once)));
    }

    /* ---------- header / network text ---------- */

    const snap = btc.NETWORK_SNAPSHOT;
    const expectedNet = snap.difficulty * 4294967296;
    $("labNetworkTarget").textContent = `≈ ${snap.difficulty.toExponential(2)}× harder than Genesis`;
    $("labSnapshotNote").textContent =
      `Static snapshot, not live data: on ${snap.asOf} (block ${fmt(snap.height)}) Bitcoin's difficulty was about ` +
      `${snap.difficulty.toExponential(2)} (source: ${snap.sources[0]}), meaning roughly ${expectedNet.toExponential(1)} ` +
      `hashes per block on average. A browser tab does around a million hashes per second.`;

    const g = btc.GENESIS;
    const genesisTarget = btc.bitsToTarget(g.bits);
    const fields = [
      ["Version", String(g.version)],
      ["Previous block", g.prevHash],
      ["Merkle root", g.merkleRoot],
      ["Time", `${g.time} (${new Date(g.time * 1000).toISOString().slice(0, 10)})`],
      ["Bits", "0x" + g.bits.toString(16)],
      ["Target", sha.bytesToHex(genesisTarget)],
      ["Real nonce (hidden from the search)", "found by mining, see below"],
    ];
    const fieldsEl = $("genesisFields");
    fieldsEl.textContent = "";
    fields.forEach(([k, v]) => {
      const dt = doc.createElement("dt");
      dt.textContent = k;
      const dd = doc.createElement("dd");
      dd.className = "mono";
      dd.textContent = v;
      fieldsEl.appendChild(dt);
      fieldsEl.appendChild(dd);
    });

    /* ---------- 1. SHA-256 verifier ---------- */

    let shaSeq = 0;
    async function updateSha() {
      const seq = (shaSeq += 1);
      const text = $("shaInput").value;
      const own = sha.sha256Hex(text);
      $("shaOwn").textContent = own;
      let web = null;
      try {
        web = await webSha256(new TextEncoder().encode(text));
      } catch {
        web = null;
      }
      if (seq !== shaSeq) return; // a newer keystroke superseded this one
      const status = $("shaMatch");
      if (!web) {
        $("shaWeb").textContent = "WebCrypto unavailable on this page (needs https or localhost)";
        status.textContent = "Could not cross-check; WebCrypto is unavailable here.";
        status.className = "lab-status";
        return;
      }
      const webHex = sha.bytesToHex(web);
      $("shaWeb").textContent = webHex;
      const match = webHex === own;
      status.textContent = match ? "✓ Both implementations agree." : "✗ Mismatch! Please report this as a bug.";
      status.className = "lab-status " + (match ? "ok" : "bad");
    }

    async function runSelfTest() {
      const list = $("selfTestList");
      list.textContent = "";
      const add = (ok, label) => {
        const li = doc.createElement("li");
        li.className = ok ? "pass" : "fail";
        li.textContent = label;
        list.appendChild(li);
      };

      for (const v of sha.TEST_VECTORS) {
        add(sha.sha256Hex(v.input) === v.hash, `SHA-256 ${v.label}`);
      }
      add(sha.sha256Hex("a".repeat(1000000)) === "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0",
        "SHA-256 one million × 'a' (NIST long message)");

      const header = btc.serializeHeader(g);
      add(btc.blockHashHex(header) === g.hash, "Genesis header → double SHA-256 → published block hash");
      const webHash = await webBlockHash(header).catch(() => null);
      add(webHash === g.hash, "Genesis block hash also matches WebCrypto");
      const searcher = btc.createNonceSearcher(header);
      add(sha.bytesToHex(searcher.digestFor(g.nonce)) === sha.bytesToHex(sha.doubleSha256(header)),
        "Fast midstate search path equals the plain double hash");
    }

    /* ---------- mining runs (shared single controller) ---------- */

    const { factory, info } = Ctl.createDefaultWorkerFactory(scope);
    let forceInline = false;
    const controller = new Ctl.MinerController({
      createWorker: () => (forceInline
        ? (info.mode = "main-thread", Ctl.createInlineWorker((post) => btc.createMinerSession(post)))
        : factory()),
    });

    const panels = {
      genesis: { start: $("genesisStart"), cancel: $("genesisCancel"), bar: $("genesisProgress"), stats: $("genesisStats"), result: $("genesisResult") },
      practice: { start: $("practiceStart"), cancel: $("practiceCancel"), bar: $("practiceProgress"), stats: $("practiceStats"), result: $("practiceResult") },
    };

    function setRunning(name, running) {
      Object.entries(panels).forEach(([key, p]) => {
        p.start.disabled = running;
        p.cancel.disabled = !(running && key === name);
      });
    }

    function showMode() {
      $("labRunMode").textContent = info.mode === "worker"
        ? "Hashing runs in a background Web Worker, so the page stays responsive and Cancel works instantly."
        : "Web Workers are unavailable here, so hashing runs on the main thread in short slices. Cancel still works, but the page may feel slower.";
    }

    async function run(name, { header, target, startNonce, maxNonces, expectedNonce, label }) {
      const p = panels[name];
      setRunning(name, true);
      p.result.className = "lab-status";
      p.result.textContent = `Mining ${label}…`;
      p.bar.value = 0;

      const job = {
        headerHex: sha.bytesToHex(header),
        targetHex: sha.bytesToHex(target),
        startNonce,
        maxNonces,
        chunk: 20000,
      };

      let sawProgress = false;
      const onProgress = (m) => {
        sawProgress = true;
        p.bar.value = Math.min(100, (m.hashes / maxNonces) * 100);
        p.stats.textContent = `${fmt(m.hashes)} hashes · nonce ${fmt(m.nonce)} · ${fmt(m.hps)} H/s`;
      };

      let result = await controller.start(job, onProgress);
      if (result.status === "error" && info.mode === "worker" && !sawProgress && !forceInline) {
        forceInline = true; // worker script failed to load: retry once on the main thread
        result = await controller.start(job, onProgress);
      }
      showMode();

      const seconds = ((result.elapsedMs || 0) / 1000).toFixed(2);
      if (result.status === "found") {
        const found = { ...header_fields(header), nonce: result.nonce };
        const rebuilt = btc.serializeHeader(found);
        const local = btc.blockHashHex(rebuilt);
        const web = await webBlockHash(rebuilt).catch(() => null);
        const checks = [
          local === result.hash ? null : "worker and page disagree",
          web === null ? "WebCrypto check unavailable" : web === result.hash ? null : "WebCrypto disagrees",
          btc.hashMeetsTarget(rev(sha.hexToBytes(result.hash)), target) ? null : "target not met",
          expectedNonce !== undefined && result.nonce !== expectedNonce ? "unexpected nonce" : null,
        ].filter(Boolean);
        const ok = checks.length === 0;
        p.bar.value = 100;
        p.result.className = "lab-status " + (ok ? "ok" : "bad");
        p.result.textContent =
          `${ok ? "✓ Found" : "✗ Check failed (" + checks.join("; ") + ")"} nonce ${fmt(result.nonce)} after ${fmt(result.hashes)} hashes in ${seconds}s. ` +
          `Hash ${result.hash}` +
          (ok ? ". Independently verified with WebCrypto." : ".");
        if (name === "genesis" && ok) {
          p.result.textContent += ` This is Bitcoin's real Genesis nonce, and the hash matches block 0.`;
        }
      } else if (result.status === "cancelled") {
        p.result.className = "lab-status";
        p.result.textContent = `Cancelled after ${fmt(result.hashes || 0)} hashes${result.forced ? " (worker stopped)" : ""}. Nothing was lost; start again any time.`;
      } else if (result.status === "exhausted") {
        p.result.className = "lab-status";
        p.result.textContent = `Searched ${fmt(result.hashes)} nonces without a hit. Try a different range or target.`;
      } else {
        p.result.className = "lab-status bad";
        p.result.textContent = `Mining failed: ${result.message || "unknown error"}`;
      }
      setRunning(name, false);
    }

    function header_fields(header) {
      // Re-use Genesis metadata; only the nonce differs between attempts.
      return { version: g.version, prevHash: g.prevHash, merkleRoot: g.merkleRoot, time: g.time, bits: g.bits };
    }

    function startGenesis() {
      if (controller.busy) return;
      const head = Number($("genesisHead").value);
      if (!Number.isInteger(head) || head < 1 || head > 100000000) return;
      const header = btc.serializeHeader({ ...g, nonce: 0 });
      return run("genesis", {
        header,
        target: genesisTarget,
        startNonce: g.nonce - head,
        maxNonces: head + 1000,
        expectedNonce: g.nonce,
        label: "Genesis block",
      });
    }

    function readBits() {
      const raw = $("practiceBits").value.trim();
      const n = Number(raw);
      if (!/^\d+$/.test(raw) || n < 1 || n > 40) return null;
      return n;
    }

    function updatePracticeExpect() {
      const bits = readBits();
      $("practiceExpect").textContent = bits === null
        ? "Enter a whole number from 1 to 40."
        : `Expect about ${fmt(Math.pow(2, bits))} hashes on average (2^${bits}); luck varies a lot.`;
    }

    function startPractice() {
      if (controller.busy) return;
      const bits = readBits();
      if (bits === null) {
        panels.practice.result.className = "lab-status bad";
        panels.practice.result.textContent = "Enter a whole number of zero bits from 1 to 40.";
        return;
      }
      const header = btc.serializeHeader({ ...g, nonce: 0 });
      return run("practice", {
        header,
        target: btc.targetFromZeroBits(bits),
        startNonce: 0,
        maxNonces: btc.MAX_NONCE,
        label: `a ${bits}-bit target`,
      });
    }

    /* ---------- wiring ---------- */

    $("shaInput").addEventListener("input", updateSha);
    $("shaSelfTest").addEventListener("click", runSelfTest);
    $("practiceBits").addEventListener("input", updatePracticeExpect);
    panels.genesis.start.addEventListener("click", startGenesis);
    panels.genesis.cancel.addEventListener("click", () => controller.cancel());
    panels.practice.start.addEventListener("click", startPractice);
    panels.practice.cancel.addEventListener("click", () => controller.cancel());
    if (scope.addEventListener) scope.addEventListener("pagehide", () => controller.dispose());

    updateSha();
    updatePracticeExpect();
    $("labRunMode").textContent = typeof scope.Worker === "function"
      ? "Hashing will run in a background Web Worker so the page stays responsive."
      : "Web Workers are unavailable here; hashing will run on the main thread in short slices.";

    return { controller, startGenesis, startPractice, runSelfTest, updateSha };
  }

  const api = { init };
  root.TetroHashMiningLab = api;

  if (typeof document !== "undefined" && typeof window !== "undefined") {
    const boot = () => {
      try {
        api.instance = init(document, window);
      } catch (error) {
        console.error("Mining Lab failed to start:", error);
      }
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})(typeof self !== "undefined" ? self : this);
