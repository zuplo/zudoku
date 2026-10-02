export type SeoExtension = {
  title?: string;
  description?: string;
};

const nonEmptyString = (value: unknown) =>
  typeof value === "string" ? value.trim() || undefined : undefined;

// Reads `x-zudoku-seo`, ignoring malformed or empty values
export const getSeoExtension = (
  extensions?: Record<string, unknown> | null,
): SeoExtension => {
  const seo = extensions?.["x-zudoku-seo"];

  if (!seo || typeof seo !== "object") return {};

  return {
    title: "title" in seo ? nonEmptyString(seo.title) : undefined,
    description:
      "description" in seo ? nonEmptyString(seo.description) : undefined,
  };
};
