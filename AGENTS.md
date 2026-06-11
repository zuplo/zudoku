# Zudoku Codebase Guide

## Build/Lint/Test Commands

- **Check**: To check for all linting/formatting issues, run `pnpm check`
  - For formatting, run `pnpm fmt:check` (uses oxfmt)
  - For linting, run `pnpm biome ci`
- **Fix**: To fix all linting/formatting issues, run `pnpm fix`
  - For formatting, run `pnpm fmt` (uses oxfmt)
  - For linting, run `pnpm biome lint --write {files}`
  - Always use `--write` when running biome lint to fix issues in one command
- **Test**: `pnpm test` or for single test: `pnpm vitest run path/to/test.spec.ts`
- **Typecheck**: `pnpm -F zudoku typecheck` to check types for the zudoku package
- **Dev**: The zudoku CLI runs from source via `tsx` when `packages/zudoku/dist/` is absent, so
  example projects (e.g. `pnpm -F docs dev`, `pnpm -F cosmo-cargo dev`) work without first building
  `packages/zudoku`.
- **Debugging**: During active debugging, leave console.log statements in place and don't fix linter
  issues until debugging is complete. Remove console.logs only after feature is confirmed working.

## Changesets (changelogs & releases)

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning, changelogs,
and publishing. When a change is user-visible, add a changeset so it appears in the changelog and
triggers a release:

- Run `pnpm changeset`, then pick the affected package(s), the semver bump, and a one-line summary.
- That writes a `.changeset/*.md` file, commit it alongside your change. This is where changelog
  entries go now; do not hand-edit any `CHANGELOG.md` (they are generated at release time).
- A bot opens a "Version Packages" PR that bumps versions, regenerates the `CHANGELOG.md` files, and
  publishes to npm when merged.
- Skip the changeset for changes with no user impact (internal refactors, tests, docs, CI).

`create-zudoku` is version-locked to `zudoku` (`fixed` group in `.changeset/config.json`) because it
writes its own version into scaffolded apps as the `zudoku` dependency. As an implementation detail
it is deliberately invisible in releases: the `version-packages` script deletes its `CHANGELOG.md`,
and `main.yaml` publishes with `--no-git-tag` plus a script that creates tags/GitHub releases for
every published package except `create-zudoku`.

## Architecture

