import { compile } from "json-schema-to-typescript-lite";
import fs from "node:fs/promises";
import path from "node:path";
import { bundledLanguages } from "shiki/langs";
import { bundledThemes } from "shiki/themes";
import { z } from "zod";
import { ZudokuConfig } from "../src/config/validators/validate.js";

const fileExists = (path: string) =>
  fs
    .stat(path)
    .then(() => true)
    .catch(() => false);

const schemaPathMap = createSchemaPathMap(ZudokuConfig);

const schema = z.toJSONSchema(ZudokuConfig, {
  target: "draft-2020-12",
  unrepresentable: "any",
  io: "input",
  reused: "ref",
  override(ctx) {
    const currentPath = schemaPathMap.get(ctx.zodSchema);

    // For some autocompletion in the flat config
    if (currentPath === "syntaxHighlighting.languages.items") {
      ctx.jsonSchema.enum = Object.keys(bundledLanguages);
    } else if (
      currentPath === "syntaxHighlighting.themes.light" ||
      currentPath === "syntaxHighlighting.themes.dark"
    ) {
      ctx.jsonSchema.enum = Object.keys(bundledThemes);
    }
  },
});

const code = await compile(schema as any, "FlatZudokuConfig", {
  additionalProperties: false,
});

const dist = path.resolve(import.meta.dirname, "../dist");

if (!(await fileExists(dist))) {
  await fs.mkdir(dist, { recursive: true });
}

const outputPath = path.resolve(dist, "flat-config.d.ts");
await fs.writeFile(outputPath, code);

///
function createSchemaPathMap(
  schema: any,
  path: string[] = [],
): WeakMap<any, string> {
  const pathMap = new WeakMap();

  function traverse(schema: any, path: string[] = []) {
    pathMap.set(schema, path.join("."));

    const def = schema._zod.def;
    if (def.type === "object" && def.shape) {
      Object.entries(def.shape).forEach(([key, subSchema]) => {
        traverse(subSchema, [...path, key]);
      });
    } else if (def?.type === "array" && def.element) {
      traverse(def.element, [...path, "items"]);
    } else if (def?.innerType) {
      traverse(def.innerType, path);
    }
  }

  traverse(schema, path);
  return pathMap;
}
