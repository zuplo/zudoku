import { z } from "zod";
import { InputNavigationSchema } from "../validators/InputNavigationSchema.js";
import {
  ApiCatalogCategorySchema,
  ApiOptionsSchema,
  AuthenticationSchema,
  DocsConfigSchema,
  FooterSocialIcons,
  LogoSchema,
  MetadataSchema,
  ThemeConfigSchema,
  VersionConfigSchema,
} from "../validators/ZudokuConfig.js";

/**
 * The spec (`spec.json`) is the serializable description of a Zudoku site
 * that `zudoku generate` compiles into a typed base config layer
 * (`zudoku.base.ts`). It is the contract between config-producing tools (e.g.
 * the Zuplo portal UI) and Zudoku: everything in it must be plain JSON, so
 * plugins are referenced by name and turned into real imports by the
 * generator.
 *
 * The published JSON Schema (`getSpecJsonSchema`) derives from this same Zod
 * schema, keeping the form, the spec and the generated output in sync.
 */

// Plugin options must mirror the plugin's own config type since the generator
// passes them through verbatim (see `GraphQLConfig` in @zudoku/plugin-graphql).
const GraphQLPluginOptionsSchema = z.object({
  type: z.enum(["url", "file"]),
  input: z.string(),
  path: z.string(),
  options: z
    .object({
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
    })
    .optional(),
});

const SpecPluginSchema = z.discriminatedUnion("name", [
  z.object({
    name: z.literal("graphql"),
    options: GraphQLPluginOptionsSchema,
  }),
]);

// `ApiOptionsSchema` minus the function-valued options
const SpecApiOptionsSchema = ApiOptionsSchema.omit({
  transformExamples: true,
  generateCodeSnippet: true,
});

const SpecApiConfigSchema = z
  .object({
    server: z.string(),
    path: z.string(),
    categories: z.array(ApiCatalogCategorySchema),
    options: SpecApiOptionsSchema,
  })
  .partial();

const SpecApiSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("url"),
    input: z.union([z.string(), z.array(VersionConfigSchema)]),
    ...SpecApiConfigSchema.shape,
  }),
  z.object({
    type: z.literal("file"),
    input: z.union([
      z.string(),
      z.array(z.union([z.string(), VersionConfigSchema])),
    ]),
    ...SpecApiConfigSchema.shape,
  }),
]);

// `SiteSchema` reduced to its serializable options (banner messages are plain
// strings here, footer icons are limited to the named presets)
const SpecSiteSchema = z
  .object({
    title: z.string(),
    dir: z.enum(["ltr", "rtl"]),
    logo: LogoSchema,
    showPoweredBy: z.boolean(),
    sidebar: z
      .object({
        collapsible: z.boolean().optional(),
        toggleVisibility: z.enum(["always", "hover"]).optional(),
        togglePosition: z.enum(["top", "center", "bottom"]).optional(),
      })
      .optional(),
    banner: z.object({
      message: z.string(),
      color: z.string().optional(),
      dismissible: z.boolean().optional(),
    }),
    footer: z
      .object({
        columns: z
          .array(
            z.object({
              position: z.enum(["start", "center", "end"]).optional(),
              title: z.string(),
              links: z.array(z.object({ label: z.string(), href: z.string() })),
            }),
          )
          .optional(),
        social: z
          .array(
            z.object({
              label: z.string().optional(),
              href: z.string(),
              icon: z.enum(FooterSocialIcons).optional(),
            }),
          )
          .optional(),
        copyright: z.string().optional(),
        logo: LogoSchema.optional(),
        position: z.enum(["start", "center", "end"]).optional(),
      })
      .optional(),
  })
  .partial();

export const SpecSchema = z
  .object({
    $schema: z.string(),
    site: SpecSiteSchema,
    metadata: MetadataSchema,
    theme: ThemeConfigSchema,
    navigation: InputNavigationSchema,
    basePath: z.string(),
    canonicalUrlOrigin: z.string(),
    redirects: z.array(z.object({ from: z.string(), to: z.string() })),
    docs: DocsConfigSchema,
    apis: z.union([SpecApiSchema, z.array(SpecApiSchema)]),
    authentication: AuthenticationSchema,
    apiKeys: z.object({ enabled: z.boolean() }),
    enableStatusPages: z.boolean(),
    plugins: z.array(SpecPluginSchema),
  })
  .partial();

export type ZudokuSpec = z.input<typeof SpecSchema>;
export type ZudokuSpecPlugin = NonNullable<ZudokuSpec["plugins"]>[number];
export type ZudokuSpecApi = z.infer<typeof SpecApiSchema>;

export const validateSpec = (spec: unknown, specPath?: string): ZudokuSpec => {
  const result = SpecSchema.safeParse(spec);
  if (!result.success) {
    const location = specPath ? ` at ${specPath}` : "";
    throw new Error(
      `Invalid Zudoku spec${location}:\n${z.prettifyError(result.error)}`,
    );
  }
  // Return the input shape (not the parsed output) so the generated config
  // only contains what the spec author wrote, without defaults materialized.
  return spec as ZudokuSpec;
};

export const getSpecJsonSchema = () =>
  z.toJSONSchema(SpecSchema, { io: "input", unrepresentable: "any" });
