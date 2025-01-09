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

        if (config.mode === "standalone") {
          return [
            "export const configuredApiPlugins = [];",
            "export const configuredApiCatalogPlugins = [];",
          ].join("\n");
        }

        const code = [
          `import config from "virtual:zudoku-config";`,
          `import { openApiPlugin } from "zudoku/plugins/openapi";`,
          `import { apiCatalogPlugin } from "zudoku/plugins/api-catalog";`,
          `const configuredApiPlugins = [];`,
          `const configuredApiCatalogPlugins = [];`,
        ];

        if (config.apis) {
          const apis = Array.isArray(config.apis) ? config.apis : [config.apis];
          const catalogs = Array.isArray(config.catalogs)
            ? config.catalogs
            : [config.catalogs];

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
              const postProcessors = apiConfig.postProcessors ?? [];
              const inputs = Array.isArray(apiConfig.input)
                ? apiConfig.input
                : [apiConfig.input];

              const inputFiles = await Promise.all(
                inputs.map(async (input) =>
                  /\.ya?ml$/.test(input)
                    ? yaml.parse(await fs.readFile(input, "utf-8"))
                    : JSON.parse(await fs.readFile(input, "utf-8")),
                ),
              );

              const processedSchemas = await Promise.all(
                inputFiles
                  .map((schema) =>
                    postProcessors.reduce(
                      async (acc, postProcessor) => postProcessor(await acc),
                      schema,
                    ),
                  )
                  .map(async (schema) => await validate(schema)),
              );

              const latestSchema = processedSchemas.at(0);

              if (!latestSchema) {
                throw new Error("No schema found");
              }

              if (apiConfig.navigationId) {
                apiMetadata.push({
                  path: apiConfig.navigationId,
                  label: latestSchema.info.title,
                  description: latestSchema.info.description ?? "",
                  categories: apiConfig.categories ?? [],
                });
              }

              const processedFilePaths = inputs.map((input) =>
                path.posix.join(tmpDir, `${path.basename(input)}.json`),
              );

              const versionMap = Object.fromEntries(
                processedSchemas.map((schema, index) => [
                  schema.info.version || "default",
                  processedFilePaths[index],
                ]),
              );

              if (Object.keys(versionMap).length === 0) {
                throw new Error("No schema versions found");
              }

              await Promise.all(
                processedSchemas.map((schema, i) => {
                  if (!processedFilePaths[i]) {
                    throw new Error("No processed file path found");
                  }
                  fs.writeFile(processedFilePaths[i], JSON.stringify(schema));
                }),
              );

              code.push(
                "configuredApiPlugins.push(openApiPlugin({",
                '  type: "file",',
                `  input: {${Object.entries(versionMap)
                  .map(
                    ([version, path]) =>
                      `"${version}": () => import("${path}")`,
                  )
                  .join(",")}},`,
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

        code.push(
          `export { configuredApiPlugins, configuredApiCatalogPlugins };`,
        );

        return code.join("\n");
      }
    },
  };
};

export default viteApiPlugin;
