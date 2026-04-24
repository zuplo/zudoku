import { describe, expect, it } from "vitest";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
import {
  createHttpSnippet,
  getConverted,
  type ResolvedAuth,
} from "./createHttpSnippet.js";

const makeOp = (
  parameters: OperationsFragmentFragment["parameters"] = [],
): OperationsFragmentFragment =>
  ({
    method: "GET",
    path: "/things",
    parameters,
  }) as any;

const param = (
  name: string,
  where: "header" | "query",
  defaultValue = "param-value",
): NonNullable<OperationsFragmentFragment["parameters"]>[number] =>
  ({
    name,
    in: where,
    required: true,
    schema: { type: "string", default: defaultValue },
  }) as any;

const shell = (
  op: OperationsFragmentFragment,
  resolvedAuth?: ResolvedAuth,
  selectedServer = "https://api.example.com",
) =>
  getConverted(
    createHttpSnippet({
      operation: op,
      selectedServer,
      exampleBody: { mimeType: "application/json" },
      resolvedAuth,
    }),
    "shell",
  ) as string;

describe("createHttpSnippet auth merge", () => {
  it("replaces base header with auth header of same name (case-insensitive)", () => {
    const out = shell(makeOp([param("Authorization", "header", "base")]), {
      headers: [{ name: "authorization", value: "Bearer token" }],
      queryString: [],
    });
    expect(out).toContain("Bearer token");
    expect(out).not.toContain("base");
  });

  it("replaces base query param with auth query of same name", () => {
    const out = shell(makeOp([param("api_key", "query", "base-key")]), {
      headers: [],
      queryString: [{ name: "api_key", value: "secret" }],
    });
    expect(out).toContain("api_key=secret");
    expect(out).not.toContain("base-key");
  });

  it("keeps base headers/query that do not collide with auth", () => {
    const out = shell(
      makeOp([param("X-Trace", "header", "trace-id"), param("page", "query")]),
      {
        headers: [{ name: "authorization", value: "Bearer t" }],
        queryString: [{ name: "api_key", value: "k" }],
      },
    );
    expect(out).toContain("X-Trace");
    expect(out).toContain("trace-id");
    expect(out).toContain("page=");
    expect(out).toContain("api_key=k");
  });

  it("joins server URL and path without duplicate slashes", () => {
    const out = shell(makeOp(), undefined, "https://api.example.com/");
    expect(out).toContain("https://api.example.com/things");
    expect(out).not.toContain("example.com//things");
  });
});
