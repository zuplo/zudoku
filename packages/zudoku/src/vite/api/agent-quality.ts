import type { OpenAPIDocument } from "../../lib/oas/parser/index.js";

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

const REQUEST_BODY_METHODS = new Set(["post", "put", "patch"]);

type JsonObject = Record<string, unknown>;

export type AgentQualityIssue = {
  code:
    | "duplicate-operation-id"
    | "missing-description"
    | "missing-operation-id"
    | "missing-request-body"
    | "missing-response-schema"
    | "untyped-request-body"
    | "untyped-parameter";
  location: string;
  message: string;
};

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const resolveLocalRef = (
  document: OpenAPIDocument,
  value: unknown,
): unknown => {
  if (!isObject(value) || typeof value.$ref !== "string") return value;
  if (!value.$ref.startsWith("#/")) return undefined;

  return value.$ref
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce<unknown>((current, part) => {
      if (!isObject(current)) return undefined;
      return current[part];
    }, document);
};

const schemaIsTyped = (document: OpenAPIDocument, schema: unknown): boolean => {
  const resolved = resolveLocalRef(document, schema);
  if (typeof resolved === "boolean") return true;
  if (!isObject(resolved)) return false;

  return (
    typeof resolved.type === "string" ||
    Array.isArray(resolved.type) ||
    "enum" in resolved ||
    "const" in resolved ||
    "properties" in resolved ||
    "items" in resolved ||
    "oneOf" in resolved ||
    "anyOf" in resolved ||
    "allOf" in resolved
  );
};

const contentHasTypedSchema = (document: OpenAPIDocument, content: unknown) =>
  isObject(content) &&
  Object.values(content).some(
    (mediaType) =>
      isObject(mediaType) && schemaIsTyped(document, mediaType.schema),
  );

const parameterIsTyped = (document: OpenAPIDocument, parameter: unknown) => {
  const resolved = resolveLocalRef(document, parameter);
  return (
    isObject(resolved) &&
    (schemaIsTyped(document, resolved.schema) ||
      contentHasTypedSchema(document, resolved.content))
  );
};

const responseHasTypedSchema = (
  document: OpenAPIDocument,
  response: unknown,
) => {
  const resolved = resolveLocalRef(document, response);
  return (
    isObject(resolved) && contentHasTypedSchema(document, resolved.content)
  );
};

const requestBodyHasTypedSchema = (
  document: OpenAPIDocument,
  requestBody: unknown,
) => {
  const resolved = resolveLocalRef(document, requestBody);
  return (
    isObject(resolved) && contentHasTypedSchema(document, resolved.content)
  );
};

const getParameterName = (document: OpenAPIDocument, parameter: unknown) => {
  const resolved = resolveLocalRef(document, parameter);
  return isObject(resolved) && typeof resolved.name === "string"
    ? resolved.name
    : "<unknown>";
};

/**
 * Reports OpenAPI authoring gaps that make operations harder to translate to
 * LLM function tools. The audit is read-only and intentionally opt-in.
 */
export const auditOpenApiAgentQuality = (
  document: OpenAPIDocument,
): AgentQualityIssue[] => {
  const issues: AgentQualityIssue[] = [];
  const operationIds = new Map<string, string[]>();
  if (!isObject(document.paths)) return issues;

  for (const [route, rawPathItem] of Object.entries(document.paths)) {
    const pathItem = resolveLocalRef(document, rawPathItem);
    if (!isObject(pathItem)) continue;

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!isObject(operation)) continue;

      const location = `${method.toUpperCase()} ${route}`;
      if (
        typeof operation.operationId !== "string" ||
        operation.operationId.trim().length === 0
      ) {
        issues.push({
          code: "missing-operation-id",
          location,
          message: "Operation is missing a unique operationId.",
        });
      } else {
        const locations = operationIds.get(operation.operationId) ?? [];
        locations.push(location);
        operationIds.set(operation.operationId, locations);
      }

      if (
        typeof operation.description !== "string" ||
        operation.description.trim().length === 0
      ) {
        issues.push({
          code: "missing-description",
          location,
          message: "Operation is missing a description.",
        });
      }

      const parameters = [
        ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
        ...(Array.isArray(operation.parameters) ? operation.parameters : []),
      ];
      for (const parameter of parameters) {
        if (parameterIsTyped(document, parameter)) continue;
        issues.push({
          code: "untyped-parameter",
          location,
          message: `Parameter "${getParameterName(document, parameter)}" is missing a typed schema.`,
        });
      }

      if (operation.requestBody === undefined) {
        if (REQUEST_BODY_METHODS.has(method)) {
          issues.push({
            code: "missing-request-body",
            location,
            message: "Write operation is missing a requestBody schema.",
          });
        }
      } else if (!requestBodyHasTypedSchema(document, operation.requestBody)) {
        issues.push({
          code: "untyped-request-body",
          location,
          message: "Request body is missing a typed schema.",
        });
      }

      const responses = operation.responses;
      if (!isObject(responses) || Object.keys(responses).length === 0) {
        issues.push({
          code: "missing-response-schema",
          location,
          message: "Operation has no response schemas.",
        });
        continue;
      }

      for (const [status, response] of Object.entries(responses)) {
        if (["204", "205", "304"].includes(status)) continue;
        if (responseHasTypedSchema(document, response)) continue;
        issues.push({
          code: "missing-response-schema",
          location,
          message: `Response ${status} is missing a typed schema.`,
        });
      }
    }
  }

  for (const [operationId, locations] of operationIds) {
    if (locations.length < 2) continue;
    issues.push({
      code: "duplicate-operation-id",
      location: locations.join(", "),
      message: `operationId "${operationId}" is used by multiple operations.`,
    });
  }

  return issues;
};

export const formatAgentQualityReport = (
  apiPath: string,
  issues: AgentQualityIssue[],
) =>
  [
    `Agent-quality audit for API "${apiPath}" found ${issues.length} issue${issues.length === 1 ? "" : "s"}:`,
    ...issues.map(
      (issue) => `- [${issue.code}] ${issue.location}: ${issue.message}`,
    ),
  ].join("\n");
