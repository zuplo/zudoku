import { describe, expect, it } from "vitest";
import { createPath } from "./path.js";

describe("createPath", () => {
  it("returns the same path string", () => {
    expect(createPath("/api")).toBe("/api");
  });

  it("does not normalize the path", () => {
    expect(createPath("/api/")).toBe("/api/");
    expect(createPath("/")).toBe("/");
  });

  it("throws when the path does not start with a slash", () => {
    expect(() => createPath("api")).toThrowError(/must start with a "\/"/);
    expect(() => createPath("")).toThrowError(/must start with a "\/"/);
  });
});
