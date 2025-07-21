import rehypeMetaAsAttributes from "@lekoarts/rehype-meta-as-attributes";
import mdx from "@mdx-js/rollup";
import withToc from "@stefanprobst/rehype-extract-toc";
import withTocExport from "@stefanprobst/rehype-extract-toc/mdx";
import type { Root as HastRoot } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import type { Root } from "mdast";
import path from "node:path";
import rehypeMdxImportMedia from "rehype-mdx-import-media";
import rehypeSlug from "rehype-slug";
import remarkComment from "remark-comment";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { EXIT, visit } from "unist-util-visit";
import type { VFile } from "vfile";
import { type Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { createConfiguredShikiRehypePlugins } from "../lib/shiki.js";
import { remarkLastModified } from "./mdx/remark-last-modified.js";
import { exportMdxjsConst } from "./mdx/utils.js";
import { remarkStaticGeneration } from "./remarkStaticGeneration.js";

// Convert mdxJsxFlowElement img elements to regular element nodes
// so rehype-mdx-import-media can pick them up
const rehypeNormalizeMdxImages = () => (tree: any) => {
  visit(tree, ["mdxJsxFlowElement", "mdxJsxElement"], (node) => {
    if (node.type !== "mdxJsxFlowElement") return;
    if (!["img", "video"].includes(node.name)) return;

    const hasStringSrc = node.attributes.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (attr: any) =>
        attr.type === "mdxJsxAttribute" &&
        attr.name === "src" &&
        typeof attr.value === "string",
    );

    if (!hasStringSrc) return;

    node.type = "element";
    node.tagName = node.name;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    node.properties = {} as Record<string, any>;

    for (const attr of node.attributes) {
      if (attr.type === "mdxJsxAttribute" && typeof attr.value === "string") {
        node.properties[attr.name] = attr.value;
      }
    }

    delete node.name;
    delete node.attributes;
    delete node.children;
    delete node.data;
    delete node.position;
  });
};

const remarkLinkRewritePlugin =
  (basePath = "") =>
  (tree: Root) => {
    visit(tree, "link", (node) => {
      if (!node.url) return;

      const base = path.join(basePath);
      if (basePath && node.url.startsWith(base)) {
        node.url = node.url.slice(base.length);
      } else if (
        !node.url.startsWith("http") &&
        !node.url.startsWith("mailto:") &&
        !node.url.startsWith("/") &&
        !node.url.startsWith("#")
      ) {
        node.url = path.join("../", node.url);
      }

      node.url = node.url.replace(/\.mdx?(#.*?)?/, "$1");
    });
  };

const remarkInjectFilepath =
  (rootDir: string) => (tree: Root, vfile: VFile) => {
    tree.children.unshift(
      exportMdxjsConst("__filepath", path.relative(rootDir, vfile.path)),
    );
  };

const rehypeExcerptWithMdxExport = () => (tree: HastRoot) => {
  let excerpt: string | undefined;

  visit(tree, "element", (node, _index, parent) => {
    if (node.tagName !== "p" || parent?.type !== "root") return;

    excerpt = hastToString(node);
    return EXIT;
  });

  if (!excerpt) return;

  tree.children.unshift(exportMdxjsConst("excerpt", excerpt));
};

const viteMdxPlugin = (): Plugin => {
  const config = getCurrentConfig();

  return {
    enforce: "pre",
    ...mdx({
      providerImportSource:
        config.__meta.mode === "internal" || config.__meta.mode === "standalone"
          ? "@mdx-js/react"
          : "zudoku/components",
      // Treat .md files as MDX
      mdxExtensions: [".md", ".mdx"],
      format: "mdx",
      remarkPlugins: [
        remarkStaticGeneration,
        [remarkInjectFilepath, config.__meta.rootDir],
        remarkComment,
        remarkGfm,
        remarkFrontmatter,
        // ---  important:
        // this must be sandwiched between remarkFrontmatter and remarkMdxFrontmatter
        remarkLastModified,
        // ---
        remarkMdxFrontmatter,
        remarkDirective,
        remarkDirectiveRehype,
        [remarkLinkRewritePlugin, config.basePath],
        ...(config.build?.remarkPlugins ?? []),
      ],
      rehypePlugins: [
        rehypeSlug,
        withToc,
        withTocExport,
        rehypeExcerptWithMdxExport,
        rehypeNormalizeMdxImages,
        rehypeMdxImportMedia,
        rehypeMetaAsAttributes,
        ...createConfiguredShikiRehypePlugins(
          config.syntaxHighlighting?.themes,
        ),
        ...(config.build?.rehypePlugins ?? []),
      ],
    }),
    name: "zudoku-mdx-plugin",
  } as const;
};

export default viteMdxPlugin;
