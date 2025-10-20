import path from "node:path";
import { glob } from "glob";
import globParent from "glob-parent";
import type { Plugin } from "vite";
import { type ConfigWithMeta, getCurrentConfig } from "../config/loader.js";
import { NavigationResolver } from "../config/validators/NavigationSchema.js";
import { DocsConfigSchema } from "../config/validators/validate.js";
import { traverseNavigation } from "../lib/components/navigation/utils.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { writePluginDebugCode } from "./debug.js";

const ensureLeadingSlash = joinUrl;

// Glob markdown files and returns a mapping of route paths to file paths.
export const globMarkdownFiles = async (
  config: ConfigWithMeta,
  options: { absolute: boolean } = { absolute: false },
): Promise<Record<string, string>> => {
  const docsConfig = DocsConfigSchema.parse(config.docs ?? {});
  const fileMapping: Record<string, string> = {};

  for (const globPattern of docsConfig.files) {
    const globbedFiles = await glob(globPattern, {
      root: config.__meta.rootDir,
      ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
      absolute: options.absolute,
      posix: true,
    });

    // Normalize parent by removing leading `./` or `/`
    const parent = globParent(globPattern).replace(/^\.?\//, "");

    const toRoutePath = (file: string) => {
      const relativePath = path.posix.relative(parent, file);
      return ensureLeadingSlash(relativePath.replace(/\.mdx?$/, ""));
    };

    for (const file of globbedFiles) {
      const routePath = toRoutePath(file);
      fileMapping[routePath] = file;
    }
  }

  return fileMapping;
};

/**
 * Resolves custom navigation paths and returns an updated file mapping.
 * Handles cases where navigation defines custom paths for documents.
 */
export const resolveCustomNavigationPaths = async (
  config: ConfigWithMeta,
  fileMapping: Record<string, string>,
): Promise<Record<string, string>> => {
  if (!config.navigation) return fileMapping;

  const resolvedNavigation = await new NavigationResolver(config).resolve();
  const mapping = { ...fileMapping };

  traverseNavigation(resolvedNavigation, (item) => {
    const doc =
      item.type === "doc"
        ? { file: item.file, path: item.path }
        : item.type === "category" && item.link
          ? { file: item.link.file, path: item.link.path }
          : undefined;

    // Only continue if the doc has a custom path
    if (!doc || doc.path === doc.file) return;

    const fileRoutePath = ensureLeadingSlash(doc.file.replace(/\.mdx?$/, ""));
    const filePath = mapping[fileRoutePath];
    if (!filePath) return;

    const customPath = ensureLeadingSlash(doc.path);
    mapping[customPath] = filePath;
    delete mapping[fileRoutePath];
  });

  return mapping;
};

const viteDocsPlugin = (): Plugin => {
  const virtualModuleId = "virtual:zudoku-docs-plugin";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

  return {
    name: "zudoku-docs-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return;

      const config = getCurrentConfig();

      if (config.__meta.mode === "standalone") {
        return `export const configuredDocsPlugin = undefined;`;
      }

      const code: string[] = [
        // IMPORTANT! This path here is important, we MUST resolve
        // files here as Typescript from the appDir
        config.__meta.mode === "internal"
          ? `import { markdownPlugin } from "${config.__meta.moduleDir}/src/lib/plugins/markdown/index.tsx";`
          : `import { markdownPlugin } from "zudoku/plugins/markdown";`,
      ];

      const docsConfig = DocsConfigSchema.parse(config.docs ?? {});

      // This is a workaround for a bug(?) in Vite where `import.meta.glob` failed us:
      // - Root dir is `/path/to/docs`
      // - The Markdown docs config is `/docs/**/*.md`
      // - The basePath config is set to `/docs`
      // This results in:
      // > `Internal server error: Failed to resolve import "/some.md" from "virtual:zudoku-docs-plugins". Does the file exist?`
      // Mind that the `docs` part that should be prepended is not in there
      //
      // This does only happen in dev SSR environments, so for prod the `basePath` is not added
      const globImportBasePath =
        process.env.NODE_ENV === "development" ? (config.basePath ?? "") : "";

      // Glob markdown files and resolve custom navigation paths
      const fileMapping = await resolveCustomNavigationPaths(
        config,
        await globMarkdownFiles(config, { absolute: false }),
      );

      // Transform file paths to import paths
      const globbedDocuments: Record<string, string> = {};
      for (const [routePath, file] of Object.entries(fileMapping)) {
        const importPath = ensureLeadingSlash(
          path.posix.join(globImportBasePath, file),
        );
        globbedDocuments[routePath] = importPath;
      }

      code.push(
        `const fileImports = {`,
        ...Object.entries(globbedDocuments).map(
          ([routePath, importPath]) =>
            `  "${routePath}": () => import("${importPath}"),`,
        ),
        `};`,
        `export const configuredDocsPlugin = markdownPlugin({`,
        `  fileImports,`,
        `  defaultOptions: ${JSON.stringify(docsConfig.defaultOptions)},`,
        `});`,
      );

      await writePluginDebugCode(config.__meta.rootDir, "docs-plugin", code);

      return code.join("\n");
    },
  };
};

export default viteDocsPlugin;
