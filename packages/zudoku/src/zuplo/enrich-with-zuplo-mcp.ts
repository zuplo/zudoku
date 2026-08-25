import fs from "node:fs/promises";
import path from "node:path";
import type { OpenAPIV3_1 } from "openapi-types";
import type { ProcessorArg } from "../config/validators/BuildSchema.js";
import { traverse, traverseAsync } from "../lib/util/traverse.js";
import type { RecordAny } from "../lib/util/types.js";
import { operations } from "./enrich-with-zuplo.js";
import type {
  PoliciesConfigFile,
  PolicyConfigurationFragment,
} from "./policy-types.js";

const MCP_TAG_NAME = "MCP";
const MCP_TAG_DESCRIPTION =
  "Model Context Protocol (MCP) server endpoints for AI tool integration";

// What the Zuplo MCP runtime advertises when the handler leaves `name` and
// `version` unset. Mirrored here so the documented server identity matches what
// MCP clients see during initialization.
const DEFAULT_MCP_SERVER_NAME = "MCP Server";
const DEFAULT_MCP_SERVER_VERSION = "0.0.0";

// `x-mcp-server` is an OpenAPI extension rather than an MCP protocol message,
// so its shape is described here instead of being pulled from an MCP SDK.
// `name` and `version` mirror the spec's `Implementation`: they are what
// clients read back during initialization. `security` and `securitySchemes`
// carry the auth requirements of the operations the server exposes, so install
// snippets can show the right credentials.
type ExtensionMcpServer = {
  name: string;
  // Omitted for gateway virtual servers: the version belongs to the upstream
  // server and is only known once a client initializes against it.
  version?: string;
  // How clients authenticate, when the config says so plainly. The card
  // otherwise infers the type from `securitySchemes`, which cannot describe an
  // MCP gateway's inbound OAuth — clients discover that flow themselves.
  authType?: "oauth";
  tools?: ExtensionMcpServerTool[];
  prompts?: ExtensionMcpServerPrompt[];
  resources?: ExtensionMcpServerResource[];
  resourceTemplates?: ExtensionMcpServerResourceTemplate[];
  security?: OpenAPIV3_1.SecurityRequirementObject[];
  securitySchemes?: Record<string, OpenAPIV3_1.SecuritySchemeObject>;
};

// Tool metadata for an `x-mcp-server` tool list. Deviates from the spec's
// `Tool` in two places: `description` is optional because a gateway's
// capability filter may expose a tool by name alone, and `inputSchema` is
// loose because Zudoku documents only the request body rather than the full
// JSON Schema object the spec expects — see the TODO in extractOperationSchema.
type ExtensionMcpServerTool = {
  name: string;
  description?: string;
  inputSchema?: object;
};

// The remaining MCP capability kinds, documented for gateway virtual servers
// whose capability filter enumerates them. Keyed the way the protocol keys
// them: prompts by name, resources by URI, templates by URI template.
type ExtensionMcpServerPrompt = {
  name: string;
  description?: string;
};

type ExtensionMcpServerResource = {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
};

type ExtensionMcpServerResourceTemplate = {
  uriTemplate: string;
  name?: string;
  description?: string;
  mimeType?: string;
};

// Handler exports that mount an MCP gateway virtual server — one MCP endpoint
// fronting an upstream MCP server. `McpProxyHandler` is the current export;
// the other two are what earlier gateway configs were written with, kept so an
// unmigrated route still documents itself. The module check mirrors the
// runtime's own detection (`isBuiltInMcpHandler`) so a customer module that
// happens to export the same name is not claimed as a gateway.
const MCP_GATEWAY_HANDLER_EXPORTS = new Set([
  "McpProxyHandler",
  "McpVirtualServerHandler",
  "mcpVirtualServerHandler",
]);
const ZUPLO_RUNTIME_MODULE_PREFIX = "$import(@zuplo/runtime";

