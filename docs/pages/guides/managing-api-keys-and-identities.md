---
sidebar_label: API Keys and Identities
sidebar_icon: key-square
---

# Managing API Keys and Identities

When building an API documentation portal, you often need to provide a way for users to authenticate their API requests. This typically involves managing API keys and different authentication identities. However, implementing a secure and user-friendly system for API key management can be complex and time-consuming. Zudoku provides a powerful solution to this problem through its API Keys and Identities system.

## Authentication Providers and API Identities

:::tip

**Authentication providers** allow your users to sign in to your documentation portal. **API Identities** allow your users to authenticate their API requests.

:::

Before diving into API Identities, it's important to understand that Zudoku separates user authentication from API authentication. Authentication providers handle how users sign in to your documentation portal, while API Identities manage how these users interact with your APIs.

Authentication providers (like Auth0 or custom JWT) handle:

- User authentication for the documentation portal
- Session management
- User authorization and access control

This separation allows you to:

- Use different authentication methods for your portal and APIs
- Manage API access independently of user authentication
- Support multiple API authentication schemes simultaneously

[Learn more about authentication providers](/configuration/authentication)

## Understanding API Identities

API Identities in Zudoku represent different authentication contexts that can be used to make API requests. These could be different environments (production, staging), different authentication methods (API key, JWT), or different service accounts.

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

In this example, we'll use Auth0 as our authentication provider and implement an API Identity for a demo API.

To add API Identities to your Zudoku configuration, you need to implement the `ApiIdentityPlugin` interface. Here's an example:

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
            const token = context.authentication?.getAccessToken();
            if (token) {
              request.headers.set("Authorization", `Bearer ${token}`);
            }
            return request;
          },
        },
      ],
    }),
  ],
};
```

When implemented, this identity will appear in the Zudoku playground.

## Managing API Keys in UI

Zudoku provides a built-in UI for managing API keys through its API Keys plugin. This includes functionality for creating, viewing, updating, and deleting API keys. Let's take a look at the API Keys plugin interface:

### The API Key Plugin

```typescript
interface ApiKeysPlugin {
  enabled: boolean;
  getKeys: (context: ZudokuContext) => Promise<ApiKey[]>;
  createKey: (apiKey: { description: string; expiresOn?: string }, context: ZudokuContext) => Promise<void>;
  deleteKey: (id: string, context: ZudokuContext) => Promise<void>;
  rollKey: (id: string, context: ZudokuContext) => Promise<void>;
  updateKeyDescription: (apiKey: { id: string; description: string }, context: ZudokuContext) => Promise<void>;
}

interface ApiKey {
  id: string;
  description: string;
  key: string;
  createdOn: string;
  expiresOn?: string;
  updatedOn?: string;
}
```

### Implementing API Key Management

Here's a step-by-step guide to implementing API key management:

1. First, create a service that implements the `ApiKeysPlugin` interface:

```typescript
// src/MyApiKeyService.ts
export const MyApiKeyService: ZudokuConfig["apiKeys"] = {
  enabled: true,

  // Retrieve all API keys
  getKeys: async (context) => {
    // Implement fetching keys from your storage
    return keys;
  },

  // Create a new API key
  createKey: async (apiKey, context) => {
    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      description: apiKey.description,
      key: `key-${crypto.randomUUID()}`,
      createdOn: new Date().toISOString(),
      expiresOn: apiKey.expiresOn,
    };
    // Save the new key to your storage
  },

  // Delete an API key
  deleteKey: async (id, context) => {
    // Remove the key from your storage
  },

  // Regenerate an API key
  rollKey: async (id, context) => {
    // Update the key value while maintaining metadata
  },

  // Update key description
  updateKeyDescription: async (apiKey, context) => {
    // Update the description in your storage
  },
};
```

2. Add the API key service to your Zudoku configuration:

```typescript
// zudoku.config.ts
import { MyApiKeyService } from "./src/MyApiKeyService";

