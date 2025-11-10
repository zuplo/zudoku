---
title: Azure AD Authentication Setup
sidebar_label: Azure AD
description:
  Learn how to set up Azure Active Directory (Microsoft Entra ID) authentication for Zudoku,
  enabling secure single sign-on for your organization.
---

Azure Active Directory (now Microsoft Entra ID) provides enterprise-grade authentication and
authorization for organizations using Microsoft's cloud identity platform. This guide shows you how
to integrate Azure AD with your Zudoku documentation site.

## Prerequisites

- An Azure subscription with Azure Active Directory
- Administrative access to register applications in Azure AD
- Your Azure AD tenant ID

## Setup Steps

<Stepper>

1. **Register an Application in Azure AD**

   In the [Azure Portal](https://portal.azure.com):
   - Navigate to **Azure Active Directory** → **App registrations**
   - Click **New registration**
   - Configure your application:
     - **Name**: Enter a descriptive name (e.g., "Zudoku Documentation")
     - **Supported account types**: Choose based on your needs:
       - Single tenant (your organization only)
       - Multitenant (any Azure AD directory)
       - Multitenant + personal Microsoft accounts
     - **Redirect URI**:
       - Platform: **Single-page application (SPA)**
       - URI: `https://your-site.com/oauth/callback`
   - Click **Register**

2. **Configure Authentication Settings**

   In your newly registered application:
   - Go to **Authentication** in the left menu
   - Under **Single-page application**, add redirect URIs:
     - Production: `https://your-site.com/oauth/callback`
     - Preview (wildcard): `https://*.your-domain.com/oauth/callback`
     - Local Development: `http://localhost:3000/oauth/callback`
   - Under **Implicit grant and hybrid flows**:
     - Enable **ID tokens**
     - Enable **Access tokens**
   - Configure **Supported account types** if needed
   - Save your changes

3. **Configure API Permissions (Optional)**

   If you need specific permissions:
   - Go to **API permissions**
   - Click **Add a permission**
   - Select **Microsoft Graph** → **Delegated permissions**
   - Add permissions like `User.Read`, `email`, `profile`, `openid`
   - Grant admin consent if required by your organization

4. **Configure Zudoku**

   Get your application details from the Azure Portal:
   - Go to **Overview** page of your app registration
   - Copy the **Application (client) ID**
   - Copy the **Directory (tenant) ID**

   Add the configuration to your [Zudoku configuration file](./overview.md):

   ```typescript
   // zudoku.config.ts
   export default {
     // ... other configuration
     authentication: {
       type: "openid",
       clientId: "<your-application-client-id>",
       issuer: "https://login.microsoftonline.com/<your-tenant-id>/v2.0",
       scopes: ["openid", "profile", "email"], // Optional: customize scopes
     },
     // ... other configuration
   };
   ```

5. **Install Azure AD Dependencies**

   Add `@azure/msal-browser` to your project dependencies:

   ```bash
   npm install @azure/msal-browser
   ```

</Stepper>

## Configuration Options

### Single Tenant vs Multitenant

For single tenant (organization-only access):

```typescript
authentication: {
  type: "openid",
  clientId: "<your-application-client-id>",
  issuer: "https://login.microsoftonline.com/<your-tenant-id>/v2.0",
  scopes: ["openid", "profile", "email"],
}
```

For multitenant (any Azure AD organization):

```typescript
authentication: {
  type: "openid",
  clientId: "<your-application-client-id>",
  issuer: "https://login.microsoftonline.com/common/v2.0",
  scopes: ["openid", "profile", "email"],
}
```

### Custom Scopes and Permissions

Request additional Microsoft Graph API scopes:

```typescript
authentication: {
  type: "openid",
  clientId: "<your-application-client-id>",
  issuer: "https://login.microsoftonline.com/<your-tenant-id>/v2.0",
  scopes: [
    "openid",
    "profile",
    "email",
    "User.Read",
    "GroupMember.Read.All" // For group-based access control
  ],
}
```

### Protected Routes

Protect specific documentation routes using the `protectedRoutes` configuration:

```typescript
{
  // ... other configuration
  authentication: {
    type: "openid",
    // ... Azure AD config
  },
  protectedRoutes: [
    "/api/*",        // Protect all API documentation
    "/internal/*",   // Protect internal documentation
    "/admin/*"       // Protect admin sections
  ],
}
```

## Advanced Configuration

### Conditional Access Policies

Azure AD supports conditional access policies that can:

- Require multi-factor authentication
- Restrict access by location
- Enforce device compliance
- Control session lifetime

Configure these in Azure AD Portal under **Security** → **Conditional Access**.

### App Roles and Groups

To implement role-based access control:

1. In your app registration, go to **App roles**
2. Create custom roles (e.g., "Documentation.Read", "Documentation.Admin")
3. Assign roles to users or groups in **Enterprise applications**
4. Access role claims in your application

### B2B Guest Access

To allow external partners access:

1. Enable B2B collaboration in Azure AD
2. Configure external collaboration settings
3. Invite guest users to your directory
4. Grant appropriate permissions to your application

## User Data

Azure AD provides rich user profile data through OpenID Connect:

- `name` - User's display name
- `email` - User's email address
- `picture` - Profile picture URL (when available)
- `email_verified` - Email verification status
- `preferred_username` - User's UPN (User Principal Name)
- Additional claims based on your API permissions

## Troubleshooting

### Common Issues

1. **Invalid Client Error**: Ensure the client ID is correct and the application is properly
   registered.

2. **Redirect URI Mismatch**: The redirect URI must exactly match one configured in Azure AD,
   including protocol and path.

3. **Tenant Access Issues**: For single-tenant apps, ensure users are from the correct tenant. For
   multi-tenant, verify the issuer URL uses "common" or "organizations".

4. **Missing User Information**: Check that required API permissions are granted and admin consent
   is provided if needed.

5. **Token Validation Errors**: Ensure your issuer URL is correct and includes the `/v2.0` endpoint
   for the Microsoft identity platform.

6. **Authentication Not Working**: Make sure you have installed `@azure/msal-browser` to your
   project.

## Security Best Practices

- Use single-tenant configuration unless multi-tenant is specifically required
- Implement conditional access policies for sensitive documentation
- Regularly review and audit app permissions
- Monitor sign-in logs in Azure AD for suspicious activity
- Use app roles for fine-grained access control

## Next Steps

- Explore
  [Microsoft identity platform documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- Learn about [protecting routes](./authentication.md#protected-routes) in your documentation
- Implement
  [app roles](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-add-app-roles-in-azure-ad-apps)
  for advanced authorization
