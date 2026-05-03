# Math + footnotes-as-sidenotes — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render LaTeX math (KaTeX) and pandoc-style markdown footnotes (transformed into the existing margin-sidenote system) in cpj.fyi post bodies.

**Architecture:** Self-hosted KaTeX, all logic client-side. A `transformFootnotes(postBody)` DOM walker converts `[^id]` markdown syntax into the existing `<aside class="sidenote">` DOM. The existing `initSidenotes()` is extended to honor new `data-fnref` / `data-fnmarker` attributes for precise inline marker placement. KaTeX loads conditionally — only on posts whose `.post-body` text contains math delimiters.

**Tech Stack:** Vanilla JS (theme uses no framework), KaTeX 0.16.x (vendored), CSS, Handlebars (no template changes).

**Spec:** `docs/plans/2026-05-03-math-and-footnotes-design.md` — read it before starting.

**Pre-flight:** This plan extends an existing JS file (`assets/js/main.js`) and an existing CSS file (`assets/css/screen.css`). The cpj-theme has no automated tests; verification is manual via a draft post on Ghost (deploy theme zip after each significant task, or use a local Ghost dev install). Commit after each task; deploy to Ghost once at the end (Task 9).

---

## File Structure

**New files:**
- `assets/lib/katex/katex.min.css` (vendored)
- `assets/lib/katex/katex.min.js` (vendored)
- `assets/lib/katex/auto-render.min.js` (vendored)
- `assets/lib/katex/fonts/*.woff2` (vendored, ~20 files)

**Modified files:**
- `assets/js/main.js` — add `transformFootnotes()`, `loadAndRenderMath()`; extend `initSidenotes()`; update DOMContentLoaded orchestration on post pages
- `assets/css/screen.css` — append rules for `.post-body .katex-display` centering and any inline-math vertical-align tweak

**Untouched:**
- `default.hbs`, all `.hbs` partials (no template changes)
- `package.json` (no build deps)

---

## Task 1: Vendor KaTeX

**Files:**
- Create: `assets/lib/katex/katex.min.css`
- Create: `assets/lib/katex/katex.min.js`
- Create: `assets/lib/katex/auto-render.min.js`
- Create: `assets/lib/katex/fonts/KaTeX_*.woff2` (all of them)

- [ ] **Step 1: Download KaTeX 0.16.21 (or latest stable 0.16.x) release**

```bash
cd "/Users/clayjones/Library/Mobile Documents/com~apple~CloudDocs/Claude/monafor/cpj-theme"
mkdir -p assets/lib/katex
curl -L -o /tmp/katex.tar.gz https://github.com/KaTeX/KaTeX/releases/download/v0.16.21/katex.tar.gz
tar -xzf /tmp/katex.tar.gz -C /tmp
ls /tmp/katex/
```

Expected output: `katex.min.css  katex.min.js  contrib  fonts  README.md  ...`

- [ ] **Step 2: Copy required files**

```bash
cp /tmp/katex/katex.min.css assets/lib/katex/katex.min.css
cp /tmp/katex/katex.min.js assets/lib/katex/katex.min.js
cp /tmp/katex/contrib/auto-render.min.js assets/lib/katex/auto-render.min.js
mkdir -p assets/lib/katex/fonts
cp /tmp/katex/fonts/*.woff2 assets/lib/katex/fonts/
```

- [ ] **Step 3: Drop ttf and woff (woff2 only) — they should not have been copied above; verify**

```bash
ls assets/lib/katex/fonts/ | grep -v woff2$ || echo "clean — woff2 only"
```

Expected: `clean — woff2 only`

- [ ] **Step 4: Verify total weight**

```bash
du -sh assets/lib/katex
```

Expected: ~280KB-350KB total. If significantly larger, re-check that ttf/woff weren't copied.

- [ ] **Step 5: Verify CSS font URLs are relative**

```bash
grep -o "url([^)]*)" assets/lib/katex/katex.min.css | head -5
```

