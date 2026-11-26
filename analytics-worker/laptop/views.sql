-- Local-only helper views, added to web-stats.db after each pull.
-- `week_start` is the Monday of the day's week ('YYYY-MM-DD'), so Metabase can chart weeks.
DROP VIEW IF EXISTS v_pageviews;
DROP VIEW IF EXISTS v_visitors;
DROP VIEW IF EXISTS v_events;
CREATE VIEW v_pageviews AS SELECT *, date(day, 'weekday 0', '-6 days') AS week_start FROM pageviews;
CREATE VIEW v_visitors  AS SELECT *, date(day, 'weekday 0', '-6 days') AS week_start FROM visitors;
CREATE VIEW v_events    AS SELECT *, date(day, 'weekday 0', '-6 days') AS week_start FROM events;
