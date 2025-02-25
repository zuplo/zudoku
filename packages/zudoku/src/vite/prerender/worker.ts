import path from "node:path";
import { pathToFileURL } from "node:url";
import Piscina from "piscina";
import type { render as renderServer } from "../../app/entry.server.js";
import type { ZudokuConfig } from "../../config/validators/validate.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
import { FileWritingResponse } from "./FileWritingResponse.js";
import { type WorkerResult } from "./prerender.js";

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

const [render, config] = (await Promise.all([
  import(pathToFileURL(entryServerPath).href).then((m) => m.render),
  import(pathToFileURL(serverConfigPath).href).then((m) => m.default),
])) as [typeof renderServer, ZudokuConfig];

const renderPage = async ({ urlPath }: WorkerData): Promise<WorkerResult> => {
  const filename = urlPath === "/" ? "/index.html" : `${urlPath}.html`;
  const pathname = joinUrl(config.basePath, urlPath);
  const url = joinUrl("http://localhost", pathname);
  const outputPath = path.join(distDir, filename);

  const request = new Request(url);
  const response = new FileWritingResponse({
    fileName: outputPath,
    writeRedirects,
  });

  await render({ template, request, response, config });
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
