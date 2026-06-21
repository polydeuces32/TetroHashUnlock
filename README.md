# TetroHashUnlock

Bitcoin Tetris with real SHA-256 mining puzzles, a local AI tutor, and a 15-level campaign.

## Play Now

**Live game:** [https://polydeuces32.github.io/TetroHashUnlock/](https://polydeuces32.github.io/TetroHashUnlock/)

## What You Play

One unified campaign:

1. Clear transaction rows in Bitcoin Tetris.
2. Build block data from your run.
3. Mine real browser SHA-256 hashes until the prefix meets the target.
4. Chain blocks across 15 named Bitcoin missions.
5. Earn **5 in-game sats** when you complete the full chain.

In-game sats are stored locally. Real Lightning withdrawals are not live yet. See [docs/reward-system-status.md](docs/reward-system-status.md).

## Controls

| Input | Action |
|-------|--------|
| ← / → | Move block |
| ↓ | Soft drop |
| ↑ / R | Rotate |
| Space | Hard drop (Tetris) / mine hash batch (mining) |
| P | Pause / resume |
| Esc | Reset run |

Touch controls are available on mobile.

## Local Development

**Static frontend (recommended):**

```bash
# From the repo root
python3 -m http.server 8000
# Open http://localhost:8000/index.html
```

**Flask API + frontend:**

```bash
cd backend
pip install -r requirements.txt
python3 server.py
# Open http://localhost:5000/
```

## Project Layout

| Path | Purpose |
|------|---------|
| `index.html` | Main game page |
| `game.js` | Campaign engine, SHA-256 mining, rewards |
| `learning.js` | Adaptive AI tutor and player profile |
| `sound.js` | Web Audio feedback |
| `styles.css` | UI styling |
| `backend/server.py` | Optional REST API and leaderboard backend |

## Learning Loop

Quality audits and cycle notes live in [docs/loops/master-learning-loop.md](docs/loops/master-learning-loop.md).

---

MIT License · Created by Giancarlo Vizhnay
