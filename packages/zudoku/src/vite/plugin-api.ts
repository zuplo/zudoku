import {
  $RefParser,
  type JSONSchema,
} from "@apidevtools/json-schema-ref-parser";
import { upgrade, validate } from "@scalar/openapi-parser";
import fs from "node:fs/promises";
import path from "node:path";
import { runnerImport, type Plugin } from "vite";
import { type LoadedConfig } from "../config/config.js";
import { fileExists } from "../config/loader.js";
import {
  validateBuildConfig,
  type BuildConfig,
  type Processor,
} from "../config/validators/BuildSchema.js";
import {
  getAllOperations,
  getAllSlugs,
  getAllTags,
  type OpenAPIDocument,
} from "../lib/oas/graphql/index.js";
import type {
  ApiCatalogItem,
  ApiCatalogPluginOptions,
} from "../lib/plugins/api-catalog/index.js";
import { generateCode } from "./api/schema-codegen.js";
import { reload } from "./plugin-config-reload.js";

type ProcessedSchema = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: OpenAPIDocument;
  version: string;
  inputPath: string;
};

const schemaMap = new Map<string, string>();

const validateSchema = async (schema: JSONSchema, filePath: string) => {
  const validated = await validate(schema);
  if (validated.errors?.length) {
    // eslint-disable-next-line no-console
    console.warn(`Schema warnings in ${filePath}:`);
    for (const error of validated.errors) {
      // eslint-disable-next-line no-console
      console.warn(error);
    }
  }

  return schema as OpenAPIDocument;
};

// We track all schema files to invalidate when changed (this includes external references as well)
const allSchemaFiles = new Set<string>();

async function processSchemas(
  dir: string,
  config: LoadedConfig,
  processors: Processor[] = [],
): Promise<Record<string, ProcessedSchema[]>> {
  if (!config.apis) return {};

  const apis = Array.isArray(config.apis) ? config.apis : [config.apis];
  const processedSchemas: Record<string, ProcessedSchema[]> = {};

  allSchemaFiles.clear();

  for (const apiConfig of apis) {
    if (apiConfig.type !== "file" || !apiConfig.navigationId) {
      continue;
    }

    const allProcessors = [
      ({ schema }) => upgrade(schema).specification,
      ...processors,
    ] satisfies Processor[];

    const inputs = Array.isArray(apiConfig.input)
      ? apiConfig.input
      : [apiConfig.input];

    const inputFiles = await Promise.all(
      inputs.map(async (input) => {
        const fullPath = path.resolve(config.__meta.rootDir, input);
        const parser = new $RefParser();
        const schema = await parser.bundle(fullPath);

        parser.$refs.paths().forEach((file) => allSchemaFiles.add(file));

        return validateSchema(schema, input);
      }),
    );

    const processedInputs = await Promise.all(
      inputFiles.map(async (schema, index) => {
        let processedSchema = schema;

        for (const processor of allProcessors) {
          processedSchema = await processor({
            schema: processedSchema,
            file: inputs[index]!,
            dereference: (schema) =>
              new $RefParser<OpenAPIDocument>().dereference(schema),
          });
        }

        const inputPath = inputs[index]!;
        const code = await generateCode(processedSchema, inputPath);

        const processedFilePath = path.posix.join(
          dir,
          `${path.basename(inputPath)}.js`,
        );
        await fs.writeFile(processedFilePath, code);
        schemaMap.set(inputPath, processedFilePath);

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
  getConfig: () => LoadedConfig,
): Promise<Plugin> => {
  const virtualModuleId = "virtual:zudoku-api-plugins";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  const initialConfig = getConfig();

  // Load Zuplo-specific processors if in Zuplo environment
  const zuploProcessors = initialConfig.isZuplo
    ? await runnerImport<{ default: (rootDir: string) => Processor[] }>(
        "../zuplo/with-zuplo-processors.js",
      )
        .then((m) => m.module.default(initialConfig.__meta.rootDir))
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn("Failed to load Zuplo processors", e);
          return [];
        })
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

  let processedSchemas: Record<string, ProcessedSchema[]>;
  const tmpDir = path.posix.join(
    initialConfig.__meta.rootDir,
    "node_modules/.zudoku/processed",
  );

  return {
    name: "zudoku-api-plugins",
    async buildStart() {
      await fs.rm(tmpDir, { recursive: true, force: true });
      await fs.mkdir(tmpDir, { recursive: true });

      processedSchemas = await processSchemas(tmpDir, getConfig(), [
        ...zuploProcessors,
        ...buildProcessors,
      ]);
      // Potential files outside of the root dir are not watched by default, so we add all schemas just to be sure
      allSchemaFiles.forEach((file) => this.addWatchFile(file));
    },
    configureServer(server) {
      server.watcher.on("change", async (id) => {
        if (!allSchemaFiles.has(id)) return;

        processedSchemas = await processSchemas(tmpDir, getConfig(), [
          ...zuploProcessors,
          ...buildProcessors,
        ]);
        allSchemaFiles.forEach((file) => server.watcher.add(file));
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
        let apiIndex = -1;
        for (const apiConfig of apis) {
          apiIndex++;
          if (apiConfig.type === "file") {
            if (
              !apiConfig.navigationId ||
              !versionMaps[apiConfig.navigationId]
            ) {
              continue;
            }

            const schemas = processedSchemas[apiConfig.navigationId];
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

            code.push(
              "configuredApiPlugins.push(openApiPlugin({",
              `  type: "file",`,
              `  input: ${JSON.stringify(versionMaps[apiConfig.navigationId])},`,
              `  navigationId: ${JSON.stringify(apiConfig.navigationId)},`,
              `  tagPages: ${JSON.stringify(tags)},`,
              `  options: {`,
              `    examplesLanguage: config.defaults?.apis?.examplesLanguage ?? config.defaults?.examplesLanguage,`,
              `    disablePlayground: config.defaults?.apis?.disablePlayground,`,
              `    showVersionSelect: config.defaults?.apis?.showVersionSelect ?? "if-available",`,
              `    expandAllTags: config.defaults?.apis?.expandAllTags ?? true,`,
              `    transformExamples: config.defaults?.apis?.transformExamples,`,
              `    ...(apis[${apiIndex}].options ?? {}),`,
              `  },`,
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
              "configuredApiPlugins.push(openApiPlugin({",
              `  ...${JSON.stringify(apiConfig)},`,
              "  options: {",
              `    examplesLanguage: config.defaults?.apis?.examplesLanguage ?? config.defaults?.examplesLanguage,`,
              `    disablePlayground: config.defaults?.apis?.disablePlayground,`,
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
    },
  };
};

export default viteApiPlugin;
