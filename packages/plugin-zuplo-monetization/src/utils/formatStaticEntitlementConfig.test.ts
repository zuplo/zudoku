import { describe, expect, it } from "vitest";
import { formatStaticEntitlementConfig } from "./formatStaticEntitlementConfig.js";

describe("formatStaticEntitlementConfig", () => {
  it("returns undefined for empty or missing config", () => {
    expect(formatStaticEntitlementConfig(undefined)).toBeUndefined();
    expect(formatStaticEntitlementConfig("")).toBeUndefined();
  });

  it("unwraps the .value field on an object config", () => {
    expect(formatStaticEntitlementConfig(JSON.stringify({ value: 5 }))).toBe(
      "5",
    );
    expect(
      formatStaticEntitlementConfig(JSON.stringify({ value: "Gold" })),
    ).toBe("Gold");
    expect(formatStaticEntitlementConfig(JSON.stringify({ value: true }))).toBe(
      "true",
    );
  });

  it("renders boolean / number / string primitives directly", () => {
    expect(formatStaticEntitlementConfig(JSON.stringify(42))).toBe("42");
    expect(formatStaticEntitlementConfig(JSON.stringify("Premium"))).toBe(
      "Premium",
    );
    expect(formatStaticEntitlementConfig(JSON.stringify(true))).toBe("true");
    expect(formatStaticEntitlementConfig(JSON.stringify(false))).toBe("false");
  });

  it("falls back to JSON.stringify for objects without a .value field", () => {
    const config = JSON.stringify({ mode: "strict", limit: 3 });
    expect(formatStaticEntitlementConfig(config)).toBe(config);
  });

  it("falls back to JSON.stringify for arrays", () => {
    const config = JSON.stringify(["jobs", "exports"]);
    expect(formatStaticEntitlementConfig(config)).toBe(config);
  });

  it("renders null literal as 'null'", () => {
    expect(formatStaticEntitlementConfig(JSON.stringify(null))).toBe("null");
  });

  it("returns undefined for malformed JSON", () => {
    expect(formatStaticEntitlementConfig("{not-json}")).toBeUndefined();
    expect(formatStaticEntitlementConfig("[")).toBeUndefined();
  });

  it("preserves empty-string config value as an empty string", () => {
    expect(formatStaticEntitlementConfig(JSON.stringify(""))).toBe("");
  });
});
