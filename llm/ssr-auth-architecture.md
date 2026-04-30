# SSR auth: token storage & cookie lifecycle

This document explains where auth secrets (access / refresh tokens) live at runtime and why the
answer differs between the SSR and SSG deployment modes. Audience: contributors touching
`packages/zudoku/src/lib/authentication/*`.

## Deployment modes

Zudoku supports two runtime shapes:

| Mode | Runtime server                   | Cookie endpoint `/__z/auth/session`                               | First paint auth state                  |
| ---- | -------------------------------- | ----------------------------------------------------------------- | --------------------------------------- |
| SSR  | Yes (Node / Vercel / Cloudflare) | Available                                                         | Server-rendered from cookies            |
| SSG  | No (static hosting)              | Absent (server bundle deleted after prerender in `vite/build.ts`) | Client-only, hydrated from localStorage |

The mode is selected at build time: `zudoku build --ssr` keeps the server bundle; plain
`zudoku build` prerenders and drops the server bundle.

The client detects the mode at runtime via `window.ZUDOKU_SSR_AUTH`: the SSR server injects this
object (even with `profile: null`) whenever auth is configured; SSG never injects it.

## Token storage

There are up to three places a token can live in the browser:

1. **httpOnly cookies** set by `/__z/auth/session` after the server calls
   `provider.verifyAccessToken()`. Cookies: `zudoku-access-token`, `zudoku-refresh-token`,
   `zudoku-auth-profile`. JS cannot read them. Lifetime is bounded by the verifier's `expiresAt` /
   `refreshExpiresAt`.
2. **Zustand `auth-state` in `localStorage`** (SSG mode only), persisted via `zustand/middleware`'s
   `persist`. The full store shape includes `providerData`, which each built-in provider stuffs the
   current access / refresh tokens into so `cookie-sync` can POST them. In SSR mode the storage is a
   no-op (see below), so nothing lands in `localStorage`.
