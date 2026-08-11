import { describe, expect, it } from "vitest";
import type { Plan } from "../types/PlanType.js";
import { isCustomPlan } from "./isCustomPlan.js";

const withMetadata = (metadata: Plan["metadata"]): Pick<Plan, "metadata"> => ({
  metadata,
});

describe("isCustomPlan", () => {
  it("detects the boolean true flag", () => {
    expect(isCustomPlan(withMetadata({ zuplo_custom_plan: true }))).toBe(true);
  });

  it('detects the string "true" flag (API metadata is stringly-typed)', () => {
    expect(isCustomPlan(withMetadata({ zuplo_custom_plan: "true" }))).toBe(
      true,
    );
  });

  it("is false when the flag is absent, false, or unrelated", () => {
    expect(isCustomPlan(withMetadata(undefined))).toBe(false);
    expect(isCustomPlan(withMetadata({}))).toBe(false);
    expect(isCustomPlan(withMetadata({ zuplo_custom_plan: "false" }))).toBe(
      false,
    );
    // The retired isCustom spelling is plain metadata with no effect.
    expect(isCustomPlan(withMetadata({ isCustom: "true" }))).toBe(false);
    expect(isCustomPlan(withMetadata({ zuplo_most_popular: "true" }))).toBe(
      false,
    );
  });
});
