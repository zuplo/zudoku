# Zudoku Weekly Report

## May 21 - May 28, 2026

---

## The Week at a Glance

| Metric | Count |
|---|---|
| Human-authored PRs merged | 11 |
| Releases shipped | 3 (v0.78.1, v0.79.0, v0.79.1) |
| New community issues | 3 |
| Bugs squashed | 6 |
| New features landed | 4 |
| Active contributors | 3 |
| Dependency updates | 16 |

**Repo vitals:** 539 stars / 80 forks / 61 open issues

---

## Headline Features

### GraphQL Just Landed in Zudoku

OpenAPI docs can now declare GraphQL endpoints via an `x-graphql` extension. When Zudoku detects one, it swaps the REST playground for a fully themed **GraphiQL panel** - styled to match your Zudoku theme, not GraphiQL's stock pink. This was a two-PR effort from **@dan-lee** and **@mosch** that went from zero to shipped in a single week.

**PRs:** #2499 (GraphQL endpoint support) + #2500 (themed GraphiQL panel)

### Goodbye react-helmet, Hello Unhead

We ripped out our forked `react-helmet-async` and replaced it with `@unhead/react` v3 - a ground-up rewrite of document head management with first-class React 19 and streaming SSR support. One fewer fork to maintain, better performance, and future-proof. E2E tests added to lock down the behavior.

**PR:** #2497

### Admonitions Got a Glow-Up

Callouts/admonitions received a complete redesign - modernized card layout, 6 new types, and fixed WCAG contrast issues that had the old variants failing AA accessibility checks. Your docs just got prettier AND more accessible.

**PR:** #2494

### Monetization Plugin: Pricing Cards Polished to a Shine

A massive effort from **@mosch** refined how plan cards render usage-based pricing, tiered breakdowns, and PAYG displays. Pay-as-you-go plans no longer show as "Free," single-tier prices render correctly, and hybrid plans don't show redundant "+usage" annotations. This was a 9-commit deep dive with edge cases handled meticulously.

**PR:** #2434

---

## Bug Fixes - Squash Report

| PR | Fix | Author |
|---|---|---|
| #2516 | Sidebar filter no longer haunts you across nav sections | @dan-lee |
| #2503 | Zudoku version reads at runtime - no more stale version in console | @dan-lee |
| #2502 | Code blocks: `---` and `###` render as distinct glyphs again (Geist Mono ligature fix) | @dan-lee |
| #2495 | SSG builds no longer break auth on page refresh | @dan-lee |
| #2489 | Fixed missing type annotation on plugin checks | @lcampos |
| #2488 | Plan switching now works for private-to-private and version upgrades | @lcampos |

---

## Contributor Scoreboard

| Contributor | PRs Merged | Focus Area |
|---|---|---|
| **@dan-lee** | 7 | GraphQL, Unhead migration, admonitions, bug fixes |
| **@mosch** | 2 | Monetization pricing, GraphiQL theming |
| **@lcampos** | 2 | Monetization plan switching, type fixes |

---

## Community Pulse

### New Issues Filed

1. **#2515** - _"Sidebar filter keeps filter state after navigation"_ by **@egrimstad**
   - Status: **FIXED** in < 24 hours (PR #2516 by @dan-lee)
   - Bug reported Monday, shipped Tuesday. That's the Zudoku speed.

2. **#2514** - _"Feature request: Breadcrumbs"_ by **@egrimstad**
   - Status: Open - wants `category` frontmatter expanded into breadcrumb navigation
   - Great idea from an active contributor

3. **#2498** - _"Root-relative $ref paths or path aliases for multi-file specs"_ by **@maxd**
   - Status: Open - requesting path aliases for deeply nested OpenAPI specs
   - Shows Zudoku is being used for serious, large-scale API documentation

### Who Are These Community Members?

**@egrimstad - Eivind Grimstad**
- **Role:** Web Developer at **Knowit** (Nordic digital consultancy, 3,700+ employees across Scandinavia)
- **Location:** Oslo, Norway
- **Education:** MSc Computer Science from NTNU (2014-2019)
- **Zudoku track record:** One of the most active external contributors with **7 merged PRs** and **3 issues** since Sep 2025. His PRs include schema example generation, category link overrides, version metadata, navigation frontmatter options, API info overview page, and download filename config. He also maintains a fork of Zudoku and Stoplight's Spectral.
- **Signal:** Using Zudoku in production at Knowit for professional API documentation with Auth0 authentication. This is a power user who contributes features AND files quality bugs.

**@maxd - Maxim Dobryakov**
- **Role:** Senior full-stack developer (Ruby, embedded systems, macOS, web)
- **Location:** Amsterdam, Netherlands
- **Notable:** Prolific open-source contributor with **22.9 million total downloads** on RubyGems (including `less-rails` at 19.9M downloads). Early GitHub adopter (user ID 27,208). Arctic Code Vault Contributor.
- **Zudoku track record:** 3 issues filed since March 2026 - a crash bug with multi-file `oneOf`/`allOf` specs (#2171, fixed), deprecated field styling (#2182, fixed), and now path aliases (#2498, open).
- **Signal:** Using Zudoku to document a complex, deeply nested multi-file OpenAPI specification. The sophistication of his requests shows enterprise-grade adoption.

---

## Release Train

| Version | Date | Highlights |
|---|---|---|
| **v0.78.1** | May 21 | SSR auth experiment, lucide-react bump, plugin type fix |
| **v0.79.0** | May 21 | SSG auth fix, plan switching fixes |
| **v0.79.1** | May 28 | GraphQL support, Unhead, admonitions, monetization polish |

**3 releases in 7 days.** We're not just moving fast - we're shipping.

---

## Dependency Health

16 dependency updates merged this week, keeping us current on:
- **Shiki** 4.0.2 -> 4.1.0 (syntax highlighting)
- **Tailwind CSS** 4.2.1 -> 4.3.0
- **Vite** 8.0.9 -> 8.0.13
- **Biome** 2.4.6 -> 2.4.15 (linter)
- **Mermaid** 11.12.1 -> 11.15.0
- Plus 11 more (motion, posthog, dotenv, react-hook-form, etc.)

---

## Looking Ahead

Open feature requests that signal where the community wants us to go:
- **Breadcrumbs** (#2514) - Navigation hierarchy in page headers
- **Path aliases for $ref** (#2498) - Better DX for large multi-file specs

---

*Generated May 28, 2026 - Zudoku Weekly Report*
