import { describe, expect, it } from "vitest";
import type { GraphQLClient } from "../client/GraphQLClient.js";
import type { OpenApiPluginOptions } from "../index.js";
import { getRoutes, getVersionMetadata } from "./getRoutes.js";

const mockClient = {} as GraphQLClient;

const baseConfig: OpenApiPluginOptions = {
  type: "url",
  input: "https://example.com/openapi.json",
};

describe("getVersionMetadata", () => {
  it("returns empty metadata for raw type", () => {
    const result = getVersionMetadata({ type: "raw", input: "{}" });
    expect(result).toEqual({
      versions: [],
      labels: {},
      downloadUrls: {},
    });
  });

  it("returns empty metadata for non-array input", () => {
    const result = getVersionMetadata({
      type: "url",
      input: "https://example.com/openapi.json",
    });
    expect(result).toEqual({
      versions: [],
      labels: {},
      downloadUrls: {},
    });
  });

  it("extracts versions, labels and download URLs from versioned input", () => {
    const result = getVersionMetadata({
      type: "url",
      input: [
        {
          path: "v1",
          input: "https://example.com/v1.json",
          label: "Version 1",
          downloadUrl: "https://example.com/v1.json",
        },
        {
          path: "v2",
          input: "https://example.com/v2.json",
          downloadUrl: "https://example.com/v2.json",
        },
      ],
    });

    expect(result).toEqual({
      versions: ["v1", "v2"],
      labels: { v1: "Version 1", v2: "v2" },
      downloadUrls: {
        v1: "https://example.com/v1.json",
        v2: "https://example.com/v2.json",
      },
    });
  });

  it("falls back to path for label and leaves downloadUrl undefined", () => {
    const result = getVersionMetadata({
      type: "url",
      input: [{ path: "v3", input: "https://example.com/v3.json" }],
    });

    expect(result.labels).toEqual({ v3: "v3" });
    expect(result.downloadUrls).toEqual({ v3: undefined });
  });

  it("extracts metadata from file type with versioned input", () => {
    const result = getVersionMetadata({
      type: "file",
      input: [
        {
          path: "v1",
          input: () => Promise.resolve({}),
          label: "File V1",
          downloadUrl: "https://example.com/v1.json",
        },
      ],
    });

    expect(result).toEqual({
      versions: ["v1"],
      labels: { v1: "File V1" },
      downloadUrls: { v1: "https://example.com/v1.json" },
    });
  });
});

