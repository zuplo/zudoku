import { afterEach, describe, expect, it, vi } from "vitest";
import type { LoadedConfig } from "../config/config.js";
import { validateConfig } from "../config/validators/ZudokuConfig.js";
import type { OpenAPIDocument } from "../lib/oas/parser/index.js";
import { createAgenticBuildContributions } from "../lib/plugins/agentic/build.js";
import type { SchemaManager } from "./api/SchemaManager.js";
import {
  createBuildContributionContext,
  createRawOpenApiPublications,
  getCanonicalOrigin,
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

describe("createBuildContributionContext", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const config = (value: unknown): LoadedConfig => ({
    ...validateConfig(value),
    __meta: {
      rootDir: "/project",
      moduleDir: "/project",
      configPath: "/project/zudoku.config.ts",
      mode: "module",
      dependencies: [],
    },
  });

  it("accepts HTTPS and local HTTP origins but rejects unsafe schemes", () => {
    expect(
      getCanonicalOrigin(
        config({ canonicalUrlOrigin: "https://developers.example.com/docs" }),
      ),
    ).toBe("https://developers.example.com");
    expect(
      getCanonicalOrigin(
        config({ canonicalUrlOrigin: "http://localhost:3000/docs" }),
      ),
    ).toBe("http://localhost:3000");
    expect(() =>
      getCanonicalOrigin(config({ canonicalUrlOrigin: "ftp://example.com" })),
    ).toThrow("canonicalUrlOrigin must be a valid HTTPS origin");
  });

  it("inspects URL APIs for authoritative metadata while retaining their URL", async () => {
    const remoteSchema = {
      openapi: "3.0.3",
      info: {
        title: "Remote Payments API",
        version: "2026-08",
        description: "Remote API description",
      },
      paths: {},
    };
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify(remoteSchema), {
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createBuildContributionContext(
      config({
        canonicalUrlOrigin: "https://developers.example.com",
        basePath: "/docs",
        apis: {
          type: "url",
          path: "payments",
          input: "https://api.example.com/openapi.json",
        },
      }),
      {} as SchemaManager,
      new Map<
        string,
        Promise<{
          schema: OpenAPIDocument;
          sourceContentType?: string;
          sourceOpenApiVersion?: string;
        }>
      >(),
    );

    expect(result.apis).toEqual([
      expect.objectContaining({
        inputType: "url",
        title: "Remote Payments API",
        description: "Remote API description",
        version: "2026-08",
        sourceUrl: "https://api.example.com/openapi.json",
        sourceContentType: "application/json",
        openApiVersion: "3.0.3",
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each([
    [
      "discoverable:false",
      {
        canonicalUrlOrigin: "https://developers.example.com",
        apis: {
          type: "url",
          path: "hidden",
          input: "https://api.example.com/hidden.json",
          discoverable: false,
        },
      },
    ],
    [
      "a protected API route",
      {
        canonicalUrlOrigin: "https://developers.example.com",
        basePath: "/docs",
        protectedRoutes: ["/private/admin/*"],
        apis: {
          type: "url",
          path: "private",
          input: "https://api.example.com/private.json",
        },
      },
    ],
  ])("does not inspect URL APIs for %s", async (_label, value) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await createBuildContributionContext(
      config(value),
      {} as SchemaManager,
      new Map(),
    );

    expect(result.apis).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("links an absolute URL API without fetching it when no origin is available", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await createBuildContributionContext(
      config({
        apis: {
          type: "url",
          path: "remote",
          input: "https://api.example.com/openapi.json",
        },
      }),
      {} as SchemaManager,
      new Map(),
    );
    const contributions = createAgenticBuildContributions(result);

    expect(result.apis).toEqual([
      expect.objectContaining({
        inputType: "url",
        title: "remote",
        sourceUrl: "https://api.example.com/openapi.json",
      }),
    ]);
    expect(result.apis[0]?.schema).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(contributions.llmsSections).toEqual([
      {
        title: "APIs",
        links: [
          {
            title: "remote",
            url: "https://api.example.com/openapi.json",
          },
        ],
      },
    ]);
    expect(contributions.warnings?.[0]).toContain("canonicalUrlOrigin");
  });

  it("uses the final runtime processing pipeline for raw APIs and preserves publish overrides", async () => {
    const rawConfig = config({
      basePath: "/docs",
      apis: {
        type: "raw",
        path: "widgets",
        publish: { path: "/schemas/widgets.json" },
        input: JSON.stringify({
          openapi: "3.0.3",
          info: { title: "Widgets API", version: "1.0.0" },
          paths: {},
        }),
      },
    });
    const result = await createBuildContributionContext(
      rawConfig,
      {} as SchemaManager,
      new Map(),
    );

    expect(result.apis[0]).toMatchObject({
      inputType: "raw",
      title: "Widgets API",
      openApiVersion: "3.1.1",
      explicitPublicationPath: "/schemas/widgets.json",
      schema: { openapi: "3.1.1" },
    });
    const publications = await createRawOpenApiPublications(rawConfig);
    expect(publications).toEqual([
      expect.objectContaining({
        apiPath: "widgets",
        urlPath: "/schemas/widgets.json",
        mediaType: "application/json",
      }),
    ]);
    expect(JSON.parse(publications[0]?.content ?? "null")).toMatchObject({
      openapi: "3.1.1",
      info: { title: "Widgets API" },
    });
  });

  it("infers YAML for extensionless URL APIs with a generic content type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            [
              "openapi: 3.0.3",
              "info:",
              "  title: YAML API",
              "  version: 1.0.0",
              "paths: {}",
            ].join("\n"),
            { headers: { "Content-Type": "text/plain" } },
          ),
      ),
    );
    const result = await createBuildContributionContext(
      config({
        canonicalUrlOrigin: "https://developers.example.com",
        apis: {
          type: "url",
          path: "yaml-api",
          input: "https://api.example.com/schema",
        },
      }),
      {} as SchemaManager,
      new Map(),
    );

    expect(result.apis[0]?.sourceContentType).toBe("application/yaml");
    const contributions = createAgenticBuildContributions(result);
    const ard = JSON.parse(
      contributions.artifacts?.find((artifact) =>
        artifact.urlPath.endsWith("/.well-known/ard.json"),
      )?.content ?? "null",
    );
    expect(ard.entries[0]).toMatchObject({
      type: "application/yaml",
      url: "https://api.example.com/schema",
    });
  });

  it("excludes protected API routes from every discovery output", async () => {
    const contributionContext = await createBuildContributionContext(
      config({
        canonicalUrlOrigin: "https://developers.example.com",
        basePath: "/docs",
        protectedRoutes: ["/private/admin/*"],
        apis: {
          type: "raw",
          path: "private",
          input: JSON.stringify({
            openapi: "3.1.0",
            info: { title: "Private API", version: "1.0.0" },
            paths: {},
          }),
        },
      }),
      {} as SchemaManager,
      new Map(),
    );

    expect(contributionContext.apis).toEqual([]);
    const contributions = createAgenticBuildContributions(contributionContext);
    expect(
      contributions.artifacts?.some((artifact) =>
        artifact.urlPath.startsWith("/openapi"),
      ),
    ).toBe(false);
    const ard = JSON.parse(
      contributions.artifacts?.find((artifact) =>
        artifact.urlPath.endsWith("/.well-known/ard.json"),
      )?.content ?? "null",
    );
    const catalog = JSON.parse(
      contributions.artifacts?.find((artifact) =>
        artifact.urlPath.endsWith("/.well-known/api-catalog"),
      )?.content ?? "null",
    );
    expect(ard.entries).toEqual([]);
    expect(catalog.linkset[0].item).toEqual([]);
    expect(contributions.llmsSections).toEqual([]);
  });
});
