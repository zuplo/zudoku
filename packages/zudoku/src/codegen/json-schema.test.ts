import { describe, expect, it } from "vitest";
import { buildSpecJsonSchema } from "./json-schema.js";
import { CONFIG_SPEC_SCHEMA_URL } from "./spec.js";

type JsonSchema = {
  $id?: string;
  additionalProperties?: boolean;
  properties?: Record<string, JsonSchema & Record<string, unknown>>;
  items?: JsonSchema & Record<string, unknown>;
  anyOf?: (JsonSchema & Record<string, unknown>)[];
  required?: string[];
  [key: string]: unknown;
};

const schema = buildSpecJsonSchema() as JsonSchema;
const properties = schema.properties ?? {};

describe("buildSpecJsonSchema", () => {
  it("is versioned via its $id", () => {
    expect(schema.$id).toBe(CONFIG_SPEC_SCHEMA_URL);
  });

  it("rejects unknown top-level keys", () => {
    expect(schema.additionalProperties).toBe(false);
  });

  it("contains serializable core config keys", () => {
    for (const key of ["$schema", "metadata", "apis", "navigation", "theme"]) {
      expect(properties, `expected key ${key}`).toHaveProperty(key);
    }
  });

  it("omits non-serializable top-level keys", () => {
    for (const key of [
      "slots",
      "UNSAFE_slotlets",
      "mdx",
      "customPages",
      "build",
      "extends",
      "__pluginDirs",
    ]) {
      expect(properties, `expected no key ${key}`).not.toHaveProperty(key);
    }
  });

  it("composes plugin refs as a union discriminated by id", () => {
    const variants = properties.plugins?.items?.anyOf;

    expect(variants).toHaveLength(2);
    const ids = variants?.map(
      (variant) => (variant.properties?.id as { const?: string }).const,
    );
    expect(ids).toEqual(["graphql", "monetization"]);

    const graphql = variants?.[0];
    expect(graphql?.required).toEqual(["id", "options"]);
    expect(graphql?.properties?.options?.properties).toHaveProperty("input");

    // Monetization options are optional
    expect(variants?.[1]?.required).toEqual(["id"]);
  });

  it("omits nested function and React fields", () => {
    const json = JSON.stringify(schema);

    // site.notFoundPage (ReactNode), apis options callbacks, apiKeys callbacks
    expect(properties.site?.properties).not.toHaveProperty("notFoundPage");
    expect(json).not.toContain("transformExamples");
    expect(json).not.toContain("generateCodeSnippet");
    expect(json).not.toContain("getConsumers");
    expect(json).not.toContain("filterItems");
    expect(json).not.toContain("transformResults");
  });

  it("keeps annotated custom fields as strings", () => {
    const banner = properties.site?.properties?.banner as JsonSchema;

    expect(banner.properties?.message).toMatchObject({ type: "string" });
    expect(banner.properties?.color).toMatchObject({ type: "string" });
  });

  it("keeps only the serializable variant of mixed unions", () => {
    // sitemap.exclude is `(() => Promise<string[]>) | string[]` - only the
    // array variant is serializable
    const exclude = properties.sitemap?.properties?.exclude as JsonSchema;

    expect(exclude.type).toBe("array");
    expect(exclude.anyOf).toBeUndefined();
  });

  it("has no empty schemas left from dropped custom fields", () => {
    // An empty object schema (`{}`) accepts anything - a leftover from an
    // unannotated `z.custom` that escaped omission.
    const findEmpty = (node: unknown, path: string): string[] => {
      if (Array.isArray(node)) {
        return node.flatMap((item, i) => findEmpty(item, `${path}[${i}]`));
      }
      if (node && typeof node === "object") {
        const entries = Object.entries(node);
        if (entries.length === 0) return [path];
        return entries.flatMap(([key, value]) =>
          // `default` etc. hold values, not schemas
          ["default", "examples", "const", "enum"].includes(key)
            ? []
            : findEmpty(value, `${path}.${key}`),
        );
      }
      return [];
    };

    expect(findEmpty(schema, "$")).toEqual([]);
  });
});
