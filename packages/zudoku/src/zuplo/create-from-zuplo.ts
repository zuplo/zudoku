import fs from "node:fs/promises";
import path from "node:path";
import { fileExists } from "../config/file-exists.js";
import { isPlainObject } from "../lib/core/transform-config.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { slugifyWithCounter } from "../lib/util/slugify.js";
import type { RecordAny } from "../lib/util/types.js";

export const ZUPLO_GENERATED_CONFIG_FILE = "zudoku-zuplo.config.ts";

const GRAPHQL_PLUGIN_PACKAGE = "@zudoku/plugin-graphql";

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

export type DetectedApi = {
  /** Schema path relative to the Zudoku project root (posix style) */
  input: string;
  /** URL path the API reference is mounted at */
  path: string;
  label: string;
};

export type DetectedGraphQLEndpoint = {
  /** Route path of the endpoint on the gateway */
  routePath: string;
  /** URL path the GraphQL reference is mounted at */
  path: string;
  /** URL used for introspection and the playground */
  endpoint: string;
  label: string;
};

export type CreateFromZuploOptions = {
  /** The Zudoku project root (the directory containing zudoku.config.*) */
  rootDir: string;
  /** Gateway URL used to derive GraphQL endpoint URLs (ZUPLO_SERVER_URL) */
  serverUrl?: string;
};

export type CreateFromZuploResult = {
  /** Path of the generated config; undefined when no Zuplo project was found */
  outputPath?: string;
  /** Whether the file was (re)written; false when it was already up to date */
  written: boolean;
  apis: DetectedApi[];
  graphqlEndpoints: DetectedGraphQLEndpoint[];
  warnings: string[];
};

type GraphQLRoute = { routePath: string; label: string; backendUrl?: string };

type OasAnalysis = {
  fileName: string;
  filePath: string;
  title?: string;
  hasOpenApiOperations: boolean;
  graphqlRoutes: GraphQLRoute[];
};

const listOasFiles = async (dir: string) => {
  const entries = await fs.readdir(dir).catch(() => []);
  return (
    entries
      .filter((fileName) => fileName.endsWith(".oas.json"))
      // Zuplo processes OpenAPI files in alphabetical order
      .sort()
  );
};

/**
 * Zuplo projects keep their gateway configuration (`*.oas.json`,
 * `policies.json`) in a `config` directory that is a sibling of the Zudoku
 * project (usually `docs`). Standalone setups may have it inside the project.
 * Candidates containing OpenAPI files win over merely existing ones, which
 * are still returned as a fallback so a stale generated config gets reset.
 */
const findZuploConfigDir = async (rootDir: string) => {
  let fallback: string | undefined;

  for (const candidate of ["../config", "config"]) {
    const dir = path.resolve(rootDir, candidate);
    const isDirectory = await fs
      .stat(dir)
      .then((s) => s.isDirectory())
      .catch(() => false);
    if (!isDirectory) continue;

    if ((await listOasFiles(dir)).length > 0) return dir;
    fallback ??= dir;
  }

  return fallback;
};

const isPackageInstalled = async (startDir: string, packageName: string) => {
  let dir = path.resolve(startDir);
  while (true) {
    const packageJson = path.join(
      dir,
      "node_modules",
      packageName,
      "package.json",
    );
    if (await fileExists(packageJson)) return true;

    const parent = path.dirname(dir);
    if (parent === dir) return false;
    dir = parent;
  }
};

const isGraphQLOperation = (pathItem: RecordAny, operation: RecordAny) =>
  operation["x-graphql"] === true ||
  pathItem["x-graphql"] === true ||
  operation["x-zuplo-route"]?.mcp?.type === "graphql";

/**
 * Derives the upstream URL of a proxied GraphQL route from its handler
 * options. Only concrete URLs are returned; rewrite patterns interpolating
 * runtime values (e.g. `${env.GRAPHQL_API_URL}`) can't be resolved at
 * generation time.
 */
