# Master Learning Loop — TetroHashUnlock

## Purpose

Continuously improve TetroHashUnlock through structured observation, validation, learning, and safe iteration.

## Core Loop

1. Observe gameplay behavior
2. Detect weak areas
3. Review Bitcoin and SHA-256 learning content
4. Review AI assistant suggestions
5. Identify bugs, unclear UX, weak explanations, or missing features
6. Propose improvements
7. Validate changes manually and with tests
8. Record lessons learned
9. Update documentation
10. Repeat

## Project Focus

TetroHashUnlock should improve in these areas:

- gameplay clarity
- Bitcoin education accuracy
- SHA-256 explanation quality
- puzzle difficulty balance
- AI assistant usefulness
- reward logic safety
- frontend performance
- backend reliability
- documentation quality

## Safety Rules

- Do not auto-modify production code without human review.
- Do not claim Bitcoin rewards unless reward logic is actually implemented and verified.
- Do not store private keys, seed phrases, wallet secrets, or API keys in the repository.
- Do not merge changes until gameplay and learning behavior are tested.

## Output Format

Each loop cycle should produce:

- Observed issue
- Evidence
- Proposed fix
- Files affected
- Test steps
- Risk level
- Result
- Lesson learned

## Example Cycle

Observed issue:
The AI assistant gives unclear SHA-256 explanations.

Evidence:
User gets stuck after reading the explanation.

Proposed fix:
Add simpler explanation, visual example, and one practice prompt.

Files affected:
- learning.js
- index.html
- docs/loops/master-learning-loop.md

Test steps:
1. Open the game locally.
2. Trigger Learning Mode.
3. Read SHA-256 explanation.
4. Confirm the explanation is understandable without prior cryptography knowledge.

Risk level:
Low

Lesson learned:
Educational explanations should be short, visual, and tied directly to gameplay.

---

## Cycle 2026-06-21 — Adaptive Difficulty Wiring

### 1. Current State Assessment

- Playable 15-level campaign in `index.html` + `game.js` with real browser SHA-256 mining.
- Local in-game sats, achievements, and AI tutor are implemented; Lightning payouts remain disabled (`backend/reward.py`).
- `learning.js` computes adaptive difficulty and `fallInterval`, but gameplay barely used it (+45 ms trim only).
- Documentation drift: `README.md`, `docs/GAME_STATUS.md`, and `scripts/test_unified.js` still reference removed `tetrohash_unified.*` files; no `package.json` in repo.
- Backend `server.py` serves missing `tetrohash_unified.html`; `/api/game/submit` accepts unvalidated `sats_earned` (acceptable while rewards are local-only).

### 2. Ranked Findings (by impact)

| Rank | Finding | Impact area |
|------|---------|-------------|
| 1 | Adaptive tutor `fallInterval` ignored in `game.js` | Retention, learning |
| 2 | Stale README / test scripts vs `index.html` + `game.js` | Onboarding, maintainability |
| 3 | Backend index route points to non-existent HTML | Reliability |
| 4 | `updateDifficulty()` rewrites ~20 DOM nodes every animation frame | Performance |
| 5 | `/api/game/submit` has no anti-cheat validation | Safety (future Lightning) |
| 6 | README claims multiple game modes / controls that no longer exist | Education accuracy |
| 7 | `recordMove("hashAttempt")` not tracked in learning session | Tutor signal quality |

### 3. Highest-Leverage Fix

Wire `learning.getDifficultyProfile().fallInterval` into Tetris drop speed so struggling players receive tutor relief on hard campaign levels (e.g. boss at 525 ms campaign → up to 780 ms when difficulty drops to 1).

### 4. Files Affected

- `game.js` — adaptive fall interval + clearer learning signal text
- `docs/loops/master-learning-loop.md` — this cycle record

### 5. Implementation Plan

Use `Math.max(level.fallInterval, profile.fallInterval)` so campaign sets minimum speed and the tutor can only slow drops, never bypass level pacing for skilled players.

