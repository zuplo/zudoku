import { describe, expect, it } from "vitest";
import type { Plan } from "../types/PlanType.js";
import {
  collectDefaultTaxBehaviors,
  planHasDefaultTaxBehavior,
  subscriptionTaxLegendSentence,
  taxBehaviorLegendSentence,
} from "./pricingTaxLegend.js";

const plan = (overrides: Partial<Plan> = {}): Plan => ({
  id: "plan_1",
  key: "p",
  name: "Plan",
  billingCadence: "P1M",
  phases: [],
  monthlyPrice: null,
  yearlyPrice: null,
  ...overrides,
});

describe("planHasDefaultTaxBehavior", () => {
  it("returns false when no tax config is set", () => {
    expect(planHasDefaultTaxBehavior(plan())).toBe(false);
  });

  it("returns false when behavior is missing or whitespace", () => {
    expect(planHasDefaultTaxBehavior(plan({ defaultTaxConfig: {} }))).toBe(
      false,
    );
    expect(
      planHasDefaultTaxBehavior(plan({ defaultTaxConfig: { behavior: "  " } })),
    ).toBe(false);
  });

  it("returns true when behavior is a non-empty string", () => {
    expect(
      planHasDefaultTaxBehavior(
        plan({ defaultTaxConfig: { behavior: "exclusive" } }),
      ),
    ).toBe(true);
  });
});

describe("collectDefaultTaxBehaviors", () => {
  it("returns 'unspecified' when no behavior is set", () => {
    expect(collectDefaultTaxBehaviors(plan())).toBe("unspecified");
  });

  it("normalizes 'exclusive' and 'tax_exclusive' to 'exclusive'", () => {
    expect(
      collectDefaultTaxBehaviors(
        plan({ defaultTaxConfig: { behavior: "exclusive" } }),
      ),
    ).toBe("exclusive");
    expect(
      collectDefaultTaxBehaviors(
        plan({ defaultTaxConfig: { behavior: "tax_exclusive" } }),
      ),
    ).toBe("exclusive");
  });

  it("normalizes 'inclusive' and 'tax_inclusive' to 'inclusive'", () => {
    expect(
      collectDefaultTaxBehaviors(
        plan({ defaultTaxConfig: { behavior: "inclusive" } }),
      ),
    ).toBe("inclusive");
    expect(
      collectDefaultTaxBehaviors(
        plan({ defaultTaxConfig: { behavior: "tax_inclusive" } }),
      ),
    ).toBe("inclusive");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(
      collectDefaultTaxBehaviors(
        plan({ defaultTaxConfig: { behavior: "  EXCLUSIVE  " } }),
      ),
    ).toBe("exclusive");
  });

  it("returns 'unspecified' for an unrecognised behavior", () => {
    expect(
      collectDefaultTaxBehaviors(
        plan({ defaultTaxConfig: { behavior: "custom" } }),
      ),
    ).toBe("unspecified");
  });
});

describe("taxBehaviorLegendSentence", () => {
  it("returns the exclusive sentence", () => {
    expect(taxBehaviorLegendSentence("exclusive")).toBe(
      "Prices exclude tax; taxes may be added at checkout if applicable.",
    );
    expect(taxBehaviorLegendSentence("tax_exclusive")).toBe(
      "Prices exclude tax; taxes may be added at checkout if applicable.",
    );
  });

  it("returns the inclusive sentence", () => {
    expect(taxBehaviorLegendSentence("inclusive")).toBe(
      "Prices include tax where applicable.",
    );
    expect(taxBehaviorLegendSentence("tax_inclusive")).toBe(
      "Prices include tax where applicable.",
    );
  });

  it("returns undefined for unspecified behavior", () => {
    expect(taxBehaviorLegendSentence("unspecified")).toBeUndefined();
    expect(taxBehaviorLegendSentence("")).toBeUndefined();
    expect(taxBehaviorLegendSentence("custom")).toBeUndefined();
  });
});

describe("subscriptionTaxLegendSentence", () => {
  it("returns the exclusive sentence framed for subscriptions", () => {
    expect(subscriptionTaxLegendSentence("exclusive")).toBe(
      "Price excludes tax; taxes may be added on invoice if applicable.",
    );
  });

  it("returns the inclusive sentence", () => {
    expect(subscriptionTaxLegendSentence("inclusive")).toBe(
      "Price includes tax where applicable.",
    );
  });

  it("returns undefined for unspecified behavior", () => {
    expect(subscriptionTaxLegendSentence("custom")).toBeUndefined();
  });
});
