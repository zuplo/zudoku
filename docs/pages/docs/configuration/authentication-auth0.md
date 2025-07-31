---
title: Auth0 Authentication Setup
sidebar_label: Auth0
description:
  Learn how to set up Auth0 authentication for Zudoku, including application configuration and
  integration steps for secure API documentation access.
---

Auth0 is a flexible authentication and authorization platform that integrates seamlessly with
Zudoku. This guide walks you through setting up Auth0 authentication for your documentation site.

## Prerequisites

If you don't have an Auth0 account, you can sign up for a
[free Auth0 account](https://auth0.com/signup) that provides 7,000 monthly active users.

## Setup Steps

<Stepper>

1. **Create Auth0 Application**

   [Create a new Auth0 application](https://auth0.com/docs/get-started/auth0-overview/create-applications)
   in the Auth0 dashboard:
   - Select type **Single Page Web Applications**
   - Give your application a descriptive name

2. **Configure Auth0 Application**

   In your Auth0 application settings, configure the following:

   **Application URLs:**
   - **Allowed Callback URLs**:
     - Production: `https://your-site.com/oauth/callback`
     - Preview (wildcard): `https://*.your-domain.com/oauth/callback`
     - Local Development: `http://localhost:3000/oauth/callback`
   - **Allowed Logout URLs**: Same as callback URLs above

   - **Allowed Web Origins**:
     - Production: `https://your-site.com`
     - Preview (wildcard): `https://*.your-domain.com`
     - Local development: `http://localhost:3000`

   **Refresh Token Settings:**
   - **Rotation**: Enabled
   - **Reuse Interval**: 0 (recommended)

   Keep the default refresh token expiration settings unless you have specific requirements.

3. **Configure Zudoku**

   Add the Auth0 configuration to your [Zudoku configuration file](./overview.md):

   ```typescript
   // zudoku.config.ts
   export default {
     // ... other configuration
     authentication: {
       type: "auth0",
       domain: "your-domain.us.auth0.com",
       clientId: "<your-auth0-client-id>",
       scopes: ["openid", "profile", "email"], // Optional: customize scopes
     },
     // ... other configuration
   };
   ```

   Where:
   - **domain**: Your Auth0 domain (found in your application's Basic Information)
   - **clientId**: The Client ID from your Auth0 application settings
   - **scopes**: Optional array of OAuth scopes (defaults to `["openid", "profile", "email"]`)

</Stepper>

## Advanced Configuration

### Custom Scopes

If you need additional scopes for your API access, you can specify them in the configuration:

```typescript
authentication: {
  type: "auth0",
  domain: "your-domain.us.auth0.com",
  clientId: "<your-auth0-client-id>",
  scopes: ["openid", "profile", "email", "read:api", "write:api"],
}
```

## Troubleshooting

### Common Issues

1. **Callback URL Mismatch**: Ensure your callback URLs in Auth0 exactly match your site's URL,
   including the `/oauth/callback` path.

2. **CORS Errors**: Add your site's domain to the Allowed Web Origins in Auth0.

3. **Authentication Loop**: Check that your Auth0 domain includes the protocol (`https://`) but no
   trailing slash.

## Next Steps

- Learn about [protecting routes](./authentication.md#protected-routes) in your documentation
- Explore other [authentication providers](./authentication.md#authentication-providers) supported
  by Zudoku
- Configure [user permissions](./authentication.md#user-data) based on Auth0 roles
