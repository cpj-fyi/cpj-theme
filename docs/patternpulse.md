# PatternPulse book integration

Companion backend: [PatternPulse PR #1](https://github.com/cpj-fyi/patternpulse/pull/1), merged and deployed at [survey.hd-pt.com](https://survey.hd-pt.com) on October 18, 2026. Its database migration is applied. It contains the API, consent flow, source-separated survey matching, and authenticated export.

Set **Patternpulse URL** in Ghost → Design → Site design to `https://survey.hd-pt.com`. Leave it blank to disable the integration. No member ID, email, cookie, or page contents are sent to PatternPulse by the theme.

Ghost stores custom settings per installed theme. When uploading a ZIP with a new versioned name, check this URL after activation; a new installation starts with the blank default. Set it in the **Theme** tab and save, then reload an entitled chapter to verify the research panel.

The companion PatternPulse implementation must be deployed and its database migration applied first. It provides `GET /api/public/patterns/:number` and `/patterns/:number/use`. The number comes from the chapter title (`1. True Purpose`). Chapter content must carry `data-pattern-pulse-url` only when Ghost grants `access`; `data-pattern-pulse-can-contribute="true"` enables the research link for signed-in readers.

A row of exactly 100 thin, rounded marks sits inside the first epigraph's white background once a valid response is received. The row is inset 24px from the top and 32px from the sides (16px at narrow mobile widths), with 12px-high marks and a summary target at least 44px high. The quotation remains a separate blockquote inside the shared background; research text is not inserted into the quotation. Chapters without a blockquote get a standalone inset panel.

An always-visible metadata line shows PatternPulse, agreement percentage, and response count. Its Details/Hide label and SVG chevron follow the native disclosure state, including keyboard activation. Expanded details show the survey question, five proportional legend bars with exact counts, methodology and latest-response date, and the consent-flow link when access permits. There is no hover tooltip.

The five response bins are charcoal (`#222222`) for strongly disagree, mid grey (`#888888`) for disagree, white for neutral, coral (`#ff3252`) for agree, and purple (`#8438f2`) for strongly agree. White marks have a subtle inset hairline so they remain visible against the white epigraph; the legend uses the same colors. Largest-remainder allocation converts the real response distribution to exactly 100 marks; tied remainders are resolved in response order, and a bin with zero responses receives zero marks. A mark represents approximately one percentage point, not one respondent. Expanded native `<details>` shows independently rounded percentages alongside exact counts, agreement percentage, sample size, the exact question, latest-response date, and sampling caveat. The raw counts remain authoritative; rounding can make displayed percentages sum to 99% or 101%.

It refreshes every five minutes while visible and when the reader returns to the tab. The API may cache for five minutes. Failed initial requests leave the epigraph unchanged; failed refreshes label previously fetched results.

Only completed, consented, quality-passing responses from the main survey sample are aggregated. Samples below 10 show 100 neutral placeholder marks and a visible **Research in progress** label, with no invented distribution or small-sample counts. Reader “I use this” declarations are separate from survey answers and never increase this chart's agreement counts.

**I use this** opens a first-party PatternPulse consent form. No declaration is recorded merely by opening the link. After explicit consent, an anonymous browser cookie deduplicates declarations and the optional survey consent screen can connect them to screener answers. Book-reader survey responses carry `source=book_reader`; they are excluded from the main public chart. The new backend exports allow research matching using the anonymous respondent ID. This version does not collect email, send email, or synchronize against Ghost accounts. That would require a separate explicit contact-consent and authenticated identity flow.

The frontend intentionally rejects missing, malformed, or mismatched data and uses text nodes for all API strings. An endpoint must return `patternId`, `patternName`, `questionText`, `methodology`, and either `status: "insufficient_data"` or `status: "available"` with integer `sampleSize >= 10`, five ordered `distribution` entries (`value` 1–5, `label`, nonnegative integer `count`), and optional ISO `updatedAt`. Counts must sum to sample size. The API is public aggregate-only; the frontend fetch omits credentials and referrers.

The contribution page itself is a publicly reachable self-report tool, even though the theme link is gated. PatternPulse does not verify Ghost membership or entitlement. Treat these as self-selected declarations, not verified member counts; membership-verified contributions require a trusted server integration with Ghost.

## Release verification

On October 18, 2026, production pattern endpoints 1, 13, and 75 returned valid five-bin distributions with qualifying sample sizes of 35, 35, and 28. A browser check of the theme against the real API rendered exactly 100 marks for pattern 13 and expanded to “51% agree · 35 survey responses.” The contribution link targets the deployed consent flow; the consent page was also checked separately. These figures describe that check, not fixed expected values as research grows. No declaration or survey response was submitted during verification; write behavior is covered by the backend tests.

Theme 1.2.0 was activated through Safari on the same date. The signed-in live chapter displayed the new metadata and expanded research details, and the contribution link pointed to `/patterns/13/use`. Live asset verification used the exact Ghost `?v=` URLs from the page HTML; arbitrary query strings can return older CDN-cached assets.
