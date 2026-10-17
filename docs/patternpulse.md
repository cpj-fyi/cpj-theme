# PatternPulse book integration

Companion backend: [PatternPulse PR #1](https://github.com/cpj-fyi/patternpulse/pull/1) (draft; not deployed). It contains the API, database migration, consent flow, source-separated survey matching, and authenticated export.

Set **Patternpulse URL** in Ghost → Design → Site design to the deployed PatternPulse application's HTTPS origin, for example `https://research.example.com` (this is an illustrative URL, not a live service). Leave it blank to disable the integration. No member ID, email, cookie, or page contents are sent to PatternPulse by the theme.

The companion PatternPulse implementation must be deployed and its database migration applied first. It provides `GET /api/public/patterns/:number` and `/patterns/:number/use`. The number comes from the chapter title (`1. True Purpose`). Chapter content must carry `data-pattern-pulse-url` only when Ghost grants `access`; `data-pattern-pulse-can-contribute="true"` enables the research link for signed-in readers.

A 10px strip appears above the first epigraph blockquote once a valid response is received. It expands with native `<details>` keyboard behavior. It shows the complete five-point response distribution, agreement percentage, sample size, exact question, latest-response date, and sampling caveat. The visual is 10px high with a 44px pointer target. It refreshes every five minutes while visible and when the reader returns to the tab. The API may cache for five minutes. Failed initial requests leave no empty widget; failed refreshes label previously fetched results.

Only completed, consented, quality-passing responses from the main survey sample are aggregated. Samples below 10 show **Research in progress**, with no small-sample counts. Reader “I use this” declarations are separate from survey answers and never increase this chart's agreement counts.

**I use this** opens a first-party PatternPulse consent form. No declaration is recorded merely by opening the link. After explicit consent, an anonymous browser cookie deduplicates declarations and the optional survey consent screen can connect them to screener answers. Book-reader survey responses carry `source=book_reader`; they are excluded from the main public chart. The new backend exports allow research matching using the anonymous respondent ID. This version does not collect email, send email, or synchronize against Ghost accounts. That would require a separate explicit contact-consent and authenticated identity flow.

The frontend intentionally rejects missing, malformed, or mismatched data and uses text nodes for all API strings. An endpoint must return `patternId`, `patternName`, `questionText`, `methodology`, and either `status: "insufficient_data"` or `status: "available"` with integer `sampleSize >= 10`, five ordered `distribution` entries (`value` 1–5, `label`, nonnegative integer `count`), and optional ISO `updatedAt`. Counts must sum to sample size. The API is public aggregate-only; the frontend fetch omits credentials and referrers.

The contribution page itself is a publicly reachable self-report tool, even though the theme link is gated. PatternPulse does not verify Ghost membership or entitlement. Treat these as self-selected declarations, not verified member counts; membership-verified contributions require a trusted server integration with Ghost.
