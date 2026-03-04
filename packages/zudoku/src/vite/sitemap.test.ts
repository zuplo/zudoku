import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { getRedirectUrls } from "./prerender/prerender.js";
import type { WorkerResult } from "./prerender/prerender.js";
import { generateSitemap } from "./sitemap.js";

it("should exclude redirects from sitemap", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "zudoku-sitemap-test-"));

  await generateSitemap({
    basePath: undefined,
    outputUrls: ["/", "/documentation/introduction", "/api"],
    config: {
      siteUrl: "https://example.com",
    },
    baseOutputDir: tempDir,
    redirectUrls: new Set(["/"]),
  });

  const sitemapPath = path.join(tempDir, "sitemap.xml");
  const sitemap = await readFile(sitemapPath, "utf-8");

  expect(sitemap).not.toContain("<loc>https://example.com/</loc>");
  expect(sitemap).toContain("https://example.com/documentation/introduction");
  expect(sitemap).toContain("https://example.com/api");

  await rm(tempDir, { recursive: true, force: true });
});

it("should exclude redirects with basePath from sitemap", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "zudoku-sitemap-test-"));

  await generateSitemap({
    basePath: "/docs",
    outputUrls: ["/", "/introduction"],
    config: {
      siteUrl: "https://example.com",
    },
    baseOutputDir: tempDir,
    redirectUrls: new Set(["/"]),
  });

  const sitemapPath = path.join(tempDir, "sitemap.xml");
  const sitemap = await readFile(sitemapPath, "utf-8");

  expect(sitemap).not.toContain("https://example.com/docs/</loc>");
  expect(sitemap).toContain("https://example.com/docs/introduction");

  await rm(tempDir, { recursive: true, force: true });
});

it("getRedirectUrls strips basePath and normalizes trailing slash", () => {
  const workerResults: WorkerResult[] = [
    {
      outputPath: "/index.html",
      html: "",
      statusCode: 301,
      redirect: { from: "/docs/", to: "/docs/intro" },
    },
    {
      outputPath: "/index.html",
      html: "",
      statusCode: 301,
      redirect: { from: "/docs", to: "/docs/intro" },
    },
    {
      outputPath: "/intro.html",
      html: "",
      statusCode: 200,
    },
  ];

  const result = getRedirectUrls(workerResults, "/docs");
  expect(result).toEqual(new Set(["/"]));
});

it("getRedirectUrls works without basePath", () => {
  const workerResults: WorkerResult[] = [
    {
      outputPath: "/index.html",
      html: "",
      statusCode: 301,
      redirect: { from: "/old", to: "/new" },
    },
  ];

  const result = getRedirectUrls(workerResults, undefined);
  expect(result).toEqual(new Set(["/old"]));
});
