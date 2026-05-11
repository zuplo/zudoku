export type UrlEncodedRow = { name: string; value: string };
const stringifyValue = (v: unknown): string =>
  typeof v === "string" ? v : JSON.stringify(v);

const normalizeMediaType = (mediaType?: string) =>
  mediaType?.split(";")[0]?.trim().toLowerCase();

export const isUrlEncodedMediaType = (mediaType?: string) =>
  normalizeMediaType(mediaType) === "application/x-www-form-urlencoded";

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
  const normalized = normalizeMediaType(mediaType);
  if (!normalized) return "text";
  if (normalized.endsWith("+json")) return "json";
  if (normalized.endsWith("+xml")) return "xml";
  if (normalized.endsWith("+yaml")) return "yaml";

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
  return languages[normalized] ?? "text";
};
export const rowsToUrlEncoded = (rows: UrlEncodedRow[]): string => {
  const params = new URLSearchParams();
  for (const { name, value } of rows) params.append(name, value);
  return params.toString();
};

export const fromUrlEncoded = (text: string): UrlEncodedRow[] => {
  if (!text) return [];
  const rows: UrlEncodedRow[] = [];
  for (const [name, value] of new URLSearchParams(text)) {
    rows.push({ name, value });
  }
  return rows;
};

const objectToRows = (obj: Record<string, unknown>): UrlEncodedRow[] =>
  Object.entries(obj).flatMap(([name, value]) => {
    const values = Array.isArray(value) ? value : [value];
    return values.map((v) => ({ name, value: stringifyValue(v) }));
  });

export const exampleToUrlEncodedRows = (value: unknown): UrlEncodedRow[] => {
  if (typeof value === "string") return fromUrlEncoded(value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return objectToRows(value as Record<string, unknown>);
  }
  return [];
};
