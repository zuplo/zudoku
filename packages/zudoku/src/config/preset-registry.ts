import { z } from "zod";

/**
 * Describes a curated plugin that `zudoku generate` can wire up from a
 * serializable config spec: which package and export provide the factory and
 * the schema of the options it accepts.
 *
 * The option schemas mirror the plugin's published options type. They are
 * defined here (instead of being imported from the plugin) because the CLI
 * cannot import plugin packages at runtime: their main modules rely on
 * build-time virtual modules and may ship as raw TypeScript source. Each
 * plugin package carries a type test asserting its registry entry stays in
 * sync (see e.g. `packages/plugin-graphql/src/preset-descriptor.test-d.ts`).
 */
export type PresetPluginDescriptor = {
  /** Stable identifier used in `plugins[].id` of a config spec. */
  id: string;
  /** Package the generated config imports the plugin factory from. */
  specifier: string;
  /** Named export of the plugin factory in that package. */
  export: string;
  /**
   * Schema of the factory's options argument. Wrap in `.optional()` when the
   * factory can be called without options.
   */
  optionsSchema: z.ZodType;
};

const GraphQLPluginOptionsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  showDeprecated: z.boolean().optional(),
  playground: z
    .object({
      enabled: z.boolean().optional(),
      endpoint: z.string().optional(),
      headers: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

const GraphQLConfigSchema = z.object({
  type: z.enum(["url", "file"]),
  input: z.string(),
  path: z.string(),
  options: GraphQLPluginOptionsSchema.optional(),
});

const MonetizationConfigSchema = z
  .object({
    pricing: z
      .object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
        units: z.record(z.string(), z.string()).optional(),
      })
      .optional(),
  })
  .optional();

/**
 * Curated plugins available to `zudoku generate`, keyed by their spec id.
 */
export const presetPlugins = {
  graphql: {
    id: "graphql",
    specifier: "@zudoku/plugin-graphql",
    export: "graphqlPlugin",
    optionsSchema: GraphQLConfigSchema,
  },
  monetization: {
    id: "monetization",
    specifier: "@zuplo/zudoku-plugin-monetization",
    export: "zuploMonetizationPlugin",
    optionsSchema: MonetizationConfigSchema,
  },
} as const satisfies Record<string, PresetPluginDescriptor>;

export type PresetPluginId = keyof typeof presetPlugins;

export const getPresetPlugin = (
  id: string,
): PresetPluginDescriptor | undefined =>
  Object.hasOwn(presetPlugins, id)
    ? presetPlugins[id as PresetPluginId]
    : undefined;
