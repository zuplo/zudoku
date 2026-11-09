import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { type Plugin, parse } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConfigWithMeta } from "../config/loader.js";
import { validateConfig } from "../config/validators/ZudokuConfig.js";
import viteApiPlugin, {
  generateDefaultApiOptionsCode,
  generateSchemaImportsCode,
  schemaConfigurationChanged,
} from "./plugin-api.js";
import { findRouteImports } from "./protected/annotator.js";

const { currentConfig } = vi.hoisted(() => ({
  currentConfig: { value: undefined as unknown },
}));

vi.mock("../config/loader.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../config/loader.js")>()),
  getCurrentConfig: () => currentConfig.value,
}));

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
  it("emits a schema loader registry", () => {
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

  it("names the registry when a name is given", () => {
    expect(
      generateSchemaImportsCode(
        [{ importKey: "/processed/first.js", processedTime: 123 }],
        "schemaImports0",
      )[0],
    ).toBe("const schemaImports0 = {");
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

  it("escapes characters that are unsafe in inlined code", () => {
    const importKey = "/processed/</script>\u2028.js";
    const code = generateSchemaImportsCode([{ importKey, processedTime: 1 }]);

    expect(code[1]).not.toContain("</script>");
    expect(code[1]).not.toContain("\u2028");
    const schemaImports = new Function(
      `${code.join("\n").replace("import(", "(")}\nreturn schemaImports;`,
    )() as Record<string, () => string>;
    expect(Object.keys(schemaImports)).toEqual([importKey]);
    expect(schemaImports[importKey]?.()).toBe(`${importKey}?d=1`);
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
      disableRequestBox: undefined,
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
          disableRequestBox: true,
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
      disableRequestBox: true,
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

describe("viteApiPlugin", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "zudoku-api-plugin-test-")),
    );
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const writeSchema = async (name: string) => {
    const file = path.join(tempDir, `${name}.json`);
    await fs.writeFile(
      file,
      JSON.stringify({
        openapi: "3.1.0",
        info: { title: name, version: "1.0.0" },
        paths: {},
      }),
    );
    return file;
  };

  it("scopes each file API's schema imports to that API's path", async () => {
    const config: ConfigWithMeta = {
      ...validateConfig({
        apis: [
          { type: "file", path: "public-api", input: await writeSchema("a") },
          { type: "file", path: "internal-api", input: await writeSchema("b") },
        ],
      }),
      __meta: {
        rootDir: tempDir,
        moduleDir: path.join(tempDir, "node_modules"),
        mode: "module",
        dependencies: [],
        configPath: path.join(tempDir, "zudoku.config.ts"),
      },
    };
    currentConfig.value = config;

    const plugin: Plugin = await viteApiPlugin();
    // biome-ignore lint/style/noNonNullAssertion: is guaranteed to be defined
    const hook = plugin.load!;
    const loadFn = typeof hook === "function" ? hook : hook.handler;
    const code = await loadFn.call(
      { addWatchFile: () => {} } as any,
      "\0virtual:zudoku-api-plugins",
    );
    if (typeof code !== "string") throw new Error("Expected generated code");
    const { program } = await parse("api.js", code);

    const rootsBySpec = Object.groupBy(
      findRouteImports(program),
      (route) => route.spec,
    );
    expect(
      Object.values(rootsBySpec).map((routes) => routes?.map((r) => r.root)),
    ).toEqual([["public-api"], ["internal-api"]]);
  });
});
