const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Handlebars = require('handlebars');
const root = path.join(__dirname, '..');
const headSource = fs.readFileSync(path.join(root, 'default.hbs'), 'utf8').match(/<head>([\s\S]*?)<\/head>/)[1];
const art = 'https://art.example.test';
const site = {title: 'CPJ', description: 'Site description', url: 'https://www.cpj.fyi', facebook: 'publisher', twitter: '@publisher'};
const originalPost = {slug: 'autonomy', title: 'Hierarchy & autonomy', excerpt: 'A public excerpt', published_at: '2026-11-11T12:00:00.000Z', updated_at: '2026-11-12T12:00:00.000Z', primary_author: {name: 'Clay Parker Jones', twitter: '@clay', facebook: 'clay'}, tags: [{name: 'Essays', visibility: 'public'}, {name: '#private', visibility: 'internal'}]};

function render({context = 'post', post = {}, artUrl = art} = {}) {
    const h = Handlebars.create();
    const calls = [];
    const entry = {...originalPost, ...post};
    h.registerPartial('fonts', '');
    h.registerPartial('post-social-meta', fs.readFileSync(path.join(root, 'partials/post-social-meta.hbs'), 'utf8'));
    h.registerHelper('asset', value => '/assets/' + value);
    h.registerHelper('is', function (names, options) { return names.split(',').includes(context) ? options.fn(this) : options.inverse(this); });
    h.registerHelper('post', function (options) { return options.fn(entry); });
    // Ghost's meta helpers are root-context helpers: calling them inside #post
    // can resolve the site title instead. Use the entry's explicit fields.
    h.registerHelper('meta_title', () => site.title);
    h.registerHelper('meta_description', () => site.description);
    h.registerHelper('excerpt', function () { return this.custom_excerpt || this.excerpt || ''; });
    h.registerHelper('url', function () { return site.url + '/essays/' + this.slug + '/'; });
    h.registerHelper('img_url', value => new URL(value, site.url).href);
    h.registerHelper('date', value => value);
    h.registerHelper('social_url', function (options) { return 'https://www.facebook.com/' + this[options.hash.type]; });
    h.registerHelper('foreach', function (values, options) { return (values || []).filter(value => value.visibility !== 'internal').map(value => options.fn(value)).join(''); });
    h.registerHelper('tags', function () { return (this.tags || []).filter(tag => tag.visibility !== 'internal').map(tag => tag.name).join(', '); });
    // Model Ghost's documented exclusion boundary. This is a template regression
    // test, not a full Ghost server; deployed HTML must also be checked.
    h.registerHelper('ghost_head', function (options) {
        calls.push(options.hash.exclude || '');
        const common = '<link rel="canonical" href="https://www.cpj.fyi/essays/autonomy/"><meta name="description" content="SEO"><script type="application/ld+json">{}</script><link rel="alternate" type="application/rss+xml"><script data-ghost="https://www.cpj.fyi"></script><script src="cards.min.js"></script><style id="custom-injection"></style>';
        const native = '<meta property="og:image" content="' + (entry.og_image || entry.feature_image || 'https://www.cpj.fyi/Site-Image.png') + '"><meta name="twitter:image" content="' + (entry.twitter_image || entry.feature_image || 'https://www.cpj.fyi/Site-Image.png') + '"><meta name="twitter:card" content="summary_large_image">';
        return new h.SafeString(common + (options.hash.exclude === 'social_data' ? '' : native));
    });
    const html = h.compile(headSource)({post: entry}, {data: {site, custom: {art_url: artUrl}}});
    const values = key => Array.from(html.matchAll(/<meta\s+(?:property|name)="([^"]+)"\s+content="([^"]*)"\s*>/g)).filter(match => match[1] === key).map(match => match[2]);
    return {html, values, calls};
}

for (const context of ['post', 'page']) {
    test(context + ': generated art is the only preview image; Ghost services survive', () => {
        const result = render({context});
        assert.deepEqual(result.values('og:image'), [art + '/autonomy.png']);
        assert.deepEqual(result.values('twitter:image'), [art + '/autonomy.png']);
        assert.deepEqual(result.values('twitter:card'), ['summary_large_image']);
        assert.deepEqual(result.calls, ['social_data']);
        for (const marker of ['rel="canonical"', 'name="description"', 'application/ld+json', 'application/rss+xml', 'data-ghost=', 'cards.min.js', 'custom-injection']) assert.ok(result.html.includes(marker), marker);
        assert.deepEqual(result.values('og:image:width'), ['1200']);
        assert.deepEqual(result.values('og:image:height'), ['630']);
        assert.deepEqual(result.values('article:tag'), ['Essays']);
        assert.deepEqual(result.values('twitter:data1'), ['Clay Parker Jones']);
        assert.deepEqual(result.values('article:publisher'), ['https://www.facebook.com/publisher']);
        assert.deepEqual(result.values('article:author'), ['https://www.facebook.com/clay']);
    });
}

