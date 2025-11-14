---
title: Protected Routes
sidebar_icon: squares-subtract
description:
  Learn how to protect specific routes in your documentation using authentication, including simple
  array patterns and advanced authorization logic with custom callback functions.
---

You can protect specific routes in your documentation by adding the `protectedRoutes` property to
your [Zudoku configuration](./overview.md). This property supports two formats: a simple array of
path patterns, or an advanced object format with custom authorization logic.

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

## Advanced Object Format

For more complex authorization logic, you can provide a record mapping route patterns to custom
callback functions:

```typescript title="zudoku.config.ts"
{
  // ...
  protectedRoutes: {
    // Only allow authenticated users with admin role
    "/admin/*": ({ auth, context }) =>
      auth.isAuthenticated && auth.user?.role === "admin",

    // Check if user has enterprise access
    "/api/enterprise/*": ({ auth, context }) =>
      auth.isAuthenticated && auth.user?.subscription === "enterprise",

    // Allow access to beta features based on user attributes
    "/beta/*": ({ auth, context }) =>
      auth.isAuthenticated && auth.user?.betaAccess === true,
  },
  // ...
}
```

The callback function receives an object with:

- `auth`: The current authentication state including `isAuthenticated`, `user` data, and more
- `context`: The Zudoku context providing access to configuration and utilities

The callback must return a boolean indicating whether the user should have access to the route.

## Path Patterns

The path patterns follow the same syntax as [React Router](https://reactrouter.com):

- `:param` matches a URL segment up to the next `/`, `?`, or `#`
- `*` matches zero or more characters up to the next `/`, `?`, or `#`
- `/*` matches all characters after the pattern

For example:

- `/users/:id` matches `/users/123` or `/users/abc`
- `/docs/*` matches `/docs/getting-started` or `/docs/api/reference`
- `/settings` matches only the exact path `/settings`

After logging in, users will be automatically redirected back to the protected route they were
trying to access.

## Next Steps

- Learn about [authentication providers](./authentication.md#authentication-providers) supported by
  Zudoku
- Configure [user data](./authentication.md#user-data) display
