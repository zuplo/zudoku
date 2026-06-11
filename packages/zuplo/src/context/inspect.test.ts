import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inspectZuploContext } from "./inspect.js";

const routes = (paths: Record<string, unknown>) => ({
  openapi: "3.1.0",
  info: { title: "My Zuplo API", version: "1.0.0" },
  paths,
});

const restRoute = {
  get: {
    operationId: "get-todos",
    summary: "Get all todos",
    responses: { "200": { description: "OK" } },
  },
};

const graphqlRoute = (upstream?: string) => ({
  post: {
    summary: "GraphQL Endpoint",
    operationId: "graphql",
    "x-graphql": true,
    "x-zuplo-route": {
      handler: {
        export: "urlRewriteHandler",
        module: "$import(@zuplo/runtime)",
        ...(upstream && { options: { rewritePattern: upstream } }),
      },
    },
  },
});

describe("inspectZuploContext", () => {
  let tempDir: string;
  let rootDir: string;
  const env = { ...process.env };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "zuplo-inspect-test-"));
    rootDir = path.join(tempDir, "docs");
    await fs.mkdir(path.join(tempDir, "config"), { recursive: true });
    await fs.mkdir(rootDir, { recursive: true });
    delete process.env.ZUPLO_SERVER_URL;
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    process.env = { ...env };
  });

  const writeConfigFile = (fileName: string, content: object) =>
    fs.writeFile(
      path.join(tempDir, "config", fileName),
      JSON.stringify(content),
    );

  it("returns an empty context outside a Zuplo project", async () => {
    await fs.rm(path.join(tempDir, "config"), { recursive: true });

    const context = await inspectZuploContext({ rootDir });

    expect(context).toEqual({
      configFiles: [],
      openApiFiles: [],
      graphqlEndpoints: [],
    });
  });

  it("collects all OpenAPI files in the config directory", async () => {
    await writeConfigFile("routes.oas.json", routes({ "/todos": restRoute }));
    await writeConfigFile("legacy.oas.json", routes({ "/v1": restRoute }));
    await writeConfigFile("policies.json", { policies: [] });

    const context = await inspectZuploContext({ rootDir });

    expect(context.configFiles).toEqual(["legacy.oas.json", "routes.oas.json"]);
    expect(context.openApiFiles).toEqual([
      { fileName: "legacy.oas.json", input: "../config/legacy.oas.json" },
      { fileName: "routes.oas.json", input: "../config/routes.oas.json" },
    ]);
  });

  it("skips files without documentable operations", async () => {
    await writeConfigFile(
      "internal.oas.json",
      routes({
        "/internal": {
          get: { ...restRoute.get, "x-internal": true },
        },
      }),
    );
    await writeConfigFile("routes.oas.json", routes({ "/todos": restRoute }));

    const context = await inspectZuploContext({ rootDir });

    expect(context.openApiFiles).toEqual([
      { fileName: "routes.oas.json", input: "../config/routes.oas.json" },
    ]);
  });

  it("detects GraphQL endpoints using the gateway server URL", async () => {
    process.env.ZUPLO_SERVER_URL = "https://my-gateway.example.com/";
    await writeConfigFile(
      "routes.oas.json",
      routes({
        "/todos": restRoute,
        "/graphql": graphqlRoute("https://upstream.example.com/graphql"),
      }),
    );

    const context = await inspectZuploContext({ rootDir });

    expect(context.graphqlEndpoints).toEqual([
      {
        routePath: "/graphql",
        url: "https://my-gateway.example.com/graphql",
        title: "GraphQL Endpoint",
        description: undefined,
      },
    ]);
  });

  it("falls back to the route's upstream URL without a server URL", async () => {
    await writeConfigFile(
      "routes.oas.json",
      routes({
        "/graphql": graphqlRoute("https://upstream.example.com/graphql"),
      }),
    );

    const context = await inspectZuploContext({ rootDir });

    expect(context.graphqlEndpoints).toEqual([
      {
        routePath: "/graphql",
        url: "https://upstream.example.com/graphql",
        title: "GraphQL Endpoint",
        description: undefined,
      },
    ]);
  });

  it("skips GraphQL endpoints whose upstream is not a concrete URL", async () => {
    await writeConfigFile(
      "routes.oas.json",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Zuplo env var placeholder
      routes({ "/graphql": graphqlRoute("${env.GRAPHQL_API_URL}") }),
    );

    const context = await inspectZuploContext({ rootDir });

    expect(context.graphqlEndpoints).toEqual([]);
  });

  it("detects GraphQL MCP endpoints via x-zuplo-route.mcp.type", async () => {
    await writeConfigFile(
      "routes.oas.json",
      routes({
        "/graphql": {
          post: {
            operationId: "graphql",
            "x-zuplo-route": {
              handler: {
                export: "urlRewriteHandler",
                module: "$import(@zuplo/runtime)",
                options: { baseUrl: "https://rickandmortyapi.com/graphql" },
              },
              mcp: { type: "graphql" },
            },
          },
        },
      }),
    );

    const context = await inspectZuploContext({ rootDir });

    expect(context.graphqlEndpoints).toEqual([
      {
        routePath: "/graphql",
        url: "https://rickandmortyapi.com/graphql",
        title: undefined,
        description: undefined,
      },
    ]);
  });

  it("ignores internal GraphQL endpoints", async () => {
    await writeConfigFile(
      "routes.oas.json",
      routes({
        "/graphql": {
          post: {
            ...graphqlRoute("https://upstream.example.com/graphql").post,
            "x-internal": true,
          },
        },
      }),
    );

    const context = await inspectZuploContext({ rootDir });

    expect(context.graphqlEndpoints).toEqual([]);
    expect(context.openApiFiles).toEqual([]);
  });
});
