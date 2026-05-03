# Math rendering + markdown-footnote sidenotes — design

**Date:** 2026-05-03
**Status:** spec, awaiting implementation plan

## Goal

Two related capabilities for cpj.fyi post bodies:

1. **Math rendering** — author writes `$x^2$` or `$$E=mc^2$$` in a Ghost markdown card; it renders via KaTeX in the browser.
2. **Markdown footnotes as sidenotes** — author writes pandoc-style `Some claim.[^1]` + `[^1]: explanation.`; the existing margin-sidenote system displays it like the current `<aside class="sidenote">` HTML cards.

Both must coexist: math expressions inside footnotes render correctly.

## Approach

**Self-hosted KaTeX, conditional client-side load.** All work happens in the theme repo — no Ghost server changes, no Cloudflare Worker involvement. A single `textContent` scan of `.post-body` decides whether to load KaTeX at all, so math-free posts pay zero bytes.

**Footnotes piggyback on Ghost's existing parser.** Ghost's markdown card already includes the `markdown-it-footnote` plugin: `[^1]` and `[^1]: …` are converted to `<sup class="footnote-ref">` markers and a `<section class="footnotes">` definition list before the DOM hits the browser. We consume that output and translate it into the existing sidenote DOM rather than re-parsing the markdown source ourselves.

The existing sidenote system (`assets/js/main.js:initSidenotes()` + `screen.css` `.sidenote*` rules) is extended — not replaced — so existing posts using HTML-card asides keep working unchanged.

## File layout

```
cpj-theme/
  assets/
    lib/
      katex/                     ← new: vendored KaTeX 0.16.x dist
        katex.min.css
        katex.min.js
        auto-render.min.js
        fonts/*.woff2            (woff2-only; ~5–8 fonts loaded on demand by browser)
    js/
      main.js                    ← modified
    css/
      screen.css                 ← modified
  default.hbs                    ← unchanged
```

KaTeX vendoring weight: ~280 KB total on disk. Browsers fetch only the woff2 fonts they actually need (typical math content uses 5/20).

## Components

### `transformFootnotes(postBody)` — new in `main.js`

Single-pass DOM transform that consumes Ghost's already-parsed footnote output.

**Ghost's input shape** (after `markdown-it-footnote` runs server-side):

```html
…The team needs structural integrity.<sup class="footnote-ref"><a href="#fn1" id="fnref1">[1]</a></sup>…

<section class="footnotes">
  <ol class="footnotes-list">
    <li id="fn1" class="footnote-item">
      <p>This is the first footnote. <a href="#fnref1" class="footnote-backref">↩︎</a></p>
    </li>
    …
  </ol>
</section>
```

**Algorithm:**

1. Look up `<section class="footnotes">`. If none, return — no footnotes on this post.
2. Walk every `<li class="footnote-item">` inside it. For each:
   - Strip the `fn` prefix from `id` to get the numeric handle.
   - Clone the `<li>`, remove every `<a class="footnote-backref">` (and trim trailing whitespace), capture the cleaned `innerHTML` as the definition.
   - Store `{ numeric id → definition innerHTML }`.
3. Walk every `<sup class="footnote-ref">` in document order. For each:
   - Read the `<a>` inside; its `href` is `#fnN` — strip `#fn` to get the id.
   - Replace the `<sup>` with `<span data-fnmarker="N"></span>`. The span starts empty — `initSidenotes()` will replace it with the numbered `<sup class="sidenote-ref">`.
   - On the *first* occurrence of each id, also create `<aside class="sidenote" data-fnref="N">` containing the definition `innerHTML`, and insert it after the marker's nearest block-level ancestor: `<p>`, `<li>` (in which case insert after the parent `<ul>`/`<ol>`), `<blockquote>`, `<h1>`–`<h6>`, `<figure>`, `<figcaption>`, `<dl>`, `<dd>`. Subsequent occurrences of the same id get only a placeholder span — no second aside.
   - If a marker can't find a sensible block ancestor, insert the aside immediately after the placeholder.
