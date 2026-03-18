import path from "node:path";
import { glob } from "glob";
import globParent from "glob-parent";
import type { Plugin } from "vite";
import { type ConfigWithMeta, getCurrentConfig } from "../config/loader.js";
import {
  type NavigationItem,
  NavigationResolver,
} from "../config/validators/NavigationSchema.js";
import { DocsConfigSchema } from "../config/validators/validate.js";
import { traverseNavigation } from "../lib/components/navigation/utils.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { readFrontmatter } from "../lib/util/readFrontmatter.js";
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
      // Always glob with relative paths to avoid issues on different OS
      absolute: false,
      posix: true,
    });

    // Normalize parent by removing leading `./` or `/`
    const parent = globParent(globPattern).replace(/^\.?\//, "");

    // Precompute draft status for all files in production mode to avoid serial I/O
    let draftFiles = new Set<string>();
    if (process.env.NODE_ENV !== "development") {
      const draftStatuses = await Promise.all(
        globbedFiles.map(async (file) => {
          const absolutePath = path.resolve(config.__meta.rootDir, file);
          const { data } = await readFrontmatter(absolutePath);
          return { file, isDraft: data.draft === true };
        }),
      );
      draftFiles = new Set(
        draftStatuses
          .filter((entry) => entry.isDraft)
          .map((entry) => entry.file),
      );
    }

    for (const file of globbedFiles) {
      // Skip draft documents in production mode
      if (draftFiles.has(file)) {
        continue;
      }

      const relativePath = path.posix.relative(parent, file);
      const routePath = ensureLeadingSlash(relativePath.replace(/\.mdx?$/, ""));
      // Resolve to absolute path if requested, using path.resolve to handle cross-platform paths
      const filePath = options.absolute
        ? path.resolve(config.__meta.rootDir, file)
        : file;
      fileMapping[routePath] = filePath;
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
  if (!config.navigation && !config.navigationRules) return fileMapping;

  const resolver = new NavigationResolver(config);
  const mapping = { ...fileMapping };

  const processItem = (item: NavigationItem) => {
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
  };

  if (config.navigation) {
    const resolvedNavigation = await resolver.resolve();
    traverseNavigation(resolvedNavigation, processItem);
  }

  if (config.navigationRules) {
    const resolvedRules = await resolver.resolveRules(config.navigationRules);
    for (const rule of resolvedRules) {
      if (rule.type === "insert") {
        traverseNavigation(rule.items, processItem);
      }
    }
  }

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

      const code = [
        'import { markdownPlugin } from "zudoku/plugins/markdown";',
      ];

      const docsConfig = DocsConfigSchema.parse(config.docs ?? {});

      // Glob markdown files and resolve custom navigation paths
      const fileMapping = await resolveCustomNavigationPaths(
        config,
        await globMarkdownFiles(config, { absolute: false }),
      );

      // Transform file paths to import paths
      const globbedDocuments: Record<string, string> = {};
      for (const [routePath, file] of Object.entries(fileMapping)) {
        const importPath = ensureLeadingSlash(file);
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
        `  basePath: "${config.basePath ?? ""}",`,
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
