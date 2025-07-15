import path from "node:path";
import Piscina from "piscina";
import { matchPath } from "react-router";
import { ProtectedRoutesSchema } from "../../config/validators/ProtectedRoutesSchema.js";
import type { ZudokuConfig } from "../../config/validators/validate.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
import { FileWritingResponse } from "./FileWritingResponse.js";
import { InMemoryResponse } from "./InMemoryResponse.js";
import { type WorkerResult } from "./prerender.js";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
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
const config: ZudokuConfig = await import(serverConfigPath).then(
  (m) => m.default,
);

const routes = server.getRoutesByConfig(config);
const { basePath } = config;

const renderPage = async ({ urlPath }: WorkerData): Promise<WorkerResult> => {
  const filename = urlPath === "/" ? "/index.html" : `${urlPath}.html`;
  const pathname = joinUrl(basePath, urlPath);
  const url = joinUrl("http://localhost", pathname);
  const outputPath = path.join(distDir, filename);

  const request = new Request(url);
  const fileResponse = new FileWritingResponse({
    fileName: outputPath,
    writeRedirects,
  });

  const sharedOpts = { template, request, routes, basePath };

  const protectedRoutes = ProtectedRoutesSchema.parse(config.protectedRoutes);
  const isProtectedRoute = protectedRoutes
    ? Object.keys(protectedRoutes).some((route) => matchPath(route, urlPath))
    : false;

  let html: string;

  // For protected routes, we need a second render pass with protection bypassed
  // so we can build a full search index
  if (isProtectedRoute) {
    const bypassResponse = new InMemoryResponse();
    await Promise.all([
      server.render({ ...sharedOpts, response: fileResponse }),
      server.render({
        ...sharedOpts,
        response: bypassResponse,
        bypassProtection: true,
      }),
      fileResponse.isSent(),
      bypassResponse.isSent(),
    ]);

    html = bypassResponse.buffer;
  } else {
    await server.render({ ...sharedOpts, response: fileResponse });
    await fileResponse.isSent();

    html = fileResponse.buffer;
  }

  if (fileResponse.statusCode >= 500) {
    throw new Error(
      `SSR failed with status ${fileResponse.statusCode} for path: ${urlPath}`,
    );
  }

  const redirect = fileResponse.redirectedTo
    ? { from: pathname, to: fileResponse.redirectedTo }
    : undefined;

  return {
    outputPath,
    redirect,
    html,
  };
};

export default renderPage;
