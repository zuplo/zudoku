import { describe, expect, it } from "vitest";
import {
  generateDefaultApiOptionsCode,
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

describe("generateDefaultApiOptionsCode", () => {
  // The generated snippet is the contract, so evaluate it the way the virtual
  // module does instead of asserting on source text.
  const resolve = (
    config: unknown,
    apiOptions: Record<string, unknown> = {},
  ) => {
    const body = [
      ...generateDefaultApiOptionsCode(),
      "return { ...defaultApiOptions, ...apiOptions };",
    ].join("\n");
    return new Function("config", "apiOptions", body)(
      config,
      apiOptions,
    ) as Record<string, unknown>;
  };

  it("applies fallbacks when no defaults are configured", () => {
    expect(resolve({})).toEqual({
      examplesLanguage: undefined,
      supportedLanguages: undefined,
      disablePlayground: undefined,
      disableSidecar: undefined,
      disableSecurity: true,
      disableMcpAuthInstructions: undefined,
      showVersionSelect: "if-available",
      showInfoPage: undefined,
      schemaDownload: undefined,
    });
  });

  it("prefers defaults.apis.examplesLanguage over the top-level default", () => {
    const resolved = resolve({
      defaults: {
        examplesLanguage: "python",
        apis: { examplesLanguage: "go" },
      },
    });

    expect(resolved.examplesLanguage).toBe("go");
  });

  it("falls back to the top-level examplesLanguage default", () => {
    const resolved = resolve({ defaults: { examplesLanguage: "python" } });

    expect(resolved.examplesLanguage).toBe("python");
  });

  it("keeps explicit false for options that default to true", () => {
    const resolved = resolve({
      defaults: { apis: { disableSecurity: false, showVersionSelect: false } },
    });

    expect(resolved.disableSecurity).toBe(false);
    expect(resolved.showVersionSelect).toBe(false);
  });

  it("passes through configured defaults", () => {
    const schemaDownload = { enabled: true };
    const resolved = resolve({
      defaults: {
        apis: {
          supportedLanguages: ["js", "go"],
          disablePlayground: true,
          disableSidecar: true,
          disableMcpAuthInstructions: true,
          showInfoPage: false,
          schemaDownload,
        },
      },
    });

    expect(resolved).toMatchObject({
      supportedLanguages: ["js", "go"],
      disablePlayground: true,
      disableSidecar: true,
      disableMcpAuthInstructions: true,
      showInfoPage: false,
      schemaDownload,
    });
  });

  it("lets authored API options win over the shared defaults", () => {
    const resolved = resolve(
      { defaults: { apis: { disableSecurity: true, showInfoPage: false } } },
      { disableSecurity: false, showInfoPage: true, examplesLanguage: "ruby" },
    );

    expect(resolved).toMatchObject({
      disableSecurity: false,
      showInfoPage: true,
      examplesLanguage: "ruby",
    });
  });
});
