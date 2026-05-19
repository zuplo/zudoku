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
  );

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

const postOp = {
  ...makeOp(),
  method: "POST",
} as OperationsFragmentFragment;

const shellWithBody = (
  exampleBody: { mimeType: string; text?: string },
  op: OperationsFragmentFragment = postOp,
) =>
  getConverted(
    createHttpSnippet({
      operation: op,
      selectedServer: "https://api.example.com",
      exampleBody,
    }),
    "shell",
  );

describe("createHttpSnippet body encoding", () => {
  it("emits urlencoded curl with form fields and matching Content-Type", () => {
    const out = shellWithBody({
      mimeType: "application/x-www-form-urlencoded",
      text: "grant_type=client_credentials&client_id=abc&client_secret=xyz",
    });
    expect(out).toContain("Content-Type: application/x-www-form-urlencoded");
    expect(out).toContain("grant_type=client_credentials");
    expect(out).toContain("client_id=abc");
    expect(out).toContain("client_secret=xyz");
    expect(out).not.toContain("application/json");
  });

  it("preserves repeated keys in urlencoded bodies", () => {
    const out = shellWithBody({
      mimeType: "application/x-www-form-urlencoded",
      text: "scope=read&scope=write",
    });
    expect(out).toContain("scope=read");
    expect(out).toContain("scope=write");
  });

  it("emits multipart curl from JSON-stringified object body", () => {
    const out = shellWithBody({
      mimeType: "multipart/form-data",
      text: JSON.stringify({ file: "report.pdf", note: "Q1" }),
    });
    expect(out).toContain("file=report.pdf");
    expect(out).toContain("note=Q1");
  });

  it("sends JSON bodies with the correct Content-Type", () => {
    const out = shellWithBody({
      mimeType: "application/json",
      text: JSON.stringify({ hello: "world" }),
    });
    expect(out).toContain("Content-Type: application/json");
    expect(out).toContain("hello");
    expect(out).toContain("world");
  });
});

describe("getConverted plugin selection", () => {
  it("falls back to shell/curl for an unknown language", () => {
    const req = createHttpSnippet({
      operation: makeOp(),
      selectedServer: "https://api.example.com",
      exampleBody: { mimeType: "application/json" },
    });
    expect(getConverted(req, "cobol")).toContain("curl");
  });

  it("emits python/requests output for the `python` key", () => {
    const out = getConverted(
      createHttpSnippet({
        operation: makeOp(),
        selectedServer: "https://api.example.com",
        exampleBody: { mimeType: "application/json" },
      }),
      "python",
    );
    expect(out).toContain("requests.get(");
  });
});
