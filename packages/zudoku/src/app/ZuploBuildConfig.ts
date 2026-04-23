import { z } from "zod/mini";

const EntitlementsSchema = z.object({
  devPortalZuploBranding: z.boolean(),
  numberOfProjects: z.number(),
  numberOfUsers: z.number(),
  egressGbPerMonth: z.number(),
  requestsPerMonth: z.number(),
  numberOfApiKeys: z.number(),
  customDomains: z.number(),
  advancedAnalyticsEnabled: z.boolean(),
  devPortalAnalyticsEnabled: z.boolean(),
  premiumSupport: z.boolean(),
  emergencyPhoneSupport: z.boolean(),
  rbacEnabled: z.boolean(),
  onPremEnabled: z.boolean(),
  largeBuildRunners: z.boolean(),
});

const BuildConfigSchema = z.object({
  entitlements: EntitlementsSchema,
  environmentType: z.optional(z.string()),
  deploymentName: z.string(),
  deploymentUrl: z.optional(z.string()),
  projectId: z.optional(z.string()),
  projectType: z.optional(z.string()),
  sourceType: z.optional(z.string()),
  accountName: z.optional(z.string()),
  projectName: z.optional(z.string()),
});

export type BuildConfig = z.infer<typeof BuildConfigSchema>;
export type Entitlements = z.infer<typeof EntitlementsSchema>;

export const parseBuildConfig = (value: unknown): BuildConfig =>
  BuildConfigSchema.parse(value);
