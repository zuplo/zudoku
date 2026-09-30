import { describe, expect, it } from "vitest";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import { removeInternal } from "./removeInternal.js";

const run = (schema: unknown) =>
  removeInternal()({
    schema: schema as OpenAPIDocument,
    file: "/file.json",
    params: {},
    dereference: async (s) => s,
  });

describe("removeInternal", () => {
  it("removes path items marked as internal", () => {
    const result = run({
      openapi: "3.1.0",
      paths: {
        "/admin": {
          "x-internal": true,
          get: { summary: "Admin" },
          post: { summary: "Admin post" },
        },
        "/users": { get: { summary: "Users" } },
      },
    });

    expect(result.paths?.["/admin"]).toBeUndefined();
    expect(result.paths?.["/users"]?.get).toBeDefined();
  });

  it("removes operations marked as internal and keeps siblings", () => {
    const result = run({
      openapi: "3.1.0",
      paths: {
        "/users": {
          get: { summary: "List" },
          delete: { summary: "Delete all", "x-internal": true },
        },
      },
    });

    expect(result.paths?.["/users"]?.get).toBeDefined();
    expect(result.paths?.["/users"]?.delete).toBeUndefined();
  });

  it("does not remove items with x-internal: false", () => {
    const result = run({
      openapi: "3.1.0",
      paths: {
        "/users": {
          "x-internal": false,
          get: {
            "x-internal": false,
            parameters: [{ name: "q", in: "query", "x-internal": false }],
          },
        },
      },
    });

    expect(result.paths?.["/users"]?.get?.parameters).toHaveLength(1);
  });

  it("removes internal parameters at path, operation and component level", () => {
    const result = run({
      openapi: "3.1.0",
      components: {
        parameters: {
          TraceId: { name: "X-Trace-Id", in: "header", "x-internal": true },
          Limit: { name: "limit", in: "query" },
        },
      },
      paths: {
        "/users": {
          parameters: [
            { name: "tenant", in: "query", "x-internal": true },
            { name: "region", in: "query" },
          ],
          get: {
            parameters: [
              { name: "debug", in: "query", "x-internal": true },
              { $ref: "#/components/parameters/TraceId" },
              { $ref: "#/components/parameters/Limit" },
            ],
          },
        },
      },
    });

    expect(result.components?.parameters).toEqual({
      Limit: { name: "limit", in: "query" },
    });
    expect(result.paths?.["/users"]?.parameters).toEqual([
      { name: "region", in: "query" },
    ]);
    expect(result.paths?.["/users"]?.get?.parameters).toEqual([
      { $ref: "#/components/parameters/Limit" },
    ]);
  });

  it("leaves schemas without x-internal unchanged", () => {
    const schema = {
      openapi: "3.1.0",
      info: { title: "API", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            parameters: [{ name: "q", in: "query" }],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    };

    expect(run(schema)).toEqual(schema);
  });
});
