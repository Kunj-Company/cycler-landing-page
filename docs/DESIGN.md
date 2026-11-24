# Design notes

How the Cycler landing page is put together and why.

## Concept

The page is one ride. Cycler's own follow-a-route screen shows the plan in blue and what you have
ridden in red, so the site borrows exactly that: a blue line runs down the ride, and scrolling
records it in red. Everything else stays quiet so that line can be the memorable thing.

The story runs in time order, which is why chapters carry a time of day:

| Section | When | Feature it carries |
|---|---|---|
| Hero | | What Cycler is, and what it leaves out |
| Plan | The night before, 9:40 pm | Loops, A to B, suggested routes, GPX import |
| Dawn | 9:40 pm to 5:52 am | No feature. The night passes |
| Start | 5:52 am, km 0 | One-button start, weather, weekly goal |
| Screen off | 6:03 am | Background recording, big-number screen |
| Follow | 6:24 am | Turn cues, off-route vibration, signals |
| Climb | 6:48 am | Laps, interval workouts, elevation |
| Tea stop | 7:10 am | Auto-pause |
| No signal | 7:31 am | Offline maps, recording without internet |
| Finish | 7:49 am, km 32.4 | The save page: title, feeling, tags, notes |
| Share | 8:15 am | Share cards, 3D flyover |
| Look back | The weeks after | Activity, bike care, segments, widgets |
| Features | | The full feature list, for readers and crawlers |
| Privacy | | The five requests that leave the phone |
| Install | | APK, version, licence |
| FAQ | | Eleven short answers, mirrored in the structured data |

## Tokens

