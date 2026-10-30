import type { ReactNode } from "react";
import type { Feature, Quota } from "../types/PlanType.js";
import { FeatureItem } from "./FeatureItem.js";
import { QuotaItem } from "./QuotaItem.js";

/**
 * Vertical list of a resolved entitlement set — quotas first, then features —
 * with an optional leading `header` (e.g. a phase name) rendered inside the same
 * spacing container. Returns `null` when there are no quotas or features, so
 * callers can gate a section header / border without leaving an empty container
 * behind.
 *
 * Shared by {@link PlanEntitlements} (one list per phase) and the subscription
 * entitlement views so quotas and features always render identically.
 */
export const EntitlementList = ({
  quotas,
  features,
  header,
  itemClassName,
}: {
  quotas: Quota[];
  features: Feature[];
  /** Optional node rendered above the items, inside the spacing container. */
  header?: ReactNode;
  itemClassName?: string;
}) => {
  if (quotas.length === 0 && features.length === 0) return null;

  return (
    <div className="space-y-2">
      {header}
      {quotas.map((quota) => (
        <QuotaItem key={quota.key} quota={quota} className={itemClassName} />
      ))}
      {features.map((feature) => (
        <FeatureItem
          key={feature.key}
          feature={feature}
          className={itemClassName}
        />
      ))}
    </div>
  );
};
