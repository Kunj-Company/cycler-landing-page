# Contributing

Thanks for taking the time. This is a small static site, so the process is light.

## Before you start

- For a typo or a factual fix, open a pull request directly.
- For a new section, a redesign or a change to the story, open an issue first so the idea can be
  agreed before you build it.

## Running it

There is nothing to install.

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000> and check your change at a desktop width and at about 390 px wide.

## Ground rules

- **Stay true to the app.** Anything the page claims Cycler does must match the Cycler README or
  changelog. If the app changes, update the page in the same pull request as the version number.
- **Mark illustrations.** Sample data and sketched demos say that they are samples.
- **No build step.** Keep it to plain HTML, CSS and JavaScript that runs from a file server.
- **Tokens first.** Colours and fonts come from the custom properties at the top of
  `css/styles.css`. Do not hard-code a new colour where a token exists.
- **Motion has a fallback.** Every animated element must be visible and usable with reduced motion
  turned on and with GSAP blocked. Animate `transform` and `opacity`, not layout.
- **The route line depends on layout.** It is built from element offsets, so do not animate the
  size or position of `.lane`, `.ch-in` or `.stone` containers with anything but transforms.
- **Pin library versions.** Libraries are self-hosted by exact version, with the version in the
  file name (`js/vendor/gsap-3.12.5.min.js`), because those files are cached for a year. A new
  version is a new file name. The only external script is the planner's MapLibre from cdnjs.
- **Keep the facts in step.** A change to the FAQ or the feature list also updates the JSON-LD
  `FAQPage` and `llms-full.txt`. A new outside host also goes into the CSP in `vercel.json` and
  the privacy policy.

## Branches

There is one long-lived branch: `main`. It is always deployable, and every push to it goes live.

- Small fixes can go straight to `main`.
- Anything bigger goes on a short-lived branch named after the change type,
  `feat/<short-name>` or `fix/<short-name>`, which gets a Vercel preview URL on push. Open a pull
  request, check the preview, and squash-merge it.
- The repository only allows squash merges and deletes the branch automatically after merging, so
  `main` stays one commit per change and no stale branches pile up.
- No `develop`, release or long-running branches. Releases are just commits on `main`.

## Commits and pull requests

- One logical change per commit, with a [Conventional Commits](https://www.conventionalcommits.org/)
  subject in the imperative: `fix(follow): correct turn cue distance`.
- Say what you checked: browsers, widths, reduced motion.
- Add a line to `CHANGELOG.md` under the next version. Versions use the `0.1.N` format.

## Licence

By contributing you agree that your work is released under the
[GNU Affero General Public License v3.0](LICENSE), the licence of this repository.

## Contact

Kunj Company, hellokunjcompany@gmail.com
