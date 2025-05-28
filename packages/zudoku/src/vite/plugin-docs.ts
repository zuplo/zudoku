import { glob } from "glob";
import { minimatch } from "minimatch";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { DocResolver } from "../lib/plugins/markdown/resolver.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { writePluginDebugCode } from "./debug.js";
import { reload } from "./plugin-config-reload.js";

const ensureLeadingSlash = joinUrl;

const viteDocsPlugin = (): Plugin => {
  const virtualModuleId = "virtual:zudoku-docs-plugins";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  let server: ViteDevServer;

  return {
    name: "zudoku-docs-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    configureServer(srv) {
      server = srv;
    },
    watchChange(id, change) {
      if (change.event !== "delete" && change.event !== "create") return;

      const config = getCurrentConfig();
      const resolver = new DocResolver(config);
      const docsConfigs = resolver.getDocsConfigs();

      const matches = docsConfigs.some((docConfig) =>
        minimatch(
          ensureLeadingSlash(path.relative(config.__meta.rootDir, id)),
          docConfig.files,
        ),
      );

      if (matches) reload(server);
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const config = getCurrentConfig();

        if (config.__meta.mode === "standalone") {
          return `export const configuredDocsPlugins = [];`;
        }

        const code: string[] = [
          // IMPORTANT! This path here is important, we MUST resolve
          // files here as Typescript from the appDir
          config.__meta.mode === "internal"
            ? `import { markdownPlugin } from "${config.__meta.moduleDir}/src/lib/plugins/markdown/index.tsx";`
            : `import { markdownPlugin } from "zudoku/plugins/markdown";`,
          `const docsPluginOptions = [];`,
        ];

        const resolver = new DocResolver(config);
        const docsConfigs = resolver.getDocsConfigs();

        const globImportBasePath =
          process.env.NODE_ENV === "development" ? (config.basePath ?? "") : "";

        for (let i = 0; i < docsConfigs.length; i++) {
          const docsConfig = docsConfigs[i];

          if (!docsConfig) continue;

          // This is a workaround for a bug(?) in Vite where `import.meta.glob` failed us:
          // - Root dir is `/path/to/docs`
          // - The Markdown docs config is `/docs/**/*.md`
          // - The basePath config is set to `/docs`
          // This results in:
          // > `Internal server error: Failed to resolve import "/some.md" from "virtual:zudoku-docs-plugins". Does the file exist?`
          // Mind that the `docs` part that should be prepended is not in there
          //
          // This does only happen in dev SSR environments, so for prod the `basePath` is not added

          const globbedFiles = await glob(docsConfig.files, {
            root: config.__meta.rootDir,
            ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
            absolute: false,
            posix: true,
          });

          code.push(
            `const fileImports${i} = Object.assign({`,
            ...globbedFiles.map(
              (file) =>
                `  "${ensureLeadingSlash(file)}": () => import("${ensureLeadingSlash(path.posix.join(globImportBasePath, file))}"),`,
            ),
            `});`,
            `docsPluginOptions.push({`,
            `  fileImports: fileImports${i},`,
            `  defaultOptions: ${JSON.stringify(docsConfig.defaultOptions)},`,
            `  files: ${JSON.stringify(docsConfig.files)}`,
            `});`,
          );
        }

        // Even though this returns an array, the plugin should be a single
        // instance because we need to make sure that there are not duplicate
        // routes even if different folders have been used.
        code.push(
          `const configuredDocsPlugins = [markdownPlugin(docsPluginOptions)]`,
          `export { configuredDocsPlugins };`,
        );

        await writePluginDebugCode(config.__meta.rootDir, "docs-plugin", code);

        return code.join("\n");
      }
    },
  };
};

export default viteDocsPlugin;
