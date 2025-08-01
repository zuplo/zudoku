import rehypeMetaAsAttributes from "@lekoarts/rehype-meta-as-attributes";
import mdx from "@mdx-js/rollup";
import withToc from "@stefanprobst/rehype-extract-toc";
import withTocExport from "@stefanprobst/rehype-extract-toc/mdx";
import type { Root as HastRoot } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import rehypeMdxImportMedia from "rehype-mdx-import-media";
import rehypeSlug from "rehype-slug";
import remarkComment from "remark-comment";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { EXIT, visit } from "unist-util-visit";
import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { createConfiguredShikiRehypePlugins } from "../lib/shiki.js";
import { remarkInjectFilepath } from "./mdx/remark-inject-filepath.js";
import { remarkLastModified } from "./mdx/remark-last-modified.js";
import { remarkLinkRewrite } from "./mdx/remark-link-rewrite.js";
import { remarkNormalizeImageUrl } from "./mdx/remark-normalize-image-url.js";
import { remarkStaticGeneration } from "./mdx/remark-static-generation.js";
import { exportMdxjsConst } from "./mdx/utils.js";

// Convert mdxJsxFlowElement img elements to regular element nodes
// so rehype-mdx-import-media can pick them up
// biome-ignore lint/suspicious/noExplicitAny: Allow any type
const rehypeNormalizeMdxImages = () => (tree: any) => {
  visit(tree, ["mdxJsxFlowElement", "mdxJsxElement"], (node) => {
    if (node.type !== "mdxJsxFlowElement") return;
    if (!["img", "video"].includes(node.name)) return;

    const hasStringSrc = node.attributes.some(
      // biome-ignore lint/suspicious/noExplicitAny: Allow any type
      (attr: any) =>
        attr.type === "mdxJsxAttribute" &&
        attr.name === "src" &&
        typeof attr.value === "string",
    );

    if (!hasStringSrc) return;

    node.type = "element";
    node.tagName = node.name;
    // biome-ignore lint/suspicious/noExplicitAny: Allow any type
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
      mdxExtensions: [".mdx"],
      format: "detect",
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
        [remarkLinkRewrite, config.basePath],
        [remarkNormalizeImageUrl, config.basePath],
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
