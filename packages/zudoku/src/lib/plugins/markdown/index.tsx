import type { Toc } from "@stefanprobst/rehype-extract-toc";
import type { MDXProps } from "mdx/types.js";
import type { DevPortalPlugin } from "../../core/plugins.js";
import { generateRoutes } from "./generateRoutes.js";

export type MarkdownPluginOptions = {
  markdownFiles: Record<string, () => Promise<MDXImport>>;
  defaultOptions?: MarkdownPluginDefaultOptions;
  filesPath: string;
};
export type MarkdownPluginDefaultOptions = Pick<
  Frontmatter,
  "toc" | "disablePager"
>;

export type Frontmatter = {
  title?: string;
  description?: string;
  category?: string;
  toc?: boolean;
  disablePager?: boolean;
};

export type MDXImport = {
  tableOfContents: Toc;
  frontmatter: Frontmatter;
  default: (props: MDXProps) => JSX.Element;
};

export const markdownPlugin = ({
  markdownFiles,
  defaultOptions,
  filesPath,
}: MarkdownPluginOptions): DevPortalPlugin => ({
  getRoutes: () => generateRoutes(markdownFiles, filesPath, defaultOptions),
});
