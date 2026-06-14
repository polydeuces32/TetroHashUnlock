#!/usr/bin/env bash
# Sets up nexu-io/open-design as a local design tool for TetroHashUnlock.
#
# Open Design is a local-first, agent-native design app used to generate UI
# prototypes (landing pages, dashboards, game HUDs, etc). It is cloned as a
# sibling directory next to this repo so it stays out of TetroHashUnlock's
# git history.
#
# Usage:
#   scripts/setup-open-design.sh
#
# After it finishes:
#   cd ../open-design
#   pnpm tools-dev run web   # daemon + web UI in the foreground
# or, to wire it into Claude Code as an MCP server for this project:
#   pnpm tools-dev start web
#   node apps/daemon/bin/od.mjs mcp install claude

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$(dirname "$REPO_ROOT")/open-design"
REQUIRED_NODE_MAJOR=24
REQUIRED_PNPM="10.33.2"

echo "==> Target directory: $TARGET_DIR"

if [ -d "$TARGET_DIR/.git" ]; then
  echo "==> open-design already cloned, pulling latest..."
  git -C "$TARGET_DIR" pull --ff-only
else
  echo "==> Cloning nexu-io/open-design..."
  git clone --depth 1 https://github.com/nexu-io/open-design.git "$TARGET_DIR"
fi

# Open Design requires Node ~24 and pnpm 10.33.x (see open-design/QUICKSTART.md).
node_major="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
if [ "$node_major" -lt "$REQUIRED_NODE_MAJOR" ]; then
  if [ -s "$HOME/.nvm/nvm.sh" ] || [ -s "/opt/nvm/nvm.sh" ]; then
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    [ -s "$NVM_DIR/nvm.sh" ] || NVM_DIR="/opt/nvm"
    # shellcheck disable=SC1091
    source "$NVM_DIR/nvm.sh"
    echo "==> Installing/selecting Node $REQUIRED_NODE_MAJOR via nvm..."
    nvm install "$REQUIRED_NODE_MAJOR"
    nvm use "$REQUIRED_NODE_MAJOR"
  else
    echo "==> WARNING: Node $REQUIRED_NODE_MAJOR is required (found $(node -v))." >&2
    echo "    Install nvm (https://github.com/nvm-sh/nvm) and re-run, or install Node $REQUIRED_NODE_MAJOR manually." >&2
    exit 1
  fi
fi

corepack enable >/dev/null 2>&1 || true

echo "==> Installing dependencies with pnpm $REQUIRED_PNPM (this can take a few minutes)..."
cd "$TARGET_DIR"
corepack pnpm install

cat <<EOF

==> open-design is ready at $TARGET_DIR

Next steps:
  cd $TARGET_DIR
  pnpm tools-dev run web        # start daemon + web UI in the foreground
  # or: pnpm tools-dev start web  (background) / pnpm tools-dev status / pnpm tools-dev stop

Optional: wire it into Claude Code as an MCP server for this project:
  node apps/daemon/bin/od.mjs mcp install claude
EOF
