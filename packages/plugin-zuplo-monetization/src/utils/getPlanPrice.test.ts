import { describe, expect, it } from "vitest";
import type { Plan, PlanPhase } from "../types/PlanType.js";
import { getFlatFeeBillingCadence, getPlanPrice } from "./getPlanPrice.js";

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
  billingCadence: "P1M",
  phases: [],
  ...overrides,
});

const flatFee = (
  amount: string,
  billingCadence = "P1M",
): PlanPhase["rateCards"][number] => ({
  type: "flat_fee",
  key: "base",
  name: "Base",
  billingCadence,
  price: { type: "flat", amount },
});

describe("getPlanPrice", () => {
  it("returns 0 when there are no phases", () => {
    expect(getPlanPrice(plan({ phases: [] }))).toBe(0);
  });

  it("returns the flat-fee total of the last phase in the plan's own cadence", () => {
    expect(
      getPlanPrice(
        plan({
          billingCadence: "P1M",
          phases: [phase({ rateCards: [flatFee("20")] })],
        }),
      ),
    ).toBe(20);
  });

  it("does not convert the amount across cadences (yearly stays the full fee)", () => {
    expect(
      getPlanPrice(
        plan({
          billingCadence: "P1Y",
          phases: [phase({ rateCards: [flatFee("120", "P1Y")] })],
        }),
      ),
    ).toBe(120);
  });

  // Regression: hourly (sub-day) cadences previously had no monthly equivalent
  // and fell back to 0 ("Free"). The flat fee must surface as-is so callers can
  // render e.g. "$2.99/hour".
  it("returns the flat fee for a sub-day cadence (PT1H) instead of 0", () => {
    expect(
      getPlanPrice(
        plan({
          billingCadence: "PT1H",
          phases: [phase({ rateCards: [flatFee("2.99", "PT1H")] })],
        }),
      ),
    ).toBe(2.99);
  });

  it("uses the last phase when there are multiple", () => {
    expect(
      getPlanPrice(
        plan({
          phases: [
            phase({ key: "trial", rateCards: [flatFee("0")] }),
            phase({ key: "main", rateCards: [flatFee("50")] }),
          ],
        }),
      ),
    ).toBe(50);
  });

  it("sums multiple flat-fee rate cards in the last phase", () => {
    expect(
      getPlanPrice(
        plan({ phases: [phase({ rateCards: [flatFee("10"), flatFee("5")] })] }),
      ),
    ).toBe(15);
  });

  it("ignores non-flat_fee rate cards", () => {
    expect(
      getPlanPrice(
        plan({
          phases: [
            phase({
              rateCards: [
                flatFee("10"),
                {
                  type: "usage_based",
                  key: "api",
                  name: "API Calls",
                  billingCadence: "P1M",
                  price: { type: "unit", amount: "0.01" },
                },
              ],
            }),
          ],
        }),
      ),
    ).toBe(10);
  });

  it("returns 0 when the flat-fee total is 0 (Free)", () => {
    expect(
      getPlanPrice(plan({ phases: [phase({ rateCards: [flatFee("0")] })] })),
    ).toBe(0);
  });

  it("excludes one-time (null billingCadence) flat fees from the recurring price", () => {
    expect(
      getPlanPrice(
        plan({
          phases: [
            phase({
              rateCards: [
                flatFee("20"),
                {
                  type: "flat_fee",
                  key: "setup",
                  name: "Setup fee",
                  // null billingCadence => one-time charge, not recurring
                  billingCadence: null,
                  price: { type: "flat", amount: "100" },
                },
              ],
            }),
          ],
        }),
      ),
    ).toBe(20);
  });
});

describe("getFlatFeeBillingCadence", () => {
  it("returns the first recurring flat-fee rate card's cadence", () => {
    expect(getFlatFeeBillingCadence([flatFee("1", "PT1H")])).toBe("PT1H");
  });

  it("skips one-time (null cadence) and price-less flat fees", () => {
    expect(
      getFlatFeeBillingCadence([
        // one-time setup fee — excluded
        {
          type: "flat_fee",
          key: "setup",
          name: "Setup fee",
          billingCadence: null,
          price: { type: "flat", amount: "100" },
        },
        // free intro fee (price: null) — excluded
        {
          type: "flat_fee",
          key: "intro",
          name: "Intro",
          billingCadence: "P1M",
          price: null,
        },
        flatFee("2.99", "P1D"),
      ]),
    ).toBe("P1D");
  });

  it("returns undefined when there is no recurring flat fee", () => {
    expect(
      getFlatFeeBillingCadence([
        {
          type: "usage_based",
          key: "api",
          name: "API Calls",
          billingCadence: "P1M",
          price: { type: "unit", amount: "0.01" },
        },
      ]),
    ).toBeUndefined();
    expect(getFlatFeeBillingCadence([])).toBeUndefined();
  });
});
