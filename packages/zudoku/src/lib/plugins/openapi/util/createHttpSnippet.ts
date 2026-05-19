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

  const authHeaderNames = new Set(
    resolvedAuth?.headers.map((h) => h.name.toLowerCase()) ?? [],
  );
  const authQueryNames = new Set(
    resolvedAuth?.queryString.map((q) => q.name) ?? [],
  );

  return {
    method: operation.method.toUpperCase(),
    url: joinUrl(
      selectedServer,
      operation.path.replaceAll("{", ":").replaceAll("}", ""),
    ),
    postData,
    headers: [
      ...baseHeaders.filter((h) => !authHeaderNames.has(h.name.toLowerCase())),
      ...(resolvedAuth?.headers ?? []),
    ],
    queryString: [
      ...baseQueryString.filter((q) => !authQueryNames.has(q.name)),
      ...(resolvedAuth?.queryString ?? []),
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
  const plugin = PLUGINS[language] ?? PLUGINS.shell;
  return plugin.generate(request) ?? "";
};
