import fs from "node:fs/promises";
import path from "node:path";
import { deepEqual } from "fast-equals";
import { type Plugin, runnerImport } from "vite";
import { ZuploEnv } from "../app/env.js";
import { getCurrentConfig } from "../config/loader.js";
import {
  getBuildConfig,
  type Processor,
} from "../config/validators/BuildSchema.js";
import {
  getAllOperations,
  getAllSlugs,
  getAllTags,
} from "../lib/oas/graphql/index.js";
import type {
  ApiCatalogItem,
  ApiCatalogPluginOptions,
} from "../lib/plugins/api-catalog/index.js";
import { ensureArray } from "../lib/util/ensureArray.js";
import { SchemaManager } from "./api/SchemaManager.js";
import { reload } from "./plugin-config-reload.js";
import { invalidate as invalidateNavigation } from "./plugin-navigation.js";

const viteApiPlugin = async (): Promise<Plugin> => {
  const virtualModuleId = "virtual:zudoku-api-plugins";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

  const initialConfig = getCurrentConfig();

  // Load Zuplo-specific processors if in Zuplo environment
  const zuploProcessors = ZuploEnv.isZuplo
    ? await runnerImport<{ default: (rootDir: string) => Processor[] }>(
        path.resolve(import.meta.dirname, "../zuplo/with-zuplo-processors.js"),
      ).then((m) => m.module.default(initialConfig.__meta.rootDir))
    : [];

  const buildConfig = await getBuildConfig();
  const buildProcessors = buildConfig?.processors ?? [];

  const tmpStoreDir = path.posix.join(
    initialConfig.__meta.rootDir,
    "node_modules/.zudoku/processed",
  );

  const processors = [...buildProcessors, ...zuploProcessors];
  const schemaManager = new SchemaManager({
    storeDir: tmpStoreDir,
    config: initialConfig,
    processors,
  });

  return {
    name: "zudoku-api-plugins",
    async buildStart() {
      await fs.rm(tmpStoreDir, { recursive: true, force: true });
      await fs.mkdir(tmpStoreDir, { recursive: true });

      await schemaManager.processAllSchemas();

      schemaManager
        .getAllTrackedFiles()
        .forEach((file) => this.addWatchFile(file));
    },
    configureServer(server) {
      // Serve original OpenAPI schema files
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" || !req.url) return next();
        if (
          !req.url.toLowerCase().endsWith(".json") &&
          !req.url.toLowerCase().endsWith(".yaml")
        ) {
          return next();
        }

        const pathMap = schemaManager.getUrlToFilePathMap();

        const inputPath = pathMap.get(req.url);
        if (!inputPath) return next();

        const content = await fs.readFile(inputPath, "utf-8");
        const mimeType =
          path.extname(inputPath).toLowerCase() === ".json"
            ? "application/json"
            : "application/x-yaml";

        res.setHeader("Content-Type", `${mimeType}; charset=utf-8`);
        return res.end(content);
      });

      server.watcher.on("change", async (id) => {
        const mainFiles = schemaManager.getFilesToReprocess(id);
        if (mainFiles.length === 0) return;

        // biome-ignore lint/suspicious/noConsole: Logging allowed here
        console.log(`Re-processing schema ${id}`);

        for (const mainFile of mainFiles) {
          await schemaManager.processSchema({ input: mainFile });
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

      if (!deepEqual(schemaManager.config.apis, config.apis)) {
        schemaManager.config = config;
        await schemaManager.processAllSchemas();
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

            apiMetadata.push({
              path: apiConfig.path,
              label: latestSchema.schema.info.title,
              description: latestSchema.schema.info.description ?? "",
              categories: apiConfig.categories ?? [],
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

            const tags = Array.from(
              new Set(
                schemas
                  .flatMap(({ schema }) => {
                    const operations = getAllOperations(schema.paths);
                    const slugs = getAllSlugs(operations);
                    return getAllTags(schema, slugs.tags);
                  })
                  .flatMap(({ slug }) => slug ?? []),
              ),
            );

            const schemaMapEntries = Array.from(
              schemaManager.schemaMap.entries(),
            );

            const versionedInput = schemas.map((s) => ({
              path: s.path,
              version: s.version,
              downloadUrl: s.downloadUrl,
              label: s.label ?? s.schema.info?.version,
              input: s.inputPath,
            }));

            code.push(
              "configuredApiPlugins.push(openApiPlugin({",
              `  type: "file",`,
              `  input: ${JSON.stringify(versionedInput)},`,
              `  path: ${JSON.stringify(apiConfig.path)},`,
              `  tagPages: ${JSON.stringify(tags)},`,
              `  options: {`,
              `    examplesLanguage: config.defaults?.apis?.examplesLanguage ?? config.defaults?.examplesLanguage,`,
              `    supportedLanguages: config.defaults?.apis?.supportedLanguages,`,
              `    disablePlayground: config.defaults?.apis?.disablePlayground,`,
              `    disableSidecar: config.defaults?.apis?.disableSidecar,`,
              `    showVersionSelect: config.defaults?.apis?.showVersionSelect ?? "if-available",`,
              `    expandAllTags: config.defaults?.apis?.expandAllTags ?? true,`,
              `    expandApiInformation: config.defaults?.apis?.expandApiInformation ?? false,`,
              `    schemaDownload: config.defaults?.apis?.schemaDownload,`,
              `    transformExamples: config.defaults?.apis?.transformExamples,`,
              `    generateCodeSnippet: config.defaults?.apis?.generateCodeSnippet,`,
              `    ...(apis[${apiIndex}].options ?? {}),`,
              `  },`,
              `  schemaImports: {`,
              ...schemaMapEntries.map(
                ([key, processed]) =>
                  `    "${key.replace(/\\/g, "\\\\")}": () => import("${processed.filePath.replace(/\\/g, "/")}?d=${processed.processedTime}"),`,
              ),
              `  },`,
              "}));",
            );
          } else {
            code.push(
              "configuredApiPlugins.push(openApiPlugin({",
              `  ...${JSON.stringify(apiConfig)},`,
              "  options: {",
              `    examplesLanguage: config.defaults?.apis?.examplesLanguage ?? config.defaults?.examplesLanguage,`,
              `    supportedLanguages: config.defaults?.apis?.supportedLanguages,`,
              `    disablePlayground: config.defaults?.apis?.disablePlayground,`,
              `    disableSidecar: config.defaults?.apis?.disableSidecar,`,
              `    showVersionSelect: config.defaults?.apis?.showVersionSelect ?? "if-available",`,
              `    expandAllTags: config.defaults?.apis?.expandAllTags ?? false,`,
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
    },
  };
};

export default viteApiPlugin;