// The gateway's inbound OAuth policies: the generic `mcp-oauth-inbound` plus
// the per-IdP variants (`mcp-auth0-oauth-inbound`, `mcp-entra-oauth-inbound`,
// …). Matched on `policyType`, falling back to the policy class name for
// configs that omit it.
const MCP_OAUTH_POLICY_TYPE = /^mcp-(?:[a-z0-9-]+-)?oauth-inbound$/;
const MCP_OAUTH_POLICY_EXPORT = /^Mcp[A-Za-z0-9]*OAuthInboundPolicy$/;

// The policy carrying the downstream-facing capability list.
const MCP_CAPABILITY_FILTER_POLICY_TYPE = "mcp-capability-filter-inbound";
const MCP_CAPABILITY_FILTER_POLICY_EXPORT = "McpCapabilityFilterInboundPolicy";

// The policy carrying the upstream connection's identity, including the
// display name the gateway itself shows users in connect prompts.
const MCP_TOKEN_EXCHANGE_POLICY_TYPE = "mcp-token-exchange-inbound";
const MCP_TOKEN_EXCHANGE_POLICY_EXPORT = "McpTokenExchangeInboundPolicy";

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

// Extracts security from operations of the in-memory schema (already enriched
// by enrichWithZuploData). Shared by both server kinds: a dynamic server draws
// on the operations it exposes as tools, a gateway virtual server on the MCP
// route itself.
const extractSecurityFromOperations = (
  schema: OpenAPIV3_1.Document,
  operations: OpenAPIV3_1.OperationObject[],
): SecurityExtractionResult => {
  const securityReqs: OpenAPIV3_1.SecurityRequirementObject[] = [];
  const referencedSchemeNames = new Set<string>();

  for (const operation of operations) {
    // operation-level security takes precedence, fall back to doc-level
    const opSecurity = operation.security ?? schema.security;
    if (opSecurity) {
      for (const req of opSecurity) {
        securityReqs.push(req);
        for (const name of Object.keys(req)) {
          referencedSchemeNames.add(name);
        }
      }
    }
  }

  const securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject> = {};
  const docSchemes = schema.components?.securitySchemes;
  if (docSchemes) {
    for (const name of referencedSchemeNames) {
      const scheme = docSchemes[name];
      if (scheme && !("$ref" in scheme)) {
        securitySchemes[name] = scheme;
      }
    }
  }

  return { security: securityReqs, securitySchemes };
};

