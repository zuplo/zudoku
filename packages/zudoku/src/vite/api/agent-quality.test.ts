import { describe, expect, it } from "vitest";
import type { OpenAPIDocument } from "../../lib/oas/parser/index.js";
import {
  auditOpenApiAgentQuality,
  formatAgentQualityReport,
} from "./agent-quality.js";

const createDocument = (paths: unknown) =>
  ({
    openapi: "3.1.0",
    info: { title: "Test API", version: "1.0.0" },
    components: {},
    paths,
  }) as OpenAPIDocument;

describe("auditOpenApiAgentQuality", () => {
  it("reports function-calling compatibility gaps without mutating the schema", () => {
    const document = createDocument({
      "/widgets": {
        get: {
          operationId: "widgets",
          parameters: [{ name: "limit", in: "query" }],
          responses: { "200": { description: "OK" } },
        },
        post: {
          operationId: "widgets",
          description: "Create a widget.",
          responses: {},
        },
        put: {
          operationId: "replaceWidgets",
          description: "Replace the widgets.",
          requestBody: {
            content: { "application/json": {} },
          },
          responses: { "204": { description: "Replaced" } },
        },
      },
      "/health": {
        get: {
          description: "Check service health.",
          responses: { "204": { description: "Healthy" } },
        },
      },
    });
    const original = structuredClone(document);

    const issues = auditOpenApiAgentQuality(document);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-description",
          location: "GET /widgets",
        }),
        expect.objectContaining({
          code: "untyped-parameter",
          location: "GET /widgets",
        }),
        expect.objectContaining({
          code: "missing-response-schema",
          location: "GET /widgets",
        }),
        expect.objectContaining({
          code: "missing-response-schema",
          location: "POST /widgets",
        }),
        expect.objectContaining({
          code: "missing-request-body",
          location: "POST /widgets",
        }),
        expect.objectContaining({
          code: "untyped-request-body",
          location: "PUT /widgets",
        }),
        expect.objectContaining({
          code: "missing-operation-id",
          location: "GET /health",
        }),
        expect.objectContaining({
          code: "duplicate-operation-id",
          location: "GET /widgets, POST /widgets",
        }),
      ]),
    );
    expect(document).toEqual(original);
  });

  it("accepts typed inline and referenced parameters and responses", () => {
    const document = {
      ...createDocument({
        "/widgets/{id}": {
          parameters: [{ $ref: "#/components/parameters/WidgetId" }],
          get: {
            operationId: "getWidget",
            description: "Get a widget.",
            responses: {
              "200": { $ref: "#/components/responses/WidgetResponse" },
            },
          },
        },
      }),
      components: {
        parameters: {
          WidgetId: {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        },
        responses: {
          WidgetResponse: {
            description: "A widget.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { id: { type: "string" } },
                },
              },
            },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    expect(auditOpenApiAgentQuality(document)).toEqual([]);
  });

  it("accepts a referenced, typed request body on a write operation", () => {
    const document = {
      ...createDocument({
        "/widgets": {
          post: {
            operationId: "createWidget",
            description: "Create a widget.",
            requestBody: { $ref: "#/components/requestBodies/CreateWidget" },
            responses: { "204": { description: "Created" } },
          },
        },
      }),
      components: {
        requestBodies: {
          CreateWidget: {
            content: {
              "application/json": { schema: { type: "object" } },
            },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    expect(auditOpenApiAgentQuality(document)).toEqual([]);
  });

  it("audits only the effective parameter after operation overrides", () => {
    const document = createDocument({
      "/widgets/{id}": {
        parameters: [
          { name: "id", in: "path" },
          { name: "id", in: "query" },
          { $ref: "https://example.com/parameters.json#/External" },
        ],
        get: {
          operationId: "getWidget",
          description: "Get a widget.",
          parameters: [{ name: "id", in: "path", schema: { type: "string" } }],
          responses: {
            "200": {
              description: "A widget.",
              content: {
                "application/json": { schema: { type: "object" } },
              },
            },
          },
        },
      },
    });

    expect(
      auditOpenApiAgentQuality(document).filter(
        (issue) => issue.code === "untyped-parameter",
      ),
    ).toEqual([
      expect.objectContaining({
        message: 'Parameter "id" is missing a typed schema.',
      }),
      expect.objectContaining({
        message: 'Parameter "<unknown>" is missing a typed schema.',
      }),
    ]);
  });

  it("resolves referenced parameter identities before applying overrides", () => {
    const document = {
      ...createDocument({
        "/widgets/{id}": {
          parameters: [{ $ref: "#/components/parameters/TypedPathId" }],
          get: {
            operationId: "getWidget",
            description: "Get a widget.",
            parameters: [
              { $ref: "#/components/parameters/UntypedOperationId" },
            ],
            responses: {
              "200": {
                description: "A widget.",
                content: {
                  "application/json": { schema: { type: "object" } },
                },
              },
            },
          },
        },
      }),
      components: {
        parameters: {
          TypedPathId: {
            name: "id",
            in: "path",
            schema: { type: "string" },
          },
          UntypedOperationId: {
            name: "id",
            in: "path",
          },
        },
      },
    } as unknown as OpenAPIDocument;

    expect(auditOpenApiAgentQuality(document)).toEqual([
      expect.objectContaining({
        code: "untyped-parameter",
        location: "GET /widgets/{id}",
        message: 'Parameter "id" is missing a typed schema.',
      }),
    ]);
  });

  it("does not require content schemas for HEAD or informational responses", () => {
    const document = createDocument({
      "/widgets": {
        head: {
          operationId: "headWidgets",
          description: "Inspect widget metadata.",
          responses: { "200": { description: "Widget metadata." } },
        },
        get: {
          operationId: "getWidgets",
          description: "List widgets.",
          responses: {
            "103": { description: "Early hints." },
            "1XX": { description: "Informational response." },
          },
        },
      },
    });

    expect(auditOpenApiAgentQuality(document)).toEqual([]);
  });

  it("still requires HEAD operations to declare a response", () => {
    const document = createDocument({
      "/widgets": {
        head: {
          operationId: "headWidgets",
          description: "Inspect widget metadata.",
          responses: {},
        },
      },
    });

    expect(auditOpenApiAgentQuality(document)).toEqual([
      expect.objectContaining({
        code: "missing-response-schema",
        location: "HEAD /widgets",
        message: "Operation has no response schemas.",
      }),
    ]);
  });

  it("formats an actionable warning report", () => {
    expect(
      formatAgentQualityReport("/api", [
        {
          code: "missing-operation-id",
          location: "GET /widgets",
          message: "Operation is missing a unique operationId.",
        },
      ]),
    ).toContain(
      'Agent-quality audit for API "/api" found 1 issue:\n- [missing-operation-id] GET /widgets',
    );
  });
});
