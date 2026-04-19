// Render-level checks: pages boot, key DOM appears, no console errors.

const { test, expect } = require('@playwright/test');

const collectConsoleErrors = (page) => {
    const errors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => {
        errors.push(`pageerror: ${err.message}`);
    });
    return errors;
};

// Treat external (third-party) load failures as warnings, not test failures.
// Cookiebot, GA, fonts may be blocked offline or by ad-blockers; the site itself
// must still work. Anything served from our own origin must NOT error.
const isOwnOriginError = (msgText) => {
    if (/script\.google\.com/.test(msgText)) return false;
    if (/cookiebot|googletagmanager|google-analytics|gstatic|googleapis/.test(msgText)) return false;
    return true;
};

test.describe('Render: index.html', () => {
    test('boots without console errors and renders core sections', async ({ page }) => {
        const errors = collectConsoleErrors(page);

        await page.goto('/index.html');

        await expect(page).toHaveTitle(/Dagmara Dreams of Nihonga/i);

        await expect(page.locator('#hero')).toBeVisible();
        await expect(page.locator('#about')).toBeAttached();
        await expect(page.locator('#nihonga')).toBeAttached();
        await expect(page.locator('#exhibitions')).toBeAttached();
        await expect(page.locator('#catalog')).toBeAttached();
        await expect(page.locator('#contact')).toBeAttached();

        await expect(page.locator('#navbar')).toBeVisible();
        await expect(page.locator('#lang-toggle')).toBeVisible();

        const ownErrors = errors.filter(isOwnOriginError);
        expect(ownErrors, `Console errors:\n${ownErrors.join('\n')}`).toEqual([]);
    });

    test('gallery populates with artwork tiles', async ({ page }) => {
        await page.goto('/index.html');

        await expect(page.locator('#gallery .gallery-item').first()).toBeVisible({ timeout: 10_000 });

        const itemCount = await page.locator('#gallery .gallery-item').count();
        expect(itemCount).toBeGreaterThan(0);

        // Each tile must have a slug-bearing href and an image.
        const firstItem = page.locator('#gallery .gallery-item').first();
        const href = await firstItem.getAttribute('href');
        expect(href).toMatch(/^artwork\.html\?slug=[a-z0-9-]+$/);

        await expect(firstItem.locator('img')).toHaveAttribute('src', /Data\/Lightbox_new\/Thumbnails\/.+\.webp$/);
        await expect(firstItem.locator('img')).toHaveAttribute('alt', /.+/);
    });

    test('exhibitions section renders cards', async ({ page }) => {
        await page.goto('/index.html');

        await expect(page.locator('#exhibitions-grid .exhibition-card').first()).toBeVisible({ timeout: 10_000 });

        const yearBtns = await page.locator('.exhibitions-year-btn').count();
        expect(yearBtns).toBeGreaterThan(0);

        const activeBtns = await page.locator('.exhibitions-year-btn.active').count();
        expect(activeBtns).toBe(1);
    });

    test('email is obfuscated and assembled at runtime', async ({ page, request }) => {
        // Raw HTML source must NOT contain the email — fetch directly to bypass JS.
        const raw = await (await request.get('/index.html')).text();
        expect(raw).not.toContain('dagmaraokla.art@gmail.com');

        // After JS runs the email appears in the DOM.
        await page.goto('/index.html');
        await expect(page.locator('#email-display')).toContainText('dagmaraokla.art@gmail.com');
        await expect(page.locator('#email-link')).toHaveAttribute('href', 'mailto:dagmaraokla.art@gmail.com');
    });
});

test.describe('Render: artwork.html', () => {
    test('renders artwork detail with valid slug', async ({ page }) => {
        const errors = collectConsoleErrors(page);

        // Pick a slug we know has images shipped.
        await page.goto('/artwork.html?slug=mokuren-ichi');

        await expect(page.locator('.artwork-title')).toContainText(/Mokuren/i);
        await expect(page.locator('#artwork-main-image')).toHaveAttribute(
            'src',
            /Data\/Lightbox_new\/Preview\/mokuren-ichi\.webp$/
        );
        await expect(page.locator('.status-badge')).toBeVisible();
        await expect(page.locator('.artwork-details')).toBeVisible();

        // Reservation form must be present (artwork is "available").
        await expect(page.locator('#reservation-form')).toBeVisible();
        await expect(page.locator('#rf-name')).toBeVisible();
        await expect(page.locator('#rf-email')).toBeVisible();
        await expect(page.locator('#rf-consent')).toBeVisible();

        const ownErrors = errors.filter(isOwnOriginError);
        expect(ownErrors, `Console errors:\n${ownErrors.join('\n')}`).toEqual([]);
    });

    test('shows not-found state for unknown slug', async ({ page }) => {
        await page.goto('/artwork.html?slug=does-not-exist');
        await expect(page.locator('.page-state h1')).toContainText(/not found|znalezione/i);
        await expect(page.locator('.page-state a')).toHaveAttribute('href', /index\.html#catalog/);
    });

    test('artwork rendered for sold piece hides reservation form', async ({ page, request }) => {
        // Find any sold piece to use.
        const json = await request.get('/Data/artworks.json');
        const arts = await json.json();
        const sold = arts.find((a) => a.status === 'sold');
        test.skip(!sold, 'No sold artworks in dataset');

        await page.goto(`/artwork.html?slug=${sold.slug}`);
        await expect(page.locator('.reservation-sold')).toBeVisible();
        await expect(page.locator('#reservation-form')).toHaveCount(0);
    });
});

test.describe('Render: privacy.html', () => {
    test('static page loads', async ({ page }) => {
        const errors = collectConsoleErrors(page);
        await page.goto('/privacy.html');
        await expect(page).toHaveTitle(/Privacy Policy/i);
        const ownErrors = errors.filter(isOwnOriginError);
        expect(ownErrors).toEqual([]);
    });
});
