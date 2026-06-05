import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PlanPhase } from "../types/PlanType.js";
import { formatDuration } from "../utils/formatDuration.js";
import { PlanEntitlements } from "./PlanEntitlements.js";

const makePhase = (overrides: Partial<PlanPhase> = {}): PlanPhase => ({
  key: "phase",
  name: "Phase",
  rateCards: [],
  ...overrides,
});

describe("PlanEntitlements", () => {
  it("shows phase headers (name + duration) when there are multiple phases", () => {
    const phases: PlanPhase[] = [
      makePhase({
        key: "trial",
        name: "Free Trial",
        duration: "PT1H",
        rateCards: [
          {
            type: "usage_based",
            key: "api",
            name: "API Request",
            billingCadence: "P1M",
            price: null,
            entitlementTemplate: { type: "metered", issueAfterReset: 1000 },
          },
        ],
      }),
      makePhase({
        key: "main",
        name: "Main",
        rateCards: [
          {
            type: "flat_fee",
            key: "feature_bool",
            name: "Base Price",
            billingCadence: "P1M",
            price: { type: "flat", amount: "10" },
            entitlementTemplate: { type: "boolean" },
          },
        ],
      }),
    ];

    render(<PlanEntitlements phases={phases} billingCadence="P1M" />);

    expect(screen.getByText("Free Trial")).toBeInTheDocument();
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText(`— ${formatDuration("PT1H")}`)).toBeInTheDocument();
  });

  it("does not render headers when there is only one phase", () => {
    const phases: PlanPhase[] = [
      makePhase({
        key: "only",
        name: "Only phase",
        rateCards: [
          {
            type: "flat_fee",
            key: "feature_bool",
            name: "Boolean feature",
            billingCadence: "P1M",
            price: { type: "flat", amount: "10" },
            entitlementTemplate: { type: "boolean" },
          },
        ],
      }),
    ];

    render(<PlanEntitlements phases={phases} billingCadence="P1M" />);

    expect(screen.queryByText("Only phase")).not.toBeInTheDocument();
    expect(screen.getByText("Boolean feature")).toBeInTheDocument();
  });

  it("skips phases that have no entitlements", () => {
    const phases: PlanPhase[] = [
      makePhase({
        key: "empty",
        name: "Empty",
        rateCards: [],
      }),
      makePhase({
        key: "with-items",
        name: "With items",
        rateCards: [
          {
            type: "flat_fee",
            key: "feature_bool",
            name: "Included feature",
            billingCadence: "P1M",
            price: { type: "flat", amount: "10" },
            entitlementTemplate: { type: "boolean" },
          },
        ],
      }),
    ];

    render(<PlanEntitlements phases={phases} billingCadence="P1M" />);

    // Header for the empty phase should not render because PhaseSection returns null.
    expect(screen.queryByText("Empty")).not.toBeInTheDocument();
    expect(screen.getByText("With items")).toBeInTheDocument();
    expect(screen.getByText("Included feature")).toBeInTheDocument();
  });

  it("propagates itemClassName to quota and feature rows", () => {
    const phases: PlanPhase[] = [
      makePhase({
        key: "phase",
        name: "Phase",
        rateCards: [
          {
            type: "usage_based",
            key: "api",
            name: "API Request",
            billingCadence: "P1M",
            price: null,
            entitlementTemplate: { type: "metered", issueAfterReset: 1000 },
          },
          {
            type: "flat_fee",
            key: "feature_bool",
            name: "Boolean feature",
            billingCadence: "P1M",
            price: { type: "flat", amount: "10" },
            entitlementTemplate: { type: "boolean" },
          },
        ],
      }),
    ];

    render(
      <PlanEntitlements
        phases={phases}
        billingCadence="P1M"
        itemClassName="text-muted-foreground"
      />,
    );

    expect(screen.getByText("API Request:")).toBeInTheDocument();
    expect(screen.getByText("Boolean feature")).toBeInTheDocument();

    // This test is focused on className propagation; tier breakdown rendering is
    // covered in the tier formatting/categorization tests.

    const quotaInner = screen.getByText("API Request:").closest("div");
    const featureInner = screen.getByText("Boolean feature").closest("div");
    expect(quotaInner).not.toBeNull();
    expect(featureInner).not.toBeNull();

    // `itemClassName` is applied on the outer row container.
    const quotaRow = quotaInner?.parentElement;
    const featureRow = featureInner?.parentElement;
    expect(quotaRow).not.toBeNull();
    expect(featureRow).not.toBeNull();
    expect(quotaRow).toHaveClass("text-muted-foreground");
    expect(featureRow).toHaveClass("text-muted-foreground");
  });

  it("renders rate cards in array order rather than grouping quotas first", () => {
    const phases: PlanPhase[] = [
      makePhase({
        key: "only",
        name: "Only",
        rateCards: [
          {
            type: "flat_fee",
            key: "priority_support",
            name: "Priority Support",
            billingCadence: "P1M",
            price: { type: "flat", amount: "0" },
            entitlementTemplate: { type: "boolean" },
          },
          {
            type: "usage_based",
            key: "api",
            name: "API Request",
            billingCadence: "P1M",
            price: null,
            entitlementTemplate: { type: "metered", issueAfterReset: 1000 },
          },
        ],
      }),
    ];

    const { container } = render(
      <PlanEntitlements phases={phases} billingCadence="P1M" />,
    );

    // The boolean feature precedes the metered quota in the DOM, matching the
    // input array order (the old behaviour grouped all quotas first).
    const text = container.textContent ?? "";
    expect(text.indexOf("Priority Support")).toBeGreaterThanOrEqual(0);
    expect(text.indexOf("Priority Support")).toBeLessThan(
      text.indexOf("API Request"),
    );
  });

  it("orders rate cards by the rateCardOrder prop (keyed by phase)", () => {
    const phases: PlanPhase[] = [
      makePhase({
        key: "main",
        name: "Main",
        rateCards: [
          {
            type: "flat_fee",
            key: "alpha",
            name: "Alpha",
            billingCadence: "P1M",
            price: { type: "flat", amount: "0" },
            entitlementTemplate: { type: "boolean" },
          },
          {
            type: "flat_fee",
            key: "bravo",
            name: "Bravo",
            billingCadence: "P1M",
            price: { type: "flat", amount: "0" },
            entitlementTemplate: { type: "boolean" },
          },
        ],
      }),
    ];

    const { container } = render(
      <PlanEntitlements
        phases={phases}
        billingCadence="P1M"
        rateCardOrder={{ main: ["bravo", "alpha"] }}
      />,
    );

    // Bravo is listed first despite Alpha being first in the array.
    const text = container.textContent ?? "";
    expect(text.indexOf("Bravo")).toBeLessThan(text.indexOf("Alpha"));
  });
});
