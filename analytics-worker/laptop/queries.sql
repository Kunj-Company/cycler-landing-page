-- Questions for the "Cycler website" dashboard in Metabase (database: Cycler website).
-- dashboard.mjs turns each "-- ===== Q<n>." block into a saved question with the chart noted.
-- Days are UTC. "Last 30 days" means today and the 29 days before it.
-- Unique visitors: SUM(visitors) from the visitors table counts each visitor once per day,
-- attributed to their first page, source, country and device of that day. Visitors on
-- different days cannot be linked (the hash changes daily), so "visitors over 30 days" is
-- the sum of daily uniques, the same way Plausible reports it.

-- ===== Q1. Visitors, last 30 days (chart: number)
SELECT COALESCE(SUM(visitors), 0) AS visitors
FROM visitors WHERE day >= date('now', '-29 days');

-- ===== Q2. Page views, last 30 days (chart: number)
SELECT COALESCE(SUM(pageviews), 0) AS pageviews
FROM pageviews WHERE day >= date('now', '-29 days');

-- ===== Q3. Download clicks, last 30 days (chart: number)
SELECT COALESCE(SUM(count), 0) AS downloads
FROM events WHERE event = 'download' AND day >= date('now', '-29 days');

-- ===== Q4. Beta sign-up clicks, last 30 days (chart: number)
SELECT COALESCE(SUM(count), 0) AS beta_clicks
FROM events WHERE event = 'beta' AND day >= date('now', '-29 days');

-- ===== Q5. Visitors and page views per day, last 90 days (chart: line)
WITH v AS (SELECT day, SUM(visitors) AS visitors FROM visitors WHERE day >= date('now', '-89 days') GROUP BY day),
     p AS (SELECT day, SUM(pageviews) AS pageviews FROM pageviews WHERE day >= date('now', '-89 days') GROUP BY day)
SELECT p.day AS day, COALESCE(v.visitors, 0) AS visitors, p.pageviews AS pageviews
FROM p LEFT JOIN v ON v.day = p.day
ORDER BY p.day;

-- ===== Q6. Visitors per week (chart: bar)
SELECT week_start, SUM(visitors) AS visitors
FROM v_visitors GROUP BY week_start ORDER BY week_start;

-- ===== Q7. Top sources, last 30 days (chart: row)
SELECT source, SUM(visitors) AS visitors
FROM visitors WHERE day >= date('now', '-29 days')
GROUP BY source ORDER BY visitors DESC LIMIT 15;

-- ===== Q8. Top pages, last 30 days (chart: table)
SELECT page, SUM(pageviews) AS pageviews, SUM(visitors) AS visitors
FROM pageviews WHERE day >= date('now', '-29 days')
GROUP BY page ORDER BY pageviews DESC LIMIT 20;

-- ===== Q9. Entry pages, last 30 days (chart: table)
SELECT entry_page, SUM(visitors) AS visitors
FROM visitors WHERE day >= date('now', '-29 days')
GROUP BY entry_page ORDER BY visitors DESC LIMIT 20;

-- ===== Q10. Visitors by country, last 30 days (chart: world map)
SELECT country, SUM(visitors) AS visitors
FROM visitors WHERE day >= date('now', '-29 days') AND country <> 'XX'
GROUP BY country ORDER BY visitors DESC;

-- ===== Q11. Devices, last 30 days (chart: pie)
SELECT device, SUM(visitors) AS visitors
FROM visitors WHERE day >= date('now', '-29 days')
GROUP BY device ORDER BY visitors DESC;

-- ===== Q12. Browsers, last 30 days (chart: row)
SELECT browser, SUM(visitors) AS visitors
FROM visitors WHERE day >= date('now', '-29 days')
GROUP BY browser ORDER BY visitors DESC;

-- ===== Q13. Operating systems, last 30 days (chart: row)
SELECT os, SUM(visitors) AS visitors
FROM visitors WHERE day >= date('now', '-29 days')
GROUP BY os ORDER BY visitors DESC;

-- ===== Q14. Clicks per day by kind, last 90 days (chart: stacked bar)
SELECT day, event, SUM(count) AS clicks
FROM events WHERE day >= date('now', '-89 days')
GROUP BY day, event ORDER BY day, event;

-- ===== Q15. Goals, last 30 days (chart: table)
-- conversion = visitors who clicked / all visitors in the period, as a percentage.
WITH total AS (SELECT COALESCE(SUM(visitors), 0) AS v FROM visitors WHERE day >= date('now', '-29 days'))
SELECT e.event AS goal,
       SUM(e.count) AS clicks,
       SUM(e.visitors) AS visitors,
       ROUND(100.0 * SUM(e.visitors) / NULLIF((SELECT v FROM total), 0), 1) AS conversion_pct
FROM events e WHERE e.day >= date('now', '-29 days')
GROUP BY e.event ORDER BY visitors DESC;

-- ===== Q16. Which sources lead to downloads and beta sign-ups, last 90 days (chart: table)
SELECT source,
       SUM(CASE WHEN event = 'download' THEN visitors ELSE 0 END) AS download_visitors,
       SUM(CASE WHEN event = 'beta' THEN visitors ELSE 0 END) AS beta_visitors,
       SUM(CASE WHEN event = 'donate' THEN visitors ELSE 0 END) AS donate_visitors
FROM events WHERE day >= date('now', '-89 days') AND event IN ('download', 'beta', 'donate')
GROUP BY source ORDER BY download_visitors + beta_visitors DESC LIMIT 20;

-- ===== Q17. Top sources per week (chart: stacked area)
WITH top AS (SELECT source FROM visitors GROUP BY source ORDER BY SUM(visitors) DESC LIMIT 6)
SELECT week_start, CASE WHEN source IN (SELECT source FROM top) THEN source ELSE 'other' END AS source,
       SUM(visitors) AS visitors
FROM v_visitors GROUP BY 1, 2 ORDER BY 1, 2;
