import type { PlanPhase } from "../types/PlanType.js";
import { categorizeRateCards } from "../utils/categorizeRateCards.js";
import { formatDuration } from "../utils/formatDuration.js";
import { EntitlementList } from "./EntitlementList.js";

const PhaseSection = ({
  phase,
  currency,
  showName,
  billingCadence,
  units,
  itemClassName,
}: {
  phase: PlanPhase;
  currency?: string;
  showName: boolean;
  billingCadence?: string;
  units?: Record<string, string>;
  itemClassName?: string;
}) => {
  const { quotas, features } = categorizeRateCards(phase.rateCards, {
    currency,
    units,
    planBillingCadence: billingCadence,
  });

  return (
    <EntitlementList
      quotas={quotas}
      features={features}
      itemClassName={itemClassName}
      header={
        showName ? (
          <div className="text-sm font-medium text-card-foreground">
            {phase.name}
            {phase.duration && (
              <span className="text-muted-foreground font-normal">
                {" "}
                &mdash; {formatDuration(phase.duration)}
              </span>
            )}
          </div>
        ) : undefined
      }
    />
  );
};

export const PlanEntitlements = ({
  phases,
  currency,
  billingCadence,
  units,
  itemClassName,
}: {
  phases: PlanPhase[];
  currency?: string;
  billingCadence?: string;
  units?: Record<string, string>;
  itemClassName?: string;
}) => {
  return (
    <div className="space-y-4">
      {phases.map((phase, idx) => (
        <PhaseSection
          // `key` is stable in our API, but fallback to index.
          key={phase.key ?? String(idx)}
          phase={phase}
          currency={currency}
          showName={phases.length > 1}
          billingCadence={billingCadence}
          units={units}
          itemClassName={itemClassName}
        />
      ))}
    </div>
  );
};
