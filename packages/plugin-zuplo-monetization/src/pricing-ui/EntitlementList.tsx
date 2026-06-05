import type { ReactNode } from "react";
import type { EntitlementItem } from "../types/PlanType.js";
import { FeatureItem } from "./FeatureItem.js";
import { QuotaItem } from "./QuotaItem.js";

/**
 * Vertical list of resolved entitlement `items`, rendered in their given order
 * (quotas and features interleaved as they appear, not grouped by kind), with an
 * optional leading `header` (e.g. a phase name) rendered inside the same spacing
 * container. Returns `null` when there are no items, so callers can gate a
 * section header / border without leaving an empty container behind.
 *
 * Shared by {@link PlanEntitlements} (one list per phase) and the subscription
 * entitlement views so quotas and features always render identically.
 */
export const EntitlementList = ({
  items,
  header,
  itemClassName,
}: {
  items: EntitlementItem[];
  /** Optional node rendered above the items, inside the spacing container. */
  header?: ReactNode;
  itemClassName?: string;
}) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {header}
      {items.map((item) =>
        item.kind === "quota" ? (
          <QuotaItem key={item.key} quota={item} className={itemClassName} />
        ) : (
          <FeatureItem
            key={item.key}
            feature={item}
            className={itemClassName}
          />
        ),
      )}
    </div>
  );
};
