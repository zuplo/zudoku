# @zudoku/zuplo

The Zuplo integration for [Zudoku](https://zudoku.dev). It inspects the surrounding Zuplo project
and builds the dev portal configuration for it. Install it in a Zuplo project's `docs/` folder;
Zudoku applies it automatically when running in Zuplo mode (`zudoku dev --zuplo` / `ZUPLO=1`).

## What it does

- **OpenAPI**: Adds an `apis` entry for every `../config/*.oas.json` file. `routes.oas.json` is
  mounted at `/api`, other files at `/api-<name>`. Files (or paths) already present in your
  `zudoku.config` are left untouched.
- **GraphQL**: Adds a
  [`@zudoku/plugin-graphql`](https://www.npmjs.com/package/@zudoku/plugin-graphql) instance for
  every route marked with `x-graphql: true`, introspecting the deployed gateway endpoint
  (`ZUPLO_SERVER_URL` + route path). The raw `POST` operation is removed from the OpenAPI reference
  since the endpoint gets dedicated GraphQL pages.
- **Schema processors**: Applies the Zuplo OpenAPI processors: removes `x-internal` paths and
  parameters, documents API key and rate limit policies (from `../config/policies.json`), documents
  MCP server routes (`mcpServerHandler`), injects the gateway server URL and strips `x-zuplo-*`
  extensions.

## API

- `@zudoku/zuplo` (client-safe): `applyZuploContext(config, context)` applies a serialized Zuplo
  context to a Zudoku config. Used by Zudoku's client runtime via the `virtual:zudoku-zuplo-context`
  module.
- `@zudoku/zuplo/node` (node-only): `buildZuploConfig(config)` inspects the Zuplo project and
  returns the enriched config; `inspectZuploContext` and `getProcessors` are exported for
  programmatic use.
- `@zudoku/zuplo/vite-plugin`: serves the inspected context to the client bundle. Wired up
  automatically through the package's `vite.config.ts`.
