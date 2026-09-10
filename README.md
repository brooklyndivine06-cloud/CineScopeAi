# Anugrah A — Personal Portfolio

A long-form, highly interactive developer portfolio built as a **personal digital
experience**, not an online résumé. IDAM (the property discovery platform) is the
flagship case study: visitors walk through the problem, the interactive product
preview, the feature architecture, authentication, search, the enquiry flow, visit
scheduling, and the Velappan AI guide.

> Built with curiosity. Designed with intention.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 15** (App Router, static export) + **TypeScript** |
| Styling | **Tailwind CSS 4** (design tokens in `app/globals.css`) |
| Motion | **GSAP + ScrollTrigger** (chapters, parallax, pinning), **Lenis** (smooth scroll), **Motion** (Framer) for UI transitions |
| Icons | **Lucide** + a few inline brand marks (`components/brand.tsx`) |
| Fonts | Self-hosted variable fonts (Space Grotesk / Inter / JetBrains Mono) in `public/fonts` |
| Data | Live **GitHub API** (profile + repos), with graceful fallback |

The motion system is intentionally disciplined — one consistent language
(clip reveals, word staggers, 0.9s cubic-bezier eases, electric-blue accents) —
and every major animation *explains the work* rather than decorating it.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build (static export to `out/`):

```bash
npm run build      # outputs out/
npm run resume     # regenerate the PDF résumé (public/anugrah-a-resume.pdf)
```

## Deploy

- **GitHub Pages** — this repo deploys from the `main` branch root. The built
  static export is committed to the repo root, so after any content change run:

  ```bash
  npm run build   # produces out/
  npm run sync    # copies out/* into the repo root
  git add -A && git commit -m "update site" && git push
  ```

  One-time setup: *Settings → Pages → Source: Deploy from a branch → main / (root)*.
  The custom domain comes from `CNAME` (`cinescopeai.fr`).
- **Vercel** — import the repo; the default `output: 'export'` static output works
  out of the box (no sync step needed there).

## Where to edit content

Almost everything lives in **`lib/site.ts`**:

- `SITE` — name, school, **LinkedIn URL**, **email**, GitHub, IDAM link, résumé path
- `TECH` — the 16 technologies in the interactive stack universe (categories, tags, "used for")
- `LISTINGS` — the fictional property inventory used by the browser preview,
  search demo and property detail (safe to extend)
- `ARCH_NODES`, `VISIT_SLOTS`, `CERTIFICATIONS`, `PROCESS_STEPS`, `EXPLORING`,
  `CHAPTERS`, `ABOUT_COPY`, `PHILOSOPHY`

Other useful places:

- `components/Hero.tsx` — hero copy + portrait panel. **To use a real photo:**
  drop a file at `public/images/hero-panel.jpg` (or change the `src` there).
- `components/idam/*` — the IDAM case-study sections (preview, architecture,
  auth, search, property, enquiry, visit, Velappan, engineering).
- `components/Contact.tsx` — contact form. With `SITE.email` set it opens a
  pre-filled mailto; without it, the message is copied to the clipboard.
- `app/layout.tsx` — page title, description, OG image.

## Sections

Preloader → Hero → Intro → **CH 01 The Person** (About, Philosophy) →
**CH 02 The Builder** (Skills universe, Education) → **CH 03 The Product**
(IDAM: overview, problem, interactive preview, architecture, auth, search,
property, enquiry, visit scheduling, Velappan AI, engineering) →
**CH 04 The Process** (horizontal "How I Build") → **CH 05 The Journey**
(Certifications, interactive résumé, Currently Exploring, marquee, GitHub,
Future experiments) → **CH 06 What's Next** (Contact) → Footer.

Extras: custom cursor (desktop only), scroll-aware navbar + full menu overlay,
canvas grid/particle background with cursor distortion, chapter progress
indicator, and an easter egg — type **ANUGRAH** anywhere.

Motion respects `prefers-reduced-motion`, and the custom cursor/3D tilts are
disabled on touch devices (mobile gets its own layouts, not a scaled desktop).

## Notes & honesty guardrails

- No fake credentials: certifications show issuer + "COMPLETED" only (add real
  credential IDs in `lib/site.ts` if you have them).
- GitHub numbers are fetched live — never hard-coded.
- The IDAM preview uses a small fictional inventory (`LISTINGS`) that mirrors
  the live product's real filter set (budget, bedrooms, type, furnishing,
  verified) and visit slots (9:00 AM – 5:00 PM).
