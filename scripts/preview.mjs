// Local fixtures exercise actual templates. This is not a Ghost/auth server.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chapters = JSON.parse(fs.readFileSync(path.join(root, 'scripts/fixtures/chapters.json')));
const hbs = Handlebars.create();
function registerPartials(dir) {
    for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, file.name);
        if (file.isDirectory()) registerPartials(full);
        else if (file.name.endsWith('.hbs')) hbs.registerPartial(path.relative(path.join(root, 'partials'), full).replace(/\.hbs$/, ''), fs.readFileSync(full, 'utf8'));
    }
}
registerPartials(path.join(root, 'partials'));
hbs.registerHelper('asset', value => '/assets/' + value);
hbs.registerHelper('url', function () { return this.url || '/'; });
hbs.registerHelper('post_class', function () { return this.tags.map(tag => 'tag-' + tag.slug).join(' '); });
hbs.registerHelper('content', function () { return new hbs.SafeString(this.html); });
hbs.registerHelper('post', function (options) { return options.fn(this); });
hbs.registerHelper('match', function (a, b, options) { return a === b ? options.fn(this) : options.inverse(this); });
hbs.registerHelper('has', function (options) {
    const wanted = (options.hash.tag || '').split(',').map(s => s.trim());
    return this.tags?.some(tag => wanted.includes(tag.slug)) ? options.fn(this) : options.inverse(this);
});
hbs.registerHelper('foreach', function (items, options) {
    return (items || []).map((item, index) => options.fn(item, { data: { ...options.data, index, first: index === 0, last: index === items.length - 1 } })).join('');
});
hbs.registerHelper('get', function (_resource, options) {
    const filter = options.hash.filter;
    const items = filter.includes('[') ? chapters : chapters.filter(chapter => chapter.tags.some(tag => filter === 'tag:' + tag.slug));
    return options.fn({ pages: items }, { blockParams: [items] });
});
hbs.registerHelper('is', function (...args) { const options = args.pop(); return options.inverse(this); });
const reader = hbs.compile(fs.readFileSync(path.join(root, 'partials/chapter-reader.hbs'), 'utf8'));
const header = hbs.compile(fs.readFileSync(path.join(root, 'partials/header.hbs'), 'utf8'));

export function renderPreview(url, origin) {
    const chapter = chapters.find(item => item.url === url.pathname) || chapters.find(item => item.title.startsWith('13.'));
    const member = url.searchParams.get('member') === 'none' ? null : { uuid: url.searchParams.get('member') || 'preview-reader', name: 'Preview reader' };
    const access = url.searchParams.get('access') !== 'false';
    const demo = url.searchParams.get('pulse') === 'demo';
    const data = { site: { url: origin }, custom: { book_title: 'Hidden Patterns', patternpulse_url: demo ? origin : url.searchParams.get('pulse') || '' }, member };
    const paragraphs = Array.from({ length: 28 }, (_, i) => `${i % 4 === 0 ? '<h2>A useful pattern</h2>' : ''}<p>This is preview text for checking reading, navigation, and layout. Teams need enough context to make decisions together. The chapter title should remain visible as the text moves through the reading column.</p>`).join('');
    const html = `<blockquote class="kg-blockquote-alt">Hierarchies are dead, but networks need structure</blockquote><h2>Patterns in practice</h2><h3>Start with your team</h3><h4>Make a small change</h4>${access ? paragraphs : '<div class="gh-post-upgrade-cta">Fixture: this chapter requires access.</div>'}<div class="kg-card kg-button-card"><a href="https://hd-pt.com/${Number(chapter.title.match(/^\d+/)?.[0] || 0) + 1}?ref=cpj.fyi">Next chapter</a></div>`;
    const context = { ...chapter, html, access };
    const styles = ['screen', 'native-resources', 'typography', 'book-reader', 'reading-state', 'pattern-pulse'].filter(name => fs.existsSync(path.join(root, 'assets/css', name + '.css')));
    const scripts = ['moonphase', 'main', 'native-resources', 'book-reader', 'reading-state', 'pattern-pulse'].filter(name => fs.existsSync(path.join(root, 'assets/js', name + '.js')));
    const body = url.pathname === '/preview-post/' ? `<article class="post"><div class="post-body"><div class="content">${html}</div></div></article>` : reader(context, { data });
    const notice = demo ? '<p style="margin:16px 24px;font:12px/1.4 monospace">Local preview · sample text and simulated PatternPulse data. No research results or declarations are recorded here.</p>' : '';
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reader preview</title>${styles.map(name => `<link rel="stylesheet" href="/assets/css/${name}.css">`).join('')}</head><body class="page-template tag-${chapter.tags[0].slug}"><div class="site-wrapper">${header(context, { data })}<main class="site-main">${notice}${body}</main></div>${scripts.map(name => `<script src="/assets/js/${name}.js"></script>`).join('')}</body></html>`;
}

export function createPreviewServer() {
    return http.createServer((req, res) => {
        const origin = 'http://' + req.headers.host;
        const url = new URL(req.url, origin);
        const pattern = url.pathname.match(/^\/api\/public\/patterns\/(\d+)$/);
        if (pattern) {
            const summary = { patternId: pattern[1], questionText: 'A sample statement about using this pattern.', methodology: 'Preview fixture only. These simulated counts are not research findings.', status: 'available', sampleSize: 20, distribution: [2, 2, 2, 6, 8].map((count, i) => ({ value: i + 1, label: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'][i], count })) };
            res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(summary)); return;
        }
        if (/^\/patterns\/\d+\/use$/.test(url.pathname)) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Contribution preview</title><body style="max-width:600px;margin:64px auto;padding:24px;font:18px/1.6 system-ui"><h1>Contribution preview</h1><p>On the deployed PatternPulse app, this opens a consent form and an optional screener. This local theme preview does not save research declarations.</p><p><a href="/13-network-of-teams/?pulse=demo">Back to the reader</a></p></body></html>'); return;
        }
        if (url.pathname.startsWith('/assets/')) {
            const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
            if (!file.startsWith(path.join(root, 'assets') + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
            const type = { '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(file)] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(file).pipe(res); return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(renderPreview(url, origin));
    });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const port = Number(process.env.PREVIEW_PORT || 4173);
    createPreviewServer().listen(port, '127.0.0.1', () => console.log(`Reader preview: http://127.0.0.1:${port}/13-network-of-teams/`));
}
