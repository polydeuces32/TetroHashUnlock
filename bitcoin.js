/*
 * Bitcoin block-header helpers + cancellable mining session (Mining Lab).
 *
 * This is REAL Bitcoin proof-of-work math on REAL header bytes (80-byte header,
 * double SHA-256, compact "bits" target). What it is NOT: a way to mine on the
 * live network. Today's network needs ~difficulty * 2^32 hashes per block
 * (hundreds of sextillions); a browser tab does ~10^5-10^6 hashes/second.
 * Use it to re-mine historical blocks and to practise on easy targets.
 *
 * Pure and DOM-free so it runs in a Web Worker, the main thread, and Node tests.
 * Depends on sha256.js (global TetroHashSha256 or require).
 */
(function (root, factory) {
  const sha = typeof module === "object" && module.exports
    ? require("./sha256.js")
    : root.TetroHashSha256;
  const api = factory(sha);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TetroHashBitcoin = api;
})(typeof self !== "undefined" ? self : this, function (sha) {
  "use strict";

  const HEADER_BYTES = 80;
  const NONCE_OFFSET = 76;
  const MAX_NONCE = 0xffffffff;

  // Bitcoin block 0. Published values; verified by tests (hash recomputed here).
  const GENESIS = Object.freeze({
    height: 0,
    version: 1,
    prevHash: "0".repeat(64),
    merkleRoot: "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
    time: 1231006505,
    bits: 0x1d00ffff,
    nonce: 2083236893,
    hash: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
  });

  /* Static snapshot for explanatory text only. NOT live data. */
  const NETWORK_SNAPSHOT = Object.freeze({
    asOf: "2026-11-13",
    height: 975723,
    difficulty: 148364561003867.4,
    sources: ["https://mempool.space/api/v1/blocks"],
  });

  function reverseBytes(bytes) {
    return Uint8Array.from(bytes).reverse();
  }

  function writeU32LE(buf, offset, value) {
    buf[offset] = value & 255;
    buf[offset + 1] = (value >>> 8) & 255;
    buf[offset + 2] = (value >>> 16) & 255;
    buf[offset + 3] = (value >>> 24) & 255;
  }

  function assertU32(name, value) {
    if (!Number.isInteger(value) || value < 0 || value > MAX_NONCE) {
      throw new RangeError(`${name} must be an integer 0..2^32-1`);
    }
  }

  function hash32(name, hex) {
    const bytes = sha.hexToBytes(hex);
    if (bytes.length !== 32) throw new RangeError(`${name} must be 32 bytes (64 hex chars)`);
    return bytes;
  }

  // Hash strings are in Bitcoin's DISPLAY order (big-endian); the wire reverses them.
  function serializeHeader({ version, prevHash, merkleRoot, time, bits, nonce }) {
    if (!Number.isInteger(version) || version < -0x80000000 || version > MAX_NONCE) {
      throw new RangeError("version must be a 32-bit integer");
    }
    assertU32("time", time);
    assertU32("bits", bits);
    assertU32("nonce", nonce);
    const prev = hash32("prevHash", prevHash);
    const merkle = hash32("merkleRoot", merkleRoot);

    const out = new Uint8Array(HEADER_BYTES);
    writeU32LE(out, 0, version >>> 0);
    out.set(reverseBytes(prev), 4);
    out.set(reverseBytes(merkle), 36);
    writeU32LE(out, 68, time);
    writeU32LE(out, 72, bits);
    writeU32LE(out, 76, nonce);
    return out;
  }

  // Block hash in display order (what explorers show: leading zeros first).
  function blockHashHex(header80) {
    if (header80.length !== HEADER_BYTES) throw new RangeError("header must be 80 bytes");
    return sha.bytesToHex(reverseBytes(sha.doubleSha256(header80)));
  }

  /* ---------- targets ---------- */

  // Compact "bits" -> 32-byte big-endian target. Throws on invalid encodings
  // (negative flag, zero mantissa, overflow beyond 256 bits).
  function bitsToTarget(bits) {
    assertU32("bits", bits);
    const exponent = bits >>> 24;
    const mantissa = bits & 0x7fffff;
    if (bits & 0x800000) throw new RangeError("negative compact target");
    if (mantissa === 0) throw new RangeError("zero target");
    const out = new Uint8Array(32);
    for (let i = 0; i < 3; i += 1) {
      const byte = (mantissa >>> (16 - 8 * i)) & 255;
      const pos = 32 - exponent + i;
      if (byte !== 0 && (pos < 0 || pos > 31)) throw new RangeError("target overflow");
      if (pos >= 0 && pos < 32) out[pos] = byte;
    }
    return out;
  }

  // Easiest-to-explain target: `zeroBits` leading zero bits, then all ones.
  function targetFromZeroBits(zeroBits) {
    if (!Number.isInteger(zeroBits) || zeroBits < 0 || zeroBits > 64) {
      throw new RangeError("zeroBits must be an integer 0..64");
    }
    const out = new Uint8Array(32).fill(255);
    for (let bit = 0; bit < zeroBits; bit += 1) out[bit >> 3] &= ~(0x80 >> (bit & 7));
    return out;
  }

  // digest = raw double-SHA output (wire order). Bitcoin compares the REVERSED
  // digest, read as a 256-bit big-endian integer, with hash <= target.
  function hashMeetsTarget(digest, target) {
    for (let i = 0; i < 32; i += 1) {
      const h = digest[31 - i];
      const t = target[i];
      if (h < t) return true;
      if (h > t) return false;
    }
    return true;
  }

  function targetToBigInt(target) {
    return BigInt("0x" + sha.bytesToHex(target));
  }

  // difficulty = target(difficulty 1) / target. Returns a Number (approximate).
  function difficultyFromTarget(target) {
    const diff1 = targetToBigInt(bitsToTarget(0x1d00ffff));
    const t = targetToBigInt(target);
    if (t === 0n) return Infinity;
    return Number((diff1 * 1000000n) / t) / 1e6;
  }

  // Expected number of hashes to find one solution: 2^256 / (target + 1).
  function expectedHashes(target) {
    return Number((1n << 256n) / (targetToBigInt(target) + 1n));
  }

  /* ---------- fast nonce search (midstate) ---------- */

  function word(bytes, o) {
    return ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;
  }

  // The first 64 header bytes never change while the nonce varies, so compress
  // them once. Each attempt then costs 2 compressions (tail block + second hash).
  function createNonceSearcher(header80) {
    if (header80.length !== HEADER_BYTES) throw new RangeError("header must be 80 bytes");

    const mid = new Uint32Array(sha.IV);
    const first = new Uint32Array(16);
    for (let i = 0; i < 16; i += 1) first[i] = word(header80, i * 4);
    sha.compress(mid, first);

    // Tail block: header bytes 64..79, 0x80, zeros, bit length 640.
    const tail = new Uint32Array(16);
    for (let i = 0; i < 3; i += 1) tail[i] = word(header80, 64 + i * 4);
    tail[4] = 0x80000000;
    tail[15] = 640;

    // Second hash input: the 32-byte first digest, 0x80, zeros, bit length 256.
    const second = new Uint32Array(16);
    second[8] = 0x80000000;
    second[15] = 256;

    const s1 = new Uint32Array(8);
    const s2 = new Uint32Array(8);
    const digest = new Uint8Array(32);

    // Raw double-SHA digest (wire order) for `nonce`. Returns an internal buffer
    // that is overwritten by the next call: copy it if you need to keep it.
    function digestFor(nonce) {
      // Header nonce bytes are little-endian; the tail word is read big-endian.
      tail[3] = (((nonce & 255) << 24) | (((nonce >>> 8) & 255) << 16) | (((nonce >>> 16) & 255) << 8) | ((nonce >>> 24) & 255)) >>> 0;
      s1.set(mid);
      sha.compress(s1, tail);
      for (let i = 0; i < 8; i += 1) second[i] = s1[i];
      s2.set(sha.IV);
      sha.compress(s2, second);
      return sha.stateToBytes(s2, digest);
    }

    // Scan [start, start + count), clamped to 2^32-1. Returns
    // { found, nonce, digest, tried }; `tried` is the number of hashes performed.
    function scan(start, count, target) {
      assertU32("start", start);
      const end = Math.min(start + count - 1, MAX_NONCE);
      let tried = 0;
      for (let nonce = start; nonce <= end; nonce += 1) {
        tried += 1;
        const d = digestFor(nonce);
        if (hashMeetsTarget(d, target)) {
          return { found: true, nonce, digest: Uint8Array.from(d), tried };
        }
      }
      return { found: false, nonce: end, digest: null, tried };
    }

    return { digestFor, scan };
  }

  /* ---------- cancellable session (Worker or inline) ---------- */

  const defaultYield = () => new Promise((resolve) => setTimeout(resolve, 0));
  const defaultNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  // post(message) sends results out. handle(message) accepts commands:
  //   { type: "start", jobId, headerHex, targetHex, startNonce, maxNonces, chunk }
  //   { type: "cancel", jobId? }
  // Cancellation is cooperative: the loop yields to the event loop between chunks
  // so a "cancel" message can be processed. Worker.terminate() is the hard
  // fallback (see miner-controller.js).
  function createMinerSession(post, { yieldFn = defaultYield, now = defaultNow } = {}) {
    let activeJob = null;
    let dead = false;

    async function run(msg) {
      const { jobId } = msg;
      const job = { jobId, cancelled: false };
      activeJob = job;
      // Release the slot BEFORE posting a terminal message so a listener can
      // immediately start the next job (inline mode delivers synchronously).
      const finish = (message) => {
        if (activeJob === job) activeJob = null;
        post(message);
      };

      try {
        const header = sha.hexToBytes(msg.headerHex);
        const target = sha.hexToBytes(msg.targetHex);
        if (header.length !== HEADER_BYTES) throw new RangeError("header must be 80 bytes");
        if (target.length !== 32) throw new RangeError("target must be 32 bytes");
        assertU32("startNonce", msg.startNonce);

        const startNonce = msg.startNonce;
        const maxNonces = Math.min(Number(msg.maxNonces) || 0, MAX_NONCE - startNonce + 1);
        const chunk = Math.max(1, Math.min(Number(msg.chunk) || 20000, 1000000));
        if (!(maxNonces > 0)) throw new RangeError("maxNonces must be positive");

        const searcher = createNonceSearcher(header);
        const t0 = now();
        let hashes = 0;
        let cursor = startNonce;

        while (hashes < maxNonces) {
          if (job.cancelled || dead) {
            finish({ type: "cancelled", jobId, hashes, elapsedMs: now() - t0 });
            return;
          }
          const n = Math.min(chunk, maxNonces - hashes);
          const r = searcher.scan(cursor, n, target);
          hashes += r.tried;

          if (r.found) {
            finish({
              type: "found",
              jobId,
              nonce: r.nonce,
              hash: sha.bytesToHex(reverseBytes(r.digest)),
              hashes,
              elapsedMs: now() - t0,
            });
            return;
          }

          cursor = r.nonce + 1;
          const elapsedMs = now() - t0;
          post({
            type: "progress",
            jobId,
            hashes,
            nonce: r.nonce,
            elapsedMs,
            hps: elapsedMs > 0 ? Math.round((hashes / elapsedMs) * 1000) : 0,
          });

          if (cursor > MAX_NONCE) break;
          await yieldFn();
        }

        finish({ type: "exhausted", jobId, hashes, elapsedMs: now() - t0 });
      } catch (error) {
        finish({ type: "error", jobId, message: error && error.message ? error.message : String(error) });
      }
    }

    return {
      handle(msg) {
        if (dead || !msg || typeof msg !== "object") return;
        if (msg.type === "start") {
          if (activeJob) {
            post({ type: "error", jobId: msg.jobId, message: "A job is already running" });
            return;
          }
          run(msg);
        } else if (msg.type === "cancel") {
          if (activeJob && (msg.jobId === undefined || msg.jobId === activeJob.jobId)) {
            activeJob.cancelled = true;
          }
        }
      },
      // Inline (main-thread) fallback: stop everything silently.
      kill() {
        dead = true;
        if (activeJob) activeJob.cancelled = true;
      },
      isBusy() {
        return Boolean(activeJob);
      },
    };
  }

  return {
    HEADER_BYTES,
    NONCE_OFFSET,
    MAX_NONCE,
    GENESIS,
    NETWORK_SNAPSHOT,
    serializeHeader,
    blockHashHex,
    bitsToTarget,
    targetFromZeroBits,
    hashMeetsTarget,
    difficultyFromTarget,
    expectedHashes,
    createNonceSearcher,
    createMinerSession,
  };
});
