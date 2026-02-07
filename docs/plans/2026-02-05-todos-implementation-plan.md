# CPJ Theme TODO Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Execute all 9 outstanding TODOs from `todos.txt` — CSS fixes, design system consolidation, feed page cleanup, and two new features.

**Architecture:** This is a Ghost 6.x Handlebars theme with a single CSS file (`assets/css/screen.css`, ~3400 lines), vanilla JS (`assets/js/main.js`), and tag-based content routing. All style changes go through `screen.css`. Template changes touch `.hbs` files at root and in `partials/`.

**Tech Stack:** Ghost 6.x, Handlebars, vanilla CSS, vanilla JS. No build process — edit files directly.

---

## Task 1: Migrate tags, dates, and reading times to a design system

**Context:** Three different class systems exist for tags (`.post-card-tag`, `.essay-meta-tag`, `.post-tag-link`), two for meta containers (`.post-card-meta`, `.essay-card-meta`), and inconsistent date formats across templates. The homepage essay section uses bordered-box tag/date/time styles; other pages use simpler colored-text styles. Unify everything to match the homepage essay style (bordered boxes with hover states).

**Files:**
- Modify: `assets/css/screen.css` (lines 1256-1278 for essay-meta styles, 1413-1420 for post-card-tag, 1450-1466 for post-card-meta, 2538-2547 for post-tag, 3331-3346 for post-tag-link)
- Modify: `partials/post-card.hbs` — update classes to use design-system names
- Modify: `partials/post-card-essay.hbs` — update classes
- Modify: `partials/post-card-radar.hbs` — update classes
- Modify: `post.hbs` — update header tag/meta classes and footer tag classes
- Modify: `tag.hbs` — update tag/meta classes
- Modify: `everything.hbs` — update tag/meta classes

**Step 1: Audit current state**

Open a browser to the live site. Visit the homepage, an essay post, a radar post, and the /everything/ page. Screenshot each to document the current state of tags, dates, and reading times.

**Step 2: Define the design-system classes in CSS**

In `screen.css`, create a consolidated block of design-system classes near the existing `.essay-meta-tag` styles (around line 1256). These should match the homepage essay style:

```css
/* Design System: Meta elements (tags, dates, reading time) */
.ds-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    align-items: center;
}

.ds-meta-item {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid #222222;
    padding: var(--space-1) var(--space-3);
    margin-right: -1px;
    margin-bottom: -1px;
    transition: background 0.15s, color 0.15s;
    line-height: 1.4;
}

.ds-meta-item a {
    color: inherit;
    text-decoration: none;
}

.ds-meta-item:hover {
    background: #222222;
    color: #ffffff;
}
```

Add dark-mode overrides in the radar section (~line 2063):

```css
body.tag-radar .ds-meta-item {
    border-color: rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.7);
}

body.tag-radar .ds-meta-item:hover {
    background: #ffffff;
    color: #222222;
}
```

**Step 3: Update all templates to use `.ds-meta` and `.ds-meta-item`**

Replace the various class names in each template file. For each template, change the meta container to `class="ds-meta"` and each tag/date/time element to `class="ds-meta-item"`.

**Step 4: Clean up orphaned CSS**

Remove or comment out the old class definitions that are no longer referenced:
- `.essay-meta-tag`, `.essay-meta-date`, `.essay-meta-time` (~lines 1261-1278)
- `.post-card-tag` tag-specific styles (~lines 1413-1420)
- `.post-card-meta` (~lines 1450-1466)
- `.post-tag` (~lines 2538-2547)
- `.post-tag-link` (~lines 3331-3346)

Do NOT remove `.post-card-tag-wrapper` (line 1405) as it controls "show only first tag" behavior — rename it to `.ds-meta-tag-wrapper` if needed.

**Step 5: Verify in browser**

Check homepage, essay feed, radar feed, five-things feed, individual posts (essay and radar), and /everything/. Confirm all tags/dates/times use the bordered-box style. Check mobile breakpoints too.

**Step 6: Commit** (if git is set up)

---

## Task 2: Reduce type content size by 2-3% and line-height by 5%

**Context:** Body text is `var(--text-lg)` = `1.125rem` (18px) with `line-height: 1.7` on body and `1.8` on `.content`. The user wants a subtle tightening.

**Files:**
- Modify: `assets/css/screen.css` (lines 32, 87, 1686-1689)

**Step 1: Calculate new values**

