import fs from "node:fs/promises";
import path from "node:path";
import { deepEqual } from "fast-equals";
import { type Plugin, runnerImport } from "vite";
import { parse as parseYaml } from "yaml";
import { ZuploEnv } from "../app/env.js";
import { getZudokuRootDir } from "../cli/common/package-json.js";
import { type ConfigWithMeta, getCurrentConfig } from "../config/loader.js";
import {
  getBuildConfig,
  type Processor,
} from "../config/validators/BuildSchema.js";
import {
  isBuildArtifactPlugin,
  type BuildApiDocument,
  type BuildContributionContext,
  type BuildContributions,
} from "../lib/core/plugins.js";
import { getAllTags } from "../lib/oas/graphql/index.js";
import { type OpenAPIDocument, validate } from "../lib/oas/parser/index.js";
import type {
  ApiCatalogItem,
  ApiCatalogPluginOptions,
} from "../lib/plugins/api-catalog/index.js";
import {
  MCP_CATALOG,
  type OasDocumentType,
  type VersionedInput,
} from "../lib/plugins/openapi/interfaces.js";
import {
  countMcpServers,
  countOperations,
  isKnownDocumentType,
  readDocumentType,
} from "../lib/plugins/openapi/util/documentType.js";
import { ensureArray } from "../lib/util/ensureArray.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { matchesAnyProtectedPattern, stripBasePath } from "../lib/util/url.js";
import {
  createOpenApiPublication,
  createOpenApiDevMiddleware,
  type OpenApiPublication,
  writeOpenApiPublications,
} from "./api/openapi-publication.js";
import { SchemaManager } from "./api/SchemaManager.js";
import {
  collectBuildContributions,
  createBuildArtifactDevMiddleware,
  writeBuildContributionManifest,
  writeBuildArtifacts,
} from "./build-artifacts.js";
import { reload } from "./plugin-config-reload.js";
import { invalidate as invalidateNavigation } from "./plugin-navigation.js";

const PROCESSED_STORE_SUBPATH = "node_modules/.zudoku/processed";

export const getCanonicalOrigin = (config: ConfigWithMeta) => {
  const configured = config.canonicalUrlOrigin;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const value =
    configured ??
    (vercelHost
      ? vercelHost.startsWith("http://") || vercelHost.startsWith("https://")
        ? vercelHost
        : `https://${vercelHost}`
      : undefined);
  if (!value) return undefined;

  try {
    const url = new URL(value);
    const isLocalHttp =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (url.protocol === "https:" || isLocalHttp) return url.origin;
    if (configured) {
      throw new Error(
        "canonicalUrlOrigin must use HTTPS (HTTP is allowed only for localhost)",
      );
    }
    return undefined;
  } catch {
    if (configured) {
      throw new Error(
        "canonicalUrlOrigin must be a valid HTTPS origin (HTTP is allowed only for localhost)",
      );
    }
    return undefined;
  }
};

type RemoteSchemaInspection = {
  schema: OpenAPIDocument;
  sourceContentType?: string;
  sourceOpenApiVersion?: string;
};

const protectedPatternIntersectsSubtree = (
  pattern: string,
  subtreePath: string,
) => {
  const root = subtreePath === "/" ? "/" : subtreePath.replace(/\/+$/, "");
  if (matchesAnyProtectedPattern([pattern], root)) return true;
  if (root === "/" || pattern.startsWith(`${root}/`)) return true;

  const patternSegments = pattern.split("/").filter(Boolean);
  const firstDynamicSegment = patternSegments.findIndex(
    (segment) =>
      segment === "*" || segment.startsWith(":") || segment.includes("*"),
  );
  if (firstDynamicSegment === -1) return false;

  const staticPrefix = `/${patternSegments
    .slice(0, firstDynamicSegment)
    .join("/")}`;
  return (
    staticPrefix === "/" ||
    root === staticPrefix ||
    root.startsWith(`${staticPrefix}/`)
  );
};

