#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-codex}"
APPLY=false
INSTALL_FLAGS=()

if [[ $# -gt 0 && "${1}" != -* ]]; then
  TARGET="$1"
  shift
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply)
      APPLY=true
      ;;
    *)
      INSTALL_FLAGS+=("$1")
      ;;
  esac
  shift
done

cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22+ is required."
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 22 ]]; then
  echo "Node.js 22+ is required. Current version: $(node -p "process.versions.node")" >&2
  exit 1
fi

HAS_DRY_RUN=false
for flag in "${INSTALL_FLAGS[@]}"; do
  if [[ "$flag" == "--dry-run" ]]; then
    HAS_DRY_RUN=true
  fi
done

if [[ "$APPLY" == false && "$HAS_DRY_RUN" == false ]]; then
  INSTALL_FLAGS+=("--dry-run")
fi

npm install
npm run build
node dist/cli.js install "$TARGET" "${INSTALL_FLAGS[@]}"
