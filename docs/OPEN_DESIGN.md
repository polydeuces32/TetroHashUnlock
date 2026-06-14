# Open Design (local design tool)

[Open Design](https://github.com/nexu-io/open-design) is a local-first,
agent-native design tool that generates UI prototypes (landing pages,
dashboards, HUDs, decks, images, video) from a text prompt. It's set up here
as a sibling project so it can be used to design and iterate on
TetroHashUnlock's UI (game board, HUD, landing page, learning panel, etc.)
without bloating this repo's history.

## Setup

```bash
scripts/setup-open-design.sh
```

This clones `nexu-io/open-design` into `../open-design` (next to this repo),
ensures Node 24 / pnpm 10.33.x (via `nvm` + `corepack` if needed), and runs
`pnpm install`.

## Running it

```bash
cd ../open-design
pnpm tools-dev run web   # daemon + web UI in the foreground, prints the URL
```

Open the printed URL, pick a skill (`web-prototype`, `dashboard`,
`saas-landing`, ...) and a design system, then describe the
TetroHashUnlock screen you want (e.g. "a Tetris HUD with a Bitcoin block
height counter and SHA-256 puzzle panel"). Generated artifacts are saved
under `../open-design/.od/artifacts/`.

Other lifecycle commands:

```bash
pnpm tools-dev start web   # run daemon + web in the background
pnpm tools-dev status      # check what's running
pnpm tools-dev stop         # stop everything
```

## Using it from Claude Code (MCP)

To let a coding agent pull files from Open Design projects directly:

```bash
cd ../open-design
node apps/daemon/bin/od.mjs mcp install claude
```

See [`open-design/README.md`](https://github.com/nexu-io/open-design#readme)
and `QUICKSTART.md` for the full feature set (skills, design systems,
plugins).