4. Remove `<section class="footnotes">` from the DOM.

**Why simpler than first-pass design:** Originally the design assumed Ghost's markdown card did *not* enable the footnote plugin, requiring a three-pass walker that re-parsed `[^id]` syntax from text nodes. Discovery during deployment showed Ghost ships with the plugin enabled by default, so the parsing problem is already solved upstream — we only need a DOM-shape translation.

**Multi-reference footnotes** (same `[^1]` cited twice) get one aside positioned at the first marker; both markers receive numbered `<sup>`s pointing at the same `#sn-N` anchor.

### Extended `initSidenotes()` — modified in `main.js`

Existing function numbers all asides 1..N in document order. Two changes:

1. **Numbering:** sequential 1..N across the entire post-body. Markdown footnote ids (`[^17]`, `[^foo]`) are *internal handles only* — the displayed number is always sequential. This matches pandoc behavior and keeps mixed-source posts (HTML asides + markdown footnotes) consistent.

2. **Marker placement:**
   - For each aside, after creating the `<sup class="sidenote-ref" id="snref-N">` marker:
     - If the aside has `data-fnref="X"`, find the matching `<span data-fnmarker="X">` in the DOM and *replace* it with the `<sup>`.
     - Else (HTML-card aside), keep current behavior: append the `<sup>` to the preceding text element via `findRefTarget()`.

### `loadAndRenderMath(postBody)` — new in `main.js`

```js
function postNeedsMath(postBody) {
  return /\$|\\\(|\\\[/.test(postBody.textContent);
}

async function loadKatex() {
  // Inject CSS link
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/lib/katex/katex.min.css';
  document.head.appendChild(link);
  // Dynamically import JS
  await import('/assets/lib/katex/katex.min.js');
  await import('/assets/lib/katex/auto-render.min.js');
}

async function loadAndRenderMath(postBody) {
  if (!postNeedsMath(postBody)) return false;
  await loadKatex();
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
}
```

### CSS additions in `screen.css`

- `.post-body .katex-display` — `margin: 1.5em 0; text-align: center; overflow-x: auto;`
- `.post-body .katex` — vertical-align tweak for inline math baseline if needed (verify visually first)
- No changes to `.sidenote*` rules — the data attributes are invisible to existing selectors.

## Render order

Mounted on `DOMContentLoaded`, post pages only (gated by presence of `.post-body`):

```
1. transformFootnotes(postBody)
   – converts markdown footnote syntax to <aside class="sidenote" data-fnref>
2. initSidenotes()
   – numbers all asides, places <sup> markers (data-fnmarker spans replaced;
     HTML-card asides use findRefTarget fallback)
   – attaches close button, click/Escape handlers
   – calls positionSidenotes() once
3. if postNeedsMath(postBody):
       await loadKatex()
       renderMathInElement(postBody, {...})
       positionSidenotes()      // line heights changed; reposition asides
4. initReadingTimeRecalc()
   – existing function; counts footnote text as prose (no change)
```

Footnotes run before KaTeX so that `$math$` inside footnote definitions renders too. KaTeX `ignoredTags` includes `pre` and `code`, matching the footnote walker's skip list.

## Delimiters

All four enabled:

| Delimiter | Mode |
|-----------|------|
| `$…$` | inline |
| `$$…$$` | display |
| `\(…\)` | inline |
| `\[…\]` | display |

`throwOnError: false` + `strict: false` means unparseable spans render as their original text rather than crashing or showing red errors. Stray dollars in prose (`"$5 to $10"`) fail soft. Authoring escape: `\$` (markdown-safe) or `&dollar;`.

## Edge cases & failure modes

