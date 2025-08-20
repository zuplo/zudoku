import fs from "node:fs/promises";
import path from "node:path";
import type { OpenAPIV3_1 } from "openapi-types";
import type { ProcessorArg } from "../config/validators/BuildSchema.js";
import { objectEntries } from "../lib/util/objectEntries.js";

interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object" | "string" | "number" | "boolean" | "array" | "null";
    required?: string[];
    properties: Record<string, unknown>;
    example?: Record<string, unknown>;
  };
}

interface McpServerExtension {
  name: string;
  version: string;
  tools: McpTool[];
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
  } catch (_error) {
    return null;
  }
};

const extractOperationSchema = (
  operation: OpenAPIV3_1.OperationObject,
): McpTool | null => {
  if (!operation.operationId) return null;

  const requestBody = operation.requestBody as
    | OpenAPIV3_1.RequestBodyObject
    | undefined;
  const jsonContent = requestBody?.content?.["application/json"];
  const schema = jsonContent?.schema;

  if (!schema || typeof schema !== "object") return null;

  const tool: McpTool = {
    name: operation.operationId,
    description:
      operation.summary ||
      operation.description ||
      `Operation ${operation.operationId}`,
    inputSchema: {
      type: "object",
      properties: {},
    },
  };

  if ("properties" in schema && schema.properties) {
    tool.inputSchema.properties = schema.properties;
  }

  if ("required" in schema && Array.isArray(schema.required)) {
    tool.inputSchema.required = schema.required;
  }

  if ("example" in schema && schema.example) {
    tool.inputSchema.example = schema.example;
  } else if (jsonContent?.example) {
    tool.inputSchema.example = jsonContent.example;
  }

  return tool;
};

const findOperationsInDocument = (
  document: OpenAPIV3_1.Document,
  operationIds: string[],
): McpTool[] => {
  const tools: McpTool[] = [];

  if (!document.paths) return tools;

  for (const [_pathKey, pathItem] of objectEntries(document.paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    for (const method of operations) {
      const operation = (pathItem as OpenAPIV3_1.PathItemObject)[
        method as keyof OpenAPIV3_1.PathItemObject
      ] as OpenAPIV3_1.OperationObject | undefined;
      if (
        !operation?.operationId ||
        !operationIds.includes(operation.operationId)
      )
        continue;

      const tool = extractOperationSchema(operation);
      if (tool) {
        tools.push(tool);
      }
    }
  }

  return tools;
};

export const enrichWithMcpServerData = ({ rootDir }: { rootDir: string }) => {
  return async ({ schema }: ProcessorArg) => {
    if (!schema.paths) return schema;

    const modifiedSchema = { ...schema };

    for (const [_pathKey, pathItem] of objectEntries(modifiedSchema.paths!)) {
      if (!pathItem || typeof pathItem !== "object") continue;

      for (const method of operations) {
        const operation = (pathItem as OpenAPIV3_1.PathItemObject)[
          method as keyof OpenAPIV3_1.PathItemObject
        ] as (OpenAPIV3_1.OperationObject & Record<string, any>) | undefined;
        if (!operation?.["x-zuplo-route"]) continue;

        const zuploRoute = operation["x-zuplo-route"];
        const handler = zuploRoute?.handler;

        if (handler?.export !== "mcpServerHandler" || !handler.options?.files)
          continue;

        const tools: McpTool[] = [];

        for (const fileConfig of handler.options.files) {
          if (!fileConfig.path || !fileConfig.operationIds) continue;

          const resolvedPath = path.resolve(rootDir, fileConfig.path);
          const document = await loadOpenApiFile(resolvedPath);

          if (document) {
            const fileTools = findOperationsInDocument(
              document,
              fileConfig.operationIds,
            );
            tools.push(...fileTools);
          }
        }

        if (tools.length > 0) {
          const mcpExtension: McpServerExtension = {
            name: "Zuplo MCP Server",
            version: "0.0.0",
            tools,
          };

          operation["x-mcp-server"] = mcpExtension;
        }
      }
    }

    return modifiedSchema;
  };
};
