# cycler-web-stats

A small Cloudflare Worker and D1 database that count visits to https://cycler.kunj.company.
It sets no cookies and stores nothing in the browser. It keeps only daily counts: page views,
unique visitors, sources, countries, device types, browser and OS families, and a few clicks.

- Worker: `cycler-web-stats`, at https://cycler-web-stats.hi-480.workers.dev
- Endpoint: `POST /e` (beacon), `OPTIONS /e` (CORS preflight). Anything else returns 404.
  There is no read API. Every accepted or dropped beacon gets `202` with an empty body.
- D1 database: `cycler-web-stats` (id `a70be96b-e915-4bd1-83d5-6558c764d844`). This is separate
  from the app's `cycler-stats` database.
- Workers logs/observability are off, and the worker never logs requests.

## What the browser sends

`navigator.sendBeacon(url, JSON.stringify(payload))` as text/plain, at most 2 KB:

```json
{ "n": "pageview", "u": "https://cycler.kunj.company/?utm_source=reddit", "r": "https://www.google.com/", "w": 1440 }
```

`n` is one of `pageview`, `download`, `beta`, `donate`, `source`, `card`.

## What the worker does

1. Drops (still 202) bad JSON, unknown events, bodies over 2 KB, origins other than
   `cycler.kunj.company` / `cycler-landing-page.vercel.app` (from `Origin`, else the host of `u`),
   and bot or missing User-Agents.