const inspectRemoteSchema = async (
  sourceUrl: string,
): Promise<RemoteSchemaInspection> => {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to inspect URL API schema "${sourceUrl}": ${response.status} ${response.statusText}`,
    );
  }

  const body = await response.text();
  const raw = parseYaml(body);
  const sourceOpenApiVersion =
    raw && typeof raw === "object" && typeof raw.openapi === "string"
      ? raw.openapi
      : undefined;
  const schema = await validate(raw);
  const responseContentType = response.headers
    .get("Content-Type")
    ?.toLowerCase();
  const sourceContentType = responseContentType?.includes("yaml")
    ? "application/yaml"
    : responseContentType?.includes("json")
      ? "application/json"
      : body.trimStart().startsWith("{")
        ? "application/json"
        : "application/yaml";

  return {
    schema,
    sourceContentType,
    sourceOpenApiVersion,
  };
};

export const createBuildContributionContext = async (
  config: ConfigWithMeta,
  schemaManager: SchemaManager,
  remoteSchemas: Map<string, Promise<RemoteSchemaInspection>>,
): Promise<BuildContributionContext> => {
  const apis: BuildApiDocument[] = [];
  const canonicalOrigin = getCanonicalOrigin(config);
  const protectedPatterns = Object.keys(config.protectedRoutes ?? {});
  const isProtected = (docsPath: string) => {
    const unbasedPath = stripBasePath(docsPath, config.basePath);
    return protectedPatterns.some((pattern) =>
      protectedPatternIntersectsSubtree(pattern, unbasedPath),
    );
  };

  for (const apiConfig of ensureArray(config.apis ?? [])) {
    if (!apiConfig.path) continue;
    const discoverable = apiConfig.discoverable !== false;
    if (!discoverable) continue;

    if (apiConfig.type === "file") {
      const schemas = schemaManager.getSchemasForPath(apiConfig.path) ?? [];
      apis.push(
        ...schemas.flatMap((schema, index) => {
          const docsPath = joinUrl(
            config.basePath,
            apiConfig.path,
            schemas.length > 1 ? schema.path : undefined,
          );
          if (isProtected(docsPath)) return [];

          return [
            {
              inputType: "file" as const,
              apiPath: apiConfig.path ?? "api",
              docsPath,
              version: schema.version,
              versionPath: schemas.length > 1 ? schema.path : "",
              title: schema.schema.info?.title ?? apiConfig.path ?? "API",
              description: schema.schema.info?.description,
              openApiVersion: schema.schema.openapi,
              schema: { ...schema.schema },
              explicitPublicationPath:
                index === 0 && apiConfig.publish
                  ? apiConfig.publish.path
                  : undefined,
              isPrimary: index === 0,
              discoverable,
            },
          ];
        }),
      );
      continue;
    }

    if (apiConfig.type === "raw") {
      const docsPath = joinUrl(config.basePath, apiConfig.path);
      if (isProtected(docsPath)) continue;

      const schema = await validate(apiConfig.input);
      apis.push({
        inputType: "raw",
        apiPath: apiConfig.path,
        docsPath,
        version: schema.info?.version ?? "default",
        versionPath: "",
        title: schema.info?.title ?? apiConfig.path,
        description: schema.info?.description,
        openApiVersion: schema.openapi,
        schema: { ...schema },
        explicitPublicationPath: apiConfig.publish
          ? apiConfig.publish.path
          : undefined,
        isPrimary: true,
        discoverable,
      });
      continue;
    }

    const inputs =
      typeof apiConfig.input === "string" ? [apiConfig.input] : apiConfig.input;
    for (const [index, input] of inputs.entries()) {
      const versioned = typeof input === "string" ? undefined : input;
      const sourceUrl = typeof input === "string" ? input : input.input;
      const versionPath = versioned?.path ?? "";
      const docsPath = joinUrl(
        config.basePath,
        apiConfig.path,
        inputs.length > 1 ? versionPath : undefined,
      );
      if (isProtected(docsPath)) continue;

      // An absolute URL is already an authoritative publication and can be
      // linked from llms.txt without an origin. Defer metadata/MCP inspection
      // until an origin-bound artifact actually needs it, so local builds do
      // not become dependent on remote schema uptime.
      if (!canonicalOrigin) {
        apis.push({
          inputType: "url",
          apiPath: apiConfig.path,
          docsPath,
          version: (versioned?.label ?? versionPath) || "default",
          versionPath: inputs.length > 1 ? versionPath : "",
          title: apiConfig.path,
          sourceUrl,
          isPrimary: index === 0,
          discoverable,
        });
        continue;
      }

      let schemaPromise = remoteSchemas.get(sourceUrl);
      if (!schemaPromise) {
        schemaPromise = inspectRemoteSchema(sourceUrl);
        remoteSchemas.set(sourceUrl, schemaPromise);
      }
      const inspection = await schemaPromise;
      const schema = inspection.schema;
      apis.push({
        inputType: "url",
        apiPath: apiConfig.path,
        docsPath,
        version: schema.info?.version ?? versioned?.label ?? "default",
        versionPath: inputs.length > 1 ? versionPath : "",
        title: schema.info?.title ?? apiConfig.path,
        description: schema.info?.description,
        sourceUrl,
        sourceContentType: inspection.sourceContentType,
        openApiVersion: inspection.sourceOpenApiVersion,
        schema: { ...schema },
        isPrimary: index === 0,
        discoverable,
      });
    }
  }

  return {
    basePath: config.basePath,
    canonicalOrigin,
    siteTitle: config.site?.title,
    apis,
  };
};

export const schemaConfigurationChanged = (
  current: Pick<ConfigWithMeta, "apis" | "basePath">,
  next: Pick<ConfigWithMeta, "apis" | "basePath">,
) => current.basePath !== next.basePath || !deepEqual(current.apis, next.apis);

export const createRawOpenApiPublications = async (
  config: ConfigWithMeta,
): Promise<OpenApiPublication[]> =>
  Promise.all(
    ensureArray(config.apis ?? []).flatMap((apiConfig) => {
      if (apiConfig.type !== "raw" || !apiConfig.publish || !apiConfig.path) {
        return [];
      }
      const { path: urlPath } = apiConfig.publish;
      const apiPath = apiConfig.path;
      return [
        validate(apiConfig.input).then((schema) =>
          createOpenApiPublication({
            apiPath,
            urlPath,
            schema,
          }),
        ),
      ];
    }),
  );

const mergeOpenApiPublications = (
  publications: readonly OpenApiPublication[],
) => {
  const byPath = new Map<string, OpenApiPublication>();
  for (const publication of publications) {
    const existing = byPath.get(publication.urlPath);
    if (existing) {
      throw new Error(
        `OpenAPI publication path "${publication.urlPath}" is configured by both "${existing.apiPath}" and "${publication.apiPath}". Configure a unique path for each published API.`,
      );
    }
    byPath.set(publication.urlPath, publication);
  }
  return [...byPath.values()];
};

const warn = (message: string) => {
  // biome-ignore lint/suspicious/noConsole: Logging allowed here
  console.warn(`[zudoku] ${message}`);
};

/**
 * Reads `x-zudoku-type` off a processed schema. Unknown values warn and fall
 * back to the default view rather than failing the build, so a schema authored
 * against a newer Zudoku still builds against an older one.
 */
const resolveDocumentType = (
  schema: OpenAPIDocument,
  apiPath = "<unknown>",
): OasDocumentType | undefined => {
  const value = readDocumentType(schema);
  if (value === undefined) return undefined;
  if (isKnownDocumentType(value)) return value;

  warn(
    `Unknown "x-zudoku-type" value ${JSON.stringify(value)} in "${apiPath}". Rendering the default API view.`,
  );
  return undefined;
};

/** `type: "raw"` inputs are schema strings in the config, so they resolve at
 * build time like files do. `parse` handles JSON as well, YAML being a
 * superset of it. */
const resolveRawDocumentType = (input: string, apiPath = "<unknown>") => {
  try {
    return resolveDocumentType(parseYaml(input), apiPath);
  } catch {
    // An unparseable raw schema fails later with a better message than
    // anything this could produce.
    return undefined;
  }
};

const viteApiPlugin = async (): Promise<Plugin> => {
  const virtualModuleId = "virtual:zudoku-api-plugins";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

  const initialConfig = getCurrentConfig();

  // Load Zuplo-specific processors if in Zuplo environment
  const zuploProcessors = ZuploEnv.isZuplo
    ? await runnerImport<{ default: (rootDir: string) => Processor[] }>(
        path.resolve(getZudokuRootDir(), "src/zuplo/with-zuplo-processors.ts"),
      ).then((m) => m.module.default(initialConfig.__meta.rootDir))
    : [];

  const buildConfig = await getBuildConfig();
  const buildProcessors = buildConfig?.processors ?? [];

  const tmpStoreDir = path.posix.join(
    initialConfig.__meta.rootDir,
    PROCESSED_STORE_SUBPATH,
  );

  const processors = [...buildProcessors, ...zuploProcessors];
  const schemaManager = new SchemaManager({
    storeDir: tmpStoreDir,
    config: initialConfig,
    processors,
  });

  await fs.rm(tmpStoreDir, { recursive: true, force: true });
  await fs.mkdir(tmpStoreDir, { recursive: true });
  await schemaManager.processAllSchemas();

  const remoteSchemas = new Map<string, Promise<RemoteSchemaInspection>>();
  let rawOpenApiPublications =
    await createRawOpenApiPublications(initialConfig);
  const getOpenApiPublications = () =>
    mergeOpenApiPublications([
      ...schemaManager.getPublishedSchemas(),
      ...rawOpenApiPublications,
    ]);
  getOpenApiPublications();
  let buildContributions: Required<BuildContributions> = {
    artifacts: [],
    aliases: [],
    routeHeaders: [],
    llmsSections: [],
    warnings: [],
  };

  const refreshBuildContributions = async (config: ConfigWithMeta) => {
    const plugins = config.plugins ?? [];
    if (!plugins.some(isBuildArtifactPlugin)) {
      buildContributions = {
        artifacts: [],
        aliases: [],
        routeHeaders: [],
        llmsSections: [],
        warnings: [],
      };
      await writeBuildContributionManifest(
        config.__meta.rootDir,
        buildContributions,
      );
      return;
    }

    const contributionContext = await createBuildContributionContext(
      config,
      schemaManager,
      remoteSchemas,
    );
    buildContributions = await collectBuildContributions(
      plugins,
      contributionContext,
    );
    await writeBuildContributionManifest(
      config.__meta.rootDir,
      buildContributions,
    );
    for (const warning of buildContributions.warnings) {
      warn(warning);
    }
  };

  await refreshBuildContributions(initialConfig);

  return {
    name: "zudoku-api-plugins",
    async buildStart() {
      schemaManager
        .getAllTrackedFiles()
        .forEach((file) => this.addWatchFile(file));
    },
    configureServer(server) {
      server.middlewares.use(
        createBuildArtifactDevMiddleware({
          getContributions: () => buildContributions,
        }),
      );

      // Serve downloadable and explicitly published OpenAPI schema files.
      server.middlewares.use(
        createOpenApiDevMiddleware({
          getPublications: getOpenApiPublications,
          getDownloadPathMap: () => schemaManager.getUrlToFilePathMap(),
        }),
      );

      server.watcher.on("change", async (id) => {
        const mainFiles = schemaManager.getFilesToReprocess(id);
        if (mainFiles.length === 0) return;

        // biome-ignore lint/suspicious/noConsole: Logging allowed here
        console.log(`Re-processing schema ${id}`);

        try {
          for (const inputConfig of mainFiles) {
            await schemaManager.processSchema(inputConfig);
          }
          await refreshBuildContributions(getCurrentConfig());
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          server.config.logger.error(
            `Failed to re-process schema ${id}. Fix the error and save again.`,
            { error: err },
          );
          server.ws.send({
            type: "error",
            err: {
              message: `Failed to re-process schema ${id}: ${err.message}`,
              stack: err.stack ?? "",
            },
          });
          return;
        }
        schemaManager
          .getAllTrackedFiles()
          .forEach((file) => server.watcher.add(file));

        invalidateNavigation(server);
        reload(server);
      });
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return;

      const config = getCurrentConfig();

      if (schemaConfigurationChanged(schemaManager.config, config)) {
        schemaManager.config = config;
        await schemaManager.processAllSchemas();
        rawOpenApiPublications = await createRawOpenApiPublications(config);
        await refreshBuildContributions(config);
        schemaManager
          .getAllTrackedFiles()
          .forEach((file) => this.addWatchFile(file));
      }

      if (config.__meta.mode === "standalone") {
        return [
          "export const configuredApiPlugins = [];",
          "export const configuredApiCatalogPlugins = [];",
        ].join("\n");
      }

      const code = [
        `import config from "virtual:zudoku-config";`,
        `const configuredApiPlugins = [];`,
        `const configuredApiCatalogPlugins = [];`,
      ];

      if (config.apis) {
        code.push('import { openApiPlugin } from "zudoku/plugins/openapi";');
        code.push(
          `const apis = Array.isArray(config.apis) ? config.apis : [config.apis]`,
        );
        const apis = ensureArray(config.apis);
        const apiMetadata: ApiCatalogItem[] = [];

        for (const apiConfig of apis) {
          if (apiConfig.type === "file" && apiConfig.path) {
            const latestSchema = schemaManager.getLatestSchema(apiConfig.path);
            if (!latestSchema?.schema.info) continue;

            // A catalog document hides its non-MCP operations, so counting all
            // of them would advertise endpoints the page never renders.
            const isCatalog =
              resolveDocumentType(latestSchema.schema, apiConfig.path) ===
              MCP_CATALOG;

            const operationCount = isCatalog
              ? countMcpServers(latestSchema.schema)
              : countOperations(latestSchema.schema);

            const rawVersion = latestSchema.schema.info.version;
            const version = rawVersion
              ? rawVersion.startsWith("v") || rawVersion.startsWith("V")
                ? rawVersion
                : `v${rawVersion}`
              : undefined;

            apiMetadata.push({
              path: apiConfig.path,
              label: latestSchema.schema.info.title,
              description: latestSchema.schema.info.description ?? "",
              categories: apiConfig.categories ?? [],
              version,
              operationCount,
              countLabel: isCatalog
                ? operationCount === 1
                  ? "server"
                  : "servers"
                : undefined,
            });
          }
        }

        // Generate API plugin code
        let apiIndex = -1;
        for (const apiConfig of apis) {
          apiIndex++;
          if (apiConfig.type === "file") {
            if (!apiConfig.path) continue;

            const schemas = schemaManager.getSchemasForPath(apiConfig.path);

            if (!schemas?.length) continue;

            const allSlugs = new Set<string>();
            const versionedInput = schemas.map<VersionedInput>((s) => {
              const versionTags = getAllTags(s.schema);
              versionTags.forEach(({ slug }) => {
                if (slug) allSlugs.add(slug);
              });

              return {
                path: s.path,
                version: s.version,
                downloadUrl: s.downloadUrl,
                label: s.label ?? s.schema.info?.version,
                input: s.importKey,
                hasUntaggedOperations: versionTags.some(
                  (tag) => tag.name === undefined,
                ),
                tagPages: versionTags.flatMap((t) => t.slug ?? []),
              };
            });

            const tags = Array.from(allSlugs);

            const schemaImports = schemaManager.getSchemaImports();

            // Catalog mode renders a single page, so it reads the flag from the
            // latest schema only and ignores the other versions entirely.
            const latest = schemas.at(0);
            const documentType = latest
              ? resolveDocumentType(latest.schema, apiConfig.path)
              : undefined;

            if (documentType === MCP_CATALOG) {
              if (schemas.length > 1) {
                warn(
                  `"${apiConfig.path}" is an MCP catalog with ${schemas.length} versions. Only the latest is rendered; catalog documents do not support version switching.`,
                );
              }
              if (latest && countMcpServers(latest.schema) === 0) {
                warn(
                  `"${apiConfig.path}" is marked as an MCP catalog but has no operations with "x-mcp-server". The catalog will render empty.`,
                );
              }
            }

            code.push(
              "configuredApiPlugins.push(openApiPlugin({",
              `  type: "file",`,
              `  input: ${JSON.stringify(versionedInput)},`,
              `  path: ${JSON.stringify(apiConfig.path)},`,
              `  tagPages: ${JSON.stringify(tags)},`,
              ...(documentType
                ? [`  documentType: ${JSON.stringify(documentType)},`]
                : []),
              `  options: {`,
              `    examplesLanguage: config.defaults?.apis?.examplesLanguage ?? config.defaults?.examplesLanguage,`,
              `    supportedLanguages: config.defaults?.apis?.supportedLanguages,`,
              `    disablePlayground: config.defaults?.apis?.disablePlayground,`,
              `    disableSidecar: config.defaults?.apis?.disableSidecar,`,
              `    disableSecurity: config.defaults?.apis?.disableSecurity ?? true,`,
              `    disableMcpAuthInstructions: config.defaults?.apis?.disableMcpAuthInstructions,`,
              `    showVersionSelect: config.defaults?.apis?.showVersionSelect ?? "if-available",`,
              `    expandAllTags: config.defaults?.apis?.expandAllTags ?? true,`,
              `    showInfoPage: config.defaults?.apis?.showInfoPage,`,
              `    schemaDownload: config.defaults?.apis?.schemaDownload,`,
              `    transformExamples: config.defaults?.apis?.transformExamples,`,
              `    generateCodeSnippet: config.defaults?.apis?.generateCodeSnippet,`,
              `    ...(apis[${apiIndex}].options ?? {}),`,
              `  },`,
              `  schemaImports: {`,
              ...schemaImports.map(
                (s) =>
                  `    "${s.importKey.replaceAll("\\", "\\\\")}": () => import("${s.importKey.replaceAll("\\", "/")}?d=${s.processedTime}"),`,
              ),
              `  },`,
              "}));",
            );
          } else {
            // URL schemas are fetched in the browser, so the flag can only be
            // resolved for inputs available at build time. A flagged URL schema
            // silently keeps the default view.
            const documentType =
              apiConfig.type === "raw"
                ? resolveRawDocumentType(apiConfig.input, apiConfig.path)
                : undefined;

            code.push(
              "configuredApiPlugins.push(openApiPlugin({",
              `  ...${JSON.stringify(apiConfig)},`,
              ...(documentType
                ? [`  documentType: ${JSON.stringify(documentType)},`]
                : []),
              "  options: {",
              `    examplesLanguage: config.defaults?.apis?.examplesLanguage ?? config.defaults?.examplesLanguage,`,
              `    supportedLanguages: config.defaults?.apis?.supportedLanguages,`,
              `    disablePlayground: config.defaults?.apis?.disablePlayground,`,
              `    disableSidecar: config.defaults?.apis?.disableSidecar,`,
              `    disableSecurity: config.defaults?.apis?.disableSecurity ?? true,`,
              `    disableMcpAuthInstructions: config.defaults?.apis?.disableMcpAuthInstructions,`,
              `    showVersionSelect: config.defaults?.apis?.showVersionSelect ?? "if-available",`,
              `    expandAllTags: config.defaults?.apis?.expandAllTags ?? false,`,
              `    showInfoPage: config.defaults?.apis?.showInfoPage,`,
              `    schemaDownload: config.defaults?.apis?.schemaDownload,`,
              `    ...${JSON.stringify(apiConfig.options ?? {})},`,
              "  },",
              "}));",
            );
          }
        }

        if (config.catalogs) {
          code.push(
            'import { apiCatalogPlugin } from "zudoku/plugins/api-catalog";',
          );

          const catalogs = ensureArray(config.catalogs);

          const categories = apis
            .flatMap((api) => api.categories ?? [])
            .reduce((acc, catalog) => {
              if (!acc.has(catalog.label)) {
                acc.set(catalog.label ?? "", new Set(catalog.tags));
              }
              for (const tag of catalog.tags) {
                acc.get(catalog.label ?? "")?.add(tag);
              }
              return acc;
            }, new Map<string, Set<string>>());

          const categoryList = Array.from(categories.entries()).map(
            ([label, tags]) => ({
              label,
              tags: Array.from(tags),
            }),
          );

          for (let i = 0; i < catalogs.length; i++) {
            const catalog = catalogs[i];
            if (!catalog) {
              continue;
            }
            const apiCatalogConfig: ApiCatalogPluginOptions = {
              ...catalog,
              items: apiMetadata,
              label: catalog.label,
              categories: categoryList,
              filterCatalogItems: catalog.filterItems,
            };

            code.push(
              `configuredApiCatalogPlugins.push(apiCatalogPlugin({`,
              `  ...${JSON.stringify(apiCatalogConfig, null, 2)},`,
              `  filterCatalogItems: Array.isArray(config.catalogs)`,
              `    ? config.catalogs[${i}].filterItems`,
              `    : config.catalogs.filterItems,`,
              `}));`,
            );
          }
        }
      }

      code.push(
        `export { configuredApiPlugins, configuredApiCatalogPlugins };`,
      );

      return code.join("\n");
    },
    async closeBundle() {
      if (this.environment.name === "ssr") return;

      const config = getCurrentConfig();
      const pathMap = schemaManager.getUrlToFilePathMap();

      if (process.env.NODE_ENV !== "production") return;

      for (const [urlPath, inputPath] of pathMap) {
        const content = await fs.readFile(inputPath, "utf-8");
        const outputPath = path.join(config.__meta.rootDir, "dist", urlPath);

        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, content, "utf-8");
      }

      await writeOpenApiPublications(
        path.join(config.__meta.rootDir, "dist"),
        getOpenApiPublications(),
      );
      await writeBuildArtifacts(
        path.join(config.__meta.rootDir, "dist"),
        buildContributions.artifacts,
      );
    },
  };
};

export default viteApiPlugin;
