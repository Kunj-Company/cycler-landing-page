-- Cycler website stats (D1 database: cycler-web-stats)

-- Daily random salt for visitor hashes. Rows older than today are deleted by the cron.
CREATE TABLE IF NOT EXISTS salts (
  day  TEXT PRIMARY KEY,
  salt TEXT NOT NULL
);

-- Dedupe keys for today (v:<hash>, p:<hash>:<page>, e:<hash>:<event>).
-- Rows older than today are deleted by the cron. Never exported.
CREATE TABLE IF NOT EXISTS seen (
  day TEXT,
  key TEXT,
  PRIMARY KEY (day, key)
);

-- Page views per day and dimensions.
CREATE TABLE IF NOT EXISTS pageviews (
  day       TEXT,
  page      TEXT,
  source    TEXT,
  country   TEXT,
  device    TEXT,
  browser   TEXT,
  os        TEXT,
  pageviews INT,
  visitors  INT,
  PRIMARY KEY (day, page, source, country, device, browser, os)
);

-- Unique visitors per day, attributed to the dimensions of their first event of the day.
CREATE TABLE IF NOT EXISTS visitors (
  day        TEXT,
  entry_page TEXT,
  source     TEXT,
  country    TEXT,
  device     TEXT,
  browser    TEXT,
  os         TEXT,
  visitors   INT,
  PRIMARY KEY (day, entry_page, source, country, device, browser, os)
);

-- Click events (download, beta, donate, source, card).
CREATE TABLE IF NOT EXISTS events (
  day      TEXT,
  event    TEXT,
  page     TEXT,
  source   TEXT,
  country  TEXT,
  device   TEXT,
  count    INT,
  visitors INT,
  PRIMARY KEY (day, event, page, source, country, device)
);
