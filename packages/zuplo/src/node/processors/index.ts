import fs from "node:fs/promises";
import path from "node:path";
import { removeExtensions } from "zudoku/processors/removeExtensions";
import { removeParameters } from "zudoku/processors/removeParameters";
import { removePaths } from "zudoku/processors/removePaths";
import type { Processor, ProcessorArg } from "zudoku/vite";
import { enrichWithZuploMcpServerData } from "./enrich-with-zuplo-mcp.js";
import { enrichWithZuploData } from "./enrich-with-zuplo.js";
import type { PoliciesConfigFile } from "./policy-types.js";

export type GetProcessorsOptions = {
  /** The dev portal root directory (where the Zudoku config lives) */
  rootDir: string;
};

const loadPoliciesConfig = async (
  rootDir: string,
): Promise<PoliciesConfigFile | undefined> => {
  const policiesPath = path.join(rootDir, "../config/policies.json");

  try {
    return JSON.parse(await fs.readFile(policiesPath, "utf-8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.warn(`Could not read Zuplo policies at ${policiesPath}:`, error);
    }
    return undefined;
  }
};

/**
 * The OpenAPI schema processors applied to every API in a Zuplo project:
 * removes internal paths/parameters, documents API key and rate limit
 * policies, documents MCP server routes, injects the gateway server URL and
 * strips Zuplo-specific extensions.
 */
export const getProcessors = async ({
  rootDir,
}: GetProcessorsOptions): Promise<Processor[]> => {
  const policiesConfig = await loadPoliciesConfig(rootDir);

  // GraphQL endpoints get dedicated documentation pages (introspecting
  // ZUPLO_SERVER_URL + route path, see `extendSpec`), which exist exactly
  // when the server URL is set — so the raw operations are removed from the
  // OpenAPI reference under the same condition.
  const stripGraphQLRoutes = Boolean(process.env.ZUPLO_SERVER_URL);

  return [
    removePaths({ shouldRemove: ({ operation }) => operation["x-internal"] }),
    removeParameters({
      shouldRemove: ({ parameter }) => parameter["x-internal"],
    }),
    ...(stripGraphQLRoutes
      ? [
          removePaths({
            shouldRemove: ({ method, operation }) =>
              method !== true && operation?.["x-graphql"] === true,
          }),
        ]
      : []),
    ...(policiesConfig ? [enrichWithZuploData({ policiesConfig })] : []),
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
