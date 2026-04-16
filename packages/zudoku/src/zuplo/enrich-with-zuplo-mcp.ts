import fs from "node:fs/promises";
import path from "node:path";
import type {
  ExtensionMcpServer,
  ExtensionMcpServerTool,
} from "@zuplo/mcp/openapi/types";
import {
  DEFAULT_MCP_SERVER_NAME,
  DEFAULT_MCP_SERVER_VERSION,
} from "@zuplo/mcp/server";
import type { OpenAPIV3_1 } from "openapi-types";
import type { ProcessorArg } from "../config/validators/BuildSchema.js";
import { traverse, traverseAsync } from "../lib/util/traverse.js";
import type { RecordAny } from "../lib/util/types.js";
import { operations } from "./enrich-with-zuplo.js";
import type { PoliciesConfigFile } from "./policy-types.js";

const MCP_TAG_NAME = "MCP";
const MCP_TAG_DESCRIPTION =
  "Model Context Protocol (MCP) server endpoints for AI tool integration";

const API_KEY_POLICY_EXPORTS = [
  "ApiAuthKeyInboundPolicy",
  "ApiKeyInboundPolicy",
  "MonetizationInboundPolicy",
];

// Resolves inbound policy names from x-zuplo-route, expanding composite policies
const resolveInboundPolicies = (
  operation: RecordAny,
  policiesConfig: PoliciesConfigFile,
): string[] => {
  const inbound = operation["x-zuplo-route"]?.policies?.inbound;
  if (!Array.isArray(inbound)) return [];

  return inbound.reduce((acc: string[], policyName: string) => {
    const policy = policiesConfig.policies?.find(
      ({ name }) => name === policyName,
    );
    if (!policy) return acc;

    if (policy.handler.export === "CompositeInboundPolicy") {
      const childPolicies = policy.handler.options?.policies as
        | string[]
        | undefined;
      return childPolicies ? [...acc, ...childPolicies] : acc;
    }

    return [...acc, policyName];
  }, []);
};

// Finds API key policies from resolved inbound policy names
const findApiKeyPolicies = (
  inboundPolicyNames: string[],
  policiesConfig: PoliciesConfigFile,
) => {
  return (
    policiesConfig.policies?.filter(
      (policy) =>
        inboundPolicyNames.includes(policy.name) &&
        API_KEY_POLICY_EXPORTS.includes(policy.handler.export) &&
        !policy.handler.options?.disableAutomaticallyAddingKeyHeaderToOpenApi,
    ) ?? []
  );
};

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

// Takes an OpenAPI document and extracts tool metadata for the given operation IDs
const findOperationsInDocument = (
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

// Enriches an OpenAPI schema with x-mcp-server data based on the Zuplo MCP server handler
export const enrichWithZuploMcpServerData = ({
  rootDir,
  policiesConfig,
}: {
  rootDir: string;
  policiesConfig: PoliciesConfigFile;
}) => {
  return async ({ schema }: ProcessorArg) => {
    if (!schema.paths) return schema;
    const modifiedSchema = { ...schema };
    if (!modifiedSchema?.paths) return modifiedSchema;

    let hasMcpEndpoints = false;
    let hasApiKeySecurity = false;

    await traverseAsync(modifiedSchema, async (node, nodePath) => {
      // Check if we're at a "post" operation (paths -> /some/path -> "post").
      // HTTP MCP servers are only allow post operations.
      if (!nodePath || nodePath.length !== 3 || nodePath[2] !== "post") {
        return node;
      }

      const operation = node as RecordAny;
      if (!operation?.["x-zuplo-route"]) return node;

      const handler = operation["x-zuplo-route"]?.handler;
      if (
        handler?.export !== "mcpServerHandler" ||
        !Array.isArray(handler.options?.operations)
      )
        return node;

      // Group operations by file to avoid reading the same file multiple times
      const operationsByFile = new Map<string, string[]>();
      for (const op of handler.options.operations) {
        if (!op.file || !op.id) continue;
        const ids = operationsByFile.get(op.file) ?? [];
        ids.push(op.id);
        operationsByFile.set(op.file, ids);
      }

      if (operationsByFile.size === 0) return node;

      const tools: ExtensionMcpServerTool[] = [];

      for (const [filePath, operationIds] of operationsByFile) {
        const resolvedPath = path.resolve(rootDir, "../", filePath);
        const fileContent = await fs.readFile(resolvedPath, "utf-8");
        const document = JSON.parse(fileContent);

        if (document) {
          tools.push(...findOperationsInDocument(document, operationIds));
        }
      }

      const mcpExtension: ExtensionMcpServer = {
        name: DEFAULT_MCP_SERVER_NAME,
        version: DEFAULT_MCP_SERVER_VERSION,
      };

      if (tools.length > 0) {
        mcpExtension.tools = tools;
      }

      // Check if any inbound policies on this MCP route are API key policies
      const inboundPolicyNames = resolveInboundPolicies(
        operation,
        policiesConfig,
      );
      const apiKeyPolicies = findApiKeyPolicies(
        inboundPolicyNames,
        policiesConfig,
      );

      node["x-mcp-server"] = mcpExtension;

      if (apiKeyPolicies.length > 0) {
        hasApiKeySecurity = true;
        (node["x-mcp-server"] as RecordAny).security = [{ api_key: [] }];
      }

      // Assign default MCP tag if the operation has no tags
      if (!operation.tags || operation.tags.length === 0) {
        hasMcpEndpoints = true;
        operation.tags = [MCP_TAG_NAME];
      }

      return node;
    });

    // Add MCP tag definition to top-level tags if we assigned it
    if (hasMcpEndpoints) {
      if (!modifiedSchema.tags) modifiedSchema.tags = [];
      if (!modifiedSchema.tags.some((tag) => tag.name === MCP_TAG_NAME)) {
        modifiedSchema.tags.push({
          name: MCP_TAG_NAME,
          description: MCP_TAG_DESCRIPTION,
        });
      }
    }

    // Ensure api_key security scheme exists if any MCP endpoint needs it
    if (hasApiKeySecurity) {
      if (!modifiedSchema.components) modifiedSchema.components = {};
      if (!modifiedSchema.components.securitySchemes) {
        modifiedSchema.components.securitySchemes = {};
      }
      if (!modifiedSchema.components.securitySchemes.api_key) {
        modifiedSchema.components.securitySchemes.api_key = {
          type: "http",
          scheme: "bearer",
        };
      }
    }

    return modifiedSchema;
  };
};
