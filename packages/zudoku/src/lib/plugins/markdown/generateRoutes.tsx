import { type RouteObject } from "react-router-dom";

import {
  MarkdownPluginDefaultOptions,
  MarkdownPluginOptions,
} from "./index.js";

export const generateRoutes = (
  markdownFiles: MarkdownPluginOptions["markdownFiles"],
  defaultOptions?: MarkdownPluginDefaultOptions,
): RouteObject[] =>
  Object.entries(markdownFiles).flatMap(([file, importPromise]) => {
    // @todo we can pass in the folder name and then filter the markdown files based on that path
    const match = file.match(/pages\/(.*).mdx?$/);
    const path = match?.at(1);

    if (!path) return [];

    return {
      path,
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
    } satisfies RouteObject;
  });
