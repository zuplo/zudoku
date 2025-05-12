# Zudoku Build Processors

This document describes how to use the `zudoku.build.ts` file for extending Zudoku at build time.

## Overview

The `zudoku.build.ts` file is a TypeScript file that can be placed at the root of your project. It's used to define build-time processors and configuration for your Zudoku project. This file is executed in a Node.js environment during the build process.

## Creating a Build File

Create a file named `zudoku.build.ts` in the root of your project with the following structure:

```typescript
/**
 * Custom build-time processor example
 */
async function myCustomProcessor(schema: any): Promise<any> {
  // Manipulate the schema here
  // Must return the modified schema
  return schema;
}

/**
 * Export a default object with processors and options
 */
export default {
  // Array of processor functions
  processors: [myCustomProcessor],

  // Optional configuration options
  options: {
    // Your custom options here
  },
};
```

## Processors

Processors are functions that receive and transform schemas. Each processor:

1. Receives a schema as its input
2. Returns a modified schema or a Promise that resolves to a modified schema
3. Is executed in the order they are defined in the array

Processors are applied to all OpenAPI schemas defined in your Zudoku configuration.

## Example: Adding Custom Headers

Here's an example processor that adds a custom header to all API operations:

```typescript
async function addCustomHeaderProcessor(schema: any): Promise<any> {
  if (!schema.paths) return schema;

  // Clone the schema to avoid mutating the original
  const result = JSON.parse(JSON.stringify(schema));

  // Add a custom header parameter to all operations
  Object.keys(result.paths).forEach((path) => {
    const pathItem = result.paths[path];

    ["get", "post", "put", "delete", "patch", "options", "head"].forEach((method) => {
      if (pathItem[method]) {
        if (!pathItem[method].parameters) {
          pathItem[method].parameters = [];
        }

        // Add the custom header
        pathItem[method].parameters.push({
          name: "X-Custom-Header",
          in: "header",
          description: "Custom header added by build processor",
          required: false,
          schema: {
            type: "string",
          },
        });
      }
    });
  });

  return result;
}

export default {
  processors: [addCustomHeaderProcessor],
};
```

## Hot Reloading

The Zudoku development server watches your `zudoku.build.ts` file for changes. When you modify this file, the server automatically reloads and applies the updated processors to your schemas.

## Use Cases

Build processors are useful for:

1. Adding custom functionality to your API documentation
2. Enforcing organization-wide standards for your APIs
3. Transforming schemas based on environment or other conditions
4. Generating additional data or documentation from your schemas

## TypeScript Support

The `zudoku.build.ts` file is executed using TypeScript, so you have full access to TypeScript features and type checking.
