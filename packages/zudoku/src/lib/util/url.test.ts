import { describe, expect, it } from "vitest";
import {
  matchesAnyProtectedPattern,
  matchesProtectedPattern,
  normalizeRedirectUrl,
  stripBasePath,
} from "./url.js";

describe("matchesProtectedPattern", () => {
  it("exact pattern matches only the exact path", () => {
    expect(matchesProtectedPattern("/admin", "/admin")).toBe(true);
    expect(matchesProtectedPattern("/admin", "/admin/secret")).toBe(false);
  });

  it("wildcard pattern matches the root and sub-paths", () => {
    expect(matchesProtectedPattern("/admin/*", "/admin")).toBe(true);
    expect(matchesProtectedPattern("/admin/*", "/admin/secret")).toBe(true);
    expect(matchesProtectedPattern("/admin/*", "/admin/a/b/c")).toBe(true);
  });

  it("does not match a sibling path that shares a prefix", () => {
    expect(matchesProtectedPattern("/api/*", "/api-public/foo")).toBe(false);
    expect(matchesProtectedPattern("/admin", "/admin-tools")).toBe(false);
  });
});

describe("matchesAnyProtectedPattern", () => {
  it("returns true when any pattern matches", () => {
    expect(matchesAnyProtectedPattern(["/foo", "/admin/*"], "/admin/x")).toBe(
      true,
    );
  });

  it("returns false when no pattern matches", () => {
    expect(matchesAnyProtectedPattern(["/foo", "/admin"], "/admin/x")).toBe(
      false,
    );
  });
});

describe("stripBasename", () => {
  it("returns pathname unchanged when basePath is empty or '/'", () => {
    expect(stripBasePath("/foo", "")).toBe("/foo");
    expect(stripBasePath("/foo", "/")).toBe("/foo");
  });

  it("strips a matching basePath prefix", () => {
    expect(stripBasePath("/docs/checkout", "/docs")).toBe("/checkout");
  });

  it("returns '/' when pathname equals basePath exactly", () => {
    expect(stripBasePath("/docs", "/docs")).toBe("/");
  });

  it("returns pathname unchanged when prefix matches but boundary doesn't", () => {
    expect(stripBasePath("/docsearch", "/docs")).toBe("/docsearch");
  });

  it("handles basePath with trailing slash", () => {
    expect(stripBasePath("/docs/checkout", "/docs/")).toBe("/checkout");
  });

  it("matches case-insensitively", () => {
    expect(stripBasePath("/Docs/checkout", "/docs")).toBe("/checkout");
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
