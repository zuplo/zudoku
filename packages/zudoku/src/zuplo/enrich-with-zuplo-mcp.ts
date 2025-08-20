import fs from "node:fs/promises";
import path from "node:path";
import type { OpenAPIV3_1 } from "openapi-types";
import type { ProcessorArg } from "../config/validators/BuildSchema.js";
import { objectEntries } from "../lib/util/objectEntries.js";

interface McpTool {
  name: string;
  description: string;
  inputSchema?: object;
}

interface McpServerExtension {
  name: string;
  version: string;
  tools?: McpTool[];
}

const operations = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
];

const loadOpenApiFile = async (
  filePath: string,
): Promise<OpenAPIV3_1.Document | null> => {
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (e) {
    throw e;
  }
};

const extractOperationSchema = (
  operation: OpenAPIV3_1.OperationObject & Record<string, any>,
): McpTool | null => {
  if (!operation.operationId) return null;

  // Check if tool is explicitly disabled
  const mcpToolConfig = operation["x-zuplo-mcp-tool"];
  if (mcpToolConfig?.enabled === false) {
    return null;
  }

  const requestBody = operation.requestBody as
    | OpenAPIV3_1.RequestBodyObject
    | undefined;
  const jsonContent = requestBody?.content?.["application/json"];
  const schema = jsonContent?.schema;

  const tool: McpTool = {
    // Use custom name from x-zuplo-mcp-tool or fallback to operationId
    name: mcpToolConfig?.name || operation.operationId,
    // Use custom description from x-zuplo-mcp-tool or fallback to operation description
    description:
      mcpToolConfig?.description ||
      operation.summary ||
      operation.description ||
      `Operation ${operation.operationId}`,
  };

  // Only add inputSchema if we have a valid schema
  if (schema && typeof schema === "object") {
    tool.inputSchema = schema;
  }

  return tool;
};

// Build a lookup map of operationId -> operation for efficient access
const buildOperationLookup = (
  document: OpenAPIV3_1.Document,
): Map<string, OpenAPIV3_1.OperationObject & Record<string, any>> => {
  const operationMap = new Map<
    string,
    OpenAPIV3_1.OperationObject & Record<string, any>
  >();

  if (!document.paths) return operationMap;

  for (const [_pathKey, pathItem] of objectEntries(document.paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    for (const method of operations) {
      const operation = (pathItem as OpenAPIV3_1.PathItemObject)[
        method as keyof OpenAPIV3_1.PathItemObject
      ] as (OpenAPIV3_1.OperationObject & Record<string, any>) | undefined;

      if (operation?.operationId) {
        operationMap.set(operation.operationId, operation);
      }
    }
  }

  return operationMap;
};

const findOperationsInDocument = (
  document: OpenAPIV3_1.Document,
  operationIds: string[],
): McpTool[] => {
  const tools: McpTool[] = [];
  const operationLookup = buildOperationLookup(document);

  for (const operationId of operationIds) {
    const operation = operationLookup.get(operationId);
    if (operation) {
      const tool = extractOperationSchema(operation);
      if (tool) {
        tools.push(tool);
      }
    }
  }

  return tools;
};

export const enrichWithZuploMcpServerData = ({
  rootDir,
}: {
  rootDir: string;
}) => {
  return async ({ schema }: ProcessorArg) => {
    if (!schema.paths) return schema;

    const modifiedSchema = { ...schema };

    for (const [_pathKey, pathItem] of objectEntries(modifiedSchema.paths!)) {
      if (!pathItem || typeof pathItem !== "object") continue;

      const operation = (pathItem as OpenAPIV3_1.PathItemObject)[
        "post" as keyof OpenAPIV3_1.PathItemObject
      ] as (OpenAPIV3_1.OperationObject & Record<string, any>) | undefined;
      if (!operation?.["x-zuplo-route"]) continue;

      const zuploRoute = operation["x-zuplo-route"];
      const handler = zuploRoute?.handler;

      if (handler?.export !== "mcpServerHandler" || !handler.options?.files)
        continue;

      const tools: McpTool[] = [];

      for (const fileConfig of handler.options.files) {
        if (!fileConfig.path || !fileConfig.operationIds) continue;

        const resolvedPath = path.resolve(rootDir, "../", fileConfig.path);
        const document = await loadOpenApiFile(resolvedPath);

        if (document) {
          const fileTools = findOperationsInDocument(
            document,
            fileConfig.operationIds,
          );

          tools.push(...fileTools);
        }
      }

      const mcpExtension: McpServerExtension = {
        name: "Zuplo MCP Server",
        version: "0.0.0",
      };

      if (tools.length > 0) {
        mcpExtension.tools = tools;
      }

      operation["x-mcp-server"] = mcpExtension;
    }

    return modifiedSchema;
  };
};
