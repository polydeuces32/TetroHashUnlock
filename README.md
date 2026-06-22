# TetroHashUnlock

**Play Tetris. Learn Bitcoin. Have fun.**

[![Play now](https://img.shields.io/badge/play-live%20game-6ff7ff?style=for-the-badge)](https://polydeuces32.github.io/TetroHashUnlock/)

Free browser game — no wallet, no install. Clear rows, press Space to mine real SHA-256 hashes, and beat 15 levels.

**Live game:** [https://polydeuces32.github.io/TetroHashUnlock/](https://polydeuces32.github.io/TetroHashUnlock/)

## How to play

1. Click **Start Game**
2. Clear rows with **← → ↑** (or touch buttons)
3. Press **Space** to mine when a row is cleared
4. Beat all **15 levels** to save **5 bonus sats** on your device

Bonus sats are for fun on your phone or computer — not real money yet.

## Controls

| Key | Action |
|-----|--------|
| ← / → | Move |
| ↓ | Soft drop |
| ↑ / R | Rotate |
| Space | Drop fast / mine |
| P | Pause |
| Esc | New game |

## Run locally

```bash
git clone https://github.com/polydeuces32/TetroHashUnlock.git
cd TetroHashUnlock
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

## Project layout

| File | Purpose |
|------|---------|
| `index.html` | Game page |
| `game.js` | Tetris + mining engine |
| `learning.js` | Hints and difficulty |
| `sound.js` | Sound effects |
| `styles.css` | UI styling |

## Deploy

GitHub Pages serves the `tetrohash-deep-rebuild` branch from the repo root. Pushes to that branch auto-deploy the live game.

---

MIT License · Giancarlo Vizhnay