Current → New:
- `--text-lg: 1.125rem` → `1.09rem` (3% reduction, ~17.4px)
- `body line-height: 1.7` → `1.615` (5% reduction)
- `.content line-height: 1.8` → `1.71` (5% reduction)

**Step 2: Update the CSS variable**

In `screen.css` line 32, change:
```css
--text-lg: 1.09rem;
```

**Step 3: Update body line-height**

In `screen.css` line 87, change:
```css
line-height: 1.615;
```

**Step 4: Update .content line-height**

In `screen.css` around line 1689, change:
```css
.content {
    font-size: var(--text-lg);
    line-height: 1.71;
}
```

**Step 5: Check secondary line-heights**

These related values should also be reduced by 5%:
- `blockquote` line 141: `1.5` → `1.425`
- `.essay-card-excerpt` line 1251: `1.6` → `1.52`
- `.five-things-card-excerpt` line 1339: `1.6` → `1.52`
- `.content pre` line 1750: `1.6` → `1.52`

**Step 6: Verify in browser**

Check readability on a long essay post and a radar post. Ensure nothing looks cramped. Check mobile too.

**Step 7: Commit**

---

## Task 3: Create a tag index page

**Context:** Ghost supports `{{#get "tags"}}` to fetch all tags. The theme already has a generic `tag.hbs` that shows posts for a single tag. This task creates a new page at `/tags/` listing all tags, each linking to its existing tag page.

**Files:**
- Create: `tags.hbs` (new template at theme root)
- Modify: `routes.yaml` (add route, line ~6)
- Modify: `assets/css/screen.css` (add styles for tags index)

**Step 1: Create the template**

Create `tags.hbs` at theme root:

```handlebars
{{!< default}}

<header class="archive-header">
    <div class="container">
        <h1 class="archive-title">Tags</h1>
    </div>
</header>

<div class="container">
    <div class="tags-index">
        {{#get "tags" limit="all" include="count.posts" order="name ASC"}}
            {{#foreach tags}}
                <a href="{{url}}" class="tags-index-item">
                    <span class="tags-index-name">{{name}}</span>
                    <span class="tags-index-count">{{count.posts}}</span>
                </a>
            {{/foreach}}
        {{/get}}
    </div>
</div>
```

**Step 2: Add route**

In `routes.yaml`, add under the `routes:` section:

```yaml
routes:
  /: index
  /everything/: everything
  /tags/: tags          # ← add this line
```

**Step 3: Add CSS**

Add to `screen.css` (after the archive styles, around line 2440):

```css
/* Tags Index */
.tags-index {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    padding: var(--space-8) 0 var(--space-16);
    max-width: var(--content-width);
}

.tags-index-item {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid #222222;
    padding: var(--space-2) var(--space-4);
    color: #222222;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
}

.tags-index-item:hover {
    background: #222222;
    color: #ffffff;
}

.tags-index-count {
    font-size: var(--text-xs);
    opacity: 0.5;
}
```

**Step 4: Upload routes.yaml**

Remind the user: routes.yaml must be uploaded separately via Ghost Admin → Settings → Labs → Routes.

**Step 5: Verify in browser**

Visit `/tags/`, confirm all tags appear, click one to verify it goes to the correct `/tag/{slug}/` page with chronological posts.

**Step 6: Commit**

---

## Task 4: Implement Ghost-Typesense search

**Context:** This requires external setup (Typesense cloud account, Ghost Content API key) that the user must do. The theme work is adding a search button and loading the Typesense search library.

**Files:**
- Modify: `partials/header.hbs` (add search button)
- Create: `partials/icons/search.hbs` (search icon SVG)
- Modify: `assets/css/screen.css` (search button styles)
- Modify: `default.hbs` (load search script — or use Ghost Code Injection)

**Step 1: Confirm prerequisites with user**

