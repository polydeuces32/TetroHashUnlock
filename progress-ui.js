/*
 * Progress panel rendering. Presentation only: takes a validated progress object
 * (see progress.js) and writes DOM through textContent / createElement, never HTML
 * strings. Testable with a stub document: node scripts/test_progress_ui.js
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TetroHashProgressUI = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const fmt = (n) => Number(n).toLocaleString("en-US");

  function el(doc, tag, text, className) {
    const node = doc.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function clear(node) {
    node.textContent = "";
  }

  function renderSummary(doc, node, Progress, progress) {
    clear(node);
    const sum = Progress.summary(progress);
    const st = progress.stats;
    [
      ["Levels cleared", `${sum.levelsCleared}/${sum.levelCount}`],
      ["Badges", `${sum.achievementsUnlocked}/${sum.achievementCount}`],
      ["Runs finished", fmt(st.runs)],
      ["Wins", fmt(st.wins)],
      ["Blocks mined", fmt(st.blocksMined)],
      ["Rows cleared", fmt(st.rowsCleared)],
      ["Hashes tried", fmt(st.hashAttempts)],
      ["Best score", fmt(st.bestScore)],
    ].forEach(([label, value]) => {
      const wrap = el(doc, "div");
      wrap.appendChild(el(doc, "dt", label));
      wrap.appendChild(el(doc, "dd", value));
      node.appendChild(wrap);
    });
  }

  function renderLevels(doc, body, Progress, progress, levels) {
    clear(body);
    levels.forEach((level, i) => {
      const l = progress.levels[i];
      const tr = el(doc, "tr", undefined, l.completions > 0 ? "cleared" : "");
      tr.appendChild(el(doc, "td", String(i + 1)));
      tr.appendChild(el(doc, "td", level.name + (level.boss ? " (boss)" : "")));
      tr.appendChild(el(doc, "td", l.completions > 0 ? `Cleared ×${l.completions}` : l.entered > 0 ? "Tried" : "Not played"));
      tr.appendChild(el(doc, "td", l.bestAttempts === null ? "–" : fmt(l.bestAttempts)));
      tr.appendChild(el(doc, "td", Progress.formatMs(l.fastestMs)));
      tr.appendChild(el(doc, "td", fmt(l.rows)));
      body.appendChild(tr);
    });
  }

  function renderBadges(doc, list, Progress, progress) {
    clear(list);
    Progress.ACHIEVEMENTS.forEach((def) => {
      const got = Object.hasOwn(progress.achievements, def.id);
      const li = el(doc, "li", undefined, got ? "badge unlocked" : "badge locked");
      li.appendChild(el(doc, "strong", `${got ? "✓" : "🔒"} ${def.name}`));
      li.appendChild(el(doc, "span", def.desc));
      li.appendChild(el(doc, "span", got ? " (unlocked)" : " (locked)", "sr-only"));
      list.appendChild(li);
    });
  }

  // targets: { summary, levelsBody, badges } DOM nodes (any may be null).
  function render(doc, Progress, progress, levels, targets) {
    if (targets.summary) renderSummary(doc, targets.summary, Progress, progress);
    if (targets.levelsBody) renderLevels(doc, targets.levelsBody, Progress, progress, levels);
    if (targets.badges) renderBadges(doc, targets.badges, Progress, progress);
  }

  return { render, renderSummary, renderLevels, renderBadges };
});
