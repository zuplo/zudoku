import { beforeEach, describe, expect, it } from "vitest";
import {
  clearProtectedRegistry,
  getProtectedSourceMatcher,
  type ModuleScope,
  registerProtectedScope,
  scopeMatchesPattern,
} from "./registry.js";

describe("scopeMatchesPattern", () => {
  describe("route scopes", () => {
    const scope: ModuleScope = { type: "route", path: "/admin/users" };

    it("matches its own path exactly", () => {
      expect(scopeMatchesPattern(scope, "/admin/users")).toBe(true);
    });

    it("does not match a shorter exact pattern", () => {
      expect(scopeMatchesPattern(scope, "/admin")).toBe(false);
    });

    it("matches a splat pattern at the parent level", () => {
      expect(scopeMatchesPattern(scope, "/admin/*")).toBe(true);
    });

    it("matches a dynamic-param pattern", () => {
      expect(
        scopeMatchesPattern({ type: "route", path: "/users/42" }, "/users/:id"),
      ).toBe(true);
    });

    it("does not match an unrelated path", () => {
      expect(scopeMatchesPattern(scope, "/public")).toBe(false);
    });
  });

  describe("subtree scopes", () => {
    const scope: ModuleScope = { type: "subtree", root: "/api" };

    it("matches its exact root", () => {
      expect(scopeMatchesPattern(scope, "/api")).toBe(true);
    });

    it("does not match a deeper bare pattern (must use a glob to gate descendants)", () => {
      expect(scopeMatchesPattern(scope, "/api/users")).toBe(false);
    });

    it("matches a splat pattern rooted at it", () => {
      expect(scopeMatchesPattern(scope, "/api/*")).toBe(true);
    });

    it("does not match an unrelated path", () => {
      expect(scopeMatchesPattern(scope, "/docs")).toBe(false);
    });

    it("tolerates trailing slashes in patterns", () => {
      expect(scopeMatchesPattern(scope, "/api/")).toBe(true);
    });

    it("subtree at / matches a glob pattern targeting any path", () => {
      expect(scopeMatchesPattern({ type: "subtree", root: "/" }, "/*")).toBe(
        true,
      );
    });

    it("does not match a sibling with a shared prefix (e.g. /apiv2 vs root /api)", () => {
      expect(scopeMatchesPattern(scope, "/apiv2")).toBe(false);
      expect(scopeMatchesPattern(scope, "/apiv2/users")).toBe(false);
    });

    it("matches a pattern that is a parent of the subtree via wildcard", () => {
      expect(
        scopeMatchesPattern(
          { type: "subtree", root: "/docs/intro" },
          "/docs/*",
        ),
      ).toBe(true);
    });
  });
});

describe("getProtectedSourceMatcher", () => {
  beforeEach(() => clearProtectedRegistry());

  const configWith = (patterns: string[] | undefined) =>
    ({
      protectedRoutes: patterns,
      __meta: { rootDir: "/tmp" },
    }) as never;

  it("returns disabled matcher when no patterns configured", () => {
    const { enabled, match } = getProtectedSourceMatcher(configWith(undefined));
    expect(enabled).toBe(false);
    expect(match("/abs/any.mdx")).toBe(false);
  });

  it("matches module ids registered under a covered route", () => {
    registerProtectedScope("/abs/admin.mdx", {
      type: "route",
      path: "/admin",
    });
    const { match } = getProtectedSourceMatcher(configWith(["/admin"]));
    expect(match("/abs/admin.mdx")).toBe(true);
  });

  it("strips query strings from module ids before lookup", () => {
    registerProtectedScope("/abs/admin.mdx", {
      type: "route",
      path: "/admin",
    });
    const { match } = getProtectedSourceMatcher(configWith(["/admin"]));
    expect(match("/abs/admin.mdx?v=123")).toBe(true);
  });

  it("returns false for unregistered module ids", () => {
    registerProtectedScope("/abs/admin.mdx", {
      type: "route",
      path: "/admin",
    });
    const { match } = getProtectedSourceMatcher(configWith(["/admin"]));
    expect(match("/abs/other.mdx")).toBe(false);
  });
});
