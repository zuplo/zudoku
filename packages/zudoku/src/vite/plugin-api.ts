import fs from "node:fs/promises";
import path from "node:path";
import { tsImport } from "tsx/esm/api";
import { type Plugin } from "vite";
import yaml from "yaml";
import { type ZudokuPluginOptions } from "../config/config.js";
import { upgradeSchema } from "../lib/oas/parser/upgrade/index.js";
import type {
  ApiCatalogItem,
  ApiCatalogPluginOptions,
} from "../lib/plugins/api-catalog/index.js";
import { generateCode } from "./api/schema-codegen.js";

type ProcessedSchema = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any;
  version: string;
  inputPath: string;
};

const schemaMap = new Map<string, string>();

async function processSchemas(
  config: ZudokuPluginOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  zuploProcessors: Array<(schema: any) => Promise<any>> = [],
): Promise<Record<string, ProcessedSchema[]>> {
  const tmpDir = path.posix.join(
    config.rootDir,
    "node_modules/.zudoku/processed",
  );
  await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.mkdir(tmpDir, { recursive: true });

  if (!config.apis) return {};

  const apis = Array.isArray(config.apis) ? config.apis : [config.apis];
  const processedSchemas: Record<string, ProcessedSchema[]> = {};

  for (const apiConfig of apis) {
    if (apiConfig.type !== "file" || !apiConfig.navigationId) {
      continue;
    }

    const postProcessors = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (schema: any) => upgradeSchema(schema),
      ...(apiConfig.postProcessors ?? []),
      ...zuploProcessors,
    ];

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

    const processedInputs = await Promise.all(
      inputFiles.map(async (schema, index) => {
        const processedSchema = await postProcessors.reduce(
          async (acc, postProcessor) => postProcessor(await acc),
          schema,
        );

        const inputPath = inputs[index]!;
        const processedPath = path.posix.join(
          tmpDir,
          `${path.basename(inputPath)}.js`,
        );

        const code = await generateCode(processedSchema);
        await fs.writeFile(processedPath, code);
        schemaMap.set(inputPath, processedPath);

        return {
          schema: processedSchema,
          version: processedSchema.info.version || "default",
          inputPath,
        } satisfies ProcessedSchema;
      }),
    );

    if (processedInputs.length === 0) {
      throw new Error("No schema found");
    }

    processedSchemas[apiConfig.navigationId] = processedInputs;
  }

  return processedSchemas;
}

const viteApiPlugin = async (
  getConfig: () => ZudokuPluginOptions,
): Promise<Plugin> => {
  const virtualModuleId = "virtual:zudoku-api-plugins";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  const initialConfig = getConfig();

  // Load Zuplo-specific processors if in Zuplo environment
  const zuploProcessors = initialConfig.isZuplo
    ? await tsImport("../zuplo/with-zuplo-processors.ts", import.meta.url)
        .then((m) => m.default(initialConfig.rootDir))
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn("Failed to load Zuplo processors", e);
          return [];
        })
    : [];

  let processedSchemas: Record<string, ProcessedSchema[]>;

  return {
    name: "zudoku-api-plugins",
    async buildStart() {
      processedSchemas = await processSchemas(getConfig(), zuploProcessors);
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
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
          const apiMetadata: ApiCatalogItem[] = [];
          const versionMaps: Record<string, Record<string, string>> = {};

          for (const apiConfig of apis) {
            if (apiConfig.type === "file" && apiConfig.navigationId) {
              const schemas = processedSchemas[apiConfig.navigationId];
              if (!schemas?.length) continue;

              const latestSchema = schemas[0]?.schema;
              if (!latestSchema?.info) continue;

              apiMetadata.push({
                path: apiConfig.navigationId,
                label: latestSchema.info.title,
                description: latestSchema.info.description ?? "",
                categories: apiConfig.categories ?? [],
              });

              const versionMap = Object.fromEntries(
                schemas.map((processed) => [
                  processed.version,
                  processed.inputPath,
                ]),
              );

              if (Object.keys(versionMap).length > 0) {
                versionMaps[apiConfig.navigationId] = versionMap;
              }
            }
          }

          // Generate API plugin code
          for (const apiConfig of apis) {
            if (apiConfig.type === "file") {
              if (
                !apiConfig.navigationId ||
                !versionMaps[apiConfig.navigationId]
              ) {
                continue;
              }

              code.push(
                "configuredApiPlugins.push(openApiPlugin({",
                `  type: "file",`,
                `  input: ${JSON.stringify(versionMaps[apiConfig.navigationId])},`,
                `  navigationId: ${JSON.stringify(apiConfig.navigationId)},`,
                `  schemaImports: {`,
                ...Array.from(schemaMap.entries()).map(
                  ([key, schemaPath]) =>
                    `    "${key}": () => import("${schemaPath.replace(/\\/g, "/")}"),`,
                ),
                `  },`,
                "}));",
              );
            } else {
              code.push(
                `configuredApiPlugins.push(openApiPlugin(${JSON.stringify(apiConfig)}));`,
              );
            }
          }

          if (config.catalogs) {
            const catalogs = Array.isArray(config.catalogs)
              ? config.catalogs
              : [config.catalogs];

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
      }
    },
  };
};

export default viteApiPlugin;
