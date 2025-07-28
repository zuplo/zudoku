# Zudoku Codebase Guide

## Build/Lint/Test Commands

- **Build**: `nx run-many -t=build -p zudoku config` or `pnpm build`
- **Lint**: `pnpm lint` (fix) or `pnpm lint:ci` (check only)
- **Format**: `pnpm format` (fix) or `pnpm format:ci` (check)
- **Test**: `vitest run --typecheck` or for single test: `vitest run path/to/test.spec.ts`
- **Dev**: Run `nx run cosmo-cargo:dev` anywhere in the monorepo or from examples directory directly: `pnpm dev`

## Architecture

- **Monorepo**: Using pnpm + nx for workspace management
- **Main packages**: `packages/zudoku` (core framework) and `packages/create-zudoku` (creates new Zudoku projects CLI)
- **Core tech**: React 19+, Vite, TypeScript, TailwindCSS, React Router 7, Tanstack Query, Radix UI, Zod, mdx.js
- **Plugins**: Modular architecture via plugins (openapi, markdown, api-keys, search, etc.)
- **GraphQL**: Internal API for structuring OpenAPI documents using Pothos + GraphQL Yoga
- **Build**: Vite-based with custom plugins for MDX, OpenAPI, theme generation

## Code Style

- **Imports**: Use `.js` extensions for relative imports, type-only imports `import type { ReactNode } from "react"`, imports inline: `import { type ReactNode, useState } from "react"`
- **Errors**: Throw and/or extend `ZudokuError` for custom errors
- **Typescript**: Prefer types over interfaces, PascalCase for components/classes, no `I` prefix for interfaces
- **Components**: Use anonymous functions to define components
- **State**: Zustand for global state, React Query for server state
- **Files**: TypeScript strict mode, no console/debugger in production, prefer `const` over `let`, don't remove `console.log` when debugging
- **Functional**: Prefer immutable functional style, using functions like `Object.fromEntries`, `map` and `flatMap` to construct new data

## Plugin Architecture

- Plugins live in packages/zudoku/lib/plugins/
- Plugins can use things from core, but core should not directly reference plugins
