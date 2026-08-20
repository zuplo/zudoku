---
title: Customizing the OAuth Authorize Request
sidebar_label: Authorization Params
description: Learn how to pass custom parameters to the OAuth authorize endpoint in Zudoku using
  authorizationParams and forwardAuthorizationParams for multi-tenant portals, Auth0 Organizations,
  and IdP routing.
---

When Zudoku redirects a user to your identity provider for sign-in, it builds an OAuth
`/authorize` URL behind the scenes. The `authorizationParams` and `forwardAuthorizationParams`
options let you append extra query parameters to that URL on every authorization request — not just
during sign-up.

This is essential for scenarios like:

- **Auth0 Organizations** — sending `organization=org_xxxx` so users land in the correct
  organization tenant
- **IdP connection pinning** — forcing a specific connection such as `connection=corp-saml`
- **Locale-aware login** — passing `ui_locales=fr-CA` to display the login page in the user's
  language
- **Login hints** — pre-filling the email field with `login_hint=user@corp.com`
- **Invitation flows** — forwarding `invitation` and `organization` tokens from a link to Auth0

Both options are available on the `auth0` and `openid` provider types. `authorizationParams` accepts
any `Record<string, string>` — every key-value pair is appended to the authorize URL as a query
parameter. `forwardAuthorizationParams` is a `string[]` listing the query parameter names to read
from the current page URL.

## Difference from signUp.authorizationParams

The existing `signUp.authorizationParams` option only applies when a user clicks **Register**. The
top-level `authorizationParams` applies on **every** authorization request — both sign-in and
sign-up.

| Option                       | Applies to          | Use case                                         |
| ---------------------------- | ------------------- | ------------------------------------------------ |
| `authorizationParams`        | Sign-in and sign-up | Organization pinning, connection routing, locale |
| `signUp.authorizationParams` | Sign-up only        | Keycloak `kc_action: "register"`                 |
| `forwardAuthorizationParams` | Sign-in and sign-up | Dynamic values from invitation links or routing  |

## Static authorization parameters

Use `authorizationParams` to attach the same key-value pairs to every authorize request. This
applies to both sign-in and sign-up flows.

### Auth0 example — pin an organization

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "auth0",
    domain: "your-tenant.us.auth0.com",
    clientId: "<your-client-id>",
    audience: "https://your-domain.com/api",
    authorizationParams: {
      organization: "org_xxxxxxxxxxxxxxxx",
    },
  },
}
```

Every authorization request will include `&organization=org_xxxxxxxxxxxxxxxx`, ensuring users always
sign in to the specified Auth0 Organization.

### OpenID example — pin an IdP connection

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "openid",
    clientId: "<your-client-id>",
    issuer: "https://your-tenant.us.auth0.com/",
    authorizationParams: {
      connection: "corp-saml",
    },
  },
}
```

### OpenID example — localized login

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "openid",
    clientId: "<your-client-id>",
    issuer: "https://idp.example.com/",
    authorizationParams: {
      ui_locales: "fr-CA",
    },
  },
}
```

:::tip

You can combine multiple parameters in a single `authorizationParams` object:

```typescript
authorizationParams: {
  organization: "org_xxxxxxxxxxxxxxxx",
  connection: "corp-saml",
  ui_locales: "fr-CA",
},
```

:::

## Forwarding URL query parameters

Use `forwardAuthorizationParams` to forward specific query parameters from the current page URL to
the identity provider. This is useful when the parameter value is not known at build time — for
example, when an invitation link carries the organization ID.

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "auth0",
    domain: "your-tenant.us.auth0.com",
    clientId: "<your-client-id>",
    audience: "https://your-domain.com/api",
    forwardAuthorizationParams: ["custom_param"],
  },
}
```

When a user visits `https://docs.example.com/login?custom_param=some_value`, Zudoku will include
`&custom_param=some_value` in the authorization URL sent to your identity provider.

### Default forwarded parameters

Zudoku automatically forwards a set of commonly used parameters without any configuration.

**All OpenID-based providers** (including Auth0) forward these by default:

- `login_hint`
- `domain_hint`
- `ui_locales`
- `acr_values`

**The Auth0 provider** additionally forwards:

- `organization`
- `invitation`
- `connection`

Any values you add to `forwardAuthorizationParams` extend these defaults — they do not replace them.

### Auth0 invitation flow example

Auth0 invitation emails typically contain a link like:

```
https://docs.example.com/login?invitation=inv_abc123&organization=org_xxxxxxxxxxxxxxxx
```

