---
title: Protected Routes
sidebar_icon: squares-subtract
description:
  Learn how to protect specific routes in your documentation using authentication, including simple
  array patterns, advanced authorization with reason codes, and custom callback functions.
---

You can protect specific routes in your documentation by adding the `protectedRoutes` property to
your [Zudoku configuration](./overview.md). This requires [authentication](./authentication.md) to
be configured. The property supports two formats: a simple array of path patterns, or an advanced
object format with custom authorization logic.

## Array Format

The simplest way to protect routes is to provide an array of path patterns. Users must be
authenticated to access these routes.

```typescript title="zudoku.config.ts"
{
  // ...
  protectedRoutes: [
    "/admin/*",     // Protect all routes under /admin
    "/settings",    // Protect the settings page
    "/api/*",       // Protect all API-related routes
    "/private/:id"  // Protect dynamic routes with parameters
  ],
  // ...
}
```

When a user tries to access a protected route, a login dialog will appear prompting them to sign in
or register. After logging in, they are automatically redirected back to the route they were trying
to access.

## Object Format

For more complex authorization logic, you can provide a record mapping route patterns to custom
callback functions:

```typescript title="zudoku.config.ts"
{
  // ...
  protectedRoutes: {
    // Only allow authenticated users with admin role
    "/admin/*": ({ auth }) =>
      auth.isAuthenticated && auth.user?.role === "admin",

    // Check if user has enterprise access
    "/api/enterprise/*": ({ auth }) =>
      auth.isAuthenticated && auth.user?.subscription === "enterprise",

    // Allow access to beta features based on user attributes
    "/beta/*": ({ auth }) =>
      auth.isAuthenticated && auth.user?.betaAccess === true,
  },
  // ...
}
```

### Callback Parameters

The callback function receives an object with:

- `auth` - The current authentication state, including `isAuthenticated`, `isPending`, `profile`,
  and more
- `context` - The Zudoku context providing access to configuration and utilities
- `reasonCode` - An object containing the reason code constants `UNAUTHORIZED` and `FORBIDDEN` (see
  [Reason Codes](#reason-codes))

### Return Values

The callback can return a `boolean` or a reason code string:

| Return value              | Behavior                                          |
| ------------------------- | ------------------------------------------------- |
| `true`                    | Allow access to the route                         |
| `false`                   | Treated as `UNAUTHORIZED` - prompts login         |
| `reasonCode.UNAUTHORIZED` | Show a login dialog prompting the user to sign in |
| `reasonCode.FORBIDDEN`    | Show a 403 "Access Denied" page                   |

## Reason Codes

Reason codes allow you to distinguish between users who need to sign in and users who are signed in
but lack permission. This is useful for building role-based or attribute-based access control.

- **`UNAUTHORIZED`** - The user is not authenticated. A login dialog is shown, and navigation to the
  route is blocked until the user signs in.
- **`FORBIDDEN`** - The user is authenticated but does not have permission. A 403 "Access Denied"
  page is displayed instead of the route content.

```typescript title="zudoku.config.ts"
{
  // ...
  protectedRoutes: {
    // Members-only page: unauthenticated users see a login prompt
    "/only-members": ({ auth, reasonCode }) =>
      auth.isAuthenticated ? true : reasonCode.UNAUTHORIZED,

    // VIP page: unauthenticated users see a login prompt,
    // authenticated users without permission see "Access Denied"
    "/vip-lounge": ({ auth, reasonCode }) =>
      !auth.isAuthenticated
        ? reasonCode.UNAUTHORIZED
        : auth.profile?.email?.endsWith("@example.com")
          ? true
          : reasonCode.FORBIDDEN,
  },
  // ...
}
```

## Navigation Blocking

When a user navigates to a route that returns `false` or `UNAUTHORIZED`, navigation is intercepted
before the page changes. The user stays on the current page while a login dialog is displayed. If
the user cancels, they remain on the current page. If they log in successfully, navigation
automatically proceeds to the protected route.

Routes that return `FORBIDDEN` do not block navigation — the user navigates to the route and sees
the "Access Denied" page.

## Path Patterns

The path patterns follow the same syntax as [React Router](https://reactrouter.com):

- `:param` matches a URL segment up to the next `/`, `?`, or `#`
- `*` matches zero or more characters up to the next `/`, `?`, or `#`
- `/*` matches all characters after the pattern

For example:

- `/users/:id` matches `/users/123` or `/users/abc`
- `/docs/*` matches `/docs/getting-started` or `/docs/api/reference`
- `/settings` matches only the exact path `/settings`

## Next Steps

- Learn about [authentication providers](./authentication.md#authentication-providers) supported by
  Zudoku
- Configure [user data](./authentication.md#user-data) display
