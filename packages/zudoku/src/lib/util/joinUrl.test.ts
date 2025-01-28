import { describe, expect, test } from "vitest";
import { joinUrl } from "./joinUrl.js";

describe("joinUrl", () => {
  test("handles basic URL joining", () => {
    expect(joinUrl("https://example.com", "path")).toBe(
      "https://example.com/path",
    );
    expect(joinUrl("https://example.com/", "path")).toBe(
      "https://example.com/path",
    );
    expect(joinUrl("https://example.com/", "/path")).toBe(
      "https://example.com/path",
    );
  });

  test("handles multiple path segments", () => {
    expect(joinUrl("https://example.com", "api", "v1", "users")).toBe(
      "https://example.com/api/v1/users",
    );
  });

  // test("handles query parameters", () => {
  //   expect(joinUrl("https://example.com", "path?query=1")).toBe(
  //     "https://example.com/path?query=1",
  //   );
  //   expect(joinUrl("https://example.com?base=1", "path?query=1")).toBe(
  //     "https://example.com/path?query=1",
  //   );
  // });

  // test("handles repeated dots and question marks", () => {
  //   expect(joinUrl("https://example.com", "path/../../../test")).toBe(
  //     "https://example.com/path/../../../test",
  //   );
  //   expect(joinUrl("https://example.com", "test????a=1")).toBe(
  //     "https://example.com/test????a=1",
  //   );
  // });

  test("handles falsy values", () => {
    expect(joinUrl("https://example.com", null, undefined, false, "path")).toBe(
      "https://example.com/path",
    );
  });

  test("handles numeric values", () => {
    expect(joinUrl("https://example.com", "api", 123, "test")).toBe(
      "https://example.com/api/123/test",
    );
  });

  test("handles relative paths", () => {
    expect(joinUrl("/api", "v1", "users")).toBe("/api/v1/users");
    expect(joinUrl("api", "v1", "users")).toBe("/api/v1/users");
  });

  test("handles empty input", () => {
    expect(joinUrl()).toBe("/");
    expect(joinUrl("")).toBe("/");
  });
});
