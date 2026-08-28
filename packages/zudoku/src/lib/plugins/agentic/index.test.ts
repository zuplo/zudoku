import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import addFormats from "ajv-formats";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import type { BuildContributionContext } from "../../core/plugins.js";
import { createAgenticBuildContributions } from "./build.js";
import ardEntrySchema from "./spec/schemas/ard-entry.schema.json" with { type: "json" };

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictRequired: false,
  strictTypes: false,
});
addFormats.default(ajv);
const validateArdManifest = ajv.compile({
  ...ardEntrySchema,
  $ref: "#/$defs/ArdManifest",
});
const ardConformanceRunner = fileURLToPath(
  new URL("./conformance/bin/conformance-test", import.meta.url),
);

const schema = {
  openapi: "3.1.0",
  info: {
    title: "Orders API",
    version: "2.0.0",
    description: "Create and inspect orders.",
  },
  servers: [{ url: "https://api.example.com" }],
  paths: {
    "/mcp": {
      post: {
        operationId: "ordersMcp",
        summary: "Orders MCP",
        "x-mcp-server": {
          name: "orders-mcp",
          tools: [{ name: "orders/list" }, { name: "orders/create" }],
        },
      },
    },
    "/unknown-mcp": {
      post: {
        summary: "Unknown tools MCP",
        "x-mcp-server": true,
      },
    },
  },
};

const context = (
  overrides: Partial<BuildContributionContext> = {},
): BuildContributionContext => ({
  canonicalOrigin: "https://developers.example.com",
  basePath: "/docs",
  siteTitle: "Example",
  apis: [
    {
      inputType: "file",
      apiPath: "orders",
      docsPath: "/docs/orders",
      version: "2.0.0",
      versionPath: "",
      title: "Orders API",
      description: "Create and inspect orders.",
      openApiVersion: "3.1.0",
      schema,
      isPrimary: true,
      discoverable: true,
    },
  ],
  ...overrides,
});

const getFirstApi = () => {
  const api = context().apis[0];
  if (!api) throw new Error("Expected the agentic test API fixture");
  return api;
};

const readJsonArtifact = (
  contributions: ReturnType<typeof createAgenticBuildContributions>,
  urlPath: string,
) => {
  const artifact = contributions.artifacts?.find(
    (candidate) => candidate.urlPath === urlPath,
  );
  expect(artifact).toBeDefined();
  return JSON.parse(artifact?.content ?? "null");
};

