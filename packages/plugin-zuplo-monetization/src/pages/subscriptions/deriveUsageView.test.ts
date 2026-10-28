import { describe, expect, it } from "vitest";
import type { Item } from "../../types/SubscriptionType.js";
import { deriveUsageView } from "./deriveUsageView.js";

// One named case per cell of the entitlement × price configuration matrix the
// Zuplo metering service can express (entitlement metered soft/hard × quota
// issued/track-only; price flat/unit/tiered-graduated/tiered-volume/package/
// dynamic/unpriced), so this table is the auditable coverage claim for the
// Usage card.

const meteredItem = (
  entitlement: { isSoftLimit?: boolean },
  price?: Item["price"],
) =>
  ({
    featureKey: "requests",
    name: "API Requests",
    included: { entitlement },
    price,
  }) as Item;

const graduatedFreeTier = {
  type: "tiered",
  mode: "graduated",
  tiers: [
    {
      upToAmount: "1000",
      unitPrice: { amount: "0" },
      flatPrice: { amount: "0" },
    },
    { unitPrice: { amount: "0.02" } },
  ],
} as Item["price"];

const graduatedAllBilled = {
  type: "tiered",
  mode: "graduated",
  tiers: [{ flatPrice: { amount: "3" }, unitPrice: { amount: "0.01" } }],
} as Item["price"];

