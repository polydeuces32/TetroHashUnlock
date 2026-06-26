# TetroHashUnlock ICP Migration

## Goal

Move TetroHashUnlock from a static GitHub Pages browser game into an Internet Computer application.

The first ICP version keeps the current game frontend and adds a small backend canister for authenticated player actions.

## Current application

The existing project is a static browser game:

- `index.html` — game page
- `game.js` — Tetris and SHA-256 mining engine
- `learning.js` — educational hints and difficulty behavior
- `sound.js` — sound effects
- `styles.css` — UI styling

## ICP target architecture

```text
TetroHashUnlock ICP
├── tetrohash_frontend  # ICP asset canister hosting the game
└── tetrohash_backend   # Motoko backend canister for player state
```

## Phase 1 scope

Phase 1 proves the game can run from ICP and that the frontend can call a backend canister.

Implemented scaffold:

- `dfx.json`
- `src/tetrohash_backend/main.mo`

Backend methods:

- `whoami()` — returns caller principal
- `record_play()` — records an authenticated play event
- `get_total_plays()` — returns total recorded plays

## Local setup

Install the ICP SDK:

```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
dfx --version
```

Clone and switch to the migration branch:

```bash
git clone https://github.com/polydeuces32/TetroHashUnlock.git
cd TetroHashUnlock
git checkout icp-migration
```

Run locally:

```bash
dfx start --background --clean
dfx deploy
```

Open the frontend URL printed by `dfx deploy`.

## Backend test calls

```bash
dfx canister call tetrohash_backend whoami

dfx canister call tetrohash_backend get_total_plays

dfx canister call tetrohash_backend record_play

dfx canister call tetrohash_backend get_total_plays
```

`record_play()` rejects anonymous callers. Use an identity:

```bash
dfx identity use default
```

## Mainnet deployment

Only deploy to mainnet after local validation passes.

```bash
dfx deploy --network ic
```

You need cycles in your wallet/cycles ledger account before deploying to ICP mainnet.

## Next engineering steps

1. Replace local-only bonus sats storage with canister-backed player profiles.
2. Add Internet Identity login to the frontend.
3. Add score submission with anti-cheat validation.
4. Add stable player achievements.
5. Add leaderboard queries.
6. Add upgrade tests before storing valuable state.
7. Keep rewards simulated until reward logic, abuse prevention, and legal constraints are reviewed.

## Security notes

Do not add real Bitcoin, ckBTC, NFT, or token rewards until these controls exist:

- authenticated player identity
- score validation
- rate limiting
- replay protection
- reward caps
- audit logs
- upgrade-safe storage
- manual admin controls
- abuse monitoring

## Production readiness status

Current branch status: migration scaffold only.

Not production-ready yet for real rewards, payments, wallets, tokens, or financial value.
