# TetroHashUnlock ICP Migration

## Goal

Move TetroHashUnlock from a static GitHub Pages browser game into an Internet Computer application.

The first ICP version keeps the current game frontend and adds a small backend canister for recorded player actions and future player state.

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
└── tetrohash_backend   # Motoko backend canister for play state
```

## Phase 1 scope

Phase 1 proves the game can run from ICP and that the project has a working backend canister.

Implemented scaffold:

- `dfx.json`
- `src/tetrohash_backend/main.mo`
- `icp-config.js`
- `icp.js`

Backend methods:

- `whoami()` — returns caller principal
- `record_play()` — records a play event
- `get_total_plays()` — returns total recorded plays
- `get_play_stats()` — returns total, anonymous, and authenticated play counts

## Current local validation status

Local validation passed on macOS using `dfx` version `0.32.0`.

Verified browser-to-canister status on the local replica:

- The ICP-hosted frontend loads from `http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/`.
- `refreshStats()` returns live play counts from the backend canister.
- `recordPlay()` successfully increments backend stats from the browser.
- The frontend uses `.localhost` host detection so the local replica path works from the canister origin.

Local canisters created:

```text
tetrohash_backend:  uxrrr-q7777-77774-qaaaq-cai
tetrohash_frontend: u6s2n-gx777-77774-qaaba-cai
```

Local frontend URL:

```text
http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/
```

Backend Candid interface:

```text
http://127.0.0.1:4943/?canisterId=uzt4z-lp777-77774-qaabq-cai&id=uxrrr-q7777-77774-qaaaq-cai
```

Successful backend validation:

```text
Initial stats:
  anonymousPlays = 0
  totalPlays = 0
  authenticatedPlays = 0

After `record_play` through dfx:
  anonymousPlays = 0
  totalPlays = 1
  authenticatedPlays = 1
```

## Local setup

Install the ICP SDK / CLI tooling:

```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
dfx --version
```

Note: current tooling prints a deprecation warning that `dfx` is deprecated in favor of `icp-cli`. This project currently uses `dfx` because the local migration was validated with `dfx 0.32.0`. Future CLI migration should be tracked separately.

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

## Frontend backend configuration

After `dfx deploy`, get the backend canister ID:

```bash
dfx canister id tetrohash_backend
```

Then update `icp-config.js`:

```js
window.TETROHASH_ICP_CONFIG = {
  backendCanisterId: "uxrrr-q7777-77774-qaaaq-cai",
  localHost: "http://127.0.0.1:4943",
};
```

Redeploy frontend assets after editing the config:

```bash
dfx deploy
```

## Backend test calls

```bash
dfx canister call tetrohash_backend whoami

dfx canister call tetrohash_backend get_total_plays

dfx canister call tetrohash_backend get_play_stats

dfx canister call tetrohash_backend record_play

dfx canister call tetrohash_backend get_play_stats
```

## Security warning for local identity

The default local identity is not appropriate for real ICP, cycles, ckBTC, tokens, wallets, or mainnet control.

For mainnet or anything valuable, create a secure identity:

```bash
dfx identity new secure-mainnet
dfx identity use secure-mainnet
```

Do not reuse any seed phrase that has appeared in logs, screenshots, chat, or shared output.

## Mainnet deployment

Only deploy to mainnet after local validation passes and a secure identity exists.

```bash
dfx deploy --network ic
```

You need cycles in your wallet/cycles ledger account before deploying to ICP mainnet.

## Next engineering steps

1. Verify browser-to-backend play recording from the ICP-hosted frontend.
2. Replace local-only bonus sats storage with canister-backed player profiles.
3. Add Internet Identity login to the frontend.
4. Add score submission with anti-cheat validation.
5. Add stable player achievements.
6. Add leaderboard queries.
7. Add upgrade tests before storing valuable state.
8. Keep rewards simulated until reward logic, abuse prevention, and legal constraints are reviewed.

## Self-improvement loop

The project should use a review loop, not uncontrolled auto-modification:

```text
observe gameplay and deployment behavior
↓
measure failures, scores, drop-off level, and canister call success
↓
record lessons in documentation
↓
propose improvements
↓
human reviews and approves
↓
ship small tested changes
```

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

Current branch status: local ICP deployment validated for frontend/backend canister creation and backend state recording.

Not production-ready yet for real rewards, payments, wallets, tokens, or financial value.
