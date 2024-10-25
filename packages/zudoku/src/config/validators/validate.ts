import type { Options } from "@mdx-js/rollup";
import type { ComponentType, ReactNode } from "react";
import type { DevPortalPlugin } from "src/lib/core/plugins.js";
import z, {
  type ZodEnumDef,
  ZodOptional,
  ZodString,
  ZodType,
  ZodUnion,
} from "zod";
import { fromError } from "zod-validation-error";
import type { ExposedComponentProps } from "../../lib/components/SlotletProvider.js";
import { DevPortalContext } from "../../lib/core/DevPortalContext.js";
import type { ApiKey } from "../../lib/plugins/api-keys/index.js";
import type { MdxComponentsType } from "../../lib/util/MdxComponents.js";
import { InputSidebarSchema } from "./InputSidebarSchema.js";

const ThemeSchema = z
  .object({
    background: z.string(),
    foreground: z.string(),
    card: z.string(),
    cardForeground: z.string(),
    popover: z.string(),
    popoverForeground: z.string(),
    primary: z.string(),
    primaryForeground: z.string(),
    secondary: z.string(),
    secondaryForeground: z.string(),
    muted: z.string(),
    mutedForeground: z.string(),
    accent: z.string(),
    accentForeground: z.string(),
    destructive: z.string(),
    destructiveForeground: z.string(),
    border: z.string(),
    input: z.string(),
    ring: z.string(),
    radius: z.string(),
  })
  .partial();

const ApiConfigSchema = z.object({
  server: z.string().optional(),
  navigationId: z.string().optional(),
});

const ApiSchema = z.union([
  z
    .object({ type: z.literal("url"), input: z.string() })
    .merge(ApiConfigSchema),
  z
    .object({ type: z.literal("file"), input: z.string() })
    .merge(ApiConfigSchema),
  z
    .object({ type: z.literal("raw"), input: z.string() })
    .merge(ApiConfigSchema),
]);

const ApiKeysSchema = z.union([
  z.object({
    enabled: z.boolean(),
    endpoint: z.string(),
  }),
  z.object({
    enabled: z.boolean(),
    getKeys: z.custom<(context: DevPortalContext) => Promise<ApiKey[]>>(
      (val) => typeof val === "function",
    ),
    rollKey: z
      .custom<
        (id: string, context: DevPortalContext) => Promise<void>
      >((val) => typeof val === "function")
      .optional(),
    deleteKey: z
      .custom<
        (id: string, context: DevPortalContext) => Promise<void>
      >((val) => typeof val === "function")
      .optional(),
    updateKeyDescription: z
      .custom<
        (
          apiKey: { id: string; description: string },
          context: DevPortalContext,
        ) => Promise<void>
      >((val) => typeof val === "function")
      .optional(),
    createKey: z
      .custom<
        (
          apiKey: { description: string; expiresOn?: string },
          context: DevPortalContext,
        ) => Promise<void>
      >((val) => typeof val === "function")
      .optional(),
  }),
]);

const LogoSchema = z.object({
  src: z.object({ light: z.string(), dark: z.string() }),
  alt: z.string().optional(),
  width: z.string().optional(),
});

const SiteMapSchema = z
  .object({
    /**
     * Base url of your website
     */
    siteUrl: z.string(),
    /**
     * Change frequency.
     * @default 'daily'
     */
    changefreq: z.optional(
      z.enum([
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
      ]),
    ),
    /**
     * Priority
     * @default 0.7
     */
    priority: z.optional(z.number()),
    outDir: z.string().optional(),
    /**
     * Add <lastmod/> property.
     * @default true
     */
    autoLastmod: z.boolean().optional(),
    /**
     * Array of relative paths to exclude from listing on sitemap.xml or sitemap-*.xml.
     * @example ['/page-0', '/page/example']
     */
    exclude: z
      .union([
        z.function().returns(z.promise(z.array(z.string()))),
        z.array(z.string()),
      ])
      .optional(),
  })
  .optional();

const DocsConfigSchema = z.object({
  files: z.string(),
  defaultOptions: z
    .object({
      toc: z.boolean(),
      disablePager: z.boolean(),
    })
    .partial()
    .optional(),
});

type BannerColorType = ZodOptional<
  ZodUnion<
    [
      ZodType<
        "note" | "tip" | "info" | "caution" | "danger" | (string & {}),
        ZodEnumDef
      >,
      ZodString,
    ]
  >
>;

