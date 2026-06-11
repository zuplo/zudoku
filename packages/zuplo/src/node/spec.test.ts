import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extendSpec } from "./spec.js";

describe("extendSpec", () => {
  let tempDir: string;
  let rootDir: string;
  let configDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "zudoku-zuplo-spec-"));
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

  it("appends detected OpenAPI files to the spec apis", async () => {
    await writeOasFile("routes.oas.json", baseDocument());

    const spec = await extendSpec(
      { apis: { type: "url", input: "https://example.com/x.json" } },
      { rootDir },
    );

    expect(spec.apis).toEqual([
      { type: "url", input: "https://example.com/x.json" },
      { type: "file", input: "../config/routes.oas.json", path: "/api" },
    ]);
  });

  it("appends a graphql plugin entry per detected endpoint", async () => {
    vi.stubEnv("ZUPLO_SERVER_URL", "https://my-gateway.example.com");
    await writeOasFile(
      "routes.oas.json",
      baseDocument({
        "/graphql": {
          post: { summary: "GraphQL Endpoint", "x-graphql": true },
        },
      }),
    );

    const spec = await extendSpec({}, { rootDir });

    expect(spec.plugins).toEqual([
      {
        name: "graphql",
        options: {
          type: "url",
          input: "https://my-gateway.example.com/graphql",
          path: "/graphql",
          options: { title: "GraphQL Endpoint" },
        },
      },
    ]);
  });

  it("returns the spec unchanged when there is no Zuplo project", async () => {
    await fs.rm(configDir, { recursive: true, force: true });

    const input = { site: { title: "My Portal" } };
    const spec = await extendSpec(input, { rootDir });

    expect(spec).toBe(input);
  });
});
