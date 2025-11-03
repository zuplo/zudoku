---
title: Supabase Authentication Setup
sidebar_label: Supabase
description:
  Learn how to set up Supabase authentication for Zudoku, leveraging Supabase's Auth UI for a
  seamless authentication experience with multiple providers.
---

Supabase is an open-source Firebase alternative that provides authentication, database, and storage
services. This guide shows you how to integrate Supabase authentication with your Zudoku
documentation site using Supabase's Auth UI component for a native, embedded authentication
experience.

## Prerequisites

You'll need a Supabase project. If you don't have one,
[create a free Supabase project](https://supabase.com/dashboard) to get started.

## Setup Steps

<Stepper>

1. **Configure Authentication Providers**

   In your [Supabase Dashboard](https://supabase.com/dashboard):
   - Navigate to **Authentication** → **Providers**
   - Enable your preferred authentication providers (GitHub, Google, Azure, etc.)
   - Configure each provider's settings:
     - **Redirect URL**: `https://your-project.supabase.co/auth/v1/callback`
     - Copy any required credentials (Client ID, Client Secret) from the provider
   - You can enable multiple providers - they'll all be available in the Auth UI

2. **Get Your Project Credentials**

   From your Supabase project dashboard:
   - Go to **Settings** → **Data API**
   - Copy your **Project URL** (looks like `https://your-project.supabase.co`)
   - Go to **Settings** → **API Keys**
   - Copy your **anon public** API key

3. **Install Required Dependencies**

   Add the Supabase packages to your project:

   ```bash
   npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
   ```

4. **Configure Zudoku**

   Add the Supabase configuration to your [Zudoku configuration file](./overview.md):

   ```typescript
   // zudoku.config.ts
   export default {
     // ... other configuration
     authentication: {
       type: "supabase",
       supabaseUrl: "https://your-project.supabase.co",
       supabaseKey: "<your-anon-public-key>",
       redirectToAfterSignIn: "/",
       // Optional: specify which providers to show
       providers: ["github", "google", "azure"],
       // Optional: customize the appearance
       appearance: {
         theme: ThemeSupa, // Default theme
         variables: {
           default: {
             colors: {
               brand: "rgb(var(--brand-color))",
             },
           },
         },
       },
     },
     // ... other configuration
   };
   ```

</Stepper>

## Configuration Options

### Required Options

- **`supabaseUrl`** (string): Your Supabase project URL
- **`supabaseKey`** (string): Your Supabase anon/public API key

### Optional Options

#### Redirect Configuration

Customize where users are redirected after authentication events:

```typescript
authentication: {
  type: "supabase",
  supabaseUrl: "https://your-project.supabase.co",
  supabaseKey: "<your-anon-public-key>",
  redirectToAfterSignUp: "/welcome",    // After successful sign up
  redirectToAfterSignIn: "/dashboard",  // After successful sign in
  redirectToAfterSignOut: "/",          // After sign out
}
```

#### Provider Configuration

Control which authentication providers are displayed in the Auth UI:

```typescript
authentication: {
  type: "supabase",
  supabaseUrl: "https://your-project.supabase.co",
  supabaseKey: "<your-anon-public-key>",
  // Only show these providers (must be enabled in Supabase dashboard)
  providers: ["github", "google", "azure"],
}
```

If `providers` is not specified, all enabled providers in your Supabase project will be available.

#### Appearance Customization

Customize the look and feel of the Auth UI:

```typescript
authentication: {
  type: "supabase",
  supabaseUrl: "https://your-project.supabase.co",
  supabaseKey: "<your-anon-public-key>",
  appearance: {
    theme: ThemeSupa, // Use the default Supabase theme
    variables: {
      default: {
        colors: {
          brand: '#2563eb',
          brandAccent: '#1d4ed8',
        },
      },
    },
    className: {
      button: 'custom-button-class',
      input: 'custom-input-class',
    },
  },
}
```

## Supported Providers

Supabase supports numerous authentication providers. Any of these can be included in the `providers`
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

## Auth UI Features

The Supabase Auth UI provides several authentication methods out of the box:

### Email/Password Authentication

Users can sign up and sign in using email and password. This is enabled by default in Supabase.

### Magic Link Authentication

Users can sign in via a magic link sent to their email. Enable this in your Supabase dashboard under
**Authentication** → **Providers** → **Email**.

### OAuth Provider Authentication

Users can sign in with any OAuth provider you've enabled in your Supabase dashboard. Multiple
providers can be configured simultaneously.

## Advanced Configuration

### Custom User Metadata

Store additional user information in Supabase:

1. Create a `profiles` table in your Supabase database
2. Set up a trigger to create profile records on user signup
3. Access this data in your application through the `providerData` in the auth state

```typescript
import { useAuthState } from "zudoku/hooks";

function MyComponent() {
  const { providerData } = useAuthState();
  const session = providerData?.session;
  // Access user data from session
}
```

### Styling the Auth UI

The Auth UI can be styled to match your documentation theme. You can:

1. Use the default `ThemeSupa` theme
2. Customize colors through the `variables` option
3. Apply custom CSS classes through the `className` option
4. Create a completely custom theme

## Troubleshooting

### Common Issues

1. **Missing Dependencies**: Make sure all three packages are installed:
   - `@supabase/supabase-js`
   - `@supabase/auth-ui-react`
   - `@supabase/auth-ui-shared`

2. **Invalid API Key**: Ensure you're using the `anon public` key, not the `service_role` key.

3. **Provider Not Working**: Verify the provider is enabled in your Supabase dashboard and properly
   configured with the correct redirect URLs.

4. **Redirect URLs**: For local development, update your redirect URLs in both Supabase and the
   OAuth provider to include `http://localhost:3000`.

5. **CORS Errors**: Check that your site's domain is properly configured in Supabase's allowed URLs
   under **Authentication** → **URL Configuration**.

6. **Auth UI Not Loading**: Ensure all three Supabase packages are installed and properly configured
   in your project.

## Next Steps

- Explore [Supabase Auth documentation](https://supabase.com/docs/guides/auth) for advanced features
- Learn about [protecting routes](./authentication.md#protected-routes) in your documentation
- Customize the [Auth UI appearance](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui) to
  match your brand
