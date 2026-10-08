import { matchRoutes } from "react-router";
import { describe, expect, it } from "vitest";
import { joinUrl } from "./joinUrl.js";
import {
  isDynamicRedirect,
  resolveRedirectTarget,
  toBuildOutputRedirects,
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

describe("toBuildOutputRedirects", () => {
  it("converts a splat to a capture group", () => {
    expect(
      toBuildOutputRedirects([
        { from: "/dashboard/*", to: "https://oauth.example.com/dashboard/*" },
      ]),
    ).toEqual([
      {
        src: "^/dashboard(/.*)?$",
        location: "https://oauth.example.com/dashboard$1",
      },
    ]);
  });

  it("numbers named params in from order and prefixes basePath", () => {
    expect(
      toBuildOutputRedirects(
        [{ from: "/v1.0/:year/:slug", to: "/posts/:slug/:year" }],
        "/docs",
      ),
    ).toEqual([
      {
        src: "^/docs/v1\\.0(/[^/]+)(/[^/]+)/?$",
        location: "/docs/posts$2$1",
      },
    ]);
  });

  it("expands optional params into one route per variant", () => {
    expect(
      toBuildOutputRedirects([{ from: "/:lang?/old", to: "/:lang/new" }]),
    ).toEqual([
      { src: "^(/[^/]+)/old/?$", location: "$1/new" },
      { src: "^/old/?$", location: "/new" },
    ]);
  });

  it("does not prefix basePath to absolute targets", () => {
    expect(
      toBuildOutputRedirects(
        [{ from: "/old/*", to: "https://example.com/new/*" }],
        "/docs",
      ),
    ).toEqual([
      { src: "^/docs/old(/.*)?$", location: "https://example.com/new$1" },
    ]);
  });

  // Simulates the platform: the first matching route wins and `$n` is replaced
  // with the capture group (empty when it didn't participate).
  const resolveWithBuildOutput = (
    redirects: { from: string; to: string }[],
    path: string,
  ) => {
    const route = toBuildOutputRedirects(redirects).find(({ src }) =>
      new RegExp(src).test(path),
    );
    return route && path.replace(new RegExp(route.src), route.location);
  };

  const resolveWithRouter = (
    redirects: { from: string; to: string }[],
    path: string,
  ) => {
    const match = matchRoutes(
      redirects.map((redirect) => ({ path: joinUrl(redirect.from), redirect })),
      path,
    )?.at(-1);
    return match && resolveRedirectTarget(match.route.redirect, match.params);
  };

  it.each([
    [
      [
        { from: "/*", to: "/catch-all/*" },
        { from: "/docs/*", to: "/docs-splat/*" },
        { from: "/docs/:slug", to: "/docs-slug/:slug" },
        { from: "/docs/:section/:slug", to: "/docs-two/:section/:slug" },
        { from: "/:lang?/docs/intro", to: "/intro/:lang" },
        { from: "/docs/:id", to: "/docs-id/:id" },
      ],
      [
        "/docs",
        "/docs/intro",
        "/docs/a",
        "/docs/a/b",
        "/docs/a/b/c",
        "/en/docs/intro",
        "/other",
      ],
    ],
    [
      [
        { from: "/:id", to: "/id/:id" },
        { from: "/:x?/:y?", to: "/xy/:x/:y" },
      ],
      ["/", "/one", "/one/two"],
    ],
    [
      [
        { from: "/:lang?/docs/:slug", to: "/lang/:lang/:slug" },
        { from: "/docs/:slug", to: "/plain/:slug" },
      ],
      ["/docs/a", "/en/docs/a"],
    ],
    [
      [
        { from: "/docs/:slug", to: "/plain/:slug" },
        { from: "/:lang?/docs/:slug", to: "/lang/:lang/:slug" },
      ],
      ["/docs/a", "/en/docs/a"],
    ],
    [[{ from: "/dup/:id/:id", to: "/dup/:id" }], ["/dup/a/b"]],
  ])("picks the same target as React Router for %j", (redirects, paths) => {
    for (const path of paths) {
      expect(resolveWithBuildOutput(redirects, path), path).toBe(
        resolveWithRouter(redirects, path),
      );
    }
  });
});
