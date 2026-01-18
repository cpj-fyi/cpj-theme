# CPJ Theme

A custom Ghost 6.x theme for [cpj.fyi](https://cpj.fyi), featuring Clay Parker Jones's book "Hidden Patterns" and blog content.

## Features

- **Book Integration**: 75+ chapters organized into 7 sections with persistent sub-navigation
- **Multiple Content Types**: Essays, Radar (short posts), Five Things (lists)
- **Magazine-Style Layouts**: Featured posts, grid layouts, compact feeds
- **Configurable Sidebar**: Newsletter signup, featured content, custom HTML
- **Clean Typography**: Freight Text Pro serif with system sans UI elements

## Installation

1. Download or clone this repository
2. Zip the theme folder: `zip -r cpj-theme.zip cpj-theme/`
3. Upload to Ghost Admin → Design → Change theme → Upload
4. **Important**: Upload `routes.yaml` separately via Ghost Admin → Settings → Labs → Routes

## Configuration

### Custom Settings

Configure in Ghost Admin → Design → Site design:

| Setting | Description |
|---------|-------------|
| `book_title` | Book title displayed on homepage/footer |
| `book_author` | Author name |
| `book_description` | Book tagline |
| `book_cta_text` | Call-to-action button text |
| `book_cta_url` | CTA button link |
| `sidebar_newsletter_heading` | Newsletter widget heading |
| `sidebar_newsletter_text` | Newsletter description |
| `footer_tagline` | Footer copyright tagline |

### Content Organization

**Book Chapters**: Create as Pages, tag with section name:
- `start-end`, `foundations`, `structuring`, `direction`, `practice`, `learning`, `space`

**Blog Posts**: Tag with content type as the **first tag**:
- `essays` - Long-form posts
- `radar` - Short posts
- `five-things` - List posts

**Important**: The first tag determines the post's URL. Always put the content-type tag first.

## Routes

The `routes.yaml` creates these collections:
- `/essays/` - Posts tagged "essays"
- `/radar/` - Posts tagged "radar"
- `/five-things/` - Posts tagged "five-things"

## Development

```bash
# Clone the repo
git clone https://github.com/cpj-fyi/cpj-theme.git

# Make changes, then zip for upload
zip -r cpj-theme.zip cpj-theme/

# Or use Ghost's local development
ghost install local
```

## Theme Structure

```
cpj-theme/
├── assets/
│   ├── css/screen.css    # Main stylesheet
│   └── js/main.js        # Interactions
├── partials/
│   ├── header.hbs        # Site header with nav
│   ├── footer.hbs        # Book-focused footer
│   ├── book-subnav.hbs   # Book section navigation
│   ├── sidebar.hbs       # Configurable sidebar
│   └── post-card-*.hbs   # Card components
├── index.hbs             # Homepage
├── post.hbs              # Blog posts
├── page-chapter.hbs      # Book chapters
├── tag-essays.hbs        # Essays archive
├── tag-radar.hbs         # Radar archive
├── tag-{section}.hbs     # Book section pages
├── routes.yaml           # Custom routing (upload separately)
└── package.json          # Theme config
```

## License

MIT

## Credits

Built for Clay Parker Jones by Claude.
