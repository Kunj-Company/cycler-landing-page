#!/usr/bin/env bash
# Pull the aggregate tables (pageviews, visitors, events) from the remote D1 database
# `cycler-web-stats` into a local SQLite file for Metabase. `salts` and `seen` are never pulled.
#
# Usage: scripts/pull.sh [path/to/web-stats.sqlite]
#   or:  CYCLER_STATS_DB=path/to/file.sqlite scripts/pull.sh
# Default: ~/cycler-stats/web-stats.sqlite. Re-running replaces the file with a fresh copy.
#
# Needs: wrangler (run via npx, logged in) and sqlite3 (ships with macOS).
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-${CYCLER_STATS_DB:-$HOME/cycler-stats/web-stats.sqlite}}"
WRANGLER="${WRANGLER:-npx --yes wrangler@3}"
DB_NAME="cycler-web-stats"
TABLES=(pageviews visitors events)

command -v sqlite3 >/dev/null || { echo "sqlite3 not found" >&2; exit 1; }
mkdir -p "$(dirname "$OUT")"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for t in "${TABLES[@]}"; do
  echo "Exporting $t ..."
  $WRANGLER d1 export "$DB_NAME" --remote --config "$HERE/wrangler.toml" \
    --table "$t" --output "$TMP/$t.sql" >/dev/null
done

# Build the new file next to the target, then swap it in, so Metabase never sees a half-written file.
NEW="$OUT.new"
rm -f "$NEW"
for t in "${TABLES[@]}"; do
  sqlite3 "$NEW" < "$TMP/$t.sql"
done
mv -f "$NEW" "$OUT"

echo "Wrote $OUT"
for t in "${TABLES[@]}"; do
  printf '  %-10s %s rows\n' "$t" "$(sqlite3 "$OUT" "SELECT COUNT(*) FROM $t;")"
done
