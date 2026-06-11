import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inspectZuploContext } from "./inspect.js";

describe("inspectZuploContext", () => {
  let tempDir: string;
  let rootDir: string;
  let configDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "zudoku-zuplo-test-"));
    rootDir = path.join(tempDir, "docs");
    configDir = path.join(tempDir, "config");
    await fs.mkdir(rootDir, { recursive: true });
    await fs.mkdir(configDir, { recursive: true });
    vi.unstubAllEnvs();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  const writeOasFile = (fileName: string, schema: object) =>
    fs.writeFile(path.join(configDir, fileName), JSON.stringify(schema));

  const baseDocument = (paths: object = {}) => ({
    openapi: "3.1.0",
    info: { title: "Test API", version: "1.0.0" },
    paths,
  });

  it("creates an apis entry per OpenAPI file", async () => {
    await writeOasFile("routes.oas.json", baseDocument());
    await writeOasFile("payments.oas.json", baseDocument());

    const context = await inspectZuploContext({ rootDir });

    expect(context.apis).toEqual([
      {
        type: "file",
        input: "../config/payments.oas.json",
        path: "/api-payments",
      },
      { type: "file", input: "../config/routes.oas.json", path: "/api" },
    ]);
  });

  it("skips files the spec already configures", async () => {
    await writeOasFile("routes.oas.json", baseDocument());

    const context = await inspectZuploContext({
      rootDir,
      spec: {
        apis: {
          type: "file",
          input: "../config/routes.oas.json",
          path: "my-api",
        },
      },
    });

    expect(context.apis).toEqual([]);
  });

  it("skips files whose derived path is already taken", async () => {
    await writeOasFile("routes.oas.json", baseDocument());

    const context = await inspectZuploContext({
      rootDir,
      spec: {
        apis: {
          type: "url",
          input: "https://example.com/openapi.json",
          path: "/api",
        },
      },
    });

    expect(context.apis).toEqual([]);
  });

  it("returns an empty context when there is no Zuplo config directory", async () => {
    await fs.rm(configDir, { recursive: true, force: true });

    const context = await inspectZuploContext({ rootDir });

    expect(context).toEqual({ apis: [], graphql: [] });
  });

  it("creates a GraphQL config per x-graphql endpoint", async () => {
    vi.stubEnv("ZUPLO_SERVER_URL", "https://my-gateway.example.com");
    await writeOasFile(
      "routes.oas.json",
      baseDocument({
        "/graphql": {
          post: {
            summary: "GraphQL Endpoint",
            "x-graphql": true,
            operationId: "graphql-1a2bc3d4",
          },
        },
        "/todos": { get: { operationId: "getTodos" } },
      }),
    );

    const context = await inspectZuploContext({ rootDir });

    expect(context.graphql).toEqual([
      {
        type: "url",
        input: "https://my-gateway.example.com/graphql",
        path: "/graphql",
        options: { title: "GraphQL Endpoint" },
      },
    ]);
  });

  it("prefixes GraphQL paths that don't start with graphql", async () => {
    vi.stubEnv("ZUPLO_SERVER_URL", "https://my-gateway.example.com");
    await writeOasFile(
      "routes.oas.json",
      baseDocument({
        "/v1/gql": { post: { "x-graphql": true } },
      }),
    );

    const context = await inspectZuploContext({ rootDir });

    expect(context.graphql).toEqual([
      {
        type: "url",
        input: "https://my-gateway.example.com/v1/gql",
        path: "/graphql-v1-gql",
        options: {},
      },
    ]);
  });

  it("skips GraphQL endpoints when ZUPLO_SERVER_URL is not set", async () => {
    vi.stubEnv("ZUPLO_SERVER_URL", "");
    await writeOasFile(
      "routes.oas.json",
      baseDocument({
        "/graphql": { post: { "x-graphql": true } },
      }),
    );

    const context = await inspectZuploContext({ rootDir });

    expect(context.graphql).toEqual([]);
    expect(context.apis).toHaveLength(1);
  });

  it("dedupes GraphQL endpoints referenced from multiple files", async () => {
    vi.stubEnv("ZUPLO_SERVER_URL", "https://my-gateway.example.com");
    const document = baseDocument({
      "/graphql": { post: { "x-graphql": true } },
    });
    await writeOasFile("routes.oas.json", document);
    await writeOasFile("other.oas.json", document);

    const context = await inspectZuploContext({ rootDir });

    expect(context.graphql).toHaveLength(1);
  });

  it("skips GraphQL endpoints the spec already documents", async () => {
    vi.stubEnv("ZUPLO_SERVER_URL", "https://my-gateway.example.com");
    await writeOasFile(
      "routes.oas.json",
      baseDocument({
        "/graphql": { post: { "x-graphql": true } },
      }),
    );

    const context = await inspectZuploContext({
      rootDir,
      spec: {
        plugins: [
          {
            name: "graphql",
            options: {
              type: "url",
              input: "https://my-gateway.example.com/graphql",
              path: "/my-graphql",
            },
          },
        ],
      },
    });

    expect(context.graphql).toEqual([]);
  });
});
