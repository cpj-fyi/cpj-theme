const test = require('node:test');
const assert = require('node:assert/strict');
const { initSearch, mergeResults, resultUrl } = require('../assets/js/search.js');

const book = { id: 'hp-60', title: '60. Hack Day', url: 'https://www.cpj.fyi/60-hack-day/', excerpt: 'A short preview.' };
const post = { url: '/essays/hello/', meta: { title: 'An essay' }, excerpt: 'A <mark>matching</mark> excerpt.' };
function deferred() { let resolve, reject; const promise = new Promise((a,b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
function fixture(services) {
    const nodes = {};
    for (const id of ['search-modal', 'search-trigger', 'search-input', 'search-results']) {
        const attributes = new Set(id === 'search-modal' ? ['hidden'] : []);
        nodes[id] = { value: '', innerHTML: '', events: {},
            addEventListener(name, fn) { this.events[name] = fn; },
            hasAttribute(name) { return attributes.has(name); },
            setAttribute(name) { attributes.add(name); }, removeAttribute(name) { attributes.delete(name); },
            focus() {}, select() {}, querySelectorAll() { return []; } };
    }
    const doc = { body: { style: {} }, getElementById: id => nodes[id], addEventListener() {} };
    const search = initSearch(doc, services); search.openModal();
    return { search, input: nodes['search-input'], results: nodes['search-results'] };
}
const index = (results = [post]) => async () => ({ options() {}, search: async () => ({ results: results.map(item => ({ data: async () => item })) }) });

test('merges book and post results, removes duplicate public book previews, normalizes safe URLs', () => {
    const results = mergeResults([book], [post, { url: '/60-hack-day/', meta: { title: book.title } }], true);
    assert.equal(results.length, 2);
    assert.equal(results[0].kind, 'Hidden Patterns');
    assert.equal(results[1].excerpt, 'A matching excerpt.');
    assert.equal(resultUrl('https://cpj-fyi.github.io/cpj-theme/13-network-of-teams/'), 'https://www.cpj.fyi/13-network-of-teams/');
    assert.equal(resultUrl('javascript:alert(1)'), null);
    assert.equal(resultUrl('https://attacker.test/'), null);
});

test('full-book matches survive Pagefind failure and HTML is escaped', async () => {
    const f = fixture({ loadIndex: async () => { throw Error('offline'); }, fetchBook: async () => [{ ...book, excerpt: '<img onerror=alert(1)>' }] });
    f.input.value = 'Hack Day'; await f.search.performSearch('Hack Day');
    assert.match(f.results.innerHTML, /60\. Hack Day/);
    assert.match(f.results.innerHTML, /&lt;img/);
    assert.ok(!f.results.innerHTML.includes('<img'));
    assert.match(f.results.innerHTML, /Post search is temporarily unavailable/);
});

test('post results and public chapter previews survive book service failure', async () => {
    const f = fixture({ loadIndex: index([post, { url: book.url, meta: { title: book.title }, excerpt: 'Public opening' }]),
        fetchBook: async () => { throw Error('unavailable'); } });
    f.input.value = 'Hack Day'; await f.search.performSearch('Hack Day');
    assert.match(f.results.innerHTML, /An essay/);
    assert.match(f.results.innerHTML, /Hidden Patterns · public preview/);
    assert.match(f.results.innerHTML, /Book search is temporarily unavailable/);
});

test('clearing or closing while a query is in flight prevents stale results', async () => {
    for (const action of ['clear', 'close']) {
        const pending = deferred();
        const f = fixture({ loadIndex: index(), fetchBook: () => pending.promise });
        f.input.value = 'old query'; const running = f.search.performSearch('old query');
        if (action === 'clear') { f.input.value = ''; f.input.events.input(); }
        else f.search.closeModal();
        pending.resolve([book]); await running;
        assert.ok(!f.results.innerHTML.includes('Hack Day'));
        assert.match(f.results.innerHTML, /Search posts and all 75/);
    }
});

test('slower previous query cannot replace the latest result', async () => {
    const first = deferred();
    const f = fixture({ loadIndex: index([]), fetchBook: query => query === 'old' ? first.promise : Promise.resolve([book]) });
    f.input.value = 'old'; const old = f.search.performSearch('old');
    f.input.value = ''; f.input.events.input();
    f.input.value = 'new'; await f.search.performSearch('new');
    first.resolve([{ ...book, title: 'Old result' }]); await old;
    assert.match(f.results.innerHTML, /Hack Day/);
    assert.ok(!f.results.innerHTML.includes('Old result'));
});
