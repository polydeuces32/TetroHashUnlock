// Shared stub-DOM harness: runs the real game scripts inside a Node vm.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

function makeEl(id) {
  const listeners = {};
  let text = "";
  const el = {
    id, className: "", style: {}, dataset: {}, children: [], disabled: false, value: "",
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    appendChild(c) { this.children.push(c); return c; },
    scrollIntoView() {}, focus() {}, setPointerCapture() {},
    attrs: {},
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    emit(type, extra = {}) { (listeners[type] || []).forEach((fn) => fn({ preventDefault() {}, ...extra })); },
    listeners,
  };
  // Like the DOM: assigning textContent replaces all children.
  Object.defineProperty(el, "textContent", {
    get: () => text,
    set: (v) => { text = String(v); el.children = []; },
  });
  return el;
}

function makeCtx(log) {
  const noop = () => {};
  return new Proxy({}, {
    get(t, k) {
      if (k === "measureText") return (s) => ({ width: String(s).length * 6 });
      if (k === "fillText") return (text, x, y) => { log.texts.push(String(text)); };
      if (k === "fillRect") return (...a) => { log.rects.push(a); };
      if (k === "drawImage") return (...a) => { log.images += 1; log.imageArgs.push(a.slice(1)); };
      if (k === "createLinearGradient") return () => { log.gradients += 1; return { addColorStop: noop }; };
      if (k === "setTransform") return (...a) => { log.transforms.push(a); };
      if (k === "createLinearGradient" || k === "createRadialGradient") return () => ({ addColorStop: noop });
      return k in t ? t[k] : noop;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

// opts: storage (initial), withPointer (define PointerEvent), buttons [{control}]
function boot({ storage = {}, withPointer = false, buttons = [], dpr, reduced = false } = {}) {
  const draws = { texts: [], rects: [], transforms: [], images: 0, imageArgs: [], gradients: 0, offscreen: 0 };
  const html = read("index.html");
  const els = {};
  for (const m of html.matchAll(/id="([A-Za-z]+)"/g)) els[m[1]] = makeEl(m[1]);
  els.gameCanvas.getContext = () => makeCtx(draws);

  const store = { ...storage };
  const localStorage = {
    getItem: (k) => (Object.hasOwn(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const docListeners = {};
  const winListeners = {};
  const btnEls = buttons.map((control) => { const b = makeEl("btn-" + control); b.dataset.control = control; return b; });
  const document = {
    readyState: "complete",
    visibilityState: "visible",
    getElementById: (id) => els[id] || null,
    createElement: (tag) => {
      const el = makeEl(tag);
      if (tag === "canvas") { el.getContext = () => makeCtx(draws); draws.offscreen += 1; }
      return el;
    },
    querySelectorAll: (sel) => (sel === "[data-control]" ? btnEls : []),
    addEventListener(type, fn) { (docListeners[type] ||= []).push(fn); },
  };
  const rafQueue = [];
  const window = {
    localStorage, crypto: crypto.webcrypto, document,
    addEventListener(type, fn) { (winListeners[type] ||= []).push(fn); },
    setTimeout, clearTimeout,
  };
  if (withPointer) window.PointerEvent = function PointerEvent() {};
  if (dpr !== undefined) window.devicePixelRatio = dpr;
  window.matchMedia = (q) => ({ matches: reduced && /reduce/.test(q) });
  const ctx = vm.createContext({
    window, document, localStorage, console, crypto: crypto.webcrypto, TextEncoder, Date, Math, Promise,
    setTimeout, clearTimeout, setInterval, clearInterval,
    requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
    cancelAnimationFrame() {},
  });
  window.window = window;
  ctx.self = window;
  for (const f of ["learning.js", "engine.js", "progress.js", "progress-ui.js", "sound.js", "game.js"]) {
    vm.runInContext(read(f), ctx, { filename: f });
  }
  const run = (code) => vm.runInContext(code, ctx);
  const key = (k, code, extra = {}) => {
    const ev = { key: k, code: code || k, prevented: false, preventDefault() { this.prevented = true; }, ...extra };
    (docListeners.keydown || []).forEach((fn) => fn(ev));
    return ev.prevented;
  };
  const click = (id) => els[id].emit("click", { detail: 1 });
  const fireWindow = (type) => (winListeners[type] || []).forEach((fn) => fn({}));
  const setVisibility = (v) => { document.visibilityState = v; (docListeners.visibilitychange || []).forEach((fn) => fn({})); };
  const clearDraws = () => { draws.texts.length = 0; draws.rects.length = 0; draws.transforms.length = 0; draws.images = 0; draws.imageArgs.length = 0; draws.gradients = 0; };
  const progressOf = () => JSON.parse(store["tetrohash_progress_v2"] || "null");
  return { run, key, click, els, store, rafQueue, fireWindow, btnEls, progressOf, draws, clearDraws, setVisibility };
}

// Mine one real block via the game's own code path with a deterministic hash.
async function mineBlock(g) {
  g.run("state.linesSinceMine = 99; enterMiningPuzzle(); sha256Hex = async () => '00' + 'f'.repeat(62);");
  g.key(" ", "Space");
  while (g.run("state.miningBusy")) await new Promise((r) => setTimeout(r, 1));
}

module.exports = { boot, mineBlock, read, makeEl };
