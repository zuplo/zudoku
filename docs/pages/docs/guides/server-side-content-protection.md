---
title: Server-side Content Protection
sidebar_icon: shield-check
description:
  How Zudoku isolates protected-route content at build time in SSR mode. Covers the auto-detection
  rules, caveats for dynamic routes and inline content, and a pre-ship checklist.
---

When you run Zudoku in SSR mode, [`protectedRoutes`](../configuration/protected-routes.md) is
enforced beyond the runtime login dialog. The JavaScript chunks containing content for protected
routes are physically separated from the public bundle and served only through an auth-gated
endpoint. Unauthenticated users cannot fetch them even if they know the URL.

## Why this exists

In a typical SPA build, every page's JavaScript is code-split into a chunk in `/assets/`. Any
browser can fetch any chunk URL. A runtime `RouteGuard` can block _rendering_ a protected page, but
the code itself is still downloadable.

In SSR mode, the build additionally:

1. Classifies each code-split chunk as public or protected based on which routes it serves.
2. Moves protected chunks from the public output into the server bundle, so they're no longer served
   as plain static files.
3. Registers an auth-gated route at `/_protected/*` on the SSR adapter that requires a valid session
   cookie.

A request to a protected chunk URL without a session returns `401 Unauthorized`. Combined with
`RouteGuard` on render, protected content stays on the server.

## How classification works

At build time, a Vite transform AST-scans your code for route-shaped dynamic imports and records
`{moduleId → subtree root}` entries in a registry. Two shapes are auto-detected.

### Shape A: object literal with `path`

Any object literal with a string `path` property. Every dynamic `import()` inside the object's other
property values is registered as subtree-scoped at that path.

```ts
// Standard React Router route
{ path: "/admin", lazy: () => import("./AdminPage") }

// Also matches plugin-api's generated code
openApiPlugin({
  path: "/my-api",
  schemaImports: {
    "...processed/file.js": () => import("...processed/file.js?d=..."),
  },
});
```

### Shape B: dict keyed by route path

An object whose keys are route-path strings (start with `/`, contain no `.`) mapping to arrow
functions that call `import()`.

```ts
const fileImports = {
  "/docs/intro": () => import("./intro.mdx"),
  "/docs/guides": () => import("./guides.mdx"),
};
```

The dot guard keeps file-path dicts (like `{"/abs/path/x.js": ...}`) from being mistaken for route
dicts.

### From registry to chunking

1. The annotator transform scans every first-party module and populates the registry.
2. Rolldown's `manualChunks` callback consults the registry for each module. If any registered
   subtree for that module intersects a `protectedRoutes` pattern, the module goes into a
   `protected-*` chunk.
3. After bundling, protected chunks are renamed into a `_protected/` directory and moved from the
   client output to the server output.
4. A static-reachability assertion fails the build if any public chunk statically imports a
   protected chunk (which would eagerly pull gated code into the public bundle).

## What's covered out of the box

| Content source                   | Shape                         | Auto-detected? |
| -------------------------------- | ----------------------------- | -------------- |
| MDX docs (`plugin-docs`)         | Shape B (route dict)          | ✅             |
| File OpenAPI (`plugin-api`)      | Shape A (via `openApiPlugin`) | ✅             |
| User custom pages with `lazy`    | Shape A (`{path, lazy}`)      | ✅             |
| User custom pages with `element` | Not code-split                | ❌ (see below) |
| URL-based OpenAPI (`type: url`)  | Fetched at runtime            | ❌ (see below) |
| Raw inline OpenAPI (`type: raw`) | Inlined in main bundle        | ❌ (see below) |

## Caveats

### Dynamic route paths

The annotator only recognizes string literals. Configs that generate routes with computed paths are
not detected:

```ts
// Not detected: path and specifier are template literals.
navigation: items.map((i) => ({
  type: "custom-page",
  path: `/foo/${i.slug}`,
  lazy: () => import(`./Foo-${i.slug}`),
}));
```

**Fix:** nest the dynamic entries under a static-path ancestor so the outer Shape A match catches
them:

```ts
{
  type: "category",
  path: "/foo",
  items: items.map((i) => ({
    type: "custom-page",
    path: i.slug,
    lazy: () => import(`./Foo-${i.slug}`),
  })),
}
```

The outer `{path: "/foo", ...}` registers every nested dynamic import as subtree-scoped at `/foo`,
so `protectedRoutes: ["/foo/*"]` covers them all. Alternatively, write the entries out with literal
paths.

### Inline JSX custom pages

Writing

```ts
{ type: "custom-page", path: "/secret", element: <Secret /> }
```

ships `<Secret />` directly in the main bundle. There's no chunk to gate and no URL to block; the
runtime `RouteGuard` prevents rendering but the JavaScript is already on the user's machine.

**Fix:** switch to `lazy`:

```ts
{ type: "custom-page", path: "/secret", lazy: () => import("./Secret") }
```

### URL-based OpenAPI specs

`{ type: "url", input: "https://example.com/api.yaml" }` fetches at runtime from whatever origin you
configure. Auth is your responsibility on that origin. Zudoku cannot gate a URL it does not serve.

### Raw inline OpenAPI specs

`{ type: "raw", input: {...} }` embeds the spec as a JS object literal in the bundle. Same situation
as inline custom pages: no chunk, no way to gate at the bundle level.

### Third-party and custom plugins

If a plugin emits code-split routes in neither Shape A nor Shape B, its chunks aren't detected. Two
options:

1. Have the plugin emit a detectable shape. Usually the easiest: wrap the generated routes in an
   object with a string `path`.
2. Register directly. Plugins can call
   `registerProtectedScope(moduleId, {type: "subtree", root: "/your-path"})` from their Vite `load`
   hook.

## The build-end warning

If a `protectedRoutes` pattern has no registered content, the build logs:

```
[zudoku] protectedRoutes patterns with no matching content: "/admin/*".
  Either the pattern is a typo, or the content is generated dynamically without a
  registerProtectedScope call. Dynamic routes ship unprotected; chunks would be
  fetchable without auth.
```

This does not fail the build. Three things to check:

1. **Typo.** Does the pattern match any real route?
2. **Dynamic content.** Computed paths? Apply the nested-subtree fix above.
3. **Inline content.** Is the route served by an inline JSX element or a raw spec? It cannot be
   gated at the bundle level; move the content into a code-split module.

If none of those apply and you're sure the content should be detected, file an issue with a minimal
reproduction.

## Dev mode and SSG

**Dev mode** doesn't chunk-split the same way as production, so the bundle-level gating is absent.
Only the runtime `RouteGuard` applies. Use a production SSR build to verify gating.

**SSG builds** have no server. `protectedRoutes` in SSG falls back to client-side enforcement only:
`RouteGuard` blocks rendering, but chunks remain publicly fetchable. If content must stay
server-side, use an SSR adapter.

## Pre-ship checklist

- [ ] No build warnings about unmatched `protectedRoutes` patterns.
- [ ] Any custom pages meant to be protected use `lazy: () => import(...)`, not `element`.
- [ ] Any dynamically-generated protected routes are nested under a static-path ancestor.
- [ ] URL-based and raw inline OpenAPI specs have their own access control at their origin.
- [ ] Visit a protected chunk URL directly in an unauthenticated browser (grab one from DevTools)
      and confirm you get `401 Unauthorized`.

## Related

- [Protected Routes](../configuration/protected-routes.md): the `protectedRoutes` config API.
- [Authentication](../configuration/authentication.md): wiring up an auth provider so sessions
  exist.