Before any code, ask the user:
1. Do you have a Typesense Cloud account? (If not, sign up at https://cloud.typesense.org/)
2. Do you have your Ghost Content API key? (Ghost Admin → Settings → Integrations → Custom Integration)
3. Preferred approach: embed config in theme vs Ghost Admin Code Injection? (Code Injection recommended so API keys aren't in the theme files)

**Step 2: Create search icon partial**

Create `partials/icons/search.hbs`:

```handlebars
<svg class="icon-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
</svg>
```

**Step 3: Add search button to header**

In `partials/header.hbs`, add a search toggle button inside `.header-actions` (around line 75):

```handlebars
<button class="header-search-toggle" id="search-toggle" aria-label="Search">
    {{> "icons/search"}}
</button>
```

**Step 4: Add search button CSS**

Add to `screen.css` near the header styles (~line 300):

```css
.header-search-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-2);
    color: inherit;
    display: flex;
    align-items: center;
}

.icon-search {
    width: 16px;
    height: 16px;
}
```

**Step 5: Guide user through Typesense setup**

Walk the user through:
1. Install CLI: `npm install -g @magicpages/ghost-typesense-cli`
2. Create config file `ghost-typesense.config.json` with their credentials
3. Run `ghost-typesense init --config ghost-typesense.config.json`
4. Run `ghost-typesense sync --config ghost-typesense.config.json`

**Step 6: Add search library via Ghost Code Injection**

Guide user to Ghost Admin → Settings → Code Injection → Site Header:

```html
<script>
  window.__MP_SEARCH_CONFIG__ = {
    typesense: {
      nodes: [{
        host: 'YOUR_HOST.a1.typesense.net',
        port: 443,
        protocol: 'https'
      }],
      apiKey: 'YOUR_SEARCH_ONLY_API_KEY',
      collectionName: 'cpj-posts'
    },
    theme: 'light'
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/@magicpages/ghost-typesense-search/dist/search.min.js"></script>
```

**Step 7: Verify**

Upload updated theme, test search from the header button on desktop and mobile.

**Step 8: Commit**

---

## Task 5: Standardize feed page design structure

**Context:** Four feed templates use different wrapper/container class names even though Three of them (essays, five-things, radar) use the same basic layout. The main inconsistency: `tag-essays.hbs` uses `.essays-archive-layout` / `.essays-archive-feed` and renders cards inline, while `tag-five-things.hbs` and `tag-radar.hbs` use `.essays-layout` / `.essays-main` with the `post-card-essay` partial. `everything.hbs` is intentionally different (no sidebar, date-based layout) and should stay that way.

**Files:**
- Modify: `tag-essays.hbs` — refactor to use `.essays-layout` / `.essays-main` / `.essays-grid` and the `post-card-essay` partial, matching five-things and radar
- Modify: `assets/css/screen.css` — remove orphaned `.essays-archive-*` classes after migration

**Step 1: Read all three feed templates side by side**

Read `tag-essays.hbs`, `tag-five-things.hbs`, and `tag-radar.hbs` fully.

**Step 2: Refactor tag-essays.hbs**

Rewrite `tag-essays.hbs` to use the same structure as `tag-five-things.hbs`:
- Outer: `<div class="essays-layout">`
- Feed: `<div class="essays-main">` → `<div class="essays-grid">`
- Cards: `{{> "post-card-essay"}}` partial instead of inline markup
- Sidebar: `{{> "sidebar"}}`

Keep the archive header with its unique tag name/description.

**Step 3: Clean up orphaned CSS**

Remove `.essays-archive-layout`, `.essays-archive-feed`, and any related classes that are no longer used (around lines 1852-1863 in screen.css).

**Step 4: Verify in browser**

Check `/essays/`, `/five-things/`, `/radar/` — they should now have the same structural layout. Colors and section-specific styling should still be individualized.

**Step 5: Commit**

---

## Task 6: Fix mobile menu height to match desktop

**Context:** Desktop header is 44px inner + 1px border = 45px. Mobile header is 44px inner + 12px top padding + 12px bottom padding + 1px border = 69px. The 24px difference is caused by `padding: var(--space-3) 0` added to `.header-main` at the mobile breakpoint (screen.css line 680).

**Files:**
- Modify: `assets/css/screen.css` (line ~680)

**Step 1: Remove the mobile header padding**

In `screen.css`, find the mobile breakpoint override for `.header-main` (around line 680) and remove or zero out the vertical padding:

```css
@media (max-width: 768px) {
    .header-main {
        padding: 0;
    }
}
```

**Step 2: Update body padding-top**

The body `padding-top: 69px` (line ~691) accounts for the old mobile header height. Update it to match the desktop height:

```css
body {
    padding-top: 45px; /* 44px header + 1px border */
}
```

**Step 3: Verify the mobile logo and menu toggle are still vertically centered**

The `.header-inner` should still handle centering. Check that the hamburger menu icon and logo aren't clipped.

**Step 4: Check mobile menu overlay**

The mobile menu dropdown (`.mobile-menu`) position may depend on the old header height. Verify it opens correctly below the header.

**Step 5: Test across breakpoints**

Check 320px, 375px, 768px, 1024px widths. Header should be consistent.

**Step 6: Commit**

---

## Task 7: Remove homepage mobile whitespace between five things and radar

**Context:** On mobile, excessive vertical space appears between the five-things section and the radar section. The gap is caused by stacked margins: `.home-five-things` bottom margin (32px) + `.home-layout` bottom padding (48px) + `.home-radar-section` top margin (48px) + `.home-radar-section` top padding (64px) = ~192px of visual separation.

**Files:**
- Modify: `assets/css/screen.css` (lines ~1344-1354 for home-five-things mobile, ~1896-1900 for home-radar-section, ~1064-1076 for home-layout)

**Step 1: Reduce mobile spacing**

Add or update the mobile breakpoint for `.home-radar-section`:

```css
@media (max-width: 768px) {
    .home-radar-section {
        margin-top: 0;
        padding-top: var(--space-8); /* 32px instead of 64px */
    }
}
```

Also reduce `.home-layout` bottom padding on mobile if needed:

```css
@media (max-width: 768px) {
    .home-layout {
        padding-bottom: 0;
    }
}
```

**Step 2: Verify in browser**

Check the homepage on a mobile viewport (375px width). The five-things coral section should flow closely into the dark radar section without a big white gap.

**Step 3: Check that desktop spacing is unchanged**

Verify on desktop (1280px) that the spacing between sections still looks intentional.

**Step 4: Commit**

---

## Task 8: Coral background for five-things feed page

**Context:** The homepage five-things section already has coral (#FF3252) background with white text (screen.css lines 1297-1354). The five-things feed page (`/five-things/`) currently uses the default light theme. This task applies similar coral treatment to the full feed page, but NOT to individual five-things posts.

**Files:**
- Modify: `assets/css/screen.css` (add `body.tag-five-things` styles, similar to `body.tag-radar` dark mode pattern at lines 2063-2432)
- Modify: `tag-five-things.hbs` (may need structural tweaks for the styling to work)

**Step 1: Add body-level five-things styles**

Add a new section in `screen.css` (after the radar dark mode section, around line 2432):

```css
/* Five Things Feed: Coral Mode */
body.tag-five-things {
    background: #FF3252;
    color: #ffffff;
}

body.tag-five-things .header-main {
    border-bottom-color: rgba(255, 255, 255, 0.3);
}

body.tag-five-things .nav-logo,
body.tag-five-things .mobile-logo .nav-logo,
body.tag-five-things .nav-home .nav-logo {
    color: #ffffff;
}

body.tag-five-things .nav-link {
    color: rgba(255, 255, 255, 0.7);
}

body.tag-five-things .nav-link:hover {
    color: #ffffff;
}

body.tag-five-things .archive-header {
    color: #ffffff;
}

body.tag-five-things .archive-title {
    color: #ffffff;
}

body.tag-five-things a {
    color: #ffffff;
}

body.tag-five-things hr {
    border-top-color: rgba(255, 255, 255, 0.3);
}

body.tag-five-things .ds-meta-item {
    border-color: rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.7);
}

body.tag-five-things .ds-meta-item:hover {
    background: #ffffff;
    color: #FF3252;
}

body.tag-five-things .sidebar {
    color: rgba(255, 255, 255, 0.8);
}

body.tag-five-things .footer {
    border-top-color: rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.7);
}
```

Note: References to `.ds-meta-item` assume Task 1 has been completed. If not, use the old class names.

**Step 2: Ensure individual posts are NOT affected**

The `body.tag-five-things` class is applied by Ghost when viewing the `/five-things/` feed page. Individual posts do NOT get this body class (they get `body.post-template` with their own tags). So no extra work is needed — individual posts are automatically unaffected.

Verify this by checking a single five-things post URL.

**Step 3: Handle the menu icon and mobile elements**

Add overrides for mobile menu toggle icon color and any other elements that need white treatment:

```css
body.tag-five-things .menu-toggle-icon {
    color: #ffffff;
}

body.tag-five-things .mobile-menu {
    background: #FF3252;
}
```

**Step 4: Verify in browser**

Visit `/five-things/` — should have coral background, white logo, white lines, white links. Visit an individual five-things post — should look normal (default light theme).

**Step 5: Commit**

---

## Task 9: Make radar post `<hr>` white

**Context:** `hr` elements use `border-top: 1px solid var(--color-border)` where `--color-border` is `#222222`. On radar posts (dark background), this makes `<hr>` invisible. No `body.tag-radar hr` override exists.

**Files:**
- Modify: `assets/css/screen.css` (add one rule in the radar dark mode section, around lines 2063-2432)

**Step 1: Add the override**

In `screen.css`, inside the `body.tag-radar` section (around line 2063), add:

```css
body.tag-radar .content hr {
    border-top-color: rgba(255, 255, 255, 0.3);
}
```

Using `.content hr` scopes it to post content only, not the entire page.

**Step 2: Verify in browser**

Find a radar post with an `<hr>` and confirm it's now visible as a subtle white line.

**Step 3: Commit**

---

## Completion Log

### Session 1 (2026-02-05) — Tasks 1 & 2 DONE

**Task 1: Design system migration**
- Created `.ds-meta` (flex container) and `.ds-meta-item` (bordered box) classes in screen.css
- Created `.ds-meta-tag-wrapper` (show-first-tag-only wrapper)
- Updated 7 templates: index.hbs, tag-essays.hbs, post-card.hbs, post-card-essay.hbs, post-card-radar.hbs, post.hbs (footer tags + related posts + header meta)
- Added radar dark mode overrides for `.ds-meta-item`
- Removed old classes: `.essay-meta-tag`, `.essay-meta-date`, `.essay-meta-time`, `.post-card-tag`, `.post-card-meta`, `.post-tag-link`
- Kept `.post-tag` (post header accent label) and `.archive-tag` (everything.hbs) unchanged — different visual purpose
- **Post-plan fix:** removed `.essays-grid .ds-meta { flex-direction: column }` override that was stacking date/time vertically on feed pages
- **Post-plan fix:** migrated `.post-meta` (post header author/date/time) to use `.ds-meta` + `.ds-meta-item` with `justify-content: center`

**Task 2: Typography tightening**
- `--text-lg`: 1.125rem → 1.09rem (~3%)
- Body line-height: 1.7 → 1.615 (5%)
- `.content` line-height: 1.8 → 1.71 (5%)
- Secondary line-heights (blockquote, excerpts, pre): all reduced 5%

### Session 2 (2026-02-05) — Tasks 5, 6, 7, 9 DONE

**Task 5: Standardize feed page design structure**
- Refactored `tag-essays.hbs` to use `.essays-layout` / `.essays-main` / `.essays-grid` with `{{> "post-card-essay"}}` partial, matching five-things and radar feeds
- Removed orphaned `.essays-archive-layout`, `.essays-archive-feed`, and related CSS (lines 1804-1831)
- Homepage `.essay-card` styles kept (still used by `index.hbs`)

**Task 6: Fix mobile menu height to match desktop**
- Removed `padding: var(--space-3) 0` from `.header-main` mobile breakpoint (was adding 24px)
- Updated `body` padding-top: 69px → 45px
- Updated `.site-nav` top: 69px → 45px
- Updated `.mobile-chapter-nav` top: 117px → 93px (45px header + 48px book-subnav)

**Task 7: Remove homepage mobile whitespace**
- Added mobile breakpoint for `.home-radar-section`: `margin-top: 0; padding-top: var(--space-8)`
- Added `padding-bottom: 0` to `.home-layout` at 768px breakpoint

**Task 9: Make radar post hr white**
- Added `body.tag-radar .content hr { border-top-color: rgba(255, 255, 255, 0.3); }`

### Session 3 (2026-02-05) — Tasks 8 & 3 DONE

**Task 8: Coral background for five-things feed**
- Added full `body.tag-five-things` coral mode section in screen.css (mirrors radar dark mode pattern)
- Covers: body bg, header, nav, mobile menu, archive header, post cards, ds-meta-item, sidebar widgets, newsletter input, footer
- Meta item hover: white bg with coral text (#FF3252)
- Footer: slightly darker coral (#e62d4a) for depth
- Individual five-things posts unaffected (Ghost doesn't apply tag body class to posts)

**Task 3: Tag index page**
- Created `tags.hbs` template using `{{#get "tags"}}` with post counts
- Added `/tags/: tags` route to `routes.yaml`
- Added `.tags-index` CSS (flex-wrap layout with bordered items matching design system)
- **Reminder:** `routes.yaml` must be re-uploaded via Ghost Admin → Settings → Labs → Routes

---

## Remaining Tasks

```
Task 4 (typesense)     ← independent, requires user setup steps
```

- **Session 4:** Task 4 (typesense — interactive, needs user participation)
