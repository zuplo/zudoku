import { describe, expect, it } from "vitest";
import type { Feature, Quota } from "../types/PlanType.js";
import {
  comparePlanEntitlements,
  type EntitlementSet,
  sameEntitlementSet,
} from "./comparePlanEntitlements.js";

const quota = (o: Partial<Quota> & Pick<Quota, "key" | "name">): Quota => ({
  limit: 0,
  period: "month",
  ...o,
});

const feature = (key: string, name: string, value?: string): Feature => ({
  key,
  name,
  value,
});

const set = (
  quotas: Quota[] = [],
  features: Feature[] = [],
): EntitlementSet => ({ quotas, features });

describe("comparePlanEntitlements", () => {
  it("does not produce a contradictory added+removed for two differently-keyed quotas sharing a display name", () => {
    const current = set([
      quota({
        key: "api_requests",
        name: "API Requests",
        isPayg: true,
        unitPrice: "$3 + $0.01/request",
        period: "hour",
      }),
    ]);
    const target = set([
      quota({
        key: "total_requests",
        name: "API Requests",
        limit: 10000,
        period: "month",
      }),
    ]);

    const changes = comparePlanEntitlements(current, target);
    const removed = changes.filter((c) => c.change === "removed");
    const added = changes.filter((c) => c.change === "added");
    expect(removed).toHaveLength(1);
    expect(added).toHaveLength(1);
    // Labels disambiguated by period so the identical string never appears as
    // both "added" and "removed".
    expect(removed[0].label).not.toBe(added[0].label);
    expect(new Set(changes.map((c) => c.label)).size).toBe(changes.length);
  });

  it("treats a cross-cadence quota change as neutral (no up/down direction)", () => {
    const changes = comparePlanEntitlements(
      set([quota({ key: "x", name: "Requests", limit: 10, period: "hour" })]),
      set([
        quota({
          key: "x",
          name: "Requests",
          limit: 1_000_000,
          period: "month",
        }),
      ]),
    );
    expect(changes).toHaveLength(1);
    expect(changes[0].change).toBe("changed");
    expect(changes[0].currentValue).toBe("10 / hour");
    expect(changes[0].targetValue).toBe("1,000,000 / month");
  });

  it("computes increase/decrease only for same-period numeric quotas", () => {
    expect(
      comparePlanEntitlements(
        set([quota({ key: "x", name: "X", limit: 100, period: "month" })]),
        set([quota({ key: "x", name: "X", limit: 200, period: "month" })]),
      )[0].change,
    ).toBe("increase");
    expect(
      comparePlanEntitlements(
        set([quota({ key: "x", name: "X", limit: 200, period: "month" })]),
        set([quota({ key: "x", name: "X", limit: 100, period: "month" })]),
      )[0].change,
    ).toBe("decrease");
  });

  it("shows the per-unit price for an added PAYG quota, never 0", () => {
    const changes = comparePlanEntitlements(
      set([]),
      set([
        quota({
          key: "y",
          name: "API Calls",
          isPayg: true,
          unitPrice: "$0.01/request",
        }),
      ]),
    );
    expect(changes).toEqual([
      {
        key: "y",
        label: "API Calls",
        kind: "quota",
        change: "added",
        targetValue: "$0.01/request",
      },
    ]);
  });

  it("carries the target tier breakdown and detects re-priced schedules", () => {
    const tiered = (lines: string[]) =>
      quota({
        key: "api_calls",
        name: "API Calls",
        limit: 1000,
        period: "month",
        tierPrices: lines,
      });

    // Plain quota → tiered: neutral change with the target schedule attached.
    const toTiered = comparePlanEntitlements(
      set([
        quota({
          key: "api_calls",
          name: "API Calls",
          limit: 10,
          period: "hour",
        }),
      ]),
      set([tiered(["Up to 1,000: Included", "Over 1,000: $0.01/request"])]),
    );
    expect(toTiered[0]).toMatchObject({
      change: "changed",
      currentValue: "10 / hour",
      targetValue: "Tiered pricing",
      tierPrices: ["Up to 1,000: Included", "Over 1,000: $0.01/request"],
    });

    // Both sides label "Tiered pricing" but the schedule differs: still a change.
    const repriced = comparePlanEntitlements(
      set([tiered(["Up to 1,000: Included", "Over 1,000: $0.01/request"])]),
      set([tiered(["Up to 500: Included", "Over 500: $0.02/request"])]),
    );
    expect(repriced[0].change).toBe("changed");

    // Identical schedules stay "same" and still expose the breakdown.
    const unchanged = comparePlanEntitlements(
      set([tiered(["Up to 1,000: Included", "Over 1,000: $0.01/request"])]),
      set([tiered(["Up to 1,000: Included", "Over 1,000: $0.01/request"])]),
    );
    expect(unchanged[0].change).toBe("same");
    expect(unchanged[0].tierPrices).toEqual([
      "Up to 1,000: Included",
      "Over 1,000: $0.01/request",
    ]);
  });

  it("emits a single added/removed row per key in the correct bucket", () => {
    const changes = comparePlanEntitlements(
      set([], [feature("a", "Feature A")]),
      set([], [feature("b", "Feature B")]),
    );
    expect(changes).toContainEqual(
      expect.objectContaining({ key: "a", change: "removed", kind: "feature" }),
    );
    expect(changes).toContainEqual(
      expect.objectContaining({ key: "b", change: "added", kind: "feature" }),
    );
    expect(changes).toHaveLength(2);
  });
});

describe("sameEntitlementSet", () => {
  it("treats identical sets in different order as equal", () => {
    const a = set(
      [quota({ key: "jobs", name: "Jobs", limit: 500_000 })],
      [feature("api", "API"), feature("enrich", "Enrichment")],
    );
    const b = set(
      [quota({ key: "jobs", name: "Jobs", limit: 500_000 })],
      [feature("enrich", "Enrichment"), feature("api", "API")],
    );
    expect(sameEntitlementSet(a, b)).toBe(true);
  });

  it("detects differing quota limits, periods, and feature values", () => {
    const base = set([quota({ key: "jobs", name: "Jobs", limit: 100 })]);
    expect(
      sameEntitlementSet(
        base,
        set([quota({ key: "jobs", name: "Jobs", limit: 200 })]),
      ),
    ).toBe(false);
    expect(
      sameEntitlementSet(
        base,
        set([quota({ key: "jobs", name: "Jobs", limit: 100, period: "year" })]),
      ),
    ).toBe(false);
    expect(
      sameEntitlementSet(
        set([], [feature("api", "API", "10 seats")]),
        set([], [feature("api", "API", "20 seats")]),
      ),
    ).toBe(false);
  });

  it("detects extra or missing entitlements", () => {
    const a = set([], [feature("api", "API")]);
    const b = set([], [feature("api", "API"), feature("extra", "Extra")]);
    expect(sameEntitlementSet(a, b)).toBe(false);
    expect(sameEntitlementSet(b, a)).toBe(false);
  });

  it("compares tier schedules, not just the 'Tiered pricing' label", () => {
    const a = set([
      quota({
        key: "api",
        name: "API",
        tierPrices: ["Up to 1,000: Included", "Then $0.01/request"],
      }),
    ]);
    const b = set([
      quota({
        key: "api",
        name: "API",
        tierPrices: ["Up to 1,000: Included", "Then $0.02/request"],
      }),
    ]);
    expect(sameEntitlementSet(a, b)).toBe(false);
    expect(sameEntitlementSet(a, { ...a })).toBe(true);
  });
});
