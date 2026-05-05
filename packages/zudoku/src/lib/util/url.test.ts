import { describe, expect, it } from "vitest";
import { normalizeRedirectUrl, stripBasepath } from "./url.js";

describe("stripBasename", () => {
  it("returns pathname unchanged when basename is empty or '/'", () => {
    expect(stripBasepath("/foo", "")).toBe("/foo");
    expect(stripBasepath("/foo", "/")).toBe("/foo");
  });

  it("strips a matching basename prefix", () => {
    expect(stripBasepath("/docs/checkout", "/docs")).toBe("/checkout");
  });

  it("returns '/' when pathname equals basename exactly", () => {
    expect(stripBasepath("/docs", "/docs")).toBe("/");
  });

  it("returns pathname unchanged when prefix matches but boundary doesn't", () => {
    expect(stripBasepath("/docsearch", "/docs")).toBe("/docsearch");
  });

  it("handles basename with trailing slash", () => {
    expect(stripBasepath("/docs/checkout", "/docs/")).toBe("/checkout");
  });

  it("matches case-insensitively", () => {
    expect(stripBasepath("/Docs/checkout", "/docs")).toBe("/checkout");
  });
});

describe("normalizeRedirectUrl", () => {
  const mockOrigin = "https://example.com";

  it("should return original URL if it doesn't start with origin", () => {
    const result = normalizeRedirectUrl(
      "https://other.com/path",
      mockOrigin,
      "/",
    );
    expect(result).toBe("https://other.com/path");
  });

  it("should remove origin when root is /", () => {
    const result = normalizeRedirectUrl(
      "https://example.com/some/path",
      mockOrigin,
      "/",
    );
    expect(result).toBe("/some/path");
  });

  it("should remove origin and root path when root is not /", () => {
    const result = normalizeRedirectUrl(
      "https://example.com/docs/some/path",
      mockOrigin,
      "/docs",
    );
    expect(result).toBe("/some/path");
  });

  it("should only remove origin when URL doesn't match root path", () => {
    const result = normalizeRedirectUrl(
      "https://example.com/other/path",
      mockOrigin,
      "/docs",
    );
    expect(result).toBe("/other/path");
  });

  it("should handle empty root path", () => {
    const result = normalizeRedirectUrl(
      "https://example.com/path",
      mockOrigin,
      "",
    );
    expect(result).toBe("/path");
  });
});
