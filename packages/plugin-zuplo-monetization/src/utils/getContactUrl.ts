import type { Plan } from "../types/PlanType.js";

/**
 * Returns the plan's Contact Sales destination (metadata.zuplo_contact_url)
 * when it is a safe link target, otherwise undefined. Plan metadata is
 * API-owner data rendered as an href, so only https: and mailto: are
 * accepted — the gateway enforces the same constraint on plan create/update.
 */
export const getContactUrl = (
  plan: Pick<Plan, "metadata">,
): string | undefined => {
  const value = plan.metadata?.zuplo_contact_url;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  const scheme = trimmed.toLowerCase();
  if (scheme.startsWith("https://") || scheme.startsWith("mailto:")) {
    return trimmed;
  }
  return undefined;
};