describe("agenticPlugin build contributions", () => {
  it("publishes valid empty discovery for a zero-API portal", () => {
    const contributions = createAgenticBuildContributions(
      context({ apis: [] }),
    );
    const ard = readJsonArtifact(contributions, "/docs/.well-known/ard.json");
    const catalog = readJsonArtifact(
      contributions,
      "/docs/.well-known/api-catalog",
    );

    expect(validateArdManifest(ard)).toBe(true);
    expect(ard.entries).toEqual([]);
    expect(catalog.linkset).toEqual([
      {
        anchor: "https://developers.example.com/.well-known/api-catalog",
        item: [],
      },
    ]);
    expect(contributions.llmsSections).toEqual([]);
  });

  it("publishes a single API canonically and derives ARD and RFC 9727", () => {
    const contributions = createAgenticBuildContributions(context());

    expect(
      contributions.artifacts?.map((artifact) => artifact.urlPath),
    ).toEqual([
      "/openapi.json",
      "/docs/.well-known/ard.json",
      "/docs/.well-known/api-catalog",
    ]);
    expect(contributions.aliases).toEqual([
      {
        sourcePath: "/.well-known/ard.json",
        destinationPath: "/docs/.well-known/ard.json",
      },
      {
        sourcePath: "/.well-known/api-catalog",
        destinationPath: "/docs/.well-known/api-catalog",
      },
    ]);
    expect(
      contributions.artifacts?.find((artifact) =>
        artifact.urlPath.endsWith("/.well-known/api-catalog"),
      ),
    ).toMatchObject({
      contentType:
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
        Link: expect.stringContaining('rel="api-catalog"'),
      },
    });

    const ard = readJsonArtifact(contributions, "/docs/.well-known/ard.json");
    expect(
      validateArdManifest(ard),
      JSON.stringify(validateArdManifest.errors),
    ).toBe(true);
    expect(ard.entries).toHaveLength(3);
    expect(ard.entries[0]).toMatchObject({
      "@context": "https://agenticresourcediscovery.org/context/v1",
      identifier: "urn:air:developers.example.com:api:orders",
      displayName: "Orders API",
      type: "application/json",
      url: "https://developers.example.com/openapi.json",
    });
    expect(ard.entries[1]).toMatchObject({
      identifier: "urn:air:developers.example.com:mcp:orders-mcp",
      capabilities: ["orders/list", "orders/create"],
      metadata: {
        endpoint: "https://api.example.com/mcp",
        resourceType: "mcp-server",
      },
    });
    expect(ard.entries[1].metadata).not.toHaveProperty("authType");
    expect(ard.entries[2]).not.toHaveProperty("capabilities");

    for (const entry of ard.entries) {
      for (const value of Object.values(entry.metadata ?? {})) {
        expect(["string", "number", "boolean"], entry.identifier).toContain(
          typeof value,
        );
      }
    }
    expect(
      ard.entries.every((entry: object) => !("representativeQueries" in entry)),
    ).toBe(true);
    expect(contributions.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("without representativeQueries"),
      ]),
    );

    const catalog = readJsonArtifact(
      contributions,
      "/docs/.well-known/api-catalog",
    );
    expect(catalog.linkset[0]).toEqual({
      anchor: "https://developers.example.com/.well-known/api-catalog",
      item: [{ href: "https://api.example.com/" }],
    });
    expect(catalog.linkset[1]).toMatchObject({
      anchor: "https://api.example.com/",
      "service-desc": [
        {
          href: "https://developers.example.com/openapi.json",
          type: "application/json",
        },
      ],
      "service-doc": [
        {
          href: "https://developers.example.com/docs/orders",
          type: "text/html",
        },
      ],
    });
    expect(contributions.llmsSections).toEqual([
      {
        title: "APIs",
        links: [
          {
            title: "Orders API",
            url: "https://developers.example.com/openapi.json",
            description: "Create and inspect orders.",
          },
        ],
      },
      {
        title: "MCP Servers",
        links: [
          {
            title: "Orders MCP",
            url: "https://api.example.com/mcp",
            description: "Orders MCP",
          },
          {
            title: "Unknown tools MCP",
            url: "https://api.example.com/unknown-mcp",
            description: "Unknown tools MCP",
          },
        ],
      },
    ]);
  });

  it("passes the pinned official ARD v0.91 conformance runner", async () => {
    const contributions = createAgenticBuildContributions(context());
    const ardArtifact = contributions.artifacts?.find(
      (artifact) => artifact.urlPath === "/docs/.well-known/ard.json",
    );
    expect(ardArtifact).toBeDefined();

    const tempDirectory = await mkdtemp(
      path.join(tmpdir(), "zudoku-ard-conformance-"),
    );
    const manifestPath = path.join(tempDirectory, "ard.json");
    try {
      await writeFile(manifestPath, ardArtifact?.content ?? "");
      const result = spawnSync(
        "python3",
        [ardConformanceRunner, "manifest", manifestPath],
        { encoding: "utf8" },
      );

      expect(result.status, result.stderr || result.stdout).toBe(0);
      expect(result.stdout).toContain("CONFORMANCE STATUS: PASS");
      expect(result.stdout).toContain("No 'representativeQueries'");
      expect(result.stdout).toContain("Media type 'application/json'");
    } finally {
      await rm(tempDirectory, { force: true, recursive: true });
    }
  });

  it("uses deterministic root publication paths for multiple versions", () => {
    const first = getFirstApi();
    const schemaWithoutMcp = { ...schema, paths: {} };
    const contributions = createAgenticBuildContributions(
      context({
        apis: [
          {
            ...first,
            versionPath: "v2",
            version: "2.0.0",
            docsPath: "/docs/orders/v2",
            schema: schemaWithoutMcp,
          },
          {
            ...first,
            versionPath: "v1",
            version: "1.0.0",
            docsPath: "/docs/orders/v1",
            isPrimary: false,
            schema: schemaWithoutMcp,
          },
        ],
      }),
    );

    expect(
      contributions.artifacts?.map((artifact) => artifact.urlPath),
    ).toEqual(
      expect.arrayContaining([
        "/openapi/orders/v2.json",
        "/openapi/orders/v1.json",
      ]),
    );
    const ard = readJsonArtifact(contributions, "/docs/.well-known/ard.json");
    expect(ard.entries[0].identifier).toBe(
      "urn:air:developers.example.com:api:orders-v2",
    );
    const catalog = readJsonArtifact(
      contributions,
      "/docs/.well-known/api-catalog",
    );
    expect(catalog.linkset).toHaveLength(3);
    expect(catalog.linkset[0].item).toEqual([
      { href: "https://api.example.com/" },
      { href: "https://api.example.com/" },
    ]);
    expect(catalog.linkset.slice(1)).toEqual([
      expect.objectContaining({
        "service-desc": [
          expect.objectContaining({
            href: "https://developers.example.com/openapi/orders/v2.json",
          }),
        ],
        "service-doc": [
          expect.objectContaining({
            href: "https://developers.example.com/docs/orders/v2",
          }),
        ],
      }),
      expect.objectContaining({
        "service-desc": [
          expect.objectContaining({
            href: "https://developers.example.com/openapi/orders/v1.json",
          }),
        ],
        "service-doc": [
          expect.objectContaining({
            href: "https://developers.example.com/docs/orders/v1",
          }),
        ],
      }),
    ]);
  });

  it("orders distinct APIs deterministically and emits idempotent content", () => {
    const first = getFirstApi();
    const usersSchema = {
      openapi: "3.0.3",
      info: { title: "Users API", version: "1.4.0" },
      servers: [{ url: "https://users.example.com" }],
      paths: {},
    };
    const multiContext = context({
      apis: [
        { ...first, schema: { ...schema, paths: {} } },
        {
          ...first,
          apiPath: "users",
          docsPath: "/docs/users",
          title: "Users API",
          version: "1.4.0",
          openApiVersion: "3.0.3",
          schema: usersSchema,
        },
      ],
    });

    const firstBuild = createAgenticBuildContributions(multiContext);
    const secondBuild = createAgenticBuildContributions(multiContext);
    expect(secondBuild).toEqual(firstBuild);
    expect(firstBuild.artifacts?.map((artifact) => artifact.urlPath)).toEqual([
      "/openapi/orders/2.0.0.json",
      "/openapi/users/1.4.0.json",
      "/docs/.well-known/ard.json",
      "/docs/.well-known/api-catalog",
    ]);
    const ard = readJsonArtifact(firstBuild, "/docs/.well-known/ard.json");
    expect(
      ard.entries.map((entry: { displayName: string }) => entry.displayName),
    ).toEqual(["Orders API", "Users API"]);
  });

  it("uses the canonical root and resolves relative OpenAPI servers", () => {
    const first = getFirstApi();
    const noServerSchema: Partial<typeof schema> = structuredClone(schema);
    delete noServerSchema.servers;
    const defaultContributions = createAgenticBuildContributions(
      context({ apis: [{ ...first, schema: noServerSchema }] }),
    );
    const defaultArd = readJsonArtifact(
      defaultContributions,
      "/docs/.well-known/ard.json",
    );
    expect(defaultArd.entries[0].metadata.endpoint).toBe(
      "https://developers.example.com/",
    );
    expect(defaultArd.entries[1].metadata.endpoint).toBe(
      "https://developers.example.com/mcp",
    );

    const relativeSchema = structuredClone(schema);
    relativeSchema.servers = [{ url: "/v2" }];
    const relativeContributions = createAgenticBuildContributions(
      context({ apis: [{ ...first, schema: relativeSchema }] }),
    );
    const relativeArd = readJsonArtifact(
      relativeContributions,
      "/docs/.well-known/ard.json",
    );
    expect(relativeArd.entries[0].metadata.endpoint).toBe(
      "https://developers.example.com/v2",
    );
    expect(relativeArd.entries[1].metadata.endpoint).toBe(
      "https://developers.example.com/v2/mcp",
    );

    relativeSchema.servers = [{ url: "v2" }];
    const nestedPublication = createAgenticBuildContributions(
      context({
        apis: [
          {
            ...first,
            explicitPublicationPath: "/schemas/openapi.json",
            schema: relativeSchema,
          },
        ],
      }),
    );
    const nestedArd = readJsonArtifact(
      nestedPublication,
      "/docs/.well-known/ard.json",
    );
    expect(nestedArd.entries[0].metadata.endpoint).toBe(
      "https://developers.example.com/schemas/v2",
    );
    expect(nestedArd.entries[1].metadata.endpoint).toBe(
      "https://developers.example.com/schemas/v2/mcp",
    );
  });

  it("resolves remote API and MCP paths against the OpenAPI document URL", () => {
    const first = getFirstApi();
    const remoteSchema = {
      ...structuredClone(schema),
      servers: [{ url: "v2" }],
      "x-mcp": {
        protocolVersion: "2025-06-18",
        servers: [{ name: "remote-root", url: "/mcp/root" }],
        tools: [{ name: "search" }],
      },
      paths: {
        "/mcp": {
          post: {
            summary: "Remote operation MCP",
            operationId: "remoteMcp",
            "x-mcp-server": {
              name: "remote-operation",
              url: "mcp/custom",
              tools: [{ name: "lookup" }],
            },
          },
        },
      },
    };
    const remoteApi = {
      ...first,
      inputType: "url" as const,
      sourceUrl: "https://api.example.net/specs/openapi.json",
      schema: remoteSchema,
    };

    const relativeContributions = createAgenticBuildContributions(
      context({ apis: [remoteApi] }),
    );
    const relativeArd = readJsonArtifact(
      relativeContributions,
      "/docs/.well-known/ard.json",
    );
    expect(
      relativeArd.entries.map(
        (entry: { metadata: { endpoint: string } }) => entry.metadata.endpoint,
      ),
    ).toEqual([
      "https://api.example.net/specs/v2",
      "https://api.example.net/specs/v2/mcp/root",
      "https://api.example.net/specs/v2/mcp/custom",
    ]);

    const rootRelativeContributions = createAgenticBuildContributions(
      context({
        apis: [
          {
            ...remoteApi,
            schema: { ...remoteSchema, servers: [{ url: "/v2" }] },
          },
        ],
      }),
    );
    const rootRelativeArd = readJsonArtifact(
      rootRelativeContributions,
      "/docs/.well-known/ard.json",
    );
    expect(
      rootRelativeArd.entries.map(
        (entry: { metadata: { endpoint: string } }) => entry.metadata.endpoint,
      ),
    ).toEqual([
      "https://api.example.net/v2",
      "https://api.example.net/v2/mcp/root",
      "https://api.example.net/v2/mcp/custom",
    ]);
  });

  it("warns and skips malformed MCP extensions", () => {
    const first = getFirstApi();
    const malformedSchema = {
      ...structuredClone(schema),
      "x-mcp": [],
      paths: {
        ...structuredClone(schema.paths),
        "/mcp": {
          post: {
            ...structuredClone(schema.paths["/mcp"].post),
            "x-mcp-server": [],
          },
        },
      },
    };

    const contributions = createAgenticBuildContributions(
      context({ apis: [{ ...first, schema: malformedSchema }] }),
    );
    const ard = readJsonArtifact(contributions, "/docs/.well-known/ard.json");
    expect(
      ard.entries.map((entry: { identifier: string }) => entry.identifier),
    ).toEqual([
      "urn:air:developers.example.com:api:orders",
      "urn:air:developers.example.com:mcp:unknown-tools-mcp",
    ]);
    expect(contributions.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Skipped malformed x-mcp extension"),
        expect.stringContaining("Skipped malformed x-mcp-server extension"),
      ]),
    );
  });

  it("warns for malformed scalar MCP extensions but treats false as absent", () => {
    const first = getFirstApi();
    const malformedSchema = {
      ...structuredClone(schema),
      "x-mcp": "invalid",
      paths: {
        "/string": { post: { "x-mcp-server": "invalid" } },
        "/number": { post: { "x-mcp-server": 42 } },
        "/null": { post: { "x-mcp-server": null } },
        "/false": { post: { "x-mcp-server": false } },
      },
    };

    const contributions = createAgenticBuildContributions(
      context({ apis: [{ ...first, schema: malformedSchema }] }),
    );
    const malformedWarnings = contributions.warnings?.filter((warning) =>
      warning.includes("Skipped malformed"),
    );
    expect(malformedWarnings).toHaveLength(4);
    expect(
      malformedWarnings?.some((warning) => warning.includes("/false")),
    ).toBe(false);
  });

  it("skips an explicit root MCP server with no URL", () => {
    const first = getFirstApi();
    const missingUrlSchema = {
      ...structuredClone(schema),
      "x-mcp": { protocolVersion: "2025-06-18", servers: [{}] },
      paths: {},
    };

    const contributions = createAgenticBuildContributions(
      context({ apis: [{ ...first, schema: missingUrlSchema }] }),
    );
    const ard = readJsonArtifact(contributions, "/docs/.well-known/ard.json");
    expect(ard.entries).toHaveLength(1);
    expect(contributions.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("because it has no URL"),
      ]),
    );
  });

  it("derives declared root MCP security and warns when tools are unknown", () => {
    const first = getFirstApi();
    const securedSchema = {
      ...structuredClone(schema),
      paths: {},
      "x-mcp": {
        name: "secured-mcp",
        protocolVersion: "2025-06-18",
        servers: [{ url: "https://mcp.example.com" }],
        security: [{ bearer: [] }],
        securitySchemes: {
          bearer: { type: "http", scheme: "bearer" },
        },
      },
    };

    const contributions = createAgenticBuildContributions(
      context({ apis: [{ ...first, schema: securedSchema }] }),
    );
    const ard = readJsonArtifact(contributions, "/docs/.well-known/ard.json");
    expect(ard.entries[1]).toMatchObject({
      identifier: "urn:air:developers.example.com:mcp:secured-mcp",
      metadata: {
        authType: "apiKey",
        authHeader: "Authorization",
      },
    });
    expect(ard.entries[1]).not.toHaveProperty("capabilities");
    expect(contributions.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("does not declare a tool list"),
      ]),
    );
  });

  it("derives root MCP auth from tool security and component schemes", () => {
    const first = getFirstApi();
    const toolSecuritySchema = {
      ...structuredClone(schema),
      paths: {},
      components: {
        securitySchemes: { oauth: { type: "oauth2" } },
      },
      "x-mcp": {
        name: "tool-secured-mcp",
        protocolVersion: "2025-06-18",
        servers: [{ url: "https://mcp.example.com" }],
        tools: [{ name: "search", security: [{ oauth: [] }] }],
      },
    };
    const contributions = createAgenticBuildContributions(
      context({ apis: [{ ...first, schema: toolSecuritySchema }] }),
    );
    const ard = readJsonArtifact(contributions, "/docs/.well-known/ard.json");
    expect(ard.entries[1].metadata).toMatchObject({ authType: "oauth" });

    const explicitlyUnauthenticatedSchema = {
      ...toolSecuritySchema,
      "x-mcp": {
        ...toolSecuritySchema["x-mcp"],
        security: [{}],
      },
    };
    const unauthenticated = createAgenticBuildContributions(
      context({
        apis: [{ ...first, schema: explicitlyUnauthenticatedSchema }],
      }),
    );
    const unauthenticatedArd = readJsonArtifact(
      unauthenticated,
      "/docs/.well-known/ard.json",
    );
    expect(unauthenticatedArd.entries[1].metadata).not.toHaveProperty(
      "authType",
    );
  });

  it("resolves relative root MCP URLs against the effective API server", () => {
    const first = getFirstApi();
    const rootMcpSchema = {
      ...structuredClone(schema),
      paths: {},
      "x-mcp": {
        protocolVersion: "2025-06-18",
        servers: [
          { name: "relative-root", url: "/mcp/root" },
          {
            name: "absolute-root",
            url: "https://mcp.example.net/root",
          },
        ],
        tools: [{ name: "search" }],
      },
    };

    const contributions = createAgenticBuildContributions(
      context({ apis: [{ ...first, schema: rootMcpSchema }] }),
    );
    const ard = readJsonArtifact(contributions, "/docs/.well-known/ard.json");
    expect(
      ard.entries.map(
        (entry: { metadata?: { endpoint?: string } }) =>
          entry.metadata?.endpoint,
      ),
    ).toEqual([
      "https://api.example.com/",
      "https://api.example.com/mcp/root",
      "https://mcp.example.net/root",
    ]);
  });

  it("uses the effective OpenAPI server when root MCP servers are omitted", () => {
    const first = getFirstApi();
    const rootMcpSchema = {
      ...structuredClone(schema),
      servers: [{ url: "/mcp" }],
      paths: {},
      "x-mcp": {
        name: "default-root",
        protocolVersion: "2025-06-18",
        tools: [{ name: "search" }],
      },
    };

    const contributions = createAgenticBuildContributions(
      context({ apis: [{ ...first, schema: rootMcpSchema }] }),
    );
    const ard = readJsonArtifact(contributions, "/docs/.well-known/ard.json");
    expect(ard.entries[1].metadata.endpoint).toBe(
      "https://developers.example.com/mcp",
    );
  });

  it("skips a root MCP extension without protocolVersion", () => {
    const first = getFirstApi();
    const missingVersionSchema = {
      ...structuredClone(schema),
      paths: {},
      "x-mcp": {
        servers: [{ url: "https://mcp.example.com" }],
      },
    };

    const contributions = createAgenticBuildContributions(
      context({ apis: [{ ...first, schema: missingVersionSchema }] }),
    );
    const ard = readJsonArtifact(contributions, "/docs/.well-known/ard.json");
    expect(ard.entries).toHaveLength(1);
    expect(contributions.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("protocolVersion is required"),
      ]),
    );
  });

  it("honors API and MCP opt-outs without inventing empty tool lists", () => {
    const hiddenApi = getFirstApi();
    const hidden = createAgenticBuildContributions(
      context({ apis: [{ ...hiddenApi, discoverable: false }] }),
    );
    expect(hidden.artifacts?.map((artifact) => artifact.urlPath)).toEqual([
      "/docs/.well-known/ard.json",
      "/docs/.well-known/api-catalog",
    ]);
    expect(
      readJsonArtifact(hidden, "/docs/.well-known/ard.json").entries,
    ).toEqual([]);

    const mcpOptOutSchema = {
      ...structuredClone(schema),
      paths: {
        ...structuredClone(schema.paths),
        "/mcp": {
          post: {
            ...structuredClone(schema.paths["/mcp"].post),
            "x-mcp-server": {
              ...schema.paths["/mcp"].post["x-mcp-server"],
              discoverable: false,
            },
          },
        },
      },
    };
    const visibleApi = getFirstApi();
    const contributions = createAgenticBuildContributions(
      context({ apis: [{ ...visibleApi, schema: mcpOptOutSchema }] }),
    );
    const ard = readJsonArtifact(contributions, "/docs/.well-known/ard.json");
    expect(
      ard.entries.map((entry: { displayName: string }) => entry.displayName),
    ).not.toContain("Orders MCP");
  });

  it("keeps explicit publications and URL schemas authoritative", () => {
    const first = getFirstApi();
    const contributions = createAgenticBuildContributions(
      context({
        apis: [
          {
            ...first,
            explicitPublicationPath: "/custom/orders.yaml",
          },
          {
            ...first,
            apiPath: "remote",
            docsPath: "/docs/remote",
            title: "Remote API",
            inputType: "url",
            schema: undefined,
            sourceUrl: "https://api.example.net/openapi.json",
            sourceContentType: "application/json",
            openApiVersion: "3.0.2",
            isPrimary: true,
          },
        ],
      }),
    );

    expect(
      contributions.artifacts?.map((artifact) => artifact.urlPath),
    ).not.toContain("/custom/orders.yaml");
    const catalog = readJsonArtifact(
      contributions,
      "/docs/.well-known/api-catalog",
    );
    expect(catalog.linkset).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "service-desc": [
            expect.objectContaining({
              href: "https://api.example.net/openapi.json",
              type: "application/json",
            }),
          ],
        }),
      ]),
    );
  });

  it("skips only origin-bound files when no canonical origin is available", () => {
    const first = getFirstApi();
    const contributions = createAgenticBuildContributions(
      context({
        canonicalOrigin: undefined,
        apis: [
          {
            ...first,
            schema: {
              ...structuredClone(schema),
              servers: [{ url: "/v2" }],
            },
          },
        ],
      }),
    );

    expect(
      contributions.artifacts?.map((artifact) => artifact.urlPath),
    ).toEqual(["/openapi.json"]);
    expect(contributions.warnings?.[0]).toContain("canonicalUrlOrigin");
    expect(contributions.llmsSections).toEqual([
      {
        title: "APIs",
        links: [
          {
            title: "Orders API",
            url: "/openapi.json",
            description: "Create and inspect orders.",
          },
        ],
      },
      {
        title: "MCP Servers",
        links: [
          expect.objectContaining({ url: "/v2/mcp" }),
          expect.objectContaining({ url: "/v2/unknown-mcp" }),
        ],
      },
    ]);
  });

  it("fails on duplicate resource identifiers", () => {
    const duplicateSchema = {
      ...structuredClone(schema),
      paths: {
        ...structuredClone(schema.paths),
        "/second": {
          post: {
            summary: "Second",
            "x-mcp-server": { name: "orders-mcp" },
          },
        },
      },
    };
    const first = getFirstApi();

    expect(() =>
      createAgenticBuildContributions(
        context({ apis: [{ ...first, schema: duplicateSchema }] }),
      ),
    ).toThrow(
      'Duplicate ARD identifier "urn:air:developers.example.com:mcp:orders-mcp"',
    );
  });

  it("fails on duplicate OpenAPI publication URLs", () => {
    const first = getFirstApi();

    expect(() =>
      createAgenticBuildContributions(
        context({
          apis: [
            { ...first, explicitPublicationPath: "/same.json" },
            {
              ...first,
              apiPath: "other",
              title: "Other API",
              explicitPublicationPath: "/same.json",
            },
          ],
        }),
      ),
    ).toThrow(
      'Duplicate OpenAPI publication URL "https://developers.example.com/same.json"',
    );
  });
});