const ConfigSchema = z
  .object({
    basePath: z.string().optional(),
    page: z
      .object({
        pageTitle: z.string(),
        logoUrl: z.string(),
        logo: LogoSchema,
        banner: z
          .object({
            message: z.custom<NonNullable<ReactNode>>(),
            color: z
              .enum(["note", "tip", "info", "caution", "danger"])
              .or(z.string())
              .optional() as BannerColorType,
            dismissible: z.boolean().optional(),
          })
          .optional(),
      })
      .partial(),
    topNavigation: z.array(
      z.object({
        label: z.string(),
        id: z.string(),
        default: z.string().optional(),
        display: z
          .enum(["auth", "anon", "always"])
          .default("always")
          .optional(),
      }),
    ),
    sidebar: z.record(InputSidebarSchema),
    // slotlets are a concept we are working on and not yet finalized
    UNSAFE_slotlets: z.record(
      z.string(),
      z.custom<ReactNode | ComponentType<ExposedComponentProps>>(),
    ),
    theme: z
      .object({
        light: ThemeSchema,
        dark: ThemeSchema,
      })
      .partial(),
    metadata: z
      .object({
        title: z.string(),
        description: z.string(),
        logo: z.string(),
        favicon: z.string(),
        generator: z.string(),
        applicationName: z.string(),
        referrer: z.string(),
        keywords: z.array(z.string()),
        authors: z.array(z.string()),
        creator: z.string(),
        publisher: z.string(),
      })
      .partial(),
    mdx: z
      .object({
        components: z.custom<MdxComponentsType>(),
      })
      .partial(),
    authentication: z.union([
      z.object({
        type: z.literal("clerk"),
        clerkPubKey: z.custom<`pk_test_${string}` | `pk_live_${string}`>(
          (val) =>
            typeof val === "string" ? /^pk_(test|live)_\w+$/.test(val) : false,
        ),
        redirectToAfterSignUp: z.string().optional(),
        redirectToAfterSignIn: z.string().optional(),
        redirectToAfterSignOut: z.string().optional(),
      }),
      z.object({
        type: z.literal("auth0"),
        clientId: z.string(),
        domain: z.string(),
        audience: z.string().optional(),
        redirectToAfterSignUp: z.string().optional(),
        redirectToAfterSignIn: z.string().optional(),
        redirectToAfterSignOut: z.string().optional(),
      }),
    ]),
    search: z.object({
      type: z.literal("inkeep"),
      apiKey: z.string(),
      integrationId: z.string(),
      organizationId: z.string(),
      primaryBrandColor: z.string(),
      organizationDisplayName: z.string(),
    }),
    docs: DocsConfigSchema,
    apis: z.union([ApiSchema, z.array(ApiSchema)]),
    apiKeys: ApiKeysSchema,
    redirects: z.array(z.object({ from: z.string(), to: z.string() })),
    customPages: z.array(
      z.object({
        path: z.string(),
        element: z.custom<NonNullable<ReactNode>>().optional(),
        render: z.custom<ComponentType<ExposedComponentProps>>().optional(),
        prose: z.boolean().optional(),
      }),
    ),
    plugins: z.array(z.custom<DevPortalPlugin>()),
    sitemap: SiteMapSchema,
    build: z.custom<{
      remarkPlugins?: Options["remarkPlugins"];
      rehypePlugins?: Options["rehypePlugins"];
    }>(),
  })
  .partial()
  .superRefine((config, ctx) => {
    // check if sidebar ids are found in top navigation
    if (!config.sidebar || !config.topNavigation) return;

    const topNavIds = config.topNavigation.map((item) => item.id);

    const nonExistentKeys = Object.keys(config.sidebar).filter(
      (key) => !topNavIds.includes(key),
    );

    if (nonExistentKeys.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Sidebar ID [${nonExistentKeys.map((v) => `"${v}"`).join(", ")}] not found in top navigation.
Following IDs are available: ${topNavIds.join(", ")}`,
      });
    }
  });

export type ZudokuApiConfig = z.infer<typeof ApiSchema>;
export type ZudokuConfig = z.infer<typeof ConfigSchema>;
export type ZudokuSiteMapConfig = z.infer<typeof SiteMapSchema>;
export type ZudokuDocsConfig = z.infer<typeof DocsConfigSchema>;

export function validateConfig(config: unknown) {
  const validationResult = ConfigSchema.safeParse(config);

  if (!validationResult.success) {
    // eslint-disable-next-line no-console
    console.log("Validation errors:");
    // eslint-disable-next-line no-console
    console.log(fromError(validationResult.error).toString());
  }
}
