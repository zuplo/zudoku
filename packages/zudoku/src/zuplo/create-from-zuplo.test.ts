import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createFromZuplo,
  ZUPLO_GENERATED_CONFIG_FILE,
} from "./create-from-zuplo.js";

describe("createFromZuplo", () => {
  let tempDir: string;
  let rootDir: string;
  let configDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "zudoku-zuplo-test-"));
    // Mirrors a Zuplo project: the Zudoku project lives in `docs`, the
    // gateway configuration in a sibling `config` directory.
    rootDir = path.join(tempDir, "docs");
    configDir = path.join(tempDir, "config");
    await fs.mkdir(rootDir, { recursive: true });
    await fs.mkdir(configDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const writeOasFile = (fileName: string, document: object) =>
    fs.writeFile(path.join(configDir, fileName), JSON.stringify(document));

  const installGraphqlPlugin = async () => {
    const packageDir = path.join(
      rootDir,
      "node_modules",
      "@zudoku",
      "plugin-graphql",
    );
    await fs.mkdir(packageDir, { recursive: true });
    await fs.writeFile(
      path.join(packageDir, "package.json"),
      JSON.stringify({ name: "@zudoku/plugin-graphql" }),
    );
  };

  const readGeneratedConfig = () =>
    fs.readFile(path.join(rootDir, ZUPLO_GENERATED_CONFIG_FILE), "utf-8");

  const restOperation = (operationId: string) => ({
    operationId,
    summary: `Operation ${operationId}`,
    responses: { "200": { description: "OK" } },
  });

  const graphqlOperation = (overrides: object = {}) => ({
    operationId: "graphql",
    summary: "GraphQL Endpoint",
    "x-graphql": true,
    "x-zuplo-route": {
      handler: {
        export: "urlRewriteHandler",
        module: "$import(@zuplo/runtime)",
        options: { rewritePattern: "https://api.example.com/graphql" },
      },
    },
    ...overrides,
  });

  it("skips generation when no Zuplo config directory exists", async () => {
    await fs.rm(configDir, { recursive: true });

    const result = await createFromZuplo({ rootDir });

    expect(result.outputPath).toBeUndefined();
    expect(result.written).toBe(false);
    expect(result.warnings).toEqual([
      expect.stringContaining("No Zuplo config directory found"),
    ]);
  });

  it("generates an apis entry and navigation link for a single OpenAPI file", async () => {
    await writeOasFile("routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "My Zuplo API", version: "1.0.0" },
      paths: { "/todos": { get: restOperation("getTodos") } },
    });

    const result = await createFromZuplo({ rootDir });

    expect(result.written).toBe(true);
    expect(result.apis).toEqual([
      {
        input: "../config/routes.oas.json",
        path: "/api",
        label: "My Zuplo API",
      },
    ]);
    expect(result.graphqlEndpoints).toEqual([]);

    const source = await readGeneratedConfig();
    expect(source).toContain(`import type { ZudokuConfig } from "zudoku";`);
    expect(source).toContain(`"input": "../config/routes.oas.json"`);
    expect(source).toContain(`"path": "/api"`);
    // A single API links directly instead of nesting in a category
    expect(source).toContain(`"label": "My Zuplo API"`);
    expect(source).not.toContain(`"type": "category"`);
    expect(source).not.toContain("graphqlPlugin");
  });

  it("mounts multiple OpenAPI files under distinct paths in a category", async () => {
    await writeOasFile("routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "Main API", version: "1.0.0" },
      paths: { "/todos": { get: restOperation("getTodos") } },
    });
    await writeOasFile("billing.oas.json", {
      openapi: "3.1.0",
      info: { title: "Billing API", version: "1.0.0" },
      paths: { "/invoices": { get: restOperation("getInvoices") } },
    });

    const result = await createFromZuplo({ rootDir });

    // Alphabetical order, matching how Zuplo processes OpenAPI files
    expect(result.apis).toEqual([
      {
        input: "../config/billing.oas.json",
        path: "/api/billing",
        label: "Billing API",
      },
      {
        input: "../config/routes.oas.json",
        path: "/api/routes",
        label: "Main API",
      },
    ]);

    const source = await readGeneratedConfig();
    expect(source).toContain(`"type": "category"`);
    expect(source).toContain(`"label": "API Reference"`);
  });

  it("sets up a graphqlPlugin for routes marked with x-graphql", async () => {
    await installGraphqlPlugin();
    await writeOasFile("routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "My Zuplo API", version: "1.0.0" },
      paths: {
        "/todos": { get: restOperation("getTodos") },
        "/graphql": { post: graphqlOperation() },
      },
    });

    const result = await createFromZuplo({ rootDir });

    expect(result.graphqlEndpoints).toEqual([
      {
        routePath: "/graphql",
        path: "/graphql",
        endpoint: "https://api.example.com/graphql",
        label: "GraphQL Endpoint",
      },
    ]);

    const source = await readGeneratedConfig();
    expect(source).toContain(
      `import { graphqlPlugin } from "@zudoku/plugin-graphql";`,
    );
    expect(source).toContain(`"input": "https://api.example.com/graphql"`);
    expect(source).toContain(`"endpoint": "https://api.example.com/graphql"`);
    // Both the REST api and the GraphQL endpoint are linked in a category
    expect(source).toContain(`"label": "API Reference"`);
    expect(source).toContain(`"stack": true`);
  });

  it("detects GraphQL routes via x-zuplo-route.mcp.type", async () => {
    await installGraphqlPlugin();
    await writeOasFile("routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "My Zuplo API", version: "1.0.0" },
      paths: {
        "/graphql": {
          post: {
            operationId: "graphql",
            "x-zuplo-route": {
              handler: {
                export: "urlForwardHandler",
                module: "$import(@zuplo/runtime)",
                options: { baseUrl: "https://api.example.com" },
              },
              mcp: { type: "graphql" },
            },
          },
        },
      },
    });

    const result = await createFromZuplo({ rootDir });

    expect(result.apis).toEqual([]);
    expect(result.graphqlEndpoints).toEqual([
      {
        routePath: "/graphql",
        path: "/graphql",
        endpoint: "https://api.example.com/graphql",
        label: "GraphQL API",
      },
    ]);
  });

  it("prefers the gateway URL for GraphQL endpoints when available", async () => {
    await installGraphqlPlugin();
    await writeOasFile("routes.oas.json", {
      openapi: "3.1.0",
      paths: { "/graphql": { post: graphqlOperation() } },
    });

    const result = await createFromZuplo({
      rootDir,
      serverUrl: "https://my-gateway.zuplo.app",
    });

    expect(result.graphqlEndpoints[0]?.endpoint).toBe(
      "https://my-gateway.zuplo.app/graphql",
    );
  });

  it("skips GraphQL endpoints whose URL cannot be determined", async () => {
    await installGraphqlPlugin();
    await writeOasFile("routes.oas.json", {
      openapi: "3.1.0",
      paths: {
        "/graphql": {
          post: graphqlOperation({
            "x-zuplo-route": {
              handler: {
                export: "urlRewriteHandler",
                module: "$import(@zuplo/runtime)",
                // biome-ignore lint/suspicious/noTemplateCurlyInString: Zuplo's runtime interpolation syntax, intentionally unresolvable here
                options: { rewritePattern: "${env.GRAPHQL_API_URL}" },
              },
            },
          }),
        },
      },
    });

    const result = await createFromZuplo({ rootDir });

    expect(result.graphqlEndpoints).toEqual([]);
    expect(result.warnings).toEqual([
      expect.stringContaining(
        'Could not determine a URL for the GraphQL endpoint "/graphql"',
      ),
    ]);
  });

  it("skips GraphQL setup when the plugin package is not installed", async () => {
    await writeOasFile("routes.oas.json", {
      openapi: "3.1.0",
      paths: { "/graphql": { post: graphqlOperation() } },
    });

    const result = await createFromZuplo({ rootDir });

    expect(result.graphqlEndpoints).toEqual([]);
    expect(result.warnings).toEqual([
      expect.stringContaining("@zudoku/plugin-graphql"),
    ]);

    const source = await readGeneratedConfig();
    expect(source).not.toContain("graphqlPlugin");
  });

  it("ignores internal operations when detecting documentable APIs", async () => {
    await writeOasFile("routes.oas.json", {
      openapi: "3.1.0",
      paths: {
        "/internal": {
          get: { ...restOperation("internalOp"), "x-internal": true },
        },
      },
    });

    const result = await createFromZuplo({ rootDir });

    expect(result.apis).toEqual([]);
    const source = await readGeneratedConfig();
    expect(source).toContain("const config: ZudokuConfig = {};");
  });

  it("finds the Zuplo config directory inside the project root as a fallback", async () => {
    const standaloneRoot = path.join(tempDir, "standalone");
    await fs.mkdir(path.join(standaloneRoot, "config"), { recursive: true });
    await fs.writeFile(
      path.join(standaloneRoot, "config", "routes.oas.json"),
      JSON.stringify({
        openapi: "3.1.0",
        paths: { "/todos": { get: restOperation("getTodos") } },
      }),
    );

    const result = await createFromZuplo({ rootDir: standaloneRoot });

    expect(result.apis).toEqual([
      {
        input: "./config/routes.oas.json",
        path: "/api",
        label: "API Reference",
      },
    ]);
  });

  it("does not rewrite the file when the content is unchanged", async () => {
    await writeOasFile("routes.oas.json", {
      openapi: "3.1.0",
      paths: { "/todos": { get: restOperation("getTodos") } },
    });

    const first = await createFromZuplo({ rootDir });
    expect(first.written).toBe(true);

    const second = await createFromZuplo({ rootDir });
    expect(second.written).toBe(false);
  });

  it("throws a descriptive error for malformed OpenAPI files", async () => {
    await fs.writeFile(path.join(configDir, "routes.oas.json"), "{not json");

    await expect(createFromZuplo({ rootDir })).rejects.toThrow(
      /Failed to parse OpenAPI file at .*routes\.oas\.json/,
    );
  });

  it("generates a valid empty config when no OpenAPI files exist", async () => {
    const result = await createFromZuplo({ rootDir });

    expect(result.written).toBe(true);
    expect(result.warnings).toEqual([
      expect.stringContaining("No OpenAPI files"),
    ]);
    const source = await readGeneratedConfig();
    expect(source).toContain("const config: ZudokuConfig = {};");
    expect(source).toContain("export default config;");
  });
});
