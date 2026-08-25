import fs from "node:fs/promises";
import path from "node:path";
import type { OpenAPIV3_1 } from "openapi-types";
import type { ProcessorArg } from "../config/validators/BuildSchema.js";
import { traverse, traverseAsync } from "../lib/util/traverse.js";
import type { RecordAny } from "../lib/util/types.js";
import { operations } from "./enrich-with-zuplo.js";

const MCP_TAG_NAME = "MCP";
const MCP_TAG_DESCRIPTION =
  "Model Context Protocol (MCP) server endpoints for AI tool integration";

// What the Zuplo MCP runtime advertises when the handler leaves `name` and
// `version` unset. Mirrored here so the documented server identity matches what
// MCP clients see during initialization.
const DEFAULT_MCP_SERVER_NAME = "MCP Server";
const DEFAULT_MCP_SERVER_VERSION = "0.0.0";

// Zuplo route handlers name their module as `$import(@zuplo/runtime)` or
// `$import(@zuplo/runtime/mcp-gateway)`. Unwrap the `$import(...)` form so the
// module can be compared against the package it is expected to come from.
const readModuleSpecifier = (module: unknown): string | undefined => {
  if (typeof module !== "string") return undefined;

  const trimmed = module.trim();
  const wrapped = /^\$import\((.*)\)$/.exec(trimmed);
  const specifier = (wrapped?.[1] ?? trimmed).trim();

  return specifier === "" ? undefined : specifier;
};

// A route served by the MCP gateway module, which fronts a native upstream MCP
// server rather than composing one out of this document's operations. Matched
// on the module alone: `@zuplo/runtime/mcp-gateway` exists to serve MCP
// endpoints, so every route handler it exports is one, and keying off the
// export name instead would silently stop enriching the day Zuplo adds or
// renames one (`McpProxyHandler` today).
const isMcpGatewayHandler = (handler: RecordAny | undefined) =>
  readModuleSpecifier(handler?.module) === "@zuplo/runtime/mcp-gateway";

// The MCP server handler, which builds a server out of the operations listed in
// its options. This one has to match on the export: it lives in the runtime
// root alongside every other handler, so the module says nothing about whether
// a route is an MCP endpoint. Any `@zuplo/runtime` subpath is accepted so the
// check does not break if Zuplo moves it, while a same-named export from an
// unrelated package is still rejected.
const isMcpServerHandler = (handler: RecordAny | undefined) => {
  if (handler?.export !== "mcpServerHandler") return false;

  const specifier = readModuleSpecifier(handler.module);
  return (
    specifier === "@zuplo/runtime" || !!specifier?.startsWith("@zuplo/runtime/")
  );
};

// `x-mcp-server` is an OpenAPI extension rather than an MCP protocol message,
// so its shape is described here instead of being pulled from an MCP SDK.
// `name` and `version` mirror the spec's `Implementation`: they are what
// clients read back during initialization. `security` and `securitySchemes`
// carry the auth requirements of the operations the server exposes, so install
// snippets can show the right credentials.
type ExtensionMcpServer = {
  name: string;
  version: string;
  tools?: ExtensionMcpServerTool[];
  security?: OpenAPIV3_1.SecurityRequirementObject[];
  securitySchemes?: Record<string, OpenAPIV3_1.SecuritySchemeObject>;
};

// Tool metadata for an `x-mcp-server` tool list. Deviates from the spec's
// `Tool` in two places: `description` is required because the extractor always
// resolves one, and `inputSchema` is loose because Zudoku documents only the
// request body rather than the full JSON Schema object the spec expects — see
// the TODO in extractOperationSchema.
type ExtensionMcpServerTool = {
  name: string;
  description: string;
  inputSchema?: object;
};

// Reads a non-empty string from an untyped handler option, returning undefined
// for missing, blank, or non-string values so callers can fall back to a
// default.
const readStringOption = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

// extracts x-mcp-server metadata from the operation using x-zuplo-mcp-tool
// as a first class citizen.
const extractOperationSchema = (
  operation: OpenAPIV3_1.OperationObject & RecordAny,
): ExtensionMcpServerTool | null => {
  if (!operation.operationId) return null;

  // Check if tool is explicitly disabled
  const mcpToolConfig = operation["x-zuplo-mcp-tool"];
  if (mcpToolConfig?.enabled === false) {
    return null;
  }

  const tool: ExtensionMcpServerTool = {
    // Use custom name from x-zuplo-mcp-tool or fallback to operationId
    name: mcpToolConfig?.name || operation.operationId,

    // Use custom description from x-zuplo-mcp-tool or fallback
    // to operation description
    description:
      mcpToolConfig?.description ||
      operation.summary ||
      operation.description ||
      `Operation ${operation.operationId}`,
  };

  // Grab valid request body JSON schema for the tool
  const requestBody = operation.requestBody as
    | OpenAPIV3_1.RequestBodyObject
    | undefined;

  const schema = requestBody?.content?.["application/json"]?.schema;
  if (schema && typeof schema === "object") {
    // TODO: @jpmcb - Zuplo also supports in-path parameters and query parameters
    // as MCP "inputSchema" arguments. In order to document full argument params,
    // Zudoku will need to more intelligently parse these elements of an operation.
    tool.inputSchema = { body: schema };
  }

  return tool;
};

