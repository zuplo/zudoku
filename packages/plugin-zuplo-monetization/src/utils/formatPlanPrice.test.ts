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
  monthlyPrice: "0",
  yearlyPrice: "0",
  phases: [
    {
      key: "default",
      name: "Default",
      rateCards,
    },
  ],
  ...overrides,
});

const flatFee = (amount: string): RateCard => ({
  type: "flat_fee",
  key: "base",
  name: "Base Fee",
  billingCadence: "P1M",
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

  it("returns free for a flat plan with monthlyPrice 0", () => {
    expect(formatPlanPrice(makePlan([flatFee("0")]))).toEqual({ type: "free" });
  });

  it("returns priced for a flat plan with monthlyPrice > 0", () => {
    const plan = makePlan([flatFee("49")], { monthlyPrice: "49" });
    expect(formatPlanPrice(plan)).toEqual({
      type: "priced",
      monthly: 49,
      yearly: 0,
      hasUsage: false,
    });
  });

  it("flags hasUsage on hybrid plans (flat + usage rate cards)", () => {
    const plan = makePlan([flatFee("49"), unitUsage("0.01")], {
      monthlyPrice: "49",
    });
    expect(formatPlanPrice(plan)).toMatchObject({
      type: "priced",
      hasUsage: true,
    });
  });

  it("returns payg for a usage-only plan with monthlyPrice 0", () => {
    expect(formatPlanPrice(makePlan([unitUsage("0.05")]))).toEqual({
      type: "payg",
      main: "Pay as you go",
      sub: "Usage-based pricing",
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
