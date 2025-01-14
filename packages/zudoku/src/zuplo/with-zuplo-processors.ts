import fs from "node:fs/promises";
import path from "node:path";
import { removeExtensions } from "../lib/plugins/openapi/post-processors/removeExtensions.js";
import { removeParameters } from "../lib/plugins/openapi/post-processors/removeParameters.js";
import { removePaths } from "../lib/plugins/openapi/post-processors/removePaths.js";
import { enrichWithZuploData } from "./enrich-with-zuplo.js";

export const getProcessors = async (rootDir: string) => {
  const policiesConfig = JSON.parse(
    await fs.readFile(path.join(rootDir, "../config/policies.json"), "utf-8"),
  );

  return [
    removeExtensions({ keys: ["x-zuplo-route", "x-zuplo-path"] }),
    removePaths({
      shouldRemove: ({ operation }) => operation["x-internal"],
    }),
    removeParameters({
      shouldRemove: ({ parameter }) => parameter["x-internal"],
    }),
    enrichWithZuploData({ policiesConfig }),
    removeExtensions({ shouldRemove: (key) => key.startsWith("x-zuplo") }),
  ];
};

export default getProcessors;
