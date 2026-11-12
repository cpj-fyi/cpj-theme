# Social preview fix — November 12, 2026

Theme `cpj-theme-1.2.1` is live on cpj.fyi. Previous theme `cpj-theme-1.2.0`
remains installed for rollback. Source change: PR #13.

All 11 custom settings were carried over, including artwork at
`https://monafor.clay-893.workers.dev` and PatternPulse at
`https://survey.hd-pt.com`. No content, routes, images or front-end assets changed.

Validation: 23 Node tests passed. GScan reported only the existing custom-font
warning. The installed ZIP changes only `default.hbs`, `package.json` and the
new `partials/post-social-meta.hbs`.

Server HTML (fetched without JavaScript) was checked after installation:

| Page | OG/Twitter images | Result |
| --- | --- | --- |
| `/essays/the-purpose-of-hierarchy-is-autonomy/` | One each, generated art | Correct article titles; no site-cover duplicate |
| `/radar/reducing-micro-teams-at-uber/` | One each, generated art | Correct article titles |
| `/14-distributed-management/` | One each, generated art | Correct chapter titles |
| `/essays/` | None | Ghost native summary card, no duplicates |
| `/` | One each, existing site cover | Ghost native homepage behavior |

Canonical URLs and Portal were present on every sample; JSON-LD remained on
single-entry pages and the homepage. Feature-image precedence, per-channel
editor overrides and escaping were verified with template fixtures. The
public Content API returned no feature-image posts for a live sample.

The actual Messages application was not exercised. Previously generated link
previews can remain cached after the server metadata changes.
