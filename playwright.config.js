// Playwright config for nihongadreams.com E2E suite.
// The site is pure static HTML/CSS/JS — we boot `python3 -m http.server` and run
// the tests against it. Headless Chromium only (keeps install ~100MB).

const { defineConfig, devices } = require('@playwright/test');

const PORT = 8765;
const BASE_URL = `http://127.0.0.1:${PORT}`;

module.exports = defineConfig({
    testDir: './Tests/e2e',
    timeout: 30_000,
    outputDir: './Tests/test-results',
    expect: { timeout: 5_000 },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI
        ? [['list'], ['html', { open: 'never', outputFolder: 'Tests/playwright-report' }]]
        : [['list'], ['html', { open: 'never', outputFolder: 'Tests/playwright-report' }]],

    use: {
        baseURL: BASE_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        // Stabilizes click-targets by disabling reveal/parallax CSS transitions.
        reducedMotion: 'reduce',
    },

    projects: [
        {
            name: 'desktop-chromium',
            testIgnore: /mobile.*\.spec\.js/,
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile-chromium',
            testMatch: /mobile.*\.spec\.js/,
            // Pixel 5 emulates a mobile viewport on Chromium (no WebKit needed).
            use: { ...devices['Pixel 5'] },
        },
    ],

    webServer: {
        command: `node Tests/static-server.js`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        stdout: 'ignore',
        stderr: 'pipe',
        timeout: 10_000,
        env: { PORT: String(PORT) },
    },
});
