# Cycler landing page

The website for [Cycler](https://github.com/Kunj-Company/cycler), a personal cycling app for Android.

The page tells one morning loop from the night before to the weeks after. Scrolling records the
planned blue route in red, and a ride bar at the bottom counts distance, speed, moving time and climb.

## Run it

It is a static site with no build step. Open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
```

Any static host works (Vercel, Cloudflare Pages, GitHub Pages) with the repository root as the output folder.

## What is in here

| Path | What |
|---|---|
| `index.html` | The whole page: markup, styles and scripts |
| `img/` | App logo and screenshots, taken from the Cycler repo |

## Loaded from outside

- GSAP 3.12.5 and ScrollTrigger from cdnjs, for the animations. Without them, or with reduced
  motion turned on, the page shows everything statically.
- Bricolage Grotesque and Hanken Grotesk from Google Fonts.

## Notes on the content

The loop planner, the activity week, the segment times and the bike-care numbers are illustrations
with sample data. Feature descriptions, the privacy list and version details follow the Cycler
README and changelog (0.1.12).
