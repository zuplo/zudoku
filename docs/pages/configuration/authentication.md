---
title: Authentication
sidebar_icon: key
---

If you use a managed authentication service, such as Auth0, Clerk or OpenID you can implement this into your site and allow users to browse and interact with your documentation and API reference in a logged in state.

## Configuration

To implement the authentication option for your site, add the `authentication` property to the [Zudoku Configuration](./overview.md) file. The configuration is slightly different depending on the authentication provider you use.

### Auth0

For Auth0, you will need the `clientId` associated with the domain you are using.

You can find this in the Auth0 dashboard under [Application Settings](https://auth0.com/docs/get-started/applications/application-settings).

```typescript
{
  // ...
  authentication: {
    type: "auth0",
    domain: "yourdomain.us.auth0.com",
    clientId: "<your-auth0-clientId>",
  },
  // ...
}
```

### Clerk

For Clerk you will need the publishable key for your application. You can find this in the Clerk dashboard on the [API Keys](https://dashboard.clerk.com/last-active?path=api-keys) page.

```typescript
{
  // ...
  authentication: {
    type: "clerk",
    clerkPubKey: "<your-clerk-publishable-key>"
  },
  // ...
}
```

### OpenID

For authentication services that support OpenID, you will need to supply an `clientId` and `issuer`.

```typescript
{
  // ...
  authentication: {
    type: "openid",
    clientId: "<your-client-id>",
    issuer: "<the-issuer-url">
  },
  // ...
}
```
