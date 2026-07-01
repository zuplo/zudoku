import fs from "node:fs/promises";
import path from "node:path";
import Piscina from "piscina";
import { validateConfig } from "../../config/validators/ZudokuConfig.ts";
import { runPluginTransformConfig } from "../../lib/core/transform-config.ts";
import { joinUrl } from "../../lib/util/joinUrl.ts";
import { matchesAnyProtectedPattern } from "../../lib/util/url.ts";
import type { WorkerResult } from "./prerender.js";

type EntryServer = typeof import("../../app/entry.server.js");

export type StaticWorkerData = {
  template: string;
  distDir: string;
  serverConfigPath: string;
  entryServerPath: string;
  writeRedirects: boolean;
};

export type WorkerData = { urlPath: string };

const { template, distDir, serverConfigPath, entryServerPath, writeRedirects } =
  Piscina.workerData as StaticWorkerData;

const server: EntryServer = await import(entryServerPath);
// Same order as the loader: transform the raw bundle config, then parse.
const rawConfig = await import(serverConfigPath).then((m) => m.default);
const config = validateConfig(await runPluginTransformConfig(rawConfig));

const routes = server.getRoutesByConfig(config);
const { basePath } = config;

const renderPage = async ({ urlPath }: WorkerData): Promise<WorkerResult> => {
  const filename = urlPath === "/" ? "/index.html" : `${urlPath}.html`;
  const pathname = joinUrl(basePath, urlPath);
  const url = joinUrl("http://localhost", pathname);
  const outputPath = path.join(distDir, filename);

  const request = new Request(url);

  const isProtectedRoute = config.protectedRoutes
    ? matchesAnyProtectedPattern(Object.keys(config.protectedRoutes), urlPath)
    : false;

  // Get the main response
  const response = await server.handleRequest({
    template,
    request,
    routes,
    basePath,
  });

  // Check for redirects
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const redirectTo = response.headers.get("Location") ?? "";

    if (writeRedirects) {
      const redirectHtml = `<!doctype html><script>window.location.href=${JSON.stringify(redirectTo)};</script>`;
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, redirectHtml);
    }

    return {
      outputPath,
      redirect: { from: pathname, to: redirectTo },
      statusCode: response.status,
      indexStatusCode: response.status,
      html: "",
    };
  }

  if (response.status >= 500) {
    throw new Error(
      `SSR failed with status ${response.status} for path: ${urlPath}`,
    );
  }

  // Get HTML content for file write
  const fileContent = response.body ? await response.text() : "";

  // For protected routes, do a second render with protection bypassed so the
  // search index gets the full content instead of the gated sign-in page. The
  // file on disk stays the gated (401) render; only `html`/`indexStatusCode`
  // reflect the bypass render.
  let html = fileContent;
  let indexStatusCode = response.status;
  if (isProtectedRoute) {
    const bypassRequest = new Request(url);
    const bypassResponse = await server.handleRequest({
      template,
      request: bypassRequest,
      routes,
      basePath,
      bypassProtection: true,
    });

    if (bypassResponse.status >= 500) {
      throw new Error(
        `SSR failed (bypass render) with status ${bypassResponse.status} for path: ${urlPath}`,
      );
    }

    html = bypassResponse.body ? await bypassResponse.text() : "";
    indexStatusCode = bypassResponse.status;
  }

  // Write the file
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, fileContent);

  return {
    outputPath,
    statusCode: response.status,
    indexStatusCode,
    redirect: undefined,
    html,
  };
};

export default renderPage;