// Looks operations up by id before extracting their security.
const extractSecurityFromSchema = (
  schema: OpenAPIV3_1.Document,
  operationIds: string[],
): SecurityExtractionResult => {
  const operationLookup = buildOperationLookup(schema);

  return extractSecurityFromOperations(
    schema,
    operationIds.flatMap((operationId) => {
      const operation = operationLookup.get(operationId);
      return operation ? [operation] : [];
    }),
  );
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

// Whether the route mounts an MCP gateway virtual server. Both the export and
// the module have to match so a customer module exporting the same name is not
// mistaken for the gateway (the runtime pairs them the same way).
const isGatewayHandler = (handler: RecordAny): boolean =>
  MCP_GATEWAY_HANDLER_EXPORTS.has(handler.export) &&
  typeof handler.module === "string" &&
  handler.module.startsWith(ZUPLO_RUNTIME_MODULE_PREFIX);

// Resolves a route's inbound policy names to their definitions in
// policies.json, expanding one level of composite policy so an MCP policy
// nested inside one is still found.
const resolveInboundPolicies = (
  operation: RecordAny,
  policiesConfig?: PoliciesConfigFile,
): PolicyConfigurationFragment[] => {
  const names = operation["x-zuplo-route"]?.policies?.inbound;
  if (!Array.isArray(names) || !policiesConfig?.policies) return [];

  const byName = new Map(
    policiesConfig.policies.map((policy) => [policy.name, policy]),
  );
  const lookup = (name: unknown): PolicyConfigurationFragment[] => {
    const policy = typeof name === "string" ? byName.get(name) : undefined;
    return policy ? [policy] : [];
  };

  return names.flatMap((name: unknown) =>
    lookup(name).flatMap((policy) => {
      if (policy.handler.export !== "CompositeInboundPolicy") return [policy];

      const children = policy.handler.options?.policies;
      return Array.isArray(children) ? children.flatMap(lookup) : [];
    }),
  );
};

// Policies are identified by their `policyType`, falling back to the policy
// class name for configs written without one.
const isPolicyKind = (
  policy: PolicyConfigurationFragment,
  policyType: string,
  handlerExport: string,
): boolean =>
  policy.policyType === policyType || policy.handler.export === handlerExport;

// One entry of a capability filter list, normalized. The policy accepts either
// a bare key (expose the upstream capability as-is) or a projection object that
// overrides what clients see, so both shapes collapse to the same record here.
type CapabilityProjection = {
  key: string;
  name?: string;
  description?: string;
  mimeType?: string;
};

// Reads one capability list off the filter policy's options. `keyProp` is the
// property the protocol identifies that capability kind by — `name` for tools
// and prompts, `uri`/`uriTemplate` for resources. Entries without one are
// dropped rather than documented half-formed.
const readCapabilityProjections = (
  value: unknown,
  keyProp: "name" | "uri" | "uriTemplate",
): CapabilityProjection[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry: unknown) => {
    if (typeof entry === "string") {
      const key = readStringOption(entry);
      return key ? [{ key }] : [];
    }
    if (!entry || typeof entry !== "object") return [];

    const record: RecordAny = entry;
    const key = readStringOption(record[keyProp]);
    if (!key) return [];

    const description = readStringOption(record.description);
    const mimeType = readStringOption(record.mimeType);
    // A resource's `name` is a label beside its URI; a tool's *is* the key, so
    // it never doubles as a label.
    const name = keyProp === "name" ? undefined : readStringOption(record.name);

    return [
      {
        key,
        ...(name ? { name } : {}),
        ...(description ? { description } : {}),
        ...(mimeType ? { mimeType } : {}),
      },
    ];
  });
};