- **Monorepo**: Using pnpm workspaces. Releases via
  [Changesets](https://github.com/changesets/changesets).
- **Main packages**: `packages/zudoku` (core framework) and `packages/create-zudoku` (creates new
  Zudoku projects CLI)
- **Core tech**: React 19+, Vite, TypeScript, TailwindCSS, React Router 7, Tanstack Query, Radix UI,
  Zod, mdx.js
- **Plugins**: Modular architecture via plugins (openapi, markdown, api-keys, search, etc.)
- **GraphQL**: Internal API for structuring OpenAPI documents using Pothos + GraphQL Yoga
- **Build**: Vite-based with custom plugins for MDX, OpenAPI, theme generation

## Code Style

- **Imports**: Use `.js` extensions for relative imports, type-only imports
  `import type { ReactNode } from "react"`, imports inline:
  `import { type ReactNode, useState } from "react"`
- **Errors**: Throw and/or extend `ZudokuError` for custom errors
- **Typescript**: Prefer types over interfaces, PascalCase for components/classes, no `I` prefix for
  interfaces, avoid type casting (`as`) when possible and use existing types from packages
- **Components**: Use anonymous functions to define components
- **State**: Zustand for global state, React Query for server state
- **Files**: TypeScript strict mode, no console/debugger in production, prefer `const` over `let`,
  don't remove `console.log` when debugging
- **Functional**: Prefer immutable functional style, using functions like `Object.fromEntries`,
  `map` and `flatMap` to construct new data
- **Control flow**: Prefer early returns over nested if statements, early continue/break in loops

## UI

- Use UI components from the `zudoku/ui` module. (based on shadcn/ui)
- Use icons from the `zudoku/icons` module (based on Lucide icons)

## Config Schema (Zod)

- The loader parses the user config via `validateConfig()`, so schema `.default()`/`.transform()`
  values apply to everything downstream. Don't re-parse config sections in consumers.
- Order is always transform-then-parse: plugin `transformConfig` hooks run on the RAW authored
  config (same shape they see in the client bundle), then the result is schema-parsed. Hook
  additions must conform to the schema; unknown keys are stripped on the server side.
- Zod only applies nested `.default()`s when the parent object is present in the input. A parent
  that is `.optional()` short-circuits to `undefined` and inner defaults never run. Sub-schemas
  whose defaults should apply when omitted must use `.prefault({})` on the schema itself (see
  `DocsConfigSchema`). `.default({})` does NOT work for this: it returns the literal `{}` without
  running the inner schema.
- Exceptions that read the raw (unparsed) config: the client bundle via `virtual:zudoku-config`, and
  `buildManifest` when called from the SSR entry. The prerender worker parses the built bundle's
  config itself via `validateConfig()`.

## OpenAPI Schema Processing Pipeline

There are two distinct pipelines depending on how schemas are loaded:

### File schemas (build mode via `SchemaManager`)

1. `$RefParser.bundle()` bundles external refs, keeps internal `$ref`s. Uses
   `preservedProperties: ["description", "summary"]` so other `$ref` sibling properties are lost.
2. `@scalar/openapi-parser` `upgrade()` converts OAS 3.0 → 3.1. Converts `example` → `examples`
   (array for schema paths, `{ default: { value } }` for non-schema paths) and deletes `example`.
   Skips if already OAS 3.1+.
3. `flattenAllOfProcessor` resolves `$ref`s inside `allOf` arrays then merges via
   `@x0k/json-schema-merge`.
4. Custom user-defined processors run.

### URL schemas (runtime via `validate()` in `oas/parser/index.ts`)

1. Custom `dereference()` resolves all `$ref`s inline (replaces entirely, losing sibling
   properties).
2. Custom `upgradeSchema()` in `oas/parser/upgrade/index.ts` converts OAS 3.0 → 3.1. Always runs the
   `example` → `examples` conversion regardless of version.
3. `flattenAllOf()` merges `allOf` schemas.

### GraphQL layer

Schemas are exposed via a Pothos GraphQL API (`oas/graphql/index.ts`). The `schema` field on
responses/request bodies is passed as `JSONSchemaScalar`, which serializes the raw schema object
through `handleCircularRefs()`. Media-type level `example`/`examples` are resolved into
`ExampleItem` arrays by the GraphQL resolvers before reaching the client.

## SSR and Module-Level State

Most of `src/lib` and `src/app` is evaluated in BOTH the client bundle and the SSR bundle. On the
server, module-level mutable state (`let`, singletons, the zustand stores) is shared across ALL
requests and users for the lifetime of the process — never store per-request or per-user data there.
Rules:

- Per-request server state (auth, profile, tokens) must flow through request-scoped channels:
  `resolveSsrAuth()` → `SSRAuthState` → `RenderContext` (see `entry.server.tsx`). The `authState`
  zustand store is NOT trusted on the server; `hook.ts` reads from `RenderContext` instead.
- Client-only side effects (writing auth state, fetch to same-origin endpoints, storage access) must
  sit behind a `typeof window === "undefined"` guard, like `setupCookieSync` and the
  `hydrateFromServerSession` call in `getAccessToken`. Module-level `let`s written only behind such
  guards are fine: on the client they are per-tab state; on the server they stay at their initial
  value.
- The same applies to react-query: a module-level `QueryClient` rendered during SSR leaks one user's
  cached data into another user's HTML. Create per-request clients on the server (`entry.server.tsx`
  does) and dehydrate/hydrate instead.

## Polyfills

`polyfills.ts` is a side-effect module imported in `main.tsx` and listed in `package.json`
`sideEffects`. All browser polyfills must go in this file or be added as a separate entry in the
`sideEffects` array, otherwise they will be tree-shaken in production builds.

## Bundle Size

Heavy modules must never be statically imported from entry-path code (modules reachable from
`entry.client` without a lazy boundary). Static imports from route-split code (e.g. openapi plugin
pages) are fine since those are already in separate chunks.

Modules that must be lazy-loaded (`React.lazy` or dynamic `import()`) in entry-path code:

- `SyntaxHighlight` / `HighlightedCode` (pulls in shiki)
- `CodeTabs` (imports SyntaxHighlight)
- `Mermaid`
- `Markdown`
- `PlaygroundDialog`

When adding new components that depend on these, either lazy-load them or place them in route-split
plugin code. A static import chain from `MdxComponents.tsx` or similar always-loaded modules will
pull the heavy dependency into `entry.client`.

`motion`/`motion/react`: The core (`m`, `LazyMotion`, `AnimatePresence`, ~5kb) can be statically
imported, but `domAnimation` (~37kb) must load via `LazyMotion`'s async `features` prop using a
separate module (see `navigation/motionFeatures.ts`). Always use `m.*` (not `motion.*`) inside
`<LazyMotion strict features={...}>`.

## Plugin Architecture

- Plugins live in packages/zudoku/lib/plugins/
- Plugins can use things from core, but core should not directly reference plugins

## Examples

- `examples/cosmo-cargo/` - Feature-rich demo of a futuristic space shipping company. Use this to
  test new features. Content should match the space/sci-fi tone (quantum, interstellar, warp drives,
  etc.). Run with `pnpm -F cosmo-cargo dev`.
