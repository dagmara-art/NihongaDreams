// Mobile-only checks (runs under the `mobile-chromium` project).

const { test, expect } = require('@playwright/test');

test.describe('Mobile menu', () => {
    test('hamburger toggles mobile menu open/close', async ({ page }) => {
        await page.goto('/index.html');

        const hamburger = page.locator('#hamburger');
        const menu = page.locator('#mobile-menu');
        const overlay = page.locator('#mobile-overlay');

        await expect(hamburger).toBeVisible();
        await expect(menu).toHaveAttribute('aria-hidden', 'true');

        await hamburger.click();
        await expect(menu).toHaveClass(/active/);
        await expect(menu).toHaveAttribute('aria-hidden', 'false');
        await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
        await expect(overlay).toHaveClass(/active/);

        // Overlay sits below the (full-width) menu — dispatching the click bypasses
        // hit-test interception which is fine since we're testing the handler, not
        // pointer geometry.
        await overlay.dispatchEvent('click');
        await expect(menu).not.toHaveClass(/active/);
        await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });

    test('clicking a link in the mobile menu closes it', async ({ page }) => {
        await page.goto('/index.html');
        await page.locator('#hamburger').click();
        await expect(page.locator('#mobile-menu')).toHaveClass(/active/);

        await page.locator('#mobile-menu a[href="#about"]').click();
        await expect(page.locator('#mobile-menu')).not.toHaveClass(/active/);
    });
});

test.describe('Mobile gallery / lightbox', () => {
    test('lightbox opens on tap and is dismissable', async ({ page }) => {
        await page.goto('/index.html');
        await expect(page.locator('#gallery .gallery-item').first()).toBeAttached({ timeout: 10_000 });

        await page.locator('#catalog').scrollIntoViewIfNeeded();
        await page.locator('#gallery .gallery-item').first().scrollIntoViewIfNeeded();
        await page.locator('#gallery .gallery-item').first().tap();
        await expect(page.locator('#lightbox')).toHaveClass(/active/);

        await page.locator('.lightbox-close').tap();
        await expect(page.locator('#lightbox')).not.toHaveClass(/active/);
    });
});
