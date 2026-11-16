# Full-book search — November 16, 2026

Theme `cpj-theme-1.2.2` is live on cpj.fyi. Previous theme `cpj-theme-1.2.1`
remains installed for rollback. All 11 custom settings retain their previous
values; `patternpulse_url` was restored to `https://survey.hd-pt.com` after
activation. Existing Ghost content and access settings were not changed.

Public search now matches the full text of all 75 patterns. The existing public
Pagefind crawl could only index chapter previews, and seven chapters had only a
subscription prompt. Chapter headings were also outside the indexed body.
The new search merges public posts with server-side matches from the reader
Worker. Book previews are fixed per chapter, bounded to 40 words / 280 characters,
and independent of the query. Full book text and index are not public assets.

Companion Worker source lives in the Hidden Patterns workspace's `reader-mcp/`.
Deployed Worker version: `f5816bb1-f323-44fb-a80e-3b62d3e90f83`.
Previous version: `c321f62c-58da-47f3-a91e-8b13c6517b58`.
Private corpus prefix remains `full-20261114-1`. Existing OAuth, secrets,
bindings and routing were preserved; `SEARCH_LIMIT` adds 60 requests/minute/IP.

Validation:

- All 28 theme Node tests passed; GScan reports only the existing font warning.
- Six new server tests passed, covering all 75 title/number lookups, deep-text
  matching, preview limits, rate limits, invalid queries, origins, and actual
  Worker routing with OAuth enforced on `/mcp`.
- Original Miniflare HTTP tests could not bind loopback in this sandbox
  (`listen EPERM`). The socket-free route test uses the real bundled handler;
  only the unused Cloudflare RPC base class is stubbed.
- Live Safari: `ShipIt` returns `60. Hack Day` in Hidden Patterns, followed by
  ordinary post matches. Both sections render in the existing modal.
- Live anonymous API: 200 search; same preview for `ShipIt` and `Hack Day`;
  cpj.fyi CORS; no-store; offset request 400; `/mcp` 401.
- Anonymous Ghost HTML still excludes `ShipIt` from Hack Day. Chapter title
  indexing is present, the deployed search asset matches the source exactly,
  and Team Charter retains the PatternPulse URL.

To roll back the interface, reactivate 1.2.1. To remove public book search too,
deploy the previous Worker version at 100%. Do not reseed the corpus or change
Ghost membership settings as part of a rollback.
