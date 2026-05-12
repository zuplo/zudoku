import type { ReactNode } from "react";
import type { Plan } from "../types/PlanType.js";
import {
  collectDefaultTaxBehaviors,
  taxBehaviorLegendSentence,
} from "../utils/pricingTaxLegend.js";
import { cn } from "./cn.js";
import { PricingCard } from "./PricingCard.js";

export type PricingTableProps = {
  plans: Plan[];
  showYearlyPrice?: boolean;
  units?: Record<string, string>;
  /**
   * Render the CTA (e.g. Subscribe / Contact Sales button) for each plan.
   * Receives the plan and whether it is the popular plan.
   */
  renderAction?: (plan: Plan, isPopular: boolean) => ReactNode;
  /**
   * Predicate that decides which plan gets the "Most Popular" badge.
   * Defaults to `plan.metadata.zuplo_most_popular === "true"`.
   */
  isPopular?: (plan: Plan) => boolean;
  /** Render override for the empty (no plans) state. */
  emptyState?: ReactNode;
  /** Show the tax legend underneath the grid when the first plan has a defaultTaxConfig.behavior. Defaults to true. */
  showTaxLegend?: boolean;
  className?: string;
  cardClassName?: string;
};

const DefaultEmptyState = () => (
  <div className="text-center py-12 text-muted-foreground">
    <p>No plans are currently available.</p>
    <p className="text-sm mt-2">
      Make sure your plans are set up and published.
    </p>
  </div>
);

export const PricingTable = ({
  plans,
  showYearlyPrice = true,
  units,
  renderAction,
  isPopular = (plan) => plan.metadata?.zuplo_most_popular === "true",
  emptyState,
  showTaxLegend = true,
  className,
  cardClassName,
}: PricingTableProps) => {
  if (plans.length === 0) return <>{emptyState ?? <DefaultEmptyState />}</>;

  const firstPlan = plans[0];
  const taxLegendSentence =
    showTaxLegend && firstPlan
      ? taxBehaviorLegendSentence(collectDefaultTaxBehaviors(firstPlan))
      : undefined;

  return (
    <>
      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,max-content))] justify-center gap-6",
          className,
        )}
      >
        {plans.map((plan) => {
          const popular = isPopular(plan);
          return (
            <PricingCard
              key={plan.id}
              plan={plan}
              isPopular={popular}
              showYearlyPrice={showYearlyPrice}
              units={units}
              action={renderAction?.(plan, popular)}
              className={cardClassName}
            />
          );
        })}
      </div>
      {taxLegendSentence && (
        <div
          role="note"
          className="mt-10 pt-6 border-t border-border max-w-2xl mx-auto text-center space-y-2"
        >
          <p className="text-xs font-medium text-muted-foreground">
            Tax & Pricing
          </p>
          <p className="text-xs text-muted-foreground">{taxLegendSentence}</p>
        </div>
      )}
    </>
  );
};
