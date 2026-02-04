import fs from "node:fs/promises";
import path from "node:path";
import { deepEqual } from "fast-equals";
import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import {
  getAllOperations,
  getAllSlugs,
  getAllTags,
} from "../lib/asyncapi/graphql/index.js";
import { ensureArray } from "../lib/util/ensureArray.js";
import { AsyncApiSchemaManager } from "./asyncapi/AsyncApiSchemaManager.js";
import { reload } from "./plugin-config-reload.js";
import { invalidate as invalidateNavigation } from "./plugin-navigation.js";

const viteAsyncApiPlugin = async (): Promise<Plugin> => {
  const virtualModuleId = "virtual:zudoku-asyncapi-plugins";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

  const initialConfig = getCurrentConfig();

  const tmpStoreDir = path.posix.join(
    initialConfig.__meta.rootDir,
    "node_modules/.zudoku/processed-asyncapi",
  );

  const schemaManager = new AsyncApiSchemaManager({
    storeDir: tmpStoreDir,
    config: initialConfig,
  });

  return {
    name: "zudoku-asyncapi-plugins",
    async buildStart() {
      await fs.rm(tmpStoreDir, { recursive: true, force: true });
      await fs.mkdir(tmpStoreDir, { recursive: true });

      await schemaManager.processAllSchemas();

      schemaManager
        .getAllTrackedFiles()
        .forEach((file) => this.addWatchFile(file));
    },
    configureServer(server) {
      // Serve original AsyncAPI schema files
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
        console.log(`[zudoku:asyncapi] Re-processing schema ${id}`);

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

      if (!deepEqual(schemaManager.config.asyncApis, config.asyncApis)) {
        schemaManager.config = config;
        await schemaManager.processAllSchemas();
        schemaManager
          .getAllTrackedFiles()
          .forEach((file) => this.addWatchFile(file));
      }

      if (config.__meta.mode === "standalone") {
        return ["export const configuredAsyncApiPlugins = [];"].join("\n");
      }

      const code = [
        `import config from "virtual:zudoku-config";`,
        `const configuredAsyncApiPlugins = [];`,
      ];

      if (config.asyncApis) {
        code.push('import { asyncApiPlugin } from "zudoku/plugins/asyncapi";');
        code.push(
          `const asyncApis = Array.isArray(config.asyncApis) ? config.asyncApis : [config.asyncApis]`,
        );
        const asyncApis = ensureArray(config.asyncApis);

        // Generate AsyncAPI plugin code
        let apiIndex = -1;
        for (const apiConfig of asyncApis) {
          apiIndex++;
          if (apiConfig.type === "file") {
            if (!apiConfig.path) continue;

            const schemas = schemaManager.getSchemasForPath(apiConfig.path);

            if (!schemas?.length) continue;

            const tags = Array.from(
              new Set(
                schemas
                  .flatMap(({ schema }) => {
                    const operations = getAllOperations(
                      schema.operations,
                      schema.channels,
                      schema.servers,
                    );
                    const slugs = getAllSlugs(
                      operations,
                      schema.info?.tags ?? [],
                      schema.channels,
                    );
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
              "configuredAsyncApiPlugins.push(asyncApiPlugin({",
              `  type: "file",`,
              `  input: ${JSON.stringify(versionedInput)},`,
              `  path: ${JSON.stringify(apiConfig.path)},`,
              `  tagPages: ${JSON.stringify(tags)},`,
              `  options: {`,
              `    expandAllTags: config.defaults?.asyncApis?.expandAllTags ?? true,`,
              `    expandApiInformation: config.defaults?.asyncApis?.expandApiInformation ?? false,`,
              `    schemaDownload: config.defaults?.asyncApis?.schemaDownload,`,
              `    ...(asyncApis[${apiIndex}].options ?? {}),`,
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
              "configuredAsyncApiPlugins.push(asyncApiPlugin({",
              `  ...${JSON.stringify(apiConfig)},`,
              "  options: {",
              `    expandAllTags: config.defaults?.asyncApis?.expandAllTags ?? false,`,
              `    expandApiInformation: config.defaults?.asyncApis?.expandApiInformation ?? false,`,
              `    schemaDownload: config.defaults?.asyncApis?.schemaDownload,`,
              `    ...${JSON.stringify(apiConfig.options ?? {})},`,
              "  },",
              "}));",
            );
          }
        }
      }

      code.push(`export { configuredAsyncApiPlugins };`);

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

export default viteAsyncApiPlugin;
