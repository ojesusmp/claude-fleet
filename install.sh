#!/usr/bin/env bash
# claude-fleet installer (Linux / macOS). Usage: ./install.sh [--dry-run]
# Same setup on every machine — no profiles.
set -euo pipefail

EXTRA=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) EXTRA+=("--dry-run") ;;
    *) echo "unknown arg: $arg (only --dry-run supported)"; exit 1 ;;
  esac
done

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "[claude-fleet] installing"

command -v node >/dev/null 2>&1 || { echo "ERROR: Node 18+ required"; exit 1; }
command -v git  >/dev/null 2>&1 || { echo "ERROR: git required"; exit 1; }
command -v claude >/dev/null 2>&1 || echo "[claude-fleet][warn] 'claude' CLI not found — MCP registration will be skipped."

# Claude Code runs the statusline command and hooks in a non-interactive shell
# that does NOT source your rc file. For nvm users, nvm's node dir is added in
# ~/.zshrc, so it's absent there and bare `node` fails (exit 127) — which breaks
# the HUD statusline and any node-based hook. If node is nvm-managed, drop a
# resolver shim into ~/.local/bin (on PATH for those shells) so they find node.
# It never shadows your interactive node: nvm prepends its own dir ahead of
# ~/.local/bin when your rc file loads.
ensure_node_shim() {
  local node_path bindir shim
  node_path="$(command -v node 2>/dev/null || true)"
  case "$node_path" in
    "$HOME"/.nvm/*) : ;;                 # nvm-managed — needs the shim
    *) return 0 ;;                        # system/homebrew node — already on PATH
  esac
  bindir="$HOME/.local/bin"
  shim="$bindir/node"
  mkdir -p "$bindir"
  if [ -e "$shim" ] && ! grep -q "fleet node shim" "$shim" 2>/dev/null; then
    echo "[claude-fleet][warn] $shim exists and is not the fleet shim; leaving it untouched."
    return 0
  fi
  cat > "$shim" <<'SHIM'
#!/bin/sh
# fleet node shim: resolve nvm's node for shells that don't source your rc file
# (Claude Code statusline + hooks). Picks the highest installed nvm version so
# it survives node upgrades. Never shadows your interactive nvm node, because
# nvm prepends its dir ahead of ~/.local/bin when your rc file loads.
NVM_NODES="$HOME/.nvm/versions/node"
if [ -d "$NVM_NODES" ]; then
  latest=$(ls -1 "$NVM_NODES" 2>/dev/null | grep '^v' | sort -V | tail -1)
  if [ -n "$latest" ] && [ -x "$NVM_NODES/$latest/bin/node" ]; then
    exec "$NVM_NODES/$latest/bin/node" "$@"
  fi
fi
for candidate in /opt/homebrew/bin/node /usr/local/bin/node; do
  [ -x "$candidate" ] && exec "$candidate" "$@"
done
echo "fleet node shim: no node runtime found" >&2
exit 127
SHIM
  chmod +x "$shim"
  echo "[claude-fleet] installed node shim -> $shim (so Claude Code statusline/hooks find nvm's node)"
  case ":$PATH:" in
    *":$bindir:"*) : ;;
    *) echo "[claude-fleet][warn] $bindir is not on PATH; add it so the shim is found." ;;
  esac
}
ensure_node_shim

node "$DIR/scripts/apply.mjs" "${EXTRA[@]+"${EXTRA[@]}"}"

echo "[claude-fleet] done. Restart Claude Code (or your SSH session's claude) to load."
