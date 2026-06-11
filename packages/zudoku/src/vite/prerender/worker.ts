import fs from "node:fs/promises";
import path from "node:path";
import Piscina from "piscina";
import { ProtectedRoutesSchema } from "../../config/validators/ProtectedRoutesSchema.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
import { matchesAnyProtectedPattern } from "../../lib/util/url.js";
import type { WorkerResult } from "./prerender.js";

type EntryServer = typeof import("../../app/entry.server.js");

export type StaticWorkerData = {
  template: string;
  distDir: string;
  entryServerPath: string;
  writeRedirects: boolean;
};

export type WorkerData = { urlPath: string };

const { template, distDir, entryServerPath, writeRedirects } =
  Piscina.workerData as StaticWorkerData;

const server: EntryServer = await import(entryServerPath);
// The server entry exports the fully transformed config (including plugins
// applied automatically in Zuplo mode)
const config = server.config;

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
    ? matchesAnyProtectedPattern(Object.keys(protectedRoutes), urlPath)
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
    statusCode: response.status,
    redirect: undefined,
    html,
  };
};

export default renderPage;
