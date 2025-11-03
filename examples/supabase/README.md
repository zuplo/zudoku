# Supabase Authentication Example

This example demonstrates how to use Supabase authentication with Zudoku using the Supabase Auth UI
for an embedded authentication experience.

## Features

- **Multiple OAuth Providers**: Support for GitHub, Google, and other OAuth providers in a single UI
- **Email/Password Authentication**: Users can sign up with email and password
- **Magic Link Authentication**: Users can sign in via magic links
- **Custom UI**: Embedded Auth UI instead of redirects for a better user experience
- **Protected Routes**: Demonstrates route protection with authentication
- **API Keys**: Shows integration with API key management

## Getting Started

### Prerequisites

1. A Supabase project - [Create one for free](https://supabase.com/dashboard)
2. OAuth providers configured in your Supabase dashboard (e.g., GitHub, Google)

### Setup

1. **Configure OAuth Providers in Supabase Dashboard**
   - Navigate to **Authentication** → **Providers**
   - Enable GitHub, Google, or other providers you want to use
   - Configure each provider with their respective credentials
   - Set the redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

2. **Update Configuration**

   Edit `zudoku.config.ts` with your Supabase credentials:

   ```typescript
   authentication: {
     type: "supabase",
     supabaseUrl: "https://your-project.supabase.co",
     supabaseKey: "your-anon-public-key",
     providers: ["github", "google"], // Specify which providers to show
     appearance: {
       variables: {
         default: {
           colors: {
             brand: "#2563eb",
             brandAccent: "#1d4ed8",
           },
         },
       },
     },
   }
   ```

3. **Install Dependencies**

   ```bash
   pnpm install
   ```

4. **Run the Example**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration Options

### Providers

The `providers` array determines which authentication providers are shown in the Auth UI:

```typescript
providers: ["github", "google", "azure"];
```

If omitted, all enabled providers in your Supabase project will be available.

### Appearance

Customize the Auth UI to match your brand:

```typescript
appearance: {
  variables: {
    default: {
      colors: {
        brand: '#your-brand-color',
        brandAccent: '#your-brand-accent',
      },
    },
  },
  className: {
    button: 'custom-button-class',
    input: 'custom-input-class',
  },
}
```

### Protected Routes

This example protects certain routes with authentication:

```typescript
protectedRoutes: ["/documentation/installation", "/api/*"];
```

Users must sign in to access these pages.

## How It Works

1. **Auth UI Integration**: When users navigate to `/signin` or `/signup`, they see an embedded
   Supabase Auth UI component instead of being redirected to an external page.

2. **Multiple Auth Methods**: The Auth UI supports:
   - OAuth providers (GitHub, Google, etc.)
   - Email/password authentication
   - Magic link authentication (if enabled in Supabase)

3. **Session Management**: Supabase handles session persistence and token refresh automatically.

4. **Route Protection**: Protected routes check authentication status and redirect unauthenticated
   users to the sign-in page.

## Project Structure

```
examples/supabase/
├── pages/              # MDX documentation pages
│   └── documentation/
├── public/             # Static assets (logos, etc.)
├── zudoku.config.ts    # Zudoku configuration with Supabase auth
├── package.json        # Dependencies including Supabase packages
└── README.md          # This file
```

## Learn More

- [Zudoku Supabase Authentication Documentation](../../docs/pages/docs/configuration/authentication-supabase.md)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Auth UI Documentation](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)

## Troubleshooting

### Auth UI Not Loading

Make sure all three Supabase packages are installed:

```bash
pnpm add @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
```

### Provider Not Showing

Verify the provider is:

1. Enabled in your Supabase dashboard
2. Properly configured with client credentials
3. Included in the `providers` array in your config

### OAuth Authentication Errors

If you encounter errors like "Error getting user profile from external provider" when signing in
with an OAuth provider (GitHub, Google, etc.):

1. **Check OAuth App Configuration**: In your GitHub/Google/etc. developer console:
   - Verify the OAuth app's Client ID and Secret match what's configured in Supabase
   - Ensure the authorization callback URL is set to:
     `https://your-project.supabase.co/auth/v1/callback`
   - Check that all required scopes/permissions are granted (email, profile, etc.)

2. **Verify Supabase Configuration**: In your Supabase dashboard under Authentication → Providers:
   - Ensure the provider is enabled
   - Client ID and Client Secret are correctly entered
   - Site URL is configured correctly
   - Redirect URLs include your development and production URLs

3. **Development vs Production URLs**:
   - For local development: Add `http://localhost:3000` to your provider's authorized redirect URLs
   - For production: Use your actual domain URL

Error details will be displayed on the sign-in page to help diagnose authentication issues.

### Local Development

For local development, update your OAuth provider's redirect URLs to include
`http://localhost:3000`.

## Next Steps

- Add more OAuth providers in your Supabase dashboard
- Customize the Auth UI appearance to match your brand
- Implement row-level security (RLS) in your Supabase database
- Add custom user metadata and profile management
