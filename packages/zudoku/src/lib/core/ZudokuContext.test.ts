/**
 * @vitest-environment happy-dom
 */

import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { useAuthState } from "../authentication/state.js";
import { ZudokuContext } from "./ZudokuContext.js";

// Plugin getNavigation can load sensitive resources. If unauthenticated users access protected routes,
// plugins shouldn't run to avoid leaking data.

describe("ZudokuContext.getPluginNavigation", () => {
  const setAuth = (isAuthenticated: boolean) => {
    useAuthState.setState({
      isAuthenticated,
      isPending: false,
      profile: isAuthenticated
        ? {
            sub: "u",
            email: "u@example.com",
            emailVerified: true,
            name: "u",
            pictureUrl: undefined,
          }
        : null,
    });
  };

  const buildContext = (
    protectedRoutes: Record<string, () => true>,
    opts: { ssrAuthed?: boolean } = {},
  ) => {
    const getNavigation = vi.fn(async () => [
      { type: "doc" as const, file: "leak", label: "leak", path: "/leak" },
    ]);
    const navigationPlugin = { getRoutes: () => [], getNavigation };
    const ssrAuth = opts.ssrAuthed
      ? {
          profile: {
            sub: "u",
            email: "u@example.com",
            emailVerified: true,
            name: "u",
            pictureUrl: undefined,
          },
        }
      : undefined;
    const ctx = new ZudokuContext(
      { protectedRoutes, plugins: [navigationPlugin] },
      new QueryClient(),
      {},
      ssrAuth,
    );
    return { ctx, getNavigation };
  };

  it("invokes plugins normally on a public path", async () => {
    setAuth(false);
    const { ctx, getNavigation } = buildContext({ "/protected/*": () => true });
    const result = await ctx.getPluginNavigation("/public");
    expect(getNavigation).toHaveBeenCalledOnce();
    expect(result).toHaveLength(1);
  });

  it("invokes plugins on a protected path when authenticated", async () => {
    setAuth(true);
    const { ctx, getNavigation } = buildContext({ "/protected/*": () => true });
    const result = await ctx.getPluginNavigation("/protected/page");
    expect(getNavigation).toHaveBeenCalledOnce();
    expect(result).toHaveLength(1);
  });

  it("does NOT invoke plugins on a protected path when unauthenticated", async () => {
    setAuth(false);
    const { ctx, getNavigation } = buildContext({ "/protected/*": () => true });
    const result = await ctx.getPluginNavigation("/protected/page");
    expect(getNavigation).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("matches nested protected paths", async () => {
    setAuth(false);
    const { ctx, getNavigation } = buildContext({ "/catalog/*": () => true });
    await ctx.getPluginNavigation("/catalog/RetailV2019/autotasks");
    expect(getNavigation).not.toHaveBeenCalled();
  });

  // On the server, SSR auth must come from ssrAuth, since zustand state isn't available.
  // This prevents mismatches between SSR and client nav rendering.
  it("uses ssrAuth on the server path", async () => {
    setAuth(false);
    const realWindow = globalThis.window;
    // @ts-expect-error - simulating server
    delete globalThis.window;
    try {
      const { ctx, getNavigation } = buildContext(
        { "/protected/*": () => true },
        { ssrAuthed: true },
      );
      await ctx.getPluginNavigation("/protected/page");
      expect(getNavigation).toHaveBeenCalledOnce();
    } finally {
      globalThis.window = realWindow;
    }
  });
});
