# Changelog

Notable changes to the Cycler landing page. Versions use the `0.1.N` format.

## 0.1.1

### Added
- Page metadata: Open Graph tags, theme colour, icons, a web manifest and a social preview image.
- A 404 page ("You have left the route") and `robots.txt`.
- A "Site source" link in the footer.
- Design notes in `docs/DESIGN.md`, a contributing guide and this changelog.

### Changed
- Styles and scripts moved out of `index.html` into `css/styles.css` and `js/main.js`.
- Licensed under the GNU Affero General Public License v3.0.

## 0.1.0

First version.

### Added
- One-page site that tells a morning ride from planning to looking back, matching Cycler 0.1.12.
- Scroll-ride: a planned route line that scrolling records, with kilometre stones and a ride bar
  showing distance, speed, moving time and climb, including auto-pause.
- Interactive demos: loop planner, save page, share cards, flyover, activity chart and bike care.
- GSAP choreography: load sequence, pinned dawn scene, scrubbed chapter demos, stat ticker and
  section reveals, with a static fallback.
