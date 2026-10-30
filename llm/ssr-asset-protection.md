# SSR asset protection: how protected chunks get gated

This document explains how Zudoku prevents the JavaScript for protected routes from being publicly
downloadable. Audience: contributors touching `packages/zudoku/src/vite/protected/*`,
`packages/zudoku/src/app/protectChunks.ts`, or any adapter under
`packages/zudoku/src/app/adapters/*`.

## The problem

`protectedRoutes` in user config blocks _rendering_ unauthenticated content via the runtime
`RouteGuard`. That alone doesn't stop someone from opening DevTools, finding the chunk URL for the
admin page in the network tab, and fetching it directly. The chunk is just a JS file in `/assets/`
that the static host happily serves to anyone.

Bundle-level protection is a separate guarantee: the JS for gated routes physically does not exist
in the publicly served output. Reaching it requires going through the SSR worker, which runs the
auth check before responding.

## The pipeline

The system runs in five passes during `zudoku build --ssr`:

| Pass | Where                                                       | What it does                                                                                         |
| ---- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1    | `vite/protected/annotator.ts` (Vite plugin, transform hook) | AST-scans every module for route-shaped dynamic imports and registers them in the protected registry |
| 2    | `vite/config.ts` (`isProtectedChunk` in rolldown config)    | Routes any chunk whose facade or contents come from a registered scope into `_protected/`            |
| 3    | `vite/build.ts` (post-build)                                | Asserts every `protectedRoutes` pattern has at least one registered scope (else build fails)         |
| 4    | `vite/build.ts` (post-build)                                | Asserts no public chunk statically imports from `_protected/` (else build fails)                     |
| 5    | `vite/protected/build.ts` (post-build)                      | Moves `dist/_protected/*` into `dist/server/_protected/*` so the static host can't serve it          |

For the Cloudflare adapter pass 5 is replaced: the chunks stay under `dist/_protected/` and
`run_worker_first` in `wrangler.toml` is asserted to cover that path so the Worker intercepts before
the static asset binding.

## The protected registry

`vite/protected/registry.ts` keeps a `Map<moduleId, ModuleScope[]>` populated by:

- `protectedAnnotatorPlugin`'s automatic AST scan, looking for two shapes:
  - **Shape A** — `{path: "/x", ...}` object literal with any nested `import()` calls. Covers React
    Router route objects and `openApiPlugin({path, schemaImports})`.
  - **Shape B** — `{ "/foo": () => import(...), ... }` dict, used by plugins that map paths to
    loaders directly.
- Plugin authors calling `registerProtectedScope(moduleId, scope)` from a Vite `load`/`transform`
  hook for shapes the AST scanner can't recognize.

A `ModuleScope` is either `{type: "route", path}` (single-path coverage) or
`{type: "subtree", root}` (covers everything under `root`, like `/admin/*`).

`getProtectedSourceMatcher(config)` returns `match(id) → boolean`: true if the module id is
registered under any scope that matches one of the configured `protectedRoutes` patterns. The build
uses this both to route chunks and to detect unmatched patterns.

## Chunk routing (the rolldown config)

In `vite/config.ts`, when `hasProtectedSources` is true:

```ts
output: {
  entryFileNames: (chunk) =>
    isProtectedChunk(chunk)
      ? `${PROTECTED_CHUNK_DIR}/[name]-[hash].js`
      : "assets/[name]-[hash].js",
  chunkFileNames: (chunk) => /* same */,
}
```

`isProtectedChunk` checks both `chunk.facadeModuleId` and `chunk.moduleIds` against the matcher. The
`facadeModuleId` check is needed because dynamic-entry chunks may end up as small re-export facades
after rolldown's automatic chunking, with the body extracted into a sibling chunk — the facade still
names the protected source but its `moduleIds` doesn't.

There's no `codeSplitting` group needed: rolldown's automatic chunking already extracts shared
runtime (MDX/React) into separate chunks whose `moduleIds` are non-protected, so they land in
`assets/` naturally. Both protected and public consumers import from them cleanly.

## URL resolution at runtime

