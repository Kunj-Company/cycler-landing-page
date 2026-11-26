#!/usr/bin/env node
// Adds the "Cycler website" database to Metabase (if missing) and (re)builds the
// "Cycler website" dashboard from queries.sql: one saved question per "-- ===== Q<n>." block.
//
//   MB_URL=http://127.0.0.1:3030 MB_EMAIL=... MB_PASSWORD=... node dashboard.mjs
//
// The database file must already exist where the Metabase container can see it
// (default /cycler/web-stats.db, i.e. ~/cycler-stats-server/exporter/data/web-stats.db on the
// laptop). Re-running replaces only what this script created before, so edits to queries.sql
// are picked up. It never touches the app's "Cycler stats" database or dashboard.
// Needs Node 18+ (built-in fetch). Talks only to your own Metabase.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MB = (process.env.MB_URL || "http://127.0.0.1:3030").replace(/\/$/, "");
const { MB_EMAIL, MB_PASSWORD } = process.env;
const DB_LABEL = "Cycler website";
const DB_PATH = process.env.MB_DB_PATH || "/cycler/web-stats.db";
const NAME = "Cycler website";
if (!MB_EMAIL || !MB_PASSWORD) { console.error("set MB_EMAIL and MB_PASSWORD"); process.exit(1); }