test('explicit per-channel images, titles, descriptions and canonical URL win', () => {
    const result = render({post: {og_image: '/content/images/og.jpg', twitter_image: '/content/images/twitter.jpg', og_title: 'OG title', twitter_title: 'X title', og_description: 'OG description', twitter_description: 'X description', canonical_url: 'https://example.test/original/'}});
    assert.deepEqual(result.values('og:image'), [site.url + '/content/images/og.jpg']);
    assert.deepEqual(result.values('twitter:image'), [site.url + '/content/images/twitter.jpg']);
    assert.deepEqual(result.values('og:image:width'), []);
    assert.deepEqual(result.values('og:image:height'), []);
    for (const [key, value] of Object.entries({'og:title': 'OG title', 'twitter:title': 'X title', 'og:description': 'OG description', 'twitter:description': 'X description', 'og:url': 'https://example.test/original/', 'twitter:url': 'https://example.test/original/'})) assert.deepEqual(result.values(key), [value]);
});

for (const channel of ['og', 'twitter']) {
    test(channel + ': a single-channel image override leaves the other on generated art', () => {
        const result = render({post: {[channel + '_image']: 'https://images.test/custom.png'}});
        assert.deepEqual(result.values(channel + ':image'), ['https://images.test/custom.png']);
        assert.deepEqual(result.values((channel === 'og' ? 'twitter' : 'og') + ':image'), [art + '/autonomy.png']);
    });
}

for (const post of [{feature_image: 'https://images.test/feature.jpg'}, {feature_image: 'https://images.test/feature.jpg', og_image: 'https://images.test/override.jpg', twitter_image: 'https://images.test/x.jpg'}]) {
    test('feature image posts keep Ghost social metadata and editor overrides', () => {
        const result = render({post});
        assert.deepEqual(result.calls, ['']);
        assert.deepEqual(result.values('og:image'), [post.og_image || post.feature_image]);
        assert.deepEqual(result.values('twitter:image'), [post.twitter_image || post.feature_image]);
    });
}

for (const context of ['home', 'tag', 'author', 'index', 'error']) {
    test(context + ': leaves Ghost in charge', () => {
        const result = render({context});
        assert.deepEqual(result.calls, ['']);
        assert.equal(result.values('og:image').length, 1);
        assert.ok(!result.html.includes('/autonomy.png'));
    });
}

test('blank artwork configuration uses Ghost instead of broken relative URLs', () => {
    const result = render({artUrl: ''});
    assert.deepEqual(result.calls, ['']);
    assert.deepEqual(result.values('og:image'), ['https://www.cpj.fyi/Site-Image.png']);
});

test('description fallbacks match Ghost social precedence', () => {
    for (const [post, expected] of [[{custom_excerpt: 'Custom', meta_description: 'SEO'}, 'Custom'], [{meta_description: 'SEO'}, 'SEO'], [{}, 'A public excerpt'], [{excerpt: ''}, site.description]]) {
        const result = render({post});
        assert.deepEqual(result.values('og:description'), [expected]);
        assert.deepEqual(result.values('twitter:description'), [expected]);
    }
});

test('attribute content is escaped, including quotes, ampersands and HTML', () => {
    const hostile = 'A "quote" & <script>alert(1)</script>';
    const result = render({post: {title: hostile, custom_excerpt: hostile, primary_author: {name: hostile}}});
    assert.deepEqual(result.values('og:title'), ['A &quot;quote&quot; &amp; &lt;script&gt;alert(1)&lt;/script&gt;']);
    assert.equal(result.values('og:description').length, 1);
    assert.ok(!result.html.includes('<script>alert(1)</script>'));
});

 test('post title and explicit SEO title survive nested Ghost post context', () => {
    assert.deepEqual(render().values('og:title'), ['Hierarchy &amp; autonomy']);
    assert.deepEqual(render().values('twitter:title'), ['Hierarchy &amp; autonomy']);
    const result = render({post: {meta_title: 'SEO title'}});
    assert.deepEqual(result.values('og:title'), ['SEO title']);
    assert.deepEqual(result.values('twitter:title'), ['SEO title']);
 });
