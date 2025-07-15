# Zudoku Codebase Guide

## Build/Lint/Test Commands

- **Build**: `nx run-many -t=build -p zudoku config` or `pnpm build`
- **Lint**: `pnpm lint` (fix) or `pnpm lint:ci` (check only)
- **Format**: `pnpm format` (fix) or `pnpm format:ci` (check)
- **Test**: `vitest run --typecheck` or for single test: `vitest run path/to/test.spec.ts`
- **Dev**: `nx run cosmo-cargo:dev` or from examples: `pnpm dev`

## Architecture

- **Monorepo**: Using pnpm + nx for workspace management
- **Main packages**: `packages/zudoku` (core framework), `packages/config`, `packages/create-zudoku`
- **Core tech**: React 19+, Vite, TypeScript, TailwindCSS, React Router 7, Tanstack Query, Radix UI
- **Plugins**: Modular architecture via plugins (openapi, markdown, api-keys, search, etc.)
- **GraphQL**: Internal API using Pothos + GraphQL Yoga
- **Build**: Vite-based with custom plugins for MDX, OpenAPI, theme generation

## Code Style

- **Imports**: Use `.js` extensions for relative imports, type imports inline: `import { type Foo }`
- **Errors**: Extend `ZudokuError` for custom errors
- **Components**: PascalCase for components/classes, no `I` prefix for interfaces
- **State**: Zustand for global state, React Query for server state
- **Files**: ESLint + Prettier, TypeScript strict mode, no console/debugger in production

## Plugin Architecture
- Plugins live in packages/zudoku/lib/plugins/
- Plugins can use things from core, but core should not directly refernce plugins 
