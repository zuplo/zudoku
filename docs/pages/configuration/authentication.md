---
title: Overview
sidebar_icon: shield-check
---

If you use a managed authentication service, such as Auth0, Clerk, or OpenID, you can implement this into your site and allow users to browse and interact with your documentation and API reference in a logged in state.

## Configuration

To implement the authentication option for your site, add the `authentication` property to the [Zudoku Configuration](./overview.md) file. The configuration is slightly different depending on the authentication provider you use.

## Protected Routes

You can protect specific routes in your documentation by adding the `protectedRoutes` property to your configuration. This property takes an array of path patterns that match the routes you want to protect. When a user tries to access a protected route without being authenticated, they will be redirected to the login page.

```typescript
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

The path patterns follow React Router's syntax:

- `:param` matches a URL segment up to the next `/`, `?`, or `#`
- `*` matches zero or more characters up to the next `/`, `?`, or `#`
- `/*` matches all characters after the pattern

For example:

- `/users/:id` matches `/users/123` or `/users/abc`
- `/docs/*` matches `/docs/getting-started` or `/docs/api/reference`
- `/settings` matches only the exact path `/settings`

After logging in, users will be automatically redirected back to the protected route they were trying to access.

## Authentication Providers

Zudoku supports Clerk, Auth0, Supabase, Azure B2C, and any OpenID provider that supports the OpenID Connect protocol.

Not seeing your authentication provider? [Let us know](https://github.com/zuplo/zudoku/issues)

### Auth0

For Auth0, you will need the `clientId` associated with the domain you are using.

You can find this in the Auth0 dashboard under [Application Settings](https://auth0.com/docs/get-started/applications/application-settings).

```json5
{
  // ...
  authentication: {
    type: "auth0",
    domain: "yourdomain.us.auth0.com",
    clientId: "<your-auth0-clientId>",
    scopes: ["openid", "profile", "email", "custom_scope"],
  },
  // ...
}
```

To setup Auth0, create a Single Page Application (SPA) application in the Auth0 dashboard. Set the following options:

- Callback URL to `https://your-site.com/oauth/callback`.
- For development environments only, we recommend configuring your app to allow the a wildcard callback like `https://*.zuplo.app/oauth/callback` to allow for testing each environment.
- For local development, set the callback url to `http://localhost:3000/oauth/callback`.
- Add your site hostname (your-site.com) to the list of allowed CORS origins.

### Clerk

For Clerk you will need the publishable key for your application. You can find this in the Clerk dashboard on the [API Keys](https://dashboard.clerk.com/last-active?path=api-keys) page.

```typescript
{
  // ...
  authentication: {
    type: "clerk",
    clerkPubKey: "<your-clerk-publishable-key>"
  },
  // ...
}
```

### OpenID

For authentication services that support OpenID, you will need to supply an `clientId` and `issuer`.

```typescript
{
  // ...
  authentication: {
    type: "openid",
    clientId: "<your-client-id>",
    issuer: "<the-issuer-url>",
    scopes: ["openid", "profile", "email", "custom_scope"] // Optional custom scopes
  },
  // ...
}
```

When configuring your OpenID provider, you will need to set the following:

- Callback or Redirect URI to `https://your-site.com/oauth/callback`.
- If your provider supports wildcard callback urls, we recommend configuring your development identity provider to allow a wildcard callback like `https://*.zuplo.site/oauth/callback` to allow for testing each environment.
- For local development set the callback url to `http://localhost:3000/oauth/callback`.
- Add your site hostname (your-site.com) to the list of allowed CORS origins.

By default, the scopes "openid", "profile", and "email" are requested. You can customize these by providing your own array of scopes.

### Supabase

To use Supabase as your authentication provider, supply your project's URL, API key, and the OAuth provider to use.

```typescript
{
  // ...
  authentication: {
    type: "supabase",
    provider: "github",
    supabaseUrl: "https://your-project.supabase.co",
    supabaseKey: "<your-supabase-key>",
    basePath: "/",
    redirectToAfterSignUp: "/",
    redirectToAfterSignIn: "/",
    redirectToAfterSignOut: "/",
  },
  // ...
}
```

The `provider` option can be any of Supabase Auth's supported providers, such as `apple`, `azure`, `bitbucket`, `discord`, `facebook`, `figma`, `github`, `gitlab`, `google`, `kakao`, `keycloak`, `linkedin`, `linkedin_oidc`, `notion`, `slack`, `slack_oidc`, `spotify`, `twitch`, `twitter`, `workos`, `zoom`, or `fly`.

The optional `basePath` sets the default redirect root. You can override each flow using the individual redirect options.

### Azure B2C

For Azure B2C authentication, you will need to provide your Azure B2C tenant name, client ID, and policy name.

```typescript
{
  // ...
  authentication: {
    type: "azureb2c",
    clientId: "<your-azure-b2c-client-id>",
    tenantName: "<your-tenant-name>",
    policyName: "<your-policy-name>",
    issuer: "<your-issuer-url>",
    scopes: ["openid", "profile", "email", "custom_scope"]
  },
  // ...
}
```

When configuring your Azure B2C application, you will need to set the following:

- Redirect URI to `https://your-site.com/oauth/callback`
- For local development, set the redirect URI to `http://localhost:3000/oauth/callback`
- Add your site hostname (your-site.com) to the list of allowed CORS origins
- Configure the appropriate user flows (policies) in your Azure B2C tenant

By default, the scopes "openid", "profile", and "email" are requested. You can customize these by providing your own array of scopes.

## User Data

After the user authenticates, the user profile is loaded via the provider's [User Info endpoint](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo). The following fields are used to display the user profile:

- `name` - The user's full name
- `email` - The user's email address
- `picture` - The user's profile picture URL
- `email_verified` - Whether the user's email address has been verified

If the provider does not return a field, it will be left blank.
