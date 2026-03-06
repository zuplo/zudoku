import path from "node:path";
import { createIndex, type PagefindIndex } from "pagefind";
import { isRunnableDevEnvironment, type ViteDevServer } from "vite";
import type { LoadedConfig } from "../config/config.js";
import invariant from "../lib/util/invariant.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { getAppServerEntryPath } from "./config.js";
import { getDevHtml } from "./html.js";
import { routesToPaths } from "./prerender/utils.js";

type EntryServerImport = typeof import("../app/entry.server.js");

export type IndexProgress = {
  type: "progress";
  total: number;
  current: number;
  path: string;
};

export type IndexComplete = {
  type: "complete";
  success: boolean;
  indexed: number;
  error?: string;
};

export type IndexEvent = IndexProgress | IndexComplete;

export async function* buildPagefindDevIndex(
  vite: ViteDevServer,
  config: LoadedConfig,
): AsyncGenerator<IndexEvent> {
  const { index, errors } = await createIndex();
  invariant(index, `Failed to create pagefind index: ${errors.join(", ")}`);

  const pagefindIndex: PagefindIndex = index;
  const ssrEnvironment = vite.environments.ssr;

  if (!isRunnableDevEnvironment(ssrEnvironment)) {
    throw new Error("SSR environment is not runnable");
  }

  // Import the entry server module
  const serverModule = (await ssrEnvironment.runner.import(
    getAppServerEntryPath(),
  )) as EntryServerImport;

  const routes = serverModule.getRoutesByConfig(config);
  const paths = routesToPaths(routes);
  const { basePath } = config;

  const template = getDevHtml({
    jsEntry: "/__z/entry.client.tsx",
    dir: config.site?.dir,
  });
  const transformedTemplate = await vite.transformIndexHtml("/", template);

  let indexed = 0;

  for (const urlPath of paths) {
    try {
      const pathname = joinUrl(basePath, urlPath);
      const url = joinUrl("http://localhost", pathname);
      const request = new Request(url);

      const response = await serverModule.handleRequest({
        template: transformedTemplate,
        request,
        routes,
        basePath,
        bypassProtection: true,
      });

      if (response.status < 400 && response.body) {
        const content = await response.text();
        await pagefindIndex.addHTMLFile({
          url: urlPath,
          content,
        });
        indexed++;
      }
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: Log errors during indexing
      console.error(`Failed to index ${urlPath}:`, error);
    }

    yield {
      type: "progress",
      total: paths.length,
      current: indexed,
      path: urlPath,
    };
  }

  // Write the index to public/pagefind
  const outputPath = path.join(vite.config.publicDir, "pagefind");
  await pagefindIndex.writeFiles({ outputPath });

  yield { type: "complete", success: true, indexed };
}
