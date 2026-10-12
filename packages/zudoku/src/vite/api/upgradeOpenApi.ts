import { upgrade } from "@scalar/openapi-parser";
import {
  HttpMethods,
  type OpenAPIDocument,
} from "../../lib/oas/parser/index.js";
import type { RecordAny } from "../../lib/util/traverse.js";

const httpMethods = new Set<string>(HttpMethods);

const isRecord = (value: unknown): value is RecordAny =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const mapValues = (record: RecordAny, fn: (value: unknown) => unknown) =>
  Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, fn(value)]),
  );

// @scalar/openapi-parser mistakes the `default` key of a Responses Object for
// the JSON Schema `default` keyword and leaves everything below it in OpenAPI
// 3.0 shape (`nullable`, `example`, boolean `exclusiveMinimum`, ...). Upgrade
// each default response on its own, filed under a regular status code, so it
// gets the same conversion as every other response.
const upgradeResponse = (response: unknown) =>
  upgrade({
    openapi: "3.0.3",
    info: { title: "", version: "" },
    paths: { "/": { get: { responses: { "200": response } } } },
  }).specification?.paths?.["/"]?.get?.responses?.["200"] ?? response;

const upgradeDefaultResponse = (responses: unknown) =>
  isRecord(responses) && isRecord(responses.default)
    ? { ...responses, default: upgradeResponse(responses.default) }
    : responses;

const upgradePathItem = (pathItem: unknown): unknown => {
  if (!isRecord(pathItem)) return pathItem;

  return Object.fromEntries(
    Object.entries(pathItem).map(([method, operation]) => {
      if (!httpMethods.has(method) || !isRecord(operation)) {
        return [method, operation];
      }

      return [
        method,
        {
          ...operation,
          ...(operation.responses && {
            responses: upgradeDefaultResponse(operation.responses),
          }),
          ...(isRecord(operation.callbacks) && {
            callbacks: mapValues(operation.callbacks, (callback) =>
              isRecord(callback)
                ? mapValues(callback, upgradePathItem)
                : callback,
            ),
          }),
        },
      ];
    }),
  );
};

const upgradeDefaultResponses = (document: RecordAny): RecordAny => ({
  ...document,
  ...(isRecord(document.paths) && {
    paths: mapValues(document.paths, upgradePathItem),
  }),
  ...(isRecord(document.webhooks) && {
    webhooks: mapValues(document.webhooks, upgradePathItem),
  }),
  ...(isRecord(document.components?.responses) && {
    components: {
      ...document.components,
      responses: upgradeDefaultResponse(document.components.responses),
    },
  }),
});

// Upgrades Swagger 2.0 and OpenAPI 3.0 documents to OpenAPI 3.1. Newer
// documents are returned as they are.
export const upgradeOpenApi = (schema: RecordAny): OpenAPIDocument => {
  // Read before upgrading: the upgrade rewrites the version fields in place.
  const isUpgraded =
    typeof schema.swagger === "string" ||
    (typeof schema.openapi === "string" && schema.openapi.startsWith("3.0"));

  const upgraded = upgrade(schema).specification;
  const document = (
    isUpgraded && isRecord(upgraded)
      ? upgradeDefaultResponses(upgraded)
      : upgraded
  ) as OpenAPIDocument;

  if (document?.info && typeof document.info.version !== "string") {
    document.info.version = "0.0.1";
  }

  return document;
};
