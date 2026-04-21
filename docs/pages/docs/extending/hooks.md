---
title: Hooks
sidebar_icon: webhook
description: Reference for the React hooks exported by Zudoku.
---

Zudoku exposes a set of React hooks that let you read and interact with the runtime state of your
site from custom components, MDX pages, plugins, and [slots](../configuration/slots.mdx). All hooks
are available from the `zudoku/hooks` entry point.

```typescript
import {
  useAuth,
  useVerifiedEmail,
  useRefreshUserProfile,
  useZudoku,
  useCache,
  useEvent,
  useExposedProps,
  useTheme,
  useMDXComponents,
} from "zudoku/hooks";
```

## `useAuth`

The `useAuth` hook is the primary way to interact with authentication in Zudoku. It returns the
current auth state along with the actions needed to sign users in and out. It works with any of the
supported [authentication providers](../configuration/authentication.md).

```typescript
import { useAuth } from "zudoku/hooks";

const { isAuthEnabled, isAuthenticated, isPending, profile, login, logout, signup } = useAuth();
```

### Returned values

| Property          | Type                                             | Description                                                                                                                            |
| ----------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `isAuthEnabled`   | `boolean`                                        | `true` if an `authentication` provider is configured in `zudoku.config.ts`. When `false`, the action methods will throw if called.     |
| `isAuthenticated` | `boolean`                                        | Whether a user is currently signed in.                                                                                                 |
| `isPending`       | `boolean`                                        | `true` while the provider is still initializing or restoring a session. Use this to render loading states and avoid flashing UI.       |
| `profile`         | `UserProfile \| null`                            | The authenticated user's profile, or `null` when signed out. See [User profile](#user-profile).                                        |
| `providerData`    | `ProviderData \| null`                           | Raw provider-specific data (for example the Supabase session or Firebase user). Useful when you need access to provider-only features. |
| `login`           | `(options?: AuthActionOptions) => Promise<void>` | Starts the sign-in flow. Redirects back to the current page by default.                                                                |
| `logout`          | `() => Promise<void>`                            | Signs the user out.                                                                                                                    |
| `signup`          | `(options?: AuthActionOptions) => Promise<void>` | Starts the sign-up flow, if the provider supports it. Redirects back to the current page by default.                                   |

`AuthActionOptions` accepts:

```typescript
type AuthActionOptions = {
  /** URL to redirect to after the action completes. Defaults to the current page. */
  redirectTo?: string;
  /** Replace the current history entry instead of pushing a new one. */
  replace?: boolean;
};
```

### User profile

When `isAuthenticated` is `true`, `profile` is populated with the fields returned by the provider's
user info endpoint:

```typescript
type UserProfile = {
  sub: string;
  email: string | undefined;
  emailVerified: boolean;
  name: string | undefined;
  pictureUrl: string | undefined;
  // Any additional claims returned by the provider
  [key: string]: string | boolean | undefined;
};
```

### Example: sign-in button

```tsx
import { useAuth } from "zudoku/hooks";
import { Button } from "zudoku/ui/Button.js";

export const AuthButton = () => {
  const { isAuthenticated, isPending, profile, login, logout } = useAuth();

  if (isPending) {
    return <Button disabled>Loading…</Button>;
  }

  if (!isAuthenticated) {
    return <Button onClick={() => login()}>Sign in</Button>;
  }

  return (
    <div className="flex items-center gap-2">
      <span>Hi, {profile?.name ?? profile?.email}</span>
      <Button onClick={() => logout()}>Sign out</Button>
    </div>
  );
};
```

### Example: gating content

```tsx
import { useAuth } from "zudoku/hooks";

export const PremiumContent = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isPending, login } = useAuth();

  if (isPending) return null;

  if (!isAuthenticated) {
    return (
      <button type="button" onClick={() => login({ redirectTo: window.location.href })}>
        Sign in to view this content
      </button>
    );
  }

  return <>{children}</>;
};
```

For route-level gating, prefer the declarative
[protected routes](../configuration/protected-routes.md) configuration.

