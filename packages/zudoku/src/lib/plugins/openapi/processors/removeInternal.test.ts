import { describe, expect, it } from "vitest";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import { removeInternal } from "./removeInternal.js";

describe("removeInternal", () => {
  it("removes x-internal paths, operations and parameters", () => {
    const schema = {
      openapi: "3.1.0",
      paths: {
        "/admin": { "x-internal": true, get: { summary: "Admin" } },
        "/users": {
          parameters: [{ name: "tenant", in: "query", "x-internal": true }],
          get: {
            summary: "List",
            parameters: [
              { name: "debug", in: "query", "x-internal": true },
              { name: "limit", in: "query" },
            ],
          },
          delete: { summary: "Delete all", "x-internal": true },
        },
      },
    } as unknown as OpenAPIDocument;

    const result = removeInternal()({
      schema,
      file: "/file.json",
      params: {},
      dereference: async (s) => s,
    });

    expect(result.paths?.["/admin"]).toBeUndefined();
    expect(result.paths?.["/users"]?.delete).toBeUndefined();
    expect(result.paths?.["/users"]?.parameters).toEqual([]);
    expect(result.paths?.["/users"]?.get?.parameters).toEqual([
      { name: "limit", in: "query" },
    ]);
  });
});
