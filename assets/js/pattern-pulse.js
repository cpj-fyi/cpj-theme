/* Optional PatternPulse aggregate strip. No member identity is sent to the research service. */
(function () {
    'use strict';

    function element(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }

    // Hamilton / largest-remainder allocation: every published strip has exactly 100 ticks.
    // Resolve equal remainders in response order so refreshes never reshuffle tied bins.
    function allocateTicks(distribution, sampleSize) {
        var shares = distribution.map(function (bin, index) {
            var exact = bin.count / sampleSize * 100;
            var count = Math.floor(exact);
            return { index: index, count: count, remainder: exact - count };
        });
        var remaining = 100 - shares.reduce(function (sum, share) { return sum + share.count; }, 0);
        shares.slice().sort(function (a, b) {
            return b.remainder - a.remainder || a.index - b.index;
        }).slice(0, remaining).forEach(function (share) {
            shares[share.index].count += 1;
        });
        return shares.map(function (share) { return share.count; });
    }

    function init() {
        var host = document.querySelector('[data-pattern-pulse-url]');
        if (!host || !host.dataset.patternPulseUrl) return;
        var article = host.closest('article') || host;
        var content = host.matches('.content') ? host : host.querySelector('.content');
        var title = article.querySelector('.post-title');
        var match = title && title.textContent.trim().match(/^(\d{1,3})[.\s:]/);
        if (!content || !match || Number(match[1]) < 1) return;
        var patternId = String(Number(match[1]));
        var base;
        try {
            base = new URL(host.dataset.patternPulseUrl);
            if (base.protocol !== 'https:' && !(base.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(base.hostname))) return;
            if (base.username || base.password || base.search || base.hash) return;
        } catch (_) { return; }
        var baseUrl = base.href.replace(/\/$/, '');
        var details = element('details', 'pattern-pulse cpj-no-count');
        details.hidden = true;
        details.setAttribute('data-pagefind-ignore', '');
        var summary = element('summary', 'pattern-pulse-toggle');
        var bar = element('span', 'pattern-pulse-strip');
        bar.setAttribute('aria-hidden', 'true');
        var accessibleLabel = element('span', 'pattern-pulse-sr-only');
        var meta = element('span', 'pattern-pulse-meta');
        meta.setAttribute('aria-hidden', 'true');
        var metaFinding = element('span', 'pattern-pulse-meta-finding');
        var agreementLabel = element('span', 'pattern-pulse-meta-value pattern-pulse-agreement');
        var responseLabel = element('span', 'pattern-pulse-meta-value pattern-pulse-responses');
        metaFinding.append(element('span', 'pattern-pulse-name', 'PatternPulse'), agreementLabel, responseLabel);
        var disclosure = element('span', 'pattern-pulse-disclosure');
        var chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chevron.setAttribute('class', 'pattern-pulse-chevron');
        chevron.setAttribute('viewBox', '0 0 24 24');
        chevron.setAttribute('fill', 'none');
        chevron.setAttribute('stroke', 'currentColor');
        chevron.setAttribute('stroke-width', '2');
        chevron.setAttribute('stroke-linecap', 'round');
        chevron.setAttribute('stroke-linejoin', 'round');
        chevron.setAttribute('aria-hidden', 'true');
        chevron.setAttribute('focusable', 'false');
        var chevronPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        chevronPath.setAttribute('d', 'm6 9 6 6 6-6');
        chevron.append(chevronPath);
        disclosure.append(element('span', 'pattern-pulse-detail-label', 'Details'), element('span', 'pattern-pulse-hide-label', 'Hide'), chevron);
        meta.append(metaFinding, disclosure);
        summary.append(bar, meta, accessibleLabel);
        var findingText = '';
        function updateAccessibleLabel() {
            accessibleLabel.textContent = 'PatternPulse: ' + findingText + '. ' + (details.open ? 'Hide' : 'Expand') + ' research details.';
        }
        details.addEventListener('toggle', updateAccessibleLabel);
        var panel = element('div', 'pattern-pulse-panel');
        var question = element('p', 'pattern-pulse-question');
        var legend = element('ul', 'pattern-pulse-legend');
        var methodology = element('p', 'pattern-pulse-methodology');
        var status = element('p', 'pattern-pulse-status');
        status.setAttribute('role', 'status');
        panel.append(question, legend, methodology, status);
        if (host.dataset.patternPulseCanContribute === 'true') {
            var action = element('a', 'pattern-pulse-contribute', 'I use this');
            action.href = baseUrl + '/patterns/' + patternId + '/use';
            action.referrerPolicy = 'no-referrer';
            var actionNote = element('span', 'pattern-pulse-action-note', 'Share your experience with the research.');
            var actions = element('div', 'pattern-pulse-actions');
            actions.append(action, actionNote);
            panel.append(actions);
        }
        details.append(summary, panel);
        var epigraph = content.querySelector('blockquote');
        var mounted = false;

        function mount() {
            if (mounted) return;
            if (epigraph) {
                // Keep research UI outside the quotation while sharing its white ground.
                var ground = element('div', 'pattern-pulse-epigraph');
                ground.classList.toggle('pattern-pulse-epigraph-alt', epigraph.classList.contains('kg-blockquote-alt'));
                epigraph.before(ground);
                ground.append(details, epigraph);
            } else {
                content.prepend(details);
            }
            mounted = true;
        }

        var loading = false;
        var hasData = false;
        async function refresh() {
            if (loading || document.hidden) return;
            loading = true;
            var controller = new AbortController();
            var timeout = window.setTimeout(function () { controller.abort(); }, 8000);
            try {
                var response = await fetch(baseUrl + '/api/public/patterns/' + patternId, {
                    credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal
                });
                if (!response.ok) throw new Error('Unavailable');
                var data = await response.json();
                if (String(data.patternId) !== patternId || typeof data.questionText !== 'string' || typeof data.methodology !== 'string') throw new Error('Invalid summary');
                var available = data.status === 'available';
                if (available) {
                    if (!Number.isSafeInteger(data.sampleSize) || data.sampleSize < 10 || !Array.isArray(data.distribution) || data.distribution.length !== 5) throw new Error('Invalid sample');
                    var total = 0;
                    data.distribution.forEach(function (bin, index) {
                        if (bin.value !== index + 1 || !Number.isSafeInteger(bin.count) || bin.count < 0 || typeof bin.label !== 'string') throw new Error('Invalid distribution');
                        total += bin.count;
                    });
                    if (total !== data.sampleSize) throw new Error('Invalid total');
                } else if (data.status !== 'insufficient_data') { throw new Error('Invalid status'); }
                bar.replaceChildren();
                legend.replaceChildren();
                details.classList.toggle('pattern-pulse-empty', !available);
                responseLabel.hidden = !available;
                if (available) {
                    var agreement = Math.round((data.distribution[3].count + data.distribution[4].count) / data.sampleSize * 100);
                    findingText = agreement + '% agree · ' + data.sampleSize.toLocaleString() + ' survey responses';
                    agreementLabel.textContent = agreement + '% agree';
                    responseLabel.textContent = data.sampleSize.toLocaleString() + ' responses';
                    var tickCounts = allocateTicks(data.distribution, data.sampleSize);
                    data.distribution.forEach(function (bin, index) {
                        var percentage = bin.count / data.sampleSize * 100;
                        for (var tick = 0; tick < tickCounts[index]; tick += 1) {
                            bar.append(element('span', 'pattern-pulse-tick pattern-pulse-bin-' + (index + 1)));
                        }
                        var item = element('li', 'pattern-pulse-legend-item');
                        var track = element('span', 'pattern-pulse-legend-track');
                        track.setAttribute('aria-hidden', 'true');
                        var fill = element('span', 'pattern-pulse-legend-fill pattern-pulse-bin-' + (index + 1));
                        fill.style.width = percentage + '%';
                        track.append(fill);
                        item.append(element('span', 'pattern-pulse-legend-label', bin.label), track, element('span', 'pattern-pulse-count', Math.round(percentage) + '% · ' + bin.count.toLocaleString()));
                        legend.append(item);
                    });
                } else {
                    findingText = 'Research in progress';
                    agreementLabel.textContent = findingText;
                    responseLabel.textContent = '';
                    for (var pending = 0; pending < 100; pending += 1) {
                        bar.append(element('span', 'pattern-pulse-tick pattern-pulse-pending'));
                    }
                }
                question.textContent = '“' + data.questionText + '”';
                methodology.textContent = available ? data.methodology : 'Results appear after at least 10 completed research-survey responses pass quality checks. Reader declarations are collected separately.';
                legend.hidden = !available;
                var updated = data.updatedAt && new Date(data.updatedAt);
                if (available && updated && !isNaN(updated.getTime())) methodology.textContent += ' Latest response: ' + updated.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + '.';
                updateAccessibleLabel();
                status.textContent = '';
                hasData = true;
                mount();
                details.hidden = false;
            } catch (_) {
                if (hasData) status.textContent = 'Update unavailable; showing the last retrieved results.';
            } finally {
                window.clearTimeout(timeout);
                loading = false;
            }
        }
        refresh();
        window.setInterval(refresh, 5 * 60 * 1000);
        document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
}());
