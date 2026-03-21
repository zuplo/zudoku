import { describe, expect, it } from "vitest";
import {
  createGraphQLServer,
  getAllOperations,
  getAllSlugs,
  getAllTags,
  type OpenAPIDocument,
} from "./index.js";

const createTestSchema = (
  overrides: Partial<OpenAPIDocument> = {},
): OpenAPIDocument =>
  ({
    openapi: "3.1.0",
    info: { title: "Test API", version: "1.0.0" },
    paths: {},
    components: {},
    ...overrides,
  }) as OpenAPIDocument;

const executeQuery = async (schema: OpenAPIDocument, query: string) => {
  const server = createGraphQLServer();
  const operations = getAllOperations(schema.paths);
  const slugs = getAllSlugs(operations, schema.tags);
  const tags = getAllTags(schema);

  const response = await server.fetch(
    new Request("http://localhost/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { input: schema, type: "raw" },
      }),
    }),
    {
      schema,
      operations,
      slugs,
      tags,
    },
  );

  const result = await response.json();
  if (result.errors) {
    throw new Error(JSON.stringify(result.errors, null, 2));
  }
  return result.data;
};

describe("Security Schemes GraphQL", () => {
  describe("securitySchemes on components", () => {
    it("should return empty array when no security schemes defined", async () => {
      const schema = createTestSchema();
      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            components { securitySchemes { name type } }
          }
        }`,
      );
      expect(data.schema.components.securitySchemes).toEqual([]);
    });

    it("should resolve apiKey security scheme", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            ApiKeyAuth: {
              type: "apiKey",
              name: "X-API-Key",
              in: "header",
              description: "API key in header",
            },
          },
        },
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            components {
              securitySchemes {
                name type description in paramName scheme bearerFormat openIdConnectUrl
              }
            }
          }
        }`,
      );

      const schemes = data.schema.components.securitySchemes;
      expect(schemes).toHaveLength(1);
      expect(schemes[0]).toEqual({
        name: "ApiKeyAuth",
        type: "apiKey",
        description: "API key in header",
        in: "header",
        paramName: "X-API-Key",
        scheme: null,
        bearerFormat: null,
        openIdConnectUrl: null,
      });
    });

    it("should resolve http bearer security scheme", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            BearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            components {
              securitySchemes { name type scheme bearerFormat }
            }
          }
        }`,
      );

      expect(data.schema.components.securitySchemes[0]).toMatchObject({
        name: "BearerAuth",
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      });
    });

    it("should resolve http basic security scheme", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            BasicAuth: { type: "http", scheme: "basic" },
          },
        },
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            components {
              securitySchemes { name type scheme }
            }
          }
        }`,
      );

      expect(data.schema.components.securitySchemes[0]).toMatchObject({
        name: "BasicAuth",
        type: "http",
        scheme: "basic",
      });
    });

    it("should resolve oauth2 security scheme with flows", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            OAuth2: {
              type: "oauth2",
              flows: {
                authorizationCode: {
                  authorizationUrl: "https://example.com/auth",
                  tokenUrl: "https://example.com/token",
                  refreshUrl: "https://example.com/refresh",
                  scopes: {
                    "read:users": "Read user data",
                    "write:users": "Write user data",
                  },
                },
                clientCredentials: {
                  tokenUrl: "https://example.com/token",
                  scopes: { admin: "Admin access" },
                },
              },
            },
          },
        },
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            components {
              securitySchemes {
                name type
                flows {
                  authorizationCode {
                    authorizationUrl tokenUrl refreshUrl
                    scopes { name description }
                  }
                  clientCredentials {
                    tokenUrl
                    scopes { name description }
                  }
                  implicit { authorizationUrl }
                  password { tokenUrl }
                }
              }
            }
          }
        }`,
      );

      const oauth = data.schema.components.securitySchemes[0];
      expect(oauth.name).toBe("OAuth2");
      expect(oauth.type).toBe("oauth2");

      const authCode = oauth.flows.authorizationCode;
      expect(authCode.authorizationUrl).toBe("https://example.com/auth");
      expect(authCode.tokenUrl).toBe("https://example.com/token");
      expect(authCode.refreshUrl).toBe("https://example.com/refresh");
      expect(authCode.scopes).toEqual([
        { name: "read:users", description: "Read user data" },
        { name: "write:users", description: "Write user data" },
      ]);

      const clientCreds = oauth.flows.clientCredentials;
      expect(clientCreds.tokenUrl).toBe("https://example.com/token");
      expect(clientCreds.scopes).toEqual([
        { name: "admin", description: "Admin access" },
      ]);

      expect(oauth.flows.implicit).toBeNull();
      expect(oauth.flows.password).toBeNull();
    });

    it("should resolve openIdConnect security scheme", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            OIDC: {
              type: "openIdConnect",
              openIdConnectUrl:
                "https://example.com/.well-known/openid-configuration",
            },
          },
        },
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            components {
              securitySchemes { name type openIdConnectUrl }
            }
          }
        }`,
      );

      expect(data.schema.components.securitySchemes[0]).toMatchObject({
        name: "OIDC",
        type: "openIdConnect",
        openIdConnectUrl:
          "https://example.com/.well-known/openid-configuration",
      });
    });

    it("should resolve multiple security schemes", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            ApiKey: { type: "apiKey", name: "key", in: "query" },
            Bearer: { type: "http", scheme: "bearer" },
            OAuth: {
              type: "oauth2",
              flows: {
                clientCredentials: {
                  tokenUrl: "https://example.com/token",
                  scopes: {},
                },
              },
            },
          },
        },
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            components {
              securitySchemes { name type }
            }
          }
        }`,
      );

      expect(data.schema.components.securitySchemes).toHaveLength(3);
      expect(
        data.schema.components.securitySchemes.map((s: any) => s.name),
      ).toEqual(["ApiKey", "Bearer", "OAuth"]);
    });
  });

  describe("security on schema (global)", () => {
    it("should return null when no global security is defined", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            ApiKey: { type: "apiKey", name: "key", in: "header" },
          },
        },
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            security { schemes { scopes scheme { name type } } }
          }
        }`,
      );

      expect(data.schema.security).toBeNull();
    });

    it("should resolve global security requirements", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            ApiKey: { type: "apiKey", name: "X-Key", in: "header" },
          },
        },
        security: [{ ApiKey: [] }],
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            security {
              schemes { scopes scheme { name type paramName in } }
            }
          }
        }`,
      );

      expect(data.schema.security).toHaveLength(1);
      expect(data.schema.security[0].schemes).toHaveLength(1);
      expect(data.schema.security[0].schemes[0].scopes).toEqual([]);
      expect(data.schema.security[0].schemes[0].scheme).toMatchObject({
        name: "ApiKey",
        type: "apiKey",
        paramName: "X-Key",
        in: "header",
      });
    });

    it("should resolve OR logic (multiple requirements)", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            ApiKey: { type: "apiKey", name: "key", in: "header" },
            Bearer: { type: "http", scheme: "bearer" },
          },
        },
        security: [{ ApiKey: [] }, { Bearer: [] }],
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            security { schemes { scheme { name } } }
          }
        }`,
      );

      expect(data.schema.security).toHaveLength(2);
      expect(data.schema.security[0].schemes[0].scheme.name).toBe("ApiKey");
      expect(data.schema.security[1].schemes[0].scheme.name).toBe("Bearer");
    });

    it("should resolve AND logic (multiple schemes in one requirement)", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            ApiKey1: { type: "apiKey", name: "key1", in: "header" },
            ApiKey2: { type: "apiKey", name: "key2", in: "query" },
          },
        },
        security: [{ ApiKey1: [], ApiKey2: [] }],
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            security { schemes { scheme { name } } }
          }
        }`,
      );

      expect(data.schema.security).toHaveLength(1);
      expect(data.schema.security[0].schemes).toHaveLength(2);
      expect(data.schema.security[0].schemes[0].scheme.name).toBe("ApiKey1");
      expect(data.schema.security[0].schemes[1].scheme.name).toBe("ApiKey2");
    });

    it("should resolve scopes on security requirements", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            OAuth: {
              type: "oauth2",
              flows: {
                authorizationCode: {
                  authorizationUrl: "https://example.com/auth",
                  tokenUrl: "https://example.com/token",
                  scopes: {
                    read: "Read access",
                    write: "Write access",
                  },
                },
              },
            },
          },
        },
        security: [{ OAuth: ["read", "write"] }],
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            security { schemes { scopes scheme { name } } }
          }
        }`,
      );

      expect(data.schema.security[0].schemes[0].scopes).toEqual([
        "read",
        "write",
      ]);
    });

    it("should handle empty security array (anonymous access)", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            ApiKey: { type: "apiKey", name: "key", in: "header" },
          },
        },
        security: [{ ApiKey: [] }, {}],
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            security { schemes { scheme { name } } }
          }
        }`,
      );

      expect(data.schema.security).toHaveLength(2);
      // First requirement: ApiKey
      expect(data.schema.security[0].schemes).toHaveLength(1);
      // Second requirement: empty (anonymous access)
      expect(data.schema.security[1].schemes).toHaveLength(0);
    });

    it("should skip unknown scheme names in security requirements", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            ApiKey: { type: "apiKey", name: "key", in: "header" },
          },
        },
        security: [{ NonExistent: [] }],
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            security { schemes { scheme { name } } }
          }
        }`,
      );

      expect(data.schema.security).toHaveLength(1);
      expect(data.schema.security[0].schemes).toHaveLength(0);
    });
  });

  describe("security on operations", () => {
    it("should inherit global security when operation has none", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            Bearer: { type: "http", scheme: "bearer" },
          },
        },
        security: [{ Bearer: [] }],
        paths: {
          "/users": {
            get: {
              summary: "List users",
              responses: { "200": { description: "OK" } },
            },
          },
        },
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            operations {
              path method
              security { schemes { scheme { name type } } }
            }
          }
        }`,
      );

      const op = data.schema.operations[0];
      expect(op.security).toHaveLength(1);
      expect(op.security[0].schemes[0].scheme.name).toBe("Bearer");
    });

    it("should override global security with operation-level security", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            Bearer: { type: "http", scheme: "bearer" },
            ApiKey: { type: "apiKey", name: "key", in: "header" },
          },
        },
        security: [{ Bearer: [] }],
        paths: {
          "/admin": {
            get: {
              summary: "Admin endpoint",
              security: [{ ApiKey: [] }],
              responses: { "200": { description: "OK" } },
            },
          },
        },
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            operations {
              security { schemes { scheme { name } } }
            }
          }
        }`,
      );

      const op = data.schema.operations[0];
      expect(op.security).toHaveLength(1);
      expect(op.security[0].schemes[0].scheme.name).toBe("ApiKey");
    });

    it("should allow no auth with empty security array on operation", async () => {
      const schema = createTestSchema({
        components: {
          securitySchemes: {
            Bearer: { type: "http", scheme: "bearer" },
          },
        },
        security: [{ Bearer: [] }],
        paths: {
          "/public": {
            get: {
              summary: "Public endpoint",
              security: [],
              responses: { "200": { description: "OK" } },
            },
          },
        },
      });

      const data = await executeQuery(
        schema,
        `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            operations {
              security { schemes { scheme { name } } }
            }
          }
        }`,
      );

      const op = data.schema.operations[0];
      expect(op.security).toEqual([]);
    });
  });
});
