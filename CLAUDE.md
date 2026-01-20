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

The header includes a watch-style moonphase complication that shows the current lunar phase.

### Structure (partials/header.hbs)
- **SVG viewBox**: `0 0 32 32`
- **Aperture**: Circular mask at cx=16, cy=16, r=12 (reveals from y=4 to y=28)
- **Two moons**: At `cy=4` and `cy=28` (orbital radius 12 from center), r=9 each
- **Rotation-based animation**: Disc rotates around center (16, 16)

### Animation (assets/js/main.js)
```javascript
// Phase calculation from known new moon (Jan 6, 2000)
const synodicMonth = 29.53058867; // days
const phase = (daysSinceKnown / synodicMonth) % 1;

// Rotation: 90° offset ensures full moon shows maximum visibility
// Phase 0 (new moon) = 90° rotation (moons at sides, minimal in aperture)
// Phase 0.5 (full moon) = 270° rotation (moons passing through center height)
const rotation = (phase * 360) + 90;
moonDisc.setAttribute('transform', `rotate(${rotation}, 16, 16)`);
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

## Known Issues / TODO

None currently.

## GitHub

Repo: https://github.com/cpj-fyi/cpj-theme
