# Zudoku Codebase Guide

## Build/Lint/Test Commands

- **Check**: To check for all linting/formatting issues, run `pnpm check`
  - For formatting, run `pnpm fmt:check` (uses oxfmt)
  - For linting, run `pnpm biome ci`
- **Fix**: To fix all linting/formatting issues, run `pnpm fix`
  - For formatting, run `pnpm fmt` (uses oxfmt)
  - For linting, run `pnpm biome check --write {files}`
  - Always use `--write` when running biome check to fix issues in one command
- **Test**: `vitest run --typecheck` or for single test: `vitest run path/to/test.spec.ts`
- **Dev**: Running example projects with `nx` (e.g., `nx run docs:dev`) will automatically rebuild
  dependent packages as needed. Don't manually run `pnpm -F zudoku build` repeatedly.
- **Debugging**: During active debugging, leave console.log statements in place and don't fix linter
  issues until debugging is complete. Remove console.logs only after feature is confirmed working.

## Architecture

- **Monorepo**: Using pnpm + nx for workspace management
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

## Plugin Architecture

- Plugins live in packages/zudoku/lib/plugins/
- Plugins can use things from core, but core should not directly reference plugins

## Examples

- `examples/cosmo-cargo/` - Feature-rich demo of a futuristic space shipping company. Use this to
  test new features. Content should match the space/sci-fi tone (quantum, interstellar, warp drives,
  etc.). Run with `nx run cosmo-cargo:dev`
