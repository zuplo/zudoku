---
title: Overview
sidebar_icon: shield-check
---

If you use a managed authentication service, such as Auth0, Clerk, or OpenID, you can implement this
into your site and allow users to browse and interact with your documentation and API reference in a
logged in state.

## Configuration

To implement the authentication option for your site, add the `authentication` property to the
[Zudoku Configuration](./overview.md) file. The configuration is slightly different depending on the
authentication provider you use.

## Authentication Providers

Zudoku supports Clerk, Auth0, Supabase, Firebase, Microsoft Entra ID, Azure B2C, and any OpenID
Connect provider (including Okta, Keycloak, Authentik, and PingFederate).

Not seeing your authentication provider? [Let us know](https://github.com/zuplo/zudoku/issues)

### Auth0

For Auth0, you will need the `clientId` associated with the domain you are using.

You can find this in the Auth0 dashboard under
[Application Settings](https://auth0.com/docs/get-started/applications/application-settings).

```typescript
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

To setup Auth0, create a Single Page Application (SPA) application in the Auth0 dashboard. Set the
following options:

- Callback URL to `https://your-site.com/oauth/callback`.
- For development environments only, we recommend configuring your app to allow the a wildcard
  callback like `https://*.zuplo.app/oauth/callback` to allow for testing each environment.
- For local development, set the callback url to `http://localhost:3000/oauth/callback`.
- Add your site hostname (your-site.com) to the list of allowed CORS origins.

### Clerk

For Clerk you will need the publishable key for your application. You can find this in the Clerk
dashboard on the [API Keys](https://dashboard.clerk.com/last-active?path=api-keys) page.

```typescript
{
  // ...
  authentication: {
    type: "clerk",
    clerkPubKey: "<your-clerk-publishable-key>",
    // Optional. See: https://clerk.com/docs/backend-requests/jwt-templates
    jwtTemplateName: "dev-portal",
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
- If your provider supports wildcard callback urls, we recommend configuring your development
  identity provider to allow a wildcard callback like `https://*.zuplo.site/oauth/callback` to allow
  for testing each environment.
- For local development set the callback url to `http://localhost:3000/oauth/callback`.
- Add your site hostname (your-site.com) to the list of allowed CORS origins.

By default, the scopes "openid", "profile", and "email" are requested. You can customize these by
providing your own array of scopes.

For provider-specific guides (Okta, Keycloak, etc.), see the
[OpenID Connect setup page](./authentication-openid.md).

### Microsoft Entra ID

For Microsoft Entra ID (formerly Azure AD), you will need the `clientId` from your app registration
and your `tenantId`.

```typescript
{
  // ...
  authentication: {
    type: "entra",
    clientId: "<your-application-client-id>",
    tenantId: "<your-tenant-id>", // Or "common" for multitenant. Defaults to "common".
  },
  // ...
}
```

For full setup instructions, see the
[Azure AD / Entra ID setup guide](./authentication-azure-ad.md).

### Firebase

For Firebase authentication, you will need your Firebase project configuration. You can find this in
the Firebase console under Project Settings.

```typescript title="zudoku.config.ts"
{
  // ...
  authentication: {
    type: "firebase",
    apiKey: "<your-firebase-api-key>",
    authDomain: "<your-project>.firebaseapp.com",
    projectId: "<your-project-id>",
    appId: "<your-app-id>",
    providers: ["google", "github", "password"], // Optional
  },
  // ...
}
```

The `providers` option configures which sign-in methods are available. Supported providers include:
`google`, `facebook`, `twitter`, `github`, `microsoft`, `apple`, `yahoo`, `password`, and
`emailLink`.

For detailed setup instructions, see the [Firebase setup guide](./authentication-firebase.md).

### Supabase

To use Supabase as your authentication provider, supply your project's URL, API key, and the OAuth
providers to use.

```typescript title="zudoku.config.ts"
{
  // ...
  authentication: {
    type: "supabase",
    providers: ["github"],
    supabaseUrl: "https://your-project.supabase.co",
    supabaseKey: "<your-supabase-key>",
    redirectToAfterSignUp: "/",
    redirectToAfterSignIn: "/",
    redirectToAfterSignOut: "/",
  },
  // ...
}
```

The `providers` option accepts an array of Supabase Auth's supported providers, such as `apple`,
`azure`, `bitbucket`, `discord`, `facebook`, `figma`, `github`, `gitlab`, `google`, `kakao`,
`keycloak`, `linkedin`, `linkedin_oidc`, `notion`, `slack`, `slack_oidc`, `spotify`, `twitch`,
`twitter`, `workos`, `zoom`, or `fly`.

### Azure B2C

For Azure B2C authentication, you will need to provide your Azure B2C tenant name, client ID, and
policy name.

```typescript title="zudoku.config.ts"
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

By default, the scopes "openid", "profile", and "email" are requested. You can customize these by
providing your own array of scopes.

## User Data

After the user authenticates, the user profile is loaded via the provider's
[User Info endpoint](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo). The following
fields are used to display the user profile:

- `name` - The user's full name
- `email` - The user's email address
- `picture` - The user's profile picture URL
- `email_verified` - Whether the user's email address has been verified

If the provider does not return a field, it will be left blank.

### Custom Claims

Custom claims from your identity provider are merged into the profile alongside the standard fields.
Both the ID token and the User Info response are used as sources, so a claim added by an identity
provider action (such as an Auth0 Post-Login Action) is available whichever of the two it lands on:

```typescript
const { profile } = useAuth();

profile["https://example.com/subscription"]; // → { plan: "pro" }
```

Registered protocol claims (`exp`, `iat`, `iss`, `aud`, `nonce`, and friends) describe the token
rather than the user, and are not added to the profile. The identity fields above are always derived
by Zudoku and cannot be overwritten by a claim. The `metadata` key is reserved for the custom user
data described below.

In server-side rendered deployments, claims are also read from the access token, so the profile is
the same on the server as it is in the browser. The server-side profile is stored in a cookie: if it
exceeds the browser's size limit, custom claims are dropped from it (a warning is logged) and
restored in the browser shortly after the page loads.

## Custom User Data

Beyond the claims the identity provider issues, Zudoku can load custom user data — a subscription,
entitlements, an internal account record — from your own API after sign-in. Use `getMetadata` to
avoid maintaining that lookup as an identity provider action:

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "auth0",
    domain: "example.auth0.com",
    clientId: "<your-client-id>",
    getMetadata: async ({ signRequest, signal }) => {
      const response = await fetch(
        await signRequest(
          new Request("https://api.example.com/me/subscription", { signal }),
        ),
      );

      if (!response.ok) {
        throw new Error(`Subscription lookup failed: ${response.status}`);
      }

      return await response.json();
    },
  },
}
```

The returned value is available as `profile.metadata`:

```tsx
const { profile, isMetadataPending, refreshMetadata } = useAuth();

if (isMetadataPending) return <Spinner />;

return <span>Plan: {profile?.metadata?.plan}</span>;
```

:::caution

`getMetadata` runs **in the browser**, not on the server. Never close over an API key or any other
secret — it would be included in the client bundle. Authorize the request with the supplied
`signRequest`, which attaches the signed-in user's credentials and works across every authentication
provider.

:::

### Arguments

| Argument      | Description                                                      |
| ------------- | ---------------------------------------------------------------- |
| `profile`     | The user profile derived from the identity provider's claims     |
| `context`     | The [Zudoku context](../custom-pages.md)                         |
| `signRequest` | Adds the current user's credentials to a `Request`               |
| `signal`      | Aborts on unmount, on user change, and after a 10 second timeout |

### Behavior

- The returned value **replaces** `profile.metadata` in full; it is not merged with the previous
  value.
- It is loaded once per signed-in user and cached for five minutes. Call `refreshMetadata()` to
  reload it, for example after a plan change.
- Failures never sign the user out. The error is logged, `profile.metadata` is left `undefined`, and
  one retry is attempted before giving up.
- It is not loaded during server-side rendering, so `profile.metadata` is `undefined` on the first
  paint. Use `isMetadataPending` to render a loading state.

### Typing the metadata

`profile.metadata` is loosely typed by default. Augment `UserMetadata` to describe your own shape:

```typescript title="zudoku.d.ts"
declare module "zudoku/auth" {
  interface UserMetadata {
    plan: "free" | "pro";
    seatsUsed: number;
  }
}
```

Both the value returned by `getMetadata` and every read of `profile.metadata` are then checked
against that declaration. The value must be JSON-serializable — it is persisted to local storage in
static builds.

## Protected Routes

Once authentication is configured, you can protect specific routes in your documentation to require
users to be authenticated or meet custom authorization requirements. Routes can be protected with a
simple array of patterns, or with custom callback functions that support reason codes for
distinguishing between unauthorized and forbidden access.

```typescript title="zudoku.config.ts"
{
  // ...
  // Simple array format: requires authentication
  protectedRoutes: [
    "/admin/*",
    "/settings",
    "/api/*",
  ],

  // Or object format: custom authorization with reason codes
  protectedRoutes: {
    "/admin/*": ({ auth, reasonCode }) =>
      !auth.isAuthenticated
        ? reasonCode.UNAUTHORIZED
        : auth.profile?.email?.endsWith("@example.com")
          ? true
          : reasonCode.FORBIDDEN,
  },
  // ...
}
```

See the [Protected Routes](./protected-routes.md) documentation for detailed information on
configuring route protection, reason codes, and navigation behavior.