## `useVerifiedEmail`

Returns the current user's email verification state and exposes helpers to refresh it or request a
new verification email. Use this in components that show verification banners or block actions until
the user has verified their address.

```typescript
import { useVerifiedEmail } from "zudoku/hooks";

const { email, isVerified, supportsEmailVerification, refresh, requestEmailVerification } =
  useVerifiedEmail();
```

| Property                    | Type                                             | Description                                                                                  |
| --------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `email`                     | `string \| undefined`                            | The user's email address, if any.                                                            |
| `isVerified`                | `boolean`                                        | Whether the provider reports the email as verified.                                          |
| `supportsEmailVerification` | `boolean`                                        | `true` when the provider implements a `requestEmailVerification` method.                     |
| `refresh`                   | `() => void`                                     | Re-fetch the user profile from the provider — useful after the user verifies in another tab. |
| `requestEmailVerification`  | `(options?: AuthActionOptions) => Promise<void>` | Triggers the provider's "resend verification email" flow.                                    |

The hook automatically refreshes the profile when the window regains focus so `isVerified` updates
after the user completes verification elsewhere.

## `useRefreshUserProfile`

Low-level hook that re-fetches the authenticated user's profile from the configured provider. Most
applications do not need to call this directly — `useAuth` already invokes it, and
`useVerifiedEmail` exposes a more ergonomic `refresh()`. Reach for it when you need fine-grained
control over the underlying React Query.

```typescript
import { useRefreshUserProfile } from "zudoku/hooks";

const { refetch, isFetching } = useRefreshUserProfile({ refetchOnWindowFocus: "always" });
```

It returns the full
[React Query `UseQueryResult`](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery).

## `useZudoku`

Returns the global [`ZudokuContext`](../custom-plugins.md) — the object that holds navigation, auth,
plugins, the React Query client, and user-configured options. Use it when you need access to app
configuration that isn't exposed by a more specific hook.

```typescript
import { useZudoku } from "zudoku/hooks";

const { options, navigation, queryClient, addEventListener, emitEvent } = useZudoku();
```

Must be called inside the `ZudokuProvider` (i.e. inside any Zudoku page or slot). Calling it outside
throws.

## `useEvent`

Subscribes to Zudoku events (such as navigation or authentication changes) with automatic cleanup.
See the [Events](./events.md) page for the full guide and the list of available events.

```typescript
import { useEvent } from "zudoku/hooks";

// Access the latest event payload
const locationEvent = useEvent("location");

// Or transform the payload
const pathname = useEvent("location", ({ to }) => to.pathname);

// Or run a side effect only
useEvent("auth", ({ prev, next }) => {
  if (!prev.isAuthenticated && next.isAuthenticated) {
    trackSignIn(next.profile);
  }
});
```

## `useExposedProps`

Convenience wrapper around React Router's hooks. Returns the props Zudoku passes to `custom-page`
navigation entries, so you get the same shape whether you're writing a page component or a slot.

```typescript
import { useExposedProps } from "zudoku/hooks";

const { location, navigate, params, searchParams, setSearchParams } = useExposedProps();
```

## `useCache`

Invalidates Zudoku's internal React Query caches. Today this supports `API_IDENTITIES`, which is
useful when you change something that affects the identities available to the API playground (for
example after a user creates a new API key).

```typescript
import { useCache } from "zudoku/hooks";

const { invalidateCache } = useCache();

await invalidateCache("API_IDENTITIES");
```

## Re-exported hooks

For convenience, Zudoku re-exports two hooks from its underlying libraries:

- `useTheme` from [`next-themes`](https://github.com/pacocoursey/next-themes#usetheme) — read or
  change the active color scheme (`light`, `dark`, or `system`).
- `useMDXComponents` from [`@mdx-js/react`](https://mdxjs.com/packages/react/) — access the MDX
  component mapping when rendering MDX content inside a custom component.

```typescript
import { useMDXComponents, useTheme } from "zudoku/hooks";
```
