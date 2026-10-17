# CPJ Theme

Ghost 6 theme for [cpj.fyi](https://www.cpj.fyi): Hidden Patterns, Essays, Radar, and Five Things. The theme uses Handlebars, plain CSS, and browser JavaScript; production assets need no build step.

## Local development

Use Node.js 24 and npm. Packaging also requires the `zip` command.

```sh
npm ci
npx playwright install chromium
npm run preview
```

Open `http://127.0.0.1:4173/13-network-of-teams/`. Set `PREVIEW_PORT` to change the port. The preview renders the real chapter partial and assets with fixture chapters and stubbed Ghost helpers. It does not run Ghost, authenticate members, load live chapter content, or reproduce site code injection.

Useful preview URLs:

| Path or query | Purpose |
| --- | --- |
| `/introduction/`, `/1-true-purpose/`, `/75-movable-everything/` | Beginning and end of chapter navigation |
| `/12-cooperation/`, `/13-network-of-teams/` | Cross-section navigation |
| `/preview-post/` | Editorial heading typography outside the chapter layout |
| `/13-network-of-teams/?pulse=demo` | Expandable strip with clearly labeled simulated data; contributions are not saved |
| `?member=another-reader` | A separate fixture reader's saved state |
| `?member=none&access=false` | Anonymous, restricted fixture |
| `?member=preview-reader&access=false` | Signed-in fixture without access |

`member` and `access` are development fixture switches, not production authentication controls. Real entitlement behavior must be checked in Ghost with anonymous, signed-in/unentitled, and entitled readers.

## Checks and packaging

```sh
npm test
npm run validate
npm run test:reader
npm run package
```

| Command | What it does |
| --- | --- |
| `npm test` | Runs Node tests in `test/` (currently moonphase calculations) |
| `npm run validate` | Runs GScan against Ghost theme requirements |
| `npm run test:reader` | Starts its own fixture server and checks layout at six widths, sticky titles, pagination, fonts, reader state, and the mocked PatternPulse contract |
| `npm run package` | Creates `dist/cpj-theme-<version>.zip` using the version in `package.json` |

For an installed Google Chrome instead of downloaded Chromium, use `PLAYWRIGHT_CHANNEL=chrome npm run test:reader`. Browser screenshots go to `dist/previews/`; both generated output and `node_modules/` are ignored by Git. The PatternPulse browser fixture is synthetic and does not validate a deployed research service.

GScan has an existing **Missing support for custom fonts** warning because the theme does not use Ghost's `--gh-font-heading` and `--gh-font-body` settings. Keep new errors and warnings distinct from that baseline.

## Install in Ghost

1. Run `npm run package` and upload the generated ZIP in Ghost Admin's theme settings.
2. Upload [routes.yaml](routes.yaml) separately through Ghost Admin's Routes settings. Upload [redirects.yaml](redirects.yaml) separately if changing redirects.
3. Configure the custom settings below and check the installed theme with real Ghost content and reader accounts.

The ZIP contains root `.hbs` templates, `package.json`, `assets/`, and `partials/`. It excludes dependencies, tests, preview fixtures, documentation, and routing files. Uploading a theme does not apply routes or deploy PatternPulse.

## Content and routes

Book chapters are **Pages**, tagged with one of `start-end`, `foundations`, `structuring`, `direction`, `practice`, `learning`, or `space`. `page.hbs` detects those tags; selecting the **chapter** custom template uses `custom-chapter.hbs`. Both render [partials/chapter-reader.hbs](partials/chapter-reader.hbs), so changes to the reader belong there.

Numbered chapters use titles such as `13. Network of Teams` and slugs such as `13-network-of-teams`. Previous/next navigation sorts chapters numerically across sections, with Introduction before pattern 1. Pattern List and Goal Index remain reference pages rather than intermediate chapters. The catalog fetch is capped at 100 pages; revisit it if the book grows beyond that limit.

Posts use one content-type tag: `essays`, `radar`, or `five-things`. Put it first for consistent labels and related-post selection. The actual collection filters in `routes.yaml` use `tag:`, so they match any tag position. Avoid assigning multiple content-type tags to the same post; [Ghost collections should have distinct membership](https://docs.ghost.org/themes/routing#limitations-troubleshooting).

| Route | Source |
| --- | --- |
| `/` | `index.hbs` |
| `/essays/`, `/radar/`, `/five-things/` | Tag-filtered post collections |
| `/posts/` | Remaining posts |
| `/everything/`, `/tags/`, `/rss/` | Custom route templates |
| `/tag/<slug>/`, `/author/<slug>/` | Ghost taxonomy archives |

## Settings

The source of truth is `config.custom` in [package.json](package.json). These settings appear in Ghost's site design controls:

| Setting | Purpose |
| --- | --- |
| `book_title`, `book_author`, `book_description` | Book identity and description |
| `sidebar_featured_slug` | Featured sidebar content |
| `sidebar_newsletter_heading`, `sidebar_newsletter_text` | Newsletter widget copy |
| `sidebar_custom_html` | Optional sidebar HTML |
| `footer_tagline` | Footer copy |
| `art_url` | Base URL for generated post artwork |
| `subscriber_count` | Fallback subscriber count |
| `patternpulse_url` | Deployed PatternPulse HTTPS origin; blank disables the integration |

## Reader architecture

| Area | Files and behavior |
| --- | --- |
| Shared chapter layout | `partials/chapter-reader.hbs`; sidebar title stays visible while its chapter list scrolls |
| Navigation and scrolling | `assets/css/book-reader.css`, `assets/js/book-reader.js`; measures header/mobile-nav heights rather than assuming a fixed offset; section shapes contain system monospace chapter numbers |
| Previous/next chapters | `partials/chapter-pagination.hbs` supplies a title/URL/tag catalog; JavaScript builds numeric cross-section navigation and replaces matching authored navigation buttons |
| Heading typography | `assets/css/typography.css`; bundled LTL Pixel for direct editorial H2/H3/H4 in post/page content, preserving embedded resource headings |
| Read marks | `partials/reading-state.hbs`, `assets/js/reading-state.js`; signed-in readers with Ghost `access` can toggle read status, stored per member UUID and chapter in this browser |
| PatternPulse | `assets/css/pattern-pulse.css`, `assets/js/pattern-pulse.js`; optional expandable research strip and contribution link; see [integration setup](docs/patternpulse.md) |

Read marks are browser-local, survive reloads, and update other tabs on the same origin. They do not synchronize across devices or write to Ghost. Clearing browser storage removes them. The SF Pro Mono/SF Mono stack uses fonts available on the reader's system; Apple font files are not bundled.

The body uses Freight Text Pro with Georgia and Times fallbacks. `default.hbs` still contains an Adobe Fonts project placeholder; supply a valid project through the site's existing font configuration if Freight is required.

## Native resources and editorial layout

Chapter HTML cards with `.hp-native-resource` and `data-hp-native-resource` use `assets/css/native-resources.css` and `assets/js/native-resources.js`. Resources stay inside Ghost chapter content so Ghost access controls apply. The Length Limit resource adds filtering, compare/read views, and an expanded dialog; other resource cards work without JavaScript.

After activating these assets, remove only duplicate native-resource CSS/JS from page code injection. Preserve Paperdeck and unrelated injections. Download links remain in the HTML cards and point to Ghost file storage.

See [AGENTS.md](AGENTS.md) for implementation guidance and [editorial layout notes](docs/editorial-layout.md) for images, sidenotes, footnotes, and reading-time exclusions.

## License

The theme package declares MIT. Bundled LTL Pixel fonts are copyright Clay Parker Jones and have no selected upstream reuse license; see [the font notice](assets/fonts/ltl-pixel/NOTICE.txt). Other bundled libraries retain their own notices.
