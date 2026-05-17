# CLAUDE.md - Project Context for Claude

## Project Overview

This is a custom Ghost 6.x theme for cpj.fyi, a site for Clay Parker Jones featuring his book "Hidden Patterns" and blog content (Essays, Radar, Five Things).

## Architecture

### Content Types (Tag-Based)
- **Book chapters**: Pages (not posts) tagged with section names: `start-end`, `foundations`, `structuring`, `direction`, `practice`, `learning`, `space`
- **Essays**: Long-form posts tagged `essays`
- **Radar**: Short posts tagged `radar` (dark mode styling)
- **Five Things**: List posts tagged `five-things`

### Critical Routing Behavior

**Primary tag determines URL routing.** If a post has multiple tags, the FIRST tag determines which collection it belongs to.

Example:
- Tags: `["Essays", "Organization Design"]` → URL: `/essays/post-slug/` ✓
- Tags: `["Organization Design", "Essays"]` → URL: `/p/uuid/` (broken) ✗

Always ensure content-type tags (Essays, Radar, Five Things) are the **first tag** on any post.

### Routes Configuration

The `routes.yaml` file must be uploaded separately to Ghost Admin → Settings → Labs → Routes. It's not included in theme zip uploads.

Current setup:
- `/` - Static homepage (index.hbs)
- `/essays/` - Collection for posts with `tag:essays`
- `/radar/` - Collection for posts with `tag:radar`
- `/five-things/` - Collection for posts with `tag:five-things`
- `/posts/` - Catch-all for other posts

### Templates Use {{#get}} Queries

The archive templates (tag-essays.hbs, tag-radar.hbs, tag-five-things.hbs) use explicit `{{#get}}` queries instead of relying on collection context. This ensures all posts with a tag appear regardless of other tags they have.

## Key Files

- `index.hbs` - Homepage with hero banner, book section, essays/radar feeds
- `tag-essays.hbs`, `tag-radar.hbs`, `tag-five-things.hbs` - Archive pages
- `tag-{section}.hbs` - Book section pages (simplified, no sidebar - top nav handles sections)
- `page.hbs` - Default page template, detects chapter pages by tag
- `custom-chapter.hbs` - **Primary chapter template** (selected via Ghost page settings "Template: chapter")
- `post.hbs` - Blog post template
- `partials/header.hbs` - Nav with conditional book subnav, mobile menu, moonphase
- `partials/book-subnav.hbs` - Section navigation for book area
- `partials/mobile-chapter-nav.hbs` - Horizontal scrollable chapter buttons for mobile
- `routes.yaml` - Must be uploaded separately to Ghost Admin
- `redirects.yaml` - For URL redirects (upload to Ghost Admin → Labs → Redirects)

## Styling

### Colors
- Background: `#F8F8F8`
- Accent: `#FF3252` (coral red)
- Radar neon green: `#00ff88`
- Radar dark background: `#222222`

### Section Colors (for chapter nav buttons)
- Start & End: `#222222`
- Foundations: `#ff3252`
- Structuring: `#e9306b`
- Direction: `#d83586`
- Practice: `#bd31bf`
- Learning: `#9f36ce`
- Space: `#8438f2`

### Typography
- Body: Freight Text Pro (serif)
- UI elements: System sans
- Eyebrow labels: Sans font, coral red, uppercase
- **H3 / H4 inside `.content`**: System sans (SF Pro on Apple), bold (700), uppercase, `letter-spacing: 0.08em`. H3 is 18px (`1.125rem`), H4 is 16px (`var(--text-base)`). Tight `margin-bottom: var(--space-2)` so the heading binds to the paragraph below; generous top margin to separate from preceding content. Defined at `.content h3` / `.content h4` in `screen.css`. H1/H2 keep the serif look.

## Radar Dark Mode

