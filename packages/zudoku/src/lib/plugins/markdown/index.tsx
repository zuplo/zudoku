import type { Toc } from "@stefanprobst/rehype-extract-toc";
import type { MDXProps } from "mdx/types.js";
import { type JSX } from "react";
import { RouteObject } from "react-router";
import { ZudokuDocsConfig } from "../../../config/validators/common.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import { DocResolver } from "./resolver.js";

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
};

export type MDXImport = {
  tableOfContents: Toc;
  frontmatter: Frontmatter;
  excerpt?: string;
  default: (props: MDXProps) => JSX.Element;
};

export const markdownPlugin = (
  options: MarkdownPluginOptions[],
): ZudokuPlugin => ({
  getRoutes: () => {
    const routeMap = new Map<string, RouteObject>();
    options.forEach(({ fileImports, files, defaultOptions }) =>
      Object.entries(fileImports).flatMap(([file, importPromise]) => {
        const routePath = DocResolver.resolveRoutePath({
          filesGlob: files,
          fsPath: file,
        });

        if (!routePath) return [];

        if (routeMap.has(routePath)) {
          // eslint-disable-next-line no-console
          console.warn(
            `Duplicate route path found for ${routePath}. Skipping file at '${file}'.`,
          );
          return [];
        }

        const route: RouteObject = {
          path: routePath,
          lazy: async () => {
            const { MdxPage } = await import("./MdxPage.js");
            const { default: Component, ...props } = await importPromise();
            return {
              element: (
                <MdxPage
                  file={file}
                  mdxComponent={Component}
                  {...props}
                  defaultOptions={defaultOptions}
                />
              ),
            };
          },
        };
        routeMap.set(routePath, route);
      }),
    );
    return [...routeMap.values()];
  },
});
