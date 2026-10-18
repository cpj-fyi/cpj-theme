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
    await page.goto(base + '/13-network-of-teams/?member=none&access=false');
    assert.equal(await page.locator('[data-reading-state]').count(), 0);
    assert.equal(await page.locator('[data-pattern-pulse-url]').count(), 0);

    // Contract fixture, not live research. The companion API is validated separately.
    const summary = { patternId: '13', questionText: 'A fixture survey statement.', methodology: 'Fixture sample for browser checks.', status: 'available', sampleSize: 20, distribution: [2, 2, 2, 6, 8].map((count, i) => ({ value: i + 1, label: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'][i], count })), updatedAt: '2026-10-17T12:00:00Z' };
    await page.route('https://patternpulse.test/api/public/patterns/13', route => route.fulfill({ json: summary }));
    await page.goto(base + '/13-network-of-teams/?pulse=https://patternpulse.test');
    await page.locator('.pattern-pulse:not([hidden])').waitFor();
    assert.equal((await page.locator('.pattern-pulse-toggle').boundingBox()).height, 10);
    assert.equal(await page.locator('.pattern-pulse-strip > .pattern-pulse-tick').count(), 100);
    assert.deepEqual(await page.locator('.pattern-pulse-strip').evaluate(strip => [1, 2, 3, 4, 5].map(bin => strip.querySelectorAll('.pattern-pulse-bin-' + bin).length)), [10, 10, 10, 30, 40]);
    const inset = await page.locator('.pattern-pulse-strip').evaluate(strip => {
        const row = strip.getBoundingClientRect();
        const ground = strip.closest('.pattern-pulse-epigraph').getBoundingClientRect();
        return { left: row.left - ground.left, right: ground.right - row.right, top: row.top - ground.top };
    });
    assert.ok(inset.left >= 16 && inset.right >= 16 && inset.top >= 16, 'marks inset into epigraph ground');
    await page.screenshot({ path: 'dist/previews/patternpulse-collapsed.png' });
    assert.equal(await page.locator('.pattern-pulse-toggle').getAttribute('title'), null, 'no native tooltip');
    await page.locator('.pattern-pulse-toggle').hover();
    await page.locator('.pattern-pulse-tooltip').waitFor({ state: 'visible' });
    await page.screenshot({ path: 'dist/previews/patternpulse-hover.png' });
    await page.keyboard.press('Escape');
    await page.locator('.pattern-pulse-tooltip').waitFor({ state: 'hidden' });
    await page.mouse.move(0, 0);
    await page.locator('.pattern-pulse-toggle').focus();
    await page.locator('.pattern-pulse-tooltip').waitFor({ state: 'visible' });
    await page.keyboard.press('Enter');
    await page.locator('.pattern-pulse-tooltip').waitFor({ state: 'hidden' });
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
    const fractional = { ...summary, sampleSize: 13, distribution: [1, 2, 3, 3, 4].map((count, i) => ({ ...summary.distribution[i], count })) };
    await page.route('https://patternpulse.test/api/public/patterns/13', route => route.fulfill({ json: fractional }));
    await page.goto(base + '/13-network-of-teams/?pulse=https://patternpulse.test');
    await page.locator('.pattern-pulse:not([hidden])').waitFor();
    assert.deepEqual(await page.locator('.pattern-pulse-strip').evaluate(strip => [1, 2, 3, 4, 5].map(bin => strip.querySelectorAll('.pattern-pulse-bin-' + bin).length)), [8, 15, 23, 23, 31]);
    await page.unroute('https://patternpulse.test/api/public/patterns/13');
    await page.route('https://patternpulse.test/api/public/patterns/13', route => route.fulfill({ json: { patternId: '13', questionText: summary.questionText, methodology: summary.methodology, status: 'insufficient_data' } }));
    await page.goto(base + '/13-network-of-teams/?pulse=https://patternpulse.test');
    await page.locator('.pattern-pulse:not([hidden])').waitFor();
    assert.equal(await page.locator('.pattern-pulse-pending').count(), 100);
    assert.equal(await page.locator('.pattern-pulse-pending-label').isVisible(), true);
    await page.unroute('https://patternpulse.test/api/public/patterns/13');
    await page.route('https://patternpulse.test/api/public/patterns/13', route => route.fulfill({ json: { ...summary, sampleSize: 21 } }));
    await page.goto(base + '/13-network-of-teams/?pulse=https://patternpulse.test');
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('.pattern-pulse').count(), 0, 'invalid counts rejected without changing epigraph');
    assert.deepEqual(errors, []);
    console.log('Reader browser checks passed: six widths, sticky titles, cross-section pagination, font loading, access guards, PatternPulse contract and keyboard expansion.');
} finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
}
