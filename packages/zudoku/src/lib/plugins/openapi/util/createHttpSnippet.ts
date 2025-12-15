import { HTTPSnippet } from "@zudoku/httpsnippet";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";

const toFormDataParams = (text?: string) => {
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

export const createHttpSnippet = ({
  operation,
  selectedServer,
  exampleBody,
}: {
  operation: OperationsFragmentFragment;
  selectedServer: string;
  exampleBody: {
    mimeType: string;
    text?: string;
  };
}) => {
  const isMultipart =
    exampleBody.mimeType === "multipart/form-data" ||
    exampleBody.mimeType === "application/x-www-form-urlencoded";

  const postData = isMultipart
    ? {
        mimeType: exampleBody.mimeType,
        params: toFormDataParams(exampleBody.text),
      }
    : exampleBody;

  return new HTTPSnippet({
    method: operation.method.toUpperCase(),
    url:
      selectedServer + operation.path.replaceAll("{", ":").replaceAll("}", ""),
    postData,
    headers: [
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
    ],
    queryString:
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
        })) ?? [],
    httpVersion: "",
    cookies: [],
    headersSize: 0,
    bodySize: 0,
  });
};

export const getConverted = (snippet: HTTPSnippet, option: string) => {
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  let converted: any;
  switch (option) {
    case "shell":
      converted = snippet.convert("shell", "curl");
      break;
    case "js":
      converted = snippet.convert("javascript", "fetch");
      break;
    case "python":
      converted = snippet.convert("python", "requests");
      break;
    case "java":
      converted = snippet.convert("java", "okhttp");
      break;
    case "go":
      converted = snippet.convert("go", "native");
      break;
    case "csharp":
      converted = snippet.convert("csharp", "httpclient");
      break;
    case "kotlin":
      converted = snippet.convert("kotlin", "okhttp");
      break;
    case "objc":
      converted = snippet.convert("objc", "nsurlsession");
      break;
    case "php":
      converted = snippet.convert("php", "http2");
      break;
    case "ruby":
      converted = snippet.convert("ruby");
      break;
    case "swift":
      converted = snippet.convert("swift");
      break;
    default:
      converted = snippet.convert("shell");
      break;
  }

  return converted ? converted[0] : "";
};
