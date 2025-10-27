// biome-ignore-all lint/suspicious/noExplicitAny: Allow any type
import { describe, expect, it } from "vitest";
import type { OpenAPIDocument } from "../parser/index.js";
import { getAllOperations } from "./index.js";

describe("Server Resolution", () => {
  it("should use global servers when no path or operation servers are defined", () => {
    const doc: OpenAPIDocument = {
      openapi: "3.0.3",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      servers: [{ url: "https://api.example.com/v1" }],
      paths: {
        "/health": {
          get: {
            responses: {
              "200": {
                description: "OK",
              },
            },
          },
        },
      },
    };

    const operations = getAllOperations(doc.paths);
    const healthOperation = operations.find((op) => op.path === "/health");

    // Operation should have empty servers array (will fallback to global in GraphQL resolver)
    expect(healthOperation?.servers).toEqual([]);
  });

  it("should use path-level servers when defined", () => {
    const doc: OpenAPIDocument = {
      openapi: "3.0.3",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      servers: [{ url: "https://api.example.com/v1" }],
      paths: {
        "/users": {
          servers: [{ url: "https://users-service.example.com/api" }],
          get: {
            responses: {
              "200": {
                description: "OK",
              },
            },
          },
          post: {
            responses: {
              "201": {
                description: "Created",
              },
            },
          },
        },
      },
    };

    const operations = getAllOperations(doc.paths);
    const getUsersOp = operations.find(
      (op) => op.path === "/users" && op.method === "get",
    );
    const postUsersOp = operations.find(
      (op) => op.path === "/users" && op.method === "post",
    );

    // Both operations should inherit path-level servers
    expect(getUsersOp?.servers).toEqual([
      { url: "https://users-service.example.com/api" },
    ]);
    expect(postUsersOp?.servers).toEqual([
      { url: "https://users-service.example.com/api" },
    ]);
  });

  it("should use operation-level servers when defined (overriding path-level)", () => {
    const doc: OpenAPIDocument = {
      openapi: "3.0.3",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      servers: [{ url: "https://api.example.com/v1" }],
      paths: {
        "/products": {
          servers: [{ url: "https://products-service.example.com/api" }],
          get: {
            responses: {
              "200": {
                description: "OK",
              },
            },
          },
          patch: {
            servers: [
              { url: "https://admin-dashboard.example.com/product-ops" },
            ],
            responses: {
              "200": {
                description: "Updated",
              },
            },
          },
        },
      },
    };

    const operations = getAllOperations(doc.paths);
    const getProductsOp = operations.find(
      (op) => op.path === "/products" && op.method === "get",
    );
    const patchProductsOp = operations.find(
      (op) => op.path === "/products" && op.method === "patch",
    );

    // GET should use path-level servers
    expect(getProductsOp?.servers).toEqual([
      { url: "https://products-service.example.com/api" },
    ]);

    // PATCH should use operation-level servers (highest precedence)
    expect(patchProductsOp?.servers).toEqual([
      { url: "https://admin-dashboard.example.com/product-ops" },
    ]);
  });

  it("should handle multiple servers at each level", () => {
    const doc: OpenAPIDocument = {
      openapi: "3.0.3",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      servers: [
        { url: "https://api.example.com/v1", description: "Production" },
        { url: "https://staging.example.com/v1", description: "Staging" },
      ],
      paths: {
        "/test": {
          servers: [
            {
              url: "https://test-service.example.com/v1",
              description: "Test Prod",
            },
            {
              url: "https://test-staging.example.com/v1",
              description: "Test Staging",
            },
          ],
          get: {
            responses: {
              "200": {
                description: "OK",
              },
            },
          },
        },
      },
    };

    const operations = getAllOperations(doc.paths);
    const testOp = operations.find((op) => op.path === "/test");

    // Should have both path-level servers
    expect(testOp?.servers).toHaveLength(2);
    expect(testOp?.servers?.[0]?.url).toBe(
      "https://test-service.example.com/v1",
    );
    expect(testOp?.servers?.[1]?.url).toBe(
      "https://test-staging.example.com/v1",
    );
  });

  it("should correctly prioritize operation > path > global servers", () => {
    const doc: OpenAPIDocument = {
      openapi: "3.0.3",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      servers: [{ url: "https://global.example.com" }],
      paths: {
        "/path-with-all-levels": {
          servers: [{ url: "https://path-level.example.com" }],
          get: {
            // No operation servers - should use path-level
            responses: { "200": { description: "OK" } },
          },
          post: {
            // Operation servers - should use these
            servers: [{ url: "https://operation-level.example.com" }],
            responses: { "201": { description: "Created" } },
          },
        },
        "/path-without-servers": {
          get: {
            // No path or operation servers - should use empty array (fallback to global)
            responses: { "200": { description: "OK" } },
          },
        },
      },
    };

    const operations = getAllOperations(doc.paths);

    const getWithPathServers = operations.find(
      (op) => op.path === "/path-with-all-levels" && op.method === "get",
    );
    const postWithOpServers = operations.find(
      (op) => op.path === "/path-with-all-levels" && op.method === "post",
    );
    const getWithoutServers = operations.find(
      (op) => op.path === "/path-without-servers" && op.method === "get",
    );

    // GET with path servers
    expect(getWithPathServers?.servers).toEqual([
      { url: "https://path-level.example.com" },
    ]);

    // POST with operation servers (overrides path)
    expect(postWithOpServers?.servers).toEqual([
      { url: "https://operation-level.example.com" },
    ]);

    // GET without any servers (will fallback to global in resolver)
    expect(getWithoutServers?.servers).toEqual([]);
  });
});
