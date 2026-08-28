import { describe, expect, it } from "vitest";
import {
  generateSchemaImportsCode,
  schemaConfigurationChanged,
} from "./plugin-api.js";

describe("schemaConfigurationChanged", () => {
  const apis = {
    type: "file" as const,
    path: "reference",
    input: "./openapi.json",
  };

  it("refreshes schemas when only basePath changes", () => {
    expect(
      schemaConfigurationChanged(
        { apis, basePath: "/" },
        { apis, basePath: "/docs" },
      ),
    ).toBe(true);
  });

  it("does not refresh when schema inputs and basePath are unchanged", () => {
    expect(
      schemaConfigurationChanged(
        { apis, basePath: "/docs" },
        { apis: structuredClone(apis), basePath: "/docs" },
      ),
    ).toBe(false);
  });
});

describe("generateSchemaImportsCode", () => {
  it("emits one shared schema loader registry", () => {
    expect(
      generateSchemaImportsCode([
        { importKey: "/processed/first.js", processedTime: 123 },
        { importKey: "/processed/second.js", processedTime: 456 },
      ]),
    ).toEqual([
      "const schemaImports = {",
      '  "/processed/first.js": () => import("/processed/first.js?d=123"),',
      '  "/processed/second.js": () => import("/processed/second.js?d=456"),',
      "};",
    ]);
  });

  it("normalizes Windows import paths without changing registry keys", () => {
    expect(
      generateSchemaImportsCode([
        { importKey: "C:\\processed\\schema.js", processedTime: 123 },
      ]),
    ).toEqual([
      "const schemaImports = {",
      '  "C:\\\\processed\\\\schema.js": () => import("C:/processed/schema.js?d=123"),',
      "};",
    ]);
  });
});