Expected: paths like `url(fonts/KaTeX_Main-Regular.woff2)` — relative, so they resolve against the CSS file's location regardless of where Ghost serves the theme from.

- [ ] **Step 6: Commit**

```bash
git add assets/lib/katex
git commit -m "feat: vendor KaTeX 0.16.x for client-side math rendering"
```

---

## Task 2: Plumb empty transformFootnotes() and post-page gate

**Files:**
- Modify: `assets/js/main.js` (add stub function and call site)

- [ ] **Step 1: Add a stub `transformFootnotes` and `loadAndRenderMath` near the existing `initSidenotes` function block**

Insert in `assets/js/main.js` immediately before the existing `function initSidenotes()` (around line 320):

```js
    /**
     * Markdown footnote transform — converts `[^id]` markers and `[^id]: ...`
     * definitions into the existing <aside class="sidenote"> DOM. See
     * docs/plans/2026-05-03-math-and-footnotes-design.md for full spec.
     */
    function transformFootnotes(postBody) {
        // Pass 1: collect definitions  (Task 3)
        // Pass 2: insert markers       (Task 4)
        // Pass 3: emit asides          (Task 5)
        return; // stub
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
        });
    }
```

- [ ] **Step 2: Wire into the DOMContentLoaded sequence**

Find the existing block (around line 10):
```js
        initSidenotes();
        initEverything();
        initSearch();
        initPostArt();
        initReadingTimeRecalc();
```

Replace with:
```js
        initPostExtras();   // footnotes + sidenotes + math, in order
        initEverything();
        initSearch();
        initPostArt();
```

(`initReadingTimeRecalc()` moves into `initPostExtras` so it runs after KaTeX.)

Add `initPostExtras` function near the top of the IIFE:
```js
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
```

Note: `initSidenotes` and `positionSidenotes` are existing functions in this file; `initPostExtras` calls them by reference, which works because the IIFE keeps them in scope.

- [ ] **Step 3: Verify no JS errors on existing posts**

Manual: deploy theme to a staging Ghost OR open `cpj-theme/assets/js/main.js` in a syntax-checker (e.g., `node --check assets/js/main.js`).

```bash
node --check assets/js/main.js
```

Expected: no output (file is syntactically valid).

Also verify no behavioral regression by mentally tracing: `initSidenotes` still runs on post pages, `initReadingTimeRecalc` still runs (now after the math gate), and posts without math don't pay any cost (the gate returns false instantly).

- [ ] **Step 4: Commit**

```bash
git add assets/js/main.js
git commit -m "feat: scaffold transformFootnotes + KaTeX loader, reorder post-page init"
```

---

## Task 3: transformFootnotes Pass 1 — collect definitions

**Files:**
- Modify: `assets/js/main.js` (fill in Pass 1 of `transformFootnotes`)

- [ ] **Step 1: Replace the Pass 1 stub comment with the implementation**

In `transformFootnotes`, replace `// Pass 1: collect definitions  (Task 3)` and the `return; // stub` with:

```js
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
```

(The `defs` Map is local to `transformFootnotes` and is shared across the three passes via lexical scope.)

- [ ] **Step 2: Browser-test in the console on a draft post**

Manual: with theme deployed to a Ghost instance, on a draft post containing `[^1]: foo` and `[^2]: bar`:

```js
// In browser devtools, after page load:
document.querySelectorAll('.post-body p').forEach(p => {
    if (/^\[\^/.test(p.textContent)) console.log('SURVIVED:', p.textContent);
});
// Expected: nothing logged. All [^id]: paragraphs were removed.
console.log(document.querySelector('.post-body')._fnDefs);
// Expected: Map(2) { "1" => "foo", "2" => "bar" }
```

If you don't have a deployed instance handy, defer this verification to Task 9 (final test pass).

- [ ] **Step 3: Commit**

