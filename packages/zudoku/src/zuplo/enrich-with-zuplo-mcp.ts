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

// Takes an OpenAPI document and returns the x-mcp-server tools list defined
// by an MCP server's options.files[x].operationIds array.
const findOperationsInDocument = (
  document: OpenAPIV3_1.Document,
  operationIds: string[],
): ExtensionMcpServerTool[] => {
  const tools: ExtensionMcpServerTool[] = [];
  const operationLookup = buildOperationLookup(document);

  operationIds.forEach((operationId) => {
    const operation = operationLookup.get(operationId);
    if (operation) {
      const tool = extractOperationSchema(operation);
      if (tool) {
        tools.push(tool);
      }
    }
  });

  return tools;
};

// Enriches an OpenAPI schema with x-mcp-server data based on the Zuplo MCP server handler
export const enrichWithZuploMcpServerData = ({
  rootDir,
}: {
  rootDir: string;
}) => {
  return async ({ schema }: ProcessorArg) => {
    if (!schema.paths) return schema;
    const modifiedSchema = { ...schema };
    if (!modifiedSchema?.paths) return modifiedSchema;

    await traverseAsync(modifiedSchema, async (node, nodePath) => {
      // Check if we're at a "post" operation (paths -> /some/path -> "post").
      // HTTP MCP servers are only allow post operations.
      if (!nodePath || nodePath.length !== 3 || nodePath[2] !== "post") {
        return node;
      }

      const operation = node as RecordAny;
      if (!operation?.["x-zuplo-route"]) return node;

      const handler = operation["x-zuplo-route"]?.handler;
      if (handler?.export !== "mcpServerHandler" || !handler.options?.files)
        return node;

      const tools: ExtensionMcpServerTool[] = [];

      for (const fileConfig of handler.options.files) {
        if (!fileConfig.path || !fileConfig.operationIds) continue;

        const resolvedPath = path.resolve(rootDir, "../", fileConfig.path);
        const fileContent = await fs.readFile(resolvedPath, "utf-8");
        const document = JSON.parse(fileContent);

        if (document) {
          const fileTools = findOperationsInDocument(
            document,
            fileConfig.operationIds,
          );

          tools.push(...fileTools);
        }
      }

      const mcpExtension: ExtensionMcpServer = {
        name: DEFAULT_MCP_SERVER_NAME,
        version: DEFAULT_MCP_SERVER_VERSION,
      };

      if (tools.length > 0) {
        mcpExtension.tools = tools;
      }

      node["x-mcp-server"] = mcpExtension;
      return node;
    });

    return modifiedSchema;
  };
};
