---
title: Managing API Keys and Identities
sidebar_label: API Keys and Identities
sidebar_icon: key-square
---

## Managing API Keys in UI

Zudoku comes with a Plugin to manage API keys in the UI. This plugin is build around the concept of API consumers, where each consumer can have multiple API keys. It includes functionality for creating, viewing, updating, and deleting API keys, as well as managing consumer information.

:::note

The most convenient way to use this plugin is to use it in Zuplo. However the plugin can be used with any other API key management system - you can use a 3rd party API key management system or build your own and still use the Zudoku UI.

:::

## Using in Zuplo

To get started with a basic setup, simply enable `apiKeys` in your config. (In the default template, this is already enabled.)

```typescript title=zudoku.config.ts
{
  // ...
  apiKeys: {
    enabled: true;
  }
}
```

This will make the API Key UI available at `/settings/api-keys` in your Zudoku.

### Creating API Keys

By default, there is no **Create API Key** Button. To get the button working you have to implement the `createKey` callback in your config. This callback is called when the user clicks the **Create API Key** button. The callback is passed the `apiKey` object that the user has entered, the `context` object, and the `auth` object. The `apiKey` object is the object that the user has entered in the Create API Key form.

In this callback you can implement the logic to create a new API key. You can use the `auth` object to access the current users auth state. Most likley you want to call your API to create a new API key.

```typescript title=zudoku.config.ts
const config = {
  // ...
  apiKeys: {
    enabled: true,
    createKey: async ({ apiKey, context, auth }) => {
      const createApiKeyRequest = new Request("https://api.example.com/v1/developer/api-key", {
        method: "POST",
        body: JSON.stringify({
          apiKey,
        }),
      });

      // Sign the request using current users Authentication
      const signedRequest = await context.signRequest(createApiKeyRequest);

      const response = await fetch(signedRequest);

      if (!response.ok) {
        throw new Error("Could not create API Key");
      }

      return true;
    },
  },
};
```

## Using with any API Key Management System

```typescript
interface ApiKeyService {
  getConsumers: (context: ZudokuContext) => Promise<ApiConsumer[]>;
  rollKey?: (consumerId: string, context: ZudokuContext) => Promise<void>;
  deleteKey?: (consumerId: string, keyId: string, context: ZudokuContext) => Promise<void>;
  updateConsumer?: (consumer: { id: string; label?: string }, context: ZudokuContext) => Promise<void>;
  getUsage?: (apiKeys: string[], context: ZudokuContext) => Promise<void>;
  createKey?: ({ apiKey, context, auth }: { apiKey: { description: string; expiresOn?: string }; context: ZudokuContext; auth: UseAuthReturn }) => Promise<void>;
}

interface ApiConsumer {
  id: string;
  label: string;
  keys: ApiKey[];
}

interface ApiKey {
  id: string;
  key: string;
  description?: string;
  createdOn: string;
  expiresOn?: string;
}
```

### Implementing API Key Management

Here's a step-by-step guide to implementing API key management:

1. First, create a service that implements the `ApiKeyService` interface:

```typescript title=zudoku.config.ts
const config = {
  // ...
  apiKeys: {
    enabled: true,

    // Retrieve all API consumers and their keys
    getConsumers: async (context) => {
      // Implement fetching consumers from your storage
      // Each consumer can have multiple API keys
      return consumers;
    },

    // Create a new API key for a consumer
    createKey: async ({ apiKey, context, auth }) => {
      const newKey: ApiKey = {
        id: crypto.randomUUID(),
        key: `key-${crypto.randomUUID()}`,
        description: apiKey.description,
        createdOn: new Date().toISOString(),
        expiresOn: apiKey.expiresOn,
      };
      // Save the new key to your storage
      // Associate it with the current user/consumer
    },

    // Delete an API key
    deleteKey: async (consumerId, keyId, context) => {
      // Remove the key from the consumer's keys in your storage
    },

    // Regenerate an API key
    rollKey: async (consumerId, context) => {
      // Update the key value for the consumer while maintaining metadata
    },

    // Update consumer information
    updateConsumer: async (consumer, context) => {
      // Update the consumer's label or other metadata
    },

    // Get API usage statistics (optional)
    getUsage: async (apiKeys, context) => {
      // Fetch usage data for the provided API keys
    },
  },
};
```