```bash
git add assets/js/main.js
git commit -m "feat: footnote transform pass 1 — collect [^id]: definitions"
```

---

## Task 4: transformFootnotes Pass 2 — insert marker placeholders

**Files:**
- Modify: `assets/js/main.js`

- [ ] **Step 1: Replace the Pass 2 stub comment with the implementation**

After the Pass 1 block, add:

```js
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
```

- [ ] **Step 2: Browser-test on a draft post**

Manual on the same draft: open devtools after page load, run:

```js
document.querySelectorAll('.post-body [data-fnmarker]').forEach(s => console.log(s.dataset.fnmarker));
// Expected: ids in document order: "1", "2", ...
```

Also verify no `[^id]` literal text remains where it shouldn't:

```js
console.log(document.querySelector('.post-body').innerHTML.match(/\[\^[^\]]+\]/g));
// Expected: null (or only matches inside <pre>/<code>)
```

- [ ] **Step 3: Commit**

```bash
git add assets/js/main.js
git commit -m "feat: footnote transform pass 2 — insert data-fnmarker placeholders"
```

---

## Task 5: transformFootnotes Pass 3 — emit asides

**Files:**
- Modify: `assets/js/main.js`

- [ ] **Step 1: Replace the Pass 3 stub comment with the implementation**

After the Pass 2 block:

```js
        // Pass 3: for each marker, emit an <aside class="sidenote" data-fnref>
        // after the marker's nearest block ancestor.
        var BLOCK = /^(P|LI|BLOCKQUOTE|H[1-6]|FIGURE|FIGCAPTION|DL|DD)$/;
        var emitted = new Set();
        var markerEls = postBody.querySelectorAll('[data-fnmarker]');
        markerEls.forEach(function(span) {
            var id = span.getAttribute('data-fnmarker');
            if (emitted.has(id)) {
                // Duplicate marker — leave as literal text and warn.
                if (typeof console !== 'undefined') {
                    console.warn('[footnotes] marker [^' + id + '] referenced more than once');
                }
                span.replaceWith(document.createTextNode('[^' + id + ']'));
                return;
            }
            if (!defs.has(id)) {
                if (typeof console !== 'undefined') {
                    console.warn('[footnotes] orphan marker [^' + id + ']');
                }
                span.replaceWith(document.createTextNode('[^' + id + ']'));
                return;
            }
            emitted.add(id);
            var aside = document.createElement('aside');
            aside.className = 'sidenote';
            aside.setAttribute('data-fnref', id);
            aside.innerHTML = defs.get(id);
            // Find the block ancestor.
            var anchor = span;
            while (anchor && anchor.parentNode !== postBody) {
                if (BLOCK.test(anchor.nodeName)) break;
                anchor = anchor.parentNode;
            }
            if (!anchor || anchor === postBody) anchor = span;
            // For list items, prefer inserting after the parent <ul>/<ol>.
            if (anchor.nodeName === 'LI' && anchor.parentNode &&
                /^(UL|OL)$/.test(anchor.parentNode.nodeName)) {
                anchor = anchor.parentNode;
            }
            anchor.parentNode.insertBefore(aside, anchor.nextSibling);
        });
```

- [ ] **Step 2: Browser-test on a draft post**

Manual on the draft post:

```js
document.querySelectorAll('.post-body aside.sidenote[data-fnref]').forEach(a =>
    console.log(a.dataset.fnref, '->', a.textContent.slice(0, 50)));
// Expected: id -> definition text, in document order
```

