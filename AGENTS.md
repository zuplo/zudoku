# Zudoku Agent Guide

## Commands

- **Install**: `pnpm install`
- **Lint/Format Check**: `pnpm check` (runs biome + prettier)
- **Lint/Format Fix**: `pnpm fix` or `pnpm biome check --write {files}`
- **Test**: `vitest run --typecheck` | Single: `vitest run path/to/test.spec.ts`

## Code Style

- **Imports**: Use `.js` extensions for relative imports; use `import type` or inline `type` keyword
- **Types**: Prefer `type` over `interface`; no `I` prefix; PascalCase for components/types
- **Components**: Define with anonymous functions: `const Foo = () => {}`
- **Errors**: Extend `ZudokuError` for custom errors
- **Functional**: Prefer immutable patterns (`map`, `flatMap`, `Object.fromEntries`); use `const`
- **State**: Zustand for global state, React Query for server state
- **Console**: No `console.log` in production (biome error), except in `src/cli/`

## Architecture

- **Monorepo**: pnpm + nx; main package at `packages/zudoku`
- **Stack**: React 19, Vite, TypeScript strict, TailwindCSS, React Router 7, Radix UI
- **Plugins**: Located in `packages/zudoku/src/lib/plugins/`; plugins use core, not vice versa
