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

    const pathSegments = path.split("/");
    const isIndexFile = pathSegments.at(-1) === "index";
    const routePath = isIndexFile ? pathSegments.slice(0, -1).join("/") : path;

    return {
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
    } satisfies RouteObject;
  });