The asides will look unstyled and weird at this point — they appear inline-blocky because the existing CSS positions them via `initSidenotes` (which hasn't been extended yet). That's expected. Task 6 fixes it.

- [ ] **Step 3: Commit**

```bash
git add assets/js/main.js
git commit -m "feat: footnote transform pass 3 — emit asides after block ancestors"
```

---

## Task 6: Extend initSidenotes() to honor data-fnref / data-fnmarker

**Files:**
- Modify: `assets/js/main.js` (the existing `initSidenotes` function)

- [ ] **Step 1: Update the per-aside loop in `initSidenotes`**

Locate (in `assets/js/main.js`, currently around line 329):
```js
        sidenotes.forEach(function(note, i) {
            var num = i + 1;
            note.id = 'sn-' + num;
            note.setAttribute('role', 'note');
            // ... numEl insertion ...
            // ... closeBtn creation ...
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
            // ... click handler ...
            ref.appendChild(link);
            target.appendChild(ref);
        });
```

Change the marker placement portion (everything after `note.appendChild(closeBtn);`) to:

```js
            // Build the inline ref marker.
            var ref = document.createElement('sup');
            ref.className = 'sidenote-ref';
            ref.id = 'snref-' + num;

            var link = document.createElement('a');
            link.href = '#sn-' + num;
            link.textContent = num;
            link.setAttribute('aria-label', 'Footnote ' + num);
            link.addEventListener('click', function(e) {
                if (isDesktop()) return;
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

            // Markdown-footnote asides have data-fnref pointing to a
            // pre-positioned <span data-fnmarker> that we replace with the ref.
            var fnref = note.getAttribute('data-fnref');
            if (fnref) {
                var marker = body.querySelector('span[data-fnmarker="' + CSS.escape(fnref) + '"]');
                if (marker && marker.parentNode) {
                    marker.parentNode.replaceChild(ref, marker);
                } else {
                    // Marker missing (shouldn't happen if Pass 2/3 ran cleanly) —
                    // fall back to preceding-element placement.
                    var fallback = findRefTarget(note);
                    if (fallback) fallback.appendChild(ref);
                }
            } else {
                // HTML-card aside: existing behavior — append at end of preceding text.
                var target = findRefTarget(note);
                if (!target) return;
                target.appendChild(ref);
            }
```

- [ ] **Step 2: Verify behavior with a draft post containing both an HTML-card aside and a markdown footnote**

Manual on a draft:

- HTML card with `<p>HTML-card paragraph.</p><aside class="sidenote">HTML aside.</aside>`
- Markdown card with `Markdown text.[^1]\n\n[^1]: Markdown definition.`

After load:
```js
// Numbering should be sequential 1, 2:
document.querySelectorAll('.post-body aside.sidenote').forEach((a, i) =>
    console.log(i+1, a.id, a.dataset.fnref || '(html-card)'));
// Expected:
//   1 sn-1 (html-card)
//   2 sn-2 1
```

Both `<sup class="sidenote-ref">` markers should be visible inline with their text. Desktop ≥1200px: asides float in right margin. Mobile: asides hidden as collapsed popovers, tap markers to open.

- [ ] **Step 3: Commit**

```bash
git add assets/js/main.js
git commit -m "feat: initSidenotes honors data-fnref/data-fnmarker for inline marker placement"
```

---

## Task 7: CSS additions for math styling

**Files:**
- Modify: `assets/css/screen.css` (append at end)

- [ ] **Step 1: Append the math styling block**

Append at the bottom of `assets/css/screen.css`:

```css
/* ==========================================================================
   KaTeX math — see docs/plans/2026-05-03-math-and-footnotes-design.md
   KaTeX itself ships heavy default styles; we only override scoped to the
   post-body to keep margins consistent with surrounding prose.
   ========================================================================== */

.post-body .katex-display {
    margin: 1.5em 0;
    text-align: center;
    overflow-x: auto;
    overflow-y: hidden;
}

.post-body .katex-display > .katex {
    /* Prevents single-line equations from being clipped on narrow viewports */
    display: inline-block;
    text-align: initial;
}

.post-body .katex {
    /* KaTeX defaults to 1.21em which often renders too tall in serif body
       text; nudge inline math down to flow with the paragraph baseline. */
    font-size: 1em;
}
```

- [ ] **Step 2: Verify CSS validates**

```bash
cd "/Users/clayjones/Library/Mobile Documents/com~apple~CloudDocs/Claude/monafor/cpj-theme"
# Optional: if gscan is available, run it. Otherwise just visually scan the file.
npx gscan . 2>&1 | tail -20 || echo "gscan not available; skipping"
```

Expected: no CSS parse errors.

- [ ] **Step 3: Commit**

```bash
git add assets/css/screen.css
git commit -m "style: post-body KaTeX overrides — display centering, inline baseline"
```

---

## Task 8: Self-review pass on combined changes

**Files:**
- Read-only review of: `assets/js/main.js`, `assets/css/screen.css`, `assets/lib/katex/`

- [ ] **Step 1: Re-read the spec and trace each section through the implementation**

Open `docs/plans/2026-05-03-math-and-footnotes-design.md`. For each item under "Components", "Render order", and "Edge cases & failure modes", confirm there's matching code. Specifically check:

- Pass 1 strips `[^id]:` paragraphs whose first text node matches the regex. ✓
- Pass 2 walks only non-`<pre>`/`<code>`/`<script>`/`<style>` text nodes. ✓
- Pass 3 inserts asides after block ancestors (with `<li>`→parent-list special case). ✓
- `initSidenotes` honors `data-fnref` first, then falls back to `findRefTarget`. ✓
- Math gate scans for `$`, `\(`, `\[`. ✓
- Math runs *after* footnote transform so math inside footnotes renders. ✓
- `positionSidenotes()` re-runs after KaTeX. ✓
- `initReadingTimeRecalc` runs last. ✓
- Orphan markers and duplicates degrade to literal text + console warning. ✓

If any item doesn't match, fix it inline and add a follow-up commit.

- [ ] **Step 2: Lint-check both modified files**

```bash
cd "/Users/clayjones/Library/Mobile Documents/com~apple~CloudDocs/Claude/monafor/cpj-theme"
node --check assets/js/main.js && echo "JS OK"
```

Expected: `JS OK`.

- [ ] **Step 3: Spot-check key edge cases by reading code**

- TreeWalker `acceptNode` walks ancestors up to `postBody`. Confirm it handles the case where `postBody` is `<pre>` (it can't be, but defensive check OK).
- `CSS.escape(fnref)` is called — confirm IDs containing special CSS chars (e.g., `[^foo-bar]`) work. `CSS.escape` is the right tool.
- Pass 3's BLOCK regex doesn't match `<div>` — markdown card wrappers are `<div>`, but we want to insert *after* `<p>`/`<li>`/etc., not the wrapping div. Confirmed correct.

If anything is off, fix and commit.

---

## Task 9: Manual deploy + test pass

**Files:** none (deployment + verification)

- [ ] **Step 1: Build the theme zip**

```bash
cd "/Users/clayjones/Library/Mobile Documents/com~apple~CloudDocs/Claude/monafor/cpj-theme"
zip -r /tmp/cpj-theme.zip . \
    -x ".git/*" "node_modules/*" "docs/*" ".*" "*.zip"
ls -lh /tmp/cpj-theme.zip
```

Expected: ~1-2 MB zip (includes vendored KaTeX).

- [ ] **Step 2: Upload to Ghost Admin**

Manual: open Ghost Admin → Settings → Design → Change theme → Upload theme. Select `/tmp/cpj-theme.zip`. Activate.

- [ ] **Step 3: Create a draft test post**

Manual in Ghost Admin: new post titled "Math + Footnotes Test". Add a markdown card with:

```markdown
The standard error scales with $1/\sqrt{n}$.[^1] And the variance:

$$\sigma^2 = \frac{1}{N}\sum_{i=1}^{N}(x_i - \mu)^2$$

A second footnote.[^variance-aside]

Some inline alt-syntax math: \(a^2 + b^2 = c^2\) and display alt-syntax:
\[\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt\pi}{2}\]

```$5 to $10```

[^1]: Strictly, $\sigma_{\hat\mu} = \sigma/\sqrt{n}$.
[^variance-aside]: Sample vs population variance differs by Bessel's
correction $(N-1)$ in the denominator.
[^99]: This definition has no marker — should not produce an aside.
```

Add a separate HTML card with:

```html
<p>This paragraph uses an HTML-card sidenote.</p>
<aside class="sidenote">An HTML-authored aside.</aside>
```

Add a third markdown card with `[^99-prime]` marker but NO definition (orphan test).

Save as draft. Open the post preview URL in a browser.

- [ ] **Step 4: Run through the test checklist**

For each, verify in the browser (devtools open):

  - [ ] **No-op smoke** — load any other (non-test) post. Network tab confirms KaTeX did NOT load. No console errors.
  - [ ] **Inline math** — `$1/\sqrt{n}$` renders inline as math. Sits on the prose baseline.
  - [ ] **Display math** — `$$\sigma^2 = ...$$` renders centered, with breathing room. No mobile horizontal overflow.
  - [ ] **Alt delimiters** — `\(...\)` and `\[...\]` both render.
  - [ ] **Math inside footnote** — footnote 1's `$\sigma_{\hat\mu}$` renders inside the aside.
  - [ ] **Sequential numbering** — HTML-card aside is "1", first markdown footnote is "2", second is "3", regardless of `[^1]` / `[^variance-aside]` labels.
  - [ ] **Inline marker placement** — markdown footnote markers appear at the exact `[^1]` position in the prose, not at end of paragraph.
  - [ ] **HTML-card marker placement** — HTML-card sidenote marker appears at end of preceding paragraph (existing behavior).
  - [ ] **Orphan marker** — `[^99-prime]` renders as literal text. Console shows `[footnotes] orphan marker`.
  - [ ] **Unused definition** — `[^99]:` produces no aside (it had no marker; we drop the paragraph but emit nothing).
  - [ ] **Code block escapes** — the ```` ```$5 to $10``` ```` block shows literal `$5 to $10`. No KaTeX rendering inside. No `[^id]` transforms inside if any are present.
  - [ ] **Desktop margin layout** — viewport ≥1200px: asides float in right margin, top-aligned with markers, no overlap.
  - [ ] **Mobile popover** — viewport <1200px: tap a marker → aside slides up as bottom-sheet; close button works; Escape dismisses.
  - [ ] **Reading time** — recomputed value reflects footnote prose. Math glyphs add minor noise; acceptable.
  - [ ] **Existing post regression** — open `/colophon` (which uses HTML-card asides). Verify zero visual regression.
  - [ ] **Print preview** — Cmd-P on test post. Math renders. Asides print inline. No horizontal overflow.

- [ ] **Step 5: Fix anything that fails the checklist**

For each failed item: identify the root cause, fix in `main.js` or `screen.css`, rebuild the zip, re-upload, retest. Commit each fix as its own commit (`fix: ...`).

- [ ] **Step 6: Final commit (only if any fixes were needed)**

After all checklist items pass, the working tree should be clean. If you made fixes during step 5 that were committed individually, no additional commit is needed.

```bash
git status   # expect: clean working tree
git log --oneline -10
```

---

## Out of scope (do not add)

- Server-side math rendering (Worker or Ghost change)
- In-editor preview of math/footnotes inside Ghost admin
- Bibliographic / cross-post footnote linking
- Migration script to convert existing HTML-card asides to markdown syntax (both formats supported indefinitely)
- New tests / test infrastructure (theme has none currently)

---

## Reminders during execution

- DRY: don't duplicate the SKIP set or BLOCK regex; define each once at module scope inside the IIFE if you find yourself repeating.
- YAGNI: don't add config knobs (e.g., per-post math toggle) — the conditional load is enough.
- Frequent commits: each task ends with a commit. If a task takes >30 min, commit a checkpoint.
- Don't deploy until Task 9. Mid-pipeline state has unstyled asides and could surprise visitors.
