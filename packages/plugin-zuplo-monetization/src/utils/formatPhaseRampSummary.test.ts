import { describe, expect, it } from "vitest";
import type { Plan, PlanPhase } from "../types/PlanType.js";
import { formatPhaseRampSummary } from "./formatPhaseRampSummary.js";

const plan = (phases: PlanPhase[], overrides: Partial<Plan> = {}): Plan => ({
  id: "p",
  key: "p",
  name: "Plan",
  billingCadence: "P1M",
  currency: "USD",
  phases,
  ...overrides,
});

const flatFee = (amount: string) => ({
  type: "flat_fee" as const,
  key: "base",
  name: "Base",
  billingCadence: "P1M",
  price: { type: "flat" as const, amount },
});

describe("formatPhaseRampSummary", () => {
  it("summarizes a trial → steady-state ramp", () => {
    const result = formatPhaseRampSummary(
      plan([
        { key: "trial", name: "Free Trial", duration: "P1W", rateCards: [] },
        { key: "default", name: "Default", rateCards: [flatFee("2.99")] },
      ]),
    );
    expect(result).toBe("Free Trial (1 week), then $2.99 / month");
  });

  it("falls back to the phase name when the first phase has no duration", () => {
    const result = formatPhaseRampSummary(
      plan([
        { key: "ramp", name: "Intro", rateCards: [] },
        { key: "default", name: "Default", rateCards: [flatFee("49")] },
      ]),
    );
    expect(result).toBe("Intro, then $49 / month");
  });

  it("returns undefined for a single-phase plan", () => {
    expect(
      formatPhaseRampSummary(
        plan([{ key: "default", name: "Default", rateCards: [flatFee("49")] }]),
      ),
    ).toBeUndefined();
  });
});
