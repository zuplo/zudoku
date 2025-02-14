# Authentication Providers in Zudoku

Authentication providers in Zudoku handle user authentication for your documentation portal. They manage how users sign in and maintain their sessions, separate from how those users interact with your APIs.

## Built-in Providers

### Auth0 Provider

The Auth0 provider allows you to integrate Auth0 authentication into your documentation portal. Here's how to configure it:

```typescript
// zudoku.config.ts
export default {
  authentication: {
    type: "auth0",
    domain: "your-domain.auth0.com",
    clientId: "your-client-id",
    audience: "optional-api-audience", // Optional: API audience for access tokens
  },
};
```

### OpenID Connect Provider

The OpenID Connect provider enables integration with any identity provider that supports the OpenID Connect protocol:

```typescript
// zudoku.config.ts
export default {
  authentication: {
    type: "openid",
    clientId: "your-client-id",
    issuer: "https://your-identity-provider.com",
    audience: "optional-api-audience", // Optional: API audience
    scopes: ["openid", "profile", "email"], // Optional: Additional scopes
  },
};
```

### Clerk Provider

The Clerk provider enables seamless integration with Clerk's authentication service:

```typescript
// zudoku.config.ts
export default {
  authentication: {
    type: "clerk",
    clerkPubKey: "pk_test_your-key-123", // or pk_live_your-key-123
  },
};
```

## Authentication Flow Configuration

### Redirect Configuration

All authentication providers support customizing the redirect behavior after authentication events. These settings help you create a smooth user experience by directing users to the appropriate pages after sign-in, sign-up, or sign-out actions.

```typescript
// zudoku.config.ts
export default {
  authentication: {
    type: "auth0", // or "clerk" or "openid"
    // ... provider-specific configuration ...

    // Redirect Configuration
    redirectToAfterSignUp: "/onboarding", // Where to send users after registration
    redirectToAfterSignIn: "/dashboard", // Where to send users after login
    redirectToAfterSignOut: "/", // Where to send users after logout
  },
};
```

#### Redirect Options

- `redirectToAfterSignUp`: (Optional) The path to redirect to after a successful sign-up

  - Default: Homepage
  - Common uses: Onboarding flow, welcome page, or dashboard
  - Example: `"/onboarding"` or `"/welcome"`

- `redirectToAfterSignIn`: (Optional) The path to redirect to after a successful sign-in

  - Default: Previous page or homepage
  - Common uses: Dashboard, profile page, or last visited page
  - Example: `"/dashboard"` or `"/profile"`

- `redirectToAfterSignOut`: (Optional) The path to redirect to after signing out
  - Default: Homepage
  - Common uses: Login page, homepage, or landing page
  - Example: `"/login"` or `"/"`

#### Best Practices for Redirects

1. **User Experience**:

   - Keep redirects intuitive and contextual
   - Maintain consistent navigation patterns
   - Consider the user's intended destination

2. **Security**:

   - Validate redirect URLs to prevent open redirects
   - Use relative paths when possible
   - Consider authentication state when choosing destinations

3. **Implementation**:
   - Use meaningful default redirects
   - Handle edge cases (e.g., invalid URLs)
   - Consider deep linking scenarios

## Protected Routes

You can protect specific routes in your documentation portal by configuring `protectedRoutes` in your Zudoku configuration. This ensures that users must be authenticated to access these routes.

### Pattern-based Protection

You can protect specific routes using glob patterns:

```typescript
// zudoku.config.ts
export default {
  protectedRoutes: ["/internal/*"],
};
```

## Security Considerations

When implementing authentication providers:

1. **Token Security**:

   - Use secure token storage methods
   - Implement proper token validation
   - Handle token expiration and renewal

2. **Session Management**:

   - Implement secure session handling
   - Consider session timeout policies
   - Handle session revocation

3. **Route Protection**:

   - Use specific patterns for route protection
   - Consider nested route implications
   - Implement proper redirect handling for protected routes

4. **User Data**:
   - Minimize stored user data
   - Implement proper data encryption
   - Follow data protection regulations

## Best Practices

1. **Configuration**:

   - Store sensitive credentials in environment variables
   - Use different auth configurations for development and production
   - Implement proper error handling for auth failures

2. **User Experience**:

   - Provide clear login/logout flows
   - Handle authentication errors gracefully
   - Implement proper redirect handling

3. **Route Protection**:

   - Start with more restrictive patterns
   - Use exclusion patterns carefully
   - Document protected routes clearly

4. **Integration**:
   - Keep authentication logic separate from business logic
   - Use middleware for consistent auth handling
   - Implement proper logging for auth events
