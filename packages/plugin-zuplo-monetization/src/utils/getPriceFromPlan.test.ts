import { describe, expect, it } from "vitest";
import type { Plan, PlanPhase } from "../types/PlanType.js";
import { derivePriceFromPlan, getPriceFromPlan } from "./getPriceFromPlan.js";

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
  monthlyPrice: null,
  yearlyPrice: null,
  ...overrides,
});

describe("getPriceFromPlan", () => {
  it("prefers explicit monthlyPrice / yearlyPrice when set", () => {
    expect(
      getPriceFromPlan(plan({ monthlyPrice: "19.50", yearlyPrice: "200" })),
    ).toEqual({ monthly: 19.5, yearly: 200 });
  });

  it("treats null monthlyPrice/yearlyPrice with no phases as Free", () => {
    expect(getPriceFromPlan(plan())).toEqual({ monthly: 0, yearly: 0 });
  });

  it("derives monthly/yearly from a P1M plan's flat-fee rate cards", () => {
    expect(
      getPriceFromPlan(
        plan({
          billingCadence: "P1M",
          phases: [
            phase({
              rateCards: [
                {
                  type: "flat_fee",
                  key: "base",
                  name: "Base",
                  billingCadence: "P1M",
                  price: { type: "flat", amount: "20" },
                },
              ],
            }),
          ],
        }),
      ),
    ).toEqual({ monthly: 20, yearly: 240 });
  });

  it("derives monthly from a P1Y cadence by dividing by 12", () => {
    expect(
      getPriceFromPlan(
        plan({
          billingCadence: "P1Y",
          phases: [
            phase({
              rateCards: [
                {
                  type: "flat_fee",
                  key: "base",
                  name: "Base",
                  billingCadence: "P1Y",
                  price: { type: "flat", amount: "120" },
                },
              ],
            }),
          ],
        }),
      ),
    ).toEqual({ monthly: 10, yearly: 120 });
  });

  it("uses the last phase when there are multiple", () => {
    expect(
      getPriceFromPlan(
        plan({
          billingCadence: "P1M",
          phases: [
            phase({
              key: "trial",
              rateCards: [
                {
                  type: "flat_fee",
                  key: "trial-fee",
                  name: "Trial Fee",
                  billingCadence: "P1M",
                  price: { type: "flat", amount: "0" },
                },
              ],
            }),
            phase({
              key: "main",
              rateCards: [
                {
                  type: "flat_fee",
                  key: "base",
                  name: "Base",
                  billingCadence: "P1M",
                  price: { type: "flat", amount: "50" },
                },
              ],
            }),
          ],
        }),
      ),
    ).toEqual({ monthly: 50, yearly: 600 });
  });

  it("sums multiple flat-fee rate cards in the last phase", () => {
    expect(
      getPriceFromPlan(
        plan({
          billingCadence: "P1M",
          phases: [
            phase({
              rateCards: [
                {
                  type: "flat_fee",
                  key: "base",
                  name: "Base",
                  billingCadence: "P1M",
                  price: { type: "flat", amount: "10" },
                },
                {
                  type: "flat_fee",
                  key: "addon",
                  name: "Add-on",
                  billingCadence: "P1M",
                  price: { type: "flat", amount: "5" },
                },
              ],
            }),
          ],
        }),
      ),
    ).toEqual({ monthly: 15, yearly: 180 });
  });

  it("ignores non-flat_fee rate cards when deriving", () => {
    expect(
      getPriceFromPlan(
        plan({
          billingCadence: "P1M",
          phases: [
            phase({
              rateCards: [
                {
                  type: "flat_fee",
                  key: "base",
                  name: "Base",
                  billingCadence: "P1M",
                  price: { type: "flat", amount: "10" },
                },
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
    ).toEqual({ monthly: 10, yearly: 120 });
  });
});

describe("derivePriceFromPlan", () => {
  it("returns nulls when there are no phases", () => {
    expect(derivePriceFromPlan(plan({ phases: [] }))).toEqual({
      monthly: null,
      yearly: null,
    });
  });

  it("returns zeros when the flat-fee sum is 0 (Free)", () => {
    expect(
      derivePriceFromPlan(
        plan({
          billingCadence: "P1M",
          phases: [
            phase({
              rateCards: [
                {
                  type: "flat_fee",
                  key: "base",
                  name: "Base",
                  billingCadence: "P1M",
                  price: { type: "flat", amount: "0" },
                },
              ],
            }),
          ],
        }),
      ),
    ).toEqual({ monthly: 0, yearly: 0 });
  });

  it("returns nulls when the cadence has no monthly equivalent", () => {
    expect(
      derivePriceFromPlan(
        plan({
          billingCadence: "PT1H",
          phases: [
            phase({
              rateCards: [
                {
                  type: "flat_fee",
                  key: "base",
                  name: "Base",
                  billingCadence: "PT1H",
                  price: { type: "flat", amount: "1" },
                },
              ],
            }),
          ],
        }),
      ),
    ).toEqual({ monthly: null, yearly: null });
  });

  it("ignores the pre-computed monthlyPrice/yearlyPrice fields (derives only)", () => {
    expect(
      derivePriceFromPlan(
        plan({
          monthlyPrice: "999",
          yearlyPrice: "999",
          billingCadence: "P1M",
          phases: [
            phase({
              rateCards: [
                {
                  type: "flat_fee",
                  key: "base",
                  name: "Base",
                  billingCadence: "P1M",
                  price: { type: "flat", amount: "10" },
                },
              ],
            }),
          ],
        }),
      ),
    ).toEqual({ monthly: 10, yearly: 120 });
  });
});
