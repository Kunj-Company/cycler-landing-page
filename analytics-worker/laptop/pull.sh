#!/usr/bin/env bash
# Laptop exporter. Pulls the website visit counts (D1 database cycler-web-stats) into a local SQLite file
# for Metabase. Only the count tables are exported: pageviews, visitors, events.
# The salts and the visitor hashes (tables salts, seen) never leave Cloudflare.
#
#   ./pull.sh            # normal run (daily from the systemd timer)
#   FORCE=1 ./pull.sh    # accept a big drop in row count (e.g. after deleting data)
#
# Result: $OUT (default: the folder the Cycler Metabase container already mounts, so it
#         shows up there as /cycler/web-stats.db), replaced in one SQLite transaction,
#         plus gzipped dumps in ./backups (last 60 kept).
# Auth:   CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID from ./.env, else from the app
#         exporter's .env (~/cycler-stats-server/exporter/.env), else `wrangler login`.
#         The token needs Account > D1 > Edit (the export call needs it).
set -euo pipefail

DB_NAME="cycler-web-stats"
TABLES=(pageviews visitors events)
WRANGLER_VERSION="4.168.0"
KEEP_BACKUPS=60

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${OUT:-$HOME/cycler-stats-server/exporter/data/web-stats.db}"
BACKUPS="$HERE/backups"
LOCK="$HERE/.pull.lock"
mkdir -p "$BACKUPS" "$(dirname "$OUT")"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }

export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$HOME/.local/bin"
for bin in sqlite3 gzip npx; do command -v "$bin" >/dev/null 2>&1 || die "$bin not found in PATH"; done

if ! mkdir "$LOCK" 2>/dev/null; then
  OTHER="$(cat "$LOCK/pid" 2>/dev/null || true)"
  if [ -n "$OTHER" ] && kill -0 "$OTHER" 2>/dev/null; then die "another pull is running (pid $OTHER)"; fi
  rm -rf "$LOCK"; mkdir "$LOCK" || die "could not take lock"
fi
echo $$ > "$LOCK/pid"
WORK="$(mktemp -d "$HERE/.pull.XXXXXX")"
trap 'rm -rf "$WORK" "$LOCK"' EXIT INT TERM

for envf in "$HERE/.env" "$HOME/cycler-stats-server/exporter/.env"; do
  if [ -f "$envf" ] && grep -q '^CLOUDFLARE_API_TOKEN=.\+' "$envf"; then
    set -a; . "$envf"; set +a; log "auth: API token from $envf"; break
  fi
done
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then unset CLOUDFLARE_API_TOKEN; log "auth: using existing 'wrangler login'"; fi

DUMP="$WORK/dump.sql"
: > "$DUMP"
for t in "${TABLES[@]}"; do
  log "exporting $t from $DB_NAME"
  # Run outside any project folder so no wrangler config is picked up; wrangler's output
  # contains a temporary signed URL, so keep it in a file and show it only on failure.
  if ! (cd "$WORK" && WRANGLER_SEND_METRICS=false npx --yes "wrangler@$WRANGLER_VERSION" d1 export "$DB_NAME" --remote --table "$t" --output "$WORK/$t.sql") >"$WORK/wrangler.log" 2>&1; then
    sed -E 's#https://[^ ]*X-Amz[^ ]*#<signed-url>#g' "$WORK/wrangler.log" >&2
    die "wrangler d1 export failed for $t"
  fi
  cat "$WORK/$t.sql" >> "$DUMP"; printf '\n' >> "$DUMP"
done
[ -s "$DUMP" ] || die "export is empty"
for t in "${TABLES[@]}"; do grep -q "CREATE TABLE[^(]*\b$t\b" "$DUMP" || die "export has no $t table"; done
# Defence in depth: the identifiers must never reach this machine.
if grep -qE 'CREATE TABLE[^(]*\b(seen|salts)\b|INSERT INTO "?(seen|salts)"?' "$DUMP"; then die "export contains salts/seen; refusing"; fi

NEW="$WORK/web-stats.db"
sqlite3 -bail "$NEW" < "$DUMP" || die "could not load the export into SQLite"
sqlite3 -bail "$NEW" < "$HERE/views.sql" || die "could not create views"
sqlite3 "$NEW" "PRAGMA journal_mode=DELETE;" >/dev/null
[ "$(sqlite3 "$NEW" 'PRAGMA integrity_check;')" = "ok" ] || die "integrity_check failed"

COUNT_SQL='SELECT (SELECT COUNT(*) FROM pageviews)+(SELECT COUNT(*) FROM visitors)+(SELECT COUNT(*) FROM events);'
NEW_ROWS="$(sqlite3 "$NEW" "$COUNT_SQL")"
OLD_ROWS=0; [ -f "$OUT" ] && OLD_ROWS="$(sqlite3 "$OUT" "$COUNT_SQL" 2>/dev/null || echo 0)"
if [ "${FORCE:-0}" != "1" ] && [ "$OLD_ROWS" -gt 0 ] && [ $((NEW_ROWS * 2)) -lt "$OLD_ROWS" ]; then
  die "row count fell from $OLD_ROWS to $NEW_ROWS; keeping the old copy (FORCE=1 to accept)"
fi

STAMP="$(date '+%Y-%m-%d_%H%M%S')"
gzip -9 -c "$DUMP" > "$BACKUPS/.tmp-$STAMP.sql.gz" && mv -f "$BACKUPS/.tmp-$STAMP.sql.gz" "$BACKUPS/web-stats-$STAMP.sql.gz"
chmod 644 "$NEW"
if [ -f "$OUT" ]; then
  # Same trick as the app exporter: replace contents in one transaction so Metabase's open
  # connection sees old or new, never a mix, and needs no restart.
  sqlite3 "$OUT" ".timeout 60000" ".restore '$NEW'" || die "could not replace $OUT"
  [ "$(sqlite3 "$OUT" 'PRAGMA integrity_check;')" = "ok" ] || die "$OUT failed integrity_check after replace"
else
  cp "$NEW" "$OUT.tmp" && mv -f "$OUT.tmp" "$OUT"
fi
printf '%s\n' "$BACKUPS"/web-stats-*.sql.gz | sort -r | tail -n +$((KEEP_BACKUPS + 1)) | while IFS= read -r old; do rm -f "$old"; done
log "done: $NEW_ROWS rows (was $OLD_ROWS) -> $OUT"
