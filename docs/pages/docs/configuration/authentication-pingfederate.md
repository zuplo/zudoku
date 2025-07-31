---
title: PingFederate Authentication Setup
sidebar_label: PingFederate
description:
  Learn how to set up PingFederate authentication for Zudoku using OpenID Connect for
  enterprise-grade single sign-on.
---

PingFederate is an enterprise federation server that enables secure single sign-on (SSO) and API
security for organizations. This guide walks you through integrating PingFederate with Zudoku using
OpenID Connect.

## Prerequisites

- Access to a PingFederate server (version 9.0 or later recommended)
- Administrative access to configure OAuth clients in PingFederate
- Your PingFederate server's base URL

## Setup Steps

<Stepper>

1. **Create an OAuth Client in PingFederate**

   In the PingFederate administrative console:
   - Navigate to **Applications** → **OAuth** → **Clients**
   - Click **Add Client**
   - Configure the client:
     - **Client ID**: Choose a unique identifier (e.g., `zudoku-docs`)
     - **Client Authentication**: Select **None (Public Client)**
     - **Grant Types**: Enable **Authorization Code** and **Refresh Token**
     - **Redirect URIs**:
       - Production: `https://your-site.com/oauth/callback`
       - Preview (wildcard): `https://*.your-domain.com/oauth/callback`
       - Local Development: `http://localhost:3000/oauth/callback`

2. **Configure OpenID Connect Settings**

   Still in the OAuth client configuration:
   - Enable **OpenID Connect**
   - Configure scopes:
     - Enable `openid`, `profile`, and `email` (minimum required)
     - Add any custom scopes your organization requires
   - **ID Token Signing Algorithm**: RS256 (recommended)
   - **Access Token Manager**: Select or create an appropriate token manager
   - Save the configuration

3. **Configure Zudoku**

   Add the PingFederate configuration to your [Zudoku configuration file](./overview.md):

   ```typescript
   // zudoku.config.ts
   export default {
     // ... other configuration
     authentication: {
       type: "openid",
       clientId: "zudoku-docs", // Your OAuth client ID
       issuer: "https://pingfederate.your-domain.com", // Your PingFederate base URL
       scopes: ["openid", "profile", "email"], // Optional: add custom scopes
     },
     // ... other configuration
   };
   ```

</Stepper>

## Configuration Options

### Custom Scopes

If your organization uses custom scopes for authorization, include them in the configuration:

```typescript
authentication: {
  type: "openid",
  clientId: "zudoku-docs",
  issuer: "https://pingfederate.your-domain.com",
  scopes: ["openid", "profile", "email", "groups", "roles", "api:read"],
}
```

## Advanced Configuration

### CORS Configuration

Configure CORS in PingFederate for your documentation site:

1. Navigate to **System** → **Server Configuration** → **Cross-Origin Resource Sharing**
2. Add your site's domain to the allowed origins:
   - `https://your-site.com`
   - `http://localhost:3000` (for local development)

### Attribute Mapping

PingFederate can map user attributes from various sources. Ensure these standard claims are mapped:

1. Go to **OAuth** → **Access Token Management** → **Your Token Manager**
2. Configure attribute mappings:
   - `sub` → User's unique identifier
   - `name` → User's display name
   - `email` → User's email address
   - `picture` → User's profile picture URL (if available)

## Troubleshooting

### Common Issues

1. **Discovery Endpoint Not Found**: Ensure your issuer URL is correct and accessible. The OpenID
   Connect discovery endpoint should be available at
   `https://your-pingfederate-server/.well-known/openid-configuration`.

2. **Invalid Client Configuration**: Verify that the client ID matches exactly and that the redirect
   URIs are properly configured in PingFederate.

3. **CORS Errors**: Check that your site's domain is added to PingFederate's CORS configuration.

4. **Missing User Attributes**: Ensure attribute mappings are configured in your Access Token
   Manager.

5. **Token Validation Errors**: Verify that your PingFederate server's certificates are valid and
   that clock synchronization is accurate.

## Security Considerations

- Always use HTTPS for production deployments
- Regularly rotate signing certificates in PingFederate
- Configure appropriate session timeouts
- Review and audit OAuth client configurations periodically

## Next Steps

- Review [PingFederate documentation](https://docs.pingidentity.com/pingfederate/) for advanced
  features
- Learn about [protecting routes](./authentication.md#protected-routes) in your documentation
- Configure group-based access control using PingFederate claims
