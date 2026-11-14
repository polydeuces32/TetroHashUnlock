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
| `engine.js` | Pure gameplay logic: scoring, board rules, high scores (unit-tested) |
| `game.js` | Rendering, input, game loop |
| `learning.js` | Hints and difficulty |
| `sound.js` | Sound effects |
| `styles.css` | UI styling |

## Tests

```bash
node scripts/test_engine.js    # engine unit tests
node scripts/test_unified.js   # file/structure checks
node scripts/test_mining.js    # SHA-256, Bitcoin header math, cancellable miner
node scripts/test_mining_ui.js # Mining Lab UI (stub DOM)
node scripts/test_game_integration.js
```

## Mining Lab

The **Mining Lab** section hashes real 80-byte Bitcoin block headers with double SHA-256 in a cancellable Web Worker: verify SHA-256 against WebCrypto, re-mine Bitcoin's Genesis block, or practise on a target you choose. It is educational only: it does not connect to the network, and the live network is about 10^14 times harder than Genesis. Files: `sha256.js`, `bitcoin.js`, `miner-controller.js`, `mining-worker.js`, `mining-lab.js`.

Mining here is an educational simulation: real SHA-256, but a tiny leading-zero target. It is not connected to the Bitcoin network.

## Deploy

GitHub Pages serves the `tetrohash-deep-rebuild` branch from the repo root. Pushes to that branch auto-deploy the live game.

---

MIT License · Giancarlo Vizhnay
