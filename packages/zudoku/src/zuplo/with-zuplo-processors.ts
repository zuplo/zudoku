import fs from "node:fs/promises";
import path from "node:path";
import { removeExtensions } from "../lib/plugins/openapi/post-processors/removeExtensions.js";
import { removeParameters } from "../lib/plugins/openapi/post-processors/removeParameters.js";
import { removePaths } from "../lib/plugins/openapi/post-processors/removePaths.js";
import { type RecordAny } from "../lib/util/traverse.js";
import { enrichWithZuploData } from "./enrich-with-zuplo.js";
import { ZuploEnv } from "./env.js";

export const getProcessors = async (rootDir: string) => {
  const policiesConfig = JSON.parse(
    await fs.readFile(path.join(rootDir, "../config/policies.json"), "utf-8"),
  );

  return [
    removePaths({ shouldRemove: ({ operation }) => operation["x-internal"] }),
    removeParameters({
      shouldRemove: ({ parameter }) => parameter["x-internal"],
    }),
    enrichWithZuploData({ policiesConfig }),
    (spec: RecordAny) => {
      const url = ZuploEnv.serverUrl;
      if (!url) return spec;
      return { ...spec, servers: [{ url }] };
    },
    removeExtensions({ shouldRemove: (key) => key.startsWith("x-zuplo") }),
  ];
};

export default getProcessors;
