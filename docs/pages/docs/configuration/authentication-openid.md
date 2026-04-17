---
title: OpenID Connect (OIDC)
sidebar_label: OpenID Connect
description:
  Configure any OpenID Connect compliant identity provider (Okta, Keycloak, Authentik, etc.) as the
  authentication provider for Zudoku.
---

Zudoku supports any identity provider that implements the
[OpenID Connect](https://openid.net/specs/openid-connect-core-1_0.html) protocol via the generic
`openid` provider type. This includes Okta, Keycloak, Authentik, Ory, ZITADEL, AWS Cognito, Google
Identity, and most enterprise IdPs.

## Configuration

Add the `authentication` property to your [Zudoku configuration](./overview.md):

```typescript title="zudoku.config.ts"
{
  // ...
  authentication: {
    type: "openid",
    clientId: "<your-client-id>",
    issuer: "<the-issuer-url>",
    scopes: ["openid", "profile", "email"], // Optional
  },
  // ...
}
```

| Option     | Required | Description                                                                                                                                 |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `clientId` | Yes      | The OAuth client ID issued by your provider.                                                                                                |
| `issuer`   | Yes      | The issuer URL. Zudoku discovers endpoints from `<issuer>/.well-known/openid-configuration`.                                                |
| `scopes`   | No       | Scopes to request. Defaults to `["openid", "profile", "email"]`.                                                                            |

## Provider Setup

Register Zudoku as a public SPA / single page application client in your identity provider and set:

- Callback / Redirect URI to `https://your-site.com/oauth/callback`
- For local development, add `http://localhost:3000/oauth/callback`
- If your provider supports wildcards, add `https://*.your-domain.com/oauth/callback` for preview
  environments
- Add your site origin to the list of allowed CORS origins
- Enable the `Authorization Code` grant with PKCE and the `Refresh Token` grant

### Okta

1. In the Okta admin console go to **Applications** → **Applications** → **Create App
   Integration**.
2. Select **OIDC - OpenID Connect** and **Single Page Application**.
3. Set **Sign-in redirect URIs** to `https://your-site.com/oauth/callback` (add
   `http://localhost:3000/oauth/callback` for local development).
4. Under **Assignments**, assign the users or groups that should have access.
5. After creating the app, copy the **Client ID**. Your issuer is your Okta domain, for example
   `https://your-tenant.okta.com` or a custom authorization server like
   `https://your-tenant.okta.com/oauth2/default`.
6. Under **Security** → **API** → **Trusted Origins**, add your site origin for both CORS and
   Redirect.

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "openid",
    clientId: "<your-okta-client-id>",
    issuer: "https://your-tenant.okta.com/oauth2/default",
    scopes: ["openid", "profile", "email"],
  },
}
```

### Keycloak

Use the realm issuer URL:

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "openid",
    clientId: "zudoku",
    issuer: "https://keycloak.example.com/realms/<your-realm>",
  },
}
```

In the realm, create a client with **Client type** `OpenID Connect`, **Access type** `public`, and
enable **Standard Flow** (Authorization Code).

## Verifying the Issuer

You can confirm your issuer URL is correct by opening
`<issuer>/.well-known/openid-configuration` in a browser. It should return a JSON document listing
`authorization_endpoint`, `token_endpoint`, `userinfo_endpoint`, and `jwks_uri`.

## User Profile

After sign-in Zudoku calls the provider's
[UserInfo endpoint](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo) and reads
`name`, `email`, `picture`, and `email_verified` from the response. Map these claims in your
provider if they are not emitted by default.

## Troubleshooting

- **Discovery fails**: verify `<issuer>/.well-known/openid-configuration` resolves and matches the
  `issuer` value in the document.
- **CORS errors on token / userinfo**: add your site origin to the provider's allowed origins.
- **Redirect URI mismatch**: the URI registered with the provider must match the Zudoku origin
  exactly, including protocol and port.
- **Missing profile fields**: ensure `profile` and `email` scopes are granted and that the provider
  includes `name`, `email`, and `picture` claims in the UserInfo response.
