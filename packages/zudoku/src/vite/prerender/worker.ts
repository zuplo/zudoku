import path from "node:path";
import { pathToFileURL } from "node:url";
import Piscina from "piscina";
import type { render as renderServer } from "../../app/entry.server.js";
import type { ZudokuConfig } from "../../config/validators/validate.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
import { FileWritingResponse } from "./FileWritingResponse.js";

export type StaticWorkerData = {
  template: string;
  distDir: string;
  serverConfigPath: string;
  entryServerPath: string;
};

export type WorkerData = { urlPath: string };

const { template, distDir, serverConfigPath, entryServerPath } =
  Piscina.workerData as StaticWorkerData;

const [render, config] = (await Promise.all([
  import(pathToFileURL(entryServerPath).href).then((m) => m.render),
  import(pathToFileURL(serverConfigPath).href).then((m) => m.default),
])) as [typeof renderServer, ZudokuConfig];

const renderPage = async ({ urlPath }: WorkerData): Promise<string> => {
  const filename = urlPath === "/" ? "/index.html" : `${urlPath}.html`;
  const url = joinUrl("http://localhost", config.basePath, urlPath);
  const outputPath = path.join(distDir, filename);
  const request = new Request(url);
  const response = new FileWritingResponse(outputPath);

  await render({ template, request, response, config });
  await response.isSent();

  return outputPath;
};

export default renderPage;
