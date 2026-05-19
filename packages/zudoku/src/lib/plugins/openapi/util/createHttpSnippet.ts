import type { HarRequest, Plugin } from "@scalar/snippetz";
import { csharpHttpclient } from "@scalar/snippetz/plugins/csharp/httpclient";
import { goNative } from "@scalar/snippetz/plugins/go/native";
import { javaOkhttp } from "@scalar/snippetz/plugins/java/okhttp";
import { jsFetch } from "@scalar/snippetz/plugins/js/fetch";
import { kotlinOkhttp } from "@scalar/snippetz/plugins/kotlin/okhttp";
import { objcNsurlsession } from "@scalar/snippetz/plugins/objc/nsurlsession";
import { phpCurl } from "@scalar/snippetz/plugins/php/curl";
import { pythonRequests } from "@scalar/snippetz/plugins/python/requests";
import { rubyNative } from "@scalar/snippetz/plugins/ruby/native";
import { shellCurl } from "@scalar/snippetz/plugins/shell/curl";
import { swiftNsurlsession } from "@scalar/snippetz/plugins/swift/nsurlsession";
import { joinUrl } from "../../../util/joinUrl.js";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";

const toMultipartParams = (text?: string) => {
  const stringify = (v: unknown) =>
    typeof v === "string" ? v : JSON.stringify(v);

  try {
    const obj = text && JSON.parse(text);
    if (typeof obj !== "object" || !obj) return [];

    return Object.entries(obj).flatMap(([name, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return values.map((v) => ({ name, value: stringify(v) }));
    });
  } catch {
    return [];
  }
};

const toUrlEncodedParams = (text?: string) => {
  if (!text) return [];
  return Array.from(new URLSearchParams(text).entries()).map(
    ([name, value]) => ({ name, value }),
  );
};

export type ResolvedAuth = {
  headers: Array<{ name: string; value: string }>;
  queryString: Array<{ name: string; value: string }>;
};

export const EMPTY_RESOLVED_AUTH: ResolvedAuth = {
  headers: [],
  queryString: [],
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Picks the first non-empty security requirement. OpenAPI requirements are OR'd
// (any one satisfies); we only show one alternative as a placeholder.
const getPlaceholderAuth = (
  operation: OperationsFragmentFragment,
): ResolvedAuth => {
  const requirement = operation.security?.find((r) => r.schemes.length > 0);
  if (!requirement) return EMPTY_RESOLVED_AUTH;

  const headers: Array<{ name: string; value: string }> = [];
  const queryString: Array<{ name: string; value: string }> = [];

  for (const { scheme } of requirement.schemes) {
    switch (scheme.type) {
      case "apiKey": {
        if (!scheme.paramName) break;
        const entry = { name: scheme.paramName, value: "<api-key>" };
        if (scheme.in === "header") headers.push(entry);
        else if (scheme.in === "query") queryString.push(entry);
        break;
      }
      case "http": {
        const httpScheme = scheme.scheme?.toLowerCase();
        if (httpScheme === "basic") {
          headers.push({ name: "Authorization", value: "Basic <credentials>" });
        } else if (httpScheme === "bearer" || !scheme.scheme) {
          headers.push({ name: "Authorization", value: "Bearer <token>" });
        } else {
          headers.push({
            name: "Authorization",
            value: `${capitalize(scheme.scheme)} <token>`,
          });
        }
        break;
      }
      case "oauth2":
      case "openIdConnect":
        headers.push({ name: "Authorization", value: "Bearer <token>" });
        break;
    }
  }

  return { headers, queryString };
};

export const createHttpSnippet = ({
  operation,
  selectedServer,
  exampleBody,
  resolvedAuth,
}: {
  operation: OperationsFragmentFragment;
  selectedServer: string;
  exampleBody: {
    mimeType: string;
    text?: string;
  };
  resolvedAuth?: ResolvedAuth;
}): Partial<HarRequest> => {
  const postData = exampleBody.text
    ? exampleBody.mimeType === "multipart/form-data"
      ? {
          mimeType: exampleBody.mimeType,
          params: toMultipartParams(exampleBody.text),
        }
      : exampleBody.mimeType === "application/x-www-form-urlencoded"
        ? {
            mimeType: exampleBody.mimeType,
            params: toUrlEncodedParams(exampleBody.text),
          }
        : { mimeType: exampleBody.mimeType, text: exampleBody.text }
    : undefined;

  const baseHeaders = [
    ...(exampleBody.text
      ? [{ name: "Content-Type", value: exampleBody.mimeType }]
      : []),
    ...(operation.parameters
      ?.filter((p) => p.in === "header" && p.required === true)
      .map((p) => ({
        name: p.name,
        value:
          p.schema?.default ??
          p.examples?.find((x) => x.value)?.value ??
          (p.schema?.type === "string"
            ? "<string>"
            : p.schema?.type === "number" || p.schema?.type === "integer"
              ? "<number>"
              : p.schema?.type === "boolean"
                ? "<bool>"
                : "<value>"),
      })) ?? []),
  ];

  const baseQueryString =
    operation.parameters
      ?.filter((p) => p.in === "query" && p.required === true)
      .map((p) => ({
        name: p.name,
        value:
          p.schema?.default ??
          p.examples?.find((x) => x.value)?.value ??
          (p.schema?.type === "string"
            ? "<string>"
            : p.schema?.type === "number" || p.schema?.type === "integer"
              ? "<number>"
              : p.schema?.type === "boolean"
                ? "<bool>"
                : "<value>"),
      })) ?? [];

  const effectiveAuth =
    resolvedAuth &&
    (resolvedAuth.headers.length > 0 || resolvedAuth.queryString.length > 0)
      ? resolvedAuth
      : getPlaceholderAuth(operation);

  const authHeaderNames = new Set(
    effectiveAuth.headers.map((h) => h.name.toLowerCase()),
  );
  const authQueryNames = new Set(effectiveAuth.queryString.map((q) => q.name));

  return {
    method: operation.method.toUpperCase(),
    url: joinUrl(
      selectedServer,
      operation.path.replaceAll("{", ":").replaceAll("}", ""),
    ),
    postData,
    headers: [
      ...baseHeaders.filter((h) => !authHeaderNames.has(h.name.toLowerCase())),
      ...effectiveAuth.headers,
    ],
    queryString: [
      ...baseQueryString.filter((q) => !authQueryNames.has(q.name)),
      ...effectiveAuth.queryString,
    ],
  } satisfies Partial<HarRequest>;
};

const PLUGINS: Record<string, Plugin> = {
  shell: shellCurl,
  js: jsFetch,
  python: pythonRequests,
  java: javaOkhttp,
  go: goNative,
  csharp: csharpHttpclient,
  kotlin: kotlinOkhttp,
  objc: objcNsurlsession,
  php: phpCurl,
  ruby: rubyNative,
  swift: swiftNsurlsession,
};

export const getConverted = (
  request: Partial<HarRequest>,
  language: string,
): string => {
  const plugin = PLUGINS[language] ?? shellCurl;
  return plugin.generate(request) ?? "";
};
