import path from "node:path";
import { pathToFileURL } from "node:url";
import PiscinaImport from "piscina";
import type { getRoutesByConfig } from "../../app/main.js";
import { type ZudokuConfig } from "../../config/validators/validate.js";
import { generateSitemap } from "../sitemap.js";
import { type WorkerData } from "./worker.js";

const Piscina = PiscinaImport as unknown as typeof PiscinaImport.default;

const routesToPaths = (routes: ReturnType<typeof getRoutesByConfig>) => {
  const paths: string[] = [];
  const addPaths = (routes: ReturnType<typeof getRoutesByConfig>) => {
    for (const route of routes) {
      // skip catch-all routes
      if (route.path?.includes("*")) {
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
  // eslint-disable-next-line no-console
  console.log("Prerendering...");
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

  const pool = new Piscina({
    filename: new URL("./worker.js", import.meta.url).href,
  });

  const start = performance.now();
  let completedCount = 0;
  const writtenFiles = await Promise.all(
    paths.map(async (urlPath) => {
      const filename = urlPath === "/" ? "/index.html" : `${urlPath}.html`;
      const outputPath = path.join(distDir, filename);
      const url = `http://localhost${config.basePath ?? ""}${urlPath}`;
      const serverPath = path.join(distDir, "server");

      await pool.run({
        template: html,
        outputPath,
        url,
        serverConfigPath: path.join(serverPath, serverConfigFilename),
        entryServerPath: path.join(serverPath, "entry.server.js"),
      } satisfies WorkerData);

      completedCount++;

      if (process.stdout.isTTY) {
        process.stdout.write(
          `\rWritten ${completedCount}/${paths.length} pages`,
        );
      }
      return outputPath;
    }),
  );

  const seconds = ((performance.now() - start) / 1000).toFixed(1);
  process.stdout.write(`\rWritten ${paths.length} pages in ${seconds} seconds`);

  await pool.destroy();

  await generateSitemap({
    basePath: config.basePath,
    outputUrls: paths,
    config: config.sitemap,
    baseOutputDir: distDir,
  });

  return writtenFiles;
};
