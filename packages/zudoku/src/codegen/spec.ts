import { z } from "zod";
import { getPresetPlugin, presetPlugins } from "../config/preset-registry.js";
import { ZudokuConfig } from "../config/validators/ZudokuConfig.js";

export const CONFIG_SPEC_VERSION = 1;

const CONFIG_SPEC_SCHEMA_URL_BASE = "https://schemas.zudoku.dev/config-spec";

export const CONFIG_SPEC_SCHEMA_URL = `${CONFIG_SPEC_SCHEMA_URL_BASE}/v${CONFIG_SPEC_VERSION}.json`;

const SCHEMA_URL_PATTERN = new RegExp(
  `^${CONFIG_SPEC_SCHEMA_URL_BASE}/v(\\d+)\\.json$`,
);

/**
 * Extracts the spec version encoded in a `$schema` URL
 * (`https://schemas.zudoku.dev/config-spec/v1.json` -> `1`).
 */
export const parseSpecSchemaVersion = (url: string): number | undefined => {
  const match = url.match(SCHEMA_URL_PATTERN);
  return match ? Number(match[1]) : undefined;
};

/**
 * Keys of `ZudokuConfig` that hold code (functions, React elements, plugin
 * instances) and therefore can't appear in a serializable config spec.
 * `plugins` is replaced by `{ id, options }` refs into the preset registry.
 */
const NON_SERIALIZABLE_CONFIG_KEYS = {
  extends: true,
  slots: true,
  UNSAFE_slotlets: true,
  mdx: true,
  customPages: true,
  build: true,
  plugins: true,
  __pluginDirs: true,
} as const;

export const SpecPluginRefSchema = z.object({
  id: z.string().min(1),
  options: z.unknown().optional(),
});

export type SpecPluginRef = z.infer<typeof SpecPluginRefSchema>;

/** The serializable core config keys shared by spec validation and the published JSON Schema. */
export const CoreConfigSpecSchema = ZudokuConfig.omit(
  NON_SERIALIZABLE_CONFIG_KEYS,
);

/**
 * The serializable projection of `ZudokuConfig` that `zudoku generate`
 * accepts. Strict at the top level so typos fail loudly; plugin options are
 * validated separately against each preset plugin's `optionsSchema`.
 */
export const ConfigSpecSchema = z.strictObject({
  ...CoreConfigSpecSchema.shape,
  $schema: z.string().optional(),
  plugins: z.array(SpecPluginRefSchema).optional(),
});

export type ConfigSpec = z.input<typeof ConfigSpecSchema>;

const formatError = (error: z.ZodError) => z.prettifyError(error);

/**
 * Validates a parsed spec document. Returns the raw spec (typed) on success;
 * throws with a readable message on any violation. The raw input is returned
 * rather than the parse output so the generator emits exactly what was
 * authored (no schema defaults or transforms baked in).
 */
export const validateSpec = (spec: unknown): ConfigSpec => {
  if (typeof spec !== "object" || spec === null || Array.isArray(spec)) {
    throw new Error("Config spec must be a JSON object.");
  }

  const { $schema } = spec as { $schema?: unknown };
  if ($schema !== undefined) {
    if (typeof $schema !== "string") {
      throw new Error("Config spec $schema must be a string.");
    }
    const version = parseSpecSchemaVersion($schema);
    if (version === undefined) {
      throw new Error(
        `Unknown config spec $schema "${$schema}". Expected ${CONFIG_SPEC_SCHEMA_URL}.`,
      );
    }
    if (version !== CONFIG_SPEC_VERSION) {
      throw new Error(
        `Unsupported config spec version v${version}. This version of Zudoku supports v${CONFIG_SPEC_VERSION} (${CONFIG_SPEC_SCHEMA_URL}).`,
      );
    }
  }

  const result = ConfigSpecSchema.safeParse(spec);
  if (!result.success) {
    throw new Error(`Invalid config spec:\n${formatError(result.error)}`);
  }

  for (const ref of result.data.plugins ?? []) {
    const descriptor = getPresetPlugin(ref.id);
    if (!descriptor) {
      throw new Error(
        `Unknown plugin id "${ref.id}". Available plugins: ${Object.keys(presetPlugins).join(", ")}.`,
      );
    }

    const options = descriptor.optionsSchema.safeParse(ref.options);
    if (!options.success) {
      throw new Error(
        `Invalid options for plugin "${ref.id}":\n${formatError(options.error)}`,
      );
    }
  }

  return spec as ConfigSpec;
};
