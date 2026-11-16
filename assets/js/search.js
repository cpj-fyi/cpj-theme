/** Site search: Pagefind for posts; private server-side full-book search. */
(function() {
    'use strict';
    var PAGEFIND_BASE = 'https://cpj-fyi.github.io/cpj-theme/_pagefind/';
    var BOOK_SEARCH = 'https://mcp.hd-pt.com/search';
    var SITE_ORIGIN = 'https://www.cpj.fyi';

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function(c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function resultUrl(value) {
        try {
            var url = new URL(value, SITE_ORIGIN);
            if (url.hostname === 'cpj-fyi.github.io') {
                return SITE_ORIGIN + url.pathname.replace(/^\/cpj-theme(?=\/)/, '') + url.hash;
            }
            return url.protocol === 'https:' && ['www.cpj.fyi', 'cpj.fyi'].includes(url.hostname)
                ? SITE_ORIGIN + url.pathname + url.hash : null;
        } catch (_) { return null; }
    }

    function isPattern(url) { return /^\/\d{1,2}-[^/]+\/$/.test(new URL(url).pathname); }

    function mergeResults(books, posts, bookAvailable) {
        var seen = new Set();
        return books.map(function(item) {
            return { url: item.url, title: item.title, excerpt: item.excerpt, kind: 'Hidden Patterns' };
        }).concat(posts.map(function(item) {
            return { url: item.url, title: item.meta && item.meta.title || 'Untitled',
                // Pagefind provides marked HTML. Turn it into plain text before
                // escaping so both result sources have the same safe rendering.
                excerpt: (item.excerpt || '').replace(/<[^>]*>/g, ''), kind: 'Posts & pages' };
        })).filter(function(item) {
            item.url = resultUrl(item.url);
            if (!item.url || seen.has(item.url)) return false;
            if (item.kind !== 'Hidden Patterns' && isPattern(item.url)) {
                if (bookAvailable) return false;
                item.kind = 'Hidden Patterns · public preview';
            }
            seen.add(item.url);
            return true;
        }).slice(0, 13);
    }

    function initSearch(doc, services) {
        services = services || {};
        var modal = doc.getElementById('search-modal');
        var trigger = doc.getElementById('search-trigger');
        var input = doc.getElementById('search-input');
        var results = doc.getElementById('search-results');
        if (!modal || !input || !results) return;
        var loadIndex = services.loadIndex || function() { return import(PAGEFIND_BASE + 'pagefind.js'); };
        var fetchBook = services.fetchBook || function(query, signal) {
            return fetch(BOOK_SEARCH + '?q=' + encodeURIComponent(query), {
                signal: signal, credentials: 'omit', referrerPolicy: 'no-referrer'
            }).then(function(response) {
                if (!response.ok) throw new Error('Book search unavailable');
                return response.json();
            }).then(function(data) { return data.results; });
        };
        var pagefindPromise, currentResults = [], activeIndex = -1;
        var debounce, generation = 0, controller, previousFocus;

        function loadPagefind() {
            if (!pagefindPromise) {
                pagefindPromise = loadIndex().then(function(mod) {
                    return Promise.resolve(mod.options({ excerptLength: 30, baseUrl: SITE_ORIGIN + '/' }))
                        .then(function() { return mod; });
                }).catch(function(error) { pagefindPromise = null; throw error; });
            }
            return pagefindPromise;
        }

        function message(text) {
            currentResults = []; activeIndex = -1;
            results.innerHTML = '<p class="search-modal-empty">' + escapeHtml(text) + '</p>';
        }

        function cancel() {
            generation++;
            clearTimeout(debounce);
            if (controller) controller.abort();
        }

        function render(items, booksOk, postsOk) {
            currentResults = items; activeIndex = items.length ? 0 : -1;
            var group = '';
            var html = items.map(function(item, i) {
                var heading = item.kind !== group ? '<p class="search-result-group">' + item.kind + '</p>' : '';
                group = item.kind;
                return heading + '<a href="' + escapeHtml(item.url) + '" class="search-result' + (i === 0 ? ' is-active' : '') + '">' +
                    '<h3 class="search-result-title">' + escapeHtml(item.title) + '</h3>' +
                    '<p class="search-result-excerpt">' + escapeHtml(item.excerpt) + '</p></a>';
            }).join('');
            if (!items.length) html = '<p class="search-modal-no-results">' +
                (booksOk || postsOk ? 'No matches for “' + escapeHtml(input.value.trim()) + '”.' : 'Search is temporarily unavailable.') + '</p>';
            if (!booksOk || !postsOk) html += '<p class="search-modal-empty">' +
                (!booksOk ? 'Book search' : 'Post search') + ' is temporarily unavailable. Try again shortly.</p>';
            results.innerHTML = html;
        }

        function bounded(promise) {
            return new Promise(function(resolve, reject) {
                var timer = setTimeout(function() { reject(new Error('Search timed out')); }, 6000);
                Promise.resolve(promise).then(function(value) { clearTimeout(timer); resolve(value); },
                    function(error) { clearTimeout(timer); reject(error); });
            });
        }

        function performSearch(query) {
            var requestId = generation;
            controller = new AbortController();
            message('Searching…');
            var books = bounded(fetchBook(query, controller.signal));
            var posts = bounded(loadPagefind().then(function(pf) { return pf.search(query); })
                .then(function(search) {
                    // Allow room for book previews that will be replaced with
                    // full-text results from the book service.
                    return Promise.all(search.results.slice(0, 16).map(function(r) { return r.data(); }));
                }));
            return Promise.allSettled([books, posts]).then(function(outcomes) {
                if (requestId !== generation || modal.hasAttribute('hidden')) return;
                controller.abort();
                var booksOk = outcomes[0].status === 'fulfilled';
                var postsOk = outcomes[1].status === 'fulfilled';
                render(mergeResults(booksOk ? outcomes[0].value : [], postsOk ? outcomes[1].value : [], booksOk), booksOk, postsOk);
            });
        }

        function openModal() {
            previousFocus = doc.activeElement;
            modal.removeAttribute('hidden'); doc.body.style.overflow = 'hidden';
            loadPagefind().catch(function() {});
            input.focus(); input.select();
        }
        function closeModal() {
            cancel(); modal.setAttribute('hidden', ''); doc.body.style.overflow = '';
            input.value = ''; message('Search posts and all 75 book patterns.');
            if (previousFocus && previousFocus.focus) previousFocus.focus();
        }
        function setActive(index) {
            if (!currentResults.length) return;
            activeIndex = (index + currentResults.length) % currentResults.length;
            results.querySelectorAll('.search-result').forEach(function(el, i) {
                el.classList.toggle('is-active', i === activeIndex);
                if (i === activeIndex) el.scrollIntoView({ block: 'nearest' });
            });
        }
        if (trigger) trigger.addEventListener('click', openModal);
        doc.addEventListener('keydown', function(e) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault(); if (modal.hasAttribute('hidden')) openModal(); else closeModal(); return;
            }
            if (modal.hasAttribute('hidden')) return;
            if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
            else if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault(); doc.defaultView.location.href = currentResults[activeIndex].url;
            }
        });
        modal.addEventListener('click', function(e) { if (e.target.closest('[data-search-close]')) closeModal(); });
        input.addEventListener('input', function() {
            cancel(); var query = input.value.trim();
            if (!query) return message('Search posts and all 75 book patterns.');
            if (query.length > 160) return message('Try a shorter search (up to 160 characters).');
            debounce = setTimeout(function() { performSearch(query); }, 200);
        });
        return { performSearch: performSearch, openModal: openModal, closeModal: closeModal };
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = { initSearch: initSearch, mergeResults: mergeResults, resultUrl: resultUrl };
    else document.addEventListener('DOMContentLoaded', function() { initSearch(document); });
})();
