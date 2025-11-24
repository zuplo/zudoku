import type { SchemaImports } from "../../oas/graphql/index.js";
import type { ContextOasSource } from "./interfaces.js";

export type SpecExtension = "json" | "yaml";

type SpecificationResult = {
  content: string;
  extension: SpecExtension;
  info?: { title?: string | null; version?: string | null };
};

// Normalizes the result of a dynamic import/require so callers always get the
// actual schema object regardless of whether it lives under `schema`,
// `default`, or the module itself.
const getSchemaFromModule = (loaded: unknown) => {
  if (!loaded || typeof loaded !== "object") {
    return undefined;
  }

  if ("schema" in loaded && loaded.schema) {
    return (loaded as { schema: unknown }).schema;
  }

  if ("default" in loaded && loaded.default) {
    const def = (loaded as { default: unknown }).default;
    if (def && typeof def === "object") {
      if ("schema" in def && (def as { schema?: unknown }).schema) {
        return (def as { schema?: unknown }).schema;
      }
      return def;
    }
  }
};

// Loads a schema from a file-based source. The input can be a function that
// returns a module, or a string pointing to a registered schema import key.
// Both variants eventually resolve to the same schema object via
// getSchemaFromModule.
const resolveFileSourceSchema = async (
  input: ContextOasSource["input"],
  schemaImports?: SchemaImports,
) => {
  if (typeof input === "function") {
    const loaded = await input();
    const schema = getSchemaFromModule(loaded);
    if (!schema) {
      throw new Error("Unable to load schema from file source");
    }
    return schema;
  }

  if (typeof input === "string") {
    const loader = schemaImports?.[input];
    if (!loader) {
      throw new Error("No schema loader configured for file source");
    }

    const loaded = await loader();
    const schema = getSchemaFromModule(loaded);
    if (!schema) {
      throw new Error("Unable to load schema from file source");
    }
    return schema;
  }

  throw new Error("Unsupported file input configuration");
};

const detectExtensionFromContent = (content: string): SpecExtension => {
  return content.trimStart().startsWith("{") ? "json" : "yaml";
};

// Turns an arbitrary schema (which can contain circular references because of
// `$ref` links) into a JSON string while preserving reference information. The
// replacer strips out our internal `__$ref` helpers and rehydrates them as
// `$ref` values so tooling understands the output.
const stringifySchema = (schema: unknown) => {
  if (typeof schema === "string") {
    return schema;
  }

  const visited = new WeakSet<object>();

  const replacer = (_key: string, value: unknown) => {
    if (typeof value === "object" && value !== null) {
      if (visited.has(value as object)) {
        const ref =
          value &&
          typeof value === "object" &&
          (value as { __$ref?: unknown }).__$ref;
        if (typeof ref === "string") {
          return { $ref: ref };
        }
        return undefined;
      }

      visited.add(value as object);

      if ("__$ref" in (value as Record<string, unknown>)) {
        const { __$ref, ...rest } = value as Record<string, unknown>;
        return {
          ...rest,
          ...(typeof __$ref === "string" ? { $ref: __$ref } : {}),
        };
      }
    }

    return value;
  };

  return JSON.stringify(schema, replacer, 2);
};

// The main entry point that reads the configured OpenAPI source (URL/raw/file)
// and returns a normalized object with the serialized schema, its extension and
// any metadata we can infer.
export const loadSpecification = async ({
  source,
  schemaImports,
}: {
  source: ContextOasSource;
  schemaImports?: SchemaImports;
}): Promise<SpecificationResult> => {
  if (source.type === "url") {
    const urlStr = source.input;
    const response = await fetch(urlStr, { cache: "force-cache" });
    const text = await response.text();
    const extension = detectExtensionFromContent(text);

    return {
      content: text,
      extension: extension,
    };
  }

  if (source.type === "raw") {
    const extension = detectExtensionFromContent(source.input);

    return {
      content: source.input,
      extension,
    };
  }

  if (source.type === "file") {
    const schemaDefinition = await resolveFileSourceSchema(
      source.input,
      schemaImports,
    );
    const content = stringifySchema(schemaDefinition);

    return {
      content,
      extension: "json",
    };
  }

  throw new Error("Unsupported schema source type");
};
