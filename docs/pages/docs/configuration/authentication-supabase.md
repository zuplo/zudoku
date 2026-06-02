---
title: Supabase Setup
sidebar_label: Supabase
description:
  Learn how to set up Supabase authentication for Zudoku using email and password or OAuth providers
  for secure documentation access.
---

Supabase is an open-source Firebase alternative that provides authentication, database, and storage
services. This guide shows you how to integrate Supabase authentication with your Zudoku
documentation site.

You can use **email and password** (Supabase signs users in with an email address and password),
**OAuth providers** (GitHub, Google, and so on), or both. Follow the section that matches how you
want users to sign in.

## Prerequisites

You'll need a Supabase project. If you don't have one,
[create a free Supabase project](https://supabase.com/dashboard) to get started.

## Setup Steps for Email and Password

Use this path when users should sign up and sign in with an email address and password managed by
Supabase.

<Stepper>

<a id="configure-email-sign-in"></a>

1. **Enable email authentication in Supabase**

   In your [Supabase Dashboard](https://supabase.com/dashboard):
   - Select the project you are going to use
   - Go to **Authentication** → **Configuration** → **Sign In / Providers**
   - Under **Email**, ensure **Email sign-in** is enabled
   - Decide whether new users must confirm their email before signing in (see **Confirm email** in
     the same area). If confirmation is required, Supabase sends a link that returns users to your
     Zudoku portal (see [Authentication Routes](#authentication-routes))

2. **Copy your Supabase URL and publishable key**

   From your Supabase project dashboard:
   - Go to **Project Settings** → **Integrations** → **Data API**
   - Copy your **API URL** (looks like `https://your-project-id.supabase.co`)
   - Go to **Configuration** → **API Keys**
   - Copy your **publishable** key (looks like `sb_publishable_...`)

3. **Configure Zudoku**

   Add the following to your [Zudoku configuration file](./overview.md). Omit `providers` or set it
   to an empty array when you are only using email and password:

   ```ts title="zudoku.config.ts"
   export default {
     // ... other configuration
     authentication: {
       type: "supabase",
       providers: [],
       supabaseUrl: "https://your-project.supabase.co",
       supabaseKey: "<your-publishable-key>",
     },
     // ... other configuration
   };
   ```

4. **Install Supabase dependencies**

   Install the packages Zudoku expects for the Supabase client and auth UI:

   ```bash
   npm install @supabase/supabase-js
   ```

5. **Configure redirect URLs in Supabase**

   Supabase only redirects to URLs you allow. This matters for **email confirmation**, **password
   reset**, and **magic links** (if you use them elsewhere).

   From your Supabase project dashboard, go to **Authentication** → **Configuration** → **URL
   Configuration** and set:
   - **Site URL**: Your primary deployed URL (for example `https://docs.example.com`), or
     `http://localhost:3000` while developing locally.
   - **Redirect URLs**: Include every origin where your docs run, with a path wildcard so deep links
     work, for example:
     - Production: `https://docs.example.com/**`
     - Local dev: `http://localhost:3000/**`

   Use the same origins and [base path](./overview.md) you use in the browser.

</Stepper>

## Setup Steps for Authentication Providers

Use this path when users should sign in with OAuth (for example GitHub or Google). Set
`onlyThirdPartyProviders: true` if you do not want email and password fields on the sign-in and
sign-up pages.

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
   publishable key from the previous step. Include every OAuth provider you enabled in Supabase in
   the `providers` array (see [Supported Providers](#supported-providers)):

   ```ts title="zudoku.config.ts"
   export default {
     // ... other configuration
     authentication: {
       type: "supabase",
       providers: ["github"], // one or more providers — required for OAuth sign-in
       supabaseUrl: "https://your-project.supabase.co",
       supabaseKey: "<your-publishable-key>",
     },
     // ... other configuration
   };
   ```

4. **Install Supabase dependencies**

   Install the Supabase client and auth UI packages your Zudoku project expects:

   ```bash
   npm install @supabase/supabase-js
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

## Email and Password with OAuth

To offer **both** email/password and OAuth buttons, leave `onlyThirdPartyProviders` unset (or set it
to `false`) and list your OAuth providers in `providers`. Complete
[Enable email authentication in Supabase](#configure-email-sign-in) and
[Configure Authentication Provider](#configure-authentication-provider) as needed, then use a config
similar to:

```ts title="zudoku.config.ts"
export default {
  authentication: {
    type: "supabase",
    providers: ["github", "google"],
    supabaseUrl: "https://your-project.supabase.co",
    supabaseKey: "<your-publishable-key>",
  },
};
```

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

  // OAuth providers to show as buttons (optional for email/password-only; required for OAuth)
  // See Supported Providers — values must match Supabase provider IDs
  providers: ["google", "github"],

  // Supabase credentials (required)
  supabaseUrl: "https://your-project.supabase.co",
  supabaseKey: "<your-publishable-key>",

  // Optional: Custom base path for auth routes (default: "/")
  basePath: "/docs",

  // Optional: When true, sign-in and sign-up pages show only OAuth buttons (no email/password)
  onlyThirdPartyProviders: true,

  // Optional: When true, the sign-up UI is disabled (for invite-only setups).
  // Must also be disabled in the Supabase dashboard under
  // Authentication → Configuration → Sign In / Providers → Allow new users to sign up.
  // Defaults to false.
  disableSignUp: true,

  // Optional: send Register to a separate URL instead of /signup
  // (absolute URL → external redirect, relative path → in-app navigate)
  signUp: { url: "/register" },

  // Optional: Redirect URLs after authentication events
  redirectToAfterSignUp: "/welcome",
  redirectToAfterSignIn: "/dashboard",
  redirectToAfterSignOut: "/",
}
```

### Authentication Routes

The Supabase authentication provider automatically creates the following routes:

- `/signin` - Sign in (email and password when enabled, plus any configured OAuth providers)
- `/signup` - Sign up (same as sign-in)
- `/signout` - Sign out

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

## Invite-only sign-ups

To launch an invite-only portal where new users can only be created by an admin, set
`disableSignUp: true` in your Zudoku config **and** disable new sign-ups in the Supabase dashboard
(**Authentication** → **Configuration** → **Sign In / Providers** → clear **Allow new users to sign
up**). When `disableSignUp` is `true`:

- The "Don't have an account? Sign up." link is hidden on the sign-in page.
- The Register button is hidden on the protected-route login dialog.
- Navigating to `/signup` shows an "Invitation required" message instead of a form.

```ts title="zudoku.config.ts"
export default {
  authentication: {
    type: "supabase",
    supabaseUrl: "https://your-project.supabase.co",
    supabaseKey: "<your-publishable-key>",
    disableSignUp: true,
  },
};
```

Create users directly from the Supabase dashboard (**Authentication** → **Users** → **Add user**) or
via the Supabase admin API.

## Troubleshooting

### Common Issues

1. **OAuth sign-in shows no provider buttons**: For OAuth-only setups, add at least one provider ID
   to the `providers` array that matches a provider you enabled in Supabase. For **email and
   password only**, you can use `providers: []` — see
   [Setup Steps for Email and Password](#setup-steps-for-email-and-password).

2. **Email/password fields when you want OAuth only**: Set `onlyThirdPartyProviders: true` so the
   sign-in and sign-up screens show only OAuth buttons. Leave this unset (or `false`) when you want
   email and password fields — see
   [Setup Steps for Email and Password](#setup-steps-for-email-and-password).

3. **Invalid API key**: Use the **publishable** client key in `supabaseKey`, not the **secret**
   (service role) key.

4. **Provider Not Working**: Verify the provider is enabled in your Supabase dashboard and properly
   configured with the correct redirect URLs.

5. **Redirect URLs**: For local development, update your redirect URLs in both Supabase and the
   OAuth provider to include `http://localhost:3000`.

6. **CORS Errors**: Check that your site's domain is properly configured in Supabase's allowed URLs
   under **Authentication** → **URL Configuration**.

7. **Authentication Not Working**: Make sure you have installed `@supabase/supabase-js` in your
   project dependencies.

## Next Steps

- Explore [Supabase Auth documentation](https://supabase.com/docs/guides/auth) for advanced features
- Learn about [protecting routes](./authentication.md#protected-routes) in your documentation
