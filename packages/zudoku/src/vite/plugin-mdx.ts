import rehypeMetaAsAttributes from "@lekoarts/rehype-meta-as-attributes";
import mdx from "@mdx-js/rollup";
import withToc from "@stefanprobst/rehype-extract-toc";
import withTocExport from "@stefanprobst/rehype-extract-toc/mdx";
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
import { type Plugin } from "vite";
import { type LoadedConfig } from "../config/config.js";
import { remarkStaticGeneration } from "./remarkStaticGeneration.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rehypeCodeBlockPlugin = () => (tree: any) => {
  visit(tree, "element", (node, index, parent) => {
    if (node.type === "element" && node.tagName === "code") {
      node.properties.inline = parent?.tagName !== "pre";
    }
  });
};

// Convert mdxJsxFlowElement img elements to regular element nodes
// so rehype-mdx-import-media can pick them up
const rehypeNormalizeMdxImages = () => (tree: any) => {
  visit(tree, ["mdxJsxFlowElement", "mdxJsxElement"], (node) => {
    if (node.type !== "mdxJsxFlowElement" || node.name !== "img") return;

    const hasStringSrc = node.attributes.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (attr: any) =>
        attr.type === "mdxJsxAttribute" &&
        attr.name === "src" &&
        typeof attr.value === "string",
    );

    if (!hasStringSrc) return;

    node.type = "element";
    node.tagName = "img";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rehypeExcerptWithMdxExport = () => (tree: any) => {
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

const viteMdxPlugin = (getConfig: () => LoadedConfig): Plugin => {
  const config = getConfig();

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
        remarkComment,
        remarkGfm,
        remarkFrontmatter,
        remarkMdxFrontmatter,
        remarkDirective,
        remarkDirectiveRehype,
        [remarkLinkRewritePlugin, config.basePath],
        ...(config.build?.remarkPlugins ?? []),
      ],
      rehypePlugins: [
        rehypeSlug,
        rehypeCodeBlockPlugin,
        rehypeMetaAsAttributes,
        withToc,
        withTocExport,
        rehypeExcerptWithMdxExport,
        ...(config.build?.rehypePlugins ?? []),
        rehypeNormalizeMdxImages,
        rehypeMdxImportMedia,
      ],
    }),
    name: "zudoku-mdx-plugin",
  } as const;
};

export default viteMdxPlugin;
