import type { RouteObject } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * @vitest-environment happy-dom
 */

const { warnInlineProtectedRoutes, wrapProtectedRoutes } =
  await import("./wrapProtectedRoutes.js");

const lazy = () => Promise.resolve({ element: <div>real</div> });
const buildRoutes = (): RouteObject[] => [
  { path: "/protected", lazy },
  {
    path: "/admin",
    children: [{ path: "users", lazy }],
  },
  { path: "/public", lazy },
];

const invokeLazy = async (route: RouteObject | null | undefined) => {
  if (route == null) {
    throw new Error("expected route");
  }
  if (typeof route.lazy !== "function") {
    throw new Error("expected lazy to be a function in this test");
  }
  return route.lazy();
};

describe("wrapProtectedRoutes", () => {
  it("returns routes untouched when no protected patterns configured", () => {
    const routes = buildRoutes();
    expect(wrapProtectedRoutes(routes, undefined, false)).toBe(routes);
    expect(wrapProtectedRoutes(routes, [], false)).toBe(routes);
  });

  it("returns routes untouched when user is authenticated", () => {
    const routes = buildRoutes();
    expect(wrapProtectedRoutes(routes, ["/protected"], true)).toBe(routes);
  });

  it("only stubs matching routes, leaving public routes intact", async () => {
    const routes = buildRoutes();
    const wrapped = wrapProtectedRoutes(routes, ["/protected"], false);

    expect(await invokeLazy(wrapped[0])).toEqual({ element: null });
    // public route keeps its real lazy
    expect(await invokeLazy(wrapped[2])).toEqual({ element: <div>real</div> });
  });

  it("never calls the original lazy for the stubbed route", async () => {
    const originalLazy = vi.fn(lazy);
    const routes: RouteObject[] = [{ path: "/protected", lazy: originalLazy }];
    const wrapped = wrapProtectedRoutes(routes, ["/protected"], false);
    await invokeLazy(wrapped[0]);
    expect(originalLazy).not.toHaveBeenCalled();
  });

  it("walks nested children using splat patterns", async () => {
    const routes = buildRoutes();
    const wrapped = wrapProtectedRoutes(routes, ["/admin/*"], false);

    expect(await invokeLazy(wrapped[1]?.children?.[0])).toEqual({
      element: null,
    });
  });

  it("exact pattern does not match descendants (end: true semantics)", async () => {
    const routes: RouteObject[] = [
      {
        path: "/admin",
        lazy,
        children: [{ path: "users", lazy }],
      },
    ];
    const wrapped = wrapProtectedRoutes(routes, ["/admin"], false);

    expect(await invokeLazy(wrapped[0])).toEqual({ element: null });
    expect(await invokeLazy(wrapped[0]?.children?.[0])).toEqual({
      element: <div>real</div>,
    });
  });

  it("applies basePath when matching routes against patterns", async () => {
    const routes: RouteObject[] = [{ path: "/docs/protected", lazy }];
    const wrapped = wrapProtectedRoutes(routes, ["/protected"], false, "/docs");

    expect(await invokeLazy(wrapped[0])).toEqual({ element: null });
  });

  it("accepts the object-form protectedRoutes config", async () => {
    const routes = buildRoutes();
    const wrapped = wrapProtectedRoutes(
      routes,
      { "/protected": () => false },
      false,
    );

    expect(await invokeLazy(wrapped[0])).toEqual({ element: null });
  });
});

describe("warnInlineProtectedRoutes", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => warn.mockClear());

  it("warns for a protected route served by inline element", () => {
    const routes: RouteObject[] = [
      { path: "/secret", element: <div>inline</div> },
    ];
    warnInlineProtectedRoutes(routes, ["/secret"]);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain(`"/secret"`);
  });

  it("is silent when the route has lazy (code-split)", () => {
    const routes: RouteObject[] = [
      { path: "/secret", lazy: () => Promise.resolve({}) },
    ];
    warnInlineProtectedRoutes(routes, ["/secret"]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("is silent when no protected patterns are configured", () => {
    const routes: RouteObject[] = [
      { path: "/secret", element: <div>inline</div> },
    ];
    warnInlineProtectedRoutes(routes, undefined);
    expect(warn).not.toHaveBeenCalled();
  });

  it("is silent for inline routes that don't match any pattern", () => {
    const routes: RouteObject[] = [
      { path: "/public", element: <div>inline</div> },
    ];
    warnInlineProtectedRoutes(routes, ["/secret"]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("applies basePath to patterns when matching", () => {
    const routes: RouteObject[] = [
      { path: "/docs/secret", element: <div>inline</div> },
    ];
    warnInlineProtectedRoutes(routes, ["/secret"], "/docs");
    expect(warn).toHaveBeenCalledOnce();
  });

  it("walks children recursively", () => {
    const routes: RouteObject[] = [
      {
        path: "/parent",
        children: [{ path: "secret", element: <div>inline</div> }],
      },
    ];
    warnInlineProtectedRoutes(routes, ["/parent/secret"]);
    expect(warn).toHaveBeenCalledOnce();
  });
});
