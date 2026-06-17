import { describe, expect, it } from "vitest";
import { createPath } from "./path.js";

describe("createPath", () => {
  it("returns the same path string", () => {
    expect(createPath("/api")).toBe("/api");
  });

  it("accepts relative segments without a leading slash", () => {
    expect(createPath("api-users")).toBe("api-users");
  });

  it("does not normalize the path", () => {
    expect(createPath("/api/")).toBe("/api/");
    expect(createPath("/")).toBe("/");
  });

  it("throws when the path is empty", () => {
    expect(() => createPath("")).toThrowError(/non-empty/);
  });
});
