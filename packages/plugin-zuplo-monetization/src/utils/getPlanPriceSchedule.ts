import type { Plan, PlanPhase } from "../types/PlanType.js";
import { formatDuration } from "./formatDuration.js";
import type { PlanPriceLabel } from "./formatPlanPrice.js";
import { getPhasePriceLabel } from "./getPhasePriceLabel.js";

export type PlanPriceScheduleRow = {
  /** Stable row key — the phase key, falling back to the phase index. */
  key: string;
  /** Left-column label, e.g. "First 3 months" / "Next 2 months" / "After that". */
  label: string;
  /** The phase's own price, derived from its rate cards alone. */
  price: PlanPriceLabel;
};

const samePriceLabel = (a: PlanPriceLabel, b: PlanPriceLabel): boolean => {
  if (a.type !== b.type) return false;
  // `free` / `payg` carry no variable data; only `priced` needs an amount compare.
  return a.type !== "priced" || b.type !== "priced" || a.amount === b.amount;
};

const rowLabel = (phase: PlanPhase, index: number, lastIndex: number) => {
  if (index === lastIndex) return "After that";
  // A non-final phase without a duration is invalid plan config; fall back to
  // the author-given name rather than mislabeling it.
  if (!phase.duration) return phase.name;
  const duration = formatDuration(phase.duration);
  return index === 0 ? `First ${duration}` : `Next ${duration}`;
};

/**
 * A stacked price schedule for a multi-phase plan: one row per phase, each
 * priced from its own rate cards (e.g. "First 3 months — Free" then
 * "After that — $750/month"). This is how an intro/ramp phase's price gets
 * surfaced instead of only the steady-state price from {@link getPlanPrice}.
 *
 * Returns `undefined` when there is nothing to stack — fewer than two phases,
 * or every phase resolving to the same price label (a free trial into a free
 * plan, two identically-priced phases, …) — so callers fall back to the
 * single-headline rendering.
 */
export const getPlanPriceSchedule = (
  plan: Plan,
): PlanPriceScheduleRow[] | undefined => {
  const phases = plan.phases ?? [];
  if (phases.length <= 1) return undefined;

  const prices = phases.map(getPhasePriceLabel);
  if (prices.every((price) => samePriceLabel(price, prices[0]))) {
    return undefined;
  }

  return phases.map((phase, index) => ({
    key: phase.key ?? String(index),
    label: rowLabel(phase, index, phases.length - 1),
    price: prices[index],
  }));
};
