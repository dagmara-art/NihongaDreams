# Tests — nihongadreams.com

End-to-end Playwright suite for the static site. The site itself ships as plain
HTML/CSS/JS with no runtime dependencies; everything in this folder is **dev
tooling only** and is never deployed.

## Layout

```
Tests/
  e2e/
    01-render.spec.js        page renders, gallery/exhibitions populate, no console errors
    02-interactions.spec.js  lightbox, language toggle, reservation form validation
    03-mobile.spec.js        hamburger menu + mobile gallery (Pixel 5 viewport)
    04-links.spec.js         every local href / <img src> resolves; sitemap ↔ artworks.json sync
    05-security.spec.js      CSP meta, rel=noopener, escapeHtml/sanitizeUrl unit tests, secret scan
  static-server.js           tiny Node static server used during the suite
  README.md                  this file
playwright.config.js         (at repo root, Playwright convention)
.githooks/pre-push           runs the suite before every `git push`
```

## One-time setup

```bash
# 1. Install dev deps (Playwright + browser; only Chromium needed)
npm install
PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright npx playwright install chromium

# 2. Wire up the pre-push hook so `git push` runs the suite automatically
git config core.hooksPath .githooks
```

To disable the auto-run: `git config --unset core.hooksPath`.

## Running locally

```bash
npm test                  # full suite, line reporter
npm run test:headed       # watch the browser
npm run test:ui           # Playwright UI mode (interactive)
npm run test:report       # open the last HTML report
```

The suite auto-starts `Tests/static-server.js` on port `8765`; you do not need
to run a server manually.

## Bypassing the pre-push hook

```bash
git push --no-verify       # skip just this push
SKIP_E2E=1 git push        # same effect via env var
```

Use sparingly — the hook is the only thing protecting `main` from regressions.

## Known accepted failures

Three tests in `04-links.spec.js` fail until the 19 newly-added artworks have
their image variants processed (`Original/`, `Preview/`, `Thumbnails/`):

- `index.html: every local link and image resolves`
- `every artwork in artworks.json has all 3 image variants on disk`
- `every gallery thumbnail returns HTTP 200`

These are real failures, not flakes — they will go green automatically once the
missing WebP files are added (see `CLAUDE.md` for the image-processing recipe).
Until then, push with `--no-verify`.

## What the suite does *not* cover

- Cross-browser (only Chromium / Pixel 5 emulation).
- Visual regression (no screenshot diffing).
- The Google Apps Script reservation backend (form submission is intercepted in
  `02-interactions.spec.js`; we never hit the real endpoint).
- Cookiebot consent flow (third-party widget, blocked by the test viewport).
