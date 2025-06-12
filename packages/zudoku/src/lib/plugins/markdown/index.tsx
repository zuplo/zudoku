import type { Toc } from "@stefanprobst/rehype-extract-toc";
import type { MDXProps } from "mdx/types.js";
import { type JSX } from "react";
import type { ZudokuDocsConfig } from "../../../config/validators/validate.js";
import type { ZudokuPlugin } from "../../core/plugins.js";

export interface MarkdownPluginOptions extends ZudokuDocsConfig {
  fileImports: Record<string, () => Promise<MDXImport>>;
}
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
  disable_pager?: boolean;
};

export type MDXImport = {
  tableOfContents: Toc;
  frontmatter: Frontmatter;
  excerpt?: string;
  default: (props: MDXProps) => JSX.Element;
};

export const markdownPlugin = (
  options: MarkdownPluginOptions,
): ZudokuPlugin => ({
  getRoutes: () => {
    return Object.entries(options.fileImports).map(
      ([routePath, importPromise]) => ({
        path: routePath,
        lazy: async () => {
          const { MdxPage } = await import("./MdxPage.js");
          const { default: Component, ...props } = await importPromise();
          return {
            element: (
              <MdxPage
                file={routePath}
                mdxComponent={Component}
                {...props}
                defaultOptions={options.defaultOptions}
              />
            ),
          };
        },
      }),
    );
  },
});
