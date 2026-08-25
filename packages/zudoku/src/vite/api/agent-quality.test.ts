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
