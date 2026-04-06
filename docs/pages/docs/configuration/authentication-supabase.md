---
title: Supabase Setup
sidebar_label: Supabase
description:
  Learn how to set up Supabase authentication for Zudoku, leveraging Supabase's built-in auth
  providers for secure documentation access.
---

Supabase is an open-source Firebase alternative that provides authentication, database, and storage
services. This guide shows you how to integrate Supabase authentication with your Zudoku
documentation site.

## Prerequisites

You'll need a Supabase project. If you don't have one,
[create a free Supabase project](https://supabase.com/dashboard) to get started.

:::info

Supabase projects often have **email and password** enabled in the dashboard by default. Zudoku's
Supabase integration is **OAuth only**: email/password and magic links are not supported.

:::

## Setup Steps

<Stepper>

<a id="configure-authentication-provider"></a>

1. **Configure Authentication Provider**

   In your [Supabase Dashboard](https://supabase.com/dashboard):
   - Select the Supabase project you are going to use
   - Navigate to **Authentication** → **Configuration** → **Sign In / Providers**
   - Enable your preferred authentication provider (GitHub, Google, Azure, etc.)
   - Follow the Supabase configuration documentation for that provider

2. **Copy your Supabase URL and publishable key**

   From your Supabase project dashboard:
   - Go to **Project Settings** → **Integrations** → **Data API**
   - Copy your **API URL** (looks like `https://your-project-id.supabase.co`)
   - Go to **Configuration** → **API Keys**
   - Copy your **publishable** key (looks like `sb_publishable_...`)

3. **Configure Zudoku**

   Add the following to your [Zudoku configuration file](./overview.md), using the API URL and
   publishable key from the previous step:

   ```ts title="zudoku.config.ts"
   export default {
     // ... other configuration
     authentication: {
       type: "supabase",
       onlyThirdPartyProviders: true,
       providers: ["github"], // one or more providers
       supabaseUrl: "https://your-project.supabase.co",
       supabaseKey: "<your-publishable-key>",
     },
     // ... other configuration
   };
   ```

4. **Install Supabase dependencies**

   Install the Supabase client and auth UI packages your Zudoku project expects:

   ```bash
   npm install @supabase/supabase-js @supabase/auth-ui-shared @supabase/auth-ui-react
   ```

5. **Configure redirect URLs in Supabase**

   Supabase only redirects back to URLs you allow. Add every environment where users sign in:

   From your Supabase project dashboard, go to **Authentication** → **Configuration** → **URL
   Configuration** and update:
   - **Site URL**: Your primary deployed URL (for example `https://docs.example.com`), or
     `http://localhost:3000` while developing locally.
   - **Redirect URLs**: Include your Zudoku site origin(s), for example:
     - Production: `https://docs.example.com/**`
     - Local dev: `http://localhost:3000/**`
     - Preview deployments: a pattern your host uses, such as `https://*.vercel.app/**`, if
       applicable.

   Use the same paths you use in the browser (including any [base path](./overview.md) prefix). If
   OAuth redirects fail or send users to the wrong host, this section is usually the cause.

</Stepper>

## Supported Providers

Supabase supports numerous authentication providers. Use any of these values in the `providers`
array:

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

## Configuring Multiple Providers

Complete [Configure Authentication Provider](#configure-authentication-provider) in the Supabase
dashboard for each provider you need, then list them in the `providers` array:

```ts title="zudoku.config.ts"
export default {
  // ... other configuration
  authentication: {
    type: "supabase",
    onlyThirdPartyProviders: true,
    providers: ["github", "google", "azure"],
    supabaseUrl: "https://your-project.supabase.co",
    supabaseKey: "<your-publishable-key>",
  },
  // ... other configuration
};
```

## Configuration Options

All available configuration options for Supabase authentication:

```ts title="zudoku.config.ts"
authentication: {
  type: "supabase",

  // Provider configuration (required)
  // Array of one or more OAuth providers to enable
  providers: ["google", "github"],

  // Supabase credentials (required)
  supabaseUrl: "https://your-project.supabase.co",
  supabaseKey: "<your-publishable-key>",

  // Optional: Custom base path for auth routes (default: "/")
  basePath: "/docs",

  // Optional: OAuth-only sign-in; Zudoku does not support Supabase email/password with this auth type
  onlyThirdPartyProviders: true,

  // Optional: Redirect URLs after authentication events
  redirectToAfterSignUp: "/welcome",
  redirectToAfterSignIn: "/dashboard",
  redirectToAfterSignOut: "/",
}
```

### Authentication Routes

The Supabase authentication provider automatically creates the following routes:

- `/signin` - Sign in page with your configured OAuth providers
- `/signup` - Sign up page with your configured OAuth providers
- `/signout` - Sign out endpoint

If you configure a custom `basePath`, these routes will be prefixed with that path (e.g.,
`/docs/signin`).

## Advanced Configuration

### User Profile Data

Zudoku automatically extracts the following user information from Supabase authentication:

- `sub` - User ID from Supabase
- `email` - User's email address
- `name` - User's full name (from `user_metadata.full_name` or `user_metadata.name`)
- `emailVerified` - Whether the email has been confirmed
- `pictureUrl` - User's avatar URL (from `user_metadata.avatar_url`)

### Additional User Metadata

To store and access additional user information beyond what's provided by Supabase authentication:

1. Create a `profiles` table in your Supabase database
2. Set up a database trigger to create profile records on user signup
3. Use the Supabase client to query this data in your application

Example profile table structure:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Troubleshooting

### Common Issues

1. **"At least one provider must be provided" Error**: You must configure the `providers` option in
   your authentication configuration with at least one authentication provider in the array.

2. **Email/password fields on sign-in**: Zudoku's Supabase integration is OAuth-only. Set
   `onlyThirdPartyProviders: true` so the sign-in and sign-up screens do not show email/password
   fields (those flows are not supported with this auth type).

3. **Invalid API key**: Use the **publishable** client key in `supabaseKey`, not the **secret**
   (service role) key.

4. **Provider Not Working**: Verify the provider is enabled in your Supabase dashboard and properly
   configured with the correct redirect URLs.

5. **Redirect URLs**: For local development, update your redirect URLs in both Supabase and the
   OAuth provider to include `http://localhost:3000`.

6. **CORS Errors**: Check that your site's domain is properly configured in Supabase's allowed URLs
   under **Authentication** → **URL Configuration**.

7. **Authentication Not Working**: Make sure you have installed all required dependencies:
   `@supabase/supabase-js`, `@supabase/auth-ui-react`, and `@supabase/auth-ui-shared`.

## Next Steps

- Explore [Supabase Auth documentation](https://supabase.com/docs/guides/auth) for advanced features
- Learn about [protecting routes](./authentication.md#protected-routes) in your documentation
