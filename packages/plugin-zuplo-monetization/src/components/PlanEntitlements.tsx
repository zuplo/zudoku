import type { PlanPhase } from "../types/PlanType.js";
import { categorizeRateCards } from "../utils/categorizeRateCards.js";
import { formatDuration } from "../utils/formatDuration.js";
import { FeatureItem } from "./FeatureItem";
import { QuotaItem } from "./QuotaItem";

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

  if (quotas.length === 0 && features.length === 0) return null;

  return (
    <div className="space-y-2">
      {showName && (
        <div className="text-sm font-medium text-card-foreground">
          {phase.name}
          {phase.duration && (
            <span className="text-muted-foreground font-normal">
              {" "}
              &mdash; {formatDuration(phase.duration)}
            </span>
          )}
        </div>
      )}
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