// Builds a lookup map of operationId -> operation for efficient access
const buildOperationLookup = (
  document: OpenAPIV3_1.Document,
): Map<string, OpenAPIV3_1.OperationObject> => {
  const operationMap = new Map<string, OpenAPIV3_1.OperationObject>();

  traverse(document, (node, path) => {
    // Check if we're at a path item level (paths -> /some/path -> method)
    // and validate it's in allowed operations
    if (
      !path ||
      path.length < 2 ||
      path[0] !== "paths" ||
      !operations.includes(path[path.length - 1] as string)
    ) {
      return node;
    }

    if (node.operationId) {
      operationMap.set(node.operationId, node);
    }

    return node;
  });

  return operationMap;
};

// Extracts tool metadata from a disk file for the given operation IDs
const extractToolsFromDocument = (
  document: OpenAPIV3_1.Document,
  operationIds: string[],
): ExtensionMcpServerTool[] => {
  const operationLookup = buildOperationLookup(document);

  return operationIds.flatMap((operationId) => {
    const operation = operationLookup.get(operationId);
    if (!operation) return [];

    const tool = extractOperationSchema(operation);
    return tool ? [tool] : [];
  });
};

interface SecurityExtractionResult {
  security: OpenAPIV3_1.SecurityRequirementObject[];
  securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject>;
}

// Resolves the document-level scheme definitions the given requirements name,
// dropping `$ref`s and anything the document does not define.
const collectSecuritySchemes = (
  schema: OpenAPIV3_1.Document,
  securityReqs: OpenAPIV3_1.SecurityRequirementObject[],
): Record<string, OpenAPIV3_1.SecuritySchemeObject> => {
  const docSchemes = schema.components?.securitySchemes;
  if (!docSchemes) return {};

  const referencedSchemeNames = new Set(
    securityReqs.flatMap((req) => Object.keys(req)),
  );

  return Object.fromEntries(
    [...referencedSchemeNames].flatMap((name) => {
      const scheme = docSchemes[name];
      return scheme && !("$ref" in scheme) ? [[name, scheme] as const] : [];
    }),
  );
};

// Extracts security from the in-memory schema (already enriched by enrichWithZuploData)
const extractSecurityFromSchema = (
  schema: OpenAPIV3_1.Document,
  operationIds: string[],
): SecurityExtractionResult => {
  const operationLookup = buildOperationLookup(schema);

  const security = operationIds.flatMap((operationId) => {
    const operation = operationLookup.get(operationId);
    if (!operation) return [];

    // operation-level security takes precedence, fall back to doc-level
    return operation.security ?? schema.security ?? [];
  });

  return {
    security,
    securitySchemes: collectSecuritySchemes(schema, security),
  };
};

// Security for a gateway route, which exposes no operations of its own: the
// requirements are the ones on the route itself, since that is what a client
// has to satisfy to reach the gateway.
const extractSecurityFromOperation = (
  schema: OpenAPIV3_1.Document,
  operation: RecordAny,
): SecurityExtractionResult => {
  const security: OpenAPIV3_1.SecurityRequirementObject[] =
    operation.security ?? schema.security ?? [];

  return {
    security,
    securitySchemes: collectSecuritySchemes(schema, security),
  };
};

