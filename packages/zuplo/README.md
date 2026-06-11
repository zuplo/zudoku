# @zudoku/zuplo

The Zuplo integration for [Zudoku](https://zudoku.dev). It inspects the surrounding Zuplo project
and contributes the dev portal configuration for it. Install it in a Zuplo project's `docs/` folder;
Zudoku applies it automatically when running in Zuplo mode (`zudoku dev --zuplo` / `ZUPLO=1`).

## How it works

The configuration flows through a two-step process:

1. **Generate** — `zudoku generate` (run automatically before `dev`/`build`/`preview`) compiles a
   `spec.json` plus the inspected Zuplo project into a typed base config layer (`zudoku.base.ts`)
   with real, static plugin imports. This package's `extendSpec` contributes the detected entries:
   - **OpenAPI**: an `apis` entry for every `../config/*.oas.json` file. `routes.oas.json` is
     mounted at `/api`, other files at `/api-<name>`. Files (or paths) already present in the spec
     are left untouched.
   - **GraphQL**: a [`@zudoku/plugin-graphql`](https://www.npmjs.com/package/@zudoku/plugin-graphql)
     entry for every route marked with `x-graphql: true`, introspecting the deployed gateway
     endpoint (`ZUPLO_SERVER_URL` + route path).
2. **Build** — your `zudoku.config.ts` extends the generated layer (`extends: [baseConfig]`) and
   wins on conflicts (plugins and apis concatenate). At config load time this package additionally
   attaches the node-only **schema processors**: removes `x-internal` paths and parameters, removes
   raw `x-graphql` operations (they get dedicated GraphQL pages), documents API key and rate limit
   policies (from `../config/policies.json`), documents MCP server routes (`mcpServerHandler`),
   injects the gateway server URL and strips `x-zuplo-*` extensions.

## API

All exports are node-only (`@zudoku/zuplo` and `@zudoku/zuplo/node` are equivalent):

- `extendSpec(spec, { rootDir })`: extends a Zudoku spec with the detected OpenAPI files and GraphQL
  endpoints. Called by `zudoku generate`.
- `applyZuploProcessors(config)`: attaches the Zuplo schema processors to a loaded config. Called by
  Zudoku's config loader in Zuplo mode.
- `inspectZuploContext({ rootDir, spec })` and `getProcessors({ rootDir })` are exported for
  programmatic use.
