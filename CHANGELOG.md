Changelog:

## JS Modularization (April 2026)

Migrated page-specific application logic from inline `<script>` blocks in `index.html` and `artwork.html` into ES modules (`type="module"`) under a new `js/` directory. Third-party consent/analytics scripts and JSON-LD remain inline in `<head>` as required by those services.

### Why

All ~1,900 lines of app JS lived inline in two HTML files, sharing a single global scope with implicit execution ordering. This caused a production-breaking TDZ (Temporal Dead Zone) bug when `setLanguage()` was changed from async to sync — it referenced `exhibitionsData` before its `let` declaration, halting all JS execution and rendering pages blank. ES modules with explicit imports/exports create real scope boundaries that greatly reduce this class of bugs.

### What changed

**Removed:** ~1,850 lines of inline application JS from `index.html` and `artwork.html`.

**Added:** 14 JS module files:

```
js/
  shared/                        Shared across both pages
    utils.js                     escapeHtml, sanitizeUrl, getEmail, trapFocus
    analytics.js                 trackEvent, trackEventOnce (wraps window.gtag)
    i18n.js                      createI18n() factory with onLanguageChange callback
    image-protection.js          Right-click / drag prevention on images

  pages/artwork/                 artwork.html modules
    translations.js              EN/PL translation strings
    artwork.js                   Data loading, rendering, single-image lightbox
    reservation.js               Form validation, honeypot, submission with 15s timeout
    init.js                      Entry point — wires modules, boots page

  pages/index/                   index.html modules
    translations.js              EN/PL translation strings
    exhibitions.js               Load, render, detail modal, photo gallery
    gallery.js                   Artwork grid, lightbox with zoom/pan/swipe
    scroll.js                    Navbar glass effect, parallax, scroll depth tracking
    mobile-menu.js               Hamburger toggle with focus trap
    init.js                      Entry point — wires modules, boots page
```

Each HTML file now has a single script tag:
```html
<script type="module" src="js/pages/index/init.js"></script>
<script type="module" src="js/pages/artwork/init.js"></script>
```

### Circular dependency resolution

`setLanguage()` needed to call `renderExhibitions()`, but exhibitions data was declared in a different scope. Resolved with a callback pattern: `createI18n()` accepts a mutable `onLanguageChange` callback, wired at runtime in `init.js` after both modules are initialized. No circular imports.

### Deduplicated code

These functions were duplicated between the two pages and are now shared:
- `escapeHtml()` — consolidated to the robust regex-based version
- `getEmail()` — email obfuscation
- `trackEvent()` / `trackEventOnce()` — Google Analytics wrappers
- Language detection logic (browser language, localStorage)
- Image protection (contextmenu/drag prevention)

### Local development

ES modules require a web server due to browser CORS policy on `file://`. Use:
```
python3 -m http.server
```
or VS Code Live Server extension.

### CSP

No CSP changes needed — `'self'` in `script-src` already covers the new `.js` files. `'unsafe-inline'` remains for the third-party Cookiebot/GA consent scripts in `<head>`.

---

- added new reservation flow for each work
- updated reservation flow to improve UX
