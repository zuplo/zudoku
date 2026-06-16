import { describe, expect, it } from "vitest";
import type { Plan, PlanPhase, RateCard } from "../types/PlanType.js";
import { getPlanPriceSchedule } from "./getPlanPriceSchedule.js";

const phase = (overrides: Partial<PlanPhase> = {}): PlanPhase => ({
  key: "p",
  name: "Phase",
  rateCards: [],
  ...overrides,
});

const plan = (overrides: Partial<Plan> = {}): Plan => ({
  id: "p1",
  key: "p1",
  name: "Plan",
  currency: "USD",
  billingCadence: "P1M",
  phases: [],
  ...overrides,
});

const flatFee = (
  amount: string | null,
  billingCadence: string | null = "P1M",
): RateCard => ({
  type: "flat_fee",
  key: "monthly_fee",
  name: "Monthly Fee",
  billingCadence,
  price: amount === null ? null : { type: "flat", amount },
});

const booleanFeature = (key: string): RateCard => ({
  type: "flat_fee",
  key,
  name: key,
  billingCadence: null,
  price: null,
  featureKey: key,
  entitlementTemplate: { type: "boolean" },
});

const meteredQuota = (key: string, issueAfterReset: number): RateCard => ({
  type: "flat_fee",
  key,
  name: key,
  billingCadence: null,
  price: null,
  featureKey: key,
  entitlementTemplate: { type: "metered", issueAfterReset, usagePeriod: "P1M" },
});

/**
 * Mirrors the motivating "Pro-500k - 50% discount 3 months" plan: a free intro
 * phase (monthly_fee with price: null) ramping into a $750/month steady phase
 * with the same entitlements.
 */
const discountedIntroPlan = plan({
  name: "Pro-500k - 50% discount 3 months",
  phases: [
    phase({
      key: "default",
      name: "First 3 months",
      duration: "P3M",
      rateCards: [
        booleanFeature("expired_jobs_api"),
        flatFee(null, null),
        meteredQuota("jobs", 500_000),
        meteredQuota("api_requests", 250_000),
      ],
    }),
    phase({
      key: "phase_2",
      name: "After 3 months",
      duration: null,
      rateCards: [
        meteredQuota("jobs", 500_000),
        flatFee("750"),
        meteredQuota("api_requests", 250_000),
        booleanFeature("expired_jobs_api"),
      ],
    }),
  ],
});

describe("getPlanPriceSchedule", () => {
  it("returns undefined for a single-phase plan", () => {
    expect(
      getPlanPriceSchedule(
        plan({ phases: [phase({ rateCards: [flatFee("50")] })] }),
      ),
    ).toBeUndefined();
  });

  it("returns undefined when there are no phases", () => {
    expect(getPlanPriceSchedule(plan({ phases: [] }))).toBeUndefined();
  });

  it("builds a free-intro ramp from the reference plan", () => {
    expect(getPlanPriceSchedule(discountedIntroPlan)).toEqual([
      { key: "default", label: "First 3 months", price: { type: "free" } },
      {
        key: "phase_2",
        label: "After that",
        price: { type: "priced", amount: 750 },
        billingCadence: "P1M",
      },
    ]);
  });

  it("builds a priced-intro ramp when the intro fee is set", () => {
    const priced = plan({
      phases: [
        phase({
          key: "intro",
          name: "First 3 months",
          duration: "P3M",
          rateCards: [flatFee("375")],
        }),
        phase({ key: "main", name: "Standard", rateCards: [flatFee("750")] }),
      ],
    });
    expect(getPlanPriceSchedule(priced)).toEqual([
      {
        key: "intro",
        label: "First 3 months",
        price: { type: "priced", amount: 375 },
        billingCadence: "P1M",
      },
      {
        key: "main",
        label: "After that",
        price: { type: "priced", amount: 750 },
        billingCadence: "P1M",
      },
    ]);
  });

  it("suffixes each row with its phase's own cadence, not the plan cadence", () => {
    // Mirrors the "Free Trial then Fixed Quota" plan: a P1D plan whose trial
    // phase bills hourly (PT1H). The trial row must read "$1/hour", not
    // "$1/day" borrowed from the plan-level cadence.
    const rows = getPlanPriceSchedule(
      plan({
        billingCadence: "P1D",
        phases: [
          phase({
            key: "trial",
            name: "Trial",
            duration: "PT1H",
            rateCards: [flatFee("1", "PT1H")],
          }),
          phase({ key: "main", rateCards: [flatFee("2.99", "P1D")] }),
        ],
      }),
    );
    expect(rows).toEqual([
      {
        key: "trial",
        label: "First hour",
        price: { type: "priced", amount: 1 },
        billingCadence: "PT1H",
      },
      {
        key: "main",
        label: "After that",
        price: { type: "priced", amount: 2.99 },
        billingCadence: "P1D",
      },
    ]);
  });

  it("returns undefined when every phase resolves to the same price", () => {
    expect(
      getPlanPriceSchedule(
        plan({
          phases: [
            phase({ key: "a", duration: "P1M", rateCards: [flatFee("750")] }),
            phase({ key: "b", rateCards: [flatFee("750")] }),
          ],
        }),
      ),
    ).toBeUndefined();
    // Free trial into a free plan — nothing to stack either.
    expect(
      getPlanPriceSchedule(
        plan({
          phases: [
            phase({ key: "a", duration: "P1W", rateCards: [] }),
            phase({ key: "b", rateCards: [flatFee(null, null)] }),
          ],
        }),
      ),
    ).toBeUndefined();
  });

  it("labels a payg phase as Pay as you go", () => {
    const rows = getPlanPriceSchedule(
      plan({
        phases: [
          phase({
            key: "intro",
            duration: "P1M",
            rateCards: [
              {
                type: "usage_based",
                key: "api",
                name: "API Calls",
                billingCadence: "P1M",
                price: { type: "unit", amount: "0.01" },
              },
            ],
          }),
          phase({ key: "main", rateCards: [flatFee("99")] }),
        ],
      }),
    );
    expect(rows?.[0]?.price).toEqual({
      type: "payg",
      main: "Pay as you go",
      sub: "Usage-based pricing",
    });
    expect(rows?.[1]?.price).toEqual({ type: "priced", amount: 99 });
  });

  it("falls back to the phase name when a non-final phase has no duration", () => {
    const rows = getPlanPriceSchedule(
      plan({
        phases: [
          phase({ key: "intro", name: "Launch offer", rateCards: [] }),
          phase({ key: "main", rateCards: [flatFee("99")] }),
        ],
      }),
    );
    expect(rows?.map((r) => r.label)).toEqual(["Launch offer", "After that"]);
  });

  it("labels first/middle/last rows across three phases", () => {
    const rows = getPlanPriceSchedule(
      plan({
        phases: [
          phase({ key: "a", duration: "P1M", rateCards: [] }),
          phase({ key: "b", duration: "P3M", rateCards: [flatFee("375")] }),
          phase({ key: "c", rateCards: [flatFee("750")] }),
        ],
      }),
    );
    expect(rows?.map((r) => r.label)).toEqual([
      "First month",
      "Next 3 months",
      "After that",
    ]);
  });
});
