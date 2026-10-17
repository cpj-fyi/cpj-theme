# Editorial layout and transforms

These notes describe the existing post-body behavior in `assets/css/screen.css` and `assets/js/main.js`. Chapter reader overrides are in `assets/css/book-reader.css`; editorial heading fonts are in `assets/css/typography.css`.

## Content structure

```text
.post-body
  .content-wrapper          # Present on posts and chapter pages
    .content                # Ghost content; data-pagefind-body
      figure.kg-image-card
      p > sup.footnote-ref
      aside.sidenote        # Inserted by JavaScript
```

Standard pages may place `.content` directly inside `.post-body`. Images and footnote references are descendants of `.content`, not direct children of `.post-body`. Use descendant selectors accordingly.

On posts, `.content-wrapper` is the positioned ancestor of sidenotes. Its right edge aligns with the content column. Keep this in mind when changing width or padding; positioning against `.post-body` instead changes the overhang math.

## Image widths and sidenotes

| Figure | Normal post behavior |
| --- | --- |
| `.kg-image-card` | Maximum 500px; at widths of at least 1200px, floats left with a 228px overhang |
| `.kg-image-card.kg-width-wide` | Fills the 720px content column, cancelling post-body horizontal padding |
| `.kg-image-card.kg-width-full` | Expands toward the viewport, capped by the 1280px page width |

Chapter pages constrain figures to their column because the sidebar leaves no room for an overhang.

Regular inset images and right-side sidenotes have symmetric 228px overhangs. The sidenote is 200px wide, leaving a 28px gap. If changing one overhang, check the other. The image float uses `margin-top: 0`, a 24px right gutter, and `clear: left`. Headings, wide/full images, and horizontal rules clear both floats.

The general `.content img` rule adds vertical margin. The later `.kg-image-card img` rule removes that margin inside figures. Preserve their cascade when refactoring.

## Markdown images

`transformMarkdownImages(postBody)` converts a paragraph containing only an image, or a linked image, into a `figure.kg-card.kg-image-card`. That gives Markdown and Koenig images the same width behavior.

Captions use an image's `title` first, falling back to non-empty `alt`:

```markdown
![Network diagram](image.png "Figure 1: Network diagram")
```

When `title` supplies the caption, the transform removes the title tooltip and retains `alt`. When `alt` supplies the caption, it clears `alt` to avoid duplicating the caption for screen readers. Figures with captions receive `kg-card-hascaption`. Markdown images use the regular inset size; use a Koenig image card for wide/full sizing.

## Footnotes across Markdown cards

Ghost processes each Markdown card independently. Footnote identifiers such as `fn1` can therefore repeat in one post. `transformFootnotes(postBody)` scopes references to each card's footnote section and namespaces marker IDs as `sectionIndex:id` before `initSidenotes()` assigns continuous display numbers.

Preserve this ordering: associate each section's references while all footnote sections remain in the DOM, then remove the original sections and separators. Removing sections too early can associate a later card's references with the wrong definitions.

## Reading time

`initReadingTimeRecalc()` updates `[data-reading-time]` on post pages at 275 words per minute. It clones the post body and removes `.cpj-no-count` descendants before counting. Wrap charts, data tiles, and other substantial non-prose embeds in `.cpj-no-count` when they should not inflate reading time. This affects the post-page count; it does not add reading-time overlays to cards.

## Native chapter resources

Resource cards use `.hp-native-resource` and `data-hp-native-resource`. Their fonts and container rules are deliberately independent of editorial heading overrides. Keep their content in Ghost HTML cards so access controls remain intact. Removing duplicate resource code injection should preserve Paperdeck and unrelated scripts or styles.
