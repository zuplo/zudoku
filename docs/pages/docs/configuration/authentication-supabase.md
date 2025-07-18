---
title: Supabase Authentication Setup
sidebar_label: Supabase
description: Learn how to set up Supabase authentication for Zudoku, leveraging Supabase's built-in auth providers for secure documentation access.
---

Supabase is an open-source Firebase alternative that provides authentication, database, and storage services. This guide shows you how to integrate Supabase authentication with your Zudoku documentation site.

## Prerequisites

You'll need a Supabase project. If you don't have one, [create a free Supabase project](https://supabase.com/dashboard) to get started.

## Setup Steps

<Stepper>

1. **Configure Authentication Provider**

   In your [Supabase Dashboard](https://supabase.com/dashboard):
   - Navigate to **Authentication** → **Providers**
   - Enable your preferred authentication provider (GitHub, Google, Azure, etc.)
   - Configure the provider settings:
     - **Redirect URL**: `https://your-project.supabase.co/auth/v1/callback`
     - Copy any required credentials (Client ID, Client Secret) from the provider

2. **Get Your Project Credentials**

   From your Supabase project dashboard:
   - Go to **Settings** → **API**
   - Copy your **Project URL** (looks like `https://your-project.supabase.co`)
   - Copy your **anon public** API key

3. **Configure Zudoku**

   Add the Supabase configuration to your [Zudoku configuration file](./overview.md):

   ```typescript
   // zudoku.config.ts
   export default {
     // ... other configuration
     authentication: {
       type: "supabase",
       provider: "github", // or any supported provider
       supabaseUrl: "https://your-project.supabase.co",
       supabaseKey: "<your-anon-public-key>",
       redirectToAfterSignUp: "/",
       redirectToAfterSignIn: "/",
       redirectToAfterSignOut: "/",
     },
     // ... other configuration
   };
   ```

</Stepper>

## Supported Providers

Supabase supports numerous authentication providers. Use any of these values for the `provider` field:

- `apple` - Sign in with Apple
- `azure` - Microsoft Azure AD
- `bitbucket` - Bitbucket
- `discord` - Discord
- `facebook` - Facebook
- `figma` - Figma
- `github` - GitHub
- `gitlab` - GitLab
- `google` - Google
- `kakao` - Kakao
- `keycloak` - Keycloak
- `linkedin` / `linkedin_oidc` - LinkedIn
- `notion` - Notion
- `slack` / `slack_oidc` - Slack
- `spotify` - Spotify
- `twitch` - Twitch
- `twitter` - Twitter/X
- `workos` - WorkOS
- `zoom` - Zoom
- `fly` - Fly.io

## Configuration Options

### Redirect Configuration

Customize redirect behavior after authentication events:

```typescript
authentication: {
  type: "supabase",
  provider: "google",
  supabaseUrl: "https://your-project.supabase.co",
  supabaseKey: "<your-anon-public-key>",
  redirectToAfterSignUp: "/welcome",    // After successful sign up
  redirectToAfterSignIn: "/dashboard",  // After successful sign in
  redirectToAfterSignOut: "/",          // After sign out
}
```

## Advanced Configuration

### Custom User Metadata

Store additional user information in Supabase:

1. Create a `profiles` table in your Supabase database
2. Set up a trigger to create profile records on user signup
3. Access this data in your application as needed

## Troubleshooting

### Common Issues

1. **Invalid API Key**: Ensure you're using the `anon public` key, not the `service_role` key.

2. **Provider Not Working**: Verify the provider is enabled in your Supabase dashboard and properly configured with the correct redirect URLs.

3. **Redirect URLs**: For local development, update your redirect URLs in both Supabase and the OAuth provider to include `http://localhost:3000`.

4. **CORS Errors**: Check that your site's domain is properly configured in Supabase's allowed URLs.

## Next Steps

- Explore [Supabase Auth documentation](https://supabase.com/docs/guides/auth) for advanced features
- Learn about [protecting routes](./authentication.md#protected-routes) in your documentation