describe("getRoutes", () => {
  describe("without tagPages", () => {
    it("creates a single provider route for non-versioned config", () => {
      const routes = getRoutes({
        basePath: "/api",
        config: baseConfig,
        client: mockClient,
      });

      expect(routes).toHaveLength(1);
      expect(routes[0]?.path).toBe("/api");
    });

    it("includes tag param route and additional routes", () => {
      const routes = getRoutes({
        basePath: "/api",
        config: baseConfig,
        client: mockClient,
      });

      const children = routes[0]?.children;
      // :tag? route + untagged + schemas
      expect(children).toHaveLength(3);
      expect(children?.[0]?.path).toBe("/api/:tag?");
      expect(children?.[1]?.path).toBe("/api/~endpoints");
      expect(children?.[2]?.path).toBe("/api/~schemas");
    });

    it("creates versioned routes without tag pages for multi-version", () => {
      const config: OpenApiPluginOptions = {
        type: "url",
        input: [
          { path: "v1", input: "https://example.com/v1.json" },
          { path: "v2", input: "https://example.com/v2.json" },
        ],
      };

      const routes = getRoutes({
        basePath: "/api",
        config,
        client: mockClient,
      });

      // base path (no version) + v1 + v2
      expect(routes).toHaveLength(3);
      expect(routes[0]?.path).toBe("/api");
      expect(routes[1]?.path).toBe("/api/v1");
      expect(routes[2]?.path).toBe("/api/v2");

      const v1Children = routes[1]?.children;
      expect(v1Children).toHaveLength(3);
      expect(v1Children?.[0]?.path).toBe("/api/v1/:tag?");
      expect(v1Children?.[1]?.path).toBe("/api/v1/~endpoints");
      expect(v1Children?.[2]?.path).toBe("/api/v1/~schemas");
    });

    it("creates single versioned route with tag param for single version", () => {
      const config: OpenApiPluginOptions = {
        type: "url",
        input: [{ path: "v1", input: "https://example.com/v1.json" }],
      };

      const routes = getRoutes({
        basePath: "/api",
        config,
        client: mockClient,
      });

      // Single version creates only the base path route, version path is omitted
      expect(routes).toHaveLength(1);
      expect(routes[0]?.path).toBe("/api");

      const children = routes[0]?.children;
      // :tag? route + untagged + schemas
      expect(children).toHaveLength(3);
      expect(children?.[0]?.path).toBe("/api/:tag?");
    });
  });

  describe("with tagPages", () => {
    it("creates routes for each tag page", () => {
      const config: OpenApiPluginOptions = {
        ...baseConfig,
        tagPages: ["users", "posts", "comments"],
      };

      const routes = getRoutes({
        basePath: "/api",
        config,
        client: mockClient,
      });

      expect(routes).toHaveLength(1);
      const children = routes[0]?.children;

      // index + 3 tags + untagged + schemas
      expect(children).toHaveLength(6);
      expect(children?.[0]?.index).toBe(true);
      expect(children?.[1]?.path).toBe("/api/users");
      expect(children?.[2]?.path).toBe("/api/posts");
      expect(children?.[3]?.path).toBe("/api/comments");
      expect(children?.[4]?.path).toBe("/api/~endpoints");
      expect(children?.[5]?.path).toBe("/api/~schemas");
    });

    it("index loader redirects to first tag", () => {
      const config: OpenApiPluginOptions = {
        ...baseConfig,
        tagPages: ["users", "posts"],
      };

      const routes = getRoutes({
        basePath: "/api",
        config,
        client: mockClient,
      });

      const indexRoute = routes[0]?.children?.[0];
      expect(indexRoute?.index).toBe(true);

      const response = (indexRoute?.loader as () => Response)();
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/api/users");
    });

    it("index redirects to ~endpoints when tagPages is empty", () => {
      const config: OpenApiPluginOptions = {
        ...baseConfig,
        tagPages: [],
      };

      const routes = getRoutes({
        basePath: "/api",
        config,
        client: mockClient,
      });

      const children = routes[0]?.children;
      // index + untagged + schemas (no tag routes)
      expect(children).toHaveLength(3);

      const response = (children?.[0]?.loader as () => Response)();
      expect(response.headers.get("Location")).toBe("/api/~endpoints");
    });

    it("creates single route with tag children for single version", () => {
      const config: OpenApiPluginOptions = {
        type: "url",
        input: [{ path: "v1", input: "https://example.com/v1.json" }],
        tagPages: ["users"],
      };

      const routes = getRoutes({
        basePath: "/api",
        config,
        client: mockClient,
      });

      expect(routes).toHaveLength(1);
      expect(routes[0]?.path).toBe("/api");

      const children = routes[0]?.children;
      // index + users tag + ~endpoints + ~schemas
      expect(children).toHaveLength(4);
      expect(children?.[0]?.index).toBe(true);
      expect(children?.[1]?.path).toBe("/api/users");
    });

    it("creates versioned tag routes for multi-version", () => {
      const config: OpenApiPluginOptions = {
        type: "url",
        input: [
          { path: "v1", input: "https://example.com/v1.json" },
          { path: "v2", input: "https://example.com/v2.json" },
        ],
        tagPages: ["users"],
      };

      const routes = getRoutes({
        basePath: "/api",
        config,
        client: mockClient,
      });

      // base path (no version) + v1 + v2
      expect(routes).toHaveLength(3);
      expect(routes[0]?.path).toBe("/api");
      expect(routes[1]?.path).toBe("/api/v1");
      expect(routes[2]?.path).toBe("/api/v2");

      const v1Children = routes[1]?.children;
      expect(v1Children?.[1]?.path).toBe("/api/v1/users");
    });
  });

  describe("hasUntaggedOperations", () => {
    it("includes ~endpoints route by default", () => {
      const config: OpenApiPluginOptions = {
        ...baseConfig,
        tagPages: ["users"],
      };

      const routes = getRoutes({
        basePath: "/api",
        config,
        client: mockClient,
      });

      const children = routes[0]?.children;
      expect(children).toHaveLength(4);
      expect(children?.some((r) => r.path === "/api/~endpoints")).toBe(true);
    });

    it("omits ~endpoints with versioned input options", () => {
      const config: OpenApiPluginOptions = {
        type: "url",
        input: [
          {
            path: "v1",
            input: "https://example.com/v1.json",
            hasUntaggedOperations: false,
          },
        ],
        tagPages: ["users"],
      };

      const routes = getRoutes({
        basePath: "/api",
        config,
        client: mockClient,
      });

      const children = routes[0]?.children;
      // index + users tag + schemas (no ~endpoints)
      expect(children).toHaveLength(3);
      expect(children?.some((r) => r.path === "/api/~endpoints")).toBe(false);
    });

    it("per-version: different hasUntaggedOperations per version", () => {
      const config: OpenApiPluginOptions = {
        type: "url",
        input: [
          {
            path: "v1",
            input: "https://example.com/v1.json",
            hasUntaggedOperations: true,
          },
          {
            path: "v2",
            input: "https://example.com/v2.json",
            hasUntaggedOperations: false,
          },
        ],
        tagPages: ["users"],
      };

      const routes = getRoutes({
        basePath: "/api",
        config,
        client: mockClient,
      });

      // base + v1 + v2
      expect(routes).toHaveLength(3);

      const v1Children = routes[1]?.children;
      expect(v1Children?.some((r) => r.path === "/api/v1/~endpoints")).toBe(
        true,
      );

      const v2Children = routes[2]?.children;
      expect(v2Children?.some((r) => r.path === "/api/v2/~endpoints")).toBe(
        false,
      );
    });

    it("empty tagPages + no untagged ops falls back to inline route", () => {
      const config: OpenApiPluginOptions = {
        type: "url",
        input: [
          {
            path: "v1",
            input: "https://example.com/v1.json",
            hasUntaggedOperations: false,
          },
        ],
        tagPages: [],
      };

      const routes = getRoutes({
        basePath: "/api",
        config,
        client: mockClient,
      });

      const children = routes[0]?.children;
      // fallback route + schemas (no index redirect, no ~endpoints)
      expect(children?.some((r) => r.path === "/api/~endpoints")).toBe(false);
      expect(children?.some((r) => r.index === true)).toBe(false);
    });

    it("omits ~endpoints without tagPages", () => {
      const config: OpenApiPluginOptions = {
        type: "url",
        input: [
          {
            path: "v1",
            input: "https://example.com/v1.json",
            hasUntaggedOperations: false,
          },
        ],
      };

      const routes = getRoutes({
        basePath: "/api",
        config,
        client: mockClient,
      });

      const children = routes[0]?.children;
      // :tag? route + schemas (no ~endpoints)
      expect(children).toHaveLength(2);
      expect(children?.[0]?.path).toBe("/api/:tag?");
      expect(children?.[1]?.path).toBe("/api/~schemas");
    });
  });

  describe("basePath handling", () => {
    it("handles root basePath", () => {
      const routes = getRoutes({
        basePath: "/",
        config: baseConfig,
        client: mockClient,
      });

      expect(routes[0]?.path).toBe("/");
    });

    it("handles nested basePath", () => {
      const config: OpenApiPluginOptions = {
        ...baseConfig,
        tagPages: ["users"],
      };

      const routes = getRoutes({
        basePath: "/docs/api",
        config,
        client: mockClient,
      });

      expect(routes[0]?.path).toBe("/docs/api");
      expect(routes[0]?.children?.[1]?.path).toBe("/docs/api/users");
    });
  });

  it("all routes have lazy loaders", () => {
    const config: OpenApiPluginOptions = {
      ...baseConfig,
      tagPages: ["users"],
    };

    const routes = getRoutes({
      basePath: "/api",
      config,
      client: mockClient,
    });

    expect(routes[0]?.lazy).toBeDefined();
    expect(routes[0]?.children?.[1]?.lazy).toBeDefined();
    expect(
      routes[0]?.children?.find((r) => r.path === "/api/~schemas")?.lazy,
    ).toBeDefined();
  });
});
