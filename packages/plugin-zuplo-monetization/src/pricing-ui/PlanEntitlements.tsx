import type { PlanPhase } from "../types/PlanType.js";
import { categorizeRateCards } from "../utils/categorizeRateCards.js";
import {
  type EntitlementSet,
  sameEntitlementSet,
} from "../utils/comparePlanEntitlements.js";
import { formatDuration } from "../utils/formatDuration.js";
import type { PlanPriceLabel } from "../utils/formatPlanPrice.js";
import { formatPrice } from "../utils/formatPrice.js";
import { getPhasePriceLabel } from "../utils/getPhasePriceLabel.js";
import { EntitlementList } from "./EntitlementList.js";

const priceLabelText = (
  label: PlanPriceLabel,
  currency?: string,
  billingCadence?: string,
): string => {
  if (label.type === "payg") return label.main;
  if (label.type === "free") return "Free";
  const amount = formatPrice(label.amount, currency);
  return billingCadence
    ? `${amount}/${formatDuration(billingCadence)}`
    : amount;
};

/**
 * Section header for one phase of a multi-phase plan: the phase name, its
 * duration, and the phase's own price. Shared by {@link PlanEntitlements} and
 * the plan-change card so per-phase sections read identically everywhere.
 */
export const PlanPhaseHeader = ({
  phase,
  currency,
  billingCadence,
}: {
  phase: PlanPhase;
  currency?: string;
  billingCadence?: string;
}) => (
  <div className="text-sm font-medium text-card-foreground">
    {phase.name}
    {phase.duration && (
      <span className="text-muted-foreground font-normal">
        {" "}
        &mdash; {formatDuration(phase.duration)}
      </span>
    )}
    <span className="text-muted-foreground font-normal">
      {" "}
      &middot;{" "}
      {priceLabelText(getPhasePriceLabel(phase), currency, billingCadence)}
    </span>
  </div>
);

const PhaseSection = ({
  phase,
  set,
  currency,
  billingCadence,
  itemClassName,
}: {
  phase: PlanPhase;
  set: EntitlementSet;
  currency?: string;
  billingCadence?: string;
  itemClassName?: string;
}) => (
  <EntitlementList
    quotas={set.quotas}
    features={set.features}
    itemClassName={itemClassName}
    header={
      <PlanPhaseHeader
        phase={phase}
        currency={currency}
        billingCadence={billingCadence}
      />
    }
  />
);

/**
 * A plan's entitlements, phase by phase. Multi-phase plans whose phases all
 * resolve to the same entitlements collapse into a single list (the phases
 * only differ in price, which the price schedule already tells); phases with
 * genuinely different entitlements render as separate sections headed by the
 * phase name, duration, and that phase's own price.
 */
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
  const sets = phases.map((phase) =>
    categorizeRateCards(phase.rateCards, {
      currency,
      units,
      planBillingCadence: billingCadence,
    }),
  );

  const collapsed =
    phases.length <= 1 || sets.every((set) => sameEntitlementSet(set, sets[0]));

  if (collapsed) {
    // All phases list the same entitlements — render the steady-state
    // (last) phase's list once, without phase headers.
    const steady = sets.at(-1);
    return (
      <div className="space-y-4">
        {steady && (
          <EntitlementList
            quotas={steady.quotas}
            features={steady.features}
            itemClassName={itemClassName}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {phases.map((phase, idx) => (
        <PhaseSection
          // `key` is stable in our API, but fallback to index.
          key={phase.key ?? String(idx)}
          phase={phase}
          set={sets[idx]}
          currency={currency}
          billingCadence={billingCadence}
          itemClassName={itemClassName}
        />
      ))}
    </div>
  );
};
