# CLAUDE.md - Project Context for Claude

## Project Overview

This is a custom Ghost 6.x theme for cpj.fyi, a site for Clay Parker Jones featuring his book "Hidden Patterns" and blog content (Essays, Radar, Five Things).

## Architecture

### Content Types (Tag-Based)
- **Book chapters**: Pages (not posts) tagged with section names: `start-end`, `foundations`, `structuring`, `direction`, `practice`, `learning`, `space`
- **Essays**: Long-form posts tagged `essays`
- **Radar**: Short posts tagged `radar`
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

### Templates Use {{#get}} Queries

The archive templates (tag-essays.hbs, tag-radar.hbs, tag-five-things.hbs) use explicit `{{#get}}` queries instead of relying on collection context. This ensures all posts with a tag appear regardless of other tags they have.

## Key Files

- `index.hbs` - Homepage with hero banner, book section, essays/radar feeds
- `tag-essays.hbs`, `tag-radar.hbs`, `tag-five-things.hbs` - Archive pages
- `tag-{section}.hbs` - Book section pages (foundations, structuring, etc.)
- `page-chapter.hbs` - Individual book chapter template
- `post.hbs` - Blog post template
- `partials/header.hbs` - Nav with conditional book subnav
- `partials/book-subnav.hbs` - Shows only in book area
- `partials/sidebar-chapter.hbs` - Chapter navigation in book pages
- `routes.yaml` - Must be uploaded separately to Ghost Admin

## Styling

- Background: `#F8F8F8`
- Accent: `#FF3252` (coral red)
- Typography: Freight Text Pro (serif) for body, system sans for UI
- Eyebrow labels: Sans font, coral red, uppercase

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
3. Add to `partials/book-nav.hbs`
4. Add to `index.hbs` book sections list
5. Add to `partials/footer.hbs`
6. Add CSS for body class `.tag-{section-slug}` to show book subnav

### Debugging posts not appearing
1. Check tag ordering - content-type tag must be FIRST
2. Verify routes.yaml is uploaded to Ghost Admin
3. Check post visibility settings
4. Templates use `{{#get}}` so multi-tag posts should appear in listings

## Moonphase Implementation

The header includes a watch-style moonphase complication that shows the current lunar phase.

### Structure (partials/header.hbs)
- **SVG viewBox**: `0 0 32 16`
- **Aperture**: Dome-shaped clipPath (curved top, flat bottom) using path `M0,16 L0,6 A16,6 0 0,1 32,6 L32,16 Z`
- **Two moons**: At `cy=22` and `cy=-10`, spaced 32 units apart vertically
- **Moon rises from bottom**: Translates vertically so moon peeks up through flat bottom edge

### Animation (assets/js/main.js)
```javascript
// Phase calculation from known new moon (Jan 6, 2000)
const synodicMonth = 29.53058867; // days
const phase = (daysSinceKnown / synodicMonth) % 1;

// Position: +2 at new moon (hidden), -11 at full moon (centered)
const translateY = -4.5 + 6.5 * Math.cos(phase * 2 * Math.PI);
```

### Visual behavior
- **New moon (phase 0)**: Moon hidden below aperture
- **Crescent phases**: Moon partially visible, peeking up from bottom
- **Full moon (phase 0.5)**: Moon centered in dome aperture
- **CSS container**: `.moonphase-watch` with `border-radius: 16px 16px 0 0` for dome shape

## GitHub

Repo: https://github.com/cpj-fyi/cpj-theme
