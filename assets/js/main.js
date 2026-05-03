/**
 * CPJ Theme - Main JavaScript
 * Handles mobile menu, smooth scrolling, and other interactions
 */

(function() {
    'use strict';

    // DOM Ready
    document.addEventListener('DOMContentLoaded', function() {
        initRadarMode();
        initMobileMenu();
        initSmoothScroll();
        initChapterProgress();
        initNumberedLinks();
        initDateTimeMoonphase();
        initCurrentChapter();
        initRadarScan();
        initMobileChapterNav();
        initChapterTitleStyling();
        initCommentCounts();
        initRetailerTracking();
        initPostExtras();   // footnotes + sidenotes + math, in order
        initEverything();
        initSearch();
        initPostArt();
    });

    function initPostExtras() {
        var postBody = document.querySelector('.post-body');
        if (!postBody) return;

        transformFootnotes(postBody);
        initSidenotes();
        loadAndRenderMath(postBody).then(function(rendered) {
            if (rendered && typeof positionSidenotes === 'function') {
                positionSidenotes();
            }
            initReadingTimeRecalc();
        });
    }

    /**
     * Search — Cmd+K modal (issue #3)
     * Pagefind-powered. Index is hosted at PAGEFIND_BASE; pagefind.js is
     * dynamically imported on first open so the page doesn't pay the cost
     * of loading the search runtime up front.
     */
    function initSearch() {
        var modal = document.getElementById('search-modal');
        var trigger = document.getElementById('search-trigger');
        var input = document.getElementById('search-input');
        var results = document.getElementById('search-results');
        if (!modal || !input || !results) return;

        var PAGEFIND_BASE = 'https://cpj-fyi.github.io/cpj-theme/_pagefind/';
        var SITE_ORIGIN = 'https://www.cpj.fyi';
        var pagefind = null;
        var pagefindPromise = null;
        var currentResults = [];
        var activeIndex = -1;
        var debounce = null;
        var lastQuery = '';

        function loadPagefind() {
            if (pagefindPromise) return pagefindPromise;
            pagefindPromise = import(PAGEFIND_BASE + 'pagefind.js')
                .then(function(mod) {
                    pagefind = mod;
                    if (typeof mod.options === 'function') {
                        return Promise.resolve(mod.options({
                            excerptLength: 30,
                            baseUrl: SITE_ORIGIN + '/'
                        })).then(function() { return mod; });
                    }
                    return mod;
                })
                .catch(function(err) {
                    console.warn('Pagefind failed to load:', err);
                    pagefindPromise = null;
                    return null;
                });
            return pagefindPromise;
        }

        // Pagefind auto-detects its hosted subdirectory (/cpj-theme/) and
        // can prepend it to URLs. Strip that and force the cpj.fyi origin.
        function rewriteUrl(url) {
            if (!url) return '#';
            // Absolute URL pointing at the index host — re-origin to cpj.fyi
            url = url.replace(/^https?:\/\/cpj-fyi\.github\.io(\/cpj-theme)?/, '');
            // Drop any lingering /cpj-theme prefix
            url = url.replace(/^\/cpj-theme/, '');
            // If still a path, prefix with site origin
            if (url.indexOf('://') === -1) {
                if (!url.startsWith('/')) url = '/' + url;
                url = SITE_ORIGIN + url;
            }
            return url;
        }

        function escapeHtml(s) {
            return String(s).replace(/[&<>"']/g, function(c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
            });
        }

        function renderEmpty() {
            results.innerHTML = '<p class="search-modal-empty">Type to search posts, essays, and chapters.</p>';
            currentResults = [];
            activeIndex = -1;
        }

        function renderLoading() {
            results.innerHTML = '<p class="search-modal-loading">Searching…</p>';
        }

        function renderNoResults(q) {
            results.innerHTML = '<p class="search-modal-no-results">No matches for &ldquo;' + escapeHtml(q) + '&rdquo;.</p>';
            currentResults = [];
            activeIndex = -1;
        }

        function renderUnavailable() {
            results.innerHTML = '<p class="search-modal-no-results">Search is loading the index for the first time, or the index isn&rsquo;t deployed yet. <a href="/everything/">Browse all posts</a>.</p>';
            currentResults = [];
            activeIndex = -1;
        }

        function renderResults(items) {
            if (!items.length) return renderNoResults(input.value.trim());
            var html = items.map(function(item, i) {
                var title = (item.meta && item.meta.title) ? item.meta.title : 'Untitled';
                return '<a href="' + escapeHtml(rewriteUrl(item.url)) + '" class="search-result' + (i === 0 ? ' is-active' : '') + '" data-result-index="' + i + '">' +
                    '<h3 class="search-result-title">' + escapeHtml(title) + '</h3>' +
                    '<p class="search-result-excerpt">' + (item.excerpt || '') + '</p>' +
                '</a>';
            }).join('');
            results.innerHTML = html;
            currentResults = items;
            activeIndex = 0;
        }

        function setActive(index) {
            if (!currentResults.length) return;
            var wrapped = (index + currentResults.length) % currentResults.length;
            activeIndex = wrapped;
            var els = results.querySelectorAll('.search-result');
            els.forEach(function(el, i) {
                el.classList.toggle('is-active', i === wrapped);
                if (i === wrapped) el.scrollIntoView({ block: 'nearest' });
            });
        }

        function performSearch(query) {
            lastQuery = query;
            if (!query) return renderEmpty();
            renderLoading();
            loadPagefind().then(function(pf) {
                if (!pf) return renderUnavailable();
                pf.search(query).then(function(search) {
                    if (input.value.trim() !== query) return; // stale
                    Promise.all(search.results.slice(0, 8).map(function(r) {
                        return r.data();
                    })).then(renderResults);
                });
            });
        }

        function openModal() {
            modal.removeAttribute('hidden');
            document.body.style.overflow = 'hidden';
            loadPagefind();
            setTimeout(function() { input.focus(); input.select(); }, 0);
        }

        function closeModal() {
            modal.setAttribute('hidden', '');
            document.body.style.overflow = '';
            input.value = '';
            renderEmpty();
        }

        if (trigger) {
            trigger.addEventListener('click', openModal);
        }

        document.addEventListener('keydown', function(e) {
            var isCmd = e.metaKey || e.ctrlKey;
            if (isCmd && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (modal.hasAttribute('hidden')) openModal(); else closeModal();
                return;
            }
            if (modal.hasAttribute('hidden')) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                closeModal();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive(activeIndex + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive(activeIndex - 1);
            } else if (e.key === 'Enter') {
                var active = results.querySelector('.search-result.is-active');
                if (active) {
                    e.preventDefault();
                    window.location = active.getAttribute('href');
                }
            }
        });

        modal.addEventListener('click', function(e) {
            if (e.target.closest('[data-search-close]')) {
                closeModal();
            }
        });

        input.addEventListener('input', function() {
            clearTimeout(debounce);
            var q = input.value.trim();
            if (!q) return renderEmpty();
            debounce = setTimeout(function() { performSearch(q); }, 150);
        });
    }

    /**
     * Everything archive
     * Sorts items by data-date desc, injects year H2 headings, builds the
     * year-jump nav at the top.
     */
    function initEverything() {
        var list = document.getElementById('archive-list');
        if (!list) return;

        var items = Array.prototype.slice.call(list.querySelectorAll('.archive-item'));
        if (!items.length) return;

        // Dedupe (paginated {{#get}} blocks may overlap if Ghost returns
        // fewer than expected per page).
        var seen = {};
        items = items.filter(function(item) {
            var key = item.dataset.date + '|' + (item.querySelector('.archive-item-title a') || {}).href;
            if (seen[key]) {
                item.remove();
                return false;
            }
            seen[key] = true;
            return true;
        });

        // Count items per year.
        var countsByYear = {};
        items.forEach(function(item) {
            var y = item.dataset.year;
            countsByYear[y] = (countsByYear[y] || 0) + 1;
        });

        // Sort by data-date desc.
        items.sort(function(a, b) {
            return b.dataset.date.localeCompare(a.dataset.date);
        });

        var fragment = document.createDocumentFragment();
        var years = [];
        var currentYear = null;

        items.forEach(function(item) {
            var year = item.dataset.year;
            if (year !== currentYear) {
                currentYear = year;
                years.push(year);

                var heading = document.createElement('h2');
                heading.className = 'archive-year-heading';
                heading.id = 'year-' + year;

                var titleEl = document.createElement('span');
                titleEl.className = 'archive-year-heading-text';
                titleEl.textContent = year;
                heading.appendChild(titleEl);

                var countEl = document.createElement('span');
                countEl.className = 'archive-year-heading-count';
                var n = countsByYear[year];
                countEl.textContent = n + (n === 1 ? ' Post' : ' Posts');
                heading.appendChild(countEl);

                fragment.appendChild(heading);
            }
            fragment.appendChild(item);
        });

        list.innerHTML = '';
        list.appendChild(fragment);

        var nav = document.getElementById('archive-year-nav');
        if (!nav || !years.length) return;

        years.forEach(function(year, i) {
            var link = document.createElement('a');
            link.href = '#year-' + year;
            link.textContent = year;
            link.className = 'archive-year-nav-link';
            link.addEventListener('click', function(e) {
                var target = document.getElementById('year-' + year);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            nav.appendChild(link);
            if (i < years.length - 1) {
                var sep = document.createElement('span');
                sep.className = 'archive-year-nav-sep';
                sep.setAttribute('aria-hidden', 'true');
                sep.textContent = '|';
                nav.appendChild(sep);
            }
        });
    }

    /**
     * Markdown footnote transform — converts `[^id]` markers and `[^id]: ...`
     * definitions into the existing <aside class="sidenote"> DOM. See
     * docs/plans/2026-05-03-math-and-footnotes-design.md for full spec.
     */
    function transformFootnotes(postBody) {
        var defs = new Map();
        var children = Array.prototype.slice.call(postBody.querySelectorAll('p'));
        var defRe = /^\[\^([^\]]+)\]:\s*/;
        children.forEach(function(p) {
            var firstText = p.firstChild;
            if (!firstText || firstText.nodeType !== Node.TEXT_NODE) return;
            var m = firstText.nodeValue.match(defRe);
            if (!m) return;
            var id = m[1];
            // Strip the prefix from the first text node.
            firstText.nodeValue = firstText.nodeValue.slice(m[0].length);
            // Capture the rest of the paragraph's innerHTML as the definition.
            defs.set(id, p.innerHTML.trim());
            p.remove();
        });
        // Pass 2: walk text nodes (skipping <pre>/<code>/<script>/<style>),
        // replace [^id] with <span data-fnmarker="id">.
        var SKIP = { PRE: 1, CODE: 1, SCRIPT: 1, STYLE: 1 };
        var walker = document.createTreeWalker(
            postBody,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    var p = node.parentNode;
                    while (p && p !== postBody) {
                        if (SKIP[p.nodeName]) return NodeFilter.FILTER_REJECT;
                        p = p.parentNode;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                },
            },
            false
        );
        var textNodes = [];
        var cursor;
        while ((cursor = walker.nextNode())) textNodes.push(cursor);

        var markerRe = /\[\^([^\]]+)\]/g;
        textNodes.forEach(function(textNode) {
            var text = textNode.nodeValue;
            if (text.indexOf('[^') === -1) return;
            var matches = [];
            var m;
            markerRe.lastIndex = 0;
            while ((m = markerRe.exec(text))) {
                if (defs.has(m[1])) matches.push({ index: m.index, id: m[1], len: m[0].length });
            }
            if (!matches.length) return;
            // Walk matches in reverse so earlier offsets stay valid as we mutate.
            var parent = textNode.parentNode;
            var working = textNode;
            for (var i = matches.length - 1; i >= 0; i--) {
                var match = matches[i];
                var afterText = working.nodeValue.slice(match.index + match.len);
                var beforeText = working.nodeValue.slice(0, match.index);
                var span = document.createElement('span');
                span.setAttribute('data-fnmarker', match.id);
                if (afterText) {
                    var afterNode = document.createTextNode(afterText);
                    parent.insertBefore(afterNode, working.nextSibling);
                }
                parent.insertBefore(span, working.nextSibling);
                working.nodeValue = beforeText;
            }
        });
        // Pass 3: emit asides          (Task 5)
    }

    /**
     * Math rendering gate + dynamic KaTeX loader. Only loads KaTeX if
     * the post-body text contains math delimiters.
     */
    function postNeedsMath(postBody) {
        return /\$|\\\(|\\\[/.test(postBody.textContent);
    }

    function loadScript(src) {
        return new Promise(function(resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    function loadKatex() {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/assets/lib/katex/katex.min.css';
        document.head.appendChild(link);
        return loadScript('/assets/lib/katex/katex.min.js')
            .then(function() { return loadScript('/assets/lib/katex/auto-render.min.js'); });
    }

    function loadAndRenderMath(postBody) {
        if (!postNeedsMath(postBody)) return Promise.resolve(false);
        return loadKatex().then(function() {
            window.renderMathInElement(postBody, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '\\[', right: '\\]', display: true },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '$',  right: '$',  display: false },
                ],
                throwOnError: false,
                strict: false,
                ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
            });
            return true;
        }).catch(function(err) {
            // Containing failures here keeps initReadingTimeRecalc running
            // on the caller's chain even if KaTeX 404s or throws.
            if (typeof console !== 'undefined') console.warn('[math] load/render failed:', err);
            return false;
        });
    }

    /**
     * Sidenotes — Medium-style margin notes (issue #9)
     *
     * Author convention: drop <aside class="sidenote">…</aside> after a
     * paragraph in a Ghost HTML card. This finds them, numbers them,
     * inserts an inline [N] superscript marker at the end of the
     * preceding text element, and (on desktop ≥1200px) positions each
     * aside in the right margin top-aligned with its marker.
     */
    function initSidenotes() {
        var body = document.querySelector('.post-body');
        if (!body) return;

        var sidenotes = body.querySelectorAll('aside.sidenote');
        if (!sidenotes.length) return;

        var isDesktop = function() { return window.matchMedia('(min-width: 1200px)').matches; };

        sidenotes.forEach(function(note, i) {
            var num = i + 1;
            note.id = 'sn-' + num;
            note.setAttribute('role', 'note');

            // Number prefix inside the first paragraph (or aside if flat).
            var numEl = document.createElement('span');
            numEl.className = 'sidenote-num';
            numEl.textContent = num;
            var firstP = note.querySelector('p');
            if (firstP) {
                firstP.insertBefore(numEl, firstP.firstChild);
            } else {
                note.insertBefore(numEl, note.firstChild);
            }

            // Close button — appended after content so SR reads note before encountering it,
            // positioned absolute top-right via CSS.
            var closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'sidenote-close';
            closeBtn.setAttribute('aria-label', 'Close footnote');
            closeBtn.innerHTML = '<span aria-hidden="true">&times;</span>';
            closeBtn.addEventListener('click', function() {
                note.classList.remove('is-open');
                var refLink = document.querySelector('#snref-' + num + ' a');
                if (refLink) refLink.focus();
            });
            note.appendChild(closeBtn);

            // Inline marker in the preceding text element.
            var target = findRefTarget(note);
            if (!target) return;

            var ref = document.createElement('sup');
            ref.className = 'sidenote-ref';
            ref.id = 'snref-' + num;

            var link = document.createElement('a');
            link.href = '#sn-' + num;
            link.textContent = num;
            link.setAttribute('aria-label', 'Footnote ' + num);
            link.addEventListener('click', function(e) {
                if (isDesktop()) return; // desktop: regular anchor (sidenote already visible)
                e.preventDefault();
                sidenotes.forEach(function(n) {
                    if (n !== note) n.classList.remove('is-open');
                });
                note.classList.toggle('is-open');
                if (note.classList.contains('is-open')) {
                    closeBtn.focus();
                }
            });
            ref.appendChild(link);
            target.appendChild(ref);
        });

        // Dismiss popover on tap outside or Escape (mobile only).
        document.addEventListener('click', function(e) {
            if (isDesktop()) return;
            var open = document.querySelector('aside.sidenote.is-open');
            if (!open) return;
            if (e.target.closest('aside.sidenote, .sidenote-ref')) return;
            open.classList.remove('is-open');
        });

        document.addEventListener('keydown', function(e) {
            if (e.key !== 'Escape') return;
            document.querySelectorAll('aside.sidenote.is-open').forEach(function(n) {
                n.classList.remove('is-open');
            });
        });

        positionSidenotes();

        var raf;
        var rerun = function() {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(positionSidenotes);
        };
        window.addEventListener('resize', rerun);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(rerun);
        }
    }

    function findRefTarget(sidenote) {
        var prev = sidenote.previousElementSibling;
        var TEXT_TAGS = /^(P|UL|OL|BLOCKQUOTE|H[1-6]|FIGCAPTION|DL|DD|PRE)$/;
        while (prev) {
            if (prev.matches('aside.sidenote')) {
                prev = prev.previousElementSibling;
                continue;
            }
            if (TEXT_TAGS.test(prev.tagName)) return prev;
            // Wrapped card — look inside for a trailing text element.
            var inner = prev.querySelector('p:last-of-type, li:last-of-type, h1, h2, h3, h4, h5, h6');
            if (inner) return inner;
            prev = prev.previousElementSibling;
        }
        return null;
    }

    function positionSidenotes() {
        var body = document.querySelector('.post-body');
        if (!body) return;

        var isDesktop = window.matchMedia('(min-width: 1200px)').matches;
        var sidenotes = body.querySelectorAll('aside.sidenote');

        if (!isDesktop) {
            sidenotes.forEach(function(n) { n.style.top = ''; });
            body.style.minHeight = '';
            return;
        }

        var bodyTop = body.getBoundingClientRect().top + window.scrollY;
        var lastBottom = 0;
        var minGap = 16;

        sidenotes.forEach(function(note) {
            var num = note.id.replace('sn-', '');
            var ref = document.getElementById('snref-' + num);
            if (!ref) return;

            var desiredTop = ref.getBoundingClientRect().top + window.scrollY - bodyTop;
            var top = Math.max(desiredTop, lastBottom + minGap);
            note.style.top = top + 'px';
            lastBottom = top + note.offsetHeight;
        });

        // Prevent trailing sidenotes from visually overlapping comments below.
        body.style.minHeight = lastBottom > 0 ? lastBottom + 32 + 'px' : '';
    }

    /**
     * Current Chapter Highlighting
     * Highlights the current chapter in the sidebar navigation (desktop)
     * and mobile chapter buttons
     */
    function initCurrentChapter() {
        const chapterLinks = document.querySelectorAll('.chapter-list-link');
        const currentPath = window.location.pathname;

        // Desktop sidebar links
        chapterLinks.forEach(function(link) {
            if (link.getAttribute('href') === currentPath ||
                link.getAttribute('href') === currentPath.replace(/\/$/, '') ||
                link.getAttribute('href') + '/' === currentPath) {
                link.classList.add('is-current');
            }
        });
    }

    /**
     * Mobile Chapter Navigation
     * Horizontal scrollable row of chapter buttons
     * - Extracts chapter numbers from URLs
     * - Highlights current chapter
     * - Scrolls current button into view
     */
    function initMobileChapterNav() {
        const mobileNav = document.querySelector('.mobile-chapter-nav');
        if (!mobileNav) return;

        const buttons = mobileNav.querySelectorAll('.chapter-btn');
        const currentPath = window.location.pathname;

        buttons.forEach(function(btn) {
            const url = btn.getAttribute('data-chapter-url') || btn.getAttribute('href');

            // Extract chapter number from URL (e.g., /13-network-of-teams/ → 13)
            // Only for buttons that don't already have text content (Start & End has labels)
            if (!btn.textContent.trim()) {
                const match = url.match(/\/(\d+)-/);
                if (match) {
                    btn.textContent = match[1];
                }
            }

            // Highlight current chapter
            if (url === currentPath ||
                url === currentPath.replace(/\/$/, '') ||
                url + '/' === currentPath) {
                btn.classList.add('is-current');

                // Scroll current button into view (centered)
                setTimeout(function() {
                    btn.scrollIntoView({
                        behavior: 'smooth',
                        inline: 'center',
                        block: 'nearest'
                    });
                }, 100);
            }
        });
    }

    /**
     * Chapter Title Styling
     * Wraps leading chapter numbers in a span so they can be styled differently
     * (e.g., roman/upright while the rest of the title is italic)
     */
    function initChapterTitleStyling() {
        const chapterPage = document.querySelector('.chapter-page');
        if (!chapterPage) return;

        const postTitle = chapterPage.querySelector('.post-title');
        if (!postTitle) return;

        const titleText = postTitle.textContent;
        // Match leading number with optional period/colon and space (e.g., "13. ", "13 ", "13: ")
        const match = titleText.match(/^(\d+[.\s:]*\s*)/);

        if (match) {
            const numberPart = match[1];
            const restOfTitle = titleText.slice(numberPart.length);
            postTitle.innerHTML = '<span class="chapter-num">' + numberPart + '</span>' + restOfTitle;
        }
    }

    /**
     * Radar Scan Animation
     * Creates blip effects at random positions during sweep
     */
    function initRadarScan() {
        const radarDots = document.querySelectorAll('.radar-dot');
        if (!radarDots.length) return;

        radarDots.forEach(function(dot) {
            // Trigger blips at random intervals during the sweep
            function scheduleBlip() {
                // Random delay between 0.5s and 3.5s into the 4s animation
                const delay = 500 + Math.random() * 3000;

                setTimeout(function() {
                    dot.classList.add('blip');

                    // Remove blip class after animation completes
                    setTimeout(function() {
                        dot.classList.remove('blip');
                    }, 600);
                }, delay);
            }

            // Schedule blips for each sweep cycle
            scheduleBlip();
            setInterval(function() {
                // 1-3 blips per sweep
                const blipCount = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < blipCount; i++) {
                    scheduleBlip();
                }
            }, 4000);
        });
    }

    /**
     * Radar Mode
     * Add body class for radar pages (collection route may not have tag-radar class)
     */
    function initRadarMode() {
        if (document.querySelector('.radar-feed')) {
            document.body.classList.add('tag-radar');
        }
    }

    /**
     * Mobile Menu Toggle
     */
    function initMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const siteNav = document.getElementById('site-nav');

        if (!menuToggle || !siteNav) return;

        function openMenu() {
            siteNav.classList.add('is-open');
            document.body.classList.add('menu-open');
            menuToggle.setAttribute('aria-expanded', 'true');
        }

        function closeMenu() {
            siteNav.classList.remove('is-open');
            document.body.classList.remove('menu-open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }

        menuToggle.addEventListener('click', function() {
            if (siteNav.classList.contains('is-open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && siteNav.classList.contains('is-open')) {
                closeMenu();
            }
        });

        // Close menu when clicking a nav link
        siteNav.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', closeMenu);
        });
    }

    /**
     * Smooth Scroll for Anchor Links
     */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');

                // Skip if it's a Ghost portal link
                if (targetId.startsWith('#/portal')) return;

                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Chapter Reading Progress
     * Shows progress indicator for book chapters
     */
    function initChapterProgress() {
        const chapterContent = document.querySelector('.chapter-content');
        if (!chapterContent) return;

        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.innerHTML = '<div class="reading-progress-bar"></div>';
        document.body.appendChild(progressBar);

        const progressBarInner = progressBar.querySelector('.reading-progress-bar');

        // Update progress on scroll
        function updateProgress() {
            const contentRect = chapterContent.getBoundingClientRect();
            const contentTop = contentRect.top + window.scrollY;
            const contentHeight = chapterContent.offsetHeight;
            const windowHeight = window.innerHeight;
            const scrollTop = window.scrollY;

            const progress = Math.min(100, Math.max(0,
                ((scrollTop - contentTop + windowHeight) / (contentHeight + windowHeight)) * 100
            ));

            progressBarInner.style.width = progress + '%';
        }

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    /**
     * Numbered Links in Chapter Content
     * Adds small-caps styling to links containing numbers (e.g., footnote references)
     * Only applies to chapter pages, in the main content area
     */
    function initNumberedLinks() {
        // Only run on chapter pages (check for chapter-specific elements)
        const chapterBody = document.querySelector('.page-template .post-body .content');
        if (!chapterBody) return;

        // Find all links in the chapter content
        const links = chapterBody.querySelectorAll('a');

        links.forEach(function(link) {
            // Check if link text contains a number
            if (/\d/.test(link.textContent)) {
                link.classList.add('numbered-link');
            }
        });
    }

    /**
     * Date, Time, and Moonphase Display
     * Shows current date/time and watch-style moonphase indicator
     */
    function initDateTimeMoonphase() {
        const dateEl = document.querySelector('.header-date');
        const timeEl = document.querySelector('.header-time');
        const mobileDateEl = document.querySelector('.mobile-date');
        const mobileTimeEl = document.querySelector('.mobile-time');
        const moonDiscs = document.querySelectorAll('.moonphase-disc');
        const moonphaseEl = document.getElementById('header-moonphase');

        if (!dateEl || !timeEl) return;

        function updateDateTime() {
            const now = new Date();

            // Format date: "Mon, Jan 19"
            const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
            const dateStr = now.toLocaleDateString('en-US', dateOptions).toUpperCase();
            dateEl.textContent = dateStr;
            if (mobileDateEl) mobileDateEl.textContent = dateStr;

            // Format time: "10:30 AM"
            const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
            const timeStr = now.toLocaleTimeString('en-US', timeOptions);
            timeEl.textContent = timeStr;
            if (mobileTimeEl) mobileTimeEl.textContent = timeStr;
        }

        /**
         * Calculate moon phase using astronomical algorithm
         * Returns a value from 0 to 1 where:
         * 0 = New Moon, 0.25 = First Quarter, 0.5 = Full Moon, 0.75 = Last Quarter
         */
        function getMoonPhase(date) {
            // Recent known new moon: January 18, 2026 at 19:52 UTC
            // Using a recent reference minimizes accumulated calculation error
            const knownNewMoon = new Date(Date.UTC(2026, 0, 18, 19, 52, 0));
            const synodicMonth = 29.53058867; // Average lunar cycle in days

            const daysSinceKnown = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
            const lunations = daysSinceKnown / synodicMonth;
            const phase = lunations - Math.floor(lunations);

            return phase;
        }

        /**
         * Rotate the moon disc based on current phase
         * Simple Hodinkee-style: disc image rotates behind mask image
         * Phase 0 = new moon, Phase 0.5 = full moon
         * One full rotation (360°) = one lunar cycle
         */
        function updateMoonPhase(phase) {
            // Convert phase (0-1) to rotation degrees
            // +44° offset calibrates disc position to match visual moon position
            const rotation = (phase * 360) + 44;

            moonDiscs.forEach(function(disc) {
                disc.style.transform = `rotate(${rotation}deg)`;
            });

            // Update title with phase name
            if (moonphaseEl) {
                const phaseName = getMoonPhaseName(phase);
                moonphaseEl.setAttribute('title', phaseName);
            }
        }

        function getMoonPhaseName(phase) {
            if (phase < 0.03 || phase > 0.97) return 'New Moon';
            if (phase < 0.22) return 'Waxing Crescent';
            if (phase < 0.28) return 'First Quarter';
            if (phase < 0.47) return 'Waxing Gibbous';
            if (phase < 0.53) return 'Full Moon';
            if (phase < 0.72) return 'Waning Gibbous';
            if (phase < 0.78) return 'Last Quarter';
            return 'Waning Crescent';
        }

        // Initialize
        updateDateTime();
        updateMoonPhase(getMoonPhase(new Date()));

        // Update time every minute
        setInterval(updateDateTime, 60000);

        // Update moon phase every hour (it changes slowly)
        setInterval(function() {
            updateMoonPhase(getMoonPhase(new Date()));
        }, 3600000);
    }

    /**
     * Add reading progress styles dynamically
     */
    const progressStyles = document.createElement('style');
    progressStyles.textContent = `
        .reading-progress {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.1);
        }
        .reading-progress-bar {
            height: 100%;
            width: 0;
            background: var(--color-accent, #FF3252);
            transition: width 100ms ease-out;
        }
    `;
    document.head.appendChild(progressStyles);

    /**
     * Retailer Click Tracking
     * Sends outbound retailer link clicks to cpj-worker for Slack notifications.
     * Uses navigator.sendBeacon() which fires reliably even when navigating away.
     */
    function initRetailerTracking() {
        // TODO: replace with actual deployed worker URL
        var WORKER_URL = 'https://cpj-worker.clay-893.workers.dev/click';

        var RETAILERS = {
            'amazon.com':            'Amazon',
            'barnesandnoble.com':    'Barnes & Noble',
            'bookshop.org':          'Bookshop.org',
            'booksamillion.com':     'Books-A-Million',
            'hudsonbooksellers.com': 'Hudson',
            'walmart.com':           'Walmart'
        };

        function getRetailerName(href) {
            try {
                var hostname = new URL(href).hostname.replace('www.', '');
                for (var domain in RETAILERS) {
                    if (hostname === domain || hostname.endsWith('.' + domain)) {
                        return RETAILERS[domain];
                    }
                }
            } catch (e) {}
            return null;
        }

        var links = [];
        var orderButtons = document.querySelectorAll('#bp-order .bp-order-buttons a[target="_blank"]');
        var bookButtons = document.querySelectorAll('.book-buttons a[target="_blank"]');
        for (var i = 0; i < orderButtons.length; i++) links.push(orderButtons[i]);
        for (var j = 0; j < bookButtons.length; j++) links.push(bookButtons[j]);

        if (!links.length) return;

        links.forEach(function(link) {
            var retailer = getRetailerName(link.href);
            if (!retailer) return;

            link.addEventListener('click', function() {
                if (!navigator.sendBeacon) return;
                navigator.sendBeacon(WORKER_URL, JSON.stringify({
                    retailer: retailer,
                    url: link.href,
                    page: window.location.pathname
                }));
            });
        });
    }

    /**
     * Comment Counts
     * Strips "comment"/"comments" text from comment_count output,
     * leaving just the number next to the SVG bubble icon.
     */
    function initCommentCounts() {
        document.querySelectorAll('.ds-meta-comments-text').forEach(function(el) {
            var match = el.textContent.match(/\d+/);
            if (match) {
                el.textContent = match[0];
            }
        });
    }

    /**
     * Post Art Strip
     * 50px peek of the generative SVG on posts without a feature_image.
     * Click expands to full reveal; click again collapses.
     * Fetches /<slug>.json from the art worker to render parameter-driven microcopy.
     */
    function initPostArt() {
        // Click toggles strip expansion
        document.querySelectorAll('.post-art').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var expanded = btn.getAttribute('aria-expanded') === 'true';
                btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            });
        });

        // Fetch parameter-driven microcopy
        document.querySelectorAll('.post-art-caption[data-art-slug]').forEach(async function(cap) {
            var slug = cap.dataset.artSlug;
            var baseUrl = cap.dataset.artUrl;
            if (!slug || !baseUrl) return;
            try {
                var r = await fetch(baseUrl + '/' + encodeURIComponent(slug) + '.json');
                if (!r.ok) return;
                var data = await r.json();
                cap.textContent = formatPostArtMicrocopy(data);
            } catch (e) {
                // leave the fallback caption in place
            }
        });
    }

    function formatPostArtMicrocopy(data) {
        if (!data || !Array.isArray(data.panels) || data.panels.length === 0) {
            return data && data.seed ? '0x' + data.seed : 'Generative';
        }
        var seen = {};
        var strategies = [];
        for (var i = 0; i < data.panels.length; i++) {
            var s = data.panels[i].strategy;
            if (!seen[s]) { seen[s] = true; strategies.push(s); }
        }
        var parts = [];
        if (data.seed) parts.push('0x' + data.seed);
        parts.push(data.panels.length + ' panels');
        parts.push(strategies.join(' · '));
        return parts.join(' · ');
    }

    /**
     * Reading Time Recalculation
     * Recomputes reading time client-side, excluding .cpj-no-count elements
     * (embedded tiles, charts, and other non-prose content).
     * Targets the [data-reading-time] span in the post meta header.
     */
    function initReadingTimeRecalc() {
        var target = document.querySelector('[data-reading-time]');
        if (!target) return;

        var body = document.querySelector('.post-body, .gh-content, article .post-content');
        if (!body) return;

        var clone = body.cloneNode(true);
        clone.querySelectorAll('.cpj-no-count').forEach(function (el) { el.remove(); });

        var text = (clone.textContent || '').trim();
        if (!text) return;
        var words = text.split(/\s+/).filter(Boolean).length;
        var minutes = Math.max(1, Math.round(words / 275));
        target.textContent = minutes + ' min read';
    }

})();
