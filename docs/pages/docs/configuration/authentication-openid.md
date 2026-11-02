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

| Option                  | Required | Description                                                                                                                                                      |
| ----------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clientId`              | Yes      | The OAuth client ID issued by your provider.                                                                                                                     |
| `issuer`                | Yes      | The issuer URL. Zudoku discovers endpoints from `<issuer>/.well-known/openid-configuration`.                                                                     |
| `scopes`                | No       | Scopes to request. Defaults to `["openid", "profile", "email"]`.                                                                                                 |
| `allowInsecureRequests` | No       | Allow discovery and token requests against an `http://` issuer. Defaults to `false`. Intended only for local development — never enable this in production.      |
| `loadUserInfo`          | No       | Load the user profile from the UserInfo endpoint. Defaults to `true`. Set it to `false` to use the ID token's claims instead; see [User Profile](#user-profile). |

## Provider Setup

Register Zudoku as a public SPA / single page application client in your identity provider and set:

- Callback / Redirect URI to `https://your-site.com/oauth/callback`
- For local development, add `http://localhost:3000/oauth/callback`
- If your provider supports wildcards, add `https://*.your-domain.com/oauth/callback` for preview
  environments
- Add your site origin to the list of allowed CORS origins
- Enable the `Authorization Code` grant with PKCE and the `Refresh Token` grant

### Okta

1. In the Okta admin console go to **Applications** → **Applications** → **Create App Integration**.
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

You can confirm your issuer URL is correct by opening `<issuer>/.well-known/openid-configuration` in
a browser. It should return a JSON document listing `authorization_endpoint`, `token_endpoint`,
`userinfo_endpoint`, and `jwks_uri`.

## Customizing Sign-up

By default Register and Sign in both call the OIDC authorize endpoint, so users land on the same
login page. Two options change that:

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "openid",
    clientId: "<your-client-id>",
    issuer: "<the-issuer-url>",

    // Send Register to a separate URL (absolute → external redirect, relative → in-app navigate)
    signUp: { url: "/register" },

    // Or pass extra params to the authorize URL on sign-up only (e.g. Keycloak)
    signUp: { authorizationParams: { kc_action: "register" } },

    // Hide Register UI entirely. Visual only — still configure your IdP to block sign-ups.
    disableSignUp: true,
  },
}
```

When `disableSignUp` is `true`, the Register button on the protected-route login dialog is hidden
and `/signup` shows an "Invitation required" page.

## User Profile

After sign-in Zudoku calls the provider's
[UserInfo endpoint](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo) and reads
`name`, `email`, `picture`, and `email_verified` from the response. Map these claims in your
provider if they are not emitted by default.

### Without the UserInfo Endpoint

Some providers don't let a browser call the UserInfo endpoint, for example because it doesn't allow
cross-origin requests from your site. Set `loadUserInfo` to `false` and Zudoku never calls it:

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "openid",
    clientId: "<your-client-id>",
    issuer: "<the-issuer-url>",
    loadUserInfo: false,
  },
}
```

Zudoku also skips UserInfo when the discovery document doesn't advertise a `userinfo_endpoint`. The
option works the same way for the `entra` and `auth0` providers.

Without UserInfo, the profile is built from the claims of the ID token that the token endpoint
returns at sign-in:

- The ID token must contain `name`, `email`, `picture`, and `email_verified`. Most providers add
  them for the `profile` and `email` scopes, but some only put them in the UserInfo response unless
  you configure them for the ID token.
- Custom claims in the ID token, such as roles or groups, are part of the profile. Claims that
  describe the token itself (`iss`, `aud`, `exp`, `nonce` and the like) are not.
- Sign-in fails if the token response contains no ID token, so keep the `openid` scope.

In [SSR mode](./protected-routes.md#server-side-protection-ssr-mode) the server checks the access
token on every request. Without UserInfo, the access token must be a JWT signed by your provider.
Zudoku verifies it against the provider's `jwks_uri` and requires:

- the issuer's `iss` and an `exp`;
- that it was issued to your app: with `audience` set, its `aud` must match `audience`; without it,
  your `clientId` must appear in `aud`, `azp`, `client_id` or `cid` (Okta). Set `audience` if your
  provider puts none of these in its access tokens.

The server-side profile then comes from the access token's claims, so add `name` and `email` to it
if you show them. Opaque access tokens can't be verified this way, so the server rejects them and
the user is signed out on the next page load.

## Local Development with an HTTP Issuer

`oauth4webapi` (the library Zudoku uses under the hood) rejects issuers that don't use `https://` by
default, since OIDC requires TLS in production. If you're running an identity provider locally over
plain HTTP (e.g. a dockerized Keycloak on `http://localhost:9090`), set `allowInsecureRequests` to
`true` so discovery and token requests are allowed to use `http://`:

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "openid",
    clientId: "<your-client-id>",
    issuer: "http://localhost:9090/auth/realms/<your-realm>",
    allowInsecureRequests: true,
  },
}
```

Only enable this for local development. Never set `allowInsecureRequests` to `true` against a
production issuer.

## Troubleshooting

- **Discovery fails**: verify `<issuer>/.well-known/openid-configuration` resolves and matches the
  `issuer` value in the document.
- **CORS errors on token / userinfo**: add your site origin to the provider's allowed origins. If
  your provider can't allow browser calls to the UserInfo endpoint, set `loadUserInfo` to `false`
  (see [Without the UserInfo Endpoint](#without-the-userinfo-endpoint)).
- **Redirect URI mismatch**: the URI registered with the provider must match the Zudoku origin
  exactly, including protocol and port.
- **Missing profile fields**: ensure `profile` and `email` scopes are granted and that the provider
  includes `name`, `email`, and `picture` claims in the UserInfo response, or in the ID token when
  `loadUserInfo` is `false`.
