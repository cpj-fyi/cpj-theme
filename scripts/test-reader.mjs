import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { createPreviewServer } from './preview.mjs';

const server = createPreviewServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chromium' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
mkdirSync('dist/previews', { recursive: true });
try {
    for (const width of [320, 390, 768, 1024, 1100, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(base + '/13-network-of-teams/');
        await page.locator('.reader-pagination:not([hidden])').waitFor();
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `overflow at ${width}`);
        const font = await page.locator('.content > h2').first().evaluate(node => getComputedStyle(node).fontFamily);
        assert.match(font, /LTL Pixel/);
        assert.equal(new URL(await page.locator('.reader-pagination [rel="prev"]').getAttribute('href'), base).pathname, '/12-cooperation/');
        assert.equal(new URL(await page.locator('.reader-pagination [rel="next"]').getAttribute('href'), base).pathname, '/14-distributed-management/');
        assert.equal(await page.locator('.kg-button-card').isVisible(), false, 'legacy shortlink removed');
        await page.screenshot({ path: `dist/previews/reader-${width}.png` });
        await page.evaluate(() => window.scrollTo(0, 800));
        const positions = await page.evaluate(() => {
            const header = document.querySelector('.site-header').getBoundingClientRect();
            const title = document.querySelector(window.innerWidth > 1024 ? '.chapter-section-label' : '.mobile-book-title').getBoundingClientRect();
            return { headerBottom: header.bottom, titleTop: title.top, titleBottom: title.bottom };
        });
        assert.ok(positions.titleTop >= positions.headerBottom - 1 && positions.titleBottom < 900, `book title hidden at ${width}: ${JSON.stringify(positions)}`);
        await page.screenshot({ path: `dist/previews/reader-${width}-scrolled.png` });
    }
    for (const [path, prev, next] of [
        ['/introduction/', null, '/1-true-purpose/'],
        ['/1-true-purpose/', '/introduction/', '/2-rule-of-law/'],
        ['/12-cooperation/', '/11-pace-layers/', '/13-network-of-teams/'],
        ['/75-movable-everything/', '/74-whiteboards-at-intersections/', null]
    ]) {
        await page.goto(base + path);
        for (const [rel, expected] of [['prev', prev], ['next', next]]) {
            const link = page.locator(`.reader-pagination [rel="${rel}"]`);
            if (expected) assert.equal(new URL(await link.getAttribute('href'), base).pathname, expected);
            else assert.equal(await link.count(), 0);
        }
    }
    await page.goto(base + '/13-network-of-teams/');
    await page.locator('.reader-pagination').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'dist/previews/reader-pagination.png' });
    await page.locator('[data-reading-toggle]').click();
    await page.reload();
    assert.equal(await page.locator('[data-reading-toggle]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.chapter-list-link.is-current.is-read').count(), 1);
    await page.goto(base + '/13-network-of-teams/?member=another-reader');
    assert.equal(await page.locator('[data-reading-toggle]').getAttribute('aria-pressed'), 'false');
    await page.goto(base + '/13-network-of-teams/?member=none&access=false');
    assert.equal(await page.locator('[data-reading-state]').count(), 0);
    assert.equal(await page.locator('[data-pattern-pulse-url]').count(), 0);

    // Contract fixture, not live research. The companion API is validated separately.
    const summary = { patternId: '13', questionText: 'A fixture survey statement.', methodology: 'Fixture sample for browser checks.', status: 'available', sampleSize: 20, distribution: [2, 2, 2, 6, 8].map((count, i) => ({ value: i + 1, label: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'][i], count })), updatedAt: '2026-10-17T12:00:00Z' };
    await page.route('https://patternpulse.test/api/public/patterns/13', route => route.fulfill({ json: summary }));
    await page.goto(base + '/13-network-of-teams/?pulse=https://patternpulse.test');
    await page.locator('.pattern-pulse:not([hidden])').waitFor();
    assert.equal((await page.locator('.pattern-pulse-toggle').boundingBox()).height, 10);
    await page.locator('.pattern-pulse-toggle').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.pattern-pulse-finding').textContent(), '70% agree · 20 survey responses');
    assert.equal(await page.locator('.pattern-pulse-contribute').getAttribute('href'), 'https://patternpulse.test/patterns/13/use');
    await page.screenshot({ path: 'dist/previews/patternpulse-expanded.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.pattern-pulse').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'dist/previews/patternpulse-mobile.png' });
    await page.goto(base + '/13-network-of-teams/?pulse=https://patternpulse.test&member=none');
    await page.locator('.pattern-pulse:not([hidden])').waitFor();
    assert.equal(await page.locator('.pattern-pulse-contribute').count(), 0);
    await page.unroute('https://patternpulse.test/api/public/patterns/13');
    await page.route('https://patternpulse.test/api/public/patterns/13', route => route.fulfill({ json: { ...summary, sampleSize: 21 } }));
    await page.goto(base + '/13-network-of-teams/?pulse=https://patternpulse.test');
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('.pattern-pulse').isVisible(), false, 'invalid counts rejected');
    assert.deepEqual(errors, []);
    console.log('Reader browser checks passed: six widths, sticky titles, cross-section pagination, font loading, reading state, access guards, PatternPulse contract and keyboard expansion.');
} finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
}
