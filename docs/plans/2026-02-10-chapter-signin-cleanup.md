# Chapter Page Sign-In Cleanup

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the two redundant sign-in/subscribe prompts on chapter pages with a single, clean sign-in section — matching the ideal state where non-members see the chapter title, access message, pull quote, and a single SIGN IN button.

**Architecture:** Ghost's `{{content}}` helper outputs ALL content to non-members (no server-side truncation) and appends a `gh-post-upgrade-cta` element at the end. The theme must handle what non-members see. Every chapter has a consistent content structure: `.kg-cta-card` (access message) → `.kg-blockquote-alt` (pull quote) → `<p>` body text → `gh-post-upgrade-cta`. We use CSS sibling selectors to hide body text after the pull quote, hide Ghost's CTA, and show our own clean sign-in section.

**Tech Stack:** Ghost 6.x Handlebars templates, CSS

---

## The Problem (Confirmed via Live Site Inspection)

Ghost's `{{content}}` outputs for non-members on chapter pages (e.g. `/1-true-purpose/`, `/5-curiosity/`):

| # | Element | Class | Should Show? |
|---|---------|-------|-------------|
| 0 | `DIV` | `.kg-card.kg-cta-card.kg-cta-bg-grey` | Yes — access message |
| 1 | `BLOCKQUOTE` | `.kg-blockquote-alt` | Yes — chapter pull quote |
| 2+ | `P` | (none) | **No** — gated body text |
| last | `ASIDE` | `.gh-post-upgrade-cta` | **No** — Ghost's red paywall CTA |

This structure is consistent across chapters (verified on True Purpose and Curiosity).

**Current deployed state** (after premature changes): `content-gated` class removed and `membership-cta` removed → full content visible, zero sign-in prompt. Broken.

**Original state** (before any changes): `content-gated` max-height:400px + gradient fade + Ghost's red CTA + theme's "Continue Reading" CTA → two redundant sign-in prompts, too far down the page.

**Ideal state:** CTA card visible, pull quote visible, body text hidden, Ghost's red CTA hidden, single clean sign-in section.

---

### Task 1: Restore Content Gating + Add Chapter Sign-In CTA in Template

**Files:**
- Modify: `custom-chapter.hbs:137-154`

**Step 1: Update the chapter template post-body section**

Replace the current post-body block (lines 137-154) with:

```handlebars
                <div class="post-body">
                    <div class="content-wrapper{{#unless @member}}{{#has visibility="paid,members"}} content-gated{{/has}}{{/unless}}">
                        <div class="content">
                            {{content}}
                        </div>

                        {{#unless @member}}
                            {{#has visibility="paid,members"}}
                                <div class="membership-cta">
                                    <p>Send me a receipt showing that you pre-ordered the book, and then sign in. You'll get a magic link and then all these chapters are yours to read.</p>
                                    <div class="membership-cta-buttons">
                                        <a href="#/portal/signin" class="btn btn-secondary">Sign in</a>
                                    </div>
                                </div>
                            {{/has}}
                        {{/unless}}
                    </div>
                </div>
```

Key differences from original:
- Restores `content-gated` class (was removed)
- Uses `{{#has visibility="paid,members"}}` (single check, not two separate)
- CTA has just "Sign in" — no "Subscribe", no "Continue Reading" heading
- Custom book-specific messaging instead of generic newsletter pitch

**Step 2: Verify the template is syntactically correct**

Visually confirm the Handlebars nesting: `post-body` → `content-wrapper` → `content` + `membership-cta`, all within `chapter-content`.

---

### Task 2: Add Chapter-Specific CSS Overrides

**Files:**
- Modify: `assets/css/screen.css` (Content Gating section, around line 3088)

**Step 1: Replace the chapter-page CSS block**

Find the existing rule (around line 3092-3095):
```css
/* Hide Ghost Portal's auto-injected paywall CTA on chapter pages */
.chapter-page .gh-post-upgrade-cta {
    display: none;
}
```

Replace it with the full chapter-page override block:

```css
/* Chapter page content gating overrides:
   Ghost outputs ALL content to non-members. On chapter pages, every chapter
   has: .kg-cta-card (access msg) → .kg-blockquote-alt (pull quote) → <p> body text → .gh-post-upgrade-cta.
   We hide everything after the pull quote and replace Ghost's CTA with our own. */

/* Hide Ghost Portal's auto-injected red paywall CTA on chapter pages */
.chapter-page .gh-post-upgrade-cta {
    display: none;
}

/* Hide body text paragraphs (and any other elements) after the pull quote */
.chapter-page .content-gated .content > .kg-blockquote-alt ~ * {
    display: none;
}

/* Remove max-height truncation on chapter pages — the sibling selector handles hiding.
   This prevents the awkward mid-paragraph cutoff + gradient fade. */
.chapter-page .content-gated .content {
    max-height: none;
    overflow: visible;
}

/* No gradient fade needed on chapter pages */
.chapter-page .content-gated .content::after {
    display: none;
}
```

**Why this works:**
- `.kg-blockquote-alt ~ *` selects all siblings AFTER the pull quote (the `~` general sibling combinator). This hides body `<p>` tags AND the `gh-post-upgrade-cta` in one rule.
- Overriding `max-height: none` removes the 400px truncation — the sibling selector handles visibility instead, so content doesn't get cut mid-paragraph.
- Removing `::after` eliminates the gradient fade since we don't need it (content ends cleanly after the pull quote).
- The `.kg-cta-card` (access message) and `.kg-blockquote-alt` (pull quote) remain visible because they come BEFORE the `~` target.

**Step 2: Verify no unintended style conflicts**

Check that the existing `.content-gated` rules (max-height, overflow, ::after, negative margin) still apply to non-chapter pages (posts, page.hbs) since they use the same classes but don't have `.chapter-page` on the article.

---

### Task 3: Deploy and Verify

**Step 1: Zip the theme**

```bash
cd cpj-theme && zip -r ../cpj-theme.zip . -x "node_modules/*" -x ".git/*" -x "docs/*"
```

**Step 2: Upload to Ghost Admin**

Upload the zip at Ghost Admin → Settings → Design → Change Theme → Upload.

**Step 3: Verify in private browsing (non-member view)**

Check these pages:
- `/1-true-purpose/` — should show: access message card, "Purpose is a guiding 'why'..." pull quote, sign-in CTA. Should NOT show body paragraphs or Ghost's red banner.
- `/5-curiosity/` — should show: access message card, "Learning is more important than being right" pull quote, sign-in CTA.
- Any essay post with members-only visibility — should still show the OLD behavior (gradient fade + "Continue Reading" CTA) since `.chapter-page` scoping keeps chapter overrides isolated.

**Step 4: Verify in logged-in view (member view)**

- Chapter pages should show full content with no CTA (same as before).

---

## Edge Cases to Watch

1. **Chapters without a pull quote (`.kg-blockquote-alt`)**: If a chapter doesn't have a pull quote as its second content element, the `~` sibling selector won't match and ALL content will be visible. Verify that every chapter has the CTA card + pull quote structure.

2. **The `page.hbs` fallback template**: It still has the old `content-gated` + `membership-cta` behavior (lines 124-137). If any chapter uses `page.hbs` instead of `custom-chapter.hbs`, it will show the old two-CTA behavior. Verify all chapters use Template: "chapter" in Ghost Admin.
