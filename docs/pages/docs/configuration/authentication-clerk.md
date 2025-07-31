---
title: Clerk Authentication Setup
sidebar_label: Clerk
description:
  Learn how to set up Clerk authentication for Zudoku, providing a seamless authentication
  experience with modern UI components and extensive customization options.
---

Clerk is a modern authentication platform that provides beautiful, customizable UI components and a
developer-friendly experience. This guide walks you through integrating Clerk authentication with
your Zudoku documentation site.

## Prerequisites

If you don't have a Clerk account, you can sign up for a [free Clerk account](https://clerk.com/)
that provides 10,000 monthly active users.

## Setup Steps

<Stepper>

1. **Create a Clerk Application**

   In the [Clerk Dashboard](https://dashboard.clerk.com/):
   - Click **Create Application**
   - Enter your application name
   - Select your preferred authentication methods (email, social providers, etc.)
   - Click **Create Application**

2. **Create a Clerk JWT Template** You need to create a JWT Template so your JWTs include name,
   email and email_verified information.

- Navigate to **JWT templates** in the [Clerk Dashboard](https://dashboard.clerk.com/)
- Create a new template by clicking **Add new template**
- Pick a name for the template
- Add the following claims
  ```json
  {
    "name": "{{user.full_name}}",
    "email": "{{user.primary_email_address}}",
    "email_verified": "{{user.email_verified}}"
  }
  ```
- Save

3. **Configure Zudoku**

   Get your publishable key from the Clerk dashboard:
   - Navigate to **API Keys** in your Clerk dashboard
   - Copy the **Publishable key**

   Use the JWT template name defined in the previous section

   Add the Clerk configuration to your [Zudoku configuration file](./overview.md):

   ```typescript
   // zudoku.config.ts
   export default {
     // ... other configuration
     authentication: {
       type: "clerk",
       clerkPubKey: "<your-clerk-publishable-key>",
       jwtTemplateName: "<your-clerk-jwt-template-name>",
     },
     // ... other configuration
   };
   ```

4. **Configure Redirect URLs (Optional)**

   If you need custom redirect behavior, configure the allowed redirect URLs in Clerk:
   - Go to **Paths** in your Clerk dashboard
   - Add your production, preview, and local development URLs to the allowed redirect URLs
   - Common patterns:
     - Production: `https://your-site.com/oauth/callback`
     - Preview (wildcard): `https://*.your-domain.com/oauth/callback`
     - Local Development: `http://localhost:3000/oauth/callback`

</Stepper>

## Troubleshooting

### Common Issues

1. **Invalid Publishable Key**: Ensure you're using the publishable key (starts with `pk_`) and not
   the secret key.

2. **Authentication Not Working**: Verify that your Clerk application is active and not in
   development mode when deploying to production.

3. **Redirect Issues**: Check that your domain is added to the allowed redirect URLs in Clerk if
   using custom redirects.

## Next Steps

- Explore [Clerk's documentation](https://clerk.com/docs) for advanced features
- Learn about [protecting routes](./authentication.md#protected-routes) in your documentation
- Configure [user roles and permissions](https://clerk.com/docs/organizations/roles-permissions) in
  Clerk
