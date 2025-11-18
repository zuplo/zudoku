---
title: Authentication Providers & API Identities
sidebar_label: Authentication and Identities
zuplo:
  warning: |
    This guide shows how to implement your own API Key management system in Zudoku. This is typically not needed when using Zuplo's built-in API Key management system. You only need to implement this if you want to integrate with a custom or third-party identity management system.
---

When building an API documentation portal, you often need to provide a way for users to authenticate
their API requests. This typically involves managing API keys and different authentication
identities. However, implementing a secure and user-friendly system for API key management can be
complex and time-consuming. Zudoku provides a powerful solution to this problem through its API Keys
and Identities system.

## Authentication Providers and API Identities

:::tip

**Authentication providers** allow your users to sign in to your documentation portal. **API
Identities** allow your users to authenticate their API requests.

:::

Before diving into API Identities, it's important to understand that Zudoku separates user
authentication from API authentication. Authentication providers handle how users sign in to your
documentation portal, while API Identities manage how these users interact with your APIs.

Authentication providers (like Auth0 or custom JWT) handle:

- User authentication for the documentation portal
- Session management
- User authorization and access control

This separation allows you to:

- Use different authentication methods for your portal and APIs
- Manage API access independently of user authentication
- Support multiple API authentication schemes simultaneously

[Learn more about authentication providers](../configuration/authentication)

## Understanding API Identities

API Identities in Zudoku represent different authentication contexts that can be used to make API
requests. These could be different environments (production, staging), different authentication
methods (API key, JWT), or different service accounts.

### The API Identity Interface

```typescript
interface ApiIdentity {
  id: string;
  label: string;
  authorizeRequest: (request: Request) => Promise<Request> | Request;
}

interface ApiIdentityPlugin {
  getIdentities: () => Promise<ApiIdentity[]> | ApiIdentity[];
}
```

Each API Identity consists of:

- `id`: A unique identifier for the identity
- `label`: A human-readable name shown in the UI
- `authorizeRequest`: A function that modifies requests to include the necessary authentication

## Implementing API Identities

In this example, we'll use Auth0 as our authentication provider and implement an API Identity for a
demo API.

:::note

This example shows how to implement API Identities in Zudoku. If you're using Zuplo and you are
using the built-in API Key management system, you don't need to implement this yourself. Zuplo will
handle API Identities for you.

:::

To add API Identities to your Zudoku configuration, you need to implement the `ApiIdentityPlugin`
interface. Here's an example:

```typescript
import { createApiIdentityPlugin } from "zudoku/plugins";

export default {
  authentication: {
    type: "auth0",
    domain: "my-domain.auth0.com",
    clientId: "my-client-id",
  },
  plugins: [
    createApiIdentityPlugin({
      getIdentities: async (context) => [
        {
          id: "api-key-one",
          label: "My API Key",
          authorizeRequest: (request) => {
            // We get the access token from the
            // authentication provider (Auth0) and add it to the request headers
            return context.authentication?.signRequest(request);
          },
        },
      ],
    }),
  ],
};
```

When implemented, this identity will appear in the Zudoku playground.
