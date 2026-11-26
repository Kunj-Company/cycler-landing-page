/* Cookie-free visit counts. See privacy.html#webstats and README "Visit counts". */
(function () {
  var URL_ = 'https://cycler-web-stats.hi-480.workers.dev/e';

  var h = location.hostname;
  if (h !== 'cycler.kunj.company' && h !== 'cycler-landing-page.vercel.app') return;
  if (navigator.webdriver) return;
  try { if (localStorage.getItem('cycler_stats_ignore') === '1') return; } catch (e) {}

  function send(n) {
    try {
      var body = JSON.stringify({ n: n, u: location.href, r: document.referrer, w: window.innerWidth });
      if (navigator.sendBeacon && navigator.sendBeacon(URL_, body)) return;
      fetch(URL_, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' } })['catch'](function () {});
    } catch (e) {}
  }

  function kind(a) {
    var u = a.hostname.replace(/^www\./, '').toLowerCase(), p = a.pathname.toLowerCase();
    if (u === 'github.com' && p.indexOf('/kunj-company/cycler') === 0) {
      return p.indexOf('/kunj-company/cycler/releases') === 0 ? 'download' : 'source';
    }
    if (u === 'tally.so') return 'beta';
    if (u === 'buymeacoffee.com') return 'donate';
  }

  send('pageview');

  document.addEventListener('click', function (ev) {
    try {
      var t = ev.target;
      if (!t || !t.closest) return;
      if (t.closest('#cbDown')) return send('card');
      var a = t.closest('a[href]');
      var n = a && kind(a);
      if (n) send(n);
    } catch (e) {}
  }, true);
})();