// Builds the extension for an MCP gateway virtual server. Nothing about the
// upstream is known at build time, so every field comes from the route's own
// policies: the token-exchange policy names the connection, the capability
// filter enumerates what the gateway exposes downstream, and an inbound OAuth
// policy means clients sign in rather than carry a key. A passthrough server
// (no capability filter) documents no capabilities on purpose — its list only
// exists once a client initializes against the upstream.
const buildGatewayServerExtension = ({
  operation,
  schema,
  policies,
}: {
  operation: RecordAny;
  schema: OpenAPIV3_1.Document;
  policies: PolicyConfigurationFragment[];
}): ExtensionMcpServer => {
  const tokenExchange = policies.find((policy) =>
    isPolicyKind(
      policy,
      MCP_TOKEN_EXCHANGE_POLICY_TYPE,
      MCP_TOKEN_EXCHANGE_POLICY_EXPORT,
    ),
  );
  const capabilityFilter = policies.find((policy) =>
    isPolicyKind(
      policy,
      MCP_CAPABILITY_FILTER_POLICY_TYPE,
      MCP_CAPABILITY_FILTER_POLICY_EXPORT,
    ),
  );
  const usesOAuth = policies.some(
    (policy) =>
      MCP_OAUTH_POLICY_TYPE.test(policy.policyType) ||
      MCP_OAUTH_POLICY_EXPORT.test(policy.handler.export),
  );

  const extension: ExtensionMcpServer = {
    // The gateway shows `displayName` in its own connect prompts, so reusing it
    // keeps the docs and the runtime calling the server the same thing.
    name:
      readStringOption(tokenExchange?.handler.options?.displayName) ??
      readStringOption(operation.summary) ??
      DEFAULT_MCP_SERVER_NAME,
  };

  if (usesOAuth) {
    extension.authType = "oauth";
  }

  const filterOptions = capabilityFilter?.handler.options;
  if (filterOptions) {
    const tools = readCapabilityProjections(filterOptions.tools, "name");
    const prompts = readCapabilityProjections(filterOptions.prompts, "name");
    const resources = readCapabilityProjections(filterOptions.resources, "uri");
    const resourceTemplates = readCapabilityProjections(
      filterOptions.resourceTemplates,
      "uriTemplate",
    );

    if (tools.length > 0) {
      extension.tools = tools.map(({ key, description }) => ({
        name: key,
        ...(description ? { description } : {}),
      }));
    }
    if (prompts.length > 0) {
      extension.prompts = prompts.map(({ key, description }) => ({
        name: key,
        ...(description ? { description } : {}),
      }));
    }
    if (resources.length > 0) {
      extension.resources = resources.map(({ key, ...rest }) => ({
        uri: key,
        ...rest,
      }));
    }
    if (resourceTemplates.length > 0) {
      extension.resourceTemplates = resourceTemplates.map(
        ({ key, ...rest }) => ({ uriTemplate: key, ...rest }),
      );
    }
  }

  // Picks up anything enrichWithZuploData already documented on the route —
  // an API key policy's security scheme, or hand-authored security.
  const { security, securitySchemes } = extractSecurityFromOperations(schema, [
    operation,
  ]);
  const dedupedSecurity = deduplicateSecurity(security);
  if (dedupedSecurity.length > 0) {
    extension.security = dedupedSecurity;
    extension.securitySchemes = { ...securitySchemes };
  }

  return extension;
};

// Builds the extension for a dynamic MCP server: the `mcpServerHandler` route
// that serves the project's own REST operations as tools. Returns undefined
// when the route is not one, or exposes no operations.
const buildDynamicServerExtension = async ({
  operation,
  rootDir,
  schema,
}: {
  operation: RecordAny;
  rootDir: string;
  schema: OpenAPIV3_1.Document;
}): Promise<ExtensionMcpServer | undefined> => {
  const handler = operation["x-zuplo-route"]?.handler;
  if (
    handler?.export !== "mcpServerHandler" ||
    !Array.isArray(handler.options?.operations)
  ) {
    return undefined;
  }

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

// Enriches an OpenAPI schema with x-mcp-server data for both kinds of Zuplo
// MCP server: the dynamic `mcpServerHandler` route serving the project's own
// REST operations, and the MCP gateway virtual server proxying an upstream.
// Both end up documented by the same endpoint card.
export const enrichWithZuploMcpServerData = ({
  rootDir,
  policiesConfig,
}: {
  rootDir: string;
  // Gateway virtual servers keep their identity, capabilities and inbound auth
  // in policies rather than handler options, so without policies.json such a
  // route can only be documented by name.
  policiesConfig?: PoliciesConfigFile;
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
      if (!handler) return node;

      const mcpExtension = isGatewayHandler(handler)
        ? buildGatewayServerExtension({
            operation,
            schema: modifiedSchema as OpenAPIV3_1.Document,
            policies: resolveInboundPolicies(operation, policiesConfig),
          })
        : await buildDynamicServerExtension({
            operation,
            rootDir,
            schema: modifiedSchema as OpenAPIV3_1.Document,
          });

      if (!mcpExtension) return node;

      // A hand-authored `x-mcp-server` object wins over what config implies —
      // it is how an author documents a server Zudoku cannot see, e.g. a
      // gateway whose upstream tools are only known at runtime. The shorthand
      // `true` carries nothing to keep.
      const authored = operation["x-mcp-server"];
      node["x-mcp-server"] =
        authored && typeof authored === "object"
          ? { ...mcpExtension, ...authored }
          : mcpExtension;

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
