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

node "$DIR/scripts/apply.mjs" "${EXTRA[@]+"${EXTRA[@]}"}"

echo "[claude-fleet] done. Restart Claude Code (or your SSH session's claude) to load."
