---
title: OAuth Security Schemes
sidebar_icon: shield
---

If your OpenAPI specification defines OAuth2 or OpenID Connect security schemes, Zudoku will display
them as informational badges on your API operations. However, interactive OAuth flows (such as
Authorization Code or Client Credentials) are **not active by default** in the playground. To enable
OAuth-based authentication for API requests, you need to configure a Zudoku
[authentication provider](./authentication.md).

## Why Zudoku Uses Its Own Authentication System

OpenAPI `securitySchemes` describe _what_ authentication an API requires, but they don't include the
runtime configuration needed to actually perform an OAuth flow — such as the client ID, client
secret, redirect URI, or provider-specific settings.

Rather than attempting to derive a working OAuth flow from incomplete spec metadata, Zudoku gives
you full control through its authentication plugin system. This approach:

- Works reliably across OAuth providers (Auth0, Azure B2C, Okta, Keycloak, etc.) without
  provider-specific workarounds
- Avoids exposing client secrets in the browser
- Handles token refresh, session management, and logout correctly
- Integrates with Zudoku's [protected routes](./protected-routes.md) and
  [API identity](../concepts/auth-provider-api-identities.md) system

## Setting Up OAuth for the Playground

To enable OAuth-based authentication in the API playground, follow these two steps:

### 1. Configure an Authentication Provider

Add an `authentication` block to your `zudoku.config.ts`. This handles the OAuth flow (redirects,
token exchange, session management) for your documentation portal.

For example, using Auth0:

```ts title=zudoku.config.ts
const config = {
  authentication: {
    type: "auth0",
    domain: "yourdomain.us.auth0.com",
    clientId: "<your-auth0-client-id>",
  },
};
```

Or using any OpenID Connect provider:

```ts title=zudoku.config.ts
const config = {
  authentication: {
    type: "openid",
    clientId: "<your-client-id>",
    issuer: "https://your-idp.example.com",
  },
};
```

See [Authentication](./authentication.md) for the full list of supported providers.

### 2. Create an API Identity Plugin

The authentication provider signs users into the portal. To use their token for API requests in the
playground, create an [API Identity plugin](../concepts/auth-provider-api-identities.md) that
bridges the two:

```ts title=zudoku.config.ts
import { createApiIdentityPlugin } from "zudoku/plugins";

const config = {
  authentication: {
    type: "openid",
    clientId: "<your-client-id>",
    issuer: "https://your-idp.example.com",
  },
  plugins: [
    createApiIdentityPlugin({
      getIdentities: async (context) => [
        {
          id: "oauth-token",
          label: "OAuth Token",
          authorizeRequest: (request) => {
            return context.authentication?.signRequest(request);
          },
        },
      ],
    }),
  ],
};
```

Once configured, users can sign in to your documentation portal and their OAuth token will be
automatically attached to API requests made from the playground.

## What About Non-OAuth Security Schemes?

Simple security schemes like API keys and HTTP bearer tokens defined in your OpenAPI spec work in
the playground without any additional Zudoku configuration. Users can enter their credentials
directly in the playground's Authorize dialog.

OAuth2 and OpenID Connect schemes are the exception — they require the authentication provider
configuration described above because performing OAuth flows requires runtime configuration that
goes beyond what OpenAPI specifies.

## Disabling Security Scheme Display

If you don't want security scheme information displayed at all (badges on operations, the security
schemes section on the info page, and the Authorize dialog), you can disable it:

```ts title=zudoku.config.ts
const config = {
  apis: {
    type: "file",
    input: "./openapi.json",
    path: "/api",
    options: {
      disableSecurity: true,
    },
  },
};
```
