/*
 * MinerController: one-job-at-a-time, cancellable wrapper around a miner worker.
 *
 *   const miner = new MinerController({ createWorker });
 *   const result = await miner.start(job, (progress) => {...});
 *   miner.cancel();        // cooperative first, hard terminate() after a grace period
 *
 * `createWorker()` must return { postMessage, terminate, onmessage, onerror }.
 * In the browser, createDefaultWorker() builds a real Web Worker and falls back to
 * an inline main-thread worker (same session code, chunked + yielding) when
 * Workers are unavailable (e.g. file:// pages). Everything is injectable, so the
 * lifecycle is unit-tested in Node without a browser.
 *
 * Results resolve (never reject) with { status, ... } where status is one of
 * found | exhausted | cancelled | error.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TetroHashMinerController = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const TERMINAL = new Set(["found", "exhausted", "cancelled", "error"]);

  class MinerController {
    constructor({ createWorker, cancelGraceMs = 400 } = {}) {
      if (typeof createWorker !== "function") throw new TypeError("createWorker is required");
      this.createWorker = createWorker;
      this.cancelGraceMs = cancelGraceMs;
      this.worker = null;
      this.job = null; // { jobId, resolve, onProgress, graceTimer }
      this.nextJobId = 1;
    }

    get busy() {
      return this.job !== null;
    }

    _ensureWorker() {
      if (this.worker) return this.worker;
      const worker = this.createWorker();
      worker.onmessage = (event) => this._onMessage(worker, event.data);
      worker.onerror = (event) => {
        const message = (event && (event.message || (event.error && event.error.message))) || "Worker failed";
        if (this.worker === worker) this._discardWorker();
        this._settle({ status: "error", message });
      };
      this.worker = worker;
      return worker;
    }

    _discardWorker() {
      if (!this.worker) return;
      try {
        this.worker.terminate();
      } catch {
        // already gone
      }
      this.worker = null;
    }

    _onMessage(worker, message) {
      if (worker !== this.worker || !message || !this.job) return; // stale worker
      if (message.jobId !== this.job.jobId) return; // stale job
      if (message.type === "progress") {
        if (this.job.onProgress) this.job.onProgress(message);
        return;
      }
      if (TERMINAL.has(message.type)) {
        const { type, jobId, ...rest } = message;
        this._settle({ status: type, ...rest });
      }
    }

    _settle(result) {
      const job = this.job;
      if (!job) return;
      this.job = null;
      if (job.graceTimer) clearTimeout(job.graceTimer);
      job.resolve(result);
    }

    // job: { headerHex, targetHex, startNonce, maxNonces, chunk? }
    start(job, onProgress) {
      if (this.job) return Promise.resolve({ status: "error", message: "A job is already running" });
      return new Promise((resolve) => {
        let worker;
        try {
          worker = this._ensureWorker();
        } catch (error) {
          resolve({ status: "error", message: error.message });
          return;
        }
        const jobId = this.nextJobId;
        this.nextJobId += 1;
        this.job = { jobId, resolve, onProgress, graceTimer: null };
        try {
          worker.postMessage({ type: "start", jobId, ...job });
        } catch (error) {
          this._discardWorker();
          this._settle({ status: "error", message: error.message });
        }
      });
    }

    // Cooperative cancel; if the worker does not acknowledge within the grace
    // period it is terminated outright (guaranteed stop) and recreated lazily.
    cancel() {
      const job = this.job;
      if (!job || job.graceTimer) return;
      try {
        this.worker.postMessage({ type: "cancel", jobId: job.jobId });
      } catch {
        // fall through to hard stop
      }
      job.graceTimer = setTimeout(() => {
        if (this.job !== job) return;
        this._discardWorker();
        this._settle({ status: "cancelled", forced: true });
      }, this.cancelGraceMs);
    }

    dispose() {
      if (this.job) {
        this._discardWorker();
        this._settle({ status: "cancelled", forced: true });
      }
      this._discardWorker();
    }
  }

  // Main-thread stand-in with the Worker interface, running the same session.
  function createInlineWorker(createSession) {
    const worker = { onmessage: null, onerror: null, dead: false };
    const session = createSession((message) => {
      if (!worker.dead && worker.onmessage) worker.onmessage({ data: message });
    });
    worker.postMessage = (message) => {
      if (!worker.dead) setTimeout(() => session.handle(message), 0);
    };
    worker.terminate = () => {
      worker.dead = true;
      session.kill();
    };
    return worker;
  }

  // Browser factory: real Worker if possible, else inline. `info.mode` reports which.
  function createDefaultWorkerFactory(scope, workerUrl = "./mining-worker.js") {
    const info = { mode: "unknown" };
    const factory = () => {
      if (typeof scope.Worker === "function") {
        try {
          const worker = new scope.Worker(workerUrl);
          info.mode = "worker";
          return worker;
        } catch {
          // e.g. file:// or CSP; fall through
        }
      }
      info.mode = "main-thread";
      return createInlineWorker((post) => scope.TetroHashBitcoin.createMinerSession(post));
    };
    return { factory, info };
  }

  return { MinerController, createInlineWorker, createDefaultWorkerFactory };
});
