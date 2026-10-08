import { describe, expect, it } from "vitest";
import { shouldShowRequestBox } from "./shouldShowRequestBox.js";

describe("shouldShowRequestBox", () => {
  it("shows the box by default", () => {
    expect(shouldShowRequestBox({}, undefined)).toBe(true);
    expect(shouldShowRequestBox(undefined, undefined)).toBe(true);
    expect(shouldShowRequestBox(null, false)).toBe(true);
  });

  it("hides the box when the API disables it", () => {
    expect(shouldShowRequestBox({}, true)).toBe(false);
  });

  it("lets the operation opt back in when the API disables it", () => {
    expect(
      shouldShowRequestBox({ "x-zudoku-request-box-enabled": true }, true),
    ).toBe(true);
  });

  it("lets the operation opt out when the API enables it", () => {
    expect(
      shouldShowRequestBox({ "x-zudoku-request-box-enabled": false }, false),
    ).toBe(false);
    expect(
      shouldShowRequestBox(
        { "x-zudoku-request-box-enabled": false },
        undefined,
      ),
    ).toBe(false);
  });

  it("treats an explicit non-boolean value as disabled", () => {
    expect(
      shouldShowRequestBox({ "x-zudoku-request-box-enabled": null }, false),
    ).toBe(false);
  });
});