// Deduplicates security requirements by stringified key
const deduplicateSecurity = (
  reqs: OpenAPIV3_1.SecurityRequirementObject[],
): OpenAPIV3_1.SecurityRequirementObject[] => {
  const seen = new Set<string>();
  return reqs.filter((req) => {
    const key = JSON.stringify(req);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Builds the `x-mcp-server` value for a route served by the MCP server handler,
// which composes a server out of the operations named in its options.
const buildComposedServerExtension = async ({
  handler,
  schema,
  rootDir,
}: {
  handler: RecordAny;
  schema: OpenAPIV3_1.Document;
  rootDir: string;
}): Promise<ExtensionMcpServer | undefined> => {
  if (!Array.isArray(handler.options?.operations)) return undefined;

  // Group operations by file to avoid reading the same file multiple times
  const operationsByFile = new Map<string, string[]>();
  for (const op of handler.options.operations) {
    if (!op.file || !op.id) continue;
    const ids = operationsByFile.get(op.file) ?? [];
    ids.push(op.id);
    operationsByFile.set(op.file, ids);
  }

  if (operationsByFile.size === 0) return undefined;

  // Extract tools from disk files (source of truth for tool metadata)
  const allTools: ExtensionMcpServerTool[] = [];
  for (const [filePath, operationIds] of operationsByFile) {
    const resolvedPath = path.resolve(rootDir, "../", filePath);
    const fileContent = await fs.readFile(resolvedPath, "utf-8");
    const document = JSON.parse(fileContent);

    if (document) {
      allTools.push(...extractToolsFromDocument(document, operationIds));
    }
  }

  // Extract security from the in-memory schema (already enriched by enrichWithZuploData)
  const allOperationIds = [...operationsByFile.values()].flat();
  const { security: allSecurity, securitySchemes } = extractSecurityFromSchema(
    schema,
    allOperationIds,
  );

  // Mirror the runtime's server identity (ZuploMcpServer resolves these
  // from `opts.name` / `opts.version`) so the documented server name shown
  // in the install snippets matches what MCP clients actually connect to.
  // Falls back to the shared defaults when the handler leaves them unset.
  const mcpExtension: ExtensionMcpServer = {
    name: readStringOption(handler.options.name) ?? DEFAULT_MCP_SERVER_NAME,
    version:
      readStringOption(handler.options.version) ?? DEFAULT_MCP_SERVER_VERSION,
  };

  if (allTools.length > 0) {
    mcpExtension.tools = allTools;
  }

  // Add security from referenced operations to x-mcp-server
  const dedupedSecurity = deduplicateSecurity(allSecurity);
  if (dedupedSecurity.length > 0) {
    mcpExtension.security = dedupedSecurity;
    mcpExtension.securitySchemes = { ...securitySchemes };
  }

  return mcpExtension;
};

// Builds the `x-mcp-server` value for a route served by the MCP gateway module,
// which forwards to a native upstream MCP server. No `tools` are emitted: the
// upstream owns its tool list and only advertises it over the protocol at
// connect time, so there is nothing to read at build time.
const buildGatewayServerExtension = ({
  handler,
  operation,
  schema,
}: {
  handler: RecordAny;
  operation: RecordAny;
  schema: OpenAPIV3_1.Document;
}): ExtensionMcpServer => {
  // `operationId` is the identity to fall back to here, not the summary: it is
  // already slug-shaped ("linear-mcp-server"), and it is what ends up as the
  // server id in every install snippet. The summary stays the human label,
  // which `getMcpServerTitle` reads for the heading.
  const mcpExtension: ExtensionMcpServer = {
    name:
      readStringOption(handler.options?.name) ??
      readStringOption(operation.operationId) ??
      DEFAULT_MCP_SERVER_NAME,
    version:
      readStringOption(handler.options?.version) ?? DEFAULT_MCP_SERVER_VERSION,
  };

  const { security, securitySchemes } = extractSecurityFromOperation(
    schema,
    operation,
  );

  const dedupedSecurity = deduplicateSecurity(security);
  if (dedupedSecurity.length > 0) {
    mcpExtension.security = dedupedSecurity;
    mcpExtension.securitySchemes = { ...securitySchemes };
  }

  // Gateway routes are the one case where a document may already carry a
  // hand-written `x-mcp-server`: until this enrichment existed, marking them by
  // hand was the only way to document them. Authored keys win, so upgrading
  // Zudoku adds the derived fields without dropping a curated name or tool list.
  const authored = operation["x-mcp-server"];
  return typeof authored === "object" && authored !== null
    ? { ...mcpExtension, ...authored }
    : mcpExtension;
};

// Enriches an OpenAPI schema with x-mcp-server data for the routes Zuplo
// serves as MCP endpoints: servers composed by the MCP server handler, and
// native upstreams fronted by the MCP gateway module.
export const enrichWithZuploMcpServerData = ({
  rootDir,
}: {
  rootDir: string;
}) => {
  return async ({ schema }: ProcessorArg) => {
    if (!schema.paths) return schema;
    const modifiedSchema = { ...schema };
    if (!modifiedSchema?.paths) return modifiedSchema;

    let assignedDefaultMcpTag = false;

    await traverseAsync(modifiedSchema, async (node, nodePath) => {
      // Check if we're at a "post" operation (paths -> /some/path -> "post").
      // HTTP MCP servers are only allow post operations.
      if (!nodePath || nodePath.length !== 3 || nodePath[2] !== "post") {
        return node;
      }

      const operation = node as RecordAny;
      if (!operation?.["x-zuplo-route"]) return node;

      const handler = operation["x-zuplo-route"]?.handler;
      const mcpExtension = isMcpGatewayHandler(handler)
        ? buildGatewayServerExtension({
            handler,
            operation,
            schema: modifiedSchema as OpenAPIV3_1.Document,
          })
        : isMcpServerHandler(handler)
          ? await buildComposedServerExtension({
              handler,
              schema: modifiedSchema as OpenAPIV3_1.Document,
              rootDir,
            })
          : undefined;

      if (!mcpExtension) return node;

      node["x-mcp-server"] = mcpExtension;

      // Assign default MCP tag if the operation has no tags
      if (!operation.tags || operation.tags.length === 0) {
        assignedDefaultMcpTag = true;
        operation.tags = [MCP_TAG_NAME];
      }

      return node;
    });

    // Add MCP tag definition to top-level tags if we assigned it
    if (assignedDefaultMcpTag) {
      if (!modifiedSchema.tags) modifiedSchema.tags = [];
      if (!modifiedSchema.tags.some((tag) => tag.name === MCP_TAG_NAME)) {
        modifiedSchema.tags.push({
          name: MCP_TAG_NAME,
          description: MCP_TAG_DESCRIPTION,
        });
      }
    }

    return modifiedSchema;
  };
};
