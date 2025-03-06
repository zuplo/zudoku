import path from "node:path";
import Piscina from "piscina";
import { type ZudokuConfig } from "../../config/validators/validate.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
import { FileWritingResponse } from "./FileWritingResponse.js";
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
  const response = new FileWritingResponse({
    fileName: outputPath,
    writeRedirects,
  });

  await server.render({ template, request, response, routes, basePath });
  await response.isSent();

  if (response.statusCode >= 500) {
    throw new Error(
      `SSR failed with status ${response.statusCode} for path: ${urlPath}`,
    );
  }

  const redirect = response.redirectedTo
    ? { from: pathname, to: response.redirectedTo }
    : undefined;

  return { outputPath, redirect };
};

export default renderPage;
