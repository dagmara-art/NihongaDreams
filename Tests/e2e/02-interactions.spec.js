// User-flow checks: lightbox, language toggle, mobile menu, reservation form.

const { test, expect } = require('@playwright/test');

test.describe('Lightbox interactions', () => {
    test('clicking gallery item opens lightbox; arrows navigate; Escape closes', async ({ page }) => {
        await page.goto('/index.html');
        await expect(page.locator('#gallery .gallery-item').first()).toBeAttached({ timeout: 10_000 });

        const lightbox = page.locator('#lightbox');
        await expect(lightbox).toHaveAttribute('aria-hidden', 'true');

        // The gallery is animated by IntersectionObserver — scroll it in and
        // bypass actionability since we're testing the click handler, not hit-testing.
        await page.locator('#catalog').scrollIntoViewIfNeeded();
        await page.locator('#gallery .gallery-item').first().scrollIntoViewIfNeeded();
        await page.locator('#gallery .gallery-item').first().click({ force: true });
        await expect(lightbox).toHaveClass(/active/);
        await expect(lightbox).toHaveAttribute('aria-hidden', 'false');

        const firstTitle = await page.locator('#caption-title').textContent();
        expect(firstTitle?.trim().length).toBeGreaterThan(0);

        // Next.
        await page.keyboard.press('ArrowRight');
        await expect.poll(async () => (await page.locator('#caption-title').textContent())?.trim()).not.toBe(firstTitle?.trim());

        // Previous returns to first.
        await page.keyboard.press('ArrowLeft');
        await expect.poll(async () => (await page.locator('#caption-title').textContent())?.trim()).toBe(firstTitle?.trim());

        // Escape closes.
        await page.keyboard.press('Escape');
        await expect(lightbox).not.toHaveClass(/active/);
        await expect(lightbox).toHaveAttribute('aria-hidden', 'true');
    });

    test('lightbox close button works and restores body scroll', async ({ page }) => {
        await page.goto('/index.html');
        await expect(page.locator('#gallery .gallery-item').first()).toBeAttached({ timeout: 10_000 });

        await page.locator('#catalog').scrollIntoViewIfNeeded();
        await page.locator('#gallery .gallery-item').first().scrollIntoViewIfNeeded();
        await page.locator('#gallery .gallery-item').first().click({ force: true });
        await expect(page.locator('#lightbox')).toHaveClass(/active/);
        await expect.poll(async () => await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

        await page.locator('.lightbox-close').click();
        await expect(page.locator('#lightbox')).not.toHaveClass(/active/);
        await expect.poll(async () => await page.evaluate(() => document.body.style.overflow)).toBe('');
    });
});

test.describe('Language toggle', () => {
    test('switches EN <-> PL, persists to localStorage, updates DOM', async ({ page, context }) => {
        await context.clearCookies();
        await page.goto('/index.html');

        await expect(page.locator('html')).toHaveAttribute('lang', /en|pl/);

        const initialLang = await page.evaluate(() => document.documentElement.lang);
        const otherLang = initialLang === 'en' ? 'pl' : 'en';

        await page.locator('#lang-toggle').click();
        await expect(page.locator('html')).toHaveAttribute('lang', otherLang);
        await expect(page.locator(`.lang-option.active`)).toHaveAttribute('data-lang', otherLang);

        // Persisted.
        const stored = await page.evaluate(() => localStorage.getItem('lang'));
        expect(stored).toBe(otherLang);

        // Reload picks up the saved language.
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('lang', otherLang);
    });

    test('Polish translations actually swap in', async ({ page }) => {
        await page.goto('/index.html');
        await page.evaluate(() => localStorage.setItem('lang', 'pl'));
        await page.reload();

        // "Strona główna" or "Katalog" should appear (PL nav)
        await expect(page.locator('.nav-links')).toContainText(/Katalog|Strona/i);
    });
});

test.describe('Reservation form validation', () => {
    test('blocks submission with empty fields and surfaces field errors', async ({ page }) => {
        await page.goto('/artwork.html?slug=mokuren-ichi');
        await expect(page.locator('#reservation-form')).toBeVisible();

        // Pre-fill nothing; click submit.
        await page.locator('#form-submit-btn').click();

        // We expect the form to have set aria-invalid on at least one of name/email/consent.
        const invalidCount = await page.locator('[aria-invalid="true"]').count();
        expect(invalidCount).toBeGreaterThan(0);

        // The form must NOT have been removed (i.e. submission did NOT proceed).
        await expect(page.locator('#reservation-form')).toBeVisible();
    });

    test('rejects an invalid email address', async ({ page }) => {
        await page.goto('/artwork.html?slug=mokuren-ichi');
        await expect(page.locator('#reservation-form')).toBeVisible();

        await page.fill('#rf-name', 'Test User');
        await page.fill('#rf-email', 'not-an-email');
        await page.check('#rf-consent');
        await page.locator('#form-submit-btn').click();

        await expect(page.locator('#rf-email')).toHaveAttribute('aria-invalid', 'true');
        await expect(page.locator('#reservation-form')).toBeVisible();
    });

    test('honeypot field is hidden from real users', async ({ page }) => {
        await page.goto('/artwork.html?slug=mokuren-ichi');
        await expect(page.locator('#reservation-form')).toBeVisible();

        const hp = page.locator('#rf-website');
        await expect(hp).toHaveCount(1);
        // Off-screen positioning OR display:none / visibility hidden are all acceptable.
        const isHidden = await hp.evaluate((el) => {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return cs.display === 'none'
                || cs.visibility === 'hidden'
                || r.width === 0
                || r.height === 0
                || r.left < 0
                || r.top < 0;
        });
        expect(isHidden).toBe(true);
    });

    test('_timestamp hidden field is populated for spam timing check', async ({ page }) => {
        await page.goto('/artwork.html?slug=mokuren-ichi');
        await expect(page.locator('#reservation-form')).toBeVisible();
        const ts = await page.locator('input[name="_timestamp"]').inputValue();
        expect(Number(ts)).toBeGreaterThan(1_700_000_000_000);
    });

    test('passes valid form data to network (intercepted, not actually sent)', async ({ page }) => {
        // Stub the Apps Script endpoint so we don't hit prod.
        await page.route('https://script.google.com/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success' }),
            });
        });

        await page.goto('/artwork.html?slug=mokuren-ichi');
        await expect(page.locator('#reservation-form')).toBeVisible();

        await page.fill('#rf-name', 'Playwright Tester');
        await page.fill('#rf-email', 'tester@example.com');
        await page.fill('#rf-message', 'Hello from automated test');
        await page.check('#rf-consent');

        const [request] = await Promise.all([
            page.waitForRequest((req) => req.url().startsWith('https://script.google.com/')),
            page.locator('#form-submit-btn').click(),
        ]);

        const payload = JSON.parse(request.postData() || '{}');
        expect(payload.name).toBe('Playwright Tester');
        expect(payload.email).toBe('tester@example.com');
        expect(payload.consent).toBe(true);
        expect(payload.artworkSlug).toBe('mokuren-ichi');

        // After success, the form children are hidden (per implementation).
        await expect(page.locator('.form-status.success')).toBeVisible();
    });
});

test.describe('Smooth-scroll anchors', () => {
    test('navbar anchor scrolls to section', async ({ page }) => {
        await page.goto('/index.html');
        await page.locator('.nav-links a[href="#about"]').click();
        // Wait for scroll to settle then verify hero is no longer at top of viewport.
        await page.waitForTimeout(800);
        const aboutTop = await page.locator('#about').evaluate((el) => el.getBoundingClientRect().top);
        expect(aboutTop).toBeLessThan(200);
    });
});
