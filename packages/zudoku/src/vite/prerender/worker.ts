import fs from "node:fs/promises";
import path from "node:path";
import Piscina from "piscina";
import { matchPath } from "react-router";
import { ProtectedRoutesSchema } from "../../config/validators/ProtectedRoutesSchema.js";
import type { ZudokuConfig } from "../../config/validators/validate.js";
import { runPluginTransformConfig } from "../../lib/core/transform-config.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
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
const rawConfig: ZudokuConfig = await import(serverConfigPath).then(
  (m) => m.default,
);
const config = await runPluginTransformConfig(rawConfig);

const routes = server.getRoutesByConfig(config);
const { basePath } = config;

const renderPage = async ({ urlPath }: WorkerData): Promise<WorkerResult> => {
  const filename = urlPath === "/" ? "/index.html" : `${urlPath}.html`;
  const pathname = joinUrl(basePath, urlPath);
  const url = joinUrl("http://localhost", pathname);
  const outputPath = path.join(distDir, filename);

  const request = new Request(url);

  const protectedRoutes = ProtectedRoutesSchema.parse(config.protectedRoutes);
  const isProtectedRoute = protectedRoutes
    ? Object.keys(protectedRoutes).some((route) =>
        matchPath({ path: route, end: true }, urlPath),
      )
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
      const redirectHtml = `<!doctype html><script>window.location.href='${redirectTo}';</script>`;
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, redirectHtml);
    }

    return {
      outputPath,
      redirect: { from: pathname, to: redirectTo },
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

  // For protected routes, do a second render with protection bypassed for search index
  let html = fileContent;
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
  }

  // Write the file
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, fileContent);

  return {
    outputPath,
    redirect: undefined,
    html,
  };
};

export default renderPage;
