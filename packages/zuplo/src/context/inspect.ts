import fs from "node:fs/promises";
import path from "node:path";
import type { RecordAny } from "zudoku/processors/traverse";
import { operations } from "../processors/enrich-with-zuplo.js";
import { isGraphQLOperation } from "./graphql.js";
import type {
  ZuploContext,
  ZuploGraphQLEndpoint,
  ZuploOpenApiFile,
} from "./types.js";

const joinUrl = (base: string, segment: string) =>
  `${base.replace(/\/+$/, "")}/${segment.replace(/^\/+/, "")}`;

const isConcreteUrl = (value: unknown): value is string =>
  typeof value === "string" &&
  /^https?:\/\//.test(value) &&
  !value.includes("${");

// Resolve the URL a GraphQL endpoint can be introspected from. Prefer the
// deployed gateway so docs reflect what consumers actually call; fall back to
// the route's upstream when no gateway URL is available (e.g. local dev).
const resolveEndpointUrl = (routePath: string, operation: RecordAny) => {
  const serverUrl = process.env.ZUPLO_SERVER_URL;
  if (serverUrl) return joinUrl(serverUrl, routePath);

  const handlerOptions = operation["x-zuplo-route"]?.handler?.options;
  const upstream = handlerOptions?.rewritePattern ?? handlerOptions?.baseUrl;
  return isConcreteUrl(upstream) ? upstream : undefined;
};

const isDocumentable = (operation: RecordAny) =>
  !operation["x-internal"] && !isGraphQLOperation(operation);

/**
 * Inspects a Zuplo project (the parent directory of the docs root) and
 * collects the OpenAPI files and GraphQL endpoints it defines.
 */
export const inspectZuploContext = async ({
  rootDir,
}: {
  rootDir: string;
}): Promise<ZuploContext> => {
  const configDir = path.resolve(rootDir, "../config");

  let entries: string[];
  try {
    entries = await fs.readdir(configDir);
  } catch {
    // Not running inside a Zuplo project
    return { configFiles: [], openApiFiles: [], graphqlEndpoints: [] };
  }

  const openApiFiles: ZuploOpenApiFile[] = [];
  const graphqlEndpoints: ZuploGraphQLEndpoint[] = [];

  const configFiles = entries.filter((e) => e.endsWith(".oas.json")).sort();

  for (const fileName of configFiles) {
    let schema: RecordAny;
    try {
      schema = JSON.parse(
        await fs.readFile(path.join(configDir, fileName), "utf-8"),
      );
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.warn(`Skipping unparsable OpenAPI file ${fileName}:`, error);
      continue;
    }

    if (!schema || typeof schema !== "object") continue;

    let hasDocumentableOperations = false;

    for (const [routePath, pathItem] of Object.entries(schema.paths ?? {})) {
      if (!pathItem || typeof pathItem !== "object") continue;

      let hasEndpointForPath = false;

      for (const method of operations) {
        const operation = (pathItem as RecordAny)[method];
        if (!operation || typeof operation !== "object") continue;
        if (operation["x-internal"]) continue;

        if (isDocumentable(operation)) {
          hasDocumentableOperations = true;
          continue;
        }

        // One GraphQL endpoint per route path
        if (hasEndpointForPath) continue;

        const url = resolveEndpointUrl(routePath, operation);
        if (!url) {
          // biome-ignore lint/suspicious/noConsole: Logging allowed here
          console.warn(
            `Found GraphQL endpoint at ${routePath} but no URL to introspect it from. ` +
              `Set ZUPLO_SERVER_URL or use a concrete URL in the route's handler to document it.`,
          );
          continue;
        }

        hasEndpointForPath = true;
        graphqlEndpoints.push({
          routePath,
          url,
          title: operation.summary,
          description: operation.description,
        });
      }
    }

    // Files containing only GraphQL or internal routes don't get an (empty)
    // API reference of their own
    if (hasDocumentableOperations) {
      openApiFiles.push({ fileName, input: `../config/${fileName}` });
    }
  }

  return { configFiles, openApiFiles, graphqlEndpoints };
};
