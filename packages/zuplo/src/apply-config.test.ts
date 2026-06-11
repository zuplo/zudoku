import { graphqlPlugin } from "@zudoku/plugin-graphql";
import { describe, expect, it } from "vitest";
import type { ZudokuConfig } from "zudoku";
import { applyZuploConfig } from "./apply-config.js";
import type { ZuploContext } from "./context/types.js";

const context = (overrides: Partial<ZuploContext> = {}): ZuploContext => ({
  configFiles: [],
  openApiFiles: [],
  graphqlEndpoints: [],
  ...overrides,
});

const routesFile = {
  fileName: "routes.oas.json",
  input: "../config/routes.oas.json",
};
const legacyFile = {
  fileName: "legacy.oas.json",
  input: "../config/legacy.oas.json",
};

const graphqlEndpoint = {
  routePath: "/graphql",
  url: "https://gateway.example.com/graphql",
  title: "GraphQL Endpoint",
  description: undefined,
};

describe("applyZuploConfig", () => {
  it("mounts a single OpenAPI file at /api", () => {
    const { config } = applyZuploConfig(
      {},
      context({ openApiFiles: [routesFile] }),
    );

    expect(config.apis).toEqual([
      { type: "file", input: "../config/routes.oas.json", path: "/api" },
    ]);
  });

  it("mounts multiple OpenAPI files under file-based paths", () => {
    const { config } = applyZuploConfig(
      {},
      context({ openApiFiles: [legacyFile, routesFile] }),
    );

    expect(config.apis).toEqual([
      { type: "file", input: "../config/legacy.oas.json", path: "/api/legacy" },
      { type: "file", input: "../config/routes.oas.json", path: "/api/routes" },
    ]);
  });

  it("leaves files alone that the user already documents", () => {
    const userConfig: ZudokuConfig = {
      apis: {
        type: "file",
        input: "../config/routes.oas.json",
        path: "/reference",
      },
    };

    const { config } = applyZuploConfig(
      userConfig,
      context({ openApiFiles: [routesFile, legacyFile] }),
    );

    expect(config.apis).toEqual([
      { type: "file", input: "../config/routes.oas.json", path: "/reference" },
      { type: "file", input: "../config/legacy.oas.json", path: "/api/legacy" },
    ]);
  });

  it("avoids paths already taken by the user", () => {
    const userConfig: ZudokuConfig = {
      apis: { type: "url", input: "https://example.com/spec", path: "/api" },
    };

    const { config } = applyZuploConfig(
      userConfig,
      context({ openApiFiles: [routesFile] }),
    );

    expect(config.apis).toEqual([
      { type: "url", input: "https://example.com/spec", path: "/api" },
      { type: "file", input: "../config/routes.oas.json", path: "/api/routes" },
    ]);
  });

  it("sets up a GraphQL plugin per detected endpoint", () => {
    const { config, graphqlRoutePaths } = applyZuploConfig(
      {},
      context({ graphqlEndpoints: [graphqlEndpoint] }),
    );

    expect(config.plugins).toHaveLength(1);
    expect(graphqlRoutePaths).toEqual(["/graphql"]);
  });

  it("skips GraphQL endpoints the user already documents", () => {
    const userConfig: ZudokuConfig = {
      plugins: [
        graphqlPlugin({
          type: "url",
          input: "https://gateway.example.com/graphql",
          path: "/graphql",
        }),
      ],
    };

    const { config, graphqlRoutePaths } = applyZuploConfig(
      userConfig,
      context({ graphqlEndpoints: [graphqlEndpoint] }),
    );

    expect(config.plugins).toHaveLength(1);
    expect(graphqlRoutePaths).toEqual([]);
  });

  it("respects the openApi and graphql options", () => {
    const { config, graphqlRoutePaths } = applyZuploConfig(
      {},
      context({
        openApiFiles: [routesFile],
        graphqlEndpoints: [graphqlEndpoint],
      }),
      { openApi: false, graphql: false },
    );

    expect(config.apis).toBeUndefined();
    expect(config.plugins).toBeUndefined();
    expect(graphqlRoutePaths).toEqual([]);
  });
});
