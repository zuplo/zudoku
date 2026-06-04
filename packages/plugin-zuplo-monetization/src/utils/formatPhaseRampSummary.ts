import type { Plan } from "../types/PlanType.js";
import { formatDuration } from "./formatDuration.js";
import { formatPlanPrice } from "./formatPlanPrice.js";
import { formatPrice } from "./formatPrice.js";

// formatDuration returns the singular unit without a leading "1" (e.g. "week").
// For a phase-length phrase we want "1 week" / "2 weeks".
const durationWithCount = (iso: string): string => {
  const text = formatDuration(iso);
  return /^\d/.test(text) ? text : `1 ${text}`;
};

const steadyStateLabel = (plan: Plan): string => {
  const label = formatPlanPrice(plan);
  if (label.type === "priced") {
    return `${formatPrice(label.amount, plan.currency)} / ${formatDuration(plan.billingCadence)}`;
  }
  return label.type === "payg" ? "Pay as you go" : "Free";
};

/**
 * One-line summary of a multi-phase plan's progression for compact UI, e.g.
 * `"Free Trial (1 week), then $2.99 / month"`. Returns `undefined` for
 * single-phase plans (nothing to summarize).
 */
export const formatPhaseRampSummary = (plan: Plan): string | undefined => {
  if (!plan.phases || plan.phases.length <= 1) return undefined;

  const first = plan.phases[0];
  const lead = first.duration
    ? `${first.name} (${durationWithCount(first.duration)})`
    : first.name;

  return `${lead}, then ${steadyStateLabel(plan)}`;
};
