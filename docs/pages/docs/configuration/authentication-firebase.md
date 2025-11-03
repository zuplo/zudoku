---
title: Firebase Authentication Setup
sidebar_label: Firebase
description:
  Learn how to set up Firebase Authentication for Zudoku, leveraging Google's secure authentication
  infrastructure with multiple sign-in providers.
---

Firebase Authentication provides a comprehensive identity solution from Google, supporting
email/password authentication and federated identity providers like Google, Facebook, Twitter, and
more. This guide shows you how to integrate Firebase Authentication with your Zudoku documentation
site.

## Prerequisites

- A Google account to access Firebase Console
- A Firebase project (free tier available)
- Basic knowledge of Firebase configuration

## Setup Steps

<Stepper>

1. **Create a Firebase Project**

   In the [Firebase Console](https://console.firebase.google.com/):
   - Click **Create a project** (or select an existing project)
   - Enter your project name
   - Configure Google Analytics (optional)
   - Click **Create project**

2. **Enable Authentication**

   In your Firebase project:
   - Navigate to **Authentication** in the left sidebar
   - Click **Get started**
   - Go to the **Sign-in method** tab
   - Enable your preferred authentication providers:
     - **Email/Password**: For traditional email authentication
     - **Google**: For Google sign-in
     - **GitHub**: For GitHub authentication
     - **Microsoft**: For Microsoft account sign-in
     - And many more providers

   For each provider, you'll need to:
   - Enable the provider
   - Configure OAuth credentials (for social providers)
   - Add authorized domains

3. **Configure Authorized Domains**

   Still in the Authentication settings:
   - Go to **Settings** → **Authorized domains**
   - Add your domains:
     - Production: `your-site.com`
     - Preview: `*.your-domain.com`
     - Development: `localhost`

   Firebase automatically handles the OAuth redirect URLs for you.

4. **Get Your Firebase Configuration**

   Get your web app configuration:
   - Go to **Project settings** (gear icon)
   - Scroll to **Your apps** section
   - Click **Add app** → **Web** if you haven't already
   - Register your app with a nickname
   - Copy the Firebase configuration object

5. **Configure Zudoku**

   Add the Firebase configuration to your [Zudoku configuration file](./overview.md):

   ```typescript
   // zudoku.config.ts
   export default {
     // ... other configuration
     authentication: {
       type: "firebase",
       apiKey: "AIza...",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       appId: "1:1234567890:web:abcdef...",
       // Optional: Specify which authentication providers to enable
       providers: ["google", "github", "password"],
       // Optional: Configure redirect paths
       redirectToAfterSignIn: "/docs",
     },
     // ... other configuration
   };
   ```

   The authentication UI is built with a custom design that automatically matches Zudoku's styling.

   Where:
   - **apiKey**: Your Firebase API key
   - **authDomain**: Your Firebase auth domain
   - **projectId**: Your Firebase project ID
   - **appId**: Your Firebase app ID
   - **providers**: (Optional) Array of provider IDs (e.g., `"google"`, `"github"`, `"password"`)
   - **storageBucket**, **messagingSenderId**, **measurementId**: Optional Firebase configuration
     values

6. **Install Firebase Dependencies**

   Install the required Firebase package:

   ```bash
   npm install firebase
   # or
   pnpm add firebase
   ```

</Stepper>

## Configuration Options

### Multiple Authentication Providers

Firebase supports multiple authentication methods simultaneously. You can specify which providers to
enable in your Zudoku configuration using Firebase's official provider ID strings:

```typescript
authentication: {
  type: "firebase",
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  appId: "1:1234567890:web:abcdef...",
  // Specify multiple providers using Firebase's official provider IDs
  providers: ["google", "github", "facebook", "twitter", "password"],
}
```

**Provider IDs:**

| Provider       | Provider ID   | Firebase SDK Constant              |
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

If you don't specify the `providers` array, it defaults to `["password"]` (email/password
authentication).

