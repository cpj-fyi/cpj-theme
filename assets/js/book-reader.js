/* Progressive enhancements; chapter links and Ghost access work without JS. */
(function () {
    'use strict';
    var sections = ['start-end', 'foundations', 'structuring', 'direction', 'practice', 'learning', 'space'];
    var sectionNames = { 'start-end': 'Start & End', foundations: 'Foundations', structuring: 'Structuring', direction: 'Direction', practice: 'Practice', learning: 'Learning', space: 'Space' };
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
    function badge(num, section) {
        var el = document.createElement('span');
        el.className = 'reader-badge';
        el.dataset.section = section;
        var figure = document.createElement('span');
        figure.className = 'reader-badge-number';
        figure.textContent = String(num);
        el.appendChild(figure);
        return el;
    }
    function plainNumber(num) {
        var el = document.createElement('span');
        el.className = 'reader-list-num';
        el.textContent = String(num);
        return el;
    }
    function titleWithoutNumber(title) { return title.replace(/^\d+[.\s:]+/, ''); }
    function decorateLinks() {
        document.querySelectorAll('.chapter-list-link, .chapter-btn').forEach(function (link) {
            var current = path(link.href) === path(window.location.href);
            if (current) {
                link.classList.add('is-current');
                link.setAttribute('aria-current', 'page');
            }
            if (link.dataset.readerDecorated) return;
            var titleNode = link.querySelector('.chapter-list-title') || link;
            var title = titleNode.textContent.trim();
            var num = number(title, link.href);
            var section = sectionFor(link);
            var numbered = num !== null && section !== 'start-end';
            if (link.classList.contains('chapter-btn')) {
                if (numbered) {
                    link.replaceChildren(current ? badge(num, section) : plainNumber(num));
                    link.classList.add('reader-shaped');
                }
            } else {
                var label = document.createElement('span');
                label.className = 'reader-chapter-title';
                label.textContent = numbered ? titleWithoutNumber(title) : title;
                if (numbered) {
                    link.classList.add('reader-numbered');
                    titleNode.replaceChildren(current ? badge(num, section) : plainNumber(num), document.createTextNode(' '), label);
                } else {
                    titleNode.replaceChildren(label);
                }
            }
            link.dataset.readerDecorated = 'true';
        });
    }
    function chapterCatalog() {
        var catalog = document.getElementById('book-chapter-catalog');
        if (!catalog) return [];
        var seen = new Set();
        return Array.from(catalog.content.querySelectorAll('a')).map(function (link, index) {
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
    }
    function chapterHeaders(chapters) {
        var chapterPage = document.querySelector('.chapter-page');
        if (!chapterPage) return;
        var section = sectionFor(chapterPage);
        chapterPage.dataset.section = section;
        var sectionHeading = chapterPage.querySelector('.chapter-section-name');
        if (section !== 'start-end' && sectionHeading && !sectionHeading.querySelector('.chapter-section-range')) {
            var numbers = Array.from(chapterPage.querySelectorAll('.chapter-list-link')).map(function (link) {
                return number(link.textContent, link.href);
            }).filter(function (num) { return num !== null; });
            if (numbers.length) {
                var range = document.createElement('span');
                range.className = 'chapter-section-range';
                range.textContent = numbers[0] + (numbers.length > 1 ? '–' + numbers[numbers.length - 1] : '');
                sectionHeading.appendChild(range);
            }
        }
        var mobileTitle = document.querySelector('.mobile-book-title');
        if (mobileTitle && !mobileTitle.querySelector('.mobile-book-section')) {
            var bookLabel = document.createElement('span');
            bookLabel.className = 'mobile-book-label';
            bookLabel.textContent = mobileTitle.textContent.trim();
            var sectionLabel = document.createElement('span');
            sectionLabel.className = 'mobile-book-section';
            sectionLabel.textContent = sectionNames[section];
            mobileTitle.replaceChildren(bookLabel, sectionLabel);
        }
        var title = chapterPage.querySelector('.post-title');
        var match = title && title.textContent.trim().match(/^(\d+)[.\s:]+/);
        if (!match || section === 'start-end') return;
        var words = title.textContent.trim().slice(match[0].length);
        // Reuse main.js's existing number wrapper. Keep a hidden separator so
        // textContent remains "13. Title" for PatternPulse and assistive tech.
        var titleNumber = title.querySelector('.chapter-num') || document.createElement('span');
        titleNumber.className = 'chapter-num';
        titleNumber.textContent = match[1];
        var separator = document.createElement('span');
        separator.className = 'reader-title-separator';
        separator.textContent = '. ';
        var titleWords = document.createElement('span');
        titleWords.className = 'reader-title-words';
        titleWords.textContent = words;
        title.replaceChildren(titleNumber, separator, titleWords);
        var count = chapters.filter(function (chapter) { return chapter.number !== null; }).length;
        if (count && !chapterPage.querySelector('.chapter-kicker')) {
            var kicker = document.createElement('div');
            kicker.className = 'chapter-kicker';
            kicker.dataset.section = section;
            var shape = document.createElement('span');
            shape.className = 'chapter-kicker-shape';
            shape.setAttribute('aria-hidden', 'true');
            var text = document.createElement('span');
            text.textContent = sectionNames[section] + ' · Pattern ' + match[1] + ' of ' + count;
            kicker.append(shape, text);
            title.before(kicker);
        }
    }
    function arrow(direction) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'reader-arrow');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '13');
        svg.setAttribute('height', '13');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', direction === 'prev' ? 'M19 12H5m7 7-7-7 7-7' : 'M5 12h14m-7-7 7 7-7 7');
        svg.appendChild(line);
        return svg;
    }
    function pagination(chapters) {
        var nav = document.querySelector('.reader-pagination');
        if (!nav || !chapters.length) return;
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
            var labelText = document.createElement('span'); labelText.className = 'reader-pagination-label-text';
            labelText.textContent = direction === 'prev' ? 'Previous' : 'Next';
            if (chapter.number !== null) {
                labelText.textContent += ' · ' + sectionNames[chapter.section];
                if (direction === 'next' && chapter.section !== currentPage.section) labelText.textContent += ' begins';
            }
            if (direction === 'prev') label.append(arrow(direction), labelText);
            else label.append(labelText, arrow(direction));
            var title = document.createElement('span'); title.className = 'reader-pagination-title';
            if (chapter.number !== null) title.appendChild(badge(chapter.number, chapter.section));
            var words = document.createElement('span'); words.className = 'reader-pagination-title-text'; words.textContent = titleWithoutNumber(chapter.title); title.appendChild(words);
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
            if (!link || !/^(next|previous)(\s+chapter)?\s*[\u2192\u2190]?$/i.test(link.textContent.trim())) return;
            var destination = new URL(link.href);
            var shortNumber = destination.hostname === 'hd-pt.com' && destination.pathname.match(/^\/(\d+)\/?$/);
            if (Array.from(nav.querySelectorAll('a')).some(function (item) {
                return path(item.href) === path(link.href) || (shortNumber && number('', item.href) === Number(shortNumber[1]));
            })) card.hidden = true;
        });
    }
    function centerLink(row, active) {
        if (!row || !active || !row.clientWidth) return;
        row.scrollLeft += active.getBoundingClientRect().left - row.getBoundingClientRect().left - row.clientWidth / 2 + active.offsetWidth / 2;
    }
    function centerNavigation() {
        var subnav = document.querySelector('.book-subnav-inner');
        var currentSection = sections.find(function (section) { return document.body.classList.contains('tag-' + section); });
        if (document.body.classList.contains('page-template-custom-buy')) currentSection = 'buy';
        var activeSection = subnav && currentSection && subnav.querySelector('.subnav-' + currentSection);
        if (activeSection) {
            activeSection.setAttribute('aria-current', 'page');
            centerLink(subnav, activeSection);
        }
        var mobile = document.querySelector('.mobile-chapter-nav-inner');
        centerLink(mobile, mobile && mobile.querySelector('.is-current'));
    }
    function layout() {
        var chapterPage = document.querySelector('.chapter-page');
        if (!chapterPage) { centerNavigation(); return; }
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
        }
        window.addEventListener('resize', function () { measure(); centerNavigation(); });
        requestAnimationFrame(centerNavigation);
        if (document.fonts) document.fonts.ready.then(function () { measure(); centerNavigation(); });
        var list = document.querySelector('.chapter-sidebar .chapter-list-nav');
        var active = list && list.querySelector('.is-current');
        if (active) list.scrollTop += active.getBoundingClientRect().top - list.getBoundingClientRect().top - list.clientHeight / 2 + active.offsetHeight / 2;
    }
    function init() {
        var chapters = chapterCatalog();
        chapterHeaders(chapters);
        decorateLinks();
        pagination(chapters);
        layout();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
