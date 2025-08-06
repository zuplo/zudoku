---
title: Transforming Operation Examples
sidebar_icon: git-compare-arrows
---

Zudoku allows you to transform operation examples in both request and response sections of your API documentation. This feature is particularly useful when you need to:

- Modify example data before displaying it
- Add dynamic values to examples
- Format examples in a specific way
- Filter or transform example content based on certain conditions

## Configuration

To use this feature, you need to configure the `transformExamples` function in your `zudoku.config.tsx` file. Here's how to do it:

```tsx
import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  // ... other config options ...
  defaults: {
    apis: {
      transformExamples: (options) => {
        // Transform the content here
        return options.content;
      },
    },
  },
};
```

## The Transform Function

The `transformExamples` function receives an options object with the following properties:

1. `content`: An array of Content objects containing the example data
1. `operation`: The operation being displayed
1. `type`: Either "request" or "response" indicating which type of example is being transformed
1. `auth`: The current authentication state
1. `context`: ZudokuContext

The function should return an array of Content objects with the transformed examples.

## Example Usage

Here's a practical example showing how to transform examples:

```tsx
const config: ZudokuConfig = {
  defaults: {
    apis: {
      transformExamples: ({ content, type }) => {
        // Example: Add a timestamp to all examples
        const timestamp = new Date().toISOString();

        return content.map((contentItem) => ({
          ...contentItem,
          example: {
            ...contentItem.example,
            timestamp,
            // You can modify other example properties here
          },
        }));
      },
    },
  },
};
```

## Use Cases

### Adding Dynamic Values

```tsx
transformExamples: ({ content, auth }) => {
  const apiKey = auth.accessToken;

  return content.map((contentItem) => ({
    ...contentItem,
    example: {
      ...contentItem.example,
      headers: {
        ...contentItem.example.headers,
        Authorization: `Bearer ${apiKey}`,
      },
    },
  }));
};
```

### Formatting Examples

```tsx
transformExamples: ({ content }) => {
  return content.map((contentItem) => ({
    ...contentItem,
    example: {
      ...contentItem.example,
      // Format dates in a specific way
      createdAt: new Date(contentItem.example.createdAt).toLocaleDateString(),
      // Format numbers with specific precision
      amount: Number(contentItem.example.amount).toFixed(2),
    },
  }));
};
```

### Conditional Transformation

```tsx
transformExamples: ({ content, auth, type }) => {
  const isAuthenticated = auth.isAuthenticated;

  return content.map((contentItem) => ({
    ...contentItem,
    example: isAuthenticated
      ? contentItem.example // Show full example for authenticated users
      : { ...contentItem.example, sensitiveData: undefined }, // Hide sensitive data for unauthenticated users
  }));
};
```

### Using JWT Claims

```tsx
transformExamples: async ({ content, auth, context }) => {
  const token = await context.authentication.getAccessToken();

  // Decode the JWT (this is a simple example - in production you might want to use a proper JWT library)
  const [, payload] = token.split(".");
  const decodedPayload = JSON.parse(atob(payload));

  return content.map((contentItem) => ({
    ...contentItem,
    example: {
      ...contentItem.example,
      // Add user-specific data from the JWT
      userId: decodedPayload.sub,
      organizationId: decodedPayload.org_id,
      // You can add any other claims from the JWT
      role: decodedPayload.role,
    },
  }));
};
```

## Best Practices

1. Always return an array of Content objects, even if you're not transforming the content
2. Preserve the original content structure while making your modifications
3. Handle errors gracefully to prevent breaking the documentation
4. Consider performance implications when transforming large examples
5. Use the provided options object to access relevant information for your transformations
