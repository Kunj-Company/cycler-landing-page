# Changelog

Notable changes to the Cycler landing page. Versions use the `0.1.N` format.

## 0.1.5

### Changed
- New hero: a full-height map with a tilted phone that records the loop live. It loads as the
  dark draws back into a recording dot, follows the pointer, and on scroll pins while the phone
  switches to the big-number screen and the night spreads out from behind it into the planner.
- New top bar: fixed, gathers into a glass pill on scroll, turns dark over night sections, marks
  the current section, shows page progress as a recorded line, and has a menu on phones.

- Everything after the yellow ticker is redesigned to be calmer: one paper surface with hairlines
  instead of alternating bands and boxes. Share shows one card with a style picker, the app's
  screens and widgets sit behind tabs, the feature list is grouped into Ride, Plan, Look back and
  Your data, and privacy and install are plain lists. No content was removed.

### Added
- A scroll speed cap, so a hard flick of the wheel, trackpad or finger cannot skip the story.
  Keyboard, scrollbar and in-page links are not capped. Off under reduced motion.
  The cap eases off after the yellow ticker, where the story ends and the reference sections begin.

### Fixed
- On phones, reveal animations waiting off to the side widened the page layout.
- The load sequence stalled twice in its first second. It now animates transforms and opacity
  only and starts after layout has been measured.
- The hero's blinking recording dot style leaked onto the ride bar and the tea stop card.

## 0.1.4

### Changed
- The page opens on a real default loop: 32 km heading south from Thattekad Bird Sanctuary,
  Kerala (30.3 km, 249 m of climb, 1h 47m on a road bike). It was routed once with BRouter and is
  stored in `js/default-loop.js`, so no server is called on load. It replaces the Nandi foothills
  example everywhere on the page.
- The planner's map and the weather line load when the planner scrolls into view.
- Presets are now Thattekad Bird Sanctuary, Cubbon Park and Fort Kochi.

## 0.1.3

### Added
- The planner is real. Search a place (or use a preset or your location), pick a distance,
  direction and bike, and it routes a round trip on real roads with the app's own method: Photon
  for search, BRouter for routing, the same circle of waypoints and the same one-time resize when a
  loop comes back too long or short.
- A live map of the planned loop on OpenFreeMap tiles, loaded only when first needed.
- The planned loop becomes the ride the page tells. Distance, climb, moving time, average speed,
  elevation profile, kilometre stones, the ride bar, the save page, share cards, flyover, hero
  loop and ticker all follow it. Current weather at the chosen place fills the start card.
- Gravel as a fourth bike type, and a Distance figure and Very hard grade in the results, matching
  the app.
- Plain-word routing errors with a Retry button, and a shape-only fallback when map tiles cannot
  load.

### Changed
- Charts no longer stretch a flat route to full height, and their labels read "high" and "low".
- The privacy section says what this website's planner sends and to whom.

## 0.1.2

### Fixed
- The hero stayed dark and zoomed after scrolling down and back to the top. CSS smooth scrolling
  made ScrollTrigger measure every section from the wrong scroll position whenever it refreshed
  mid-page (after a resize, a late font load or a hash link). Smooth scrolling is now handled in
  script for in-page links only. The pinned dawn scene had the same fault.
- Reloading the page while scrolled into the ride stopped every script, because the ride bar
  tried to read the route before it was built.

### Added
- "Everything Cycler does", a full feature list, and an FAQ section.
- Search and sharing: a descriptive title and description, robots directives, complete Open Graph
  and Twitter tags, JSON-LD for the site, publisher, app and FAQ, and `llms.txt`.
- A skip link, footer navigation, and Features and FAQ links in the top bar.

### Changed
- GSAP and the page script load with `defer`, and the CDN host is preconnected.

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
