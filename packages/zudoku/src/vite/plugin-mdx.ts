import rehypeMetaAsAttributes from "@lekoarts/rehype-meta-as-attributes";
import mdx from "@mdx-js/rollup";
import withToc from "@stefanprobst/rehype-extract-toc";
import withTocExport from "@stefanprobst/rehype-extract-toc/mdx";
import { toString as hastToString } from "hast-util-to-string";
import type { Root } from "mdast";
import path from "node:path";
import rehypeSlug from "rehype-slug";
import remarkComment from "remark-comment";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { EXIT, visit } from "unist-util-visit";
import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { remarkStaticGeneration } from "./remarkStaticGeneration.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rehypeCodeBlockPlugin = () => (tree: any) => {
  visit(tree, "element", (node, index, parent) => {
    if (node.type === "element" && node.tagName === "code") {
      node.properties.inline = parent?.tagName !== "pre";
    }
  });
};

const remarkLinkRewritePlugin =
  (basePath = "") =>
  (tree: Root) => {
    visit(tree, "link", (node) => {
      if (!node.url) return;

      const base = path.join(basePath);
      if (node.url.startsWith(base)) {
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

const rehypeMediaBase =
  (base = "") =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (tree: any) => {
    if (!base) return;

    visit(tree, "element", (node) => {
      if (node.tagName !== "img" && node.tagName !== "video") return;

      if (node.properties.src && !node.properties.src.startsWith("http")) {
        node.properties.src = joinUrl(base, node.properties.src);
      }
    });
  };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rehypeExcerptWithMdxExport = () => (tree: any, _vfile: any) => {
  let excerpt: string | undefined;

  visit(tree, "element", (node) => {
    if (node.tagName !== "p") return;

    excerpt = hastToString(node);
    return EXIT;
  });

  if (!excerpt) return;

  // Inject the excerpt as a named export into the MDX AST
  // Injection code taken from @stefanprobst/rehype-extract-toc/mdx
  tree.children.unshift({
    type: "mdxjsEsm",
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ExportNamedDeclaration",
            source: null,
            specifiers: [],
            declaration: {
              type: "VariableDeclaration",
              kind: "const",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: { name: "excerpt", type: "Identifier" },
                  init: {
                    type: "Literal",
                    value: excerpt,
                    raw: JSON.stringify(excerpt),
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });
};

const viteMdxPlugin = (getConfig: () => ZudokuPluginOptions): Plugin => {
  const config = getConfig();
  let base: string | undefined;

  return {
    enforce: "pre",
    configResolved: (v) => {
      base = v.base;
    },
    ...mdx({
      providerImportSource:
        config.mode === "internal" || config.mode === "standalone"
          ? "@mdx-js/react"
          : "zudoku/components",
      // Treat .md files as MDX
      mdxExtensions: [".md", ".mdx"],
      format: "mdx",
      remarkPlugins: [
        remarkStaticGeneration,
        remarkComment,
        remarkGfm,
        remarkFrontmatter,
        remarkMdxFrontmatter,
        remarkDirective,
        remarkDirectiveRehype,
        [remarkLinkRewritePlugin, config.basePath],
        ...(config.build?.remarkPlugins ?? []),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
      rehypePlugins: [
        rehypeSlug,
        rehypeCodeBlockPlugin,
        rehypeMetaAsAttributes,
        [rehypeMediaBase, base],
        withToc,
        withTocExport,
        rehypeExcerptWithMdxExport,
        ...(config.build?.rehypePlugins ?? []),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
    }),
    name: "zudoku-mdx-plugin",
  } as const;
};

export default viteMdxPlugin;
