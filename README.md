[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/xplaynode/makefun-frontend-01-r3/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/xplaynode/makefun-frontend-01-r3/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

# Lucky Frontend — makefun-frontend-01

A fast, accessible, open-source static frontend for [make.fun](https://make.fun/bounty/makefun-frontend-01), built for the [makefun-frontend-01](https://make.fun/bounty/makefun-frontend-01) bounty. It has no build step and no framework: plain HTML, CSS and vanilla ES modules that read only make.fun's public API (GET requests, read-only, no sign-in).

## The four surfaces

- `#/` — the live bounty board: every open bounty with its live pot (reward plus collected entry fees), its entry fee or "Free entry", a live time-left countdown, and its entry count. Includes text search, category filter chips, and sorting (ending soon / biggest pot / most entries).
- `#/bounty/<slug>` — a bounty's page: live pot, fee, deadline and countdown, submissions, category and skill chips, a rewards table when the API publishes one, and the full description rendered as safe structured text.
- `#/bounty/<slug>/leaderboard` — the leaderboard: rank, entrant (linked to their profile), score or judge win rate, and stage, with paid places highlighted and provisional placements noted.
- `#/u/<handle>` — a public profile: avatar with a letter fallback, handle, bio, public stats and recent entries, plus ranking data when the API returns it.

Every surface is reachable both by in-app links and by its own URL, and every surface has loading, error-with-retry, and empty states. Because live API field shapes vary (a category may arrive as a plain string instead of an array, for example), all API fields pass through small normalizer helpers in `app/format.js`, so no shape variant can crash a render.

## Performance

- First load (index.html + style.css + all JavaScript) stays under 25 KB raw, with a system font stack and zero external requests.
- `app/api.js` keeps an in-memory cache with ETag / If-None-Match revalidation, de-duplicates concurrent identical requests, reuses cached board data when opening a bounty, and upgrades board pots progressively with entry-fee data instead of blocking the first render.
- Accessibility: semantic landmarks, a skip link, visible focus styles, labelled controls, and a responsive single-column layout under 640px with tap targets of at least 40px. Countdown text uses tabular numbers and updates in place every 30 seconds, so nothing shifts layout.

## Run it locally

```sh
node serve.ts --port 8091
# then open http://localhost:8091
```

Any static file server pointed at `app/` works just as well.

## Hand in the entry (grader entry point)

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` into the output directory (default `/output`; the directory is created if missing and only its contents are cleared) and writes `dossier.json` there using the vendored `buildDossier` from `vendor/makefun-frontend.ts`, which is the kit's library kept byte-identical.

## Layout

- `app/` — the frontend: `index.html`, `style.css`, `api.js`, `format.js`, `views.js`, `main.js`
- `main.ts` — the hand-in program described above
- `serve.ts` — a tiny local static server for development
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged
- `screenshots/` — three screenshots of the app running on live data
- `shots.json` — the screenshot routes and viewport (1280×800)

Licensed under the MIT License (see `LICENSE`).
