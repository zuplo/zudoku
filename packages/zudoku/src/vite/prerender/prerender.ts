import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createIndex, type PagefindIndex } from "pagefind";
import colors from "picocolors";
import PiscinaImport from "piscina";
import type { getRoutesByConfig } from "../../app/main.js";
import { logger } from "../../cli/common/logger.js";
import { type ZudokuConfig } from "../../config/validators/validate.js";
import invariant from "../../lib/util/invariant.js";
import { isTTY, throttle, writeLine } from "../reporter.js";
import { generateSitemap } from "../sitemap.js";
import { type StaticWorkerData, type WorkerData } from "./worker.js";

const Piscina = PiscinaImport as unknown as typeof PiscinaImport.default;

const routesToPaths = (routes: ReturnType<typeof getRoutesByConfig>) => {
  const paths: string[] = [];
  const addPaths = (routes: ReturnType<typeof getRoutesByConfig>) => {
    for (const route of routes) {
      // skip catch-all routes
      if (route.path?.includes("*") || route.path?.includes(":")) {
        continue;
      }

      if (route.path) {
        paths.push(route.path.startsWith("/") ? route.path : `/${route.path}`);
      }
      if (route.children) {
        addPaths(route.children);
      }
    }
  };
  addPaths(routes);
  return paths;
};

export type WorkerResult = {
  outputPath: string;
  html: string;
  redirect?: { from: string; to: string };
};

export const prerender = async ({
  html,
  dir,
  basePath = "",
  serverConfigFilename,
  writeRedirects = true,
}: {
  html: string;
  dir: string;
  basePath?: string;
  serverConfigFilename: string;
  writeRedirects: boolean;
}) => {
  const distDir = path.join(dir, "dist", basePath);
  const serverConfigPath = pathToFileURL(
    path.join(distDir, "server", serverConfigFilename),
  ).href;
  const entryServerPath = pathToFileURL(
    path.join(distDir, "server/entry.server.js"),
  ).href;

  const config: ZudokuConfig = await import(serverConfigPath).then(
    (m) => m.default,
  );
  const module = await import(entryServerPath);
  const getRoutes = module.getRoutesByConfig as typeof getRoutesByConfig;

  const routes = getRoutes(config);
  const paths = routesToPaths(routes);

  const start = performance.now();
  const LOG_INTERVAL_MS = 30_000; // Log every 30 seconds
  let lastLogTime = start;

  const writeProgress = throttle(
    (count: number, total: number, urlPath: string) => {
      writeLine(`prerendering (${count}/${total}) ${colors.dim(urlPath)}`);
    },
  );

  if (!isTTY()) {
    logger.info(colors.dim(`prerendering ${paths.length} routes...`));
  }

  let completedCount = 0;
  let pagefindIndex: PagefindIndex | undefined;

  if (config.search?.type === "pagefind") {
    const { index, errors } = await createIndex();
    invariant(
      index,
      `Failed to create pagefind index: ${JSON.stringify(errors)}`,
    );
    pagefindIndex = index;
  }

  const pool = new Piscina<WorkerData, WorkerResult>({
    filename: new URL("./worker.js", import.meta.url).href,
    idleTimeout: 5_000,
    maxThreads: Math.floor(os.cpus().length * 0.8),
    workerData: {
      template: html,
      distDir,
      serverConfigPath,
      entryServerPath,
      writeRedirects,
    } satisfies StaticWorkerData,
  });

  const workerResults = await Promise.all(
    paths.map(async (urlPath) => {
      const result = await pool.run({ urlPath } satisfies WorkerData);

      await pagefindIndex?.addHTMLFile({
        url: urlPath,
        content: result.html,
      });

      completedCount++;

      if (isTTY()) {
        writeProgress(completedCount, paths.length, urlPath);
      } else {
        const now = performance.now();
        if (now - lastLogTime >= LOG_INTERVAL_MS) {
          logger.info(
            colors.blue(`prerendered ${completedCount}/${paths.length} routes`),
          );
          lastLogTime = now;
        }
      }
      return result;
    }),
  );

  const pagefindWriteResult = await pagefindIndex?.writeFiles({
    outputPath: path.join(distDir, "pagefind"),
  });

  const seconds = ((performance.now() - start) / 1000).toFixed(1);

  const message = `✓ finished prerendering ${paths.length} routes in ${seconds} seconds`;

  if (isTTY()) {
    writeLine(colors.blue(message + "\n"));
  } else {
    logger.info(colors.blue(message));
  }
  if (pagefindWriteResult?.outputPath) {
    logger.info(
      colors.blue(`✓ pagefind index built: ${pagefindWriteResult.outputPath}`),
    );
  }

  await generateSitemap({
    basePath: config.basePath,
    outputUrls: paths,
    config: config.sitemap,
    baseOutputDir: distDir,
  });

  return workerResults;
};
