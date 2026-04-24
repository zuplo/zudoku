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
  protected chunk reached through static edges fails the build. Dynamic edges are skipped (they're
  how route-split lazy loads reach gated content).
- `assertAllPatternsMatched(config)` — throws if any `protectedRoutes` pattern has no registered
  content. Catches typos and dynamically-generated routes that would ship unprotected.
- `moveProtectedChunks(clientOut, serverOut)` — physically moves `_protected/` out of the
  publicly-served client output into the server bundle.

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

`app/protectedAssets.ts` is the Hono middleware that gates `_protected/*` chunk requests behind a
cookie-presence check. Prefix is composed via `joinUrl(basePath, "/_protected")` so subpath
deployments match correctly. This is **cookie-presence only**, matching the SSR HTML gate — chunks
contain no secrets beyond what the SSR origin already serves.

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
