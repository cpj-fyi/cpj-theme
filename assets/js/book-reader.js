/* Progressive enhancements; chapter links and Ghost access work without JS. */
(function () {
    'use strict';
    var sections = ['start-end', 'foundations', 'structuring', 'direction', 'practice', 'learning', 'space'];
    var svgNamespace = 'http://www.w3.org/2000/svg';
    // Center the original logo geometry, including the full 52-unit parallelogram.
    // Keep these viewports in sync with assets/images/sections/*.svg.
    var shapeViews = {
        foundations: '-1.5 0.27342 44 44',
        structuring: '47.5 -0.10163 44 44',
        direction: '91.5 -0.22658 54 44',
        practice: '151.5 0.27342 44 44',
        learning: '204.5 -0.22664 44 44',
        space: '258 -1.35736 44 44'
    };
    function shapeDefinitions() {
        if (document.getElementById('reader-logo-shapes')) return true;
        var logoPath = document.querySelector('.nav-logo path');
        if (!logoPath) return false;
        // Reuse the theme's logo once. Each nav badge references this definition,
        // so outline rendering needs no fetches or duplicate path strings.
        var svg = document.createElementNS(svgNamespace, 'svg');
        svg.setAttribute('class', 'reader-shape-definitions');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        var defs = document.createElementNS(svgNamespace, 'defs');
        var shape = logoPath.cloneNode(true);
        shape.setAttribute('id', 'reader-logo-shapes');
        shape.setAttribute('vector-effect', 'non-scaling-stroke');
        defs.appendChild(shape);
        svg.appendChild(defs);
        document.body.appendChild(svg);
        return true;
    }
    function path(url) { return new URL(url, window.location.href).pathname.replace(/\/$/, '') || '/'; }
    function number(title, url) {
        var match = title.trim().match(/^(\d+)[.\s:]+/) || path(url).match(/^\/(\d+)-/);
        return match ? Number(match[1]) : null;
    }
    function sectionFor(node) {
        return sections.find(function (section) {
            return node.closest('.tag-' + section) || node.classList.contains('chapter-btn-' + section);
        }) || 'start-end';
    }
    function badge(num, section, navigation) {
        var el = document.createElement('span');
        el.className = 'reader-badge';
        el.dataset.section = section;
        if (navigation && shapeViews[section] && shapeDefinitions()) {
            el.classList.add('reader-nav-badge');
            var svg = document.createElementNS(svgNamespace, 'svg');
            svg.setAttribute('class', 'reader-badge-outline');
            svg.setAttribute('viewBox', shapeViews[section]);
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');
            var shape = document.createElementNS(svgNamespace, 'use');
            shape.setAttribute('href', '#reader-logo-shapes');
            svg.appendChild(shape);
            var figure = document.createElement('span');
            figure.className = 'reader-badge-number';
            figure.textContent = String(num);
            el.append(svg, figure);
        } else {
            el.textContent = String(num);
        }
        return el;
    }
    function titleWithoutNumber(title) { return title.replace(/^\d+[.\s:]+/, ''); }
    function decorateLinks() {
        document.querySelectorAll('.chapter-list-link, .chapter-btn').forEach(function (link) {
            if (path(link.href) === path(window.location.href)) {
                link.classList.add('is-current');
                link.setAttribute('aria-current', 'page');
            }
            var titleNode = link.querySelector('.chapter-list-title') || link;
            var title = titleNode.textContent.trim();
            var num = number(title, link.href);
            if (num === null || link.querySelector('.reader-badge')) return;
            var section = sectionFor(link);
            if (section === 'start-end') return;
            if (link.classList.contains('chapter-btn')) {
                link.replaceChildren(badge(num, section, true));
                link.classList.add('reader-shaped');
            } else {
                var label = document.createElement('span');
                label.className = 'reader-chapter-title';
                label.textContent = titleWithoutNumber(title);
                titleNode.replaceChildren(badge(num, section, true), document.createTextNode(' '), label);
            }
        });
    }
    function pagination() {
        var catalog = document.getElementById('book-chapter-catalog');
        var nav = document.querySelector('.reader-pagination');
        if (!catalog || !nav) return;
        var seen = new Set();
        var chapters = Array.from(catalog.content.querySelectorAll('a')).map(function (link, index) {
            var title = link.textContent.trim();
            var tags = link.dataset.sections.trim().split(/\s+/);
            return { href: link.href, title: title, number: number(title, link.href), section: sections.find(function (s) { return tags.includes(s); }) || 'start-end', index: index };
        }).filter(function (chapter) {
            var key = path(chapter.href);
            if (seen.has(key)) return false;
            seen.add(key); return true;
        }).sort(function (a, b) {
            if (a.number !== null && b.number !== null) return a.number - b.number;
            if (a.number === null && b.number !== null) return -1;
            if (b.number === null && a.number !== null) return 1;
            return a.index - b.index;
        });
        var currentPage = chapters.find(function (chapter) { return path(chapter.href) === path(window.location.href); });
        if (!currentPage) return;
        // Pattern List and Goal Index are reference pages, not stops between
        // the introduction and the first numbered pattern.
        var introduction = chapters.find(function (chapter) { return /^introduction$/i.test(chapter.title); });
        chapters = chapters.filter(function (chapter) { return chapter.number !== null || chapter === introduction; });
        var current = chapters.indexOf(currentPage);
        function add(chapter, direction) {
            if (!chapter) return;
            var link = document.createElement('a');
            link.className = 'reader-pagination-link'; link.href = chapter.href; link.rel = direction; link.dataset.section = chapter.section;
            var label = document.createElement('span'); label.className = 'reader-pagination-label';
            label.textContent = direction === 'prev' ? '← Previous chapter' : 'Next chapter →';
            var title = document.createElement('span'); title.className = 'reader-pagination-title';
            if (chapter.number !== null) title.appendChild(badge(chapter.number, chapter.section));
            var words = document.createElement('span'); words.textContent = titleWithoutNumber(chapter.title); title.appendChild(words);
            link.append(label, title); nav.appendChild(link);
        }
        if (current < 0) {
            add(introduction, 'prev');
            add(chapters.find(function (chapter) { return chapter.number !== null; }), 'next');
        } else {
            add(chapters[current - 1], 'prev'); add(chapters[current + 1], 'next');
        }
        nav.hidden = !nav.children.length;
        // Replace only authored chapter-navigation cards with a matching destination.
        document.querySelectorAll('.chapter-content .content .kg-button-card').forEach(function (card) {
            var link = card.querySelector('a');
            if (!link || !/^(next|previous)(\s+chapter)?\s*[→←]?$/i.test(link.textContent.trim())) return;
            var destination = new URL(link.href);
            var shortNumber = destination.hostname === 'hd-pt.com' && destination.pathname.match(/^\/(\d+)\/?$/);
            if (Array.from(nav.querySelectorAll('a')).some(function (item) {
                return path(item.href) === path(link.href) || (shortNumber && number('', item.href) === Number(shortNumber[1]));
            })) card.hidden = true;
        });
    }
    function layout() {
        var chapterPage = document.querySelector('.chapter-page');
        if (!chapterPage) return;
        chapterPage.dataset.section = sectionFor(chapterPage);
        var header = document.querySelector('.site-header');
        var mobile = document.querySelector('.mobile-chapter-nav');
        function measure() {
            if (header) document.documentElement.style.setProperty('--reader-header-height', header.getBoundingClientRect().height + 'px');
            if (mobile && mobile.offsetHeight) document.documentElement.style.setProperty('--reader-mobile-height', mobile.offsetHeight + 'px');
        }
        measure();
        if (window.ResizeObserver) {
            var observer = new ResizeObserver(measure);
            if (header) observer.observe(header);
            if (mobile) observer.observe(mobile);
        } else { window.addEventListener('resize', measure); }
        var list = document.querySelector('.chapter-sidebar .chapter-list-nav');
        var active = list && list.querySelector('.is-current');
        if (active) list.scrollTop += active.getBoundingClientRect().top - list.getBoundingClientRect().top - list.clientHeight / 2 + active.offsetHeight / 2;
    }
    document.addEventListener('DOMContentLoaded', function () { decorateLinks(); pagination(); layout(); });
})();
