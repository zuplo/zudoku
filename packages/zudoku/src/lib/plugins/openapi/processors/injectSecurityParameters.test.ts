import type { OpenAPIV3_1 } from "openapi-types";
import { describe, expect, it } from "vitest";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import { injectSecurityParameters } from "./injectSecurityParameters.js";

describe("injectSecurityParameters", () => {
  it("should inject header parameter for apiKey security scheme", () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.3",
      info: { title: "Test API", version: "1.0.0" },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
            description: "API Key authentication",
          },
        },
      },
      paths: {
        "/test": {
          get: {
            summary: "Test endpoint",
            security: [{ ApiKeyAuth: [] }],
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    };

    const result = injectSecurityParameters()({ schema });

    const operation = result.paths?.["/test"]
      ?.get as OpenAPIV3_1.OperationObject;
    expect(operation.parameters).toBeDefined();
    expect(operation.parameters).toHaveLength(1);

    const param = operation.parameters?.[0] as OpenAPIV3_1.ParameterObject;
    expect(param.name).toBe("X-API-Key");
    expect(param.in).toBe("header");
    expect(param.required).toBe(true);
    expect(param.schema).toEqual({ type: "string" });
    expect(param.description).toBe("API Key authentication");
  });

  it("should inject query parameter for apiKey security scheme", () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.3",
      info: { title: "Test API", version: "1.0.0" },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "query",
            name: "api_key",
          },
        },
      },
      paths: {
        "/test": {
          get: {
            summary: "Test endpoint",
            security: [{ ApiKeyAuth: [] }],
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    };

    const result = injectSecurityParameters()({ schema });

    const operation = result.paths?.["/test"]
      ?.get as OpenAPIV3_1.OperationObject;
    expect(operation.parameters).toBeDefined();
    expect(operation.parameters).toHaveLength(1);

    const param = operation.parameters?.[0] as OpenAPIV3_1.ParameterObject;
    expect(param.name).toBe("api_key");
    expect(param.in).toBe("query");
    expect(param.required).toBe(true);
  });

  it("should handle global security requirements", () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.3",
      info: { title: "Test API", version: "1.0.0" },
      security: [{ ApiKeyAuth: [] }],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
          },
        },
      },
      paths: {
        "/test": {
          get: {
            summary: "Test endpoint",
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    };

    const result = injectSecurityParameters()({ schema });

    const operation = result.paths?.["/test"]
      ?.get as OpenAPIV3_1.OperationObject;
    expect(operation.parameters).toBeDefined();
    expect(operation.parameters).toHaveLength(1);

    const param = operation.parameters?.[0] as OpenAPIV3_1.ParameterObject;
    expect(param.name).toBe("X-API-Key");
  });

  it("should not duplicate existing parameters", () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.3",
      info: { title: "Test API", version: "1.0.0" },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
          },
        },
      },
      paths: {
        "/test": {
          get: {
            summary: "Test endpoint",
            security: [{ ApiKeyAuth: [] }],
            parameters: [
              {
                name: "X-API-Key",
                in: "header",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    };

    const result = injectSecurityParameters()({ schema });

    const operation = result.paths?.["/test"]
      ?.get as OpenAPIV3_1.OperationObject;
    expect(operation.parameters).toHaveLength(1);
  });

  it("should preserve existing parameters", () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.3",
      info: { title: "Test API", version: "1.0.0" },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
          },
        },
      },
      paths: {
        "/test/{id}": {
          get: {
            summary: "Test endpoint",
            security: [{ ApiKeyAuth: [] }],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    };

    const result = injectSecurityParameters()({ schema });

    const operation = result.paths?.["/test/{id}"]
      ?.get as OpenAPIV3_1.OperationObject;
    expect(operation.parameters).toHaveLength(2);

    const apiKeyParam = operation
      .parameters?.[0] as OpenAPIV3_1.ParameterObject;
    expect(apiKeyParam.name).toBe("X-API-Key");

    const idParam = operation.parameters?.[1] as OpenAPIV3_1.ParameterObject;
    expect(idParam.name).toBe("id");
  });

  it("should skip non-apiKey security schemes", () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.3",
      info: { title: "Test API", version: "1.0.0" },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
      paths: {
        "/test": {
          get: {
            summary: "Test endpoint",
            security: [{ BearerAuth: [] }],
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    };

    const result = injectSecurityParameters()({ schema });

    const operation = result.paths?.["/test"]
      ?.get as OpenAPIV3_1.OperationObject;
    expect(operation.parameters).toBeUndefined();
  });

  it("should handle multiple security schemes", () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.3",
      info: { title: "Test API", version: "1.0.0" },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
          },
          ApiSecretAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Secret",
          },
        },
      },
      paths: {
        "/test": {
          get: {
            summary: "Test endpoint",
            security: [{ ApiKeyAuth: [], ApiSecretAuth: [] }],
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    };

    const result = injectSecurityParameters()({ schema });

    const operation = result.paths?.["/test"]
      ?.get as OpenAPIV3_1.OperationObject;
    expect(operation.parameters).toHaveLength(2);

    const params = operation.parameters as OpenAPIV3_1.ParameterObject[];
    expect(params.map((p) => p.name)).toEqual(["X-API-Key", "X-API-Secret"]);
  });

  it("should handle empty security array (no security)", () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.3",
      info: { title: "Test API", version: "1.0.0" },
      security: [{ ApiKeyAuth: [] }],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
          },
        },
      },
      paths: {
        "/test": {
          get: {
            summary: "Test endpoint",
            security: [], // Empty array means no security required
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    };

    const result = injectSecurityParameters()({ schema });

    const operation = result.paths?.["/test"]
      ?.get as OpenAPIV3_1.OperationObject;
    expect(operation.parameters).toBeUndefined();
  });

  it("should add default description if not provided", () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.3",
      info: { title: "Test API", version: "1.0.0" },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
            // No description provided
          },
        },
      },
      paths: {
        "/test": {
          get: {
            summary: "Test endpoint",
            security: [{ ApiKeyAuth: [] }],
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    };

    const result = injectSecurityParameters()({ schema });

    const operation = result.paths?.["/test"]
      ?.get as OpenAPIV3_1.OperationObject;
    const param = operation.parameters?.[0] as OpenAPIV3_1.ParameterObject;
    expect(param.description).toBe("API key for ApiKeyAuth authentication");
  });

  it("should not modify schema without security schemes", () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.3",
      info: { title: "Test API", version: "1.0.0" },
      paths: {
        "/test": {
          get: {
            summary: "Test endpoint",
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    };

    const result = injectSecurityParameters()({ schema });

    const operation = result.paths?.["/test"]
      ?.get as OpenAPIV3_1.OperationObject;
    expect(operation.parameters).toBeUndefined();
  });

  it("should handle operation-level security overriding global security", () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.3",
      info: { title: "Test API", version: "1.0.0" },
      security: [{ ApiKeyAuth: [] }],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
          },
          OtherAuth: {
            type: "apiKey",
            in: "header",
            name: "X-Other-Key",
          },
        },
      },
      paths: {
        "/test": {
          get: {
            summary: "Test endpoint",
            security: [{ OtherAuth: [] }], // Override global security
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    };

    const result = injectSecurityParameters()({ schema });

    const operation = result.paths?.["/test"]
      ?.get as OpenAPIV3_1.OperationObject;
    expect(operation.parameters).toHaveLength(1);

    const param = operation.parameters?.[0] as OpenAPIV3_1.ParameterObject;
    expect(param.name).toBe("X-Other-Key");
  });
});