| Case | Handling |
|------|----------|
| `[^id]` in code block | Ghost's markdown-it-footnote already skips fenced code; no special handling needed in our transform |
| `$x = 5$` in code block | Skipped (KaTeX `ignoredTags`) |
| Orphan marker `[^99]` (no definition) | Cannot occur — markdown-it-footnote drops orphan markers at parse time |
| Definition with no markers | Cannot occur — markdown-it-footnote drops orphan definitions at parse time |
| Marker referenced twice | One aside emitted at the first marker; both markers get numbered `<sup>`s linking to the same `#sn-N` anchor |
| Multi-line definition | Captured as single innerHTML |
| Definition with formatting (`<em>`, links, math) | Preserved; KaTeX runs over asides too |
| Markdown card with `[^1]:` def, marker in HTML card | Works — operate on whole `.post-body` |
| Footnote inside `<li>` | Aside inserts after parent `<ul>`/`<ol>` |
| KaTeX font load shifts layout | Second `positionSidenotes()` fires after `renderMathInElement` returns |
| No-JS browser | Markdown footnotes render as literal `[^1]` text; HTML-card asides display as plain inline-flow boxes (existing CSS) |

## Reading-time interaction

Existing `initReadingTimeRecalc()`:
- Clones `.post-body`, removes `.cpj-no-count` descendants, counts words at 275 wpm.
- Footnote text counts as prose (no change requested or made).
- Math glyphs render as `.katex` spans containing many small inline elements. The recalc counts visible text content; rendered KaTeX produces a few "words" per equation. Acceptable noise; revisit only if reading times look wrong on heavy-math posts.

## Authoring contract

For users (mostly Clay) writing in Ghost:

```markdown
The standard error scales with $1/\sqrt{n}$.[^1]

A formal definition:
$$\sigma^2 = \frac{1}{N}\sum_{i=1}^{N}(x_i - \mu)^2$$

[^1]: Strictly, $\sigma_{\hat\mu} = \sigma/\sqrt{n}$, where $\sigma$ is the
      population SD.
```

- Either delimiter style works for math.
- Footnote ids can be any string (`[^1]`, `[^foo]`, `[^aside-on-funding]`); they're identifiers only, not display numbers.
- Definitions can be in the same markdown card as their markers, or in a later card. They get pulled out of flow regardless.
- Existing `<aside class="sidenote">` HTML cards keep working; they coexist with markdown footnotes and number sequentially with them.
- To opt content out of reading-time recalc, wrap in `<div class="cpj-no-count">…</div>`.

## Testing plan (manual)

1. **No-op smoke** — existing post with no math/footnotes. Network tab: KaTeX not loaded. No console errors. Reading time unchanged.
2. **Inline math** — `$x^2 + y^2 = z^2$` in a markdown card. Renders inline; KaTeX loaded.
3. **Display math** — `$$\int_0^\infty e^{-x^2}\,dx = \tfrac{\sqrt\pi}{2}$$`. Centered. No mobile overflow.
4. **Single-card footnote** — `Some claim.[^1]` + `[^1]: explanation.`. Aside in right margin on desktop ≥1200px; popover on mobile.
5. **Cross-card footnote** — marker in card 1, definition in card 3. Wires up; sequential numbering.
6. **Math inside footnote** — `[^1]: variance is $\sigma^2$.`. Both transforms cooperate.
7. **Mixed sources** — one HTML-card aside + one markdown footnote, same post. Both number sequentially.
8. **Code-block escapes** — code block containing `[^1]` and `$x = 5$`. Nothing transforms inside.
9. **Orphan marker** — `[^99]` with no def. Literal text + console warning.
10. **Existing sidenote post** — load `/colophon` or any post with HTML-card asides. Zero regression.
11. **Print preview** — Cmd-P. Math renders; existing print CSS handles sidenote layout; no horizontal overflow.

## Out of scope

- Server-side rendering of math (would need Worker or Ghost change; deferred unless first-paint flash becomes a real complaint).
- Editor preview of math/footnotes inside Ghost admin (Ghost's preview pane won't have our JS; authors verify on the published post).
- Bibliographic footnotes / cross-references / inter-post linking — only same-page footnote semantics.
- Migrating existing HTML-card asides to markdown footnote syntax — both formats are supported indefinitely.
