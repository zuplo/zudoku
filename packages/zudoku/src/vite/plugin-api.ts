import { deepEqual } from "fast-equals";
import fs from "node:fs/promises";
import path from "node:path";
import { type Plugin, runnerImport } from "vite";
import { ZuploEnv } from "../app/env.js";
import { type LoadedConfig } from "../config/config.js";
import { fileExists } from "../config/loader.js";
import {
  type BuildConfig,
  type Processor,
  validateBuildConfig,
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
import { invalidate as invalidateSidebar } from "./plugin-sidebar.js";

const viteApiPlugin = async (
  getConfig: () => LoadedConfig,
): Promise<Plugin> => {
  const virtualModuleId = "virtual:zudoku-api-plugins";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  const initialConfig = getConfig();

  // Load Zuplo-specific processors if in Zuplo environment
  const zuploProcessors = ZuploEnv.isZuplo
    ? await runnerImport<{ default: (rootDir: string) => Processor[] }>(
        path.resolve(import.meta.dirname, "../zuplo/with-zuplo-processors.js"),
      ).then((m) => m.module.default(initialConfig.__meta.rootDir))
    : [];

  const buildFilePath = path.join(
    initialConfig.__meta.rootDir,
    "zudoku.build.ts",
  );
  const buildFileExists = await fileExists(buildFilePath);

  let buildProcessors: Processor[] = [];
  let buildConfig: BuildConfig | undefined = undefined;

  if (buildFileExists) {
    const buildModule = await runnerImport<{ default: BuildConfig }>(
      buildFilePath,
    ).then((m) => m.module.default);

    buildConfig = validateBuildConfig(buildModule);
    buildProcessors = buildConfig?.processors ?? [];
  }

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

      schemaManager.trackedFiles.forEach((file) => this.addWatchFile(file));
    },
    configureServer(server) {
      server.watcher.on("change", async (id) => {
        if (!schemaManager.trackedFiles.has(id)) return;

        // eslint-disable-next-line no-console
        console.log(`Re-processing schema ${id}`);

        await schemaManager.processSchema(id);
        schemaManager.trackedFiles.forEach((file) => server.watcher.add(file));
        invalidateSidebar(server);
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

      const config = getConfig();

      if (!deepEqual(schemaManager.config.apis, config.apis)) {
        schemaManager.config = config;
        await schemaManager.processAllSchemas();
        schemaManager.trackedFiles.forEach((file) => this.addWatchFile(file));
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
          if (apiConfig.type === "file" && apiConfig.navigationId) {
            const latestSchema = schemaManager.getLatestSchema(
              apiConfig.navigationId,
            );
            if (!latestSchema?.schema.info) continue;

            apiMetadata.push({
              path: apiConfig.navigationId,
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
            if (!apiConfig.navigationId) continue;

            const schemas = schemaManager.getSchemasForId(
              apiConfig.navigationId,
            );

            if (!schemas?.length) continue;

            const tags = Array.from(
              new Set(
                schemas
                  .flatMap(({ schema }) => {
                    const operations = getAllOperations(schema.paths);
                    const slugs = getAllSlugs(operations);
                    return getAllTags(schema, slugs.tags);
                  })
                  .map(({ slug }) => slug),
              ),
            );

            const schemaMapEntries = Array.from(
              schemaManager.schemaMap.entries(),
            );

            code.push(
              "configuredApiPlugins.push(openApiPlugin({",
              `  type: "file",`,
              `  input: ${JSON.stringify(
                Object.fromEntries(
                  schemas.map((s) => [s.version, s.inputPath]),
                ),
              )},`,
              `  navigationId: ${JSON.stringify(apiConfig.navigationId)},`,
              `  tagPages: ${JSON.stringify(tags)},`,
              `  options: {`,
              `    examplesLanguage: config.defaults?.apis?.examplesLanguage ?? config.defaults?.examplesLanguage,`,
              `    disablePlayground: config.defaults?.apis?.disablePlayground,`,
              `    disableSidecar: config.defaults?.apis?.disableSidecar,`,
              `    showVersionSelect: config.defaults?.apis?.showVersionSelect ?? "if-available",`,
              `    expandAllTags: config.defaults?.apis?.expandAllTags ?? true,`,
              `    transformExamples: config.defaults?.apis?.transformExamples,`,
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
              `    disablePlayground: config.defaults?.apis?.disablePlayground,`,
              `    disableSidecar: config.defaults?.apis?.disableSidecar,`,
              `    showVersionSelect: config.defaults?.apis?.showVersionSelect ?? "if-available",`,
              `    expandAllTags: config.defaults?.apis?.expandAllTags ?? false,`,
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
  };
};

export default viteApiPlugin;
