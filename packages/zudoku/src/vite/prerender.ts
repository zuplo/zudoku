import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  type getRoutesByConfig,
  type render as serverRender,
} from "../app/entry.server.js";
import { type ZudokuConfig } from "../config/validators/validate.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { generateSitemap } from "./sitemap.js";

export class FileWritingResponse {
  private buffer = "";
  private dontSave = false;
  private resolve = () => {};
  private resolved = new Promise<void>((res) => (this.resolve = res));

  set() {}
  status(status: number) {
    if (status >= 300) {
      this.dontSave = true;
    }
  }
  on() {}

  constructor(private readonly fileName: string) {}

  redirect() {
    this.buffer = "redirected";
    this.dontSave = true;
    this.resolve();
  }

  send = async (chunk: string) => {
    this.write(chunk);
    await this.end();
  };

  write(chunk: string, _encoding?: string) {
    this.buffer += chunk;
  }

  async end(chunk = "") {
    if (!this.dontSave) {
      await fs.mkdir(path.dirname(this.fileName), { recursive: true });
      await fs.writeFile(this.fileName, this.buffer + chunk);
    }
    this.resolve();
  }

  isSent() {
    return this.resolved;
  }
}

const routesToPaths = (routes: ReturnType<typeof getRoutesByConfig>) => {
  const paths: string[] = [];
  const addPaths = (routes: ReturnType<typeof getRoutesByConfig>) => {
    for (const route of routes) {
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
  const render = module.render as typeof serverRender;

  const getRoutes = module.getRoutesByConfig as typeof getRoutesByConfig;

  const routes = getRoutes(config);
  console.log("routes", routes);
  const paths = routesToPaths(routes);

  const writtenFiles: string[] = [];
  for (const urlPath of paths) {
    const req = new Request(
      joinUrl("http://localhost", config.basePath, urlPath),
    );

    const filename = urlPath === "/" ? "/index.html" : `${urlPath}.html`;

    const response = new FileWritingResponse(path.join(distDir, filename));

    await render({ template: html, request: req, response, config });
    await response.isSent();
    writtenFiles.push(filename);
  }

  await generateSitemap({
    basePath: config.basePath,
    outputUrls: paths,
    config: config.sitemap,
    baseOutputDir: distDir,
  });

  // eslint-disable-next-line no-console
  console.log(`Prerendered ${paths.length} pages`);

  return writtenFiles;
};