Defined once at the top of `css/styles.css`.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#ECEEE8` | Map land, page background |
| `--road` | `#FFFFFF` | Map roads, cards |
| `--ink` | `#1C1C1A` | Text, primary buttons |
| `--muted` | `#5D5C57` | Secondary text |
| `--plan` | `#2563EB` | Planned route, selection (the app's accent) |
| `--rec` | `#E5484D` | Recorded track, recording state |
| `--stone` | `#F4C20D` | Kilometre stone cap, the stat ticker |
| `--night` | `#111214` | Night sections, screen-off chapter |

The palette is the app's: neutral surfaces, hairline borders, one blue, and red only for
recording. The yellow is the one addition, taken from the caps of Indian roadside kilometre
stones, which mark each chapter.

## Type

- **Bricolage Grotesque** for display.
- **Hanken Grotesk** for body text and every number, with tabular figures so counters do not
  jiggle.

## The planner and the ride model

`RIDE` in `js/main.js` is the one object the page reads its ride from: name, place, distance,
climb, moving time, date and a 401-sample elevation profile. On load it is filled from
`js/default-loop.js`, a 32 km loop south from the entrance of Thattekad Bird Sanctuary that was
routed once and stored, so the page opens on a real ride without calling a server. To change the
default, route a loop and replace that file's place, settings and track.
`applyRide()` pushes it into every element marked `data-r`, the charts, the ticker, the titles and
the kilometre stones. `setShape()` gives the hero, share cards and flyover the route's outline.

The planner replaces `RIDE` with a real loop, following the app's code:

1. Photon returns up to six places; the label joins name, street, city, state and country.
2. `loopWaypoints()` puts three points on a circle through the start, in the chosen direction. The
   circle's circumference is the target distance divided by 1.3, because roads wiggle.
3. BRouter routes start, the three points, and start again. If the result is more than 15 percent
   off the target, the circle is resized once and the closer result is kept.
4. Difficulty is the app's formula: kilometres plus climb divided by 40.

If the default file is missing, the planner draws a sketch with estimated numbers instead.

## The scroll-ride

`build()` in `js/main.js` lays a spline through the ride:

1. For each chapter it reads the kilometre stone's layout position and samples points down the
   chapter's lane with a little seeded noise.
2. The points become one SVG path, drawn twice: blue underneath, red on top with a dash offset.
3. A lookup table maps a vertical position to a length along the path.

Each frame, the middle of the viewport is converted to a length. That one number drives the red
track, the rider dot, the distance, the climb (from the ride's elevation profile) and the kilometre stones. Speed is scroll velocity. Moving time counts only while
you scroll, which is what makes the auto-pause chapter work.

Positions come from `offsetTop` and `offsetLeft`, not `getBoundingClientRect`, so transforms from
animations cannot bend the route.

## Motion

GSAP 3.12.5 with ScrollTrigger. All of it lives in the last block of `js/main.js`.

| Where | What happens | Driven by |
|---|---|---|
| Top bar | Gathers into a glass pill, turns dark over night sections, marks the current section, fills a red progress line over a blue one | Scroll |
| Hero | The dark draws back into a recording dot, the headline rises out of its masks, the phone swings in and records the loop while its distance counts. Transforms and opacity only | Page load |
| Hero | The phone leans towards the cursor, the map drifts the other way, the chips bob | Pointer, idle |
| Hero | Pinned. The copy leaves through its masks, the phone lies flat and switches to the big-number screen, the night spreads out from behind it | Scroll, scrubbed |
| Plan | Map wipes in; loop redraws and numbers roll on every change; the map flies to a new route | Enter, then input |
| Dawn | Pinned. Clock runs 9:40 pm to 5:52 am, stars fade, sun rises, sky becomes the map | Scroll, scrubbed |
| Chapters | Stone drops and bounces, heading rises from a mask, demo tilts up | Enter |
| Follow | Junction plays out with a live turn cue | Scroll, scrubbed |
| Climb | Profile springs up, interval clock counts down | Enter |
| Tea stop | Steam rises from the glass | Ride state: auto-paused |
| No signal | Signal bars drop to "No service" | Scroll, scrubbed |
| Finish | Save bursts in the route colours | Click |
| Ticker | Drifts with scroll, skews with scroll velocity | Scroll |
| Share | Cards deal out from a deck, tilt under the pointer | Scroll, pointer |
| Flyover | Camera pass that starts slow, speeds up, slows down | Enter or click |
| Look back | Bars grow, totals count, screenshot strip slides | Enter, scroll |

### Scroll speed cap

The page is a story told by scrolling, so a hard flick cannot skip it. Wheel and trackpad input
moves a target and the page follows at no more than about one and a half screens a second (the
block before the GSAP layer in `js/main.js`). On touch devices `ScrollTrigger.normalizeScroll`
shortens how far a flick carries. The keyboard, the scrollbar and in-page links are not capped;
they are how you jump. The cap is off under reduced motion.

The story ends at the yellow ticker. As the ticker crosses the screen the cap eases off, and once
it has left the top the wheel is the browser's own again and a touch flick carries as far as
usual: what follows is reference, meant to be skimmed. Scrolling back up eases the cap back on.

### Fallbacks

- `prefers-reduced-motion: reduce` skips the whole GSAP layer. The page is static and complete.
- If GSAP fails to load, the same static page is shown. A timeout clears the pre-animation hiding
  of the hero after 3.5 seconds in any case.
- Small or short screens (under 821 px wide or 680 px tall) get the hero's scroll transition
  without the pin.
- Pointer effects only attach on devices with hover and a fine pointer.

### One rule for ScrollTrigger

`html` must not have `scroll-behavior: smooth` while ScrollTrigger is active. On refresh it jumps
the scroll position to measure sections, and smooth scrolling turns that jump into an animation,
so every start and end is measured wrong. The `gs` class on `html` switches it off, and in-page
links call `scrollIntoView` with smooth behaviour instead.

## Content rules

- Claims about the app follow the Cycler README and changelog.
- Demos that are not the real app say so on the page.
- The default ride is the stored Thattekad loop. Its numbers are BRouter's, not invented.
