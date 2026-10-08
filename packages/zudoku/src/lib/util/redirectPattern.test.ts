import { matchRoutes } from "react-router";
import { describe, expect, it } from "vitest";
import { joinUrl } from "./joinUrl.js";
import {
  isDynamicRedirect,
  resolveRedirectTarget,
  sortByRouteRank,
  toBuildOutputRedirect,
} from "./redirectPattern.js";

describe("isDynamicRedirect", () => {
  it.each([
    ["/dashboard/*", true],
    ["/blog/:slug", true],
    ["/:lang?/docs", true],
    ["/dashboard", false],
    ["/", false],
    ["/a*b", false],
    ["/*/docs", false],
  ])("%s -> %s", (from, expected) => {
    expect(isDynamicRedirect({ from })).toBe(expected);
  });
});

describe("resolveRedirectTarget", () => {
  it("leaves static redirects untouched", () => {
    expect(resolveRedirectTarget({ from: "/old", to: "/new/*" }, {})).toBe(
      "/new/*",
    );
  });

  it("substitutes the splat into an external URL", () => {
    const redirect = {
      from: "/dashboard/*",
      to: "https://oauth.example.com/dashboard/*",
    };
    expect(resolveRedirectTarget(redirect, { "*": "apps/123" })).toBe(
      "https://oauth.example.com/dashboard/apps/123",
    );
    expect(resolveRedirectTarget(redirect, { "*": "" })).toBe(
      "https://oauth.example.com/dashboard",
    );
  });

  it("substitutes named params and keeps query and hash", () => {
    expect(
      resolveRedirectTarget(
        { from: "/blog/:year/:slug", to: "/posts/:slug/:year?ref=blog#top" },
        { year: "2026", slug: "warp-drives" },
      ),
    ).toBe("/posts/warp-drives/2026?ref=blog#top");
  });

  it("re-encodes decoded params", () => {
    expect(
      resolveRedirectTarget(
        { from: "/a/:id/*", to: "/b/:id/*" },
        { id: "x/y z", "*": "c d/e" },
      ),
    ).toBe("/b/x%2Fy%20z/c%20d/e");
  });

  it("drops a missing optional param", () => {
    expect(
      resolveRedirectTarget({ from: "/:lang?/old", to: "/:lang/new" }, {}),
    ).toBe("/new");
  });

  it("ignores tokens that are not defined in from", () => {
    expect(
      resolveRedirectTarget(
        { from: "/old/:id", to: "/new/:other/:id" },
        { id: "1" },
      ),
    ).toBe("/new/:other/1");
  });
});

describe("toBuildOutputRedirect", () => {
  it("converts a splat to a capture group", () => {
    expect(
      toBuildOutputRedirect({
        from: "/dashboard/*",
        to: "https://oauth.example.com/dashboard/*",
      }),
    ).toEqual({
      src: "^/dashboard(/.*)?$",
      location: "https://oauth.example.com/dashboard$1",
    });
  });

  it("numbers named params in from order and prefixes basePath", () => {
    expect(
      toBuildOutputRedirect(
        { from: "/v1.0/:year/:slug", to: "/posts/:slug/:year" },
        "/docs",
      ),
    ).toEqual({
      src: "^/docs/v1\\.0(/[^/]+)(/[^/]+)/?$",
      location: "/docs/posts$2$1",
    });
  });

  it("makes optional params optional", () => {
    expect(
      toBuildOutputRedirect({ from: "/:lang?/old", to: "/:lang/new" }),
    ).toEqual({ src: "^(/[^/]+)?/old/?$", location: "$1/new" });
  });

  it("does not prefix basePath to absolute targets", () => {
    expect(
      toBuildOutputRedirect(
        { from: "/old/*", to: "https://example.com/new/*" },
        "/docs",
      ),
    ).toEqual({
      src: "^/docs/old(/.*)?$",
      location: "https://example.com/new$1",
    });
  });
});

describe("sortByRouteRank", () => {
  const redirects = [
    { from: "/*", to: "/" },
    { from: "/docs/*", to: "/" },
    { from: "/docs/:slug", to: "/" },
    { from: "/docs/:section/:slug", to: "/" },
    { from: "/:lang?/docs/intro", to: "/" },
    { from: "/docs/:id", to: "/" },
  ];

  it("orders the most specific patterns first and keeps ties in order", () => {
    expect(sortByRouteRank(redirects).map(({ from }) => from)).toEqual([
      "/:lang?/docs/intro",
      "/docs/:section/:slug",
      "/docs/:slug",
      "/docs/:id",
      "/docs/*",
      "/*",
    ]);
  });

  it.each([
    "/docs",
    "/docs/intro",
    "/docs/a",
    "/docs/a/b",
    "/docs/a/b/c",
    "/en/docs/intro",
    "/other",
  ])(
    "first matching Build Output route for %s agrees with React Router",
    (path) => {
      const routerMatch = matchRoutes(
        redirects.map(({ from }) => ({ path: joinUrl(from) })),
        path,
      )?.at(-1)?.route.path;
      const outputMatch = sortByRouteRank(redirects).find(({ from }) =>
        new RegExp(toBuildOutputRedirect({ from, to: "/" }).src).test(path),
      )?.from;

      expect(outputMatch).toBe(routerMatch);
    },
  );
});