### 6. Validation Steps

1. Node simulation: struggling boss player 570 ms → 780 ms; skilled player unchanged at 415 ms.
2. Lint: no errors on `game.js`.
3. Manual: start game, make 8+ placement mistakes, confirm `signalAdapt` shows "Tutor relief" and pieces fall slower on later levels.

### 7. Risk Review

- **Low risk:** Skilled players still bound by campaign `fallInterval` (min of the two speeds).
- **No reward or security surface changed.**
- **Residual:** DOM-per-frame updates and doc drift remain for next cycles.

### 8. Lesson Learned

When the UI promises "Reducing pressure" / adaptive AI, the gameplay loop must consume the same signal the tutor computes — otherwise education and retention claims diverge from behavior.

### 9. Next Highest-Leverage Improvement

Refresh `README.md` and backend static route to match `index.html`, then throttle HUD DOM updates to state-change events only.

---

## Cycle 2026-06-21b — Frontend Source-of-Truth Alignment

### 1. Current State Assessment

- Cycle 1 fixed adaptive drop speed in `game.js`.
- Live frontend is `index.html` + `game.js`; GitHub Pages deploys repo root (`.github/workflows/pages.yml`).
- Entry-point docs and backend still pointed at removed `tetrohash_unified.*` assets.

### 2. Ranked Findings (by impact)

| Rank | Finding | Evidence | Impact area |
|------|---------|----------|-------------|
| 1 | Backend `/` serves missing file | `backend/server.py` L95 → `tetrohash_unified.html`; file absent from repo | Reliability |
| 2 | README describes removed modes/controls | `README.md` lists Normal/Puzzle/AI Battle modes, `M`/`A` keys, `python3 server.py` at root | Onboarding, education accuracy |
| 3 | Test script validates deleted files | `scripts/test_unified.js` required `tetrohash_unified.html/js`, `package.json` | Maintainability |
| 4 | `updateDifficulty()` rewrites DOM every frame | `game.js` `update()` calls `updateDifficulty()` each animation frame | Performance |
| 5 | `/api/game/submit` has no anti-cheat validation | `backend/server.py` accepts client `sats_earned` directly | Safety (future Lightning) |

**Shared root cause (ranks 1–3):** incomplete migration from `tetrohash_unified.*` to `index.html` + `game.js`.

### 3. Highest-Leverage Fix

Align backend static serving, README, and frontend test script with the actual GitHub Pages entry point (`index.html`).

### 4. Files Affected

- `backend/server.py` — serve `index.html` and whitelisted assets from repo root
- `README.md` — document current campaign, controls, and local dev paths
- `scripts/test_unified.js` — validate current frontend source of truth
- `docs/loops/master-learning-loop.md` — this cycle record

### 5. Implementation Plan

1. Set `ROOT_DIR` to repo root in Flask.
2. Serve `/` → `index.html`; whitelist `game.js`, `learning.js`, `sound.js`, `styles.css`, `assets/*`.
3. Rewrite README and test script to match `index.html` controls and 15-level campaign.

### 6. Validation Steps

1. `node scripts/test_unified.js` — all checks pass.
2. Flask test client — `GET /` returns HTML with `TetroHash Deep` and `gameCanvas`; assets return 200; non-whitelisted paths return 404.
3. Documentation mismatch resolved: README no longer references removed game modes.

### 7. Risk Review

- **Low risk:** Static whitelist prevents arbitrary file reads from repo root.
- **No gameplay or reward logic changed.**
- **Residual:** Historical docs under `docs/` still mention unified/modern filenames; performance and backend anti-cheat remain open.

### 8. Lesson Learned

When the frontend entry point moves, update runtime servers, README, and tests in the same cycle — otherwise onboarding and deployment docs lie about how to run the game.

### 9. Next Highest-Leverage Improvement

Throttle HUD DOM updates in `game.js` so `updateDifficulty()` runs on state changes, not every animation frame.
