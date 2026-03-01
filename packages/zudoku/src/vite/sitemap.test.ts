import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import type { WorkerResult } from "./prerender/prerender.js";
import { generateSitemap } from "./sitemap.js";

it("should exclude redirects from sitemap", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "zudoku-sitemap-test-"));

  // Mock worker results with a redirect
  const workerResults: WorkerResult[] = [
    {
      outputPath: "/home/test/index.html",
      html: "<html></html>",
      statusCode: 301,
      redirect: { from: "/", to: "/documentation/introduction" },
    },
    {
      outputPath: "/home/test/documentation/introduction.html",
      html: "<html></html>",
      statusCode: 200,
    },
    {
      outputPath: "/home/test/api.html",
      html: "<html></html>",
      statusCode: 200,
    },
  ];

  await generateSitemap({
    basePath: undefined,
    outputUrls: ["/", "/documentation/introduction", "/api"],
    config: {
      siteUrl: "https://example.com",
    },
    baseOutputDir: tempDir,
    workerResults,
  });

  const sitemapPath = path.join(tempDir, "sitemap.xml");
  const sitemap = await readFile(sitemapPath, "utf-8");

  // The sitemap should not include the redirect URL "/" (ends with just the domain)
  expect(sitemap).not.toContain("<loc>https://example.com/</loc>");
  // But should include the actual content pages
  expect(sitemap).toContain("https://example.com/documentation/introduction");
  expect(sitemap).toContain("https://example.com/api");

  // Clean up
  await rm(tempDir, { recursive: true, force: true });
});

it("should exclude redirects with basePath from sitemap", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "zudoku-sitemap-test-"));
  const basePath = "/docs";

  // Mock worker results with a redirect that includes basePath
  const workerResults: WorkerResult[] = [
    {
      outputPath: "/home/test/index.html",
      html: "<html></html>",
      statusCode: 301,
      redirect: { from: "/docs/", to: "/docs/introduction" },
    },
    {
      outputPath: "/home/test/introduction.html",
      html: "<html></html>",
      statusCode: 200,
    },
  ];

  await generateSitemap({
    basePath,
    outputUrls: ["/", "/introduction"],
    config: {
      siteUrl: "https://example.com",
    },
    baseOutputDir: tempDir,
    workerResults,
  });

  const sitemapPath = path.join(tempDir, "sitemap.xml");
  const sitemap = await readFile(sitemapPath, "utf-8");

  // The sitemap should not include the redirect URL "/"
  expect(sitemap).not.toContain("https://example.com/docs/</loc>");
  // But should include the actual content page
  expect(sitemap).toContain("https://example.com/docs/introduction");

  // Clean up
  await rm(tempDir, { recursive: true, force: true });
});
