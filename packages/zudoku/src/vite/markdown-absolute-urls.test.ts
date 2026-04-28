import { expect, it } from "vitest";
import {
  absolutizeMarkdownUrl,
  resolveMarkdownSiteOrigin,
  rewriteMarkdownLinksToAbsolute,
  toAbsoluteSiteUrl,
} from "./markdown-absolute-urls.js";

it("resolveMarkdownSiteOrigin prefers canonicalUrlOrigin over sitemap", () => {
  expect(
    resolveMarkdownSiteOrigin({
      canonicalUrlOrigin: "https://docs.example.com",
      sitemap: { siteUrl: "https://wrong.example.com" },
    }),
  ).toBe("https://docs.example.com");
});

it("resolveMarkdownSiteOrigin falls back to sitemap.siteUrl", () => {
  expect(
    resolveMarkdownSiteOrigin({
      sitemap: { siteUrl: "https://example.com/" },
    }),
  ).toBe("https://example.com");
});

it("toAbsoluteSiteUrl joins basePath", () => {
  expect(toAbsoluteSiteUrl("https://example.com", "/docs", "/page.md")).toBe(
    "https://example.com/docs/page.md",
  );
});

it("absolutizeMarkdownUrl resolves relative links against the page path", () => {
  expect(
    absolutizeMarkdownUrl(
      "./other.md",
      "/guides/intro",
      "/docs",
      "https://ex.com",
    ),
  ).toBe("https://ex.com/docs/guides/other.md");
});

it("rewriteMarkdownLinksToAbsolute leaves fenced code unchanged", () => {
  const input = "See [a](b.md)\n\n```md\n[c](d.md)\n```\n";
  const out = rewriteMarkdownLinksToAbsolute(input, {
    origin: "https://ex.com",
    basePath: "/docs",
    routePath: "/page",
  });
  expect(out).toContain("https://ex.com/docs/b.md");
  expect(out).toContain("[c](d.md)");
});

it("absolutizeMarkdownUrl expands hash-only links to the current page", () => {
  expect(
    absolutizeMarkdownUrl("#section", "/about", "/docs", "https://ex.com"),
  ).toBe("https://ex.com/docs/about#section");
});
