import { describe, expect, it } from "vitest";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import { resolveServerVariables } from "./resolveServerVariables.js";

describe("Server Variables Integration", () => {
  it("should resolve server variables in a complete OpenAPI spec", () => {
    const spec: OpenAPIDocument = {
      openapi: "3.0.2",
      info: {
        title: "Test API with Server Variables",
        version: "1.0.0",
      },
      servers: [
        {
          url: "https://api.{region}.example.com",
          variables: {
            region: {
              default: "eu-central-1",
              enum: ["eu-central-1", "us-west-1", "us-east-1"] as [
                string,
                ...string[],
              ],
              description: "The region for the API endpoint",
            },
          },
        },
        {
          url: "https://{environment}.{region}.example.com",
          variables: {
            environment: {
              default: "api",
              enum: ["api", "staging"] as [string, ...string[]],
            },
            region: {
              default: "us-east-1",
              enum: ["eu-central-1", "us-west-1", "us-east-1"] as [
                string,
                ...string[],
              ],
            },
          },
        },
      ],
      paths: {
        "/v1/users": {
          get: {
            summary: "Get users",
            operationId: "getUsers",
            responses: {
              "200": {
                description: "Successful response",
              },
            },
          },
        },
      },
    };

    // Test resolving the first server
    // biome-ignore lint/style/noNonNullAssertion: Test file - values are guaranteed to exist
    const server1 = spec.servers![0]!;
    const resolvedServer1 = resolveServerVariables(
      server1.url,
      server1.variables,
    );
    expect(resolvedServer1).toBe("https://api.eu-central-1.example.com");

    // Test resolving the second server
    // biome-ignore lint/style/noNonNullAssertion: Test file - values are guaranteed to exist
    const server2 = spec.servers![1]!;
    const resolvedServer2 = resolveServerVariables(
      server2.url,
      server2.variables,
    );
    expect(resolvedServer2).toBe("https://api.us-east-1.example.com");
  });

  it("should work with URL constructor after resolving variables", () => {
    const serverUrl = "https://api.{region}.example.com";
    const variables = {
      region: {
        default: "eu-central-1",
      },
    };

    const resolvedUrl = resolveServerVariables(serverUrl, variables);
    const path = "/v1/users";

    // This should not throw and should create a valid URL
    const url = new URL(path, resolvedUrl);

    expect(url.href).toBe("https://api.eu-central-1.example.com/v1/users");
    expect(url.hostname).toBe("api.eu-central-1.example.com");
    expect(url.pathname).toBe("/v1/users");
  });

  it("should prevent URL encoding of curly braces after resolution", () => {
    const serverUrl = "https://api.{region}.example.com";
    const variables = {
      region: {
        default: "eu-central-1",
      },
    };

    const resolvedUrl = resolveServerVariables(serverUrl, variables);

    // The resolved URL should not contain curly braces
    expect(resolvedUrl).not.toContain("{");
    expect(resolvedUrl).not.toContain("}");
    expect(resolvedUrl).not.toContain("%7B");
    expect(resolvedUrl).not.toContain("%7D");

    // And it should contain the resolved value
    expect(resolvedUrl).toContain("eu-central-1");
  });

  it("should handle path parameters separately from server variables", () => {
    const serverUrl = "https://api.{region}.example.com";
    const serverVariables = {
      region: {
        default: "eu-central-1",
      },
    };

    const resolvedServerUrl = resolveServerVariables(
      serverUrl,
      serverVariables,
    );

    // Path parameters will be encoded by the URL constructor (this is normal)
    const pathWithParams = "/v1/users/{userId}";

    const url = new URL(pathWithParams, resolvedServerUrl);

    // Server variables should be resolved
    expect(url.hostname).toBe("api.eu-central-1.example.com");

    // Path parameters will be URL-encoded by the URL constructor
    // (they are handled separately by the createUrl function which replaces them before URL construction)
    expect(url.pathname).toBe("/v1/users/%7BuserId%7D");

    // But our resolved server URL should not contain curly braces
    expect(resolvedServerUrl).toBe("https://api.eu-central-1.example.com");
  });
});
