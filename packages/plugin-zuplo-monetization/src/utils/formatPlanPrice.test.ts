import { describe, expect, it } from "vitest";
import type { Plan, RateCard } from "../types/PlanType.js";
import { formatPlanPrice } from "./formatPlanPrice.js";

const makePlan = (
  rateCards: RateCard[],
  overrides: Partial<Plan> = {},
): Plan => ({
  id: "plan-1",
  key: "plan-1",
  name: "Plan",
  billingCadence: "P1M",
  phases: [
    {
      key: "default",
      name: "Default",
      rateCards,
    },
  ],
  ...overrides,
});

const flatFee = (amount: string, billingCadence = "P1M"): RateCard => ({
  type: "flat_fee",
  key: "base",
  name: "Base Fee",
  billingCadence,
  price: { type: "flat", amount },
});

const unitUsage = (amount: string): RateCard => ({
  type: "usage_based",
  key: "api",
  name: "API Calls",
  billingCadence: "P1M",
  price: { type: "unit", amount },
  entitlementTemplate: { type: "metered", isSoftLimit: true },
});

describe("formatPlanPrice", () => {
  it("returns free for an empty plan", () => {
    expect(formatPlanPrice(makePlan([], { phases: [] }))).toEqual({
      type: "free",
    });
  });

  it("returns free for a flat plan with a zero flat fee", () => {
    expect(formatPlanPrice(makePlan([flatFee("0")]))).toEqual({ type: "free" });
  });

  it("returns priced with the flat-fee amount for a flat plan", () => {
    expect(formatPlanPrice(makePlan([flatFee("49")]))).toEqual({
      type: "priced",
      amount: 49,
    });
  });

  it("surfaces the flat fee for a sub-day (hourly) cadence rather than Free", () => {
    const plan = makePlan([flatFee("2.99", "PT1H")], {
      billingCadence: "PT1H",
    });
    expect(formatPlanPrice(plan)).toEqual({ type: "priced", amount: 2.99 });
  });

  it("returns priced for a hybrid plan with flat + usage rate cards", () => {
    // Hybrid plans (flat fee + usage) classify as "priced" because their
    // recurring base is positive. Usage on top of the base is communicated
    // by the per-feature tier breakdown, not a separate label.
    const plan = makePlan([flatFee("49"), unitUsage("0.01")]);
    expect(formatPlanPrice(plan)).toEqual({ type: "priced", amount: 49 });
  });

  it("returns payg for a usage-only plan with no flat fee", () => {
    expect(formatPlanPrice(makePlan([unitUsage("0.05")]))).toEqual({
      type: "payg",
      main: "Pay as you go",
      sub: "Usage-based pricing",
    });
  });

  it("returns free for a usage_based card with price: null (quota-only metered)", () => {
    // Used elsewhere in this repo for free, quota-only metered entitlements
    // (e.g. "1000 calls included, no overage"). Should not flip to PAYG.
    const quotaOnly: RateCard = {
      type: "usage_based",
      key: "api",
      name: "API Calls",
      billingCadence: "P1M",
      price: null,
      entitlementTemplate: { type: "metered", issueAfterReset: 1000 },
    };
    expect(formatPlanPrice(makePlan([quotaOnly]))).toEqual({ type: "free" });
  });

  it("returns free for a usage_based card with all-zero tiered price", () => {
    const allFreeTiered: RateCard = {
      type: "usage_based",
      key: "api",
      name: "API Calls",
      billingCadence: "P1M",
      price: {
        type: "tiered",
        mode: "graduated",
        tiers: [
          {
            flatPrice: { amount: "0" },
            unitPrice: { amount: "0" },
            upToAmount: "1000",
          },
          { flatPrice: { amount: "0" }, unitPrice: { amount: "0" } },
        ],
      },
      entitlementTemplate: { type: "metered", isSoftLimit: true },
    };
    expect(formatPlanPrice(makePlan([allFreeTiered]))).toEqual({
      type: "free",
    });
  });

  it("returns payg for a tiered usage-only plan", () => {
    const tieredUsage: RateCard = {
      type: "usage_based",
      key: "api",
      name: "API Calls",
      billingCadence: "P1M",
      price: {
        type: "tiered",
        mode: "graduated",
        tiers: [
          { upToAmount: "10000", unitPrice: { amount: "0.10" } },
          { unitPrice: { amount: "0.01" } },
        ],
      },
      entitlementTemplate: { type: "metered", isSoftLimit: true },
    };
    expect(formatPlanPrice(makePlan([tieredUsage]))).toEqual({
      type: "payg",
      main: "Pay as you go",
      sub: "Usage-based pricing",
    });
  });
});
