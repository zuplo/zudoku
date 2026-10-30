import { describe, expect, it } from "vitest";
import { shouldShowInfoPage } from "./shouldShowInfoPage.js";

describe("shouldShowInfoPage", () => {
  it("always shows when explicitly enabled, even without a description", () => {
    expect(shouldShowInfoPage(true, false)).toBe(true);
    expect(shouldShowInfoPage(true, true)).toBe(true);
  });

  it("never shows when explicitly disabled, even with a description", () => {
    expect(shouldShowInfoPage(false, true)).toBe(false);
    expect(shouldShowInfoPage(false, false)).toBe(false);
  });

  it("falls back to the presence of a description when unset", () => {
    expect(shouldShowInfoPage(undefined, true)).toBe(true);
    expect(shouldShowInfoPage(undefined, false)).toBe(false);
  });
});
