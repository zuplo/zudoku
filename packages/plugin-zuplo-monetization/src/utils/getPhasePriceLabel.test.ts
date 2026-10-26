import { describe, expect, it } from "vitest";
import type { PlanPhase, RateCard } from "../types/PlanType.js";
import { getPhasePriceLabel } from "./getPhasePriceLabel.js";

const phase = (rateCards: RateCard[]): PlanPhase => ({
  key: "p",
  name: "Phase",
  rateCards,
});

const flatFee = (
  amount: string | null,
  billingCadence: string | null = "P1M",
): RateCard => ({
  type: "flat_fee",
  key: "base",
  name: "Base",
  billingCadence,
  price: amount === null ? null : { type: "flat", amount },
});

const meteredQuota = (key: string): RateCard => ({
  type: "flat_fee",
  key,
  name: key,
  billingCadence: null,
  price: null,
  featureKey: key,
  entitlementTemplate: {
    type: "metered",
    issueAfterReset: 1000,
    usagePeriod: "P1M",
  },
});

describe("getPhasePriceLabel", () => {
  it("returns priced for a phase with a recurring flat fee", () => {
    expect(getPhasePriceLabel(phase([flatFee("750")]))).toEqual({
      type: "priced",
      amount: 750,
    });
  });

  it("returns free for a phase whose flat fee has price: null (intro phase)", () => {
    expect(getPhasePriceLabel(phase([flatFee(null, null)]))).toEqual({
      type: "free",
    });
  });

  it("returns free for a quota-only phase (metered entitlements, no prices)", () => {
    expect(
      getPhasePriceLabel(phase([meteredQuota("jobs"), meteredQuota("api")])),
    ).toEqual({ type: "free" });
  });

  it("returns free when the phase only has a one-time fee (null billingCadence)", () => {
    expect(getPhasePriceLabel(phase([flatFee("100", null)]))).toEqual({
      type: "free",
    });
  });

  it("returns payg for a phase with a priced usage_based card", () => {
    expect(
      getPhasePriceLabel(
        phase([
          {
            type: "usage_based",
            key: "api",
            name: "API Calls",
            billingCadence: "P1M",
            price: { type: "unit", amount: "0.01" },
          },
        ]),
      ),
    ).toEqual({
      type: "payg",
      main: "Pay as you go",
      sub: "Usage-based pricing",
    });
  });

  it("does not flip to payg for zero-priced usage cards", () => {
    expect(
      getPhasePriceLabel(
        phase([
          {
            type: "usage_based",
            key: "api",
            name: "API Calls",
            billingCadence: "P1M",
            price: { type: "unit", amount: "0" },
          },
        ]),
      ),
    ).toEqual({ type: "free" });
  });

  it("derives only from the given phase's own rate cards", () => {
    // A free phase stays free regardless of what other phases of the plan
    // contain — the label is per-phase, unlike formatPlanPrice's plan-wide
    // PAYG scan.
    expect(getPhasePriceLabel(phase([flatFee(null, null)]))).toEqual({
      type: "free",
    });
    expect(getPhasePriceLabel(phase([flatFee("375")]))).toEqual({
      type: "priced",
      amount: 375,
    });
  });
});
