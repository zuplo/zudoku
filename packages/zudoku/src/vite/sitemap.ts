import { createWriteStream, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import { SitemapStream } from "sitemap";
import type { ZudokuSiteMapConfig } from "../config/validators/validate.js";
import { joinUrl } from "../lib/util/joinUrl.js";

export async function generateSitemap({
  outputUrls,
  basePath,
  baseOutputDir,
  config,
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
}) {
  if (!config) {
    return;
  }

  const sitemap = new SitemapStream({ hostname: config.siteUrl });

  const outputDir = path.resolve(baseOutputDir, config.outDir ?? "");

  // Ensure the output directory exists
  if (!existsSync(outputDir) === false) {
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

  for (const url of outputUrls) {
    const shouldExclude =
      exclude.includes(url) || url.includes("*") || /(400|404|500)$/.test(url);

    if (shouldExclude) continue;

    sitemap.write({
      url: new URL(joinUrl(basePath, url), config.siteUrl).toString(),
      lastmod,
      changefreq: config.changefreq ?? "daily",
      priority: config.priority ?? 0.7,
    });
  }

  sitemap.end();

  // biome-ignore lint/suspicious/noConsole: Logging allowed here
  console.debug(
    colors.blue(`✓ wrote sitemap to ${colors.bold(sitemapOutputPath)}`),
  );
}
