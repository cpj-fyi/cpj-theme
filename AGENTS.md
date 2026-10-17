# Working in this repository

This is a Ghost 6 theme, with Handlebars templates, plain CSS, and browser JavaScript. There is no application bundler or production JavaScript dependency install. Start with [README.md](README.md) for setup and [package.json](package.json) for available commands and Ghost settings.

## Where changes belong

- `default.hbs` includes shared styles and scripts. Keep their order intentional: base styles, scoped feature styles, then Ghost head/foot hooks.
- `page.hbs` detects section-tagged Pages; `custom-chapter.hbs` is the selectable chapter template. Both delegate to `partials/chapter-reader.hbs`. Edit shared chapter markup there.
- `assets/css/book-reader.css` and `assets/js/book-reader.js` own chapter shapes, sticky reader layout, and previous/next links. `partials/chapter-pagination.hbs` provides the catalog; `partials/mobile-chapter-nav.hbs` provides mobile navigation.
- `assets/css/typography.css` owns LTL Pixel for direct editorial H2/H3/H4. Keep this scoped so `.hp-native-resource`, cards, sidebars, and archive headings retain their own typography. Preserve the bundled font notice.
- `assets/js/reading-state.js` owns browser-local read marks. `partials/reading-state.hbs` renders its controls only when Ghost grants `access` and provides `@member.uuid`.
- `assets/css/native-resources.css` and `assets/js/native-resources.js` enhance resource HTML cards stored in Ghost. Preserve their containment, typography, and existing download links.
- PatternPulse integration lives in `assets/css/pattern-pulse.css`, `assets/js/pattern-pulse.js`, and [docs/patternpulse.md](docs/patternpulse.md). Its API and contribution service are in the separate `cpj-fyi/patternpulse` repository.
- `assets/js/main.js` contains older site interactions, Markdown transforms, sidenotes, and reading-time calculation. `moonphase.js` contains separately tested lunar calculations.

## Reader invariants

- Keep Ghost `{{content}}` and server-provided `access` authoritative. Client-side UI or preview query parameters do not grant access to chapter content.
- Read marks are manual, per-member UUID, per-chapter, and local to this browser. Do not describe them as account synchronization or send member identifiers to PatternPulse.
- Measure header and mobile-nav heights via `--reader-header-height` and `--reader-mobile-height`; avoid restoring hard-coded sticky offsets. The desktop title stays outside the scrolling chapter list. Check both sides of the 1024px sidebar breakpoint and the 768px fixed-header breakpoint.
- Previous/next navigation follows numeric pattern order across sections. Introduction precedes 1; Pattern List and Goal Index are reference pages. Handle first/last chapters and existing `hd-pt.com/<number>` navigation shortlinks.
- The book catalog currently fetches at most 100 pages. Ghost 6 does not support an unbounded `limit="all"`; revise the strategy if the catalog outgrows the limit.
- Section order is Foundations, Structuring, Direction, Practice, Learning, Space. Their shapes are circle, inverted triangle, parallelogram, square, star, pentagon. Start & End has no numbered shape.
- Keep research survey aggregates separate from reader declarations. Leave `patternpulse_url` blank until the companion API, migration, and consent flow are deployed.

## Verify the behavior changed

```sh
npm ci
npm test
npm run validate
npx playwright install chromium
npm run test:reader
npm run package
```

Run the checks relevant to the change. `npm run test:reader` starts its own local fixture server and writes screenshots to `dist/previews/`; an installed Chrome can be used with `PLAYWRIGHT_CHANNEL=chrome`. `npm run preview` starts a manual preview on port 4173 (`PREVIEW_PORT` overrides it).

The preview uses real partials/assets with fixture data and simplified Ghost helpers. It cannot verify Ghost authentication, live content, deployed integrations, or code injection. Distinguish fixture results from real Ghost smoke checks. The known GScan baseline warning is missing support for Ghost custom-font settings (`--gh-font-heading` / `--gh-font-body`).

`npm run package` creates `dist/cpj-theme-<version>.zip` from theme templates, assets, partials, and `package.json`. Keep dependencies, docs, tests, preview fixtures, and generated screenshots out of the theme ZIP. Upload `routes.yaml` and `redirects.yaml` separately when those configurations change.

## Content and documentation

Book chapters are Pages tagged with a book section. Posts use one of `essays`, `radar`, or `five-things`. Routing filters use `tag:`, not `primary_tag:`; content-type-first is a display convention, and overlapping content-type tags should be avoided.

Keep setup and command documentation in README, implementation guidance here, and detailed topic notes in `docs/`. Update the relevant source when behavior changes instead of copying instructions into multiple assistant files. `CLAUDE.md` points here. Historical `docs/plans/` files are context, not a current specification.

See [docs/editorial-layout.md](docs/editorial-layout.md) before changing images, footnotes, or sidenote positioning.
