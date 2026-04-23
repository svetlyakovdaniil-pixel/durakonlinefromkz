#!/bin/bash
# post-deploy.sh — Restore static assets from persistent storage after each deploy.
#
# Layout:
#   /root/static_assets/          → top-level files  → served at /assets/static/
#   /root/static_assets/cards/    → card/table images → served at /assets/cards/
#
# This script must be run from /root/app after `pnpm run build`.

set -e

PERSISTENT_DIR="/root/static_assets"
DIST_DIR="/root/app/dist/public/assets"

if [ ! -d "$PERSISTENT_DIR" ]; then
  echo "[post-deploy] WARNING: $PERSISTENT_DIR not found — skipping asset restore"
  exit 0
fi

echo "[post-deploy] Restoring static assets from $PERSISTENT_DIR..."

# ── 1. Restore top-level files → /assets/static/ ──────────────────────────────
STATIC_DEST="$DIST_DIR/static"
mkdir -p "$STATIC_DEST"
TOP_COUNT=0
for f in "$PERSISTENT_DIR"/*; do
  [ -f "$f" ] || continue   # skip directories
  dest="$STATIC_DEST/$(basename "$f")"
  if [ ! -f "$dest" ]; then
    cp "$f" "$dest"
    TOP_COUNT=$((TOP_COUNT + 1))
  fi
done
echo "[post-deploy] Restored $TOP_COUNT top-level assets → $STATIC_DEST"

# ── 2. Restore subdirectories → /assets/{subdir}/ ─────────────────────────────
# e.g. /root/static_assets/cards/ → /assets/cards/
for subdir in "$PERSISTENT_DIR"/*/; do
  [ -d "$subdir" ] || continue
  NAME=$(basename "$subdir")
  DEST="$DIST_DIR/$NAME"
  mkdir -p "$DEST"
  SUB_COUNT=0
  for f in "$subdir"*; do
    [ -f "$f" ] || continue
    dest="$DEST/$(basename "$f")"
    if [ ! -f "$dest" ]; then
      cp "$f" "$dest"
      SUB_COUNT=$((SUB_COUNT + 1))
    fi
  done
  echo "[post-deploy] Restored $SUB_COUNT assets from $subdir → $DEST"
done

echo "[post-deploy] Done."
