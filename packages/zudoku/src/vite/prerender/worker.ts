import { pathToFileURL } from "node:url";
import type { render } from "../../app/entry.server.js";
import type { ZudokuConfig } from "../../config/validators/validate.js";
import { FileWritingResponse } from "./FileWritingResponse.js";

export type WorkerData = {
  template: string;
  outputPath: string;
  url: string;
  serverConfigPath: string;
  entryServerPath: string;
};

let initialized = false;
let renderFn: typeof render;
let config: ZudokuConfig;

const initialize = async ({
  serverConfigPath,
  entryServerPath,
}: WorkerData) => {
  if (initialized) return;

  const [module, configModule] = await Promise.all([
    import(pathToFileURL(entryServerPath).href),
    import(pathToFileURL(serverConfigPath).href),
  ]);

  renderFn = module.render;
  config = configModule.default;
  initialized = true;
};

const renderPage = async (data: WorkerData): Promise<string> => {
  await initialize(data);

  const { url, template, outputPath } = data;
  const request = new Request(url);
  const response = new FileWritingResponse(outputPath);

  await renderFn({ template, request, response, config });
  await response.isSent();

  return data.outputPath;
};

export default renderPage;