2. Works out the dimensions: UTC `day`, `page` (path, lowercased, `index.html` removed),
   `source` (`utm_source`, else `ref`, else referrer host without `www.`, else `(direct)`;
   the site's own hosts count as `(direct)`), `country` (`XX` if unknown), `device`
   (`mobile` < 576 px, `tablet` < 992 px, else `desktop`, `unknown` if no width), `browser`, `os`.
3. Makes a visitor hash: `SHA-256(daily salt | cycler.kunj.company | IP | User-Agent)`, first 32
   hex chars. The IP and User-Agent are used only in memory for this and never stored.
4. Records first-seen keys for today in `seen` and adds to the count tables.
5. A cron at 00:05 UTC deletes `salts` and `seen` rows older than today, so yesterday's hashes can
   no longer be recomputed or linked to anything.

## Data model

| Table | Holds | Exported |
|---|---|---|
| `salts(day, salt)` | one random salt per day | no, deleted daily |
| `seen(day, key)` | today's first-seen keys `v:<hash>`, `p:<hash>:<page>`, `e:<hash>:<event>` | no, deleted daily |
| `pageviews(day, page, source, country, device, browser, os, pageviews, visitors)` | page views; `visitors` = unique visitors of that page that day | yes |
| `visitors(day, entry_page, source, country, device, browser, os, visitors)` | each unique visitor of the day, counted once, with the dimensions of their first event | yes |
| `events(day, event, page, source, country, device, count, visitors)` | clicks: `download`, `beta`, `donate`, `source`, `card` | yes |

`SUM(visitors)` from the `visitors` table, grouped by any dimension, gives unique visitors.
Summing `pageviews.visitors` across pages counts a visitor once per page they viewed.

## Deploy

From this folder, with wrangler logged in to the right account:

```sh
npx --yes wrangler@3 d1 create cycler-web-stats            # first time only; put the id in wrangler.toml
npx --yes wrangler@3 d1 execute cycler-web-stats --remote --file schema.sql
npx --yes wrangler@3 deploy
```

`schema.sql` uses `CREATE TABLE IF NOT EXISTS`, so running it again is safe.

## Home laptop: daily pull and the Metabase dashboard

The spare laptop (`abhi-t4gc`, reached over Tailscale) already runs Metabase for the app's stats
(`~/cycler-stats-server`, Metabase in Docker on `127.0.0.1:3030`). The website uses the same
Metabase, with its own files in `laptop/`, installed as `~/cycler-web-stats/` on the laptop:

| File | What |
|---|---|
| `laptop/pull.sh` | Daily export of `pageviews`, `visitors`, `events` (never `salts`/`seen`; it refuses an export that contains them). Writes `~/cycler-stats-server/exporter/data/web-stats.db`, the folder the Metabase container already mounts (seen there as `/cycler/web-stats.db`). Lock, integrity check, refuses a >50% row drop unless `FORCE=1`, replaces the file in one SQLite transaction so Metabase needs no restart, keeps 60 gzipped dumps in `backups/`. |
| `laptop/views.sql` | Helper views `v_pageviews`, `v_visitors`, `v_events` with `week_start`. |
| `laptop/queries.sql` | The 17 dashboard questions. |
| `laptop/dashboard.mjs` | Adds the "Cycler website" SQLite database to Metabase if missing and (re)builds the "Cycler website" collection and dashboard from `queries.sql`. Never touches the app's database or dashboard. |
| `laptop/cycler-web-stats-pull.{service,timer}` | systemd user timer, daily at 00:30 UTC (after the worker's 00:05 UTC cleanup). |

Auth for the pull, first match wins: `~/cycler-web-stats/.env`, then the app exporter's
`~/cycler-stats-server/exporter/.env`, then `wrangler login`. One Cloudflare API token with
**Account > D1 > Edit** covers both pulls:

```sh
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=4805d8c4951f307ae28b73a96fdff92d
```

Update the laptop after changing anything in `laptop/`:

```sh
scp laptop/{pull.sh,views.sql,queries.sql,dashboard.mjs} abhi@abhi-t4gc:cycler-web-stats/
ssh abhi@abhi-t4gc 'cd ~/cycler-web-stats && set -a && . ~/.cycler-metabase-admin && set +a && node dashboard.mjs'
```

Check the timer: `systemctl --user list-timers | grep web-stats`, logs:
`journalctl --user -u cycler-web-stats-pull`.

## Pull the data anywhere else (ad hoc)

```sh
scripts/pull.sh                          # writes ~/cycler-stats/web-stats.sqlite
scripts/pull.sh /some/other/file.sqlite  # or a path of your choice
CYCLER_STATS_DB=/some/file.sqlite scripts/pull.sh
```

The script runs `wrangler d1 export --remote --table ...` for `pageviews`, `visitors` and `events`
only, loads them into a fresh SQLite file with `sqlite3`, and swaps it in over the old one. Run it
whenever you want fresh numbers (for example once a day).

In Metabase: Admin settings > Databases > Add database > type **SQLite**, filename = the full
path to the file (for example `/Users/you/cycler-stats/web-stats.sqlite`). If Metabase runs in
Docker, mount the folder into the container and use the path inside the container.

## Delete data

Everything is kept until you delete it. Examples:

```sh
# everything
npx --yes wrangler@3 d1 execute cycler-web-stats --remote --command \
  "DELETE FROM pageviews; DELETE FROM visitors; DELETE FROM events; DELETE FROM seen; DELETE FROM salts;"

# everything before a date
npx --yes wrangler@3 d1 execute cycler-web-stats --remote --command \
  "DELETE FROM pageviews WHERE day < '2027-01-01'; DELETE FROM visitors WHERE day < '2027-01-01'; DELETE FROM events WHERE day < '2027-01-01';"
```

Then run `scripts/pull.sh` again so the local copy matches.

## Example queries

Daily unique visitors and page views:

```sql
SELECT v.day, v.visitors, p.pageviews
FROM (SELECT day, SUM(visitors) AS visitors FROM visitors GROUP BY day) v
LEFT JOIN (SELECT day, SUM(pageviews) AS pageviews FROM pageviews GROUP BY day) p USING (day)
ORDER BY v.day;
```

Top sources (last 30 days):

```sql
SELECT source, SUM(visitors) AS visitors
FROM visitors
WHERE day >= date('now', '-30 days')
GROUP BY source ORDER BY visitors DESC LIMIT 20;
```

Top pages:

```sql
SELECT page, SUM(pageviews) AS pageviews, SUM(visitors) AS visitors
FROM pageviews
GROUP BY page ORDER BY pageviews DESC;
```

Countries, devices, browsers, OSes (swap the column):

```sql
SELECT country, SUM(visitors) AS visitors FROM visitors GROUP BY country ORDER BY visitors DESC;
```

Clicks by event per day:

```sql
SELECT day, event, SUM(count) AS clicks, SUM(visitors) AS visitors
FROM events
GROUP BY day, event ORDER BY day, event;
```

Download conversion (visitors who clicked download / all visitors), per day:

```sql
SELECT v.day, COALESCE(e.dl, 0) AS downloaders, v.visitors,
       ROUND(100.0 * COALESCE(e.dl, 0) / v.visitors, 1) AS pct
FROM (SELECT day, SUM(visitors) AS visitors FROM visitors GROUP BY day) v
LEFT JOIN (SELECT day, SUM(visitors) AS dl FROM events WHERE event = 'download' GROUP BY day) e USING (day)
ORDER BY v.day;
```
