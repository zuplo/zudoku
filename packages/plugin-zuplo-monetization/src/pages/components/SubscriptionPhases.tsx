import { ChevronDownIcon } from "zudoku/icons";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible";
import { EntitlementList } from "../../pricing-ui/EntitlementList.js";
import { PlanPriceTag } from "../../pricing-ui/PlanPriceTag.js";
import type { Subscription } from "../../types/SubscriptionType.js";
import { formatDateTime } from "../../utils/formatDateTime.js";
import {
  getSubscriptionPhaseViews,
  type SubscriptionPhaseView,
} from "../../utils/subscriptionEntitlements.js";

const phaseDateLabel = (view: SubscriptionPhaseView): string | undefined => {
  if (view.status === "current") return "Current phase";
  if (view.status === "future")
    return `Starts ${formatDateTime(view.activeFrom)}`;
  // past
  return view.activeTo
    ? `${formatDateTime(view.activeFrom)} – ${formatDateTime(view.activeTo)}`
    : formatDateTime(view.activeFrom);
};

/**
 * One phase of a subscription: a header with the phase name, its timing
 * sub-label, and the phase's own price, followed by that phase's included
 * quotas/features. The header always renders (even when the phase has no
 * entitlements) so the price/timing is never hidden.
 */
const SubscriptionPhaseSection = ({
  view,
}: {
  view: SubscriptionPhaseView;
}) => {
  const dateLabel = phaseDateLabel(view);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm font-medium text-card-foreground">
          {view.name}
          {dateLabel && (
            <span className="text-muted-foreground font-normal">
              {" "}
              &middot; {dateLabel}
            </span>
          )}
        </div>
        <PlanPriceTag
          label={view.priceLabel}
          currency={view.currency}
          billingCadence={view.billingCadence}
        />
      </div>
      <EntitlementList
        quotas={view.entitlements.quotas}
        features={view.entitlements.features}
      />
    </div>
  );
};

/**
 * The subscription's future phases (each with its start date, price, and
 * entitlements), shown after the current phase on the details page and on the
 * Switch Plan baseline. Renders nothing when there are no upcoming phases.
 */
export const UpcomingPhases = ({
  subscription,
  units,
}: {
  subscription: Subscription;
  units?: Record<string, string>;
}) => {
  const future = getSubscriptionPhaseViews(subscription, { units }).filter(
    (v) => v.status === "future",
  );
  if (future.length === 0) return null;

  return (
    <div className="space-y-4">
      {future.map((view) => (
        <SubscriptionPhaseSection key={view.id} view={view} />
      ))}
    </div>
  );
};

/**
 * The subscription's already-ended phases, collapsed by default, each labelled
 * with the exact dates it ran. Lets users review what they previously paid for
 * without cluttering the page. Renders nothing when there are no past phases.
 */
export const PreviousPhases = ({
  subscription,
  units,
}: {
  subscription: Subscription;
  units?: Record<string, string>;
}) => {
  const past = getSubscriptionPhaseViews(subscription, { units }).filter(
    (v) => v.status === "past",
  );
  if (past.length === 0) return null;

  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center justify-between text-sm font-medium">
        Previous phases
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-4">
        {past.map((view) => (
          <SubscriptionPhaseSection key={view.id} view={view} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};
