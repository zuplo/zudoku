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
2. **Zustand `auth-state` in `localStorage`**, persisted via `zustand/middleware`'s `persist`. The
   full store shape includes `providerData`, which each built-in provider stuffs the current access
   / refresh tokens into so that `cookie-sync` can POST them.
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

Since SSR has a cookie fallback but SSG does not, the persisted zustand shape differs between modes:

```ts
// packages/zudoku/src/lib/authentication/state.ts
const partialize = (state: AuthState) =>
  ssrAuthInitial !== undefined
    ? // SSR: don't write tokens to localStorage. The httpOnly cookie is
      // the durable store; `providerData` stays only in memory.
      { isAuthenticated: state.isAuthenticated, profile: state.profile }
    : // SSG: persist full state including `providerData`. Without a server
      // there is no cookie to recover tokens on reload, so localStorage is
      // the only continuity store. Weaker posture but the only option in
      // a pure-static deployment.
      state;
```

### Reload behavior (SSR mode)

1. Browser requests page. Server reads cookies via `parseCookies`, calls `configuredAuthProvider` as
   needed, injects `window.ZUDOKU_SSR_AUTH = { profile }` into the HTML.
2. Client boots. `state.ts` seeds `isAuthenticated` / `profile` from `ZUDOKU_SSR_AUTH`.
   `providerData` is `null` — the persisted snapshot doesn't carry it.
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

In SSR mode the rehydrate post rarely fires — `providerData` isn't persisted, so `readTokens`
returns `{}` and `postSession` early-returns. The SDK's subsequent `setLoggedIn` carries the tokens
instead.

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

| File                 | Role                                                |
| -------------------- | --------------------------------------------------- |
| `authentication.ts`  | `verifyAccessToken` plugin contract                 |
| `session-handler.ts` | `/__z/auth/session` POST/DELETE Hono sub-app        |
| `cookie-sync.ts`     | Client → server mirror of token state               |
| `state.ts`           | Zustand store + mode-aware `partialize`             |
| `hook.ts`            | `useAuth`; SSR override via `RenderContext.ssrAuth` |
| `providers/*.tsx`    | Per-provider `verifyAccessToken` implementations    |
