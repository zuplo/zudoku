import fs from "node:fs/promises";
import path from "node:path";
import { ZuploEnv } from "../app/env.js";
import type {
  Processor,
  ProcessorArg,
} from "../config/validators/BuildSchema.js";
import { removeExtensions } from "../lib/plugins/openapi/processors/removeExtensions.js";
import { removeParameters } from "../lib/plugins/openapi/processors/removeParameters.js";
import { removePaths } from "../lib/plugins/openapi/processors/removePaths.js";
import { enrichWithMcpServerData } from "./enrich-with-mcp.js";
import { enrichWithZuploData } from "./enrich-with-zuplo.js";

export const getProcessors = async (rootDir: string): Promise<Processor[]> => {
  const policiesConfig = JSON.parse(
    await fs.readFile(path.join(rootDir, "../config/policies.json"), "utf-8"),
  );

  return [
    removePaths({ shouldRemove: ({ operation }) => operation["x-internal"] }),
    removeParameters({
      shouldRemove: ({ parameter }) => parameter["x-internal"],
    }),
    enrichWithZuploData({ policiesConfig }),
    enrichWithMcpServerData({ rootDir }),
    ({ schema }: ProcessorArg) => {
      const url = ZuploEnv.serverUrl;
      if (!url) return schema;
      return { ...schema, servers: [{ url }] };
    },
    removeExtensions({ shouldRemove: (key) => key.startsWith("x-zuplo") }),
  ];
};

export default getProcessors;
