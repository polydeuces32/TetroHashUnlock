/*
 * Dependency-free SHA-256 (FIPS 180-4) for the Mining Lab.
 *
 * Why this exists next to WebCrypto: the lab needs a SYNCHRONOUS hash it can call
 * millions of times per second inside a Web Worker, expose the compression
 * function for midstate reuse, and cross-check against crypto.subtle so the
 * user can see two independent implementations agree.
 *
 * Works in browsers (window/self/worker global TetroHashSha256) and Node (require).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TetroHashSha256 = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  const IV = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  const W = new Uint32Array(64); // scratch; the module is single-threaded per realm

  // Process one 64-byte block (16 big-endian words in `block`) into `state` (8 words).
  function compress(state, block) {
    for (let i = 0; i < 16; i += 1) W[i] = block[i];
    for (let i = 16; i < 64; i += 1) {
      const a = W[i - 15];
      const b = W[i - 2];
      const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
      const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }

    let a = state[0], b = state[1], c = state[2], d = state[3];
    let e = state[4], f = state[5], g = state[6], h = state[7];

    for (let i = 0; i < 64; i += 1) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + W[i]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }

    state[0] = (state[0] + a) | 0; state[1] = (state[1] + b) | 0;
    state[2] = (state[2] + c) | 0; state[3] = (state[3] + d) | 0;
    state[4] = (state[4] + e) | 0; state[5] = (state[5] + f) | 0;
    state[6] = (state[6] + g) | 0; state[7] = (state[7] + h) | 0;
  }

  function utf8(str) {
    return new TextEncoder().encode(str);
  }

  function toBytes(input) {
    if (typeof input === "string") return utf8(input);
    if (input instanceof Uint8Array) return input;
    throw new TypeError("sha256 input must be a string or Uint8Array");
  }

  function stateToBytes(state, out = new Uint8Array(32)) {
    for (let i = 0; i < 8; i += 1) {
      out[i * 4] = state[i] >>> 24;
      out[i * 4 + 1] = (state[i] >>> 16) & 255;
      out[i * 4 + 2] = (state[i] >>> 8) & 255;
      out[i * 4 + 3] = state[i] & 255;
    }
    return out;
  }

  // Full SHA-256 of a string (UTF-8) or Uint8Array -> 32-byte Uint8Array.
  function sha256(input) {
    const data = toBytes(input);
    const state = new Uint32Array(IV);
    const block = new Uint32Array(16);
    const total = data.length;
    const bitLenHi = Math.floor((total * 8) / 0x100000000);
    const bitLenLo = (total * 8) >>> 0;

    // Padded length: message + 0x80 + zeros + 8-byte length, multiple of 64.
    const padded = ((total + 9 + 63) >> 6) << 6;
    for (let offset = 0; offset < padded; offset += 64) {
      for (let w = 0; w < 16; w += 1) {
        let word = 0;
        for (let b = 0; b < 4; b += 1) {
          const idx = offset + w * 4 + b;
          let byte = 0;
          if (idx < total) byte = data[idx];
          else if (idx === total) byte = 0x80;
          word = (word << 8) | byte;
        }
        block[w] = word >>> 0;
      }
      if (offset + 64 === padded) {
        block[14] = bitLenHi;
        block[15] = bitLenLo;
      }
      compress(state, block);
    }
    return stateToBytes(state);
  }

  const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));

  function bytesToHex(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i += 1) out += HEX[bytes[i]];
    return out;
  }

  function hexToBytes(hex) {
    if (typeof hex !== "string" || hex.length % 2 !== 0 || /[^0-9a-fA-F]/.test(hex)) {
      throw new TypeError("invalid hex string");
    }
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i += 1) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  function sha256Hex(input) {
    return bytesToHex(sha256(input));
  }

  // Bitcoin's hash: SHA-256 applied twice. Returns raw 32 bytes (wire order).
  function doubleSha256(input) {
    return sha256(sha256(input));
  }

  // NIST FIPS 180-4 / CAVP known-answer vectors.
  const TEST_VECTORS = [
    { label: 'empty string ""', input: "", hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
    { label: '"abc" (NIST one-block)', input: "abc", hash: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" },
    {
      label: "448-bit NIST two-block message",
      input: "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
      hash: "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
    },
    {
      label: '"The quick brown fox jumps over the lazy dog"',
      input: "The quick brown fox jumps over the lazy dog",
      hash: "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
    },
  ];

  return {
    IV,
    compress,
    sha256,
    sha256Hex,
    doubleSha256,
    stateToBytes,
    bytesToHex,
    hexToBytes,
    TEST_VECTORS,
  };
});
