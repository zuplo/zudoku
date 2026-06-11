import fs from "node:fs/promises";
import path from "node:path";
import { removeExtensions } from "zudoku/processors/removeExtensions";
import { removeParameters } from "zudoku/processors/removeParameters";
import { removePaths } from "zudoku/processors/removePaths";
import { isGraphQLOperation } from "../context/graphql.js";
import type { Processor, ProcessorArg } from "../types.js";
import { enrichWithZuploMcpServerData } from "./enrich-with-zuplo-mcp.js";
import { enrichWithZuploData } from "./enrich-with-zuplo.js";
import type { PoliciesConfigFile } from "./policy-types.js";

const readPoliciesConfig = async (
  rootDir: string,
): Promise<PoliciesConfigFile> => {
  try {
    return JSON.parse(
      await fs.readFile(path.join(rootDir, "../config/policies.json"), "utf-8"),
    );
  } catch {
    return { policies: [] };
  }
};

export const getProcessors = async ({
  rootDir,
  graphqlRoutePaths = [],
}: {
  rootDir: string;
  /** Routes documented by the GraphQL plugin, removed from the OpenAPI reference */
  graphqlRoutePaths?: string[];
}): Promise<Processor[]> => {
  const policiesConfig = await readPoliciesConfig(rootDir);

  return [
    removePaths({ shouldRemove: ({ operation }) => operation["x-internal"] }),
    removePaths({
      shouldRemove: ({ path, operation }) =>
        graphqlRoutePaths.includes(path) && isGraphQLOperation(operation),
    }),
    removeParameters({
      shouldRemove: ({ parameter }) => parameter["x-internal"],
    }),
    enrichWithZuploData({ policiesConfig }),
    enrichWithZuploMcpServerData({ rootDir }),
    ({ schema }: ProcessorArg) => {
      const url = process.env.ZUPLO_SERVER_URL;
      if (!url || process.env.ZUPLO_PUBLIC_DISABLE_INJECT_ENDPOINT)
        return schema;
      return { ...schema, servers: [{ url }] };
    },
    removeExtensions({ shouldRemove: (key) => key.startsWith("x-zuplo") }),
  ];
};
