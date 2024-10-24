import type { Toc } from "@stefanprobst/rehype-extract-toc";
import type { MDXProps } from "mdx/types.js";
import { RouteObject } from "react-router-dom";
import { ZudokuDocsConfig } from "../../../config/validators/validate.js";
import type { DevPortalPlugin } from "../../core/plugins.js";
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
  default: (props: MDXProps) => JSX.Element;
};

export const markdownPlugin = (
  options: MarkdownPluginOptions[],
): DevPortalPlugin => ({
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
