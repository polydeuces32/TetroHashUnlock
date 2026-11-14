#!/usr/bin/env node
// Runs every JavaScript syntax check and every Node test suite, then prints one
// summary. Exit code is non-zero if anything fails. Used locally and by CI:
//   node scripts/run_tests.js
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SKIP = new Set(["node_modules", ".git"]);

function jsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (SKIP.has(e.name)) return [];
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "scripts" || dir === ROOT ? jsFiles(full) : [];
    return e.name.endsWith(".js") ? [full] : [];
  });
}

const files = jsFiles(ROOT).sort();
let failed = false;

console.log(`Syntax check (${files.length} files)`);
for (const f of files) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) {
    failed = true;
    console.log(`  FAIL ${path.relative(ROOT, f)}\n${r.stderr}`);
  }
}
if (!failed) console.log("  all files parse");

const suites = files.filter((f) => /scripts[\\/]test_[^\\/]+\.js$/.test(f));
let total = 0;
let passed = 0;
console.log(`\nTest suites (${suites.length})`);
for (const f of suites) {
  const name = path.basename(f);
  const r = spawnSync(process.execPath, [f], { encoding: "utf8", cwd: ROOT, timeout: 240000 });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  const m = out.match(/Passed: (\d+)\/(\d+)/);
  const ok = r.status === 0 && m && m[1] === m[2];
  if (m) { passed += Number(m[1]); total += Number(m[2]); }
  console.log(`  ${ok ? "ok  " : "FAIL"} ${name.padEnd(28)} ${m ? `${m[1]}/${m[2]}` : "no result line"}`);
  if (!ok) {
    failed = true;
    console.log(out.split("\n").filter((l) => /^FAIL|Error|\s{5}/.test(l)).slice(0, 12).join("\n"));
  }
}

console.log(`\nTotal: ${passed}/${total}${failed ? "  (FAILURES)" : ""}`);
process.exit(failed ? 1 : 0);
