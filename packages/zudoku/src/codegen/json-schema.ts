// biome-ignore-all lint/suspicious/noExplicitAny: zod schema introspection
import { z } from "zod";
import { presetPlugins } from "../config/preset-registry.js";
import {
  CONFIG_SPEC_SCHEMA_URL,
  CONFIG_SPEC_VERSION,
  CoreConfigSpecSchema,
} from "./spec.js";

const WRAPPER_TYPES = new Set([
  "optional",
  "nullable",
  "default",
  "prefault",
  "readonly",
  "nonoptional",
  "catch",
]);

const unwrapSchema = (schema: any): any => {
  let current = schema;
  while (true) {
    const def = current._zod.def;
    if (WRAPPER_TYPES.has(def.type) && def.innerType) {
      current = def.innerType;
    } else if (def.type === "pipe") {
      // The spec schema is rendered with `io: "input"`, so the input side of
      // a pipe (e.g. a schema followed by a `z.transform`) is what counts.
      current = def.in;
    } else {
      return current;
    }
  }
};

// Fields without a JSON representation are omitted from the emitted schema:
// `z.custom` (functions, React nodes) and `z.any`/`z.unknown`, including
// records and arrays of them — unless they carry explicit `meta` (e.g.
// `{ type: "string" }`), which marks them as serializable and is merged into
// the output by `z.toJSONSchema`.
const isOmittedSchema = (schema: any): boolean => {
  if (z.globalRegistry.get(schema)) return false;

  const inner = unwrapSchema(schema);
  if (z.globalRegistry.get(inner)) return false;

  const def = inner._zod.def;
  if (["custom", "any", "unknown"].includes(def.type)) return true;
  if (def.type === "record") return isOmittedSchema(def.valueType);
  if (def.type === "array") return isOmittedSchema(def.element);

  return false;
};

const omitCustomFields = (ctx: { zodSchema: any; jsonSchema: any }) => {
  const def = ctx.zodSchema._zod.def;

  if (def.type === "object") {
    const omitted = Object.entries(def.shape ?? {})
      .filter(([, property]) => isOmittedSchema(property))
      .map(([key]) => key);
    if (omitted.length === 0) return;

    for (const key of omitted) {
      delete ctx.jsonSchema.properties?.[key];
    }
    if (Array.isArray(ctx.jsonSchema.required)) {
      const required = ctx.jsonSchema.required.filter(
        (key: string) => !omitted.includes(key),
      );
      if (required.length > 0) {
        ctx.jsonSchema.required = required;
      } else {
        delete ctx.jsonSchema.required;
      }
    }
    return;
  }

  if (def.type === "union") {
    const key = Array.isArray(ctx.jsonSchema.anyOf) ? "anyOf" : "oneOf";
    const variants = ctx.jsonSchema[key];
    if (!Array.isArray(variants) || variants.length !== def.options.length) {
      return;
    }

    const kept = variants.filter(
      (_: unknown, index: number) => !isOmittedSchema(def.options[index]),
    );
    if (kept.length === variants.length || kept.length === 0) return;

    if (kept.length === 1 && typeof kept[0] === "object") {
      delete ctx.jsonSchema[key];
      Object.assign(ctx.jsonSchema, kept[0]);
    } else {
      ctx.jsonSchema[key] = kept;
    }
  }
};

// `z.looseObject` renders `additionalProperties: {}`; emit the equivalent
// `true` so empty-object schemas always signal a leak (see tests).
const normalizeLooseObjects = (node: unknown) => {
  if (Array.isArray(node)) {
    node.forEach(normalizeLooseObjects);
  } else if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;
    if (
      record.additionalProperties &&
      typeof record.additionalProperties === "object" &&
      Object.keys(record.additionalProperties).length === 0
    ) {
      record.additionalProperties = true;
    }
    Object.values(record).forEach(normalizeLooseObjects);
  }
};

// Removing custom fields can leave `$defs` entries that nothing references
// anymore; prune them so the published schema stays free of dead weight.
const pruneUnusedDefs = (schema: Record<string, any>) => {
  const defs = schema.$defs;
  if (!defs) return schema;

  const referenced = new Set<string>();
  const collect = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(collect);
    } else if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        if (key === "$ref" && typeof value === "string") {
          const name = value.match(/^#\/\$defs\/(.+)$/)?.[1];
          if (name && !referenced.has(name)) {
            referenced.add(name);
            collect(defs[name]);
          }
        } else {
          collect(value);
        }
      }
    }
  };
  collect({ ...schema, $defs: undefined });

  for (const name of Object.keys(defs)) {
    if (!referenced.has(name)) delete defs[name];
  }
  if (Object.keys(defs).length === 0) {
    delete schema.$defs;
  }

  return schema;
};

const buildPluginRefUnion = () => {
  const variants = Object.values(presetPlugins).map((descriptor) =>
    z.object({
      id: z.literal(descriptor.id),
      options: descriptor.optionsSchema,
    }),
  );

  return z.union(variants);
};

/**
 * Builds the publishable JSON Schema for the Zudoku config spec: all
 * serializable config keys composed with the preset plugins' option schemas
 * (discriminated by `id`). This is the contract UIs validate against before
 * handing a spec to `zudoku generate`.
 */
export const buildSpecJsonSchema = (): Record<string, unknown> => {
  const specSchema = z.strictObject({
    ...CoreConfigSpecSchema.shape,
    $schema: z.string().optional(),
    plugins: z.array(buildPluginRefUnion()).optional(),
  });

  const jsonSchema = z.toJSONSchema(specSchema, {
    target: "draft-2020-12",
    io: "input",
    unrepresentable: "any",
    reused: "ref",
    override: omitCustomFields,
  });

  normalizeLooseObjects(jsonSchema);

  return pruneUnusedDefs({
    ...jsonSchema,
    $id: CONFIG_SPEC_SCHEMA_URL,
    title: `Zudoku config spec (v${CONFIG_SPEC_VERSION})`,
  });
};
