# Cycler landing page

The website for [Cycler](https://github.com/Kunj-Company/cycler), a personal cycling app for Android:
record rides, plan routes and look back on every ride, with no account and no ads, rides kept on the phone, and anonymous usage stats that can be turned off.

![The hero of the Cycler landing page](docs/preview-hero.jpg)

The page tells one morning loop, from planning it the night before to looking back on it weeks
later. Scrolling is riding: the planned route is drawn in blue, your scroll records it in red, and
a ride bar at the bottom counts distance, speed, moving time and climb. Stop scrolling and it
auto-pauses, the way the app does.

![The planner showing the default loop from Thattekad Bird Sanctuary on the map](docs/preview-planner.jpg)

The planner is live. It opens on a loop from Thattekad Bird Sanctuary in Kerala; search a place
and it routes a real loop there, which the rest of the page then follows.

| The night passes | A junction, played by scroll | Share cards |
|---|---|---|
| ![Pinned dawn scene with a running clock](docs/preview-dawn.jpg) | ![Turn cue demo in the ride](docs/preview-follow.jpg) | ![A share card with its title field and style picker](docs/preview-share.jpg) |

## Run it

It is a static site with no build step and no dependencies to install.

```sh
git clone https://github.com/Kunj-Company/cycler-landing-page.git
cd cycler-landing-page
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` straight from disk works too.

## Deploy

The site is at <https://cycler.kunj.company>. The Vercel address <https://cycler-landing-page.vercel.app> keeps working. It is a Vercel project linked to this repository: every push to
`main` is deployed to production, and other branches get preview URLs.

Any static host works with the repository root as the output folder and no build command:
Vercel, Cloudflare Pages, Netlify or GitHub Pages. `404.html` is picked up automatically by all four.

`404.html` uses root-relative paths, so it assumes the site sits at the root of its domain.

## Search and sharing

What is already in place:

- A descriptive title and meta description, robots directives, author and theme colour.
- Open Graph and Twitter card tags with a 1200x630 preview image and alt text.
- Structured data (JSON-LD) in the head: `WebSite`, `Organization`, `Person`, a
  `SoftwareApplication` entry for the app (category, Android requirement, version, free offer,
  licence, feature list, screenshots) and an `FAQPage` that mirrors the visible FAQ.
- A crawlable feature list and FAQ in plain HTML. All content is in the markup, not injected by
  script.
- One `h1`, section `h2`s, landmarks, a skip link, alt text and sizes on every image, lazy loading
  below the fold.
- Scripts are deferred and library hosts are preconnected, so nothing blocks first paint.
- `robots.txt`, a web manifest, and `llms.txt` for AI crawlers.

No ratings or reviews are marked up, because the app has none to cite.

### Domain

The site's address is <https://cycler.kunj.company>. The canonical URL, `og:url`, the absolute `og:image` and
`twitter:image`, the JSON-LD URLs and `sitemap.xml` all use it. If the domain ever changes, search
for `cycler.kunj.company` and replace it everywhere, then submit the new address in Google Search
Console and Bing Webmaster Tools.

When the app version changes, update `softwareVersion` in the JSON-LD, the version in the install
section, the feature list heading and `llms.txt` together.

## Layout

| Path | What |
|---|---|
| `index.html` | The page markup, in story order |
| `css/styles.css` | Design tokens and all styles |
| `js/default-loop.js` | The stored default loop: place, settings and the routed track |
| `js/main.js` | The ride model, the planner, scroll-ride logic, the demos, and the GSAP choreography |
| `404.html` | Self-contained "you have left the route" page |
| `img/` | App logo, icons, social preview and screenshots |
| `site.webmanifest`, `robots.txt`, `llms.txt` | Browser and crawler metadata |
| `docs/DESIGN.md` | The concept, tokens, sections and motion inventory |

## How it is built

- **No framework.** One HTML file, one stylesheet, one script.
- **A working planner.** Search a place, pick a distance, direction and bike, and the page routes
  a real round trip the way the app does: Photon finds the place, BRouter routes a circle of
  waypoints on real roads, and MapLibre draws it on OpenFreeMap tiles. The loop then becomes the
  ride the rest of the page tells: distance, climb, time, elevation profile, kilometre stones,
  share cards, flyover and ticker all follow it.
- **Scroll-ride.** A single SVG path is laid through the ride chapters from their layout
  positions. Scroll position maps to a length along it, which drives the red track, the rider dot,
  the kilometre stones and the ride bar.
- **Motion.** [GSAP](https://gsap.com) 3.12.5 and ScrollTrigger, loaded from cdnjs. Details are in
  [docs/DESIGN.md](docs/DESIGN.md).
- **Fallback.** With reduced motion turned on, or if GSAP does not load, every section is visible
  and static. The scroll-ride itself needs no library.
- **Type.** Bricolage Grotesque and Hanken Grotesk from Google Fonts.

## Services the planner calls

The same free community servers the app uses, with no API keys. The default loop is stored with
the page, so nothing is called on load. Map tiles and the weather line load when the planner
scrolls into view; search and routing run only when a visitor plans a loop.

| What | Service | Sent |
|---|---|---|
| Place search | Photon (photon.komoot.io) | The search text, and the last chosen place rounded to about 1 km |
| Routing | BRouter (brouter.de) | Five waypoints of the loop and the bike profile |
| Map | OpenFreeMap, drawn by MapLibre GL JS 4.7.1 from cdnjs | The tiles viewed |
| Weather line | Open-Meteo | The chosen place rounded to about 100 m |

These are shared servers, so the page goes easy on them: search waits for a pause in typing,
routing runs once per change, an earlier request is cancelled when a new one starts, and results
are cached for the visit. If the map cannot load, the route is drawn as a shape instead. If
routing fails, the planner says why and offers a retry.

## Content

Feature descriptions, the privacy list and version details follow the Cycler
[README](https://github.com/Kunj-Company/cycler#readme) and
[changelog](https://github.com/Kunj-Company/cycler/blob/main/CHANGELOG.md), currently 0.1.12.

Some things on the page are illustrations, and the page says so where it matters:

- The page opens on a real loop from Thattekad Bird Sanctuary, routed once with BRouter and stored
  in `js/default-loop.js`. Planning your own replaces it.
- The activity week, segment times and bike-care numbers are sample data.
- The times of day and the tea stall are story details.

## Contributing

Corrections and improvements are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

Copyright (C) 2026 Abhiram N J

This site is free software, licensed under the
[GNU Affero General Public License v3.0](LICENSE). If you publish a modified version, you must
make its source available under the same licence.

Not covered by that licence:

- The Cycler app is a separate project under the MIT licence.
- The app logo and screenshots in `img/` come from the Cycler repository.
- GSAP and the two typefaces are loaded from their own hosts under their own licences.
- Maps in the screenshots are © OpenStreetMap contributors.
