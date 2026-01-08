import type { Options } from "@mdx-js/rollup";
import colors from "picocolors";
import type { ComponentType, ReactNode } from "react";
import { isValidElement } from "react";
import type { BundledLanguage, BundledTheme } from "shiki";
import { z } from "zod";
import type { UseAuthReturn } from "../../lib/authentication/hook.js";
import type { AuthState } from "../../lib/authentication/state.js";
import type { SlotType } from "../../lib/components/context/SlotProvider.js";
import type { ZudokuPlugin } from "../../lib/core/plugins.js";
import type { ZudokuContext } from "../../lib/core/ZudokuContext.js";
import type { FilterCatalogItemsFn } from "../../lib/plugins/api-catalog/index.js";
import type { ApiConsumer } from "../../lib/plugins/api-keys/index.js";
import type {
  GenerateCodeSnippetFn,
  TransformExamplesFn,
} from "../../lib/plugins/openapi/interfaces.js";
import type { PagefindSearchFragment } from "../../lib/plugins/search-pagefind/types.js";
import type { MdxComponentsType } from "../../lib/util/MdxComponents.js";
import type { ExposedComponentProps } from "../../lib/util/useExposedProps.js";
import { GOOGLE_FONTS } from "../../vite/plugin-theme.js";
import { InputNavigationSchema } from "./InputNavigationSchema.js";
import { ProtectedRoutesSchema } from "./ProtectedRoutesSchema.js";

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

const LanguageOption = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const ApiOptionsSchema = z
  .object({
    examplesLanguage: z.string(),
    supportedLanguages: z.array(LanguageOption),
    disablePlayground: z.boolean(),
    disableSidecar: z.boolean(),
    showVersionSelect: z.enum(["always", "if-available", "hide"]),
    expandAllTags: z.boolean(),
    expandApiInformation: z.boolean(),
    schemaDownload: z.object({ enabled: z.boolean() }).partial(),
    transformExamples: z.custom<TransformExamplesFn>(
      (val) => typeof val === "function",
    ),
    generateCodeSnippet: z.custom<GenerateCodeSnippetFn>(
      (val) => typeof val === "function",
    ),
  })
  .partial();

const ApiConfigSchema = z
  .object({
    server: z.string(),
    path: z.string(),
    categories: z.array(ApiCatalogCategorySchema),
    options: ApiOptionsSchema,
  })
  .partial();

const UrlVersionConfigSchema = z.object({
  path: z.string(),
  input: z.string(),
  label: z.string().optional(),
});

const ApiSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("url"),
    input: z.union([z.string(), z.array(UrlVersionConfigSchema)]),
    ...ApiConfigSchema.shape,
  }),
  z.object({
    type: z.literal("file"),
    input: z.union([z.string(), z.array(z.string())]),
    ...ApiConfigSchema.shape,
  }),
  z.object({
    type: z.literal("raw"),
    input: z.string(),
    ...ApiConfigSchema.shape,
  }),
]);

const ApiKeysSchema = z.object({
  enabled: z.boolean(),
  getConsumers: z
    .custom<(context: ZudokuContext) => Promise<ApiConsumer[]>>(
      (val) => typeof val === "function",
    )
    .optional(),
  rollKey: z
    .custom<(id: string, context: ZudokuContext) => Promise<void>>(
      (val) => typeof val === "function",
    )
    .optional(),
  deleteKey: z
    .custom<
      (
        consumerId: string,
        keyId: string,
        context: ZudokuContext,
      ) => Promise<void>
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
      ({
        apiKey,
        context,
        auth,
      }: {
        apiKey: { description: string; expiresOn?: string };
        context: ZudokuContext;
        auth: UseAuthReturn;
      }) => Promise<void>
    >((val) => typeof val === "function")
    .optional(),
});

export type ApiKeysOptions = z.infer<typeof ApiKeysSchema>;

const LogoSchema = z.object({
  src: z.object({ light: z.string(), dark: z.string() }),
  alt: z.string().optional(),
  width: z.string().or(z.number()).optional(),
  href: z.string().optional(),
});

export const FooterSocialIcons = [
  "reddit",
  "discord",
  "github",
  "x",
  "linkedin",
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "twitch",
  "pinterest",
  "snapchat",
  "whatsapp",
  "telegram",
] as const;

