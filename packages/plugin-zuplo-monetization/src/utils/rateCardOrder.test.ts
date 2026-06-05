import { describe, expect, it } from "vitest";
import { parseRateCardOrder, sortRateCardsByOrder } from "./rateCardOrder.js";

describe("parseRateCardOrder", () => {
  it("parses a JSON-encoded phase -> rate-card-key map", () => {
    const order = parseRateCardOrder({
      metadata: {
        zuplo_rate_card_order: JSON.stringify({
          default: ["jobs", "api_requests"],
          trial: ["api_requests"],
        }),
      },
    });
    expect(order).toEqual({
      default: ["jobs", "api_requests"],
      trial: ["api_requests"],
    });
  });

  it("returns undefined when the key is absent or metadata is missing", () => {
    expect(parseRateCardOrder({ metadata: { other: "x" } })).toBeUndefined();
    expect(parseRateCardOrder({})).toBeUndefined();
    expect(parseRateCardOrder({ metadata: null })).toBeUndefined();
  });

  it("returns undefined for malformed JSON", () => {
    expect(
      parseRateCardOrder({ metadata: { zuplo_rate_card_order: "{not json" } }),
    ).toBeUndefined();
  });

  it("returns undefined when the decoded value is not an object", () => {
    expect(
      parseRateCardOrder({
        metadata: { zuplo_rate_card_order: JSON.stringify(["a", "b"]) },
      }),
    ).toBeUndefined();
    expect(
      parseRateCardOrder({
        metadata: { zuplo_rate_card_order: JSON.stringify(5) },
      }),
    ).toBeUndefined();
  });

  it("keeps only string entries and drops non-array phase values", () => {
    const order = parseRateCardOrder({
      metadata: {
        zuplo_rate_card_order: JSON.stringify({
          default: ["jobs", 3, "api_requests", null],
          broken: "nope",
        }),
      },
    });
    expect(order).toEqual({ default: ["jobs", "api_requests"] });
  });
});

describe("sortRateCardsByOrder", () => {
  const cards = [
    { key: "expired" },
    { key: "modified" },
    { key: "jobs" },
    { key: "api_requests" },
  ];

  it("orders cards by their position in the order array", () => {
    const sorted = sortRateCardsByOrder(cards, [
      "jobs",
      "api_requests",
      "expired",
      "modified",
    ]);
    expect(sorted.map((c) => c.key)).toEqual([
      "jobs",
      "api_requests",
      "expired",
      "modified",
    ]);
  });

  it("appends unknown keys last, preserving their relative order", () => {
    const sorted = sortRateCardsByOrder(cards, ["jobs", "api_requests"]);
    expect(sorted.map((c) => c.key)).toEqual([
      "jobs",
      "api_requests",
      "expired", // unknown -> last, original relative order preserved
      "modified",
    ]);
  });

  it("returns the input unchanged when order is undefined or empty", () => {
    expect(sortRateCardsByOrder(cards, undefined)).toBe(cards);
    expect(sortRateCardsByOrder(cards, [])).toBe(cards);
  });

  it("does not mutate the input array", () => {
    const input = [{ key: "b" }, { key: "a" }];
    sortRateCardsByOrder(input, ["a", "b"]);
    expect(input.map((c) => c.key)).toEqual(["b", "a"]);
  });
});
