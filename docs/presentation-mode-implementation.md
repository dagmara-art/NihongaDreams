# Shidare Presentation Lightbox Feature

## Overview
This feature introduced a "Presentation Mode" for the gallery lightbox. Instead of showing the raw, tightly-cropped artwork image immediately upon opening the lightbox, it shows a curated, framed "presentation" image (with a soft background, drop shadow, and typography). When the user clicks to zoom, it seamlessly swaps to the high-resolution original image for detailed inspection, and swaps back when zooming out.

## Implementation Details

### 1. Asset Tier
A new optional image tier was added: `Data/Lightbox_new/Presentation/`.
- Images in this folder should be WebP format.
- They are used as the initial lightbox view if specified in the artwork data.

### 2. Data Structure (`Data/artworks.json`)
An optional `presentationFilename` property was added to artwork entries.
```json
{
  "id": "27",
  "slug": "shidare-1",
  "filename": "shidare-1",
  "presentationFilename": "shidare-1",
  "title": "Shidare 1",
  "status": "sold"
  // ...
}
```
If `presentationFilename` is present, the gallery uses it. If omitted, it falls back to the standard `Preview` image.

### 3. Gallery Logic (`js/pages/index/gallery.js`)
- `getDisplaySrc(artwork)`: Helper function to determine whether to load the `Presentation` or `Preview` image.
- `updateLightboxImage()`: Sets the initial `src` and a new `data-display-src` attribute on the `#lightbox-image`. It also toggles a `has-presentation-image` class on the container.
- `enterZoom()` and `exitZoom()`: Helpers that handle swapping the image `src` between `dataset.highres` (Original) and `dataset.displaySrc` (Presentation/Preview) when the user clicks or scrolls to zoom.

### 4. CSS Adjustments (`index.html`)
Scoped CSS was added to ensure the presentation image (which has a different aspect ratio due to the background frame) doesn't push the caption and CTA off-screen:
```css
.lightbox-image-container.has-presentation-image:not(.zoomed) .lightbox-image {
    max-height: 72vh;
    max-height: 72dvh;
}

@media (max-width: 768px) {
    .lightbox-image-container.has-presentation-image:not(.zoomed) .lightbox-image {
        max-height: 60vh;
        max-height: 60dvh;
    }
}
```

### 5. Playwright Testing
- `Tests/e2e/04-links.spec.js`: Updated to verify that if `presentationFilename` is defined, the corresponding WebP file exists on disk.
- `Tests/e2e/01-render.spec.js`: Added a specific test (`Shidare 1 opens with presentation image and zooms to original`) to verify the source-swapping behavior during zoom interactions.

## Lessons Learned & Notes for Future
- **Event Interception:** When writing E2E tests for the gallery, the `gallery-item-overlay` or loading spinners can intercept pointer events. Using `locator.dispatchEvent('click')` is sometimes necessary to bypass CSS transition states in Playwright.
- **Mobile Viewport:** The presentation images include built-in padding and text. On mobile, this makes the actual artwork quite small. If this feature is rolled out globally, consider a mobile-specific presentation template (e.g., text below the image instead of on the side) or bypassing presentation mode on small screens.
- **Performance:** Swapping `src` on zoom causes a brief flash if the high-res image isn't cached. The current implementation relies on the browser caching the `Original` image, but preloading it when the lightbox opens might provide a smoother transition.