export const FooterSocialSchema = z.object({
  label: z.string().optional(),
  href: z.string(),
  icon: z
    .union([
      z.enum(FooterSocialIcons),
      z.custom<ReactNode>((val) => isValidElement(val)),
    ])
    .optional(),
});

export const FooterSchema = z
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
    social: z.array(FooterSocialSchema).optional(),
    copyright: z.string().optional(),
    logo: LogoSchema.optional(),
    position: z.enum(["start", "center", "end"]).optional(),
  })
  .optional();

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
        z.custom<() => Promise<string[]>>((val) => typeof val === "function"),
        z.array(z.string()),
      ])
      .optional(),
  })
  .optional();

const DEFAULT_DOCS_FILES = "/pages/**/*.{md,mdx}";

const LlmsConfigSchema = z
  .object({
    llmsTxt: z
      .boolean()
      .default(false)
      .describe(
        "When enabled, generates an llms.txt file following the spec at https://llmstxt.org/. This file provides a summary with links to all documentation.",
      ),
    llmsTxtFull: z
      .boolean()
      .default(false)
      .describe(
        "When enabled, generates an llms-full.txt file with the complete content of all markdown documents for LLM consumption.",
      ),
    includeProtected: z
      .boolean()
      .default(false)
      .describe(
        "When enabled, includes content from protected routes in the generated .md files and llms.txt files. By default, protected routes are excluded.",
      ),
  })
  .partial();

export const DocsConfigSchema = z.object({
  files: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (typeof val === "string" ? [val] : val))
    .default([DEFAULT_DOCS_FILES]),
  publishMarkdown: z
    .boolean()
    .default(false)
    .describe(
      "When enabled, generates .md files for each document during build. Access documents at their URL path with .md extension (e.g., /foo/hello.md). Markdown files are generated without frontmatter.",
    ),
  defaultOptions: z
    .object({
      toc: z.boolean(),
      copyPage: z.boolean().optional(),
      disablePager: z.boolean(),
      showLastModified: z.boolean(),
      suggestEdit: z
        .object({
          url: z.string(),
          text: z.string().optional(),
        })
        .optional(),
    })
    .partial()
    .optional(),
  llms: LlmsConfigSchema.optional(),
});

const Redirect = z.object({
  from: z.string(),
  to: z.string(),
});

const SearchSchema = z
  .discriminatedUnion("type", [
    // looseObject to allow additional properties so the
    // user can set other inkeep settings
    z.looseObject({
      type: z.literal("inkeep"),
      apiKey: z.string(),
      integrationId: z.string(),
      organizationId: z.string(),
      primaryBrandColor: z.string(),
      organizationDisplayName: z.string(),
    }),
    z.object({
      type: z.literal("pagefind"),

      ranking: z
        .object({
          termFrequency: z.number(),
          pageLength: z.number(),
          termSimilarity: z.number(),
          termSaturation: z.number(),
        })
        .optional(),
      maxResults: z.number().optional(),
      maxSubResults: z.number().optional(),
      transformResults: z
        .custom<
          (data: {
            result: PagefindSearchFragment;
            auth: AuthState;
            context: ZudokuContext;
          }) => PagefindSearchFragment | boolean | undefined | void
        >((val) => typeof val === "function")
        .optional(),
    }),
  ])
  .optional();

const AuthenticationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("clerk"),
    clerkPubKey: z
      .custom<`pk_test_${string}` | `pk_live_${string}`>()
      .refine((val) => /^pk_(test|live)_\w+$/.test(val), {
        message: "Clerk public key invalid, must start with pk_test or pk_live",
      }),
    jwtTemplateName: z.string().optional().default("dev-portal"),
    redirectToAfterSignUp: z.string().optional(),
    redirectToAfterSignIn: z.string().optional(),
    redirectToAfterSignOut: z.string().optional(),
  }),
  z.object({
    type: z.literal("firebase"),
    apiKey: z.string(),
    authDomain: z.string(),
    projectId: z.string(),
    storageBucket: z.string().optional(),
    messagingSenderId: z.string().optional(),
    appId: z.string(),
    measurementId: z.string().optional(),
    providers: z
      .array(
        z.enum([
          "google",
          "facebook",
          "twitter",
          "github",
          "microsoft",
          "apple",
          "yahoo",
          "password",
          "phone",
        ]),
      )
      .optional(),
    redirectToAfterSignUp: z.string().optional(),
    redirectToAfterSignIn: z.string().optional(),
    redirectToAfterSignOut: z.string().optional(),
  }),
  z.object({
    type: z.literal("openid"),
    basePath: z.string().optional(),
    clientId: z.string(),
    issuer: z.string(),
    audience: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    redirectToAfterSignUp: z.string().optional(),
    redirectToAfterSignIn: z.string().optional(),
    redirectToAfterSignOut: z.string().optional(),
  }),
  z.object({
    type: z.literal("azureb2c"),
    basePath: z.string().optional(),
    clientId: z.string(),
    tenantName: z.string(),
    policyName: z.string(),
    scopes: z.array(z.string()).optional(),
    issuer: z.string(),
    redirectToAfterSignUp: z.string().optional(),
    redirectToAfterSignIn: z.string().optional(),
    redirectToAfterSignOut: z.string().optional(),
  }),

  z.object({
    type: z.literal("auth0"),
    clientId: z.string(),
    domain: z.string().refine(
      (val) => {
        if (val.startsWith("http://") || val.startsWith("https://")) {
          return false;
        }
        if (val.includes("/")) {
          return false;
        }
        return val.includes(".") && val.length > 0;
      },
      {
        message:
          "Domain must be a host only (e.g., 'example.com') without protocol or slashes",
      },
    ),
    audience: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    redirectToAfterSignUp: z.string().optional(),
    redirectToAfterSignIn: z.string().optional(),
    redirectToAfterSignOut: z.string().optional(),
    options: z
      .object({
        alwaysPromptLogin: z.boolean().optional(),
        prompt: z.string().optional(),
      })
      .optional(),
  }),
  z.object({
    type: z.literal("supabase"),
    basePath: z.string().optional(),
    supabaseUrl: z.string(),
    supabaseKey: z.string(),
    provider: z.string().optional(),
    providers: z.array(z.string()).optional(),
    onlyThirdPartyProviders: z.boolean().optional(),
    redirectToAfterSignUp: z.string().optional(),
    redirectToAfterSignIn: z.string().optional(),
    redirectToAfterSignOut: z.string().optional(),
  }),
]);

