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

const MCP_TAG_NAME = "MCP";
const MCP_TAG_DESCRIPTION =
  "Model Context Protocol (MCP) server endpoints for AI tool integration";

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

interface DocumentExtractionResult {
  tools: ExtensionMcpServerTool[];
  security: OpenAPIV3_1.SecurityRequirementObject[];
  securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject>;
}

// Extracts tools, security requirements, and security schemes from referenced operations
const extractFromDocument = (
  document: OpenAPIV3_1.Document,
  operationIds: string[],
): DocumentExtractionResult => {
  const operationLookup = buildOperationLookup(document);
  const tools: ExtensionMcpServerTool[] = [];
  const securityReqs: OpenAPIV3_1.SecurityRequirementObject[] = [];
  const referencedSchemeNames = new Set<string>();

  for (const operationId of operationIds) {
    const operation = operationLookup.get(operationId);
    if (!operation) continue;

    const tool = extractOperationSchema(operation);
    if (tool) tools.push(tool);

    // Collect security: operation-level takes precedence, fall back to doc-level
    const opSecurity = operation.security ?? document.security;
    if (opSecurity) {
      for (const req of opSecurity) {
        securityReqs.push(req);
        for (const name of Object.keys(req)) {
          referencedSchemeNames.add(name);
        }
      }
    }
  }

  // Grab referenced security scheme definitions from the document
  const securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject> = {};
  const docSchemes = document.components?.securitySchemes;
  if (docSchemes) {
    for (const name of referencedSchemeNames) {
      const scheme = docSchemes[name];
      if (scheme && !("$ref" in scheme)) {
        securitySchemes[name] = scheme;
      }
    }
  }

  return { tools, security: securityReqs, securitySchemes };
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

    let hasMcpEndpoints = false;
    const collectedSecuritySchemes: Record<
      string,
      OpenAPIV3_1.SecuritySchemeObject
    > = {};

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

      const allTools: ExtensionMcpServerTool[] = [];
      const allSecurity: OpenAPIV3_1.SecurityRequirementObject[] = [];

      for (const [filePath, operationIds] of operationsByFile) {
        const resolvedPath = path.resolve(rootDir, "../", filePath);
        const fileContent = await fs.readFile(resolvedPath, "utf-8");
        const document = JSON.parse(fileContent);

        if (document) {
          const result = extractFromDocument(document, operationIds);
          allTools.push(...result.tools);
          allSecurity.push(...result.security);
          Object.assign(collectedSecuritySchemes, result.securitySchemes);
        }
      }

      const mcpExtension: ExtensionMcpServer = {
        name: DEFAULT_MCP_SERVER_NAME,
        version: DEFAULT_MCP_SERVER_VERSION,
      };

      if (allTools.length > 0) {
        mcpExtension.tools = allTools;
      }

      node["x-mcp-server"] = mcpExtension;

      // Add security from referenced operations to x-mcp-server
      const dedupedSecurity = deduplicateSecurity(allSecurity);
      if (dedupedSecurity.length > 0) {
        const ext = node["x-mcp-server"] as RecordAny;
        ext.security = dedupedSecurity;
        // Include scheme definitions so the UI can generate auth headers
        ext.securitySchemes = { ...collectedSecuritySchemes };
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

    // Merge collected security schemes into the main schema
    if (Object.keys(collectedSecuritySchemes).length > 0) {
      if (!modifiedSchema.components) modifiedSchema.components = {};
      if (!modifiedSchema.components.securitySchemes) {
        modifiedSchema.components.securitySchemes = {};
      }
      for (const [name, scheme] of Object.entries(collectedSecuritySchemes)) {
        if (!modifiedSchema.components.securitySchemes[name]) {
          modifiedSchema.components.securitySchemes[name] = scheme;
        }
      }
    }

    return modifiedSchema;
  };
};
