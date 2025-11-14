---
title: Supabase Authentication Setup
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
   - Go to **Settings** → **Data API**
   - Copy your **Project URL** (looks like `https://your-project.supabase.co`)
   - Go to **Settings** → **API Keys**
   - Copy your **anon public** API key

3. **Configure Zudoku**

   Add the Supabase configuration to your [Zudoku configuration file](./overview.md):

   ```ts title="zudoku.config.ts"
   export default {
     // ... other configuration
     authentication: {
       type: "supabase",
       providers: ["github"], // one or more providers
       supabaseUrl: "https://your-project.supabase.co",
       supabaseKey: "<your-anon-public-key>",
     },
     // ... other configuration
   };
   ```

   You can configure multiple providers:

   ```ts{title="zudoku.config.ts"}
   export default {
     // ... other configuration
     authentication: {
       type: "supabase",
       providers: ["github", "google", "azure"],
       supabaseUrl: "https://your-project.supabase.co",
       supabaseKey: "<your-anon-public-key>",
     },
     // ... other configuration
   };
   ```

4. **Install Supabase Dependencies**

   Add `@supabase/supabase-js` to your project dependencies:

   ```bash
   npm install @supabase/supabase-js @supabase/auth-ui-shared @supabase/auth-ui-react
   ```

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

:::info

Email/password authentication does not need to be specified as a provider because it is enabled by
default in Supabase. To disable email/password authentication and only use OAuth providers, set
`onlyThirdPartyProviders: true` in your configuration.

:::

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
  supabaseKey: "<your-anon-public-key>",

  // Optional: Custom base path for auth routes (default: "/")
  basePath: "/docs",

  // Optional: Disable email/password authentication, only use OAuth providers
  onlyThirdPartyProviders: true,

  // Optional: Redirect URLs after authentication events
  redirectToAfterSignUp: "/welcome",
  redirectToAfterSignIn: "/dashboard",
  redirectToAfterSignOut: "/",
}
```

### Authentication Routes

The Supabase authentication provider automatically creates the following routes:

- `/signin` - Sign in page with configured providers
- `/signup` - Sign up page with configured providers
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

2. **Invalid API Key**: Ensure you're using the `anon public` key, not the `service_role` key from
   your Supabase project settings.

3. **Provider Not Working**: Verify the provider is enabled in your Supabase dashboard and properly
   configured with the correct redirect URLs.

4. **Redirect URLs**: For local development, update your redirect URLs in both Supabase and the
   OAuth provider to include `http://localhost:3000`.

5. **CORS Errors**: Check that your site's domain is properly configured in Supabase's allowed URLs
   under **Authentication** → **URL Configuration**.

6. **Authentication Not Working**: Make sure you have installed all required dependencies:
   `@supabase/supabase-js`, `@supabase/auth-ui-react`, and `@supabase/auth-ui-shared`.

## Next Steps

- Explore [Supabase Auth documentation](https://supabase.com/docs/guides/auth) for advanced features
- Learn about [protecting routes](./authentication.md#protected-routes) in your documentation
