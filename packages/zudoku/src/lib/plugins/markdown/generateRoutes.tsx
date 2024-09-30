import { type RouteObject } from "react-router-dom";

import {
  MarkdownPluginDefaultOptions,
  MarkdownPluginOptions,
} from "./index.js";

export const generateRoutes = (
  markdownFiles: MarkdownPluginOptions["markdownFiles"],
  filesPath: string,
  defaultOptions?: MarkdownPluginDefaultOptions,
): RouteObject[] =>
  Object.entries(markdownFiles).flatMap(([file, importPromise]) => {
    let rootDir = filesPath.split("**")[0];
    rootDir = rootDir.replace("/**", "/");
    const re = new RegExp(`^${rootDir}(.*).mdx?`);
    const match = file.match(re);
    const fsPath = match?.at(1);

    if (!fsPath) return [];

    return {
      path: fsPath,
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
