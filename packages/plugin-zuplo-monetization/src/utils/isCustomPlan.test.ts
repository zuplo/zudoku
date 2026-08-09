import { describe, expect, it } from "vitest";
import type { Plan } from "../types/PlanType.js";
import { isCustomPlan } from "./isCustomPlan.js";

const withMetadata = (metadata: Plan["metadata"]): Pick<Plan, "metadata"> => ({
  metadata,
});

describe("isCustomPlan", () => {
  it("detects the canonical zuplo_custom_plan flag", () => {
    expect(isCustomPlan(withMetadata({ zuplo_custom_plan: true }))).toBe(true);
    expect(isCustomPlan(withMetadata({ zuplo_custom_plan: "true" }))).toBe(
      true,
    );
  });

  it("detects the legacy isCustom flag (shipped on live plans)", () => {
    expect(isCustomPlan(withMetadata({ isCustom: true }))).toBe(true);
    expect(isCustomPlan(withMetadata({ isCustom: "true" }))).toBe(true);
  });

  it("prefers the canonical key when both are present", () => {
    expect(
      isCustomPlan(
        withMetadata({ zuplo_custom_plan: "false", isCustom: "true" }),
      ),
    ).toBe(false);
    expect(
      isCustomPlan(
        withMetadata({ zuplo_custom_plan: "true", isCustom: "false" }),
      ),
    ).toBe(true);
  });

  it("is false when the flag is absent, false, or unrelated", () => {
    expect(isCustomPlan(withMetadata(undefined))).toBe(false);
    expect(isCustomPlan(withMetadata({}))).toBe(false);
    expect(isCustomPlan(withMetadata({ zuplo_custom_plan: "false" }))).toBe(
      false,
    );
    expect(isCustomPlan(withMetadata({ isCustom: "false" }))).toBe(false);
    expect(isCustomPlan(withMetadata({ zuplo_most_popular: "true" }))).toBe(
      false,
    );
  });
});
