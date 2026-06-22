#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

console.log("TetroHashUnlock Frontend Test");
console.log("=============================");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests += 1;
  if (condition) {
    console.log(`PASS ${message}`);
    passedTests += 1;
  } else {
    console.log(`FAIL ${message}`);
  }
}

const essentialFiles = [
  "index.html",
  "game.js",
  "learning.js",
  "sound.js",
  "styles.css",
  "README.md",
  "LICENSE",
];

console.log("\nFile existence");
essentialFiles.forEach((file) => {
  const filePath = path.join(ROOT, file);
  assert(fs.existsSync(filePath), `${file} exists`);
});

console.log("\nHTML structure");
const htmlContent = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
[
  "<title>TetroHash",
  'id="gameCanvas"',
  'id="startGame"',
  'id="learningModeToggle"',
  'src="./learning.js?v=4"',
  'src="./game.js?v=4"',
].forEach((snippet) => assert(htmlContent.includes(snippet), `index.html contains: ${snippet}`));

console.log("\nJavaScript structure");
const gameContent = fs.readFileSync(path.join(ROOT, "game.js"), "utf8");
[
  "const LEVELS = [",
  "async function sha256Hex",
  "new window.TetroHashLearningEngine",
  "Math.max(level.fallInterval, profile.fallInterval)",
].forEach((snippet) => assert(gameContent.includes(snippet), `game.js contains: ${snippet}`));

const learningContent = fs.readFileSync(path.join(ROOT, "learning.js"), "utf8");
[
  "class TetroHashLearningEngine",
  "getDifficultyProfile",
  "getTutorMessage",
].forEach((snippet) => assert(learningContent.includes(snippet), `learning.js contains: ${snippet}`));

console.log("\nBackend entry point");
const serverContent = fs.readFileSync(path.join(ROOT, "backend/server.py"), "utf8");
assert(serverContent.includes("send_from_directory(ROOT_DIR, 'index.html')"), "server.py serves index.html");
assert(!serverContent.includes("tetrohash_unified.html"), "server.py no longer references tetrohash_unified.html");

console.log("\nREADME alignment");
const readmeContent = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
[
  "index.html",
  "15 levels",
  "bonus sats",
  "Space",
].forEach((snippet) => assert(readmeContent.includes(snippet), `README.md contains: ${snippet}`));
assert(!readmeContent.includes("Normal Mode"), "README.md no longer lists removed game modes");

console.log("\nResults");
console.log(`Passed: ${passedTests}/${totalTests}`);

if (passedTests !== totalTests) {
  process.exit(1);
}

console.log("\nFrontend source-of-truth checks passed.");
