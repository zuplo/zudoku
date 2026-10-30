import { describe, expect, it } from "vitest";
import {
  appendLinkHeader,
  encodeDocumentationRoutePath,
  getMarkdownAlternateLink,
  getMarkdownNotFound,
  getMarkdownRepresentationPath,
  resolveDocumentationRoutePath,
} from "./markdown-representation.js";

describe("appendLinkHeader", () => {
  it("preserves existing Link values when adding an alternate", () => {
    expect(
      appendLinkHeader(
        ['</assets/app.js>; rel="preload"', '</canonical>; rel="canonical"'],
        '</guide.md>; rel="alternate"; type="text/markdown"',
      ),
    ).toBe(
      '</assets/app.js>; rel="preload", </canonical>; rel="canonical", </guide.md>; rel="alternate"; type="text/markdown"',
    );
  });
});

describe("resolveDocumentationRoutePath", () => {
  it.each([
    ["https://example.com/", undefined, "/"],
    ["https://example.com/guides/start", undefined, "/guides/start"],
    ["https://example.com/docs", "/docs", "/"],
    ["https://example.com/docs/", "/docs", "/"],
    ["https://example.com/docs/guides/start/", "/docs", "/guides/start"],
  ])("resolves %s within %s", (url, basePath, expected) => {
    expect(resolveDocumentationRoutePath(url, basePath)).toBe(expected);
  });

  it("rejects paths outside the configured base path", () => {
    expect(
      resolveDocumentationRoutePath("https://example.com/reference", "/docs"),
    ).toBeUndefined();
  });

  it.each([
    ["/hello world", "/hello%20world"],
    ["/guides/café", "/guides/caf%C3%A9"],
    ["/hello%20world", "/hello%20world"],
    ["/guide#intro", "/guide%23intro"],
    ["/guide?mode", "/guide%3Fmode"],
    ["/100%", "/100%25"],
    ["/guide%23intro", "/guide%23intro"],
  ])("URL-encodes route path %s", (routePath, expected) => {
    expect(encodeDocumentationRoutePath(routePath)).toBe(expected);
  });
});

describe("getMarkdownRepresentationPath", () => {
  it("uses index.md for the documentation root", () => {
    expect(getMarkdownRepresentationPath("/", "/docs")).toBe("/docs/index.md");
  });

  it("appends .md to nested routes", () => {
    expect(getMarkdownRepresentationPath("/guides/start", "/docs")).toBe(
      "/docs/guides/start.md",
    );
  });

  it("formats an alternate Link value", () => {
    expect(getMarkdownAlternateLink("/guides/start", "/docs")).toBe(
      '</docs/guides/start.md>; rel="alternate"; type="text/markdown"',
    );
  });

  it("URL-encodes alternate Markdown links", () => {
    expect(getMarkdownAlternateLink("/guides/café au lait", "/docs")).toBe(
      '</docs/guides/caf%C3%A9%20au%20lait.md>; rel="alternate"; type="text/markdown"',
    );
  });
});

describe("getMarkdownNotFound", () => {
  it("only links to machine-readable files that are configured", () => {
    const body = getMarkdownNotFound({
      basePath: "/docs",
      includeLlmsTxt: true,
      markdownRoutePaths: ["/"],
      sitemapOutDir: "meta",
    });

    expect(body).toContain("# Page not found");
    expect(body).toContain("[Documentation home](/docs)");
    expect(body).toContain("[Markdown documentation index](/docs/index.md)");
    expect(body).toContain("[Agent documentation index](/docs/llms.txt)");
    expect(body).toContain("[Sitemap](/docs/meta/sitemap.xml)");
  });

  it("does not advertise absent llms.txt or sitemap files", () => {
    const body = getMarkdownNotFound({
      includeLlmsTxt: false,
      markdownRoutePaths: [],
    });

    expect(body).not.toContain("index.md");
    expect(body).not.toContain("llms.txt");
    expect(body).not.toContain("sitemap.xml");
  });

  it("links the first real Markdown route when the homepage is custom", () => {
    const body = getMarkdownNotFound({
      basePath: "/docs",
      includeLlmsTxt: false,
      markdownRoutePaths: ["/quickstart", "/reference"],
    });

    expect(body).toContain(
      "[Markdown documentation index](/docs/quickstart.md)",
    );
    expect(body).not.toContain("/docs/index.md");
  });
});
