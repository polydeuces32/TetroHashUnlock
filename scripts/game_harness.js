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
    scrollIntoView() {}, focus() {}, setAttribute() {}, setPointerCapture() {},
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

function makeCtx() {
  const noop = () => {};
  return new Proxy({}, {
    get(t, k) {
      if (k === "measureText") return (s) => ({ width: String(s).length * 6 });
      if (k === "createLinearGradient" || k === "createRadialGradient") return () => ({ addColorStop: noop });
      return k in t ? t[k] : noop;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

// opts: storage (initial), withPointer (define PointerEvent), buttons [{control}]
function boot({ storage = {}, withPointer = false, buttons = [] } = {}) {
  const html = read("index.html");
  const els = {};
  for (const m of html.matchAll(/id="([A-Za-z]+)"/g)) els[m[1]] = makeEl(m[1]);
  els.gameCanvas.getContext = () => makeCtx();

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
    getElementById: (id) => els[id] || null,
    createElement: (tag) => makeEl(tag),
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
  const progressOf = () => JSON.parse(store["tetrohash_progress_v2"] || "null");
  return { run, key, click, els, store, rafQueue, fireWindow, btnEls, progressOf };
}

// Mine one real block via the game's own code path with a deterministic hash.
async function mineBlock(g) {
  g.run("state.linesSinceMine = 99; enterMiningPuzzle(); sha256Hex = async () => '00' + 'f'.repeat(62);");
  g.key(" ", "Space");
  while (g.run("state.miningBusy")) await new Promise((r) => setTimeout(r, 1));
}

module.exports = { boot, mineBlock, read, makeEl };
