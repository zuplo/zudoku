# Firebase Authentication Example

This example demonstrates how to use Firebase authentication with Zudoku using the Firebase Auth UI
for an embedded authentication experience.

## Features

- **Multiple OAuth Providers**: Support for Google, GitHub, Facebook, Twitter, Microsoft, and other
  OAuth providers in a single UI
- **Email/Password Authentication**: Users can sign up with email and password
- **Email Link Authentication**: Passwordless sign-in via magic link sent to email
- **Custom UI**: Embedded Auth UI instead of redirects for a better user experience
- **Protected Routes**: Demonstrates route protection with authentication
- **API Keys**: Shows integration with API key management
- **Session Management**: Automatic token refresh and session persistence

## Getting Started

### Prerequisites

1. A Firebase project - [Create one for free](https://console.firebase.google.com/)
2. OAuth providers configured in your Firebase dashboard (e.g., Google, GitHub)

### Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project" or select an existing project
   - Follow the setup wizard

2. **Enable Authentication Providers**
   - Navigate to **Authentication** → **Sign-in method**
   - Enable the providers you want to use (Google, GitHub, Email/Password, etc.)
   - For OAuth providers, configure the client credentials:
     - **Google**: Enable and configure OAuth consent screen
     - **GitHub**: Create OAuth app and add credentials
     - **Facebook/Twitter/Microsoft**: Follow provider-specific setup

3. **Add a Web App to Your Firebase Project**
   - In Firebase Console, go to **Project settings** (gear icon)
   - Scroll to "Your apps" and click the Web icon (`</>`)
   - Register your app with a nickname
   - Copy the Firebase configuration values

4. **Configure Authorized Domains**
   - Go to **Authentication** → **Settings** → **Authorized domains**
   - Add your domains:
     - `localhost` for local development
     - Your production domain(s)

5. **Update Configuration**

   Edit `zudoku.config.ts` with your Firebase credentials:

   ```typescript
   authentication: {
     type: "firebase",
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     appId: "1:123456789:web:abcdef...",
     // Optional fields
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     measurementId: "G-XXXXXXXXXX",
     // Specify which providers to show
     providers: ["google", "github"],
     redirectToAfterSignIn: "/documentation/introduction",
   }
   ```

   The authentication UI is built with a custom design that matches Zudoku's styling automatically.

6. **Install Dependencies**

   ```bash
   pnpm install
   ```

7. **Run the Example**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration Options

### Providers

The `providers` array determines which authentication providers are shown in the Auth UI:

```typescript
providers: ["google", "github", "facebook", "twitter", "microsoft"];
```

**Provider IDs:**

These are the exact provider ID strings from Firebase's SDK:

| Provider       | Provider ID   | SDK Constant                       |
| -------------- | ------------- | ---------------------------------- |
| Google         | `"google"`    | `GoogleAuthProvider.PROVIDER_ID`   |
| Facebook       | `"facebook"`  | `FacebookAuthProvider.PROVIDER_ID` |
| Twitter/X      | `"twitter"`   | `TwitterAuthProvider.PROVIDER_ID`  |
| GitHub         | `"github"`    | `GithubAuthProvider.PROVIDER_ID`   |
| Microsoft      | `"microsoft"` | `OAuthProvider('microsoft.com')`   |
| Apple          | `"apple"`     | `OAuthProvider('apple.com')`       |
| Yahoo          | `"yahoo"`     | `OAuthProvider('yahoo.com')`       |
| Email/Password | `"password"`  | `EmailAuthProvider.PROVIDER_ID`    |
| Email Link     | `"emailLink"` | Passwordless authentication        |
| Phone          | `"phone"`     | `PhoneAuthProvider.PROVIDER_ID`    |

If omitted, defaults to `["password"]` (email/password authentication).

**Example:**

```typescript
// Multiple OAuth providers
providers: ["google", "github"];

// Email/password only
providers: ["password"];

// Mix of OAuth and email
providers: ["google", "password"];
```

> **Reference**: See the
> [Firebase Authentication documentation](https://firebase.google.com/docs/auth/web/start) for more
> details.

### Protected Routes

This example protects certain routes with authentication:

```typescript
protectedRoutes: ["/documentation/installation", "/api/*"];
```

Users must sign in to access these pages.

## How It Works

1. **Auth UI Integration**: When users navigate to `/signin` or `/signup`, they see an embedded
   Firebase Auth UI component instead of being redirected to an external page.

2. **Multiple Auth Methods**: The Auth UI supports:
   - OAuth providers (Google, GitHub, Facebook, etc.)
   - Email/password authentication
   - Additional methods like phone authentication (if configured)

3. **Session Management**: Firebase handles session persistence and token refresh automatically
   using IndexedDB for storage.

4. **Route Protection**: Protected routes check authentication status and redirect unauthenticated
   users to the sign-in page.

## Project Structure

```
examples/firebase/
├── pages/              # MDX documentation pages
│   └── documentation/
├── public/             # Static assets (logos, etc.)
├── zudoku.config.ts    # Zudoku configuration with Firebase auth
├── package.json        # Dependencies including Firebase packages
└── README.md          # This file
```

## Learn More

- [Zudoku Firebase Authentication Documentation](../../docs/pages/docs/configuration/authentication-firebase.md)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Web Setup Guide](https://firebase.google.com/docs/web/setup)

## Troubleshooting

### Auth UI Not Loading

Make sure Firebase package is installed:

```bash
pnpm add firebase
```

### Provider Not Showing

Verify the provider is:

1. Enabled in your Firebase Console under Authentication → Sign-in method
2. Properly configured with client credentials (for OAuth providers)
3. Included in the `providers` array in your config

### OAuth Authentication Errors

If you encounter OAuth authentication errors:

1. **Check OAuth App Configuration**: In your provider's developer console (GitHub, Google, etc.):
   - Verify the OAuth app's Client ID and Secret match what's configured in Firebase
   - Ensure the authorization callback URL is set correctly
   - Check that all required scopes/permissions are granted

2. **Verify Firebase Configuration**: In Firebase Console under Authentication → Sign-in method:
   - Ensure the provider is enabled
   - Client ID and Client Secret are correctly entered
   - Check the OAuth redirect domain is correct

3. **Check Authorized Domains**:
   - Go to Authentication → Settings → Authorized domains
   - Add `localhost` for development
   - Add your production domain(s)

### Configuration Errors

If you see "Firebase configuration is invalid":

1. Double-check all configuration values in `zudoku.config.ts`
2. Ensure there are no typos in `apiKey`, `authDomain`, `projectId`, and `appId`
3. Verify these values match exactly what's shown in Firebase Console → Project Settings

### Local Development

For local development:

- Ensure `localhost` is added to Firebase's authorized domains
- Use `http://localhost:3000` (not `127.0.0.1`) for consistency
- Some OAuth providers may require additional configuration for local development

## Security Best Practices

- Never commit your Firebase configuration with production keys to public repositories
- Use environment variables for sensitive configuration in production
- Enable only the authentication providers you actually need
- Implement proper security rules in Firebase for any Firebase services you use
- Monitor authentication events in Firebase Console
- Consider enabling Multi-Factor Authentication for sensitive applications

## Next Steps

- Add more OAuth providers in your Firebase Console
- Implement custom claims for role-based access control
- Set up Firebase Security Rules if using other Firebase services
- Add user profile management features
- Configure email verification for email/password authentication
- Set up password reset functionality
