import type { Link, Root } from "mdast";
import { VFile } from "vfile";
import { describe, expect, it } from "vitest";
import { remarkLinkRewrite } from "./remark-link-rewrite.js";

const linkTree = (url: string): Root => ({
  type: "root",
  children: [
    {
      type: "paragraph",
      children: [{ type: "link", url, children: [] }],
    },
  ],
});

const rewrite = (
  url: string,
  {
    basePath = "",
    routesByFile = new Map<string, string>(),
    file = "/root/docs/articles/source.mdx",
  }: {
    basePath?: string;
    routesByFile?: Map<string, string>;
    file?: string;
  } = {},
) => {
  const tree = linkTree(url);
  remarkLinkRewrite(basePath, routesByFile)(tree, new VFile({ path: file }));
  return ((tree.children[0] as { children: Link[] }).children[0] as Link).url;
};

describe("remarkLinkRewrite", () => {
  const routes = new Map([
    ["/root/docs/articles/monetization/index", "/articles/monetization"],
    ["/root/docs/articles/monetization/plans", "/articles/monetization/plans"],
    ["/root/docs/articles/intro", "/articles/intro"],
    // An index file with no custom path keeps its `/index` route.
    ["/root/docs/articles/guides/index", "/articles/guides/index"],
  ]);

  it("collapses an index.mdx link to its custom route", () => {
    expect(rewrite("./monetization/index.mdx", { routesByFile: routes })).toBe(
      "/articles/monetization",
    );
  });

  it("resolves a sibling .mdx link to the real route", () => {
    expect(rewrite("./monetization/plans.mdx", { routesByFile: routes })).toBe(
      "/articles/monetization/plans",
    );
  });

  it("does not collapse an index link without a custom path", () => {
    expect(rewrite("./guides/index.mdx", { routesByFile: routes })).toBe(
      "/articles/guides/index",
    );
  });

  it("resolves a link that traverses up directories", () => {
    expect(
      rewrite("../intro.mdx", {
        routesByFile: routes,
        file: "/root/docs/articles/monetization/index.mdx",
      }),
    ).toBe("/articles/intro");
  });

  it("preserves a hash on a resolved markdown link", () => {
    expect(
      rewrite("./monetization/index.mdx#pricing", { routesByFile: routes }),
    ).toBe("/articles/monetization#pricing");
  });

  it("preserves a query string on a resolved markdown link", () => {
    expect(
      rewrite("./monetization/index.mdx?tab=plans", { routesByFile: routes }),
    ).toBe("/articles/monetization?tab=plans");
  });

  it("emits a basePath-free route (the router applies basename)", () => {
    expect(
      rewrite("./monetization/index.mdx", {
        basePath: "/docs",
        routesByFile: routes,
      }),
    ).toBe("/articles/monetization");
  });

  it("resolves a .md link to a route mapped from an .mdx file", () => {
    expect(rewrite("./monetization/plans.md", { routesByFile: routes })).toBe(
      "/articles/monetization/plans",
    );
  });

  it("resolves a relative link without a leading ./", () => {
    expect(rewrite("intro.mdx", { routesByFile: routes })).toBe(
      "/articles/intro",
    );
  });

  it("normalizes backslash paths before resolving", () => {
    expect(
      rewrite(".\\monetization\\index.mdx", { routesByFile: routes }),
    ).toBe("/articles/monetization");
  });

  it("does not resolve absolute .mdx links, only strips the extension", () => {
    expect(rewrite("/articles/intro.mdx", { routesByFile: routes })).toBe(
      "/articles/intro",
    );
  });

  it("falls back to extension stripping when the file is not in the route map", () => {
    expect(rewrite("./unknown.mdx", { routesByFile: routes })).toBe(
      "../unknown",
    );
  });

  it("strips the basePath on a fallback (unmapped) link", () => {
    expect(
      rewrite("/docs/other.mdx", { basePath: "/docs", routesByFile: routes }),
    ).toBe("/other");
  });

  it("leaves external links untouched", () => {
    expect(
      rewrite("https://example.com/page.mdx", { routesByFile: routes }),
    ).toBe("https://example.com/page.mdx");
  });

  it("leaves bare anchor links untouched", () => {
    expect(rewrite("#section", { routesByFile: routes })).toBe("#section");
  });
});