const resolveBackendUrl = (routePath: string, operation: RecordAny) => {
  const handler = operation["x-zuplo-route"]?.handler;
  if (!isPlainObject(handler)) return;

  const options = isPlainObject(handler.options) ? handler.options : {};
  const url =
    handler.export === "urlRewriteHandler"
      ? (options.rewritePattern ?? options.baseUrl)
      : handler.export === "urlForwardHandler" &&
          typeof options.baseUrl === "string"
        ? joinUrl(options.baseUrl, routePath)
        : undefined;

  if (typeof url !== "string") return;
  if (url.includes("${") || !/^https?:\/\//.test(url)) return;

  return url;
};

const analyzeOasDocument = (
  fileName: string,
  filePath: string,
  document: RecordAny,
): OasAnalysis => {
  const graphqlRoutes = new Map<string, GraphQLRoute>();
  let hasOpenApiOperations = false;

  const paths = isPlainObject(document.paths) ? document.paths : {};

  for (const [routePath, pathItem] of Object.entries(paths)) {
    if (!isPlainObject(pathItem)) continue;

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!isPlainObject(operation)) continue;
      if (operation["x-internal"] === true || pathItem["x-internal"] === true)
        continue;

      if (!isGraphQLOperation(pathItem, operation)) {
        hasOpenApiOperations = true;
        continue;
      }

      if (graphqlRoutes.has(routePath)) continue;
      graphqlRoutes.set(routePath, {
        routePath,
        label:
          typeof operation.summary === "string" && operation.summary
            ? operation.summary
            : "GraphQL API",
        backendUrl: resolveBackendUrl(routePath, operation),
      });
    }
  }

  return {
    fileName,
    filePath,
    title:
      isPlainObject(document.info) && typeof document.info.title === "string"
        ? document.info.title
        : undefined,
    hasOpenApiOperations,
    graphqlRoutes: [...graphqlRoutes.values()],
  };
};

const toPosixRelative = (from: string, to: string) => {
  const relative = path.relative(from, to).split(path.sep).join("/");
  return relative.startsWith(".") ? relative : `./${relative}`;
};

const indentBlock = (text: string, pad: string) =>
  text
    .split("\n")
    .map((line, index) => (index === 0 ? line : pad + line))
    .join("\n");

const serialize = (value: unknown, pad: string) =>
  indentBlock(JSON.stringify(value, null, 2), pad);

type NavigationLink = {
  type: "link";
  to: string;
  label: string;
  stack?: boolean;
};

const buildNavigation = (
  apis: DetectedApi[],
  graphqlEndpoints: DetectedGraphQLEndpoint[],
) => {
  const links: NavigationLink[] = [
    ...apis.map<NavigationLink>((api) => ({
      type: "link",
      to: api.path,
      label: api.label,
    })),
    ...graphqlEndpoints.map<NavigationLink>((endpoint) => ({
      type: "link",
      to: endpoint.path,
      label: endpoint.label,
      stack: true,
    })),
  ];

  if (links.length === 0) return;
  if (links.length === 1) return links;

  return [
    {
      type: "category",
      label: "API Reference",
      icon: "book-open",
      items: links,
    },
  ];
};

const renderConfigSource = (
  apis: DetectedApi[],
  graphqlEndpoints: DetectedGraphQLEndpoint[],
) => {
  const lines = [
    "// Generated by `zudoku create-from-zuplo` from your Zuplo project.",
    "// This file is regenerated when Zudoku runs in Zuplo mode, so manual",
    "// changes will be overwritten. Opt out of the generated setup by removing",
    "// this file from `extends` in your Zudoku config.",
  ];

  if (graphqlEndpoints.length > 0) {
    lines.push(`import { graphqlPlugin } from "${GRAPHQL_PLUGIN_PACKAGE}";`);
  }
  lines.push(`import type { ZudokuConfig } from "zudoku";`, "");

  const sections: string[] = [];

  if (apis.length > 0) {
    const entries = apis.map(
      (api) =>
        `    ${serialize({ type: "file", input: api.input, path: api.path }, "    ")},`,
    );
    sections.push(["  apis: [", ...entries, "  ],"].join("\n"));
  }

  if (graphqlEndpoints.length > 0) {
    const entries = graphqlEndpoints.map((endpoint) => {
      const pluginConfig = {
        type: "url",
        input: endpoint.endpoint,
        path: endpoint.path,
        options: {
          title: endpoint.label,
          playground: { endpoint: endpoint.endpoint },
        },
      };
      return `    graphqlPlugin(${serialize(pluginConfig, "    ")}),`;
    });
    sections.push(["  plugins: [", ...entries, "  ],"].join("\n"));
  }

  const navigation = buildNavigation(apis, graphqlEndpoints);
  if (navigation) {
    sections.push(`  navigation: ${serialize(navigation, "  ")},`);
  }

  if (sections.length === 0) {
    lines.push(
      "// No documentable APIs were found in your Zuplo project.",
      "const config: ZudokuConfig = {};",
    );
  } else {
    lines.push("const config: ZudokuConfig = {", ...sections, "};");
  }

  lines.push("", "export default config;", "");

  return lines.join("\n");
};

