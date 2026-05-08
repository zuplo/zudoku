const stringifyValue = (v: unknown): string =>
  typeof v === "string" ? v : JSON.stringify(v);

export const isUrlEncodedMediaType = (mediaType?: string) =>
  mediaType === "application/x-www-form-urlencoded";

export const toUrlEncoded = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value == null || typeof value !== "object") return "";

  const params = new URLSearchParams();
  for (const [name, raw] of Object.entries(value as Record<string, unknown>)) {
    if (raw === undefined) continue;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const v of values) {
      if (v === undefined) continue;
      params.append(name, stringifyValue(v));
    }
  }
  return params.toString();
};

export const formatRequestBodyForDisplay = (
  mediaType: string | undefined,
  value: unknown,
): string | undefined => {
  if (value == null) return;
  if (isUrlEncodedMediaType(mediaType)) return toUrlEncoded(value);
  if (typeof value === "string") return value.trim();
  return JSON.stringify(value, null, 2);
};

export const getLanguageForMediaType = (mediaType?: string): string => {
  if (!mediaType) return "text";
  if (mediaType.endsWith("+json")) return "json";
  if (mediaType.endsWith("+xml")) return "xml";
  if (mediaType.endsWith("+yaml")) return "yaml";

  const languages: Record<string, string> = {
    "text/html": "html",
    "application/x-ndjson": "json",
    "application/json": "json",
    "application/xml": "xml",
    "application/x-yaml": "yaml",
    "text/csv": "csv",
    "application/javascript": "javascript",
    "application/graphql": "graphql",
    "application/x-www-form-urlencoded": "text",
  };
  return languages[mediaType] ?? "text";
};