**Examples:**

```typescript
// Google and GitHub OAuth only
providers: ["google", "github"];

// Email/password only
providers: ["password"];

// Mix of OAuth and email/password
providers: ["google", "github", "password"];

// Using Firebase SDK constants directly
import { GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
providers: [GoogleAuthProvider.PROVIDER_ID, EmailAuthProvider.PROVIDER_ID];
```

> **Reference**: These provider IDs are defined in the Firebase SDK. For more details, see:
>
> - [Firebase Authentication Providers](https://firebase.google.com/docs/auth/web/start)

Users can then choose their preferred sign-in method through Firebase's authentication UI.

### Custom Claims and Roles

Implement role-based access control using Firebase custom claims:

1. Set custom claims using Firebase Admin SDK (server-side)
2. Claims are automatically included in the ID token
3. Use these claims to control access in your application

### Protected Routes

Protect specific documentation routes using the `protectedRoutes` configuration:

```typescript
{
  // ... other configuration
  authentication: {
    type: "firebase",
    apiKey: "AIza...",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    appId: "1:1234567890:web:abcdef...",
    providers: ["google", "github"],
  },
  protectedRoutes: [
    "/api/*",        // Protect all API documentation
    "/internal/*",   // Protect internal documentation
    "/admin/*"       // Protect admin sections
  ],
}
```

## Advanced Configuration

### Email Verification

Enforce email verification for email/password authentication:

1. In Firebase Console, go to **Authentication** → **Templates**
2. Customize the email verification template
3. Enable email verification requirement in your app logic

### Multi-Factor Authentication

Enable MFA for enhanced security:

1. Go to **Authentication** → **Sign-in method** → **Advanced**
2. Enable **Multi-factor authentication**
3. Choose MFA methods (SMS, app-based)
4. Configure enrollment rules

### Anonymous Authentication

Allow users to browse with temporary anonymous accounts:

1. Enable **Anonymous** in the sign-in providers
2. Users can later upgrade to a permanent account
3. Useful for trial access or progressive authentication

### Security Rules Integration

Firebase Authentication integrates with other Firebase services:

- **Firestore**: Secure database access based on auth state
- **Storage**: Control file access by user
- **Functions**: Validate user tokens in serverless functions

## User Data

Firebase provides user profile data through ID tokens:

- `name` - User's display name
- `email` - User's email address
- `picture` - Profile picture URL
- `email_verified` - Email verification status
- `firebase` - Firebase-specific claims
- Custom claims added via Admin SDK

## Troubleshooting

### Common Issues

1. **Invalid Project ID**: Ensure you're using the correct Firebase project ID in both clientId and
   issuer URL.

2. **Domain Not Authorized**: Add all your domains (including localhost for development) to the
   authorized domains list.

3. **Authentication Persistence**: Firebase handles session persistence automatically, but ensure
   cookies are enabled.

4. **CORS Issues**: Firebase typically handles CORS automatically, but check your authorized domains
   if issues arise.

5. **Token Expiration**: Firebase tokens expire after 1 hour but are automatically refreshed.

## Security Best Practices

- Enable only the authentication providers you need
- Use email verification for email/password authentication
- Implement rate limiting using Firebase Security Rules
- Monitor authentication events in Firebase Console
- Regularly review authorized domains
- Use custom claims for fine-grained access control

## Migration from Other Providers

Firebase provides tools to migrate users from other authentication systems:

1. Use Firebase Admin SDK to import users
2. Support multiple authentication methods during transition
3. Gradually migrate users as they sign in

## Next Steps

- Explore [Firebase Authentication documentation](https://firebase.google.com/docs/auth)
- Learn about [protecting routes](./authentication.md#protected-routes) in your documentation
- Implement [custom claims](https://firebase.google.com/docs/auth/admin/custom-claims) for
  role-based access
- Set up [Firebase Security Rules](https://firebase.google.com/docs/rules) for additional protection
