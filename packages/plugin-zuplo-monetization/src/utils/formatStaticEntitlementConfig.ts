const hasValueField = (value: unknown): value is { value: unknown } =>
  typeof value === "object" && value !== null && "value" in value;

const formatJsonValue = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return JSON.stringify(value);
};

export const formatStaticEntitlementConfig = (
  config: string | undefined,
): string | undefined => {
  if (!config) return undefined;

  try {
    const parsed: unknown = JSON.parse(config);
    return formatJsonValue(hasValueField(parsed) ? parsed.value : parsed);
  } catch {
    return undefined;
  }
};
