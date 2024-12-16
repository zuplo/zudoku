import type { ReactNode } from "react";
import z, {
  RefinementCtx,
  type ZodEnumDef,
  ZodOptional,
  ZodString,
  ZodType,
  ZodUnion,
} from "zod";
import { fromError } from "zod-validation-error";
import { ZudokuContext } from "../../lib/core/ZudokuContext.js";
import type { ApiKey } from "../../lib/plugins/api-keys/index.js";
import { InputSidebarSchema } from "./InputSidebarSchema.js";

const AnyObject = z.object({}).passthrough();

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

const ApiCatalogCategorySchema = z.object({
  label: z.string(),
  tags: z.array(z.string()),
});

const ApiConfigSchema = z.object({
  id: z.string().optional(),
  server: z.string().optional(),
  navigationId: z.string().optional(),
  categories: z.array(ApiCatalogCategorySchema).optional(),
});

const ApiPostProcessorSchema = z
  .function()
  .args(AnyObject)
  .returns(z.union([AnyObject, z.promise(AnyObject)]));

const ApiSchema = z.union([
  z
    .object({ type: z.literal("url"), input: z.string() })
    .merge(ApiConfigSchema),
  z
    .object({ type: z.literal("file"), input: z.string() })
    .merge(ApiConfigSchema)
    .merge(
      z.object({ postProcessors: ApiPostProcessorSchema.array().optional() }),
    ),
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
    getKeys: z.custom<(context: ZudokuContext) => Promise<ApiKey[]>>(
      (val) => typeof val === "function",
    ),
    rollKey: z
      .custom<
        (id: string, context: ZudokuContext) => Promise<void>
      >((val) => typeof val === "function")
      .optional(),
    deleteKey: z
      .custom<
        (id: string, context: ZudokuContext) => Promise<void>
      >((val) => typeof val === "function")
      .optional(),
    updateKeyDescription: z
      .custom<
        (
          apiKey: { id: string; description: string },
          context: ZudokuContext,
        ) => Promise<void>
      >((val) => typeof val === "function")
      .optional(),
    createKey: z
      .custom<
        (
          apiKey: { description: string; expiresOn?: string },
          context: ZudokuContext,
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

const TopNavigationItemSchema = z.object({
  label: z.string(),
  id: z.string(),
  default: z.string().optional(),
  display: z.enum(["auth", "anon", "always"]).default("always").optional(),
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

const Redirect = z.object({
  from: z.string(),
  to: z.string(),
});

const SearchSchema = z
  .object({
    type: z.literal("inkeep"),
    apiKey: z.string(),
    integrationId: z.string(),
    organizationId: z.string(),
    primaryBrandColor: z.string(),
    organizationDisplayName: z.string(),
  })
  .optional();

const AuthenticationSchema = z.union([
  z.object({
    type: z.literal("clerk"),
    clerkPubKey: z.custom<`pk_test_${string}` | `pk_live_${string}`>((val) =>
      typeof val === "string" ? /^pk_(test|live)_\w+$/.test(val) : false,
    ),
    redirectToAfterSignUp: z.string().optional(),
    redirectToAfterSignIn: z.string().optional(),
    redirectToAfterSignOut: z.string().optional(),
  }),
  z.object({
    type: z.literal("openid"),
    clientId: z.string(),
    issuer: z.string(),
    audience: z.string().optional(),
    scopes: z.array(z.string()).optional(),
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
]);

const MetadataSchema = z
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
  .partial();

const PageSchema = z
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
  .partial();

const ApiCatalogSchema = z.object({
  navigationId: z.string(),
  label: z.string(),
  items: z.array(z.string()).optional(),
});

/**
 * These are the config settings that are available in all configuration
 * formats.
 */
export const CommonConfigSchema = z.object({
  basePath: z.string().optional(),
  page: PageSchema,
  topNavigation: z.array(TopNavigationItemSchema),
  sidebar: z.record(InputSidebarSchema),
  theme: z
    .object({
      light: ThemeSchema,
      dark: ThemeSchema,
    })
    .partial(),
  metadata: MetadataSchema,
  authentication: AuthenticationSchema,
  search: SearchSchema,
  docs: z.union([DocsConfigSchema, z.array(DocsConfigSchema)]),
  apis: z.union([ApiSchema, z.array(ApiSchema)]),
  catalog: z.union([ApiCatalogSchema, z.array(ApiCatalogSchema)]),
  apiKeys: ApiKeysSchema,
  redirects: z.array(Redirect),
  sitemap: SiteMapSchema,
});

export const refine = (
  config: z.output<typeof CommonConfigSchemaPartial>,
  ctx: RefinementCtx,
) => {
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
};

const CommonConfigSchemaPartial = CommonConfigSchema.partial();
export const CommonConfig = CommonConfigSchemaPartial.superRefine(refine);

export type ZudokuApiConfig = z.infer<typeof ApiSchema>;
export type ZudokuSiteMapConfig = z.infer<typeof SiteMapSchema>;
export type ZudokuDocsConfig = z.infer<typeof DocsConfigSchema>;
export type TopNavigationItem = z.infer<typeof TopNavigationItemSchema>;
export type ZudokuRedirect = z.infer<typeof Redirect>;

/**
 * Type for the dev-portal.json file
 */
export type CommonConfig = z.infer<typeof CommonConfig>;

export function validateCommonConfig(config: unknown) {
  const validationResult = CommonConfig.safeParse(config);

  if (!validationResult.success) {
    // eslint-disable-next-line no-console
    console.log("Validation errors:");
    // eslint-disable-next-line no-console
    console.log(fromError(validationResult.error).toString());
  }
}
