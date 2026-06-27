# TetroHashUnlock

**Play Tetris. Learn Bitcoin. Have fun.**

[![Play now](https://img.shields.io/badge/play-live%20game-6ff7ff?style=for-the-badge)](https://polydeuces32.github.io/TetroHashUnlock/)

Free browser game — no wallet, no install. Clear rows, press Space to mine real SHA-256 hashes, and beat 15 levels.

**Live game:** [https://polydeuces32.github.io/TetroHashUnlock/](https://polydeuces32.github.io/TetroHashUnlock/)

## ICP migration status

The `icp-migration` branch now contains the first Internet Computer migration scaffold.

Current validated status:

- ICP local replica starts successfully.
- `tetrohash_backend` Motoko canister builds and deploys locally.
- `tetrohash_frontend` asset canister builds and deploys locally.
- Backend state recording works through `dfx canister call`.
- `record_play()` updates `get_play_stats()` correctly.
- Browser-to-canister play recording works from the ICP-hosted frontend on the local replica.

Validated local canisters:

```text
tetrohash_backend:  uxrrr-q7777-77774-qaaaq-cai
tetrohash_frontend: u6s2n-gx777-77774-qaaba-cai
```

Local ICP frontend:

```text
http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/
```

See [`ICP_MIGRATION.md`](./ICP_MIGRATION.md) for setup, validation, security notes, and next steps.

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

## Run locally as a static site

```bash
git clone https://github.com/polydeuces32/TetroHashUnlock.git
cd TetroHashUnlock
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

## Run locally on ICP

```bash
git clone https://github.com/polydeuces32/TetroHashUnlock.git
cd TetroHashUnlock
git checkout icp-migration

dfx start --background --clean
dfx deploy
```

Test backend state:

```bash
dfx canister call tetrohash_backend get_play_stats
dfx canister call tetrohash_backend record_play
dfx canister call tetrohash_backend get_play_stats
```

## Project layout

| File | Purpose |
|------|---------|
| `index.html` | Game page |
| `game.js` | Tetris + mining engine |
| `learning.js` | Hints and difficulty |
| `sound.js` | Sound effects |
| `styles.css` | UI styling |
| `dfx.json` | ICP canister configuration |
| `src/tetrohash_backend/main.mo` | Motoko backend canister |
| `icp-config.js` | Local/mainnet backend canister runtime config |
| `icp.js` | Browser-side ICP backend bridge |
| `ICP_MIGRATION.md` | Migration guide and validation log |

## Deploy

GitHub Pages serves the `tetrohash-deep-rebuild` branch from the repo root. Pushes to that branch auto-deploy the live static game.

The `icp-migration` branch is for ICP local deployment and future mainnet deployment.

---

MIT License · Giancarlo Vizhnay
