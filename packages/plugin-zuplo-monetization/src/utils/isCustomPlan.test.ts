import { describe, expect, it } from "vitest";
import type { Plan } from "../types/PlanType.js";
import { isContactSalesPlan, isCustomPlan } from "./isCustomPlan.js";

const withMetadata = (metadata: Plan["metadata"]): Pick<Plan, "metadata"> => ({
  metadata,
});

describe("isCustomPlan", () => {
  it("detects the boolean true flag", () => {
    expect(isCustomPlan(withMetadata({ isCustom: true }))).toBe(true);
  });

  it('detects the string "true" flag (API metadata is stringly-typed)', () => {
    expect(isCustomPlan(withMetadata({ isCustom: "true" }))).toBe(true);
  });

  it("is false when the flag is absent, false, or unrelated", () => {
    expect(isCustomPlan(withMetadata(undefined))).toBe(false);
    expect(isCustomPlan(withMetadata({}))).toBe(false);
    expect(isCustomPlan(withMetadata({ isCustom: "false" }))).toBe(false);
    expect(isCustomPlan(withMetadata({ zuplo_most_popular: "true" }))).toBe(
      false,
    );
  });
});

describe("isContactSalesPlan", () => {
  it("is true for a custom plan without an invite", () => {
    expect(isContactSalesPlan({ metadata: { isCustom: "true" } })).toBe(true);
    expect(
      isContactSalesPlan({ metadata: { isCustom: "true" }, invited: false }),
    ).toBe(true);
  });

  it("is false for an invited custom plan", () => {
    expect(
      isContactSalesPlan({ metadata: { isCustom: "true" }, invited: true }),
    ).toBe(false);
  });

  it("is false for non-custom plans regardless of invite", () => {
    expect(isContactSalesPlan({ metadata: {} })).toBe(false);
    expect(isContactSalesPlan({ metadata: {}, invited: true })).toBe(false);
  });
});
