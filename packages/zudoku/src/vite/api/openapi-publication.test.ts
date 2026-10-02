import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse as parseYaml } from "yaml";
import type { OpenAPIDocument } from "../../lib/oas/parser/index.js";
import {
  createOpenApiDevMiddleware,
  createOpenApiPublication,
  findOpenApiPublication,
  getOpenApiMediaType,
  writeOpenApiPublications,
} from "./openapi-publication.js";

const schema = {
  openapi: "3.1.0",
  info: { title: "Published API", version: "1.0.0" },
  paths: {},
} satisfies OpenAPIDocument;

describe("OpenAPI publication", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs
        .splice(0)
        .map((dir) => fs.rm(dir, { recursive: true, force: true })),
    );
  });

  it("serializes JSON and matches dev requests with query strings", () => {
    const publication = createOpenApiPublication({
      apiPath: "/api",
      urlPath: "/docs/openapi.json",
      schema,
    });

    expect(publication.mediaType).toBe("application/json");
    expect(JSON.parse(publication.content)).toEqual(schema);
    expect(
      findOpenApiPublication("/docs/openapi.json?cache-bust=1", [publication]),
    ).toBe(publication);
  });

  it("serves canonical GET and HEAD requests from the dev middleware", async () => {
    const publication = createOpenApiPublication({
      apiPath: "/api",
      urlPath: "/docs/openapi.json",
      schema,
    });
    const middleware = createOpenApiDevMiddleware({
      getPublications: () => [publication],
      getDownloadPathMap: () => new Map(),
    });
    const next = vi.fn();

    for (const method of ["GET", "HEAD"]) {
      const headers = new Map<string, string>();
      let body: string | undefined;
      await middleware(
        { method, url: "/docs/openapi.json?agent=1" },
        {
          setHeader: (name, value) => headers.set(name, value),
          end: (value) => {
            body = value;
          },
        },
        next,
      );

      expect(headers.get("Content-Type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toBe(method === "GET" ? publication.content : undefined);
    }
    expect(next).not.toHaveBeenCalled();
  });

  it("preserves existing schema-download routes and passes unrelated requests through", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "zudoku-download-"),
    );
    tempDirs.push(outputDir);
    const inputPath = path.join(outputDir, "schema.yaml");
    await fs.writeFile(inputPath, "openapi: 3.1.0\n", "utf-8");
    const middleware = createOpenApiDevMiddleware({
      getPublications: () => [],
      getDownloadPathMap: () => new Map([["/docs/schema.yaml", inputPath]]),
    });
    const headers = new Map<string, string>();
    let body: string | undefined;
    const next = vi.fn();

    await middleware(
      { method: "GET", url: "/docs/schema.yaml?download=1" },
      {
        setHeader: (name, value) => headers.set(name, value),
        end: (value) => {
          body = value;
        },
      },
      next,
    );

    expect(headers.get("Content-Type")).toBe("application/yaml; charset=utf-8");
    expect(body).toBe("openapi: 3.1.0\n");
    expect(next).not.toHaveBeenCalled();

    await middleware(
      { method: "GET", url: "/docs/guide" },
      { setHeader: vi.fn(), end: vi.fn() },
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it.each([".yaml", ".yml"])(
    "serializes %s publications as YAML",
    (extension) => {
      const publication = createOpenApiPublication({
        apiPath: "/api",
        urlPath: `/openapi${extension}`,
        schema,
      });

      expect(publication.mediaType).toBe("application/yaml");
      expect(parseYaml(publication.content)).toEqual(schema);
      expect(getOpenApiMediaType(`/schema${extension}`)).toBe(
        "application/yaml",
      );
    },
  );

  it("writes production artifacts beneath the output directory", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "zudoku-publish-"),
    );
    tempDirs.push(outputDir);
    const publication = createOpenApiPublication({
      apiPath: "/api",
      urlPath: "/docs/openapi.json",
      schema,
    });

    await writeOpenApiPublications(outputDir, [publication]);

    await expect(
      fs.readFile(path.join(outputDir, "docs", "openapi.json"), "utf-8"),
    ).resolves.toBe(publication.content);
  });

  it("rejects traversal even if passed an unvalidated publication", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "zudoku-publish-"),
    );
    tempDirs.push(outputDir);

    await expect(
      writeOpenApiPublications(outputDir, [
        {
          apiPath: "/api",
          urlPath: "/../escape.json",
          content: "{}",
          mediaType: "application/json",
        },
      ]),
    ).rejects.toThrow("Unsafe OpenAPI publication output path");
  });

  it("does not overwrite an existing public or generated build artifact", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "zudoku-publish-"),
    );
    tempDirs.push(outputDir);
    const existingPath = path.join(outputDir, "openapi.json");
    await fs.writeFile(existingPath, '{"source":"public"}', "utf-8");

    await expect(
      writeOpenApiPublications(outputDir, [
        createOpenApiPublication({
          apiPath: "/api",
          urlPath: "/openapi.json",
          schema,
        }),
      ]),
    ).rejects.toThrow(
      'Cannot publish OpenAPI for API "/api" at "/openapi.json" because a build artifact already exists',
    );
    await expect(fs.readFile(existingPath, "utf-8")).resolves.toBe(
      '{"source":"public"}',
    );
  });
});
