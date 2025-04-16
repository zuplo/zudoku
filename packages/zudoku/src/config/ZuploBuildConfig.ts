import { z } from "zod";

export const EntitlementsSchema = z.object({
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

export const BuildConfigSchema = z.object({
  entitlements: EntitlementsSchema,
  environmentType: z.string(),
  deploymentName: z.string(),
  deploymentUrl: z.string(),
  projectId: z.string(),
  projectType: z.string(),
  sourceType: z.string(),
  accountName: z.string(),
  projectName: z.string(),
});

export type BuildConfig = z.infer<typeof BuildConfigSchema>;
export type Entitlements = z.infer<typeof EntitlementsSchema>;
