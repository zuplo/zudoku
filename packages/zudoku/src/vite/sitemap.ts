import { createWriteStream, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import { SitemapStream } from "sitemap";
import type { ZudokuSiteMapConfig } from "../config/validators/validate.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import type { WorkerResult } from "./prerender/prerender.js";

export async function generateSitemap({
  outputUrls,
  basePath,
  baseOutputDir,
  config,
  workerResults,
}: {
  /**
   * The base path of the site (e.g. `/docs`).
   */
  basePath: string | undefined;
  /**
   * The URLs of generated pages
   */
  outputUrls: string[];
  /**
   * The base output directory
   */
  baseOutputDir: string;
  /**
   * The site map configuration
   */
  config: ZudokuSiteMapConfig;
  /**
   * The worker results from prerendering (used to filter redirects)
   */
  workerResults: WorkerResult[];
}) {
  if (!config) {
    return;
  }

  const sitemap = new SitemapStream({ hostname: config.siteUrl });

  const outputDir = path.resolve(baseOutputDir, config.outDir ?? "");

  // Ensure the output directory exists
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const sitemapOutputPath = path.join(outputDir, "sitemap.xml");

  const writeStream = createWriteStream(sitemapOutputPath);
  sitemap.pipe(writeStream);

  let lastmod: string | undefined;
  if (config.autoLastmod !== false) {
    lastmod = new Date().toISOString();
  }

  const exclude =
    (typeof config.exclude === "function"
      ? await config.exclude()
      : config.exclude) ?? [];

  // Filter out redirects from the sitemap
  const redirectUrls = new Set(
    workerResults
      .filter((result) => result.redirect)
      .map((result) => {
        const redirect = result.redirect;
        if (!redirect) return "";
        return redirect.from.replace(basePath ?? "", "");
      }),
  );

  for (const url of outputUrls) {
    const shouldExclude =
      exclude.includes(url) ||
      url.includes("*") ||
      /(400|404|500)$/.test(url) ||
      redirectUrls.has(url);

    if (shouldExclude) continue;

    sitemap.write({
      url: new URL(joinUrl(basePath, url), config.siteUrl).toString(),
      lastmod,
      changefreq: config.changefreq ?? "daily",
      priority: config.priority ?? 0.7,
    });
  }

  sitemap.end();

  // Wait for the write stream to finish
  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  // biome-ignore lint/suspicious/noConsole: Logging allowed here
  console.debug(
    colors.blue(`✓ wrote sitemap to ${colors.bold(sitemapOutputPath)}`),
  );
}