/**
 * Inspects the surrounding Zuplo project and generates a
 * `zudoku-zuplo.config.ts` next to the user's Zudoku config: every OpenAPI
 * file in the Zuplo `config` directory becomes an `apis` entry, every route
 * marked as GraphQL becomes a `graphqlPlugin` instance, and all of them are
 * linked in the navigation. Users include the result via
 * `extends: ["./zudoku-zuplo.config.ts"]`.
 */
export async function createFromZuplo(
  options: CreateFromZuploOptions,
): Promise<CreateFromZuploResult> {
  const rootDir = path.resolve(options.rootDir);
  const warnings: string[] = [];

  const configDir = await findZuploConfigDir(rootDir);
  if (!configDir) {
    return {
      written: false,
      apis: [],
      graphqlEndpoints: [],
      warnings: [
        "No Zuplo config directory found (expected `../config` or `./config` relative to the project root).",
      ],
    };
  }

  const fileNames = await listOasFiles(configDir);

  if (fileNames.length === 0) {
    warnings.push(`No OpenAPI files (*.oas.json) found in ${configDir}.`);
  }

  const analyses: OasAnalysis[] = [];
  for (const fileName of fileNames) {
    const filePath = path.join(configDir, fileName);
    let document: unknown;
    try {
      document = JSON.parse(await fs.readFile(filePath, "utf-8"));
    } catch (error) {
      throw new Error(
        `Failed to parse OpenAPI file at ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
    if (!isPlainObject(document)) {
      throw new Error(
        `Failed to parse OpenAPI file at ${filePath}: expected a JSON object.`,
      );
    }
    analyses.push(analyzeOasDocument(fileName, filePath, document));
  }

  const apiAnalyses = analyses.filter(
    (analysis) => analysis.hasOpenApiOperations,
  );
  const apiSlug = slugifyWithCounter();
  const apis = apiAnalyses.map<DetectedApi>((analysis) => {
    const slug = apiSlug(analysis.fileName.replace(/\.oas\.json$/, ""));
    return {
      input: toPosixRelative(rootDir, analysis.filePath),
      path:
        apiAnalyses.length === 1 ? "/api" : `/api/${slug || "api-reference"}`,
      label: analysis.title ?? "API Reference",
    };
  });

  let graphqlRoutes = analyses.flatMap((analysis) =>
    analysis.graphqlRoutes.map((route) => ({ ...route, analysis })),
  );

  if (
    graphqlRoutes.length > 0 &&
    !(await isPackageInstalled(rootDir, GRAPHQL_PLUGIN_PACKAGE))
  ) {
    warnings.push(
      `Found ${graphqlRoutes.length} GraphQL endpoint(s) in your Zuplo project, but \`${GRAPHQL_PLUGIN_PACKAGE}\` is not installed. Install it in your Zudoku project to document them.`,
    );
    graphqlRoutes = [];
  }

  const graphqlSlug = slugifyWithCounter();
  const graphqlEndpoints = graphqlRoutes.flatMap<DetectedGraphQLEndpoint>(
    (route) => {
      const endpoint = options.serverUrl
        ? joinUrl(options.serverUrl, route.routePath)
        : route.backendUrl;

      if (!endpoint) {
        warnings.push(
          `Could not determine a URL for the GraphQL endpoint "${route.routePath}" (${route.analysis.fileName}); it was not added to the generated config.`,
        );
        return [];
      }

      const slug = graphqlSlug(route.routePath);
      return {
        routePath: route.routePath,
        path:
          graphqlRoutes.length === 1
            ? "/graphql"
            : `/graphql/${slug || "graphql"}`,
        endpoint,
        label: route.label,
      };
    },
  );

  const outputPath = path.join(rootDir, ZUPLO_GENERATED_CONFIG_FILE);
  const source = renderConfigSource(apis, graphqlEndpoints);

  const existing = await fs.readFile(outputPath, "utf-8").catch(() => null);
  const written = existing !== source;
  if (written) {
    await fs.writeFile(outputPath, source, "utf-8");
  }

  return { outputPath, written, apis, graphqlEndpoints, warnings };
}