Once a chunk lives at `_protected/foo-[hash].js`, the browser still needs a way to fetch it (after
auth). `experimental.renderBuiltUrl` in `vite/config.ts` rewrites these URLs to resolve through the
SSR origin, never the CDN:

```ts
if (filename.startsWith(`${PROTECTED_CHUNK_DIR}/`)) {
  return joinUrl(config.basePath, `/${filename}`);
}
```

The SSR worker is then responsible for running the auth check on incoming `/_protected/*` requests
before serving the file. Each adapter implements this differently:

- **Node / Lambda / Vercel** — request hits the worker, which calls `protectChunks` from
  `app/protectChunks.ts` to verify the session, then streams the file from
  `dist/server/_protected/`. The static asset binding never sees these paths.
- **Cloudflare** — `wrangler.toml` `run_worker_first` covers `/_protected/*` so the Worker
  intercepts before the assets binding. The chunks stay under `dist/_protected/` (not moved
  server-side). `assertCloudflareWranglerGatesProtected` verifies this at build time.

## Build-time invariants

Three assertions enforce the contract:

1. **`assertProtectedPatternsCovered(config)`** — every `protectedRoutes` pattern must have at least
   one registered scope. If a pattern matches no scope, the route is either (a) typo'd, (b) using an
   inline JSX element with no dynamic import, or (c) using a custom loading pattern not registered
   via `registerProtectedScope`. In any of those cases the JS for the route is shipping in the
   public bundle — the build fails with a list of uncovered patterns.

2. **`assertNoProtectedLeaks(output)`** — walks the static-import graph from every public entry
   chunk. If any path reaches a `_protected/` chunk via static `import` (not dynamic), the build
   fails. This catches cases where rolldown's automatic chunking decides to hoist a shared dep into
   a protected chunk, which would force public modules to statically pull it in. Dynamic imports are
   expected (route-split lazy boundaries) and skipped.

3. **`assertCloudflareWranglerGatesProtected(dir, config)`** (Cloudflare only) — verifies
   `wrangler.toml`/`wrangler.jsonc`/`wrangler.json` contains `run_worker_first` covering
   `/_protected/*`. Without it, the static asset binding would serve protected chunks bypassing the
   Worker.

## The lazy-boundary contract

The system gives one strong guarantee with one user-facing rule:

**Every protected route must be loaded via a dynamic import** (`() => import(...)`). The import
becomes the chunk boundary. Everything below it (nested routes, layout components, inline JSX in the
loaded module) is in that chunk's transitive import graph and gets isolated along with the boundary.
The annotator handles registration automatically for route-shaped dynamic imports.

What the system does not protect:

- **Inline JSX elements** under a protected path (e.g. `{path: "/admin", element: <Admin />}` with
  `Admin` statically imported at the top of the config). No dynamic import, no chunk boundary, no
  isolation. `assertProtectedPatternsCovered` catches this.
- **Raw inline OpenAPI** (`type: "raw"`) — inlined into the main bundle by definition. Same failure
  mode.
- **Dynamically-generated route paths** the annotator can't statically resolve. Plugin authors can
  call `registerProtectedScope` manually to fix this.

## Dev mode

Dev mode skips the chunk-splitting pipeline entirely — Vite serves on-demand-transformed modules
over HTTP. Bundle-level gating is absent; only the runtime `RouteGuard` applies. Protected-chunk
gating must be verified against a production SSR build.

## Related code paths

- `vite/config.ts` — `getViteConfig`, `isProtectedChunk`, `renderBuiltUrl`
- `vite/build.ts` — orchestrates the build, calls the assertions and `moveProtectedChunks`
- `vite/protected/registry.ts` — scope registry + matcher
- `vite/protected/annotator.ts` — AST-based auto-registration
- `vite/protected/build.ts` — assertions, `moveProtectedChunks`
- `app/protectChunks.ts` — runtime auth check for `/_protected/*` requests in Node/Lambda/Vercel
- `app/adapters/*` — per-adapter wiring of `protectChunks`
- `lib/manifest.ts` — `PROTECTED_CHUNK_DIR` constant (single source of truth: `_protected`)
