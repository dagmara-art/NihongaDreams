// Security smoke tests: CSP headers/meta, no leaked secrets, XSS helpers behave.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..'); // repo root (Tests/e2e/ -> ..)

const REQUIRED_CSP_DIRECTIVES = [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
];

const checkCsp = async (page, urlPath) => {
    await page.goto(urlPath);
    const cspMeta = await page
        .locator('meta[http-equiv="Content-Security-Policy"]')
        .first()
        .getAttribute('content');
    expect(cspMeta, `CSP meta tag missing on ${urlPath}`).toBeTruthy();
    for (const d of REQUIRED_CSP_DIRECTIVES) {
        expect(cspMeta, `CSP on ${urlPath} missing directive: ${d}`).toContain(d);
    }
};

test.describe('Content Security Policy', () => {
    test('index.html has CSP with required directives', async ({ page }) => {
        await checkCsp(page, '/index.html');
    });
    test('artwork.html has CSP with required directives', async ({ page }) => {
        await checkCsp(page, '/artwork.html?slug=mokuren-ichi');
    });
    test('privacy.html has CSP with required directives', async ({ page }) => {
        await checkCsp(page, '/privacy.html');
    });
});

test.describe('External link safety', () => {
    test('every target=_blank link has rel="noopener" (and ideally noreferrer)', async ({ page }) => {
        const checkOnPage = async (url) => {
            await page.goto(url);
            await page.waitForLoadState('networkidle').catch(() => { /* ok */ });
            // Trigger exhibition rendering so its links exist.
            const offenders = await page.$$eval('a[target="_blank"]', (links) =>
                links
                    .filter((l) => {
                        const rel = (l.getAttribute('rel') || '').toLowerCase();
                        return !rel.includes('noopener');
                    })
                    .map((l) => l.outerHTML.slice(0, 200))
            );
            return offenders;
        };

        const offendersIndex = await checkOnPage('/index.html');
        expect(offendersIndex, `target=_blank without rel=noopener on index.html:\n${offendersIndex.join('\n')}`)
            .toEqual([]);

        const offendersArtwork = await checkOnPage('/artwork.html?slug=mokuren-ni');
        expect(offendersArtwork).toEqual([]);
    });
});

test.describe('XSS hardening (escapeHtml / sanitizeUrl)', () => {
    test('escapeHtml escapes all HTML metacharacters', async ({ page }) => {
        await page.goto('/index.html');
        const out = await page.evaluate(async () => {
            const m = await import('/js/shared/utils.js');
            return [
                m.escapeHtml('<script>alert(1)</script>'),
                m.escapeHtml(`"&'<>`),
                m.escapeHtml(undefined),
                m.escapeHtml(null),
                m.escapeHtml(123),
            ];
        });
        expect(out[0]).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(out[1]).toBe('&quot;&amp;&#39;&lt;&gt;');
        expect(out[2]).toBe('undefined');
        expect(out[3]).toBe('null');
        expect(out[4]).toBe('123');
    });

    test('sanitizeUrl rejects javascript:, data:, vbscript:', async ({ page }) => {
        await page.goto('/index.html');
        const out = await page.evaluate(async () => {
            const m = await import('/js/shared/utils.js');
            return {
                js: m.sanitizeUrl('javascript:alert(1)'),
                jsMixed: m.sanitizeUrl('JavaScript:alert(1)'),
                jsSpaces: m.sanitizeUrl('  javascript:alert(1)'),
                data: m.sanitizeUrl('data:text/html,<script>alert(1)</script>'),
                vb: m.sanitizeUrl('vbscript:msgbox(1)'),
                http: m.sanitizeUrl('http://example.com/x'),
                https: m.sanitizeUrl('https://example.com/x'),
                rel: m.sanitizeUrl('Data/foo.webp'),
                hash: m.sanitizeUrl('#section'),
                empty: m.sanitizeUrl(''),
            };
        });
        expect(out.js).toBe('#');
        expect(out.jsMixed).toBe('#');
        expect(out.jsSpaces).toBe('#');
        expect(out.data).toBe('#');
        expect(out.vb).toBe('#');
        expect(out.http).toBe('http://example.com/x');
        expect(out.https).toBe('https://example.com/x');
        expect(out.rel).toBe('Data/foo.webp');
        expect(out.hash).toBe('#section');
        expect(out.empty).toBe('#');
    });

    test('XSS payload in artwork title is rendered as text, not HTML, on artwork.html', async ({ page }) => {
        // Inject a poisoned dataset before the page-level fetch resolves.
        const poisonedSlug = 'xss-test-slug-' + Date.now();
        await page.route('**/Data/artworks.json*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'xss', slug: poisonedSlug, filename: 'mokuren-ichi',
                        title: '<img src=x onerror="window.__pwned=true">',
                        dimensions: '<b>10x10</b>', paper: 'Japanese paper Foo', priceDisplay: '',
                        currency: 'PLN', status: 'available', year: '', series: '<svg/onload=alert(1)>',
                        descriptionEn: '<script>window.__pwned=true</script>', descriptionPl: ''
                    },
                ]),
            });
        });

        let alerted = false;
        page.on('dialog', async (d) => { alerted = true; await d.dismiss(); });

        await page.goto(`/artwork.html?slug=${poisonedSlug}`);
        await expect(page.locator('.artwork-title')).toBeVisible();

        const pwned = await page.evaluate(() => Boolean(window.__pwned));
        expect(pwned, 'XSS payload executed (window.__pwned was set)').toBe(false);
        expect(alerted, 'XSS payload triggered an alert dialog').toBe(false);

        // The title should be visible AS TEXT containing the literal "<img" markup.
        const title = await page.locator('.artwork-title').textContent();
        expect(title).toContain('<img');
    });
});

test.describe('Source-tree secrets scan', () => {
    test('no AWS access keys / private key blocks in tracked source', () => {
        const scanDirs = ['js', 'tests'];
        const candidates = [
            'index.html', 'artwork.html', 'privacy.html',
            '404.html',
        ];
        const filesToScan = [];

        const walk = (dir) => {
            if (!fs.existsSync(dir)) return;
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) walk(full);
                else if (/\.(js|mjs|json|html|css)$/i.test(entry.name)) filesToScan.push(full);
            }
        };
        for (const d of scanDirs) walk(path.join(ROOT, d));
        for (const f of candidates) {
            const fp = path.join(ROOT, f);
            if (fs.existsSync(fp)) filesToScan.push(fp);
        }

        const patterns = [
            { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
            { name: 'PEM private key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
            { name: 'GitHub PAT', re: /ghp_[A-Za-z0-9]{36}/ },
            { name: 'Slack token', re: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
            { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{35}/ },
        ];

        const hits = [];
        for (const f of filesToScan) {
            const c = fs.readFileSync(f, 'utf8');
            for (const p of patterns) {
                if (p.re.test(c)) hits.push(`${p.name} in ${path.relative(ROOT, f)}`);
            }
        }
        expect(hits, `Possible secrets found:\n${hits.join('\n')}`).toEqual([]);
    });
});
