import path from "node:path";
import { pathToFileURL } from "node:url";
import colors from "picocolors";
import PiscinaImport from "piscina";
import type { getRoutesByConfig } from "../../app/main.js";
import { type ZudokuConfig } from "../../config/validators/validate.js";
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

export const prerender = async ({
  html,
  dir,
  basePath = "",
  serverConfigFilename,
}: {
  html: string;
  dir: string;
  basePath?: string;
  serverConfigFilename: string;
}) => {
  const distDir = path.join(dir, "dist", basePath);
  const config: ZudokuConfig = await import(
    pathToFileURL(path.join(distDir, "server", serverConfigFilename)).href
  ).then((m) => m.default);

  const module = await import(
    pathToFileURL(path.join(distDir, "server/entry.server.js")).href
  );
  const getRoutes = module.getRoutesByConfig as typeof getRoutesByConfig;

  const routes = getRoutes(config);
  const paths = routesToPaths(routes);

  const start = performance.now();
  const LOG_INTERVAL_MS = 30_000; // Log every 30 seconds
  const INACTIVITY_TIMEOUT_MS = 10_000; // Timeout after 10 seconds of inactivity
  let lastLogTime = start;
  let lastActivityTime = start;

  const writeProgress = throttle(
    (count: number, total: number, urlPath: string) => {
      writeLine(`prerendering (${count}/${total}) ${colors.dim(urlPath)}`);
    },
  );

  if (!isTTY()) {
    // eslint-disable-next-line no-console
    console.log(`prerendering ${paths.length} routes...`);
  }

  let completedCount = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const inactivityTimeout = new Promise<never>((_, reject) => {
    const checkInactivity = () => {
      const inactiveTime = performance.now() - lastActivityTime;
      if (inactiveTime >= INACTIVITY_TIMEOUT_MS) {
        clearTimeout(timeoutId);
        reject(
          new Error(
            `Prerender timed out after ${INACTIVITY_TIMEOUT_MS}ms of inactivity`,
          ),
        );
        return;
      }
      timeoutId = setTimeout(checkInactivity, 1000);
    };
    timeoutId = setTimeout(checkInactivity, 1000);
  });

  const serverOutDir = path.join(distDir, "server");
  const pool = new Piscina({
    filename: new URL("./worker.js", import.meta.url).href,
    idleTimeout: 1000,
    workerData: {
      template: html,
      distDir,
      serverConfigPath: path.join(serverOutDir, serverConfigFilename),
      entryServerPath: path.join(serverOutDir, "entry.server.js"),
    } satisfies StaticWorkerData,
  });

  const prerenderTasks = Promise.all(
    paths.map(async (urlPath) => {
      const outputPath = await pool.run({ urlPath } satisfies WorkerData);

      completedCount++;
      lastActivityTime = performance.now();

      if (isTTY()) {
        writeProgress(completedCount, paths.length, urlPath);
      } else {
        const now = performance.now();
        if (
          now - lastLogTime >= LOG_INTERVAL_MS ||
          completedCount === paths.length
        ) {
          // eslint-disable-next-line no-console
          console.log(`prerendered ${completedCount}/${paths.length} routes`);
          lastLogTime = now;
        }
      }
      return outputPath;
    }),
  );

  const writtenFiles = await Promise.race([prerenderTasks, inactivityTimeout]);
  clearTimeout(timeoutId);

  const seconds = ((performance.now() - start) / 1000).toFixed(1);
  writeLine(`prerendered ${paths.length} routes in ${seconds} seconds\n`);

  await generateSitemap({
    basePath: config.basePath,
    outputUrls: paths,
    config: config.sitemap,
    baseOutputDir: distDir,
  });

  return writtenFiles;
};