let session = "";
async function api(method, path, body) {
  const res = await fetch(MB + "/api" + path, {
    method,
    headers: { "content-type": "application/json", ...(session ? { "X-Metabase-Session": session } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}
const list = (j) => (Array.isArray(j) ? j : j.data);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- parse queries.sql ----
const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "queries.sql"), "utf8");
const blocks = sql.split(/^-- ===== /m).slice(1).map((part) => {
  const m = part.match(/^Q(\d+)\.\s*(.*)$/m);
  return {
    n: Number(m[1]),
    title: m[2].replace(/\s*\(chart:.*$/, "").trim(),
    query: part.split("\n").slice(1).filter((l) => !l.startsWith("--")).join("\n").trim().replace(/;\s*$/, ""),
  };
});

// Charts with explicit columns: an empty database can't tell Metabase which columns are numbers.
const g = (display, dims, metrics, extra = {}) =>
  ({ display, settings: { "graph.dimensions": dims, "graph.metrics": metrics, ...extra } });
const num = (col, suffix = "") => ({ display: "scalar", settings: { "scalar.field": col, ...(suffix ? { "scalar.suffix": suffix } : {}) } });
const table = { display: "table", settings: {} };
const CHART = {
  1: num("visitors"),
  2: num("pageviews"),
  3: num("downloads"),
  4: num("beta_clicks"),
  5: g("line", ["day"], ["visitors", "pageviews"]),
  6: g("bar", ["week_start"], ["visitors"]),
  7: g("row", ["source"], ["visitors"]),
  8: table,
  9: table,
  10: { display: "map", settings: { "map.type": "region", "map.region": "world_countries", "map.dimension": "country", "map.metric": "visitors" } },
  11: { display: "pie", settings: { "pie.dimension": "device", "pie.metric": "visitors" } },
  12: g("row", ["browser"], ["visitors"]),
  13: g("row", ["os"], ["visitors"]),
  14: g("bar", ["day", "event"], ["clicks"], { "stackable.stack_type": "stacked" }),
  15: table,
  16: table,
  17: g("area", ["week_start", "source"], ["visitors"], { "stackable.stack_type": "stacked" }),
};
// Layout on Metabase's 24-column grid: [col, row, width, height] per question.
const LAYOUT = {
  1: [0, 0, 6, 3], 2: [6, 0, 6, 3], 3: [12, 0, 6, 3], 4: [18, 0, 6, 3],
  5: [0, 3, 24, 7],
  6: [0, 10, 12, 6], 7: [12, 10, 12, 6],
  8: [0, 16, 12, 6], 9: [12, 16, 12, 6],
  10: [0, 22, 24, 9],
  11: [0, 31, 8, 6], 12: [8, 31, 8, 6], 13: [16, 31, 8, 6],
  14: [0, 37, 24, 7],
  15: [0, 44, 12, 6], 16: [12, 44, 12, 6],
  17: [0, 50, 24, 7],
};

session = (await api("POST", "/session", { username: MB_EMAIL, password: MB_PASSWORD })).id;

// ---- database ----
let db = list(await api("GET", "/database")).find((d) => d.engine === "sqlite" && d.details && d.details.db === DB_PATH);
if (!db) {
  console.log(`adding SQLite database ${DB_PATH} as "${DB_LABEL}"`);
  db = await api("POST", "/database", { engine: "sqlite", name: DB_LABEL, details: { db: DB_PATH }, is_full_sync: true });
} else {
  console.log(`database already added (id ${db.id})`);
}
await api("POST", `/database/${db.id}/sync_schema`).catch(() => {});
// Wait until Metabase can query it.
for (let i = 0; ; i++) {
  const r = await api("POST", "/dataset", { database: db.id, type: "native", native: { query: "SELECT COUNT(*) FROM pageviews" } }).catch((e) => ({ error: String(e) }));
  if (!r.error) break;
  if (i > 20) throw new Error(`Metabase cannot read ${DB_PATH}: ${r.error}`);
  await sleep(3000);
}

// ---- collection ----
let coll = (await api("GET", "/collection")).find((c) => c.name === NAME && !c.archived);
if (!coll) coll = await api("POST", "/collection", { name: NAME, color: "#E5484D" });
for (const it of list(await api("GET", `/collection/${coll.id}/items`))) {
  if (it.model === "dashboard") await api("DELETE", `/dashboard/${it.id}`).catch(() => api("PUT", `/dashboard/${it.id}`, { archived: true }));
  if (it.model === "card") await api("DELETE", `/card/${it.id}`).catch(() => api("PUT", `/card/${it.id}`, { archived: true }));
}

// ---- questions ----
const cards = [];
for (const b of blocks) {
  const dataset_query = { database: db.id, type: "native", native: { query: b.query } };
  const result = await api("POST", "/dataset", dataset_query);
  if (result.error) throw new Error(`Q${b.n} failed: ${result.error}`);
  const chart = CHART[b.n] || table;
  const have = new Set(result.data.cols.map((c) => c.name));
  const s = chart.settings;
  const used = [...(s["graph.dimensions"] || []), ...(s["graph.metrics"] || []), s["scalar.field"], s["map.dimension"], s["map.metric"], s["pie.dimension"], s["pie.metric"]].filter(Boolean);
  const missing = used.filter((c) => !have.has(c));
  if (missing.length) throw new Error(`Q${b.n}: chart uses columns not in the query: ${missing.join(", ")}`);
  const card = await api("POST", "/card", {
    name: b.title, collection_id: coll.id, display: chart.display, dataset_query, visualization_settings: s,
  });
  cards.push({ n: b.n, id: card.id });
  console.log(`saved Q${b.n} (${chart.display}): ${b.title}`);
}

// ---- dashboard ----
const dash = await api("POST", "/dashboard", {
  name: NAME, collection_id: coll.id,
  description: "Cookie-free visit counts for cycler.kunj.company. Days are UTC; visitors are daily uniques. Refreshes after each daily pull.",
});
let fallbackRow = 60;
const dashcards = cards.map((c, i) => {
  const [col, row, size_x, size_y] = LAYOUT[c.n] || [0, (fallbackRow += 6) - 6, 24, 6];
  return { id: -(i + 1), card_id: c.id, row, col, size_x, size_y, parameter_mappings: [], visualization_settings: {} };
});
await api("PUT", `/dashboard/${dash.id}`, { dashcards });
console.log(`dashboard: ${MB}/dashboard/${dash.id}`);