export default {
  apiKeys: MyApiKeyService,
  // ... rest of your configuration
};
```

## Creating a Custom API Key Management Interface

While Zudoku provides a built-in UI for managing API keys, you might want to create a custom interface that better matches your documentation's design or provides additional functionality. Let's walk through creating a custom API key management page.

### 1. Create the Custom Page Component

First, create a new file in your `src` directory for your custom component:

```typescript
// src/ApiKeyManager.tsx
import { Button, Head } from "zudoku/components";
import { useZudoku } from "zudoku";
import { useState } from "react";

export function ApiKeyManager() {
  const { apiKeys } = useZudoku();
  const [description, setDescription] = useState("");
  const [expiresOn, setExpiresOn] = useState("");

  if (!apiKeys) {
    return <div>API key management is not enabled.</div>;
  }

  const { keys, createKey, deleteKey, rollKey, updateKeyDescription } = apiKeys;

  const handleCreateKey = async () => {
    await createKey({
      description,
      expiresOn: expiresOn || undefined,
    });
    setDescription("");
    setExpiresOn("");
  };

  return (
    <div>
      <Head>
        <title>API Key Management</title>
      </Head>

      {/* Create new key form */}
      <div className="create-key">
        <h2>Create New API Key</h2>
        <div>
          <input
            type="text"
            placeholder="Key description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="date"
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
          />
          <Button onClick={handleCreateKey}>Create Key</Button>
        </div>
      </div>

      {/* List existing keys */}
      <div className="key-list">
        <h2>Your API Keys</h2>
        {keys.map((key) => (
          <div key={key.id} className="key-item">
            <div>
              <h3>{key.description}</h3>
              <code>{key.key}</code>
              {key.expiresOn && (
                <p>Expires: {new Date(key.expiresOn).toLocaleDateString()}</p>
              )}
            </div>
            <div className="actions">
              <Button
                onClick={() =>
                  updateKeyDescription({
                    id: key.id,
                    description: prompt("New description:", key.description) || key.description,
                  })
                }
              >
                Edit
              </Button>
              <Button onClick={() => rollKey(key.id)}>Roll</Button>
              <Button onClick={() => deleteKey(key.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Add the Custom Page to Zudoku

Configure your custom page in the Zudoku configuration file:

```typescript
// zudoku.config.ts
import { ApiKeyManager } from "./src/ApiKeyManager";

export default {
  // ... other configuration
  customPages: [
    {
      path: "/api-keys",
      element: <ApiKeyManager />,
    },
  ],
};
```

### 3. Using the useZudoku Hook

The `useZudoku` hook provides access to all API key management functionality through the `apiKeys` object:

```typescript
interface ApiKeys {
  keys: ApiKey[];
  createKey: (key: { description: string; expiresOn?: string }) => Promise<void>;
  deleteKey: (id: string) => Promise<void>;
  rollKey: (id: string) => Promise<void>;
  updateKeyDescription: (key: { id: string; description: string }) => Promise<void>;
}

interface ApiKey {
  id: string;
  description: string;
  key: string;
  createdOn: string;
  expiresOn?: string;
  updatedOn?: string;
}
```

The hook provides:

- `keys`: Array of current API keys
- `createKey`: Create a new API key
- `deleteKey`: Delete an existing key
- `rollKey`: Regenerate a key while maintaining its metadata
- `updateKeyDescription`: Update a key's description

### Best Practices for Custom Interfaces

1. **Error Handling**:

   - Add proper error handling for API operations
   - Show loading states during async operations
   - Provide clear feedback for successful/failed operations

2. **User Experience**:

   - Add confirmation dialogs for destructive actions
   - Show success/error notifications
   - Implement proper form validation

3. **Security**:

   - Don't store API keys in local storage
   - Implement proper access controls
   - Consider adding copy-to-clipboard functionality

4. **Styling**:
   - Match your documentation's design system
   - Ensure responsive design
   - Add proper loading and error states

By creating a custom interface, you have complete control over the API key management experience while leveraging Zudoku's built-in functionality through the `useZudoku` hook.
