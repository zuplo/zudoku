import fs from "node:fs/promises";
import path from "node:path";
import { type Plugin } from "vite";
import yaml from "yaml";
import { type ZudokuPluginOptions } from "../config/config.js";
import { validate } from "../lib/oas/parser/index.js";
import type {
  ApiCatalogItem,
  ApiCatalogPluginOptions,
} from "../lib/plugins/api-catalog/index.js";

const viteApiPlugin = (getConfig: () => ZudokuPluginOptions): Plugin => {
  const virtualModuleId = "virtual:zudoku-api-plugins";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "zudoku-api-plugins",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id, options) {
      if (id === resolvedVirtualModuleId) {
        const config = getConfig();

        const code = [
          `import { openApiPlugin } from "zudoku/plugins/openapi";`,
          `import { apiCatalogPlugin } from "zudoku/plugins/api-catalog";`,
          `const configuredApiPlugins = [];`,
          `const configuredApiCatalogPlugins = [];`,
        ];

        if (config.apis) {
          const apis = Array.isArray(config.apis) ? config.apis : [config.apis];
          const catalogs = Array.isArray(config.catalog)
            ? config.catalog
            : [config.catalog];

          const categories = apis
            .flatMap((api) => api.categories ?? [])
            .reduce((acc, catalog) => {
              if (!acc.has(catalog.label)) {
                acc.set(catalog.label, new Set(catalog.tags));
              }
              for (const tag of catalog.tags) {
                acc.get(catalog.label)?.add(tag);
              }
              return acc;
            }, new Map<string, Set<string>>());

          const tmpDir = path.posix.join(
            config.rootDir,
            "node_modules/.zudoku/processed",
          );
          await fs.rm(tmpDir, { recursive: true, force: true });
          await fs.mkdir(tmpDir, { recursive: true });

          const apiMetadata: ApiCatalogItem[] = [];
          for (const apiConfig of apis) {
            if (apiConfig.type === "file") {
              const fileContent = await fs.readFile(apiConfig.input, "utf-8");

              let schema = /\.ya?ml$/.test(apiConfig.input)
                ? yaml.parse(fileContent)
                : JSON.parse(fileContent);

              for (const postProcessor of apiConfig.postProcessors ?? []) {
                schema = await postProcessor(schema);
              }

              const openAPISchema = await validate(schema);

              if (apiConfig.navigationId) {
                apiMetadata.push({
                  path: apiConfig.navigationId,
                  label: openAPISchema.info.title,
                  description: openAPISchema.info.description ?? "",
                  categories: apiConfig.categories ?? [],
                });
              }

              const processedFilePath = path.posix.join(
                tmpDir,
                `${path.basename(apiConfig.input)}.json`,
              );

              await fs.writeFile(processedFilePath, JSON.stringify(schema));
              code.push(
                "configuredApiPlugins.push(openApiPlugin({",
                '  type: "file",',
                `  input: () => import("${processedFilePath}"),`,
                `  navigationId: "${apiConfig.navigationId}",`,
                "}));",
              );
            } else {
              code.push(
                `// @ts-ignore`, // To make tests pass
                `configuredApiPlugins.push(openApiPlugin(${JSON.stringify({
                  ...apiConfig,
                  inMemory: options?.ssr ?? config.mode === "internal",
                })}));`,
              );
            }
          }

          const categoriesx = Array.from(categories.entries()).map(
            ([label, tags]) => ({
              label,
              tags: Array.from(tags),
            }),
          );

          for (const catalog of catalogs) {
            if (!catalog) {
              continue;
            }
            const apiCatalogConfig: ApiCatalogPluginOptions = {
              ...catalog,
              items: apiMetadata,
              label: catalog.label,
              categories: categoriesx,
            };

            code.push(
              `configuredApiCatalogPlugins.push(apiCatalogPlugin(${JSON.stringify(apiCatalogConfig)}));`,
            );
          }
        }

        code.push(
          `export { configuredApiPlugins, configuredApiCatalogPlugins };`,
        );

        return code.join("\n");
      }
    },
  };
};

export default viteApiPlugin;
