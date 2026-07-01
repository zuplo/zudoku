import type { RouteObject } from "react-router";
import { describe, expect, it } from "vitest";
import {
  routesToPaths,
  routesToRewrites,
  selectPagesToIndex,
} from "./utils.js";

describe("routesToPaths", () => {
  it("returns paths for simple routes", () => {
    const routes: RouteObject[] = [{ path: "about" }, { path: "contact" }];
    expect(routesToPaths(routes)).toEqual(["/about", "/contact"]);
  });

  it("handles nested routes", () => {
    const routes: RouteObject[] = [
      {
        path: "docs",
        children: [{ path: "intro" }, { path: "getting-started" }],
      },
    ];
    expect(routesToPaths(routes)).toEqual([
      "/docs",
      "/docs/intro",
      "/docs/getting-started",
    ]);
  });

  it("skips routes with required dynamic params", () => {
    const routes: RouteObject[] = [
      { path: ":id" },
      { path: "users/:userId" },
      { path: "about" },
    ];
    expect(routesToPaths(routes)).toEqual(["/about"]);
  });

  it("strips optional params from path", () => {
    const routes: RouteObject[] = [{ path: "docs/:version?" }];
    expect(routesToPaths(routes)).toEqual(["/docs"]);
  });

  it("skips wildcard routes", () => {
    const routes: RouteObject[] = [
      { path: "*" },
      { path: "docs/*" },
      { path: "about" },
    ];
    expect(routesToPaths(routes)).toEqual(["/about"]);
  });

  it("skips numeric-only paths (error pages)", () => {
    const routes: RouteObject[] = [
      { path: "404" },
      { path: "500" },
      { path: "about" },
    ];
    expect(routesToPaths(routes)).toEqual(["/about"]);
  });

  it("handles absolute paths in children", () => {
    const routes: RouteObject[] = [
      {
        path: "docs",
        children: [{ path: "/standalone" }],
      },
    ];
    expect(routesToPaths(routes)).toEqual(["/docs", "/standalone"]);
  });

  it("handles layout routes without path", () => {
    const routes: RouteObject[] = [
      {
        children: [{ path: "about" }, { path: "contact" }],
      },
    ];
    expect(routesToPaths(routes)).toEqual(["/about", "/contact"]);
  });

  it("returns empty for empty input", () => {
    expect(routesToPaths([])).toEqual([]);
  });
});

describe("routesToRewrites", () => {
  it("generates rewrites for routes with optional params", () => {
    const routes: RouteObject[] = [
      { path: "subscriptions/:subscriptionId?" },
      { path: "checkout/:planId?" },
    ];
    expect(routesToRewrites(routes)).toEqual([
      { source: "/subscriptions/(.+)", destination: "/subscriptions.html" },
      { source: "/checkout/(.+)", destination: "/checkout.html" },
    ]);
  });

  it("returns empty for static routes", () => {
    const routes: RouteObject[] = [{ path: "about" }, { path: "contact" }];
    expect(routesToRewrites(routes)).toEqual([]);
  });

  it("returns empty for routes with required params", () => {
    const routes: RouteObject[] = [{ path: "users/:id" }];
    expect(routesToRewrites(routes)).toEqual([]);
  });

  it("handles nested routes with optional params", () => {
    const routes: RouteObject[] = [
      {
        children: [
          { path: "/checkout/:planId?" },
          { path: "/checkout-confirm" },
          { path: "/subscriptions/:subscriptionId?" },
        ],
      },
    ];
    expect(routesToRewrites(routes)).toEqual([
      { source: "/checkout/(.+)", destination: "/checkout.html" },
      { source: "/subscriptions/(.+)", destination: "/subscriptions.html" },
    ]);
  });

  it("returns empty for empty input", () => {
    expect(routesToRewrites([])).toEqual([]);
  });
});

describe("selectPagesToIndex", () => {
  it("indexes successful pages", () => {
    const pages = [
      { indexStatusCode: 200, html: "<p>home</p>" },
      { indexStatusCode: 200, html: "<p>about</p>" },
    ];
    const { include, exclude } = selectPagesToIndex(pages, ["/", "/about"]);
    expect(include).toEqual([
      { url: "/", html: "<p>home</p>" },
      { url: "/about", html: "<p>about</p>" },
    ]);
    expect(exclude).toEqual([]);
  });

  // Regression for #2672: a protected route's static file is the 401 sign-in
  // page, but its indexed HTML comes from the 200 bypass render. It must be
  // indexed, keyed on `indexStatusCode` (200), not the page status (401).
  it("indexes protected routes via their bypass-render status", () => {
    const pages = [
      { indexStatusCode: 200, html: "<p>public</p>" },
      { indexStatusCode: 200, html: "<p>protected content</p>" },
    ];
    const { include } = selectPagesToIndex(pages, [
      "/public",
      "/introduction/secret",
    ]);
    expect(include).toEqual([
      { url: "/public", html: "<p>public</p>" },
      { url: "/introduction/secret", html: "<p>protected content</p>" },
    ]);
  });

  // A protected route whose bypass render failed (e.g. a check returning
  // FORBIDDEN) must not vanish from the index silently — it's reported so the
  // build can warn about it, which is the whole point of #2672.
  it("excludes pages whose indexed render failed (4xx/5xx) and reports them", () => {
    const pages = [
      { indexStatusCode: 200, html: "<p>ok</p>" },
      { indexStatusCode: 404, html: "<p>not found</p>" },
      { indexStatusCode: 500, html: "<p>error</p>" },
    ];
    const { include, exclude } = selectPagesToIndex(pages, [
      "/ok",
      "/missing",
      "/boom",
    ]);
    expect(include).toEqual([{ url: "/ok", html: "<p>ok</p>" }]);
    expect(exclude).toEqual([
      { url: "/missing", status: 404 },
      { url: "/boom", status: 500 },
    ]);
  });

  it("skips entries without a matching path", () => {
    const pages = [{ indexStatusCode: 200, html: "<p>orphan</p>" }];
    expect(selectPagesToIndex(pages, [])).toEqual({ include: [], exclude: [] });
  });
});
