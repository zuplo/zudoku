import { describe, expect, it } from "vitest";
import { upgradeOpenApi } from "./upgradeOpenApi.js";

const errorResponse = () => ({
  description: "Error",
  content: {
    "application/json": {
      example: { code: "WARP_FAIL" },
      schema: {
        type: "object",
        properties: {
          code: { type: "string", nullable: true, example: "WARP_FAIL" },
          retries: { type: "integer", minimum: 0, exclusiveMinimum: true },
        },
      },
    },
  },
});

const upgradedErrorResponse = {
  description: "Error",
  content: {
    "application/json": {
      examples: { default: { value: { code: "WARP_FAIL" } } },
      schema: {
        type: "object",
        properties: {
          code: { type: ["string", "null"], examples: ["WARP_FAIL"] },
          retries: { type: "integer", exclusiveMinimum: 0 },
        },
      },
    },
  },
};

describe("upgradeOpenApi", () => {
  it("upgrades default responses like any other response", () => {
    const upgraded = upgradeOpenApi({
      openapi: "3.0.3",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/shipments": {
          get: {
            responses: { "200": errorResponse(), default: errorResponse() },
          },
        },
      },
    });

    const responses = upgraded.paths?.["/shipments"]?.get?.responses;
    expect(responses?.["200"]).toEqual(upgradedErrorResponse);
    expect(responses?.default).toEqual(upgradedErrorResponse);
    expect(Object.keys(responses ?? {})).toEqual(["200", "default"]);
  });

  it("upgrades default responses of callbacks and components", () => {
    const upgraded = upgradeOpenApi({
      openapi: "3.0.3",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/subscriptions": {
          post: {
            responses: { "201": { description: "Created" } },
            callbacks: {
              onEvent: {
                "{$request.body#/callbackUrl}": {
                  post: { responses: { default: errorResponse() } },
                },
              },
            },
          },
        },
      },
      components: { responses: { default: errorResponse() } },
    });

    expect(
      upgraded.paths?.["/subscriptions"]?.post?.callbacks?.onEvent?.[
        "{$request.body#/callbackUrl}"
      ]?.post?.responses?.default,
    ).toEqual(upgradedErrorResponse);
    expect(upgraded.components?.responses?.default).toEqual(
      upgradedErrorResponse,
    );
  });

  it("upgrades default responses of Swagger 2.0 documents", () => {
    const upgraded = upgradeOpenApi({
      swagger: "2.0",
      info: { title: "Test", version: "1.0.0" },
      produces: ["application/json"],
      paths: {
        "/shipments": {
          get: {
            responses: {
              default: {
                description: "Error",
                schema: { type: "integer", minimum: 1, exclusiveMinimum: true },
              },
            },
          },
        },
      },
    });

    expect(
      upgraded.paths?.["/shipments"]?.get?.responses?.default,
    ).toMatchObject({
      content: {
        "application/json": {
          schema: { type: "integer", exclusiveMinimum: 1 },
        },
      },
    });
  });

  it("leaves OpenAPI 3.1 documents untouched", () => {
    const response = {
      description: "Error",
      content: {
        "application/json": {
          example: { code: "WARP_FAIL" },
          schema: { type: "string", nullable: true },
        },
      },
    };

    const upgraded = upgradeOpenApi({
      openapi: "3.1.0",
      info: { title: "Test", version: "1.0.0" },
      paths: { "/shipments": { get: { responses: { default: response } } } },
    });

    expect(upgraded.paths?.["/shipments"]?.get?.responses?.default).toEqual(
      response,
    );
  });

  it("falls back to a version when info.version is missing", () => {
    const upgraded = upgradeOpenApi({
      openapi: "3.0.3",
      info: { title: "Test" },
      paths: {},
    });

    expect(upgraded.info.version).toBe("0.0.1");
  });
});