3. **Provider SDK storage** (out of Zudoku's direct control):
   - `supabase-js`: `persistSession: true` writes `sb-<project>-auth-token` to `localStorage`.
   - `@azure/msal-browser` (Azure B2C): `cacheLocation: "sessionStorage"`.
   - `@clerk/clerk-js`: its own `__session` cookie + internal caches.
   - `openid`: no SDK storage; relies on zustand persist and sessionStorage for the PKCE handshake
     only (code verifier / state), not tokens.

## Why tokens in `localStorage` is a problem (but not a catastrophe)

`localStorage` is readable by any JavaScript executing on the origin — a single successful XSS
exfiltrates the session. The httpOnly cookie is immune to this. When both exist, the cookie does not
compensate for the storage exposure: an attacker with JS execution reads the refresh token from
`localStorage` and keeps minting new access tokens off-origin.

## The mode-aware split

SSR has a cookie fallback; SSG does not. The zustand store swaps its storage backend based on the
SSR signal:

```ts
// packages/zudoku/src/lib/authentication/state.ts
const ssrMode = ssrAuthInitial !== undefined;

persist(
  /* store */,
  {
    name: "auth-state",
    storage: createJSONStorage(() =>
      typeof window === "undefined" || ssrMode ? noopStorage : localStorage,
    ),
  },
);
```

In SSR mode the storage is a no-op: nothing is read, nothing is written. The httpOnly cookie is the
durable store and `providerData` exists only in memory for the current tab. In SSG mode the full
store (including `providerData`) is persisted to `localStorage`, because there's no server to
recover tokens from on reload. Weaker posture but the only option in a pure-static deployment.

### Reload behavior (SSR mode)

1. Browser requests page. Server reads cookies via `parseCookies`, calls `configuredAuthProvider` as
   needed, injects `window.ZUDOKU_SSR_AUTH = { profile }` into the HTML.
2. Client boots. `state.ts` seeds `isAuthenticated` / `profile` directly from `ZUDOKU_SSR_AUTH`. The
   `persist` middleware runs against `noopStorage`, so nothing rehydrates. `providerData` is `null`.
3. Provider SDK initializes. On detecting a live session (from its own storage or silent-refresh
   against the IdP) it calls `setLoggedIn` with a freshly populated `providerData`.
4. `cookie-sync`'s zustand subscriber fires. It POSTs the new `{ accessToken, refreshToken }` to
   `/__z/auth/session`. The server re-verifies, re-writes the cookie with an updated `maxAge`.
5. User-initiated SSR navigations see the refreshed cookie on the next request.

### Reload behavior (SSG mode)

1. Browser requests prerendered HTML. No server; no cookie is read. `ZUDOKU_SSR_AUTH` is not
   injected.
2. Client boots. `state.ts` hydrates full state (including `providerData`) from `localStorage` —
   this is the continuity mechanism.
3. `cookie-sync` is still wired up but all its POSTs fail harmlessly (no server). The provider SDK
   drives refresh against the IdP directly using the persisted tokens.

## `cookie-sync` contract (both modes)

`setupCookieSync(store)` subscribes to the zustand store:

- `isAuthenticated` false → true with `providerData.accessToken`: POST `/__z/auth/session`.
- `providerData` reference changes while authed: POST (treated as rotation).
- `isAuthenticated` true → false: DELETE `/__z/auth/session`.
- Initial rehydrate: POST only if persisted state is authed AND `window.ZUDOKU_SSR_AUTH?.profile` is
  falsy (i.e. SSR didn't see a cookie, so we're pushing up).

In SSR mode the rehydrate path never fires at all — `noopStorage` means there's no persisted state
to rehydrate from. The SDK's subsequent `setLoggedIn` drives the POST instead.

### Server-side CSRF check

`session-handler.ts` rejects POST/DELETE that don't look same-origin. The check prefers the
browser's `Sec-Fetch-Site` header (a forbidden header that JS can't forge) and falls back to an
`Origin`/`Host` host comparison if missing. The fallback breaks under any proxy/CDN that rewrites
`Host` (CloudFront's `AllViewerExceptHostHeader` policy, for example), so the Sec-Fetch-Site path is
what makes the endpoint work behind a CDN.

## Protected routes: chunk-level gating

Distinct but related concern: `protectedRoutes` in user config gates access at the **bundle** level,
not just at render time. In SSR mode, the JS chunks containing content for protected routes are
physically separated from the public bundle and served only after a cookie check.

### Registry + annotator (build time)

`vite/protected/registry.ts` holds a module-scoped `Map<moduleId, ModuleScope[]>` where a
`ModuleScope` is either an exact route (`{type: "route", path}`) or a subtree
(`{type: "subtree", root}`). Populated two ways:

1. **Annotator** (`vite/protected/annotator.ts`) — a Vite `transform` plugin that AST-scans every
   first-party module. Two shapes are auto-detected:
   - Shape A: any `ObjectExpression` with a string `path` property; every nested dynamic `import()`
     registers as a subtree rooted at that path. Covers React Router route objects and plugin-api's
     `openApiPlugin({path, schemaImports})`.
   - Shape B: a dict whose keys are path-like strings (`/foo`, no dot) mapped to `() => import(...)`
     arrows. Covers plugin-docs's `fileImports` output.
2. **Direct calls** to `registerProtectedScope(moduleId, scope)` from any plugin whose code
   generation doesn't match either shape. No first-party plugin currently needs this.

`getProtectedSourceMatcher(config)` returns a predicate `(moduleId) => boolean` that consults the
registry and intersects scopes with the user's `protectedRoutes` patterns via `scopeMatchesPattern`.
Route scopes match exactly; subtree scopes match at or below the root.

### Chunk routing + output (build time)

`vite/config.ts` uses the matcher in Rolldown's `manualChunks`: modules classified protected land in
`protected-<name>` chunks; `chunkFileNames` routes those to a `_protected/` directory.
`renderBuiltUrl` blocks CDN rewriting for `_protected/*` so they always resolve through the SSR
origin.

After the client build, `vite/build.ts` runs three guards in `vite/protected/build.ts`:

- `assertNoProtectedLeaks(output)` — walks static import edges from every public entry chunk; a
  protected chunk reached through static edges fails the build. Also fails if any chunk under
  `_protected/` is itself an entry, since entries are loaded outside the gated import path. Dynamic
  edges are skipped (they're how route-split lazy loads reach gated content).
- `warnUnmatchedProtectedPatterns(config)` — warns (does not fail the build) if any
  `protectedRoutes` pattern has no registered content. Usually a typo or a route served by an inline
  element / dynamic path. RouteGuard still blocks rendering, but the JS won't be gated.
- `moveProtectedChunks(clientOut, serverOut)` — physically moves `_protected/` out of the
  publicly-served client output into the server bundle. After moving, asserts the source dir is
  empty; a partial rename failure (e.g. EXDEV across filesystems) fails the build instead of
  silently shipping leftovers publicly.

### Adapter coverage

`/_protected/*` gating only works on the `lambda` and `node` SSR adapters today. The build fails
fast if `protectedRoutes` is configured with `cloudflare` or `vercel` as the adapter. The Cloudflare
Workers and Vercel Edge runtimes don't have a filesystem-style static server compatible with the
current `protectedAssets` middleware, and putting the chunks in their public asset bindings would
defeat the gate. Adapter-specific gating is follow-up work.

### Client-side: `wrapProtectedRoutes` (runtime)

`app/wrapProtectedRoutes.ts` runs once during router assembly in `main.tsx`. If — and only if — the
user is currently unauthenticated AND the current URL matches a protected pattern, it walks the
route tree and replaces every `lazy` with a no-op `async () => ({ element: null })`. On the server,
or in any other state, it's identity.

Why: React Router calls `lazy()` during route matching regardless of what parents render. A
rejection during initial hydration leaves React in a partially-hydrated state — the SSR DOM renders
but event handlers never attach. Short-circuiting lazy prevents the fetch, so `RouteGuard` can
render its sign-in prompt with full interactivity.

### Server-side middleware: `protectedAssets`

`app/protectedAssets.ts` is the Hono middleware that gates `_protected/*` chunk requests. Prefix is
composed via `joinUrl(basePath, "/_protected")` so subpath deployments match correctly. The cookie
is verified via the configured auth provider's `verifyAccessToken` (same as `session-handler.ts`
during cookie issuance) so a forged cookie value can't bypass the gate. Verifier failures fail
closed. 401 responses set `Cache-Control: private, no-store` and `Vary: Cookie` so a CDN can't cache
the rejection against the URL-without-cookie.

The SSR HTML render path also calls `verifyAccessToken` in `entry.server.tsx` before treating the
profile cookie as authoritative — a stale or forged profile cookie won't produce an authenticated
HTML render.

### Pattern matching semantics

`protectedRoutes` patterns use react-router `matchPath` semantics consistently across build, runtime
route gating (`wrapProtectedRoutes`), and `RouteGuard`:

- Bare patterns match exactly: `protectedRoutes: ["/admin"]` gates `/admin` but not `/admin/users`.
- To gate descendants, use a glob: `protectedRoutes: ["/admin/*"]` gates `/admin` and everything
  under it.

This applies to subtree scopes (modules registered as covering an entire subtree, e.g. the openapi
plugin's catalog routes) too: a bare pattern matching the subtree root only gates the root path; a
glob pattern is required to gate descendants.

### Cookie size and body limits

- Each cookie value (access token, refresh token, profile JSON) is capped at 3.9 KB to stay below
  the 4 KB browser cookie limit. Oversized values return 413.
- `/__z/auth/session` POST bodies are capped at 64 KB.
- The session cookie's `maxAge` is also capped at 1 hour, regardless of what the verifier returns in
  `expiresAt`. Long-lived tokens get refreshed via `cookie-sync` on subsequent client-side events.
  This is defense-in-depth against stolen cookies.

### Plugin author contract

The annotator at `vite/protected/annotator.ts` auto-registers protected scopes for two route shapes:

- ObjectExpression with a string-literal `path` property and a nested dynamic `import()`. Covers
  React Router route objects and `openApiPlugin({ path, schemaImports })`.
- A dict literal whose keys are path-like strings (`/foo`, no dot) mapped to `() => import(...)`
  arrows. Covers plugin-docs's `fileImports` output.

Shapes the annotator does NOT detect:

- Template-literal paths (``{ path: `/admin/${section}`, lazy }``)
- Variable-bound paths (`{ path: ADMIN, lazy }` where `ADMIN` is a const)
- Object spreads (`{ path: "/admin", ...rest }` with `lazy` in `rest`)
- Async function bodies (`async () => import(...)`)
- JSX-style `createElement("Route", { path, lazy })`

A plugin author whose code generation doesn't match either supported shape must call
`registerProtectedScope(moduleId, scope)` directly so the registry knows the module is gateable. If
the annotator's parse fails on a module, the registry is left empty for that module and the gating
won't apply. The build emits a warning in that case.

### Sign-in UI surfaces

Three components render the sign-in prompt depending on entry point:

- `SignInRequiredPage` (exported from `RouteGuard.tsx`) — inline prompt rendered by RouteGuard when
  the user is unauth on a protected path. Uses `<Layout>`, not a Dialog portal, so SSR HTML contains
  visible content.
- `LoginDialog` — modal shown only for **client-side navigation** into a protected route (via
  RouteGuard's `useBlocker`). Keeps the current route visible underneath while the user decides.
- `RouterError`'s `useSignInPromptIfProtectedUnauth` safety net — renders `SignInRequiredPage` when
  a lazy rejection trips `errorElement` post-hydration (session expiry mid-nav, etc.). Uses
  `matchPath({end: false})` so it catches descendants of configured patterns.

## Known residual exposure

Provider SDK storage (supabase localStorage, MSAL sessionStorage) is not yet stripped. Closing that
gap requires either:

1. Running the OAuth code-exchange server-side (pure BFF) so the browser never sees a refresh token.
   Constrained by which providers' SDKs permit it (openid/Auth0 possible; MSAL/Clerk resist).
2. Configuring each SDK to use in-memory storage only and proxying refresh through the server via
   the httpOnly cookie. This forces a full re-login on any tab refresh that happens before the SDK's
   silent-refresh window, which is a UX regression.

Both are out of scope for this PR. The change here closes the duplicate copy that Zudoku itself
introduced (`providerData` in zustand persist) while leaving provider SDK storage untouched.

## File map

### Authentication (token lifecycle)

| File                 | Role                                                |
| -------------------- | --------------------------------------------------- |
| `authentication.ts`  | `verifyAccessToken` plugin contract                 |
| `session-handler.ts` | `/__z/auth/session` POST/DELETE Hono sub-app        |
| `cookie-sync.ts`     | Client → server mirror of token state               |
| `state.ts`           | Zustand store + mode-aware `partialize`             |
| `hook.ts`            | `useAuth`; SSR override via `RenderContext.ssrAuth` |
| `providers/*.tsx`    | Per-provider `verifyAccessToken` implementations    |

### Protected routes (chunk-level gating)

| File                          | Role                                                                 |
| ----------------------------- | -------------------------------------------------------------------- |
| `vite/protected/registry.ts`  | Scope map + matcher + `PROTECTED_CHUNK_DIR`                          |
| `vite/protected/annotator.ts` | AST-based auto-registration of route-shaped dynamic imports          |
| `vite/protected/build.ts`     | `assertNoProtectedLeaks`, `assertAllPatternsMatched`, chunk movement |
| `app/wrapProtectedRoutes.ts`  | Client-side short-circuit of `lazy()` for unauth on protected paths  |
| `app/protectedAssets.ts`      | Hono middleware gating `_protected/*` chunk requests                 |
| `lib/core/RouteGuard.tsx`     | Runtime auth guard + `SignInRequiredPage` + `LoginDialog`            |
| `lib/errors/RouterError.tsx`  | `errorElement` safety net: sign-in prompt on lazy rejection          |