describe("deriveUsageView", () => {
  describe("hard limits are capped regardless of price shape", () => {
    const cases: [string, Item["price"]][] = [
      ["unit price", { type: "unit", amount: "0.05" } as Item["price"]],
      ["graduated free tier", graduatedFreeTier],
      [
        "volume tiers",
        {
          type: "tiered",
          mode: "volume",
          tiers: [{ upToAmount: "1000", unitPrice: { amount: "0" } }],
        } as Item["price"],
      ],
      ["flat price", { type: "flat", amount: "99" } as Item["price"]],
      ["unpriced", undefined],
    ];

    it.each(cases)("hard limit + %s → capped", (_name, price) => {
      const view = deriveUsageView(
        { balance: 200, usage: 800, overage: 0 },
        meteredItem({ isSoftLimit: false }, price),
      );
      expect(view).toMatchObject({
        kind: "capped",
        usage: 800,
        quota: 1000,
        remaining: 200,
        atLimit: false,
      });
    });

    it("reports atLimit when usage reaches the quota", () => {
      const view = deriveUsageView(
        { balance: 0, usage: 1000, overage: 0 },
        meteredItem({ isSoftLimit: false }, graduatedFreeTier),
      );
      expect(view).toMatchObject({ kind: "capped", atLimit: true });
    });
  });

  describe("soft limit + free-tier graduated price (quota mirrors free range)", () => {
    it("under the included range → included", () => {
      const view = deriveUsageView(
        { balance: 600, usage: 400, overage: 0 },
        meteredItem({ isSoftLimit: true }, graduatedFreeTier),
      );
      expect(view).toMatchObject({
        kind: "included",
        usage: 400,
        included: 1000,
        remaining: 600,
        overage: 0,
        rateLabel: "$0.02/unit",
      });
    });

    it("over the included range keeps included framing with overage", () => {
      const view = deriveUsageView(
        { balance: 0, usage: 1200, overage: 200 },
        meteredItem({ isSoftLimit: true }, graduatedFreeTier),
      );
      expect(view).toMatchObject({
        kind: "included",
        included: 1000,
        overage: 200,
      });
    });

    it("track-only (no quota issued) → meteredGeneric with the first-N caption", () => {
      const view = deriveUsageView(
        { balance: 0, usage: 250, overage: 250 },
        meteredItem({ isSoftLimit: true }, graduatedFreeTier),
      );
      expect(view).toMatchObject({ kind: "meteredGeneric", usage: 250 });
      expect(view.kind === "meteredGeneric" && view.caption).toMatch(
        /first 1,?000 units are included/,
      );
    });
  });

  describe("soft limit + billed-from-the-first-call prices", () => {
    it("unit price → payAsYouGo with its rate", () => {
      const view = deriveUsageView(
        { balance: 0, usage: 40, overage: 40 },
        meteredItem({ isSoftLimit: true }, {
          type: "unit",
          amount: "0.05",
        } as Item["price"]),
      );
      expect(view).toEqual({
        kind: "payAsYouGo",
        usage: 40,
        caption: "Pay as you go — every unit is billed; there is no usage cap.",
        rateLabel: "$0.05/unit",
      });
    });

    it("graduated tiers with no free range → payAsYouGo, even with a quota issued", () => {
      const view = deriveUsageView(
        { balance: 5, usage: 5, overage: 0 },
        meteredItem({ isSoftLimit: true }, graduatedAllBilled),
      );
      expect(view).toMatchObject({
        kind: "payAsYouGo",
        usage: 5,
        rateLabel: "$0.01/unit",
      });
    });

    it("$0 unit price (never billed) → meteredGeneric included-with-plan", () => {
      const view = deriveUsageView(
        { balance: 0, usage: 7, overage: 7 },
        meteredItem({ isSoftLimit: true }, {
          type: "unit",
          amount: "0",
        } as Item["price"]),
      );
      expect(view).toMatchObject({ kind: "meteredGeneric" });
      expect(view.kind === "meteredGeneric" && view.caption).toMatch(
        /Included with your plan/,
      );
    });

    it("never-billed prices stay out of included framing even with a quota and overage", () => {
      // An issued quota + overage on a $0 unit price must not produce the
      // "included" view — its overage warning would falsely claim additional
      // usage is billed.
      const view = deriveUsageView(
        { balance: 0, usage: 1500, overage: 500 },
        meteredItem({ isSoftLimit: true }, {
          type: "unit",
          amount: "0",
        } as Item["price"]),
      );
      expect(view).toMatchObject({ kind: "meteredGeneric", quota: 1000 });
      expect(view.kind === "meteredGeneric" && view.caption).toMatch(
        /Included with your plan/,
      );

      const openEndedFree = deriveUsageView(
        { balance: 500, usage: 500, overage: 0 },
        meteredItem({ isSoftLimit: true }, {
          type: "tiered",
          mode: "graduated",
          tiers: [{ unitPrice: { amount: "0" } }],
        } as Item["price"]),
      );
      expect(openEndedFree).toMatchObject({
        kind: "meteredGeneric",
        quota: 1000,
      });
    });
  });

  describe("soft limit + shapes that don't support billing claims", () => {
    it("volume tiers → meteredGeneric with the quota as a plain number", () => {
      const view = deriveUsageView(
        { balance: 500, usage: 500, overage: 0 },
        meteredItem({ isSoftLimit: true }, {
          type: "tiered",
          mode: "volume",
          tiers: [
            { upToAmount: "1000", unitPrice: { amount: "0" } },
            { unitPrice: { amount: "0.02" } },
          ],
        } as Item["price"]),
      );
      expect(view).toMatchObject({
        kind: "meteredGeneric",
        usage: 500,
        quota: 1000,
      });
      expect(view.kind === "meteredGeneric" && view.caption).toMatch(
        /billed per your plan's pricing/,
      );
    });

    it("package price → meteredGeneric with a per-package rate label", () => {
      const view = deriveUsageView(
        { balance: 0, usage: 250, overage: 250 },
        meteredItem({ isSoftLimit: true }, {
          type: "package",
          amount: "10",
          quantityPerUnit: "100",
        } as Item["price"]),
      );
      expect(view).toMatchObject({
        kind: "meteredGeneric",
        rateLabel: "$10.00 per 100 units",
      });
    });

    it("dynamic price → meteredGeneric without a rate label", () => {
      const view = deriveUsageView(
        { balance: 100, usage: 50, overage: 0 },
        meteredItem({ isSoftLimit: true }, {
          type: "dynamic",
        } as Item["price"]),
      );
      expect(view).toMatchObject({
        kind: "meteredGeneric",
        quota: 150,
        rateLabel: undefined,
      });
    });
  });

  describe("soft limit + flat or unpriced items (usage never changes the bill)", () => {
    it.each([
      ["flat price", { type: "flat", amount: "99" } as Item["price"]],
      ["unpriced", undefined],
    ])("%s → meteredGeneric with the no-billing caption", (_name, price) => {
      const view = deriveUsageView(
        { balance: 800, usage: 200, overage: 0 },
        meteredItem({ isSoftLimit: true }, price),
      );
      expect(view).toMatchObject({
        kind: "meteredGeneric",
        usage: 200,
        quota: 1000,
      });
      expect(view.kind === "meteredGeneric" && view.caption).toMatch(
        /doesn't change your bill/,
      );
    });
  });

  describe("missing item data falls back to access values alone", () => {
    it("makes no billing claims — quota shows as a plain number", () => {
      const view = deriveUsageView({ balance: 0, usage: 1200, overage: 200 });
      expect(view).toMatchObject({ kind: "meteredGeneric", quota: 1000 });
      expect(view.kind === "meteredGeneric" && view.caption).toMatch(
        /billed per your plan's pricing/,
      );
      // The cap semantics are unknown without the item, so no cap claim.
      expect(view.kind === "meteredGeneric" && view.caption).not.toMatch(
        /usage cap/,
      );
    });

    it("no quota → meteredGeneric without a quota number", () => {
      const view = deriveUsageView({ balance: 0, usage: 50, overage: 50 });
      expect(view).toMatchObject({ kind: "meteredGeneric", quota: undefined });
    });

    it("missing entitlement defaults to a soft limit", () => {
      const view = deriveUsageView({ balance: 500, usage: 500, overage: 0 }, {
        featureKey: "requests",
        name: "API Requests",
      } as Item);
      // No price on the item → tracked, not billed per call.
      expect(view).toMatchObject({ kind: "meteredGeneric", quota: 1000 });
    });
  });

  describe("configured unit names (pricing.units)", () => {
    it("uses the configured name in rate labels and captions", () => {
      const payg = deriveUsageView(
        { balance: 0, usage: 40, overage: 40 },
        meteredItem({ isSoftLimit: true }, {
          type: "unit",
          amount: "0.05",
        } as Item["price"]),
        "request",
      );
      expect(payg).toMatchObject({
        rateLabel: "$0.05/request",
        caption:
          "Pay as you go — every request is billed; there is no usage cap.",
      });

      const trackOnly = deriveUsageView(
        { balance: 0, usage: 250, overage: 250 },
        meteredItem({ isSoftLimit: true }, graduatedFreeTier),
        "request",
      );
      expect(trackOnly.kind === "meteredGeneric" && trackOnly.caption).toMatch(
        /first 1,?000 requests are included/,
      );

      const pkg = deriveUsageView(
        { balance: 0, usage: 250, overage: 250 },
        meteredItem({ isSoftLimit: true }, {
          type: "package",
          amount: "10",
          quantityPerUnit: "100",
        } as Item["price"]),
        "request",
      );
      expect(pkg.rateLabel).toBe("$10.00 per 100 requests");
    });

    it("doesn't double-pluralize names that already end in s", () => {
      const view = deriveUsageView(
        { balance: 0, usage: 250, overage: 250 },
        meteredItem({ isSoftLimit: true }, graduatedFreeTier),
        "credits",
      );
      expect(view.kind === "meteredGeneric" && view.caption).toMatch(
        /first 1,?000 credits are included/,
      );
    });
  });

  describe("rate labels", () => {
    it("uses the open-ended tier's unit price for graduated tiers", () => {
      const view = deriveUsageView(
        { balance: 600, usage: 400, overage: 0 },
        meteredItem({ isSoftLimit: true }, graduatedFreeTier),
      );
      expect(view.rateLabel).toBe("$0.02/unit");
    });

    it("omits the label for malformed amounts", () => {
      const view = deriveUsageView(
        { balance: 0, usage: 40, overage: 40 },
        meteredItem({ isSoftLimit: true }, {
          type: "unit",
          amount: "oops",
        } as Item["price"]),
      );
      expect(view.rateLabel).toBeUndefined();
    });

    it("falls back to the bare package amount without a package size", () => {
      const view = deriveUsageView(
        { balance: 0, usage: 250, overage: 250 },
        meteredItem({ isSoftLimit: true }, {
          type: "package",
          amount: "10",
        } as Item["price"]),
      );
      expect(view.rateLabel).toBe("$10.00");
    });
  });
});