Radar pages (`body.tag-radar`) use dark mode styling:
- Dark background (#222222)
- White text
- Neon green (#00ff88) for links, tags, accents
- Header border turns white
- Mobile menu gets dark backgrounds

### Radar Scan Animation
The radar section header has an animated green dot that sweeps across with random "blip" effects. Implemented in `initRadarScan()` in main.js.

## Mobile Menu

- Hamburger toggles to X when open (`body.menu-open` class)
- Menu drops down below fixed header
- Full-width navigation items
- Dark mode support for radar pages
- Date/time and moonphase in footer

## Book Navigation

### Section Pages (tag-{section}.hbs)
- Simplified layout - just shows chapter list
- No sidebar (section switching handled by book-subnav in top nav)

### Chapter Pages (custom-chapter.hbs)
- **Desktop**: Sidebar with chapter list (always visible)
- **Mobile/Tablet (≤1024px)**: Horizontal scrollable chapter buttons
- **Narrow Mobile (≤768px)**: Chapter nav becomes `position: fixed` below the fixed header

### Mobile Chapter Nav (partials/mobile-chapter-nav.hbs)
- Horizontal scrollable row of numbered buttons
- Extracts chapter numbers from URLs (e.g., `/13-network-of-teams/` → "13")
- Start & End section uses labels: "Intro", "Patterns", "Goal Index" instead of numbers
- Current chapter highlighted with section-specific color
- Hover states show section-specific text color
- Auto-scrolls to center the current chapter button on load

### Chapter Detection
Uses `{{#foreach tags}}` with `{{#match slug "section-name"}}` to detect which section a chapter belongs to. This is necessary because `{{#has tag="..."}}` only checks the primary tag.

### Current Chapter Highlighting
- Desktop: `initCurrentChapter()` in main.js adds `.is-current` class to sidebar links
- Mobile: `initMobileChapterNav()` adds `.is-current` class to chapter buttons

## Moonphase Implementation

The header includes a Hodinkee-style moonphase complication showing the current lunar phase.

### Structure (partials/header.hbs)
Simple layered images approach:
- **moonphase-disc.svg**: Blue disc with two moons, rotates based on phase
- **moonphase-mask.svg**: White frame with curved cutout, sits on top (z-index: 2)
- Container has `overflow: hidden` and `border-radius: 50%`

### Animation (assets/js/main.js)
```javascript
// Phase calculation from known new moon (Jan 6, 2000)
const synodicMonth = 29.53058867; // days
const phase = (daysSinceKnown / synodicMonth) % 1;

// Simple rotation: phase 0 = 0°, phase 0.5 = 180°, phase 1 = 360°
const rotation = phase * 360;
moonDisc.style.transform = `rotate(${rotation}deg)`;
```

## Custom Settings (package.json)

Configurable in Ghost Admin → Design:
- `book_title`, `book_author`, `book_description`
- `book_cta_text`, `book_cta_url`
- `sidebar_newsletter_heading`, `sidebar_newsletter_text`
- `footer_tagline`

## Common Tasks

### Adding a new book section
1. Create `tag-{section-slug}.hbs` (copy from tag-foundations.hbs)
2. Add to `partials/book-subnav.hbs`
3. Add to `page.hbs` tag matching for chapter sidebar
4. Add to `index.hbs` book sections list
5. Add to `partials/footer.hbs`
6. Add CSS for body class `.tag-{section-slug}` to show book subnav

### Debugging posts not appearing
1. Check tag ordering - content-type tag must be FIRST
2. Verify routes.yaml is uploaded to Ghost Admin
3. Check post visibility settings
4. Templates use `{{#get}}` so multi-tag posts should appear in listings

### URL Redirects
Use `redirects.yaml` for redirecting old URLs. Upload to Ghost Admin → Labs → Redirects.
Note: Can't use catch-all redirects because pages also use root-level URLs.

## Mobile Responsive Breakpoints

- **≤1024px**: Mobile chapter nav appears, desktop sidebar hides
- **≤768px**: Header becomes `position: fixed`, mobile chapter nav also becomes fixed at `top: 117px`
- Body gets `padding-top: 69px` at ≤768px to account for fixed header
- Chapter pages get additional `padding-top: 72px` for fixed chapter nav

## Reading time exclusions

Reading time on post pages is **recomputed client-side** to exclude embedded tiles, charts, and other non-text content. The post-card overlays (tag pages, feeds) do not show reading time at all.

To exclude an element from the reading-time count, wrap it in `<div class="cpj-no-count">...</div>`. The cpj-data-tiles skill should always emit tiles inside this wrapper. For older essays with heavy embeds (e.g., the "Reimagining the Marketing Organization in the Age of Generative AI" piece), retrofit by editing the HTML card and adding the wrapper.

Implementation: `initReadingTimeRecalc()` in `assets/js/main.js`. Targets any element with `data-reading-time` attribute. The post template's reading-time span has this attribute; the JS finds the post body, clones it, removes `.cpj-no-count` descendants, recounts words at 275 wpm, and replaces the span text.

## Post Body Layout

### DOM nesting

```
.post-body                  ← max-width 720px, padding 0 24px 48px, position: relative on ≥1200px
  .content-wrapper          ← position: relative (this is the positioned ancestor for sidenotes)
    .content                ← article body (data-pagefind-body)
      <figure class="kg-card kg-image-card …">
      <p>…<sup class="footnote-ref">…</sup>…</p>
      <aside class="sidenote">…</aside>     ← inserted by JS
```

Images and footnote refs are inside `.content`, NOT direct children of `.post-body`. Image-width selectors use `.post-body .kg-image-card` (descendant), not `.post-body > .kg-image-card`. Sidenote `position: absolute` resolves against `.content-wrapper` (nearest positioned ancestor), not `.post-body` — this matters when computing the overhang math (see below).

### Image width system

Three figure-width tiers, all keyed on the `kg-image-card` classes Koenig emits. Markdown images get wrapped in the same figure class by JS (see "Markdown image normalization" below).

| Class | Width | Behavior |
|---|---|---|
| `.kg-image-card` (regular) | 500px | Editorial inset. On desktop (≥1200px), floats left with `margin-left: -228px` so text wraps to the right. |
| `.kg-image-card.kg-width-wide` | 720px (`--max-width-content`) | Fills the full text column. `margin: 0 calc(-1 * var(--space-6))` negates `.post-body` padding. |
| `.kg-image-card.kg-width-full` | 1280px (`--max-width`) | Breaks out of column. `margin-left/right: max(50% - 50vw, (720 - 48 - 1280) / 2)` keeps it viewport-edge on narrow screens, centered on the 1280 page max on wide screens. |

Chapter pages override all three back to `max-width: 100%` because the sidebar grid has no room for the overhang.

### Symmetric overhang: sidenote and inset image

Both the right-side sidenote and the floating regular image stick out **228px** past the text column. If you change one, change the other to stay symmetric:

- `.sidenote { right: -228px; width: 200px; }` — gap from column right to sidenote left = `228 − 200 = 28px`
- `.post-body .kg-image-card:not(.kg-width-wide):not(.kg-width-full) { margin-left: -228px; }` (inside `@media (min-width: 1200px)`)

The math works because `.content-wrapper` (sidenote's positioning ancestor) has the same right edge as `.content` (image's containing block), so `right: -228px` on the sidenote and `margin-left: -228px` on the image are both measured from the same reference.

### Float wrap details

When floated, the regular image:
- Sits at `margin-top: 0` so its top edge aligns with the wrapping paragraph's first line
- Has `margin-right: var(--space-6)` (24px gutter before wrapped text)
- Has `clear: left` so consecutive floats stack vertically rather than side-by-side

Headings, `kg-width-wide`, `kg-width-full`, and `<hr>` inside `.content` all get `clear: both` so they never wrap next to a still-floating image.

**Gotcha**: `.content img { margin: var(--space-8) 0 }` adds 32px above bare `<img>` tags. `.kg-image-card img { margin: 0 }` (declared later, same specificity) overrides it. Don't reorder these.

## Markdown image normalization

Ghost's markdown card emits standalone images as `<p><img></p>` (or `<p><a><img></a></p>` when linked), without the `kg-image-card` figure wrapper Koenig produces. `transformMarkdownImages(postBody)` in `assets/js/main.js` walks every `<p>`, detects this pattern (single element child, no non-whitespace text), and rewraps it as `<figure class="kg-card kg-image-card">…</figure>`. After that the existing image-width CSS applies automatically.

### Markdown image captions

Inside the same transform, captions come from either the title attribute or the alt text:

```markdown
![A diagram of the network](image.png "Figure 1: Network diagram")
```

Resolution:
- If `title` is set → use it as `<figcaption>`, strip the title attribute (so the browser doesn't also show it as a tooltip), keep `alt` for screen readers.
- Else if `alt` is non-empty → use it as `<figcaption>`, set `alt=""` so screen readers don't double-read (figcaption now serves as the accessible description).
- No caption otherwise.

The figure gets `kg-card-hascaption` to match Koenig's convention. Caption styling is `.content figcaption` in `screen.css`.

**Limitation**: markdown has no syntax for wide/full image sizes. All markdown images render as the regular inset. Use a Koenig image card if you need wide or full.

## Footnotes — multi-card handling

Each markdown card runs markdown-it-footnote independently, so a post with two markdown cards emits two separate `<section class="footnotes">` blocks with ids restarting at `fn1` in each. `transformFootnotes(postBody)` in `assets/js/main.js` handles this:

1. Iterate every `<section class="footnotes">` in document order.
2. For each section, scope `<sup class="footnote-ref">` matches to refs that come AFTER the previous section and BEFORE this one (via `compareDocumentPosition`). This prevents card 2's refs from being silently dropped or wrongly matched against card 1's defs.
3. Namespace marker ids as `sectionIdx:id` (e.g., `0:1`, `1:1`) so cross-card `fn1` collisions don't clobber the `data-fnmarker` ↔ `data-fnref` pairing used by `initSidenotes`.
4. Strip all `<section.footnotes>` and `<hr.footnotes-sep>` at the end (after a single pass, since previous sections need to remain in the DOM for `compareDocumentPosition` checks against later sections).

`initSidenotes` then numbers all asides 1..N in document order — so the visible footnote numbers are continuous across cards even though Ghost restarts internal ids per card.

## Known Issues / TODO

None currently.

## GitHub

Repo: https://github.com/cpj-fyi/cpj-theme
