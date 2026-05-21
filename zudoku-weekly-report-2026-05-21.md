# Zudoku Weekly Report: May 14-21, 2026

## The Week in Numbers

| Metric | Count |
|--------|-------|
| PRs Merged | **45** |
| Commits | **48** |
| New Features Shipped | **5** |
| Bugs Squashed | **3** |
| Releases Published | **2** (v0.78.0 + v0.78.1) |
| Dependencies Updated | **29** |
| Active Contributors | **7** |
| Community Issues Closed | **1** (open for 1 year!) |
| Open PRs In Progress | **12** |

**Current Version:** `0.78.1` | **GitHub Stars:** 488

---

## Headline Features

### SSR + Auth (PR #2320) - by @dan-lee
The big one. Experimental server-side rendering with built-in authentication support has landed. This is foundational work that unlocks faster page loads, better SEO, and a more seamless auth experience. A PR that was in the works for a while - and it's finally merged.

### URL-Encoded Body Mode in Playground (PR #2427) - by @dan-lee
Users can now send `application/x-www-form-urlencoded` requests directly from the API playground. This was a **community-requested feature** (issue #1016, open for over a year, with 4 upvotes) from a user at Neighborly Software who needed it for OAuth client credentials flows. Shipped and closed!

### Publish Markdown by Default (PR #2465) - by @dan-lee
Every doc page now gets a `.md` artifact and a copy button out of the box. No config needed. This makes it trivially easy for users to grab raw markdown content from any page.

### Customizable Download Filename (PR #2450) - by @egrimstad
New `schemaDownload.fileName` config option lets users customize what the downloaded OpenAPI spec file is called. Small feature, big quality-of-life improvement.

### Responsive MCP Tab Navigation (PR #2451) - by @mosch
The MCP Endpoint component now has a mobile-friendly Select dropdown that replaces TabsList on smaller screens. API docs that work everywhere.

---

## Bug Fixes

- **Incompatible anyOf branches no longer crash allOf flattening** (PR #2482) - Fixed a schema processing crash when two allOf branches reference anyOf with incompatible types (e.g. JSON-LD `@context`). @dan-lee
- **Placeholder auth headers in code snippets** (PR #2478) - Copy-pasted curl commands from the docs no longer silently hit 401s. Auth headers now show a placeholder when no credential is configured. @dan-lee
- **Missing type on plugin checks** (PR #2489) - Type safety fix for plugin check logic. @lcampos

---

## Infrastructure & DX Improvements

- **Migrated code snippets to @scalar/snippetz** (PR #2452) - Replaced the forked `@zudoku/httpsnippet` with the community-maintained `@scalar/snippetz`. Less maintenance burden, better snippet generation.
- **Monetization plugin prefetch** (PR #2483) - Pricing and subscription pages no longer flash loading skeletons. Data is prefetched on init via a new `initialize` hook.
- **Pricing table UI polish** (PRs #2476, #2468) - Tighter grid sizing, aligned skeletons, smoother layout transitions.
- **CI race condition fix** (PR #2479) - Fixed a monetization release pipeline issue where git push could leave npm published but package.json stale.
- **Worktree config** (PR #2447) - Added `.worktreeinclude` for auto-copying env files into git worktrees.
- **29 dependency updates** - Keeping the supply chain fresh: Tailwind CSS 4.3.0, Vite 8.0.13, Lucide React 1.16.0, Mermaid 11.15.0, and more.

---

## Coming Soon (Open PRs)

These are actively being worked on and are coming to Zudoku soon:

- **Modernized Admonitions/Callouts** (PR #2494) - 6 new callout types (sparkles, rocket, settings, zap, lock, megaphone), WCAG contrast fixes, fresh styling
- **i18n Support** (PR #2477, Draft) - Core internationalization infrastructure with plugin-level translation support
- **CLI Startup Performance** (PR #2464) - Lazy-loading command modules to dramatically reduce CLI startup time (cutting ~175 static imports / ~285 KB)
- **Standalone MCP Endpoint** (PR #2480) - Use the MCP Endpoint component independently outside the full plugin context
- **Auth0 Audience Optional** (PR #2466) - Sign-in-only flows no longer require an audience config
- **Better OAuth Error Pages** (PR #2467, Draft) - Collapsible technical details for cleaner end-user error UX
- **Plan Switching Fixes** (PR #2488) - Fix for switching between private plans in the monetization plugin
- **API Catalog Docs** (PR #2463) - New documentation for categories and tags in the API Catalog

---

## Contributor Spotlight

| Contributor | Contributions This Week |
|-------------|------------------------|
| **@dan-lee** | 8 commits - SSR+Auth, playground URL-encoded mode, publishMarkdown, snippetz migration, allOf fix, auth header fix, CI fix |
| **@mosch** | 5 commits - Monetization prefetch, pricing table polish, MCP responsive tabs, tsdown upgrade |
| **@egrimstad** | 1 commit - Download filename config |
| **@ntotten** | 1 commit - Worktree config & gitignore cleanup |
| **@lcampos** | 1 commit - Plugin type fix |

---

## Community Interaction Log

### Neighborly Software (@shayne-neighborlysoftware)
- **Company:** [Neighborly Software](https://www.neighborlysoftware.com/) - a cloud-based govtech platform based in Atlanta, GA (51-200 employees). They manage Housing, Economic, and Community Development programs for 400+ public and private entities across the US.
- **Interaction:** Opened issue #1016 over a year ago requesting first-class `application/x-www-form-urlencoded` support in the Playground for OAuth client credentials flows. The issue had 4 upvotes and 1 eyes reaction.
- **Resolution:** Feature was shipped this week in PR #2427 by @dan-lee! Issue closed.
- **Significance:** A govtech company with 30%+ coverage of HUD entitlements is using Zudoku for their API documentation. Great validation for Zudoku in the government/public sector space.

---

## The Vibe Check

This was a **strong shipping week**. The SSR + Auth landing is a milestone - it's been in development for a while and sets the stage for next-gen Zudoku performance. The community request turnaround (year-old issue closed with a feature PR) shows we're listening. And with i18n, CLI perf, and modern callouts in the pipeline, the next few weeks look even bigger.

**45 PRs merged. 2 releases. 0 days wasted.**

Let's keep cooking.
