import { describe, expect, it } from "vitest";
import {
  getMarkdownOutputPath,
  getMarkdownPathname,
  resolveMarkdownRoutePath,
} from "./plugin-markdown-export.js";

describe("getMarkdownOutputPath", () => {
  it("maps root route to index.md", () => {
    expect(getMarkdownOutputPath("/dist", "/")).toBe("/dist/index.md");
  });

  it("maps simple route to corresponding .md file", () => {
    expect(getMarkdownOutputPath("/dist", "/documentation")).toBe(
      "/dist/documentation.md",
    );
  });

  it("maps nested route to corresponding .md file", () => {
    expect(getMarkdownOutputPath("/dist", "/docs/getting-started")).toBe(
      "/dist/docs/getting-started.md",
    );
  });
});

describe("getMarkdownPathname", () => {
  it("converts root pathname to /index", () => {
    expect(getMarkdownPathname("/")).toBe("/index");
  });

  it("leaves non-root pathnames unchanged", () => {
    expect(getMarkdownPathname("/documentation")).toBe("/documentation");
    expect(getMarkdownPathname("/docs/guide")).toBe("/docs/guide");
  });
});

describe("resolveMarkdownRoutePath", () => {
  it("resolves /index.md back to root route /", () => {
    expect(resolveMarkdownRoutePath("/index.md", "/")).toBe("/");
  });

  it("resolves normal .md URLs to route paths", () => {
    expect(resolveMarkdownRoutePath("/documentation.md", "/")).toBe(
      "/documentation",
    );
  });

  it("resolves nested .md URLs to route paths", () => {
    expect(resolveMarkdownRoutePath("/docs/guide.md", "/")).toBe("/docs/guide");
  });

  it("strips basePath before resolving", () => {
    expect(resolveMarkdownRoutePath("/base/documentation.md", "/base")).toBe(
      "/documentation",
    );
    expect(resolveMarkdownRoutePath("/base/index.md", "/base")).toBe("/");
  });

  it("handles .mdx extension", () => {
    expect(resolveMarkdownRoutePath("/documentation.mdx", "/")).toBe(
      "/documentation",
    );
  });
});

describe("roundtrip: getMarkdownPathname → resolveMarkdownRoutePath", () => {
  const basePath = "/";

  it("roundtrips root path correctly", () => {
    const pathname = "/";
    const markdownUrl = `${getMarkdownPathname(pathname)}.md`;
    const resolved = resolveMarkdownRoutePath(markdownUrl, basePath);
    expect(resolved).toBe(pathname);
  });

  it("roundtrips normal path correctly", () => {
    const pathname = "/documentation";
    const markdownUrl = `${getMarkdownPathname(pathname)}.md`;
    const resolved = resolveMarkdownRoutePath(markdownUrl, basePath);
    expect(resolved).toBe(pathname);
  });

  it("roundtrips nested path correctly", () => {
    const pathname = "/docs/getting-started";
    const markdownUrl = `${getMarkdownPathname(pathname)}.md`;
    const resolved = resolveMarkdownRoutePath(markdownUrl, basePath);
    expect(resolved).toBe(pathname);
  });

  it("roundtrips path with custom route (issue #2269)", () => {
    // When file: "my-file" has path: "/", the browser pathname is "/"
    // The markdown URL should roundtrip back to "/" so the middleware
    // can find the file in the markdownFiles mapping
    const pathname = "/";
    const markdownUrl = `${getMarkdownPathname(pathname)}.md`;

    // URL should be /index.md, NOT /.md
    expect(markdownUrl).toBe("/index.md");

    const resolved = resolveMarkdownRoutePath(markdownUrl, basePath);
    expect(resolved).toBe("/");
  });
});
