import { describe, expect, it } from "vitest";
import { createPath } from "./path.js";

describe("createPath", () => {
  it("returns the same path string", () => {
    expect(createPath("/return-test")).toBe("/return-test");
  });

  it("accepts relative segments without a leading slash", () => {
    expect(createPath("api-users")).toBe("api-users");
  });

  it("does not normalize the path", () => {
    expect(createPath("/normalize-test/")).toBe("/normalize-test/");
    expect(createPath("/")).toBe("/");
  });

  it("throws when the path is empty", () => {
    expect(() => createPath("")).toThrowError(/non-empty/);
  });

  it("throws when the same absolute path is created twice", () => {
    createPath("/duplicate-test");
    expect(() => createPath("/duplicate-test")).toThrowError(/more than once/);
  });

  it("allows the same relative segment to be reused", () => {
    createPath("shared-segment");
    expect(() => createPath("shared-segment")).not.toThrow();
  });

  it("resets between evaluation passes", async () => {
    createPath("/reset-test");
    // Flush the microtask that clears the registry after a sync pass.
    await Promise.resolve();
    expect(() => createPath("/reset-test")).not.toThrow();
  });
});
