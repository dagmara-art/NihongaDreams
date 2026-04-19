// Link integrity: internal hrefs resolve, all <img src> resolve to real files.
// External (http/https) links are skipped — we only validate same-origin assets.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..'); // repo root (Tests/e2e/ -> ..)

const decode = (u) => {
    try { return decodeURIComponent(u); } catch { return u; }
};

const resolveLocalPath = (href) => {
    // Strip query/hash, decode, resolve relative to repo root.
    const clean = decode(href.split('?')[0].split('#')[0]);
    if (!clean) return null;
    return path.join(ROOT, clean);
};

const isLocal = (url) => {
    if (!url) return false;
    if (/^https?:\/\//i.test(url)) return false;
    if (/^mailto:/i.test(url)) return false;
    if (/^tel:/i.test(url)) return false;
    if (url.startsWith('#')) return false;
    if (url.startsWith('//')) return false;
    if (url.startsWith('data:')) return false;
    if (url.startsWith('javascript:')) return false;
    return true;
};

const checkPageLinks = async (page, urlPath) => {
    await page.goto(urlPath);

    // Wait for gallery & exhibitions to populate (they fetch JSON & render).
    await page.waitForLoadState('networkidle').catch(() => { /* ok */ });

    const links = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    const imgs = await page.$$eval('img[src]', (els) => els.map((i) => i.getAttribute('src')));

    const missing = [];
    for (const href of links) {
        if (!isLocal(href)) continue;
        const fp = resolveLocalPath(href);
        if (!fp) continue;
        if (!fs.existsSync(fp)) missing.push({ kind: 'href', value: href, fp });
    }
    for (const src of imgs) {
        if (!isLocal(src)) continue;
        const fp = resolveLocalPath(src);
        if (!fp) continue;
        if (!fs.existsSync(fp)) missing.push({ kind: 'img', value: src, fp });
    }

    return missing;
};

test.describe('Link / asset integrity', () => {
    test('index.html: every local link and image resolves', async ({ page }) => {
        const missing = await checkPageLinks(page, '/index.html');
        expect(
            missing,
            `Missing assets referenced by index.html:\n${missing.map((m) => `  [${m.kind}] ${m.value}`).join('\n')}`
        ).toEqual([]);
    });

    test('artwork.html (mokuren-ichi): every local link and image resolves', async ({ page }) => {
        const missing = await checkPageLinks(page, '/artwork.html?slug=mokuren-ichi');
        expect(
            missing,
            `Missing assets referenced by artwork.html:\n${missing.map((m) => `  [${m.kind}] ${m.value}`).join('\n')}`
        ).toEqual([]);
    });

    test('privacy.html: every local link and image resolves', async ({ page }) => {
        const missing = await checkPageLinks(page, '/privacy.html');
        expect(
            missing,
            `Missing assets referenced by privacy.html:\n${missing.map((m) => `  [${m.kind}] ${m.value}`).join('\n')}`
        ).toEqual([]);
    });

    test('every artwork in artworks.json has all 3 image variants on disk', async ({ request }) => {
        const resp = await request.get('/Data/artworks.json');
        expect(resp.ok()).toBeTruthy();
        const arts = await resp.json();

        const missing = [];
        for (const a of arts) {
            for (const folder of ['Thumbnails', 'Preview', 'Original']) {
                const p = path.join(ROOT, 'Data', 'Lightbox_new', folder, `${a.filename}.webp`);
                if (!fs.existsSync(p)) missing.push(`${folder}/${a.filename}.webp`);
            }
        }
        expect(
            missing,
            `Artworks.json references images that don't exist on disk:\n${missing.join('\n')}`
        ).toEqual([]);
    });

    test('sitemap.xml stays in sync with artworks.json', async ({ request }) => {
        const [arts, sitemap] = await Promise.all([
            request.get('/Data/artworks.json').then((r) => r.json()),
            request.get('/sitemap.xml').then((r) => r.text()),
        ]);
        const sitemapSlugs = new Set(
            [...sitemap.matchAll(/artwork\.html\?slug=([^<&]+)/g)].map((m) => decode(m[1]))
        );
        const jsonSlugs = new Set(arts.map((a) => a.slug));

        const missingFromSitemap = [...jsonSlugs].filter((s) => !sitemapSlugs.has(s));
        const orphanInSitemap = [...sitemapSlugs].filter((s) => !jsonSlugs.has(s));

        expect(missingFromSitemap, `Slugs in artworks.json missing from sitemap: ${missingFromSitemap.join(', ')}`)
            .toEqual([]);
        expect(orphanInSitemap, `Slugs in sitemap not present in artworks.json: ${orphanInSitemap.join(', ')}`)
            .toEqual([]);
    });

    test('every gallery thumbnail returns HTTP 200', async ({ page }) => {
        const failures = [];
        page.on('response', (resp) => {
            const url = resp.url();
            if (/Data\/Lightbox_new\/Thumbnails\/.+\.webp/.test(url) && resp.status() >= 400) {
                failures.push(`${resp.status()} ${url}`);
            }
        });

        await page.goto('/index.html');
        await page.waitForLoadState('networkidle');

        // Force lazy-loaded thumbnails into view.
        await page.evaluate(async () => {
            await new Promise((r) => setTimeout(r, 200));
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise((r) => setTimeout(r, 800));
            window.scrollTo(0, 0);
            await new Promise((r) => setTimeout(r, 200));
        });

        expect(failures, `Broken thumbnails:\n${failures.join('\n')}`).toEqual([]);
    });
});
