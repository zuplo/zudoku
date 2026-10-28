import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import type { RecordAny } from "../../../util/types.js";
import {
  DOCUMENT_TYPE_EXTENSION,
  MCP_CATALOG,
  type OasDocumentType,
} from "../interfaces.js";

/** Marks a single operation as an MCP server. See the `x-mcp-server` docs. */
export const MCP_SERVER_EXTENSION = "x-mcp-server";

export const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
  "trace",
] as const;

const httpMethods = new Set<string>(HTTP_METHODS);

const KNOWN_DOCUMENT_TYPES: readonly string[] = [MCP_CATALOG];

/**
 * Reads the raw `x-zudoku-type` value. Returned unvalidated so callers can
 * report an unknown value rather than silently ignoring it.
 */
export const readDocumentType = (schema: OpenAPIDocument): unknown =>
  (schema as RecordAny)[DOCUMENT_TYPE_EXTENSION];

export const isKnownDocumentType = (value: unknown): value is OasDocumentType =>
  typeof value === "string" && KNOWN_DOCUMENT_TYPES.includes(value);

const operationsOf = (schema: OpenAPIDocument) =>
  Object.values(schema.paths ?? {}).flatMap((pathItem) =>
    pathItem && typeof pathItem === "object"
      ? Object.entries(pathItem)
          .filter(([method]) => httpMethods.has(method.toLowerCase()))
          .map(([, operation]) => operation)
      : [],
  );

export const countOperations = (schema: OpenAPIDocument): number =>
  operationsOf(schema).length;

/**
 * Counts operations carrying `x-mcp-server` — the entries an MCP catalog
 * renders. Operations without it are not shown in catalog mode.
 */
export const countMcpServers = (schema: OpenAPIDocument): number =>
  operationsOf(schema).filter(
    (operation): operation is RecordAny =>
      !!operation &&
      typeof operation === "object" &&
      MCP_SERVER_EXTENSION in operation,
  ).length;
