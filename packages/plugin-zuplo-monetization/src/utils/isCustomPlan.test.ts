import { describe, expect, it } from "vitest";
import type { Plan } from "../types/PlanType.js";
import { isCustomPlan } from "./isCustomPlan.js";

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
