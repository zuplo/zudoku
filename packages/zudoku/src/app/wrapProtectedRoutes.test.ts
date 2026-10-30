import type { RouteObject } from "react-router";
import { describe, expect, it } from "vitest";
import {
  wrapProtectedRoutes,
  wrapProtectedRoutesForRender,
} from "./wrapProtectedRoutes.js";

// Distinct lazy() references so we can assert by identity whether a route's
// chunk was preserved or replaced with the no-op stub.
const protectedLazy: RouteObject["lazy"] = async () => ({
  Component: () => null,
});
const publicLazy: RouteObject["lazy"] = async () => ({
  Component: () => null,
});

const makeRoutes = (): RouteObject[] => [
  { path: "introduction", lazy: protectedLazy },
  { path: "public", lazy: publicLazy },
];

describe("wrapProtectedRoutes", () => {
  it("stubs protected lazy routes when unauthenticated", () => {
    const wrapped = wrapProtectedRoutes(
      makeRoutes(),
      ["/introduction/*"],
      false,
    );
    expect(wrapped[0]?.lazy).not.toBe(protectedLazy);
    expect(wrapped[1]?.lazy).toBe(publicLazy);
  });

  it("preserves all routes when authenticated", () => {
    const wrapped = wrapProtectedRoutes(
      makeRoutes(),
      ["/introduction/*"],
      true,
    );
    expect(wrapped[0]?.lazy).toBe(protectedLazy);
    expect(wrapped[1]?.lazy).toBe(publicLazy);
  });

  it("returns routes unchanged when there are no protected patterns", () => {
    const routes = makeRoutes();
    expect(wrapProtectedRoutes(routes, undefined, false)).toBe(routes);
  });

  it("stub renders nothing so the gated chunk never loads", async () => {
    const wrapped = wrapProtectedRoutes(
      makeRoutes(),
      ["/introduction/*"],
      false,
    );
    const stubbed = wrapped[0];
    if (typeof stubbed?.lazy !== "function") {
      throw new Error("expected the protected route to keep a lazy()");
    }
    await expect(stubbed.lazy()).resolves.toEqual({ element: null });
  });
});

describe("wrapProtectedRoutesForRender", () => {
  // Regression for #2672: the search-index bypass pass must render the real
  // protected content (so Pagefind indexes it), so it keeps the lazy chunk
  // even when the request is unauthenticated.
  it("keeps protected content during a bypass render", () => {
    const wrapped = wrapProtectedRoutesForRender(
      makeRoutes(),
      ["/introduction/*"],
      { isAuthenticated: false, bypassProtection: true },
    );
    expect(wrapped[0]?.lazy).toBe(protectedLazy);
  });

  it("stubs protected content for an unauthenticated non-bypass render", () => {
    const wrapped = wrapProtectedRoutesForRender(
      makeRoutes(),
      ["/introduction/*"],
      { isAuthenticated: false, bypassProtection: false },
    );
    expect(wrapped[0]?.lazy).not.toBe(protectedLazy);
  });

  it("keeps protected content when authenticated", () => {
    const wrapped = wrapProtectedRoutesForRender(
      makeRoutes(),
      ["/introduction/*"],
      { isAuthenticated: true },
    );
    expect(wrapped[0]?.lazy).toBe(protectedLazy);
  });

  // SSR safety: a live SSR request never passes `bypassProtection`, so an
  // unauthenticated request must still be gated exactly as before — only the
  // internal search-index pass ever sets the flag. If this regressed,
  // protected content would leak to logged-out users during SSR.
  it("gates protected routes for an unauthenticated SSR request (flag omitted)", () => {
    const wrapped = wrapProtectedRoutesForRender(
      makeRoutes(),
      ["/introduction/*"],
      { isAuthenticated: false },
    );
    expect(wrapped[0]?.lazy).not.toBe(protectedLazy);
  });

  // A non-bypass render must behave identically to the original wrapper, so
  // the SSR request path is unchanged by this fix.
  it.each([false, true])(
    "matches wrapProtectedRoutes for a non-bypass render (authenticated=%s)",
    (isAuthenticated) => {
      const routes = makeRoutes();
      expect(
        wrapProtectedRoutesForRender(routes, ["/introduction/*"], {
          isAuthenticated,
        }),
      ).toEqual(
        wrapProtectedRoutes(routes, ["/introduction/*"], isAuthenticated),
      );
    },
  );
});