const MetadataSchema = z
  .object({
    title: z.string(),
    defaultTitle: z.string().optional(),
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

const FontConfigSchema = z.union([
  z.enum(GOOGLE_FONTS),
  z.object({
    url: z.string(),
    fontFamily: z.string().optional(),
  }),
]);

export type FontConfig = z.infer<typeof FontConfigSchema>;

const FontsConfigSchema = z.object({
  sans: FontConfigSchema.optional(),
  serif: FontConfigSchema.optional(),
  mono: FontConfigSchema.optional(),
});

const CssObject = z.record(
  z.string(),
  z.lazy(() =>
    z.union([
      z.string(),
      z.record(
        z.string(),
        z.union([z.string(), z.record(z.string(), z.string())]),
      ),
    ]),
  ),
);

const ThemeConfigSchema = z.object({
  registryUrl: z.string().url().optional(),
  customCss: z.union([z.string(), CssObject]).optional(),
  light: ThemeSchema.optional(),
  dark: ThemeSchema.optional(),
  fonts: FontsConfigSchema.optional(),
  noDefaultTheme: z.boolean().optional(),
});

const SiteSchema = z
  .object({
    title: z.string(),
    logoUrl: z.string(),
    dir: z.enum(["ltr", "rtl"]).optional(),
    logo: LogoSchema,
    showPoweredBy: z.boolean().optional(),
    disableHeader: z.boolean().optional(),
    disableTopNavigation: z.boolean().optional(),
    disableFooter: z.boolean().optional(),
    banner: z.object({
      message: z.custom<NonNullable<ReactNode>>(),
      color: z
        .custom<"note" | "tip" | "info" | "caution" | "danger" | (string & {})>(
          (val) => typeof val === "string",
        )
        .optional(),
      dismissible: z.boolean().optional(),
    }),
    footer: FooterSchema,
  })
  .partial();

const ApiCatalogSchema = z.object({
  path: z.string(),
  label: z.string(),
  items: z.array(z.string()).optional(),
  filterItems: z
    .custom<FilterCatalogItemsFn>((val) => typeof val === "function")
    .optional(),
});

export const CdnUrlSchema = z
  .union([
    z.string(),
    z.object({
      base: z.string().optional(),
      media: z.string().optional(),
    }),
  ])
  .transform((val) => {
    if (typeof val === "string") {
      return { base: val, media: val };
    }
    return { base: val.base, media: val.media };
  })
  .optional();

const BaseConfigSchema = z.object({
  slots: z.record(z.string(), z.custom<SlotType>()),
  /**
   * @deprecated Use `slots` instead
   */
  UNSAFE_slotlets: z.record(z.string(), z.custom<SlotType>()),
  mdx: z
    .object({
      components: z.custom<MdxComponentsType>(),
    })
    .partial(),
  customPages: z.array(
    z.object({
      path: z.string(),
      element: z.custom<NonNullable<ReactNode>>().optional(),
      render: z.custom<ComponentType<ExposedComponentProps>>().optional(),
      prose: z.boolean().optional(),
    }),
  ),
  plugins: z.array(z.custom<ZudokuPlugin>()),
  build: z.custom<{
    remarkPlugins?: Options["remarkPlugins"];
    rehypePlugins?: Options["rehypePlugins"];
  }>(),
  protectedRoutes: ProtectedRoutesSchema,
  basePath: z.string().optional(),
  canonicalUrlOrigin: z.string().optional(),
  cdnUrl: CdnUrlSchema.optional(),
  port: z.number().optional(),
  https: z
    .object({
      key: z.string(),
      cert: z.string(),
      ca: z.string().optional(),
    })
    .optional(),
  site: SiteSchema,
  navigation: InputNavigationSchema,
  theme: ThemeConfigSchema,
  syntaxHighlighting: z
    .object({
      languages: z.array(z.custom<BundledLanguage>()),
      themes: z.object({
        light: z.custom<BundledTheme>(),
        dark: z.custom<BundledTheme>(),
      }),
    })
    .partial()
    .optional(),
  metadata: MetadataSchema,
  authentication: AuthenticationSchema,
  search: SearchSchema,
  docs: DocsConfigSchema.optional(),
  apis: z.union([ApiSchema, z.array(ApiSchema)]),
  catalogs: z.union([ApiCatalogSchema, z.array(ApiCatalogSchema)]),
  apiKeys: ApiKeysSchema,
  redirects: z.array(Redirect),
  sitemap: SiteMapSchema,
  enableStatusPages: z.boolean().optional(),
  defaults: z.object({
    apis: ApiOptionsSchema,
    /**
     * @deprecated Use `apis.examplesLanguage` or `defaults.apis.examplesLanguage` instead
     */
    examplesLanguage: z.string().optional(),
  }),
});

export const ZudokuConfig = BaseConfigSchema.partial();

export type ZudokuApiConfig = z.infer<typeof ApiSchema>;
export type ZudokuSiteMapConfig = z.infer<typeof SiteMapSchema>;
export type ZudokuDocsConfig = z.infer<typeof DocsConfigSchema>;
export type ZudokuLlmsConfig = z.infer<typeof LlmsConfigSchema>;
export type ZudokuRedirect = z.infer<typeof Redirect>;
export type AuthenticationConfig = z.infer<typeof AuthenticationSchema>;

// Use `z.input` type for flexibility with transforms,
// but override navigation with `z.infer` for strict validation
type BaseZudokuConfig = z.input<typeof ZudokuConfig>;
export type ZudokuConfig = Omit<BaseZudokuConfig, "navigation"> & {
  navigation?: z.infer<typeof InputNavigationSchema>;
};

export function validateConfig(config: unknown, configPath?: string) {
  const validationResult = ZudokuConfig.safeParse(config);

  if (!validationResult.success) {
    // In production (build mode), throw an error to fail the build
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Whoops, looks like there's an issue with your ${configPath ?? "config"}:\n${z.prettifyError(validationResult.error)}`,
      );
    }

    // In development mode, log warnings but don't fail
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.log(colors.yellow("Validation errors:"));
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.log(colors.yellow(z.prettifyError(validationResult.error)));
  }
}
