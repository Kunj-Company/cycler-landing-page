// Cycler website stats collector.
// POST /e receives a beacon, OPTIONS /e answers CORS preflight, everything else is 404.
// Stores counts only. The IP and User-Agent are used in memory to make a daily visitor hash
// and are never stored or logged. See ../README.md and the shared spec.

const ALLOWED_HOSTS = ['cycler.kunj.company', 'cycler-landing-page.vercel.app'];
const SITE = 'cycler.kunj.company';
const EVENTS = ['pageview', 'download', 'beta', 'donate', 'source', 'card'];
const MAX_BODY = 2048;
const BOT_RE =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|curl|wget|python|httpclient|java\/|go-http|axios|node-fetch|phantom|selenium|puppeteer|playwright/i;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/e') return new Response(null, { status: 404 });

    const origin = request.headers.get('Origin');
    const originHost = hostOf(origin);
    const cors = {};
    if (originHost && ALLOWED_HOSTS.includes(originHost)) {
      cors['Access-Control-Allow-Origin'] = origin;
      cors['Vary'] = 'Origin';
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    if (request.method !== 'POST') return new Response(null, { status: 404 });

    const accepted = () => new Response(null, { status: 202, headers: cors });

    try {
      await collect(request, env, originHost);
    } catch (_) {
      // Drop silently. No logging of requests.
    }
    return accepted();
  },

  async scheduled(_event, env) {
    const today = utcDay();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM salts WHERE day < ?').bind(today),
      env.DB.prepare('DELETE FROM seen WHERE day < ?').bind(today),
    ]);
  },
};

async function collect(request, env, originHost) {
  // 1. Body: max 2 KB, valid JSON, known event.
  const declared = Number(request.headers.get('Content-Length'));
  if (declared > MAX_BODY) return;
  const buf = await request.arrayBuffer();
  if (buf.byteLength === 0 || buf.byteLength > MAX_BODY) return;
  let p;
  try {
    p = JSON.parse(new TextDecoder().decode(buf));
  } catch (_) {
    return;
  }
  if (!p || typeof p !== 'object' || !EVENTS.includes(p.n)) return;
  const event = p.n;

  let pageUrl = null;
  try {
    pageUrl = typeof p.u === 'string' ? new URL(p.u) : null;
  } catch (_) {
    pageUrl = null;
  }

  // 2. Origin: Origin header, falling back to the hostname of u.
  const host = originHost || (pageUrl ? pageUrl.hostname.toLowerCase() : null);
  if (!host || !ALLOWED_HOSTS.includes(host)) return;

  // 3. Bots.
  const ua = request.headers.get('User-Agent') || '';
  if (!ua || BOT_RE.test(ua)) return;

  // 4. Dimensions.
  const day = utcDay();
  const page = pageOf(pageUrl);
  const source = sourceOf(pageUrl, p.r);
  const cc = request.cf && typeof request.cf.country === 'string' ? request.cf.country : '';
  const country = /^[A-Za-z]{2}$/.test(cc) ? cc.toUpperCase() : 'XX';
  const device = deviceOf(p.w);
  const browser = browserOf(ua);
  const os = osOf(ua);

  // 5. Daily salt.
  const db = env.DB;
  const getSalt = db.prepare('SELECT salt FROM salts WHERE day = ?').bind(day);
  let salt = await getSalt.first('salt');
  if (!salt) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    await db.prepare('INSERT OR IGNORE INTO salts (day, salt) VALUES (?, ?)').bind(day, toHex(bytes)).run();
    salt = await getSalt.first('salt');
    if (!salt) return;
  }

  // 6. Visitor hash (IP and UA used only here, in memory).
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(salt + '|' + SITE + '|' + ip + '|' + ua),
  );
  const hash = toHex(new Uint8Array(digest)).slice(0, 32);

  // 7. Dedupe keys.
  const seen = db.prepare('INSERT OR IGNORE INTO seen (day, key) VALUES (?, ?)');
  const secondKey = event === 'pageview' ? `p:${hash}:${page}` : `e:${hash}:${event}`;
  const [vRes, kRes] = await db.batch([seen.bind(day, `v:${hash}`), seen.bind(day, secondKey)]);
  const newVisitor = vRes.meta.changes === 1;
  const newKey = kRes.meta.changes === 1 ? 1 : 0;

  // 8. Aggregates.
  const stmts = [];
  if (event === 'pageview') {
    stmts.push(
      db
        .prepare(
          `INSERT INTO pageviews (day, page, source, country, device, browser, os, pageviews, visitors)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
           ON CONFLICT (day, page, source, country, device, browser, os)
           DO UPDATE SET pageviews = pageviews + 1, visitors = visitors + excluded.visitors`,
        )
        .bind(day, page, source, country, device, browser, os, newKey),
    );
  } else {
    stmts.push(
      db
        .prepare(
          `INSERT INTO events (day, event, page, source, country, device, count, visitors)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?)
           ON CONFLICT (day, event, page, source, country, device)
           DO UPDATE SET count = count + 1, visitors = visitors + excluded.visitors`,
        )
        .bind(day, event, page, source, country, device, newKey),
    );
  }
  if (newVisitor) {
    stmts.push(
      db
        .prepare(
          `INSERT INTO visitors (day, entry_page, source, country, device, browser, os, visitors)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)
           ON CONFLICT (day, entry_page, source, country, device, browser, os)
           DO UPDATE SET visitors = visitors + 1`,
        )
        .bind(day, page, source, country, device, browser, os),
    );
  }
  await db.batch(stmts);
}

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function hostOf(s) {
  if (!s) return null;
  try {
    return new URL(s).hostname.toLowerCase();
  } catch (_) {
    return null;
  }
}

function pageOf(u) {
  if (!u) return '/';
  let path = u.pathname.toLowerCase();
  if (path.endsWith('index.html')) path = path.slice(0, -'index.html'.length);
  if (!path) path = '/';
  return path.slice(0, 100);
}

function sourceOf(u, referrer) {
  let s = '';
  if (u) s = u.searchParams.get('utm_source') || u.searchParams.get('ref') || '';
  if (!s && typeof referrer === 'string' && referrer) {
    const h = hostOf(referrer);
    if (h) s = ALLOWED_HOSTS.includes(h) ? '' : h.replace(/^www\./, '');
  }
  s = s.trim().toLowerCase().slice(0, 100);
  return s || '(direct)';
}

function deviceOf(w) {
  if (typeof w !== 'number' || !Number.isFinite(w)) return 'unknown';
  if (w < 576) return 'mobile';
  if (w < 992) return 'tablet';
  return 'desktop';
}

function browserOf(ua) {
  if (/Edg(e|A|iOS)?\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera|OPiOS\//.test(ua)) return 'Opera';
  if (/SamsungBrowser\//.test(ua)) return 'Samsung Internet';
  if (/Firefox\/|FxiOS\//.test(ua)) return 'Firefox';
  if (/Chrome\/|CriOS\/|Chromium\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Other';
}

function osOf(ua) {
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Macintosh|Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Other';
}

function toHex(bytes) {
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}
