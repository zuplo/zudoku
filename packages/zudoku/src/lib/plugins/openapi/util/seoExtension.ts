import type { RecordAny } from "../../../util/types.js";

/** Overrides a page's `<title>` and meta description. See the `x-zudoku-seo` docs. */
export const SEO_EXTENSION = "x-zudoku-seo";

export type SeoExtension = {
  title?: string;
  description?: string;
};

const nonEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

/**
 * Reads `x-zudoku-seo` off an object's extensions. `extensions` reaches the
 * client as untyped JSON, so anything other than a non-empty string is ignored
 * and the page falls back to its default title and description.
 */
export const readSeoExtension = (
  extensions: RecordAny | null | undefined,
): SeoExtension => {
  const seo: unknown = extensions?.[SEO_EXTENSION];
  if (typeof seo !== "object" || seo === null) return {};

  return {
    title: "title" in seo ? nonEmptyString(seo.title) : undefined,
    description:
      "description" in seo ? nonEmptyString(seo.description) : undefined,
  };
};