Because the Auth0 provider automatically forwards `invitation` and `organization`, no additional
configuration is needed. Zudoku will pass both parameters through to Auth0's `/authorize` endpoint,
and the user will land in the correct organization with the invitation redeemed.

If you need to forward a parameter that is not in the default list, add it explicitly:

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "auth0",
    domain: "your-tenant.us.auth0.com",
    clientId: "<your-client-id>",
    audience: "https://your-domain.com/api",
    forwardAuthorizationParams: ["tenant_id"],
  },
}
```

Now `tenant_id` will be forwarded alongside the built-in defaults (`organization`, `invitation`,
`connection`, `login_hint`, `domain_hint`, `ui_locales`, `acr_values`).

## Precedence and security

The parameters are applied in this order:

1. **`authorizationParams`** — static values are set first
2. **`signUp.authorizationParams`** — applied only on sign-up, overriding static values for matching
   keys
3. **`forwardAuthorizationParams`** — URL query values are applied next, overriding both of the
   above for matching keys
4. **Core OIDC parameters** — `client_id`, `redirect_uri`, `response_type`, `scope`,
   `code_challenge`, `code_challenge_method`, and `state` are always set last by Zudoku and
   **cannot be overridden**

This means if you set `authorizationParams: { login_hint: "static@example.com" }` but the page URL
contains `?login_hint=runtime@example.com`, the forwarded runtime value wins. Forwarded URL
parameters also override `signUp.authorizationParams` values with the same key.

:::caution

Core OAuth parameters (`client_id`, `redirect_uri`, `response_type`, `scope`, `code_challenge`,
`code_challenge_method`, `state`) are always controlled by Zudoku to maintain security. Any attempt
to override them via `authorizationParams` or `forwardAuthorizationParams` will be silently ignored.

:::

## Combining static and sign-up parameters

You can use `authorizationParams` and `signUp.authorizationParams` together. For example, pin an
organization on every request and add a Keycloak register action only on sign-up:

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "openid",
    clientId: "<your-client-id>",
    issuer: "https://keycloak.example.com/realms/my-realm",
    authorizationParams: {
      organization: "org_xxxxxxxxxxxxxxxx",
    },
    signUp: {
      authorizationParams: {
        kc_action: "register",
      },
    },
  },
}
```

## Recipes

### Multi-region IdP routing

If your identity provider uses different connections per region, you can forward a `connection`
parameter from the URL. With Auth0, `connection` is forwarded automatically:

Link users to `https://docs.example.com/login?connection=eu-saml` or
`https://docs.example.com/login?connection=us-okta` and the appropriate IdP connection will be
used.

For non-Auth0 providers, add `connection` to `forwardAuthorizationParams`:

```typescript title="zudoku.config.ts"
{
  authentication: {
    type: "openid",
    clientId: "<your-client-id>",
    issuer: "https://idp.example.com/",
    forwardAuthorizationParams: ["connection"],
  },
}
```

### Locale-aware login from URL

If the locale should come from the URL rather than a static config value, all OpenID-based providers
already forward `ui_locales` by default. Simply link to
`https://docs.example.com/login?ui_locales=de` and the parameter reaches the IdP automatically — no
configuration changes required.

## Troubleshooting

### Verify the authorize URL in your browser

Open your browser's developer tools, go to the **Network** tab, and trigger a sign-in. Look for the
redirect to your identity provider's `/authorize` endpoint. The URL should contain the parameters
you configured.

For example, with Auth0 Organizations you should see something like:

```
https://your-tenant.us.auth0.com/authorize?organization=org_xxxx&client_id=...&redirect_uri=...
```

### Common mistakes

- **Auth0 Organization not enabled** — Make sure the Organization feature is enabled in your Auth0
  Dashboard (check the **Organizations** section) and that the organization ID is correct (starts
  with `org_`).
- **Case sensitivity** — Parameter names and values are case-sensitive. `Organization` is not the
  same as `organization`.
- **Missing organization membership** — The user must be a member of the Auth0 Organization or have
  an active invitation. Otherwise Auth0 will return an error.
- **Conflicting static and forwarded values** — If the same parameter appears in both
  `authorizationParams` and the page URL (via `forwardAuthorizationParams`), the forwarded URL value
  takes precedence.

## Related documentation

- [Auth0 Setup](./authentication-auth0.md) — Basic Auth0 configuration for Zudoku
- [OpenID Connect](./authentication-openid.md) — Generic OIDC provider configuration
- [Authentication Overview](./authentication.md) — All supported authentication providers
- [OAuth Security Schemes](./oauth-security-schemes.md) — Configure OAuth for the API playground
- [Protected Routes](./protected-routes.md) — Restrict access to documentation pages
