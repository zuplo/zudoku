# Zudoku Weekly Report: June 11–18, 2026

## The Week in Numbers

| Metric | Count |
|--------|-------|
| PRs Merged | 43 |
| PRs Opened | 17 |
| Commits to Main | 47 |
| Releases Shipped | 3 (v0.81.0, v0.82.0, v0.82.1) |
| Bug Fixes | 9 |
| New Features | 5 |
| Issues from External Users | 3 |
| External PRs | 1 |
| GitHub Stars | 548 |
| Forks | 83 |

---

## Releases Shipped

**v0.81.0** (Jun 11) — Collapsible sidebar navigation, full Inkeep search settings, markdown link fixes

**v0.82.0** (Jun 12) — LandingPage & BrowserWindow components, GraphQL playground API key support, sidebar click-to-toggle, SSR auth token restoration, config schema defaults fix, monetization usage credits & honest usage framing

**v0.82.1** (Jun 16) — Copy-page button fix, LazyMotion crash fix, pnpm 11 upgrade, tsgo typechecking

---

## Feature Highlights

### GraphQL Plugin Goes Prime Time
The biggest theme of the week was the **GraphQL plugin** getting battle-hardened. Dan shipped 8 PRs on `@zudoku/plugin-graphql` alone:
- API key handling in the GraphQL playground (#2589)
- Simplified config: single `schema` field replaces `type`/`input` discriminator (#2629)
- Default playground endpoint auto-detects Zuplo gateway URL (#2632)
- Fallback introspection for older GraphQL servers (#2612)
- Build-time validation — misconfigured schemas now fail loudly (#2631)
- Fixed deployment URL resolution for playground (#2641)
- Fixed bare `zudoku` import that broke consumer builds (#2639)

### New UI Components: LandingPage & BrowserWindow
Moritz landed reusable `LandingPage` (3 layout variants for developer portal homepages) and `BrowserWindow` (chrome wrapper for embedding browser-like previews) components. These are now available from `zudoku/components` for anyone building portal landing pages.

### Sidebar UX Improvements
Nathan added click-anywhere-to-toggle for sidebar categories (#2594), Dan fixed a bug where non-collapsible categories could still be collapsed (#2624), and the collapsible property is now properly respected.

### Inkeep Search — Full Config Pass-Through
Nathan opened up full customization of Inkeep search settings (#2590) — previously, `searchSettings`, `aiChatSettings`, and `modalSettings` were hardcoded. Now the entire config is passed through.

### SSR Auth Token Restoration
Dan fixed a critical SSR auth bug (#2598) where logging in with API-key or monetization plugins immediately logged users back out because in-memory tokens were cleared on full-page navigation without re-reading cookies.

---

## Build & DX Improvements

- **tsgo for typechecking** (#2622) — Switched from `tsc` to `tsgo` (@typescript/native-preview), the native Go-based TypeScript compiler. Faster typechecks across all packages.
- **pnpm 11 upgrade** (#2405) — Tooling modernization.
- **Zod 4 recursion** (#2600) — Simplified navigation schema from Zod 3 workarounds to clean Zod 4 getters.
- **Security fixes** (#2576) — Resolved code-scanning alerts, pinned GitHub Actions to commit SHAs.

---

## Monetization Plugin Progress

Max shipped two significant monetization updates:
- **Pending usage credits** (#2577) — Usage card now shows pending credits via a new gateway endpoint
- **Honest usage framing** (#2595) — Rewrote the Usage page to correctly render framing for every metering configuration (quota, pay-per-use, etc.)

---

## What's Cooking (Open PRs)

- **Route conflict detection** (#2642, mosch) — Dev-mode detection when multiple plugins register the same path
- **`createPath` utility** (#2630, mosch) — Define route paths once, reference everywhere, prevent drift
- **Config `extends` support** (#2597, mosch, draft) — Composable Zudoku configs via `extends` + `zudoku generate` / `zudoku schema` CLI commands
- **`@zuplo/zudoku` extraction** (#2593, mosch, draft) — Extracting Zuplo-specific integration into a standalone package
- **OpenAPI extension slots** (#2633, hutsalenko, external) — Schema-view & response slots with context hooks for customizing how schemas are rendered

---

## Community & External Contributors

### Who Interacted With Zudoku This Week

**Ivan Hutsalenko** (@hutsalenko) — Lviv, Ukraine
- Opened PR #2633: Adding OpenAPI schema-view & response extension slots with context hooks
- Background: Full-stack JavaScript developer working with React, Next.js, Remix, and Node.js
- This is a significant feature contribution adding rendering extension points to the OpenAPI plugin

**Eivind Grimstad** (@egrimstad) — Oslo, Norway | Works at Knowit
- Opened issue #2628: Reported outdated documentation on category links after upgrading to v0.82
- Returning contributor — previously contributed PR #2450 (config option to override download filename) in v0.78.0
- Knowit is a major Nordic IT consultancy (~4,000 employees)

**Elliot Hillary** (@fourls) — Delphi/Pascal tooling developer
- Opened issue #2623: Reported that non-collapsible nav categories could be collapsed by clicking text
- Maintains popular open-source Delphi tools: `sonar-delphi` (155 stars), `delphilint` (140 stars)
- Quality-focused developer — the issue was precise and immediately actionable (fixed within hours by Dan in #2624)

**vin-bush** (@vin-bush) — C# developer
- Opened issue #2621: Requesting Supabase auth captcha support for production environments
- Background: Works with C#, Semantic Kernel, and AI/ML tooling
- Indicates production Zudoku usage with Supabase auth in multi-environment setup

---

## Team Activity Breakdown

| Team Member | PRs Merged | Focus Areas |
|-------------|-----------|-------------|
| **dan-lee** | 25 | GraphQL plugin, sidebar fixes, auth, config, build tooling |
| **mosch** | 4 (+ 6 open) | LandingPage/BrowserWindow, documentation, architecture (config extends, createPath) |
| **ntotten** | 3 | Sidebar UX, Inkeep search, documentation |
| **max-zuplo** | 2 | Monetization plugin (usage credits, metering) |
| **dependabot** | 18 | Dependency updates |

---

## Dependencies Updated

18 dependency PRs merged this week, notable upgrades:
- Vite 8.0.13 → 8.0.16
- Zod 4.3.6 → 4.4.3
- Hono 4.12.23 → 4.12.25
- @tanstack/react-query 5.97.0 → 5.101.0
- esbuild 0.28.0 → 0.28.1

---

*Report generated June 18, 2026*
