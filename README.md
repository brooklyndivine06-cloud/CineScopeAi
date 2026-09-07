# CineScope AI

**Should you actually watch it?** CineScope reads the published ratings for a film and turns them
into one honest verdict — plus a real content advisory that says *what* is in the film, not just an
age rating.

It is a static, installable web app. No account, no build step, no backend. It ships with a curated
catalogue so it works **offline with zero configuration**, and optionally unlocks the full TMDb
catalogue if you paste a free API key.

---

## What it does

**One verdict, from real numbers.** IMDb, Rotten Tomatoes (critics + audience), Metacritic, TMDb and
Letterboxd are blended with fixed weights into a 0–100 CinemaScore. Sources that did not report are
excluded, never guessed — and the confidence figure tells you how much of the weighted set was
actually present.

| Score | Verdict |
| ----- | ------- |
| 85+ | 👑 Peak Cinema |
| 76+ | 🎬 Must Watch |
| 66+ | ✅ Solid Pick |
| 55+ | 😐 Mixed Signals |
| 40+ | ⏭️ Probably Skip |
| < 40 | 🗑️ Cinematic Crime |

**A content advisory with teeth.** Sixteen categories (gore, jump scares, self-harm, strobe, child
peril, animal harm, discrimination…) each carry a severity from Low to Extreme. Bundled films have
**hand-written** advisories; live API films get one modelled from certification, genre and keywords —
and the UI always says which of the two you are looking at. Set your tolerance in Settings and
anything above it gets called out, with a full-screen gate on Extreme content.

**Everything else you want before pressing play:** rating-source breakdown, a five-axis strength
profile, who it lands with (and who should skip it), a watch plan, cast and crew, live
"where to watch" providers by region, box-office maths, and similar-title matching with reasons.

### Features

- ⌘K **command palette** with fuzzy search over titles, directors, cast and themes
- **Paste any link** — Letterboxd, IMDb, TMDb, Wikipedia, Apple TV, Netflix, Prime, JustWatch…
  Slugged links resolve offline; id-only links tell you they need a key instead of guessing
- **Compare** two films side by side with the deltas called out
- **Watchlist** with aggregates, JSON export/import, and history of what you analyzed
- **Deep links** (`#/m/:id`) so any verdict is shareable
- **Export card** — a generated 1080×1350 share image, or the Web Share API
- **Themes** (auto/dark/light), six accents, reduced-motion and interface-sound toggles
- **PWA** — installable, offline-first service worker
- Keyboard-driven end to end (`?` for the shortcut list)

---

## Running it

```bash
npm start                  # http://localhost:5173  (picks the next free port if busy)
node tools/serve.js 8080   # or pick a port yourself
npm test                   # 93 tests, node's built-in runner
```

Requires Node 18+ for the test runner (the server itself needs nothing but Node). `npm install` is
only needed for the tests — it pulls in `jsdom` as a devDependency. **The app has no runtime
dependencies and no build step.**

Opening `index.html` straight from disk (`file://`) will not work: ES modules are blocked by CORS
without an HTTP origin. Any static server does — `python3 -m http.server`, `npx serve`, nginx, or
dropping the folder on GitHub Pages / Netlify / Cloudflare Pages (`CNAME` is already set to
`cinescopeai.fr`).

### Optional: the full catalogue

1. Create a free account at [themoviedb.org](https://www.themoviedb.org)
2. Settings → API → request a key (instant)
3. Open CineScope → ⚙️ Settings → paste the v4 read token or v3 key → **Test key**

Without a key you get the bundled catalogue (currently 54 films, chosen to span genres, decades and
quality bands — including films bad enough that the Skip verdict is reachable).

---

## Architecture

```
index.html            app shell: views, toasts, modal/palette/gate roots
css/                  tokens · base · components · views   (design system, no framework)
js/
  app.js              bootstrap: store, router, services, views, keyboard, PWA
  core/               store (persisted state + emitter) · hash router · emitter
  data/               catalog.js (bundled films) · taxonomy.js (advisories, verdicts, providers)
  analysis/           score · advisory · insights · similar → index.js pipeline
  services/           catalog-service · links (URL parsing) · tmdb (live) · provider (resolve chain)
  ui/                 dom (hyperscript) · charts · poster · components · modal · palette ·
                      settings · shortcuts · theme · sound · toast · views/*
  utils/              number · text · fuzzy · color · storage
tests/                93 tests, including a jsdom boot of the real app
tools/serve.js        zero-dependency static server
```

**Data flow.** Input → `parseInput` → `resolveInput` (catalogue first, live TMDb when a key exists)
→ `analyzeMovie` → report object → view render. The analysis pipeline is pure and synchronous, so
all of it is unit-tested in Node; the views are tested through a jsdom boot of `index.html`.

**Rendering.** A ~60-line hyperscript helper (`ui/dom.js`) builds every node. Dynamic text always
lands in `textContent`, so data from remote APIs cannot inject markup. No `innerHTML` with
user or API data anywhere.

---

## On data honesty

This project's previous version invented Rotten Tomatoes and Metacritic scores from a hash of the
title and generated content warnings the same way. CineScope does not do that:

- **Scores** are the published figures from each source. If a source did not report, the row says
  "no data" and is dropped from the blend.
- **Advisories** are hand-written for bundled films and explicitly labelled *modelled* for live ones.
- **Derived panels** (strength profile, watch plan, rewatch value, the "honest take") are labelled as
  modelled output and name the inputs they came from.
- **Poster art** for bundled films is generated locally rather than hot-linking artwork we have no
  rights to; live TMDb results use their own artwork and fall back to generated art on error.

Everything you save — watchlist, history, settings, API key — stays in `localStorage` on your
device. Nothing is sent anywhere except direct requests to `api.themoviedb.org` when you have added
a key.

## Tests

```
tests/score.test.js      weighting, missing sources, verdict tiers, critic/audience split
tests/advisory.test.js   normalisation, estimation, tolerance breaches
tests/fuzzy.test.js      matching, ranking, highlight segments, year-aware search
tests/links.test.js      every supported URL shape
tests/catalog.test.js    data integrity: severities, scales, ids, cert consistency
tests/provider.test.js   resolution chain, error paths, TMDb payload transforms
tests/store.test.js      persistence, history caps, router matching
tests/styles.test.js     token integrity, balanced CSS, the [hidden] override
tests/app.test.js        boots the real app in jsdom: landing → gate → report →
                         watchlist → compare → settings → theme → error states
```
