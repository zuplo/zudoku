import { describe, expect, it } from "vitest";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import {
  countMcpServers,
  countOperations,
  isKnownDocumentType,
  readDocumentType,
} from "./documentType.js";

// Operations here are deliberately minimal — these helpers only ever look at
// method keys and the presence of an extension, so a full valid operation
// (`responses` and all) would be noise.
const doc = (partial: Record<string, unknown>) =>
  ({
    openapi: "3.1.0",
    info: { title: "t", version: "1" },
    ...partial,
  }) as unknown as OpenAPIDocument;

describe("readDocumentType", () => {
  it("returns undefined when the extension is absent", () => {
    expect(readDocumentType(doc({}))).toBeUndefined();
  });

  it("returns the raw value so callers can report unknown ones", () => {
    expect(readDocumentType(doc({ "x-zudoku-type": "wat" }))).toBe("wat");
  });
});

describe("isKnownDocumentType", () => {
  it("accepts mcp-catalog", () => {
    expect(isKnownDocumentType("mcp-catalog")).toBe(true);
  });

  it("rejects unknown and non-string values", () => {
    expect(isKnownDocumentType("rest")).toBe(false);
    expect(isKnownDocumentType(true)).toBe(false);
    expect(isKnownDocumentType(undefined)).toBe(false);
  });
});

describe("countOperations", () => {
  it("counts only HTTP methods, ignoring siblings like parameters", () => {
    const schema = doc({
      paths: {
        "/a": { get: {}, post: {}, parameters: [] },
        "/b": { delete: {} },
      },
    });

    expect(countOperations(schema)).toBe(3);
  });

  it("returns zero for a document without paths", () => {
    expect(countOperations(doc({}))).toBe(0);
  });
});

describe("countMcpServers", () => {
  it("counts only operations carrying x-mcp-server", () => {
    const schema = doc({
      paths: {
        "/servers": { get: {} },
        "/a/mcp": { post: { "x-mcp-server": { name: "a", tools: [] } } },
        "/b/mcp": { post: { "x-mcp-server": true } },
      },
    });

    expect(countMcpServers(schema)).toBe(2);
    expect(countOperations(schema)).toBe(3);
  });

  it("counts the boolean shorthand the portal designer writes", () => {
    const schema = doc({
      paths: { "/a/mcp": { post: { "x-mcp-server": true } } },
    });

    expect(countMcpServers(schema)).toBe(1);
  });

  it("returns zero when a document has no MCP servers", () => {
    expect(countMcpServers(doc({ paths: { "/a": { get: {} } } }))).toBe(0);
  });
});